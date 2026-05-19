'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BrandReport, SearchResult, BrandAnalysis } from '@/types';

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

function buildSteps(brands: string[]): ProgressStep[] {
  const steps: ProgressStep[] = [];
  for (const b of brands) {
    steps.push(
      { id: `search-${b}`, label: `Searching web for ${b}…`, status: 'pending' },
      { id: `read-${b}`, label: `Reading sources for ${b}…`, status: 'pending' },
      { id: `score-${b}`, label: `Scoring themes for ${b}…`, status: 'pending' },
      { id: `build-${b}`, label: `Building report for ${b}…`, status: 'pending' },
    );
  }
  return steps;
}

async function runSearch(brand: string, industry?: string): Promise<SearchResult> {
  const res = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brand, industry }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Search failed');
  }
  return res.json();
}

async function runAnalyze(
  brand: string,
  industry: string | undefined,
  searchResult: SearchResult,
  onDelta: (text: string) => void,
): Promise<BrandReport> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brand, industry, searchResult }),
  });
  if (!res.ok) throw new Error('Analyze request failed');

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let report: BrandReport | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (!payload) continue;
      try {
        const msg = JSON.parse(payload);
        if (msg.type === 'delta') onDelta(msg.text);
        if (msg.type === 'done') report = msg.report;
        if (msg.type === 'error') throw new Error(msg.message);
      } catch {
        // ignore partial chunk parse errors
      }
    }
  }

  if (!report) throw new Error('No report received from analysis');
  return report;
}

