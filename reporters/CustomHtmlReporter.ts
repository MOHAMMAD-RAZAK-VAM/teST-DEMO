import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

interface TestReport {
  testId: string;
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  timestamp: string;
}

// Helper function for escaping HTML
function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

export default class CustomHtmlReporter implements Reporter {
  private reports: TestReport[] = [];
  private startTime: Date;

  onBegin() {
    this.startTime = new Date();
    console.log('Starting test execution...');
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const [maybeId, ...rest] = test.title.split(':');
    const testId = (maybeId || '').trim() || test.title;
    const testName = rest.join(':').trim() || test.title;

    const mapped =
      result.status === 'timedOut' || result.status === 'interrupted'
        ? 'failed'
        : (result.status as 'passed' | 'failed' | 'skipped');

    this.reports.push({
      testId,
      testName,
      status: mapped,
      duration: result.duration,
      timestamp: new Date().toISOString(),
    });
  }

  async onEnd() {
    try {
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

      // Save JSON results
      const jsonPath = path.join(reportsDir, 'temp-results.json');
      fs.writeFileSync(jsonPath, JSON.stringify(this.reports, null, 2));
      console.log('JSON results saved to: ' + jsonPath);

      // Calculate summary
      const total = this.reports.length;
      const passed = this.reports.filter(r => r.status === 'passed').length;
      const failed = this.reports.filter(r => r.status === 'failed').length;
      const skipped = this.reports.filter(r => r.status === 'skipped').length;
      const duration = Date.now() - this.startTime.getTime();
      const passRate = total ? ((passed / total) * 100).toFixed(1) : '0.0';
      
      console.log('Generating HTML report...');
      
      const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Playwright Test Results</title>
  <style>
    :root { --green:#10b981; --red:#ef4444; --amber:#f59e0b; --bg:#f5f5f5; --fg:#111827; --muted:#6b7280; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: var(--bg); margin:0; padding:24px; color: var(--fg); }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { margin: 0 0 20px; }
    .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .card h2 { margin: 0; padding: 14px 16px; border-bottom: 1px solid #e5e7eb; background: #fafafa; font-size: 16px; }
    .content { padding: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: left; }
    th { background: #f9fafb; position: sticky; top: 0; z-index: 1; }
    .status { font-weight: 600; text-transform: capitalize; }
    .status.passed { color: #047857; background: #ecfdf5; padding: 2px 8px; border-radius: 12px; display: inline-block; }
    .status.failed { color: #b91c1c; background: #fef2f2; padding: 2px 8px; border-radius: 12px; display: inline-block; }
    .status.skipped { color: #92400e; background: #fffbeb; padding: 2px 8px; border-radius: 12px; display: inline-block; }
    .meta { color: var(--muted); font-size: 12px; }
    .legend { display:flex; gap:14px; align-items:center; margin-top:8px; color:#374151; font-size:13px; }
    .dot { width:10px; height:10px; border-radius:50%; display:inline-block; margin-right:6px; }
    .summary-cards { display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 10px; }
    .summary-cards .kpi { background:#f8f9fa; border: 1px solid #e5e7eb; padding:12px; border-radius:10px; text-align:center; }
    .kpi .value { font-size:18px; font-weight:700; margin-top:6px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Test Results</h1>
    <div class="grid">
      <div class="card">
        <h2>Results Table</h2>
        <div class="content" style="max-height: 520px; overflow:auto;">
          <table>
            <thead>
              <tr>
                <th>Test ID</th>
                <th>Test Name</th>
                <th>Status</th>
                <th>Duration (ms)</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${this.reports.map(r => `
                <tr>
                  <td>${escapeHtml(r.testId)}</td>
                  <td>${escapeHtml(r.testName)}</td>
                  <td><span class="status ${escapeHtml(r.status)}">${escapeHtml(r.status)}</span></td>
                  <td>${Number(r.duration).toLocaleString()}</td>
                  <td>${new Date(r.timestamp).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="content meta">Total: ${total} • Passed: ${passed} • Failed: ${failed} • Skipped: ${skipped} • Pass rate: ${passRate}% • Duration: ${(duration/1000).toFixed(2)}s</div>
      </div>

      <div class="card">
        <h2>Status Summary</h2>
        <div class="content">
          <div class="summary-cards">
            <div class="kpi"><div>Passed</div><div class="value" style="color:var(--green)">${passed}</div></div>
            <div class="kpi"><div>Failed</div><div class="value" style="color:var(--red)">${failed}</div></div>
            <div class="kpi"><div>Skipped</div><div class="value" style="color:var(--amber)">${skipped}</div></div>
          </div>
          <svg id="pie" width="320" height="320" viewBox="0 0 320 320" role="img" aria-label="Passed/Failed/Skipped"></svg>
          <div class="legend">
            <span><span class="dot" style="background:var(--green)"></span>Passed</span>
            <span><span class="dot" style="background:var(--red)"></span>Failed</span>
            <span><span class="dot" style="background:var(--amber)"></span>Skipped</span>
          </div>
        </div>
      </div>
    </div>
  </div>

<script>
(function(){
  const data = [
    { label: 'Passed', value: ${passed}, color: getComputedStyle(document.documentElement).getPropertyValue('--green').trim() || '#10b981' },
    { label: 'Failed', value: ${failed}, color: getComputedStyle(document.documentElement).getPropertyValue('--red').trim() || '#ef4444' },
    { label: 'Skipped', value: ${skipped}, color: getComputedStyle(document.documentElement).getPropertyValue('--amber').trim() || '#f59e0b' }
  ];
  renderPie('pie', data);

  function renderPie(svgId, segments) {
    const svg = document.getElementById(svgId);
    svg.innerHTML = '';
    const size = 320, r = 140, cx = size/2, cy = size/2;
    const ir = 80; // inner radius; set 0 for full pie
    const totalRaw = segments.reduce((a,s)=>a + (+s.value||0), 0);
    const total = totalRaw > 0 ? totalRaw : 1;

    // Full-circle detection: any segment equals the raw total
    const full = segments.find(s => (+s.value||0) === totalRaw && totalRaw > 0);
    if (full) {
      // Draw a solid ring in the segment color
      const ring = document.createElementNS('http://www.w3.org/2000/svg','circle');
      ring.setAttribute('cx', cx);
      ring.setAttribute('cy', cy);
      ring.setAttribute('r', (r + ir)/2);
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', full.color);
      ring.setAttribute('stroke-width', String(r - ir));
      ring.setAttribute('stroke-linecap', 'butt');
      svg.appendChild(ring);

      // Centered percentage label
      const text = document.createElementNS('http://www.w3.org/2000/svg','text');
      text.setAttribute('x', cx);
      text.setAttribute('y', cy);
      text.setAttribute('fill', '#111827');
      text.setAttribute('font-size', '14');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.textContent = '100.0%';
      svg.appendChild(text);
      return;
    }

    // Optional background ring
    if (ir > 0) {
      const bg = document.createElementNS('http://www.w3.org/2000/svg','circle');
      bg.setAttribute('cx', cx); bg.setAttribute('cy', cy); bg.setAttribute('r', r);
      bg.setAttribute('fill', '#f3f4f6');
      svg.appendChild(bg);
    }

    let start = -Math.PI/2;
    segments.forEach(seg => {
      const v = +seg.value || 0;
      const angle = (v/total) * Math.PI*2;
      const end = start + angle;
      if (angle > 0) {
        const d = donutSlicePath(cx, cy, r, ir, start, end);
        const p = document.createElementNS('http://www.w3.org/2000/svg','path');
        p.setAttribute('d', d);
        p.setAttribute('fill', seg.color);
        p.setAttribute('stroke', 'none'); // avoid white wash-out
        svg.appendChild(p);

        const mid = (start + end)/2;
        const lr = (r + ir)/2, lx = cx + Math.cos(mid)*lr, ly = cy + Math.sin(mid)*lr;
        const pct = ((v/total)*100).toFixed(1) + '%';
        if (v > 0) {
          const t = document.createElementNS('http://www.w3.org/2000/svg','text');
          t.setAttribute('x', lx); t.setAttribute('y', ly);
          t.setAttribute('fill', '#111827'); t.setAttribute('font-size', '12');
          t.setAttribute('text-anchor', 'middle'); t.setAttribute('dominant-baseline', 'middle');
          t.textContent = pct; svg.appendChild(t);
        }
      }
      start = end;
    });
  }

  function donutSlicePath(cx, cy, r, ir, start, end) {
    const sweep = 1;
    const delta = end - start;
    const twoPi = Math.PI * 2;
    const largeArc = (delta % twoPi) > Math.PI ? 1 : 0;

    const sx = cx + Math.cos(start)*r, sy = cy + Math.sin(start)*r;
    const ex = cx + Math.cos(end)*r,   ey = cy + Math.sin(end)*r;

    if (ir <= 0) {
      return ['M', cx, cy, 'L', sx, sy, 'A', r, r, 0, largeArc, sweep, ex, ey, 'Z'].join(' ');
    } else {
      const isx = cx + Math.cos(end)*ir, isy = cy + Math.sin(end)*ir;
      const iex = cx + Math.cos(start)*ir, iey = cy + Math.sin(start)*ir;
      return [
        'M', sx, sy,
        'A', r, r, 0, largeArc, sweep, ex, ey,
        'L', isx, isy,
        'A', ir, ir, 0, largeArc, 0, iex, iey,
        'Z'
      ].join(' ');
    }
  }

    })();
</script>
</body>
</html>`;

      // Write the report
      const reportPath = path.join(reportsDir, 'test-report.html');
      fs.writeFileSync(reportPath, html);
      console.log('Report generated at: ' + reportPath);
    
    } catch (error) {
      console.error('Error generating report:', error);
    }
  }
}
