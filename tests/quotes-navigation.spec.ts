import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { QuotesPage } from './pages/QuotesPage';
import { saveResultsToJson, generateHtmlReport, TestResult } from '../utils/reporter';
import config from '../config.json';

// Store test results
const results: TestResult[] = [];

test.describe('Customer Portal Navigation Tests', () => {
    test.beforeAll(async () => {
        console.log('Starting Quotes Navigation test suite...');
    });

    test('TS005 - Verify Quotes Navigation', async ({ page }) => {
        const start = Date.now();
        try {
            // Initialize pages
            const loginPage = new LoginPage(page);
            const quotesPage = new QuotesPage(page);

            // Step 1: Login
            console.log('Starting Quotes Navigation test...');
            await test.step('Login to application', async () => {
                await loginPage.login();
                await page.waitForTimeout(2000); // Allow for any post-login redirects
            });

            // Step 2: Navigate to Quotes
            await test.step('Navigate to Quotes section', async () => {
                await quotesPage.navigateToQuotes();
            });

            // Step 3: Verify navigation
            await test.step('Verify navigation to Quotes page', async () => {
                await quotesPage.verifyQuotesPage();
            });

            // Record success
            results.push({
                testId: 'TS005',
                testName: 'Verify Quotes Navigation',
                status: 'Pass',
                duration: Date.now() - start
            });

        } catch (err) {
            // Record failure
            results.push({
                testId: 'TS005',
                testName: 'Verify Quotes Navigation',
                status: 'Fail',
                duration: Date.now() - start
            });
            throw err;
        }
    });

    test.afterAll(async () => {
        console.log('Test suite completed. Generating reports...');
        saveResultsToJson(results);
        generateHtmlReport(results);
    });
});
