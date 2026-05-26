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

  try {
    const result = await withRetry(async () => {
      // Step 1: Web search to gather raw information
      const searchResponse = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' } as never],
        messages: [{
          role: 'user',
          content: `Search the web for current information about the brand "${brand}"${industryCtx}. Find customer sentiment, key strengths, main complaints, target audience, and social media presence.`,
        }],
      });

      const rawText = searchResponse.content
        .filter((b) => b.type === 'text')
        .map((b) => (b as { type: 'text'; text: string }).text)
        .join('\n');

      if (!rawText) throw new Error('No search results returned');

      // Step 2: Format into structured JSON using Haiku
      const formatResponse = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `Based on this research about "${brand}", output ONLY a valid JSON object, no markdown fences, no explanation:\n\n${rawText}\n\nJSON structure required:\n{"sentimentSummary":"string","keyStrengths":["s1","s2","s3","s4","s5"],"keyConcerns":["c1","c2","c3"],"audienceInsights":"string","socialInsights":"string","sources":[]}`,
        }],
      });

      const formatText = formatResponse.content.find((b) => b.type === 'text') as { type: 'text'; text: string } | undefined;
      if (!formatText) throw new Error('No format response');

      const jsonMatch = formatText.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not format search results as JSON');

      const data: SearchResult = JSON.parse(jsonMatch[0]);
      return data;
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Search failed';
    const status = message.includes('429') ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
