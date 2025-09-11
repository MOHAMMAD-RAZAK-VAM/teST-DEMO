import { Page, Locator } from '@playwright/test';

export class BasePage {
    protected readonly page: Page;

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
    protected async waitForElement(elementOrSelector: Locator | string, options?: { timeout?: number, message?: string }) {
        const timeout = options?.timeout || 10000;
        const message = options?.message || `Waiting for element: ${typeof elementOrSelector === 'string' ? elementOrSelector : 'locator'}`;
        console.log(message);
        
        if (typeof elementOrSelector === 'string') {
            await this.page.waitForSelector(elementOrSelector, { state: 'visible', timeout });
            return this.page.locator(elementOrSelector);
        } else {
            await elementOrSelector.waitFor({ state: 'visible', timeout });
            return elementOrSelector;
        }
    }

    /**
     * Fill a field with text, with optional typing delay
     */
    protected async fillField(elementOrSelector: Locator | string, value: string, options = { delay: 100 }) {
        const element = await this.waitForElement(elementOrSelector);
        console.log(`Filling field with value: ${value}`);
        await element.click();
        await element.fill('');
        for (const char of value) {
            await element.type(char, { delay: options.delay });
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
    protected async clickElement(elementOrSelector: Locator | string, options?: { timeout?: number, message?: string }) {
        const timeout = options?.timeout || 10000;
        const message = options?.message || `Clicking element: ${typeof elementOrSelector === 'string' ? elementOrSelector : 'locator'}`;
        console.log(message);
        
        const element = await this.waitForElement(elementOrSelector, { timeout });
        await element.click();
        return element;
    }

    /**
     * Wait for loading to complete
     */
    protected async waitForLoading() {
        console.log('Waiting for loading to complete...');
        const loader = this.page.locator('.loader-overlay');
        if (await loader.isVisible()) {
            await loader.waitFor({ state: 'hidden', timeout: 30000 });
        }
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Handle sweet alert dialog
     */
    protected async handleAlert(action: 'accept' | 'dismiss' = 'accept') {
        console.log(`Handling alert - ${action}...`);
        const alert = this.page.locator('.sweet-alert.showSweetAlert.visible');
        await this.waitForElement(alert);
        const button = alert.locator(action === 'accept' ? 'button.confirm' : 'button.cancel');
        await button.click();
        await alert.waitFor({ state: 'hidden' });
    }

    /**
     * Click element and wait for navigation
     */
    protected async clickAndWaitForNavigation(elementOrSelector: Locator | string, expectedUrl: string | RegExp) {
        console.log(`Clicking and waiting for navigation to: ${expectedUrl}`);
        const element = await this.waitForElement(elementOrSelector);
        await Promise.all([
            this.page.waitForURL(expectedUrl, { timeout: 30000 }),
            element.click()
        ]);
    }
}
