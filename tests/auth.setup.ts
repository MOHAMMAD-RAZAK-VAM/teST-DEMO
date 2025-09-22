import { test as setup } from '@playwright/test';
import config from '../config.json';

setup('authenticate', async ({ page }) => {
    // Navigate to the app and wait for login form
    console.log(`Navigating to ${config.appUrl}`);
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' });

    // Wait for redirect to Azure AD login page first
    try {
        await page.waitForURL(/mk-bd-dev-idserverapp\.azurewebsites\.net/, {
            timeout: 30000,
            waitUntil: 'networkidle'
        });
        console.log('Redirected to Azure AD login page successfully');
    } catch (error) {
        console.log('Failed to reach Azure AD login page. Current URL:', page.url());
        if (page.url().includes('mk-bd-dev-uwapp.azurewebsites.net')) {
            console.log('Already on main app, assuming authenticated');
            // Store authenticated state
            await page.context().storageState({ path: 'playwright/.auth/user.json' });
        } else {
            throw error;
        }
    }

    // Now wait for the User Name textbox on the Azure AD login page
    await page.getByRole('textbox', { name: 'User Name' }).waitFor({ state: 'visible', timeout: 30000 });

    // Log current URL for debugging
    console.log('Current URL:', page.url());    // Login
    await page.getByRole('textbox', { name: 'User Name' }).fill(config.username);
    await page.getByRole('textbox', { name: 'Password' }).fill(config.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // Wait for successful login redirects
    await page.waitForURL(/.*callback\.html.*/, { timeout: 30000 });
    console.log('Reached callback page');

    // Wait for navigation to main app (Index.html) - more flexible pattern
    await page.waitForURL(/.*Index\.html/, { timeout: 30000 });
    console.log('Reached main app page');

    // Optional: Wait for home page content to load if needed
    try {
        await page.waitForURL(/.*Index\.html#\/home.*/, { timeout: 5000 });
        console.log('Reached home page with hash');
    } catch (error) {
        console.log('Home page hash not found, but main app loaded successfully');
    }

    // Store authenticated state
    await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
