import { Page } from '@playwright/test';

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
    async waitForElement(selector: string, options?: { timeout?: number, message?: string }) {
        const timeout = options?.timeout || 10000;
        const message = options?.message || `Waiting for element: ${selector}`;
        console.log(message);
        await this.page.waitForSelector(selector, { state: 'visible', timeout });
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
    async clickElement(selector: string, options?: { timeout?: number, message?: string }) {
        const timeout = options?.timeout || 10000;
        const message = options?.message || `Clicking element: ${selector}`;
        console.log(message);
        await this.waitForElement(selector, { timeout });
        await this.page.click(selector);
    }
}
