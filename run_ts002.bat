@echo off
echo ========================================
echo Playwright TS002 Vehicle Details Test
echo ========================================
echo.

echo Running TS002 test with vehicle details filling...
echo.

cd /d "c:\Users\MohammadRazakAbdulRa\OneDrive - ValueMomentum, Inc\Documents\mcp-playwright"

REM Run the TS002 test
npx playwright test tests/test-suite.spec.ts --grep "TS002" --reporter=line

echo.
echo Test execution completed.
echo Check the results above and the generated reports.
echo.

pause
