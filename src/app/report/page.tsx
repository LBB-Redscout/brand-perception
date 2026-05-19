'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AnalysisState, TeamArea, TeamRecsResult } from '@/types';
import OverviewTab from '@/components/tabs/OverviewTab';
import AudienceTab from '@/components/tabs/AudienceTab';
import SocialTab from '@/components/tabs/SocialTab';
import RecommendationsTab from '@/components/tabs/RecommendationsTab';
import CompareTab from '@/components/tabs/CompareTab';
import { exportToPDF } from '@/lib/exportPdf';

const TABS = ['Overview', 'Audience', 'Social', 'Recommendations', 'Compare'] as const;
type Tab = (typeof TABS)[number];

export default function ReportPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalysisState | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamAreas, setTeamAreas] = useState<TeamArea[]>([{ team: '', question: '' }]);
  const [generatingTeamRecs, setGeneratingTeamRecs] = useState(false);
  const [teamRecs, setTeamRecs] = useState<TeamRecsResult[]>([]);
  const [teamRecsError, setTeamRecsError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('analysisData');
    if (!raw) { router.push('/'); return; }
    try {
      const parsed = JSON.parse(raw) as AnalysisState;
      setData(parsed);
      setTeamRecs(parsed.teamRecs ?? []);
    } catch {
      router.push('/');
    }
  }, [router]);

  if (!data || !data.primary) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-text-secondary">Loading report…</div>
      </div>
    );
  }

  const primary = data.primary;
  const { competitors } = data;
  const hasCompetitors = competitors.length > 0;
  const tabs = hasCompetitors ? TABS : TABS.filter((t) => t !== 'Compare');

  async function handleGenerateTeamRecs() {
    if (!primary) return;
    const filled = teamAreas.filter((t) => t.team.trim() && t.question.trim());
    if (!filled.length) return;

    setGeneratingTeamRecs(true);
    setTeamRecsError('');

    try {
      const res = await fetch('/api/team-recs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: primary.brand, report: primary.report, teams: filled }),
      });
      if (!res.ok) throw new Error('Failed to generate team recommendations');
      const results: TeamRecsResult[] = await res.json();
      setTeamRecs(results);

      const updated: AnalysisState = { primary, competitors: data?.competitors ?? [], teamRecs: results };
      sessionStorage.setItem('analysisData', JSON.stringify(updated));
      setActiveTab('Recommendations');
    } catch (e: unknown) {
      setTeamRecsError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setGeneratingTeamRecs(false);
    }
  }

  async function handleExport() {
    if (!primary) return;
    setExporting(true);
    try {
      await exportToPDF(primary, teamRecs);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Top bar */}
      <header className="bg-brand-card border-b border-brand-border sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="text-muted hover:text-text-primary transition text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              New Analysis
            </button>
            <div>
              <h1 className="text-lg font-bold text-text-primary">{primary.brand}</h1>
              {primary.industry && <p className="text-xs text-muted">{primary.industry}</p>}
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 bg-primary hover:bg-indigo-700 disabled:bg-muted text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            {exporting ? 'Exporting…' : 'Export PDF'}
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as Tab)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-text-secondary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div id="report-content" className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'Overview' && <OverviewTab report={primary.report} />}
        {activeTab === 'Audience' && <AudienceTab audience={primary.report.audience} />}
        {activeTab === 'Social' && <SocialTab social={primary.report.socialPresence} />}
        {activeTab === 'Recommendations' && (
          <RecommendationsTab
            recommendations={primary.report.recommendations}
            teamRecs={teamRecs}
          />
        )}
        {activeTab === 'Compare' && hasCompetitors && (
          <CompareTab primary={primary} competitors={competitors} />
        )}

        {/* Team Recs form — shown after main analysis */}
        {activeTab !== 'Compare' && (
          <div className="mt-10 bg-brand-card rounded-2xl border border-brand-border p-6">
            <button
              onClick={() => setShowTeamForm((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-team-accent hover:text-cyan-700 transition w-full"
            >
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded border-2 border-team-accent transition ${showTeamForm ? 'bg-team-accent' : 'bg-white'}`}>
                {showTeamForm && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              Add Team & Area Recommendations
            </button>

            {showTeamForm && (
              <div className="mt-5">
                <p className="text-sm text-text-secondary mb-4">Add up to 5 teams with a specific focus question. We&apos;ll generate targeted recommendations for each.</p>

                <div className="space-y-3 mb-5">
                  {teamAreas.map((ta, i) => (
                    <div key={i} className="flex gap-3">
                      <input
                        type="text"
                        value={ta.team}
                        onChange={(e) => {
                          const next = [...teamAreas];
                          next[i] = { ...next[i], team: e.target.value };
                          setTeamAreas(next);
                        }}
                        placeholder="Team name (e.g. Marketing)"
                        className="w-1/3 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-team-accent transition"
                      />
                      <input
                        type="text"
                        value={ta.question}
                        onChange={(e) => {
                          const next = [...teamAreas];
                          next[i] = { ...next[i], question: e.target.value };
                          setTeamAreas(next);
                        }}
                        placeholder="Focus question (e.g. How do we improve social engagement?)"
                        className="flex-1 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-team-accent transition"
                      />
                      {teamAreas.length > 1 && (
                        <button
                          onClick={() => setTeamAreas((prev) => prev.filter((_, j) => j !== i))}
                          className="text-muted hover:text-negative transition"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  {teamAreas.length < 5 && (
                    <button
                      onClick={() => setTeamAreas((prev) => [...prev, { team: '', question: '' }])}
                      className="text-sm text-team-accent hover:text-cyan-700 font-semibold transition"
                    >
                      + Add Another Team
                    </button>
                  )}
                  <button
                    onClick={handleGenerateTeamRecs}
                    disabled={generatingTeamRecs || !teamAreas.some((t) => t.team.trim() && t.question.trim())}
                    className="ml-auto bg-team-accent hover:bg-cyan-700 disabled:bg-muted disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition flex items-center gap-2"
                  >
                    {generatingTeamRecs && (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {generatingTeamRecs ? 'Generating…' : 'Generate Team Recommendations'}
                  </button>
                </div>

                {teamRecsError && (
                  <p className="mt-3 text-sm text-negative">{teamRecsError}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
