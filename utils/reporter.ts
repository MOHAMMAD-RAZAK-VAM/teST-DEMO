import fs from 'fs';
import path from 'path';

export interface TestResult {
    testId: string;
    testName: string;
    status: 'Pass' | 'Fail';
    duration: number; // in ms
}

const TEMP_JSON_PATH = path.join(process.cwd(), 'reports', 'temp-results.json');
const HTML_REPORT_PATH = path.join(process.cwd(), 'reports', 'test-report.html');

export function saveResultsToJson(results: TestResult[]) {
    fs.mkdirSync(path.dirname(TEMP_JSON_PATH), { recursive: true });
    fs.writeFileSync(TEMP_JSON_PATH, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`✅ Test results saved to JSON: ${TEMP_JSON_PATH}`);
}

export function generateHtmlReport(results: TestResult[]) {
    const total = results.length;
    const passed = results.filter(r => r.status === 'Pass').length;
    const failed = total - passed;

    const rows = results.map(r => `
        <tr>
            <td>${r.testId}</td>
            <td>${r.testName}</td>
            <td class="${r.status.toLowerCase()}">${r.status}</td>
            <td>${(r.duration/1000).toFixed(2)}s</td>
        </tr>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Test Report</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                padding: 20px; 
                background-color: #f5f5f5;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background-color: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            table { 
                border-collapse: collapse; 
                width: 100%; 
                margin-bottom: 30px;
                background: white;
            }
            th, td { 
                border: 1px solid #ddd; 
                padding: 12px; 
                text-align: left; 
            }
            th { 
                background: #f8f9fa;
                font-weight: bold;
            }
            .pass { color: #28a745; font-weight: bold; }
            .fail { color: #dc3545; font-weight: bold; }
            h1 { 
                color: #333;
                text-align: center;
                margin-bottom: 30px;
            }
            .summary {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            .summary-card {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 6px;
                text-align: center;
            }
            .chart-container {
                max-width: 500px;
                margin: 30px auto;
                padding: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Playwright Test Results</h1>
            
            <div class="summary">
                <div class="summary-card">
                    <h3>Total Tests</h3>
                    <div>${total}</div>
                </div>
                <div class="summary-card">
                    <h3>Passed</h3>
                    <div class="pass">${passed}</div>
                </div>
                <div class="summary-card">
                    <h3>Failed</h3>
                    <div class="fail">${failed}</div>
                </div>
                <div class="summary-card">
                    <h3>Pass Rate</h3>
                    <div>${total > 0 ? Math.round((passed/total) * 100) : 0}%</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Test ID</th>
                        <th>Test Name</th>
                        <th>Status</th>
                        <th>Duration</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>

            <div class="chart-container">
                <canvas id="pieChart" width="400" height="400"></canvas>
            </div>
        </div>
        <script>
            const ctx = document.getElementById('pieChart').getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Pass', 'Fail'],
                    datasets: [{
                        data: [${passed}, ${failed}],
                        backgroundColor: ['#28a745', '#dc3545']
                    }]
                },
                options: {
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        </script>
    </body>
    </html>
    `;

    fs.writeFileSync(HTML_REPORT_PATH, html, 'utf-8');
    console.log(`✅ HTML report generated at: ${HTML_REPORT_PATH}`);
}
