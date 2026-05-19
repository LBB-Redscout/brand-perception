import type { BrandAnalysis, TeamRecsResult } from '@/types';

const THEME_LABELS: Record<string, string> = {
  product_quality: 'Product Quality',
  customer_service: 'Customer Service',
  value: 'Value',
  brand_image: 'Brand Image',
  innovation: 'Innovation',
};

function scoreColor(score: number): string {
  if (score >= 70) return '#16a34a';
  if (score >= 45) return '#d97706';
  return '#dc2626';
}

function scoreBar(score: number, maxWidth: number): string {
  const color = scoreColor(score);
  const w = Math.round((score / 100) * maxWidth);
  return `<div style="background:#e2e8f0;border-radius:4px;height:8px;width:${maxWidth}px;overflow:hidden;"><div style="background:${color};height:8px;width:${w}px;border-radius:4px;"></div></div>`;
}

export async function exportToPDF(
  analysis: BrandAnalysis,
  teamRecs: TeamRecsResult[],
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  const brand = analysis.brand;
  const report = analysis.report;
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 800px; background: white; padding: 40px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #0f172a; font-size: 13px; line-height: 1.5;
  `;

  const themeEntries = Object.entries(report.themes);
  const activePlatforms = report.socialPresence.platforms.filter((p) => p.active);

  container.innerHTML = `
    <!-- Header -->
    <div style="border-bottom:2px solid #6366f1;padding-bottom:20px;margin-bottom:28px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <h1 style="font-size:26px;font-weight:800;color:#6366f1;margin:0;">${brand}</h1>
          ${analysis.industry ? `<p style="color:#475569;margin:4px 0 0;">${analysis.industry}</p>` : ''}
        </div>
        <div style="text-align:right;">
          <p style="color:#94a3b8;margin:0;font-size:12px;">Brand Perception Report</p>
          <p style="color:#94a3b8;margin:4px 0 0;font-size:12px;">${date}</p>
        </div>
      </div>
    </div>

    <!-- Overall Score + Sentiment -->
    <div style="display:flex;gap:24px;margin-bottom:28px;">
      <div style="flex:0 0 180px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;text-align:center;">
        <p style="font-size:11px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:.05em;margin:0 0 8px;">Overall Score</p>
        <p style="font-size:48px;font-weight:800;margin:0;color:${scoreColor(report.overallScore)};">${report.overallScore}</p>
        <p style="font-size:12px;color:#94a3b8;margin:4px 0 0;">out of 100</p>
      </div>
      <div style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
        <p style="font-size:11px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:.05em;margin:0 0 12px;">Sentiment Distribution</p>
        <div style="display:flex;border-radius:6px;overflow:hidden;height:16px;margin-bottom:10px;">
          <div style="background:#22c55e;width:${report.sentiment.positive}%;"></div>
          <div style="background:#94a3b8;width:${report.sentiment.neutral}%;"></div>
          <div style="background:#ef4444;width:${report.sentiment.negative}%;"></div>
        </div>
        <div style="display:flex;gap:16px;font-size:12px;">
          <span style="color:#16a34a;font-weight:600;">✓ Positive ${report.sentiment.positive}%</span>
          <span style="color:#475569;">— Neutral ${report.sentiment.neutral}%</span>
          <span style="color:#dc2626;font-weight:600;">✗ Negative ${report.sentiment.negative}%</span>
        </div>
        <p style="color:#475569;margin:12px 0 0;font-size:13px;">${report.summary}</p>
      </div>
    </div>

    <!-- Theme Breakdown -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:28px;">
      <h2 style="font-size:14px;font-weight:700;margin:0 0 16px;">Theme Breakdown</h2>
      ${themeEntries.map(([key, val]) => `
        <div style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-weight:600;font-size:13px;">${THEME_LABELS[key] || key}</span>
            <span style="font-weight:700;color:${scoreColor(val.score)};">${val.score}</span>
          </div>
          ${scoreBar(val.score, 680)}
          <p style="color:#475569;font-size:12px;margin:4px 0 0;">${val.insight}</p>
        </div>
      `).join('')}
    </div>

    <!-- Strengths & Concerns -->
    <div style="display:flex;gap:16px;margin-bottom:28px;">
      <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;">
        <h3 style="font-size:13px;font-weight:700;color:#16a34a;margin:0 0 12px;">Top Strengths</h3>
        ${report.topStrengths.map((s) => `<p style="margin:0 0 6px;font-size:13px;color:#166534;">• ${s}</p>`).join('')}
      </div>
      <div style="flex:1;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;">
        <h3 style="font-size:13px;font-weight:700;color:#dc2626;margin:0 0 12px;">Top Concerns</h3>
        ${report.topConcerns.map((c) => `<p style="margin:0 0 6px;font-size:13px;color:#991b1b;">• ${c}</p>`).join('')}
      </div>
    </div>

    <!-- Audience -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:28px;">
      <h2 style="font-size:14px;font-weight:700;margin:0 0 12px;">Audience</h2>
      <p style="color:#475569;margin:0 0 14px;">${report.audience.summary}</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px;">
        <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:10px 16px;">
          <p style="font-size:10px;text-transform:uppercase;color:#94a3b8;font-weight:600;margin:0;">Age Range</p>
          <p style="font-weight:700;font-size:14px;margin:2px 0 0;">${report.audience.ageRange}</p>
        </div>
        <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:10px 16px;">
          <p style="font-size:10px;text-transform:uppercase;color:#94a3b8;font-weight:600;margin:0;">Influencer Presence</p>
          <p style="font-weight:700;font-size:14px;margin:2px 0 0;">${report.audience.influencerPresence}</p>
        </div>
        <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:10px 16px;">
          <p style="font-size:10px;text-transform:uppercase;color:#94a3b8;font-weight:600;margin:0;">Loyalty Signal</p>
          <p style="font-weight:700;font-size:14px;margin:2px 0 0;">${report.audience.loyaltySignal}</p>
        </div>
      </div>
      ${report.audience.segments.map((seg) => `
        <div style="display:inline-block;background:white;border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px;margin:0 8px 8px 0;">
          <span style="font-weight:600;font-size:13px;">${seg.label}</span>
          <span style="color:#94a3b8;font-size:12px;"> ${seg.percentage}%</span>
        </div>
      `).join('')}
    </div>

    <!-- Social Presence -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:28px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h2 style="font-size:14px;font-weight:700;margin:0;">Social Presence</h2>
        <span style="font-size:20px;font-weight:800;color:${scoreColor(report.socialPresence.overallScore)};">${report.socialPresence.overallScore}/100</span>
      </div>
      <p style="color:#475569;margin:0 0 14px;">${report.socialPresence.summary}</p>
      <div style="display:flex;flex-wrap:wrap;gap:12px;">
        ${activePlatforms.map((p) => `
          <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;min-width:120px;">
            <p style="font-weight:700;font-size:13px;margin:0 0 4px;">${p.name}</p>
            <p style="color:#475569;font-size:12px;margin:0;">${p.followers}</p>
            <p style="color:#94a3b8;font-size:11px;margin:2px 0 0;">${p.engagement} engagement</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Recommendations -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:28px;">
      <h2 style="font-size:14px;font-weight:700;margin:0 0 16px;">Recommendations</h2>
      ${report.recommendations.map((rec, i) => `
        <div style="background:white;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:12px;">
          <div style="display:flex;gap:10px;align-items:flex-start;">
            <span style="background:#6366f1;color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0;line-height:24px;text-align:center;">${i + 1}</span>
            <div>
              <p style="font-weight:700;font-size:13px;margin:0 0 6px;">${rec.action}</p>
              <p style="color:#475569;font-size:13px;margin:0 0 8px;">${rec.rationale}</p>
              ${rec.learnFrom?.length ? `<p style="font-size:11px;color:#94a3b8;margin:0;">Learn from: ${rec.learnFrom.map((lf) => lf.brand).join(', ')}</p>` : ''}
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    ${teamRecs.length > 0 ? `
    <!-- Team Recommendations -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
      <h2 style="font-size:14px;font-weight:700;margin:0 0 16px;">Team Recommendations</h2>
      ${teamRecs.map((tr) => `
        <div style="margin-bottom:20px;">
          <div style="background:#0891b2;border-radius:8px 8px 0 0;padding:12px 16px;">
            <p style="color:white;font-weight:700;font-size:13px;margin:0;">${tr.team}</p>
            <p style="color:#cffafe;font-size:12px;margin:2px 0 0;">${tr.question}</p>
          </div>
          <div style="background:white;border:1px solid #e2e8f0;border-radius:0 0 8px 8px;padding:16px;">
            ${tr.context ? `<p style="color:#475569;font-size:12px;font-style:italic;border-left:3px solid #0891b2;padding-left:10px;margin:0 0 12px;">${tr.context}</p>` : ''}
            ${tr.recommendations.map((rec) => `
              <div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #f1f5f9;last-child:border-0;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">
                  <p style="font-weight:700;font-size:13px;margin:0;flex:1;">${rec.action}</p>
                  <span style="font-size:11px;font-weight:600;color:${rec.priority === 'High' ? '#dc2626' : rec.priority === 'Medium' ? '#d97706' : '#2563eb'};background:${rec.priority === 'High' ? '#fee2e2' : rec.priority === 'Medium' ? '#fef3c7' : '#dbeafe'};padding:2px 8px;border-radius:10px;margin-left:8px;white-space:nowrap;">${rec.priority}</span>
                </div>
                <p style="color:#475569;font-size:12px;margin:0;">${rec.rationale}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
    ` : ''}
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      width: 800,
      windowWidth: 800,
    });

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width / 2;
    const imgHeight = canvas.height / 2;
    const ratio = pdfWidth / imgWidth;
    const scaledHeight = imgHeight * ratio;

    let position = 0;
    let remaining = scaledHeight;

    while (remaining > 0) {
      const pageHeight = Math.min(remaining, pdfHeight);
      const sourceY = position / ratio;
      const sourceHeight = pageHeight / ratio;

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = Math.ceil(sourceHeight * 2);
      const ctx = pageCanvas.getContext('2d')!;
      ctx.drawImage(canvas, 0, sourceY * 2, canvas.width, pageCanvas.height, 0, 0, canvas.width, pageCanvas.height);

      const pageData = pageCanvas.toDataURL('image/jpeg', 0.92);
      if (position > 0) pdf.addPage();
      pdf.addImage(pageData, 'JPEG', 0, 0, pdfWidth, (pageCanvas.height / 2) * ratio);

      position += pdfHeight;
      remaining -= pdfHeight;
    }

    const filename = `${brand.toLowerCase().replace(/\s+/g, '-')}-perception-report.pdf`;
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}
