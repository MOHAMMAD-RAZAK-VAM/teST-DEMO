import { test as setup } from '@playwright/test';
import config from '../config.json';

setup('authenticate', async ({ page }) => {
    // Navigate to the app and wait for login form
    console.log(`Navigating to ${config.appUrl}`);
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' });
    await page.getByRole('textbox', { name: 'User Name' }).waitFor({ state: 'visible', timeout: 30000 });
    
    // Log current URL for debugging
    console.log('Current URL:', page.url());
    
    try {
        // Wait for redirect to login page - more flexible pattern
        await page.waitForURL(/login/i, { 
            timeout: 30000,
            waitUntil: 'networkidle'
        });
        console.log('Redirected to login page successfully');
    } catch (error) {
        console.log('Failed to reach login page. Current URL:', page.url());
        throw error;
    }
    
    // Login
    await page.getByRole('textbox', { name: 'User Name' }).fill(config.username);
    await page.getByRole('textbox', { name: 'Password' }).fill(config.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // Wait for successful login redirects
    await page.waitForURL(/.*callback\.html.*/, { timeout: 30000 });
    console.log('Reached callback page');
    
    await page.waitForURL(/.*Index\.html#\/home.*/, { timeout: 30000 });
    console.log('Reached home page');

    // Store authenticated state
    await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
