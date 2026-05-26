import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { withRetry } from '@/lib/retry';
import type { SearchResult } from '@/types';

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { brand, industry } = await req.json();
  if (!brand) return NextResponse.json({ error: 'brand is required' }, { status: 400 });

  const industryCtx = industry ? ` (${industry} industry)` : '';

  const searchPrompt = `Search the web for current information about the brand "${brand}"${industryCtx}. Find: customer sentiment, key strengths, main complaints, target audience, and social media presence. Gather as much detail as possible.`;

  try {
    const result = await withRetry(async () => {
      // Step 1: Web search to gather raw information
      const searchResponse = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' } as never],
        messages: [{ role: 'user', content: searchPrompt }],
      });

      const rawText = searchResponse.content
        .filter((b) => b.type === 'text')
        .map((b) => (b.type === 'text' ? b.text : ''))
        .join('\n');

      const sources = searchResponse.content
        .filter((b) => b.type === 'web_search_tool_result')
        .flatMap((b) => {
          if (b.type === 'web_search_tool_result') {
            return Array.isArray(b.content)
              ? b.content.filter((r: { type: string }) => r.type === 'web_search_result').map((r: { url?: string }) => r.url ?? '')
              : [];
          }
          return [];
        })
        .filter(Boolean)
        .slice(0, 5);

      // Step 2: Format into JSON using Haiku
      const formatResponse = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `Based on this research about "${brand}", return ONLY a JSON object with no markdown, no explanation:\n\n${rawText}\n\n{"sentimentSummary":"2-3 sentences","keyStrengths":["s1","s2","s3","s4","s5"],"keyConcerns":["c1","c2","c3"],"audienceInsights":"description","socialInsights":"description","sources":[]}`,
        }],
      });

      const formatText = formatResponse.content.find((b) => b.type === 'text');
      if (!formatText || formatText.type !== 'text') throw new Error('No format response');

      const jsonMatch = formatText.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not format search results as JSON');

      const data: SearchResult = JSON.parse(jsonMatch[0]);
      if (sources.length > 0) data.sources = sources;
      return data;
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Search failed';
    const status = message.includes('429') ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
