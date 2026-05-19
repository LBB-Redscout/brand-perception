import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

export const maxDuration = 60;
import type { SearchResult } from '@/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const delays = [20000, 40000];

async function runWithRetry(fn: () => Promise<Response>): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const isRateLimit =
        err instanceof Error &&
        (err.message.includes('429') || err.message.toLowerCase().includes('rate limit'));
      if (!isRateLimit || attempt === 2) throw err;
      await new Promise((r) => setTimeout(r, delays[attempt]));
    }
  }
  throw lastErr;
}

export async function POST(req: NextRequest) {
  const { brand, industry, searchResult } = (await req.json()) as {
    brand: string;
    industry?: string;
    searchResult: SearchResult;
  };

  if (!brand || !searchResult) {
    return new Response(JSON.stringify({ error: 'brand and searchResult are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const industryCtx = industry ? ` (${industry})` : '';

  const prompt = `You are a brand intelligence analyst. Based on the following web research findings for the brand "${brand}"${industryCtx}, produce a comprehensive structured brand perception report.

## Web Research Findings:
Sentiment Summary: ${searchResult.sentimentSummary}
Key Strengths: ${searchResult.keyStrengths.join(', ')}
Key Concerns: ${searchResult.keyConcerns.join(', ')}
Audience Insights: ${searchResult.audienceInsights}
Social Insights: ${searchResult.socialInsights}
Sources: ${searchResult.sources.join(', ')}

## Instructions:
Produce a detailed JSON report with this EXACT structure. All scores are 0-100. Be specific and data-driven based on the research above.

{
  "overallScore": <0-100 integer>,
  "sentiment": { "positive": <0-100>, "neutral": <0-100>, "negative": <0-100> },
  "summary": "<2-3 sentence executive summary of brand perception>",
  "sources": [<array of URLs from research>],
  "themes": {
    "product_quality": { "score": <0-100>, "insight": "<one concise insight>" },
    "customer_service": { "score": <0-100>, "insight": "<one concise insight>" },
    "value": { "score": <0-100>, "insight": "<one concise insight>" },
    "brand_image": { "score": <0-100>, "insight": "<one concise insight>" },
    "innovation": { "score": <0-100>, "insight": "<one concise insight>" }
  },
  "topStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "topConcerns": ["<concern 1>", "<concern 2>", "<concern 3>"],
  "audience": {
    "summary": "<paragraph describing primary audience>",
    "segments": [
      { "label": "<segment name>", "percentage": <integer>, "description": "<description>", "sentiment": "Positive|Mixed|Negative" },
      { "label": "<segment name>", "percentage": <integer>, "description": "<description>", "sentiment": "Positive|Mixed|Negative" },
      { "label": "<segment name>", "percentage": <integer>, "description": "<description>", "sentiment": "Positive|Mixed|Negative" }
    ],
    "ageRange": "<e.g. 18-34>",
    "topChannels": ["<channel 1>", "<channel 2>", "<channel 3>"],
    "influencerPresence": "Low|Medium|High|Very High",
    "influencerNote": "<one sentence>",
    "loyaltySignal": "Low|Medium|High|Very High",
    "loyaltyNote": "<one sentence>"
  },
  "socialPresence": {
    "overallScore": <0-100>,
    "summary": "<2 sentence social summary>",
    "platforms": [
      { "name": "Instagram", "followers": "<e.g. 2.1M>", "frequency": "<e.g. Daily>", "engagement": "Low|Medium|High|Very High", "active": true|false },
      { "name": "TikTok", "followers": "<e.g. 850K>", "frequency": "<e.g. 3x/week>", "engagement": "Low|Medium|High|Very High", "active": true|false },
      { "name": "X", "followers": "<e.g. 1.2M>", "frequency": "<e.g. Multiple daily>", "engagement": "Low|Medium|High|Very High", "active": true|false },
      { "name": "Facebook", "followers": "<e.g. 5M>", "frequency": "<e.g. Weekly>", "engagement": "Low|Medium|High|Very High", "active": true|false },
      { "name": "YouTube", "followers": "<e.g. 320K>", "frequency": "<e.g. Monthly>", "engagement": "Low|Medium|High|Very High", "active": true|false },
      { "name": "LinkedIn", "followers": "<e.g. 180K>", "frequency": "<e.g. Weekly>", "engagement": "Low|Medium|High|Very High", "active": true|false }
    ],
    "strengths": ["<social strength 1>", "<social strength 2>"],
    "gaps": ["<social gap 1>", "<social gap 2>"]
  },
  "recommendations": [
    {
      "action": "<specific action>",
      "rationale": "<why this matters>",
      "learnFrom": [{ "brand": "<brand name>", "reason": "<why they are a good model>" }]
    },
    {
      "action": "<specific action>",
      "rationale": "<why this matters>",
      "learnFrom": [{ "brand": "<brand name>", "reason": "<why they are a good model>" }]
    },
    {
      "action": "<specific action>",
      "rationale": "<why this matters>",
      "learnFrom": [{ "brand": "<brand name>", "reason": "<why they are a good model>" }]
    }
  ]
}

IMPORTANT: Return ONLY the JSON object. No markdown code fences, no explanation text. The sentiment positive+neutral+negative must sum to 100. Segment percentages must sum to 100.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      try {
        await runWithRetry(async () => {
          const stream = client.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            messages: [{ role: 'user', content: prompt }],
          });

          let fullText = '';

          stream.on('text', (text) => {
            fullText += text;
            send({ type: 'delta', text });
          });

          await stream.finalMessage();

          const jsonMatch = fullText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error('Could not parse JSON from analysis response');

          const report = JSON.parse(jsonMatch[0]);
          send({ type: 'done', report });
          return new Response('ok');
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Analysis failed';
        send({ type: 'error', message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
