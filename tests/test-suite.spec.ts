import { test, expect } from '@playwright/test';
import { saveResultsToJson, generateHtmlReport, TestResult } from '../utils/reporter';
import { LoginPage } from './LoginPage';
import { HomePage } from './HomePage';
import { AccountsPage } from './pages/AccountsPage';
import { QuotesPage } from './pages/QuotesPage';
import type { QuoteFilterData } from './pages/QuotesPage';
import config from '../config.json';

// Store all test results
const results: TestResult[] = [];

// Test Suite - runs tests in order
test.describe('Customer Portal Test Suite', () => {
    // Run tests serially (one after another)
    test.describe.configure({ mode: 'serial' });

    // Before all tests
    test.beforeAll(async () => {
        console.log('Starting test suite execution...');
    });

    // Test 1: Customer Search by Account Name
    test('TS001: Verify Customer Search by Account Name', async ({ page }) => {
        const start = Date.now();
        try {
            await page.goto(config.appUrl);
            await page.waitForURL(/.*Index\.html#\/home.*/, { timeout: 30000 });

            const combobox = page.getByRole('combobox').filter({ hasText: 'Customer Account Name' });
            await combobox.waitFor({ state: 'visible', timeout: 15000 });
            
            const searchBox = page.getByRole('textbox', { name: /Search By Customer Account Name/i });
            await searchBox.waitFor({ state: 'visible', timeout: 5000 });
            await searchBox.fill('Texas State University');
            
            await page.waitForFunction(() => !document.body.classList.contains('pace-running'), { timeout: 10000 })
                .catch(e => console.log('Initial loading state already completed'));
            
            const searchButton = page.getByRole('button', { name: /Search/i });
            await searchButton.waitFor({ state: 'visible', timeout: 5000 });
            await searchButton.click();
            
            await page.waitForFunction(() => !document.body.classList.contains('pace-running'), { timeout: 10000 });

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

    // Test 2: New Quote Creation
    test('TS002: Verify New Quote Creation Flow', async ({ page }) => {
        const start = Date.now();
        try {
            // Navigate to home page
            await page.goto(config.appUrl);
            await page.waitForURL(/.*Index\.html#\/home.*/, { timeout: 30000 });

            // Click New Quote button and wait for navigation
            const newQuoteButton = page.getByText('New Quote', { exact: true });
            await newQuoteButton.waitFor({ state: 'visible', timeout: 5000 });
            await newQuoteButton.click();

            // Verify navigation to Product page
            await page.waitForURL(/.*\/BD\/McKee\/index\.html.*#\/Product/, { timeout: 30000 });

            // Handle Effective Date
            const effectiveDateInput = page.getByRole('combobox', { name: /Effective Date\*/i });
            await effectiveDateInput.waitFor({ state: 'visible', timeout: 5000 });
            
            // Get today's date in MM/dd/yyyy format (US format)
            const today = new Date();
            const formattedDate = `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`;
            await effectiveDateInput.fill(formattedDate);

            // Verify Expiration Date is 1 year later
            const expirationDateInput = page.getByRole('combobox', { name: /Expiration Date\*/i });
            await expirationDateInput.waitFor({ state: 'visible', timeout: 5000 });
            const nextYear = new Date(today);
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            const expectedExpirationDate = `${(nextYear.getMonth() + 1).toString().padStart(2, '0')}/${nextYear.getDate().toString().padStart(2, '0')}/${nextYear.getFullYear()}`;
            await expect(expirationDateInput).toHaveValue(expectedExpirationDate);

                        // Wait for page to be ready
            await page.waitForLoadState('networkidle');
            await page.waitForFunction(() => !document.body.classList.contains('pace-running'), { timeout: 10000 })
                .catch(() => console.log('Loading state check completed'));

            // Find Commercial Automobile section
            console.log('Looking for Commercial Automobile section...');
            const autoSection = page.locator('div.prodWraper').filter({ has: page.getByRole('heading', { name: 'Commercial Automobile' }) });
            await autoSection.waitFor({ state: 'visible', timeout: 5000 });
            
            // Click the heading to expand section
            console.log('Expanding Commercial Automobile section...');
            const autoHeading = autoSection.getByRole('heading', { name: 'Commercial Automobile' });
            await autoHeading.waitFor({ state: 'visible', timeout: 5000 });
            await autoHeading.scrollIntoViewIfNeeded();
            await page.waitForTimeout(1000);
            await autoHeading.click({ force: true });
            
            // Wait for dynamic updates
            await page.waitForLoadState('networkidle');

            // Select the checkbox
            console.log('Selecting Commercial Automobile checkbox...');
            const checkbox = autoSection.locator('input[type="checkbox"]');
            await checkbox.waitFor({ state: 'visible', timeout: 5000 });
            await checkbox.check({ force: true });

            // Wait for content to load
            await page.waitForLoadState('networkidle');

            // Find and select Writing Company
            console.log('Selecting Writing Company...');
            const writingCompanyContainer = autoSection.locator('.proCW-info').first();
            const writingCompanyDropdown = writingCompanyContainer.locator('.k-dropdown-wrap');

            await writingCompanyDropdown.waitFor({ state: 'visible', timeout: 15000 });
            await writingCompanyDropdown.click();

            // Use keyboard navigation to select SIC
            // await page.keyboard.press('ArrowDown'); // Open dropdown
            // await page.waitForTimeout(500);
            await page.keyboard.press('ArrowDown'); // Move to first item
            await page.waitForTimeout(500);
            await page.keyboard.press('ArrowDown'); // Move to SIC
            await page.waitForTimeout(500);
            await page.keyboard.press('Enter'); // Select SIC
            
            // Wait for the selection to take effect
            await page.waitForTimeout(1000);
            await page.waitForLoadState('networkidle');

            // Click Proceed to Account and verify navigation
            const proceedButton = page.getByRole('button', { name: /Proceed to Account/i });
            await proceedButton.waitFor({ state: 'visible', timeout: 5000 });
            await proceedButton.click();

            // Verify navigation to Account page
            await page.waitForURL(/.*\/BD\/McKee\/index\.html.*#\/Account/, { timeout: 30000 });

            results.push({
                testId: 'TS002',
                testName: 'Verify New Quote Creation Flow',
                status: 'Pass',
                duration: Date.now() - start
            });

            // Continue with Account Form Fill (TS007)
            console.log('Starting Account Form Fill...');
            
            // Find and fill the Name of Applicant autocomplete input
            const nameInput = page.locator('input[data-role="autocomplete"][placeholder="Enter Applicant Name"]');
            await nameInput.waitFor({ state: 'visible', timeout: 10000 });
            
            // Type slowly to simulate human input
            await nameInput.focus();
            const text = 'Hospital for Special Surgery';
            for (const char of text) {
                await nameInput.type(char, { delay: 100 });
            }
            
            // Wait for suggestions to load
            await page.waitForTimeout(1000);
            
            // Use keyboard navigation to select first suggestion
            await page.keyboard.press('ArrowDown');
            await page.waitForTimeout(500);
            await page.keyboard.press('Enter');
            
            // Handle the Sweet Alert confirmation popup
            const popup = page.locator('.sweet-alert.showSweetAlert.visible');
            await popup.waitFor({ state: 'visible', timeout: 5000 });

            // Click the Yes button
            const yesButton = popup.locator('button.confirm');
            await yesButton.waitFor({ state: 'visible', timeout: 5000 });
            await yesButton.click();
            
            // Wait for popup to close and selection to be applied
            await popup.waitFor({ state: 'hidden', timeout: 5000 });
            await page.waitForTimeout(1000);

            // Fill SIC Code
            console.log('Filling SIC Code...');
            const sicCodeInput = page.getByRole('textbox', { name: 'SIC Code/Description*' });
            await sicCodeInput.waitFor({ state: 'visible', timeout: 15000 });
            
            // Ensure form section is visible
            await page.locator('.form-group', { 
                has: page.locator('label', { hasText: 'SIC Code/Description' })
            }).scrollIntoViewIfNeeded();
            
            // Type the SIC code slowly to allow suggestions
            await sicCodeInput.focus();
            const sicText = '0971 - Hunting, Trapping, Game Propagation';
            for (const char of sicText) {
                await sicCodeInput.type(char, { delay: 100 });
            }
            
            // Wait for suggestions and use keyboard navigation
            await page.waitForTimeout(1000);
            await page.keyboard.press('ArrowDown');
            await page.waitForTimeout(500);
            await page.keyboard.press('Enter');
            
            // Wait for selection to be applied
            await page.waitForTimeout(1000);

            // Select Legal Entity using Kendo UI dropdown
            console.log('Selecting Legal Entity...');
            
            // Find the Legal Entity dropdown by its label and section
            const legalEntitySection = page.locator('.form-group', {
                has: page.locator('label', { hasText: 'Legal Entity' })
            });
            
            // Get the dropdown within this section and click it
            const dropdown = legalEntitySection.locator('span.k-dropdown-wrap').first();
            await dropdown.waitFor({ state: 'visible', timeout: 10000 });
            await dropdown.click();
            
            // Use keyboard navigation as it's more reliable with Kendo UI
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter');
            
            // Wait for the selection to be reflected
            await page.waitForTimeout(1000);
            await page.waitForLoadState('networkidle');

            // Verify form values
            await expect(nameInput).toHaveValue(/Hospital for Special Surgery.*/i);
            await expect(sicCodeInput).toHaveValue('0971 - Hunting, Trapping, Game Propagation');
            
            // Verify Legal Entry selection using the section to ensure we check the right dropdown
            const legalEntityValue = legalEntitySection.locator('span.k-dropdown-wrap span.k-input').first();
            await expect(legalEntityValue).toHaveText('Corporation', { timeout: 10000 });

            // Skip address filling as it's not needed
            await page.waitForLoadState('networkidle');

            // Click Proceed to Application
            console.log('Proceeding to Application...');
            const proceedToAppButton = page.getByRole('button', { name: 'Proceed to Application' });
            await proceedToAppButton.click();

            // Verify navigation to Location page
            await page.waitForURL(/.*\/BD\/McKee\/index\.html.*#\/Location/, { timeout: 30000 });

            results.push({
                testId: 'TS007',
                testName: 'Verify Account Form Fill and Proceed to Application',
                status: 'Pass',
                duration: Date.now() - start
            });
        } catch (err) {
            console.error('Test failed:', err.message);
            results.push({
                testId: err.message.includes('TS002') ? 'TS002' : 'TS007',
                testName: err.message.includes('TS002') ? 'Verify New Quote Creation Flow' : 'Verify Account Form Fill and Proceed to Application',
                status: 'Fail',
                duration: Date.now() - start
            });
            throw err;
        }
    });

    // Test 3: Customer Accounts Menu Navigation
    test('TS004: Customer Accounts Menu Redirect', async ({ page }) => {
        // Set longer timeout for this test
        test.setTimeout(180000);
        
        const start = Date.now();
        let loginPage: LoginPage;
        let homePage: HomePage;

        try {
            // Initialize page objects
            loginPage = new LoginPage(page);
            homePage = new HomePage(page);

            // Login and ensure page is ready
            console.log('Starting Customer Accounts Menu test...');
            await test.step('Login to application', async () => {
                await loginPage.login();
                // Wait for dashboard to be visible after login
                await expect(page.getByRole('textbox', { name: /search/i }))
                    .toBeVisible({ timeout: 60000 });
            });
            
            // Navigate to Customer Accounts
            await test.step('Navigate to Customer Accounts', async () => {
                await homePage.navigateToCustomerAccounts();
            });

            results.push({
                testId: 'TS003',
                testName: 'Customer Accounts Menu Redirect',
                status: 'Pass',
                duration: Date.now() - start
            });
        } catch (err) {
            console.error('TS003 failed:', err.message);
            results.push({
                testId: 'TS003',
                testName: 'Customer Accounts Menu Redirect',
                status: 'Fail',
                duration: Date.now() - start
            });
            throw err;
        }
    });

    // Test 4: Customer Accounts Filter Search
    test('TS005: Verify Customer Accounts Filter Search', async ({ page }) => {
        // Set longer timeout for this test
        test.setTimeout(180000);
        
        const start = Date.now();
        try {
            // Initialize page objects
            const loginPage = new LoginPage(page);
            const homePage = new HomePage(page);
            const accountsPage = new AccountsPage(page);

            // Step 1 & 2: Login and wait for dashboard
            await test.step('Login to application', async () => {
                console.log('Attempting to login...');
                await loginPage.login();
                console.log('Waiting for dashboard after login...');
                await page.waitForSelector([
                    'body:not(.pace-running)',
                    '.dashboard-container',
                    '#dashboard',
                    '[data-testid="dashboard"]'
                ].join(', '), { 
                    timeout: 60000,
                    state: 'visible' 
                });
                console.log('Dashboard is visible');
            });

            // Step 3: Navigate to Customer Accounts
            await test.step('Navigate to Customer Accounts', async () => {
                console.log('Navigating to Customer Accounts...');
                let retryCount = 0;
                const maxRetries = 3;
                
                while (retryCount < maxRetries) {
                    try {
                        await homePage.navigateToCustomerAccounts();
                        await accountsPage.waitForPageLoad();
                        console.log('Successfully navigated to Customer Accounts');
                        break;
                    } catch (error) {
                        retryCount++;
                        console.log(`Navigation attempt ${retryCount} failed: ${error.message}`);
                        if (retryCount === maxRetries) throw error;
                        await page.waitForTimeout(2000);
                    }
                }
            });

            // Step 4: Apply filters and verify results
            await test.step('Apply filters and verify results', async () => {
                const filterData = {
                    zipCode: '08837',
                    state: 'NJ',
                    city: 'Edison',
                    accountName: 'New Jersey Convention and Exposition Center',
                    accountId: 'ACC0020714'
                };

                console.log('Filling filter form with data:', JSON.stringify(filterData, null, 2));
                await accountsPage.fillFilterForm(filterData);
                await accountsPage.applyFilter();
                await accountsPage.verifyFilterResults(filterData);
            });

            results.push({
                testId: 'TS004',
                testName: 'Verify Customer Accounts Filter Search',
                status: 'Pass',
                duration: Date.now() - start
            });
        } catch (err) {
            console.error('TS004 failed:', err.message);
            results.push({
                testId: 'TS004',
                testName: 'Verify Customer Accounts Filter Search',
                status: 'Fail',
                duration: Date.now() - start
            });
            throw err;
        }
    });

    // Test 5: Quotes Navigation
    test('TS006: Verify Quotes Navigation', async ({ page }) => {
        // Set longer timeout for this test
        test.setTimeout(180000);
        
        const start = Date.now();
        try {
            // Initialize page objects
            const loginPage = new LoginPage(page);
            const homePage = new HomePage(page);

            // Step 1: Login and ensure page is ready
            await test.step('Login to application', async () => {
                console.log('Starting Quotes Navigation test...');
                await loginPage.login();
                // Wait for dashboard to be visible after login
                await expect(page.getByRole('textbox', { name: /search/i }))
                    .toBeVisible({ timeout: 60000 });
            });
            
            // Step 2: Navigate to Quotes
            await test.step('Navigate to Quotes', async () => {
                await homePage.navigateToQuotes();
                // Verify we're on the Quotes page
                await expect(page.url()).toMatch(/.*\/Index\.html#\/quotes/);
            });

            results.push({
                testId: 'TS005',
                testName: 'Verify Quotes Navigation',
                status: 'Pass',
                duration: Date.now() - start
            });
        } catch (err) {
            console.error('TS005 failed:', err.message);
            results.push({
                testId: 'TS005',
                testName: 'Verify Quotes Navigation',
                status: 'Fail',
                duration: Date.now() - start
            });
            throw err;
        }
    });

    // Test 6: Quotes Filter
    test('TS007: Verify Quotes Filter', async ({ page }) => {
        // Set longer timeout for this test
        test.setTimeout(180000);
        
        const start = Date.now();
        try {
            // Initialize page objects
            const loginPage = new LoginPage(page);
            const homePage = new HomePage(page);
            const quotesPage = new QuotesPage(page);

            // Step 1: Login and ensure page is ready
            await test.step('Login to application', async () => {
                console.log('Starting Quotes Filter test...');
                await loginPage.login();
                await expect(page.getByRole('textbox', { name: /search/i }))
                    .toBeVisible({ timeout: 60000 });
            });
            
            // Step 2: Navigate to Quotes
            await test.step('Navigate to Quotes', async () => {
                await quotesPage.navigateToQuotes();
                await expect(page.url()).toMatch(/.*\/Index\.html#\/quotes/);
            });

            // Step 3: Apply filters
            await test.step('Apply filters and verify results', async () => {
                const filterData: QuoteFilterData = {
                    products: ['UmbrellaandExcess', 'Commercial Package Policy', 'General Liability', 'Commercial Automobile'],
                    quoteId: 'RNGL000376',
                    state: 'NY',
                    status: ['Quote Created']
                };

                console.log('Applying quote filters:', filterData);
                await quotesPage.fillFilterForm(filterData);
                await quotesPage.applyFilter();
                await quotesPage.verifyFilterResults(filterData);
            });

            results.push({
                testId: 'TS006',
                testName: 'Verify Quotes Filter',
                status: 'Pass',
                duration: Date.now() - start
            });
        } catch (err) {
            console.error('TS006 failed:', err.message);
            results.push({
                testId: 'TS006',
                testName: 'Verify Quotes Filter',
                status: 'Fail',
                duration: Date.now() - start
            });
            throw err;
        }
    });

    // After all tests, generate reports
    test.afterAll(async () => {
        console.log('Test suite completed. Generating reports...');
        saveResultsToJson(results);
        generateHtmlReport(results);
    });
});
