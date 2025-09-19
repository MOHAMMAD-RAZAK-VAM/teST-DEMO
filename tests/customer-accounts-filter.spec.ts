import { test } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { AccountsPage } from './pages/AccountsPage';
import config from '../config.json';

// Increase timeout for this test
test.setTimeout(180000);

// Add retry for flaky tests
test.describe('Customer Accounts Filter Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Set viewport size for consistency
        await page.setViewportSize({ width: 1920, height: 1080 });
    });

    test('TS004: Verify Customer Accounts Filter Search', async ({ page }) => {
        console.log('Starting Customer Accounts Filter Search test...');
        
        // Initialize page objects
        const loginPage = new LoginPage(page);
        const homePage = new HomePage(page);
        const accountsPage = new AccountsPage(page);

        try {
            // Step 1 & 2: Navigate and Login
            await test.step('Login to application', async () => {
                console.log('Attempting to login...');
                await loginPage.login(config.username, config.password);
                
                // Wait for dashboard with extended timeout and logging
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

            // Step 3: Navigate to Customer Accounts with retry mechanism
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
                        const msg = error instanceof Error ? error.message : String(error);
                        console.log(`Navigation attempt ${retryCount} failed: ${msg}`);
                        if (retryCount === maxRetries) throw error;
                        await page.waitForTimeout(2000); // Wait before retry
                    }
                }
            });

            // Step 4: Apply filters and verify results with specific data validation
            await test.step('Apply filters and verify results', async () => {
                const filterData = {
                    zipCode: '08837',
                    state: 'NJ',
                    city: 'Edison',
                    accountName: 'New Jersey Convention and Exposition Center',
                    accountId: 'ACC0020714'
                };

                console.log('Filling filter form with data:', JSON.stringify(filterData, null, 2));
                
                // Fill all filter fields and verify each input
                await accountsPage.fillFilterForm(filterData);

                // Apply filter and verify results match the filter criteria
                await accountsPage.applyFilter();
                await accountsPage.verifyFilterResults(filterData); // Pass expected data for validation
            });

            console.log('Customer Accounts Filter Search test completed successfully');
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error('Test failed:', msg);
            throw error;
        }
    });
});