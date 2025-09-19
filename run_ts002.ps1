# Playwright TS002 Vehicle Details Test Runner
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Playwright TS002 Vehicle Details Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set working directory
$projectPath = "c:\Users\MohammadRazakAbdulRa\OneDrive - ValueMomentum, Inc\Documents\mcp-playwright"
Set-Location $projectPath

Write-Host "Running TS002 test with vehicle details filling..." -ForegroundColor Yellow
Write-Host ""

# Run the TS002 test
npx playwright test tests/test-suite.spec.ts --grep "TS002" --reporter=line

Write-Host ""
Write-Host "Test execution completed." -ForegroundColor Green
Write-Host "Check the results above and the generated reports." -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to exit"
