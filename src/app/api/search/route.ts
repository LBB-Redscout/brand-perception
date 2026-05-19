import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { withRetry } from '@/lib/retry';
import type { SearchResult } from '@/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { brand, industry } = await req.json();
  if (!brand) return NextResponse.json({ error: 'brand is required' }, { status: 400 });

  const industryCtx = industry ? ` (${industry} industry)` : '';

  const searchPrompt = `You are a brand intelligence analyst. Search the web to gather current information about the brand "${brand}"${industryCtx}.

Search for the following:
- "${brand} customer reviews 2025"
- "${brand} brand sentiment social media"
- "${brand} complaints issues"
- "${brand} praised strengths"
- "${brand} Instagram TikTok followers"
- "${brand} target audience demographics"

After searching, synthesize your findings into a JSON object with this exact structure:
{
  "sentimentSummary": "Overall sentiment description in 2-3 sentences",
  "keyStrengths": ["strength 1", "strength 2", "strength 3", "strength 4", "strength 5"],
  "keyConcerns": ["concern 1", "concern 2", "concern 3"],
  "audienceInsights": "Description of target audience, demographics, and segments",
  "socialInsights": "Description of social media presence, follower counts, platforms",
  "sources": ["url1", "url2", "url3"]
}

Return ONLY the JSON object, no markdown, no explanation.`;

  try {
    const result = await withRetry(async () => {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        tools: [{ type: 'web_search_20250305', name: 'web_search' } as never],
        messages: [{ role: 'user', content: searchPrompt }],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text response from search');
      }

      const raw = textBlock.text.trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse JSON from search response');

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
