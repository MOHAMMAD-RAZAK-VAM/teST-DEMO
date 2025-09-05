
import { test, expect } from '@playwright/test';
import { LoginPage } from '../tests/LoginPage';
import { HomePage } from '../tests/HomePage';
import { BasePage } from '../tests/BasePage';
import config from '../config.json';
import { saveResultsToJson, generateHtmlReport, TestResult } from '../utils/reporter';

const results: TestResult[] = [];

test('TS001: Verify Customer Search by Account Name', async ({ page }) => {
  const start = Date.now();
  try {
  // Step 1: Navigate to app and handle login redirect
  console.log(`Navigating to ${config.appUrl}`);
  await page.goto(config.appUrl);
  
  // Wait for redirect to login page and verify we're on login page
  await page.waitForURL(/.*\/Account\/Login.*/, { timeout: 30000 });
  console.log('Redirected to login page successfully');
  
  // Step 2: Login
  await page.getByRole('textbox', { name: 'User Name' }).fill(config.username);
  await page.getByRole('textbox', { name: 'Password' }).fill(config.password);
  await page.getByRole('button', { name: 'LOGIN' }).click();

  // Step 3: Handle authentication flow
  // First wait for callback page
  await page.waitForURL(/.*callback\.html.*/, { timeout: 30000 });
  console.log('Reached callback page');
  
  // Then wait for final home page
  await page.waitForURL(/.*Index\.html#\/home.*/, { timeout: 30000 });
  console.log('Reached home page');

  // Step 4: Verify customer search section is loaded
  const combobox = page.getByRole('combobox').filter({ hasText: 'Customer Account Name' });
  await combobox.waitFor({ state: 'visible', timeout: 15000 });
  
  // Step 5: Perform customer search
  const searchBox = page.getByRole('textbox', { name: /Search By Customer Account Name/i });
  await searchBox.waitFor({ state: 'visible', timeout: 5000 });
  await searchBox.fill('Texas State University');
  
  // Wait for any loading to complete
  await page.waitForFunction(() => !document.body.classList.contains('pace-running'), { timeout: 10000 })
    .catch(e => console.log('Initial loading state already completed'));
  
  const searchButton = page.getByRole('button', { name: /Search/i });
  await searchButton.waitFor({ state: 'visible', timeout: 5000 });
  await searchButton.click();
  
  // Wait for search loading to complete
  await page.waitForFunction(() => !document.body.classList.contains('pace-running'), { timeout: 10000 });

  // Step 6: Verify results
  const resultsTable = page.getByRole('table');
  await resultsTable.waitFor({ state: 'visible', timeout: 10000 });
  await expect(resultsTable).toContainText('Texas State University');

    results.push({
      testId: 'TS001',
      testName: 'Verify Customer Search by Account Name',
      status: 'Pass',
      duration: Date.now() - start
    });
  } catch (err) {
    results.push({
      testId: 'TS001',
      testName: 'Verify Customer Search by Account Name',
      status: 'Fail',
      duration: Date.now() - start
    });
    throw err;
  }
});

// After all tests, save JSON and generate HTML
test.afterAll(async () => {
    saveResultsToJson(results);
    generateHtmlReport(results);
});