export default function HomePage() {
  const router = useRouter();

  const [brand, setBrand] = useState('');
  const [industry, setIndustry] = useState('');
  const [showCompetitors, setShowCompetitors] = useState(false);
  const [competitors, setCompetitors] = useState(['', '', '']);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [retryMsg, setRetryMsg] = useState('');
  const [error, setError] = useState('');
  const [streamPreview, setStreamPreview] = useState('');

  const filledCompetitors = competitors.filter((c) => c.trim());
  const allBrands = [brand.trim(), ...filledCompetitors.map((c) => c.trim())].filter(Boolean);

  function setStep(id: string, status: ProgressStep['status']) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  }

  async function runForBrand(b: string, ind: string | undefined): Promise<BrandAnalysis> {
    setStep(`search-${b}`, 'active');

    let searchResult: SearchResult | null = null;

    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        searchResult = await runSearch(b, ind);
        break;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '';
        const isRate = msg.includes('429') || msg.toLowerCase().includes('rate limit');
        if (!isRate || attempt === 2) throw e;
        const sec = attempt === 0 ? 20 : 40;
        setRetryMsg(`Rate limit reached — retrying in ${sec}s… (attempt ${attempt + 1}/3)`);
        await new Promise((r) => setTimeout(r, sec * 1000));
        setRetryMsg('');
      }
    }

    setStep(`search-${b}`, 'done');
    setStep(`read-${b}`, 'active');
    await new Promise((r) => setTimeout(r, 300));
    setStep(`read-${b}`, 'done');
    setStep(`score-${b}`, 'active');

    let report: BrandReport | null = null;

    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        report = await runAnalyze(b, ind, searchResult!, (delta) => {
          setStreamPreview((prev) => (prev + delta).slice(-300));
        });
        break;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '';
        const isRate = msg.includes('429') || msg.toLowerCase().includes('rate limit');
        if (!isRate || attempt === 2) throw e;
        const sec = attempt === 0 ? 20 : 40;
        setRetryMsg(`Rate limit reached — retrying in ${sec}s… (attempt ${attempt + 1}/3)`);
        await new Promise((r) => setTimeout(r, sec * 1000));
        setRetryMsg('');
      }
    }

    setStep(`score-${b}`, 'done');
    setStep(`build-${b}`, 'active');
    await new Promise((r) => setTimeout(r, 200));
    setStep(`build-${b}`, 'done');

    return { brand: b, industry: ind, report: report! };
  }

  async function handleAnalyze() {
    if (!brand.trim()) return;
    setError('');
    setStreamPreview('');
    setRetryMsg('');

    const brands = allBrands;
    setSteps(buildSteps(brands));
    setRunning(true);

    try {
      const results: BrandAnalysis[] = [];
      for (const b of brands) {
        const ind = b === brand.trim() ? industry || undefined : undefined;
        const result = await runForBrand(b, ind);
        results.push(result);
      }

      const [primary, ...competitorResults] = results;
      const payload = { primary, competitors: competitorResults, teamRecs: [] };
      sessionStorage.setItem('analysisData', JSON.stringify(payload));
      router.push('/report');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Analysis failed';
      setError(msg);
      setRunning(false);
    }
  }

  const totalSteps = steps.length;
  const doneCount = steps.filter((s) => s.status === 'done').length;
  const progress = totalSteps ? Math.round((doneCount / totalSteps) * 100) : 0;
  const activeStep = steps.find((s) => s.status === 'active');

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 mb-4">
            <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Brand Perception Analyzer</h1>
          <p className="mt-2 text-text-secondary">Get a full intelligence report on any brand in seconds.</p>
        </div>

        {!running ? (
          <div className="bg-brand-card rounded-2xl border border-brand-border shadow-sm p-8">
            <div className="mb-5">
              <label className="block text-sm font-semibold text-text-primary mb-1.5">
                Brand Name <span className="text-negative">*</span>
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                placeholder="e.g. Nike, Apple, Patagonia"
                className="w-full border border-brand-border rounded-xl px-4 py-3 text-text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-primary transition"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-primary mb-1.5">
                Industry <span className="text-muted font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Athletic Apparel, Consumer Tech"
                className="w-full border border-brand-border rounded-xl px-4 py-3 text-text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-primary transition"
              />
            </div>

            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowCompetitors((v) => !v)}
                className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-indigo-700 transition"
              >
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded border-2 border-primary transition ${showCompetitors ? 'bg-primary' : 'bg-white'}`}>
                  {showCompetitors && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                Add Competitor Comparison (up to 3)
              </button>

              {showCompetitors && (
                <div className="mt-3 space-y-3">
                  {[0, 1, 2].map((i) => (
                    <input
                      key={i}
                      type="text"
                      value={competitors[i]}
                      onChange={(e) => {
                        const next = [...competitors];
                        next[i] = e.target.value;
                        setCompetitors(next);
                      }}
                      placeholder={`Competitor ${i + 1} brand name`}
                      className="w-full border border-brand-border rounded-xl px-4 py-3 text-text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-primary transition text-sm"
                    />
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-negative">
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!brand.trim()}
              className="w-full bg-primary hover:bg-indigo-700 disabled:bg-muted disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3.5 transition text-base shadow-sm"
            >
              Analyze Brand
            </button>
          </div>
        ) : (
          <div className="bg-brand-card rounded-2xl border border-brand-border shadow-sm p-8">
            <h2 className="text-lg font-bold text-text-primary mb-1">
              Analyzing {brand}
              {filledCompetitors.length > 0 && ` + ${filledCompetitors.length} competitor${filledCompetitors.length > 1 ? 's' : ''}`}…
            </h2>
            <p className="text-sm text-text-secondary mb-5">This may take 30–60 seconds per brand.</p>

            <div className="w-full bg-brand-border rounded-full h-2 mb-2">
              <div
                className="h-2 bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted mb-5">
              <span>{activeStep?.label ?? 'Preparing…'}</span>
              <span>{progress}%</span>
            </div>

            {retryMsg && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
                {retryMsg}
              </div>
            )}

            <div className="space-y-2.5">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    {step.status === 'done' && (
                      <svg className="w-5 h-5 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {step.status === 'active' && (
                      <svg className="w-5 h-5 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {step.status === 'pending' && (
                      <span className="w-4 h-4 rounded-full border-2 border-brand-border inline-block" />
                    )}
                    {step.status === 'error' && (
                      <svg className="w-5 h-5 text-negative" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </span>
                  <span className={`text-sm ${
                    step.status === 'active' ? 'text-text-primary font-semibold' :
                    step.status === 'done' ? 'text-muted line-through' :
                    'text-muted'
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {streamPreview && (
              <div className="mt-5 p-3 bg-brand-bg rounded-lg border border-brand-border">
                <p className="text-xs text-muted font-mono leading-relaxed break-all">{streamPreview}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
