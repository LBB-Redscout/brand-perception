import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { brand, industry } = await req.json();
  if (!brand) return NextResponse.json({ error: 'brand is required' }, { status: 400 });

  const industryCtx = industry ? ` in the ${industry} industry` : '';

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `List 6 well-known competitors or comparable brands to "${brand}"${industryCtx}. Return ONLY a JSON array of brand name strings, nothing else. Example: ["Brand A", "Brand B", "Brand C", "Brand D", "Brand E", "Brand F"]`,
      }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') throw new Error('No response');

    const match = textBlock.text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('Could not parse competitors');

    const competitors: string[] = JSON.parse(match[0]);
    return NextResponse.json({ competitors });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to suggest competitors';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
