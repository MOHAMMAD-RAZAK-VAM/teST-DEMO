import { test, expect } from '@playwright/test';
import { AccountsPage } from './pages/AccountsPage';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';

test('TS003 - Verify Account Form Fill and Proceed to Application', async ({ page }) => {
    console.log('Starting Account Form Fill test...');
    const loginPage = new LoginPage(page);
    const homePage = new HomePage(page);
    const accountPage = new AccountsPage(page);
    
    try {
        // First handle login
        console.log('Logging in...');
        await loginPage.login();
        
        // Wait for home page and navigate to New Quote
        console.log('Navigating to New Quote...');
        await homePage.waitForPageLoad();
        await page.getByRole('link', { name: 'New Quote' }).click();

        // Wait for account page to be ready
        await accountPage.waitForPageLoad();
        
        // Fill Name of Applicant
        await accountPage.fillNameOfApplicant(
            'Hospital for Special Surgery - Radiology, East 70th Street, New York, NY, USA'
        );
        
        // Fill SIC Code
        await accountPage.fillSicCode('0971 - Hunting, Trapping, Game Propagation');
        
        // Select Legal Entry
        await accountPage.selectLegalEntry('Corporation');
        
        // Proceed to Application
        await accountPage.proceedToApplication();
        
        // Final URL verification
        await expect(page).toHaveURL(/\/BD\/McKee\/index\.html.*#\/Location/);
        console.log('Account Form Fill test completed successfully');
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Account Form Fill test failed:', errorMessage);
        throw error;
    }
});
