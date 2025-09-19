import { Page, Locator } from '@playwright/test';

export class BasePage {
    protected page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Wait for page load and network idle
     */
    async waitForPageReady() {
        console.log('Waiting for page to be ready...');
        await this.page.waitForLoadState('networkidle');
        console.log('Page is ready');
    }

    /**
     * Wait for element to be visible and clickable
     */
    async waitForElement(selector: string | Locator, options?: { timeout?: number, message?: string }) {
        const timeout = options?.timeout || 10000;
        const message = options?.message || `Waiting for element`;
        console.log(message);
        
        if (typeof selector === 'string') {
            await this.page.waitForSelector(selector, { state: 'visible', timeout });
        } else {
            await selector.waitFor({ state: 'visible', timeout });
        }
    }

    /**
     * Wait for URL to match exact or pattern
     */
    async waitForUrl(url: string | RegExp, options?: { timeout?: number }) {
        const timeout = options?.timeout || 30000;
        console.log(`Waiting for URL: ${url}`);
        await this.page.waitForURL(url, { timeout });
        console.log(`Successfully navigated to: ${this.page.url()}`);
    }

    /**
     * Click element with retry logic
     */
    async clickElement(selector: string | Locator, options?: { timeout?: number, message?: string }) {
        const timeout = options?.timeout || 10000;
        const message = options?.message || `Clicking element`;
        console.log(message);
        
        await this.waitForElement(selector, { timeout });
        
        if (typeof selector === 'string') {
            await this.page.click(selector);
        } else {
            await selector.click();
        }
    }

    /**
     * Handle browser alert dialogs
     */
    async handleAlert(action: 'accept' | 'dismiss' = 'accept') {
        console.log(`Handling alert with action: ${action}`);
        this.page.on('dialog', async dialog => {
            console.log(`Alert message: ${dialog.message()}`);
            if (action === 'accept') {
                await dialog.accept();
            } else {
                await dialog.dismiss();
            }
        });
    }

    /**
     * Click element and wait for navigation
     */
    async clickAndWaitForNavigation(selector: string | Locator, expectedUrl?: string | RegExp, options?: { timeout?: number }) {
        const timeout = options?.timeout || 30000;
        console.log(`Clicking element and waiting for navigation to: ${expectedUrl || 'any URL'}`);
        
        await Promise.all([
            this.page.waitForLoadState('networkidle', { timeout }),
            typeof selector === 'string' 
                ? this.page.click(selector)
                : selector.click()
        ]);
        
        if (expectedUrl) {
            await this.waitForUrl(expectedUrl, { timeout });
        }
        
        console.log('Navigation completed');
    }

    /**
     * Fill form field with value
     */
    async fillField(selector: string | Locator, value: string, options?: { timeout?: number, clear?: boolean }) {
        const timeout = options?.timeout || 10000;
        const shouldClear = options?.clear !== false; // default to true
        
        console.log(`Filling field with value: ${value}`);
        
        await this.waitForElement(selector, { timeout });
        
        if (typeof selector === 'string') {
            if (shouldClear) {
                await this.page.fill(selector, '');
            }
            await this.page.fill(selector, value);
        } else {
            if (shouldClear) {
                await selector.fill('');
            }
            await selector.fill(value);
        }
        
        console.log(`Field filled with: ${value}`);
    }
}
