import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { withRetry } from '@/lib/retry';
import type { BrandReport, TeamArea, TeamRecsResult } from '@/types';

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { brand, report, teams } = (await req.json()) as {
    brand: string;
    report: BrandReport;
    teams: TeamArea[];
  };

  if (!brand || !report || !teams?.length) {
    return NextResponse.json({ error: 'brand, report, and teams are required' }, { status: 400 });
  }

  const results: TeamRecsResult[] = [];

  for (const { team, question } of teams) {
    const prompt = `You are a strategic brand consultant. Based on this brand perception report for "${brand}", generate focused recommendations for the "${team}" team.

## Brand Report Context:
Overall Score: ${report.overallScore}/100
Summary: ${report.summary}
Top Strengths: ${report.topStrengths.join(', ')}
Top Concerns: ${report.topConcerns.join(', ')}
Theme Scores: Product Quality ${report.themes.product_quality.score}, Customer Service ${report.themes.customer_service.score}, Value ${report.themes.value.score}, Brand Image ${report.themes.brand_image.score}, Innovation ${report.themes.innovation.score}

## Team Focus Question:
Team: ${team}
Question: ${question}

Generate a JSON response with this EXACT structure:
{
  "team": "${team}",
  "question": "${question}",
  "context": "<2 sentence summary of what from the report is most relevant to this team's question>",
  "recommendations": [
    {
      "action": "<specific actionable recommendation>",
      "rationale": "<why this addresses the question given the brand data>",
      "priority": "High|Medium|Low",
      "learnFrom": [{ "brand": "<brand name>", "reason": "<brief reason>" }]
    },
    {
      "action": "<specific actionable recommendation>",
      "rationale": "<why this addresses the question given the brand data>",
      "priority": "High|Medium|Low",
      "learnFrom": [{ "brand": "<brand name>", "reason": "<brief reason>" }]
    },
    {
      "action": "<specific actionable recommendation>",
      "rationale": "<why this addresses the question given the brand data>",
      "priority": "High|Medium|Low",
      "learnFrom": [{ "brand": "<brand name>", "reason": "<brief reason>" }]
    }
  ]
}

Return ONLY the JSON object, no markdown, no explanation.`;

    try {
      const result = await withRetry(async () => {
        const response = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1200,
          messages: [{ role: 'user', content: prompt }],
        });

        const textBlock = response.content.find((b) => b.type === 'text');
        if (!textBlock || textBlock.type !== 'text') throw new Error('No text response');

        const jsonMatch = textBlock.text.trim().match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Could not parse JSON');

        return JSON.parse(jsonMatch[0]) as TeamRecsResult;
      });

      results.push(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed';
      results.push({
        team,
        question,
        context: 'Error generating recommendations.',
        recommendations: [
          {
            action: `Error: ${message}`,
            rationale: '',
            priority: 'Low',
            learnFrom: [],
          },
        ],
      });
    }
  }

  return NextResponse.json(results);
}
