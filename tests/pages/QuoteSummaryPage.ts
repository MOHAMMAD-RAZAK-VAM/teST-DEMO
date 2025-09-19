import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class QuoteSummaryPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async generateQuotePremium() {
        console.log('Generating Quote Premium...');
        
        // Try to find the Generate Quote Premium button
        const generateButton = this.page.getByRole('button', { name: 'Generate Quote Premium' });
        
        try {
            await this.waitForElement(generateButton);
        } catch {
            // If button not found, refresh and try again
            console.log('Generate Quote Premium button not found, refreshing page...');
            await this.page.reload();
            await this.waitForPageReady();
            await this.waitForElement(generateButton);
        }

        // Click the button and wait for loading to complete
        await generateButton.click();
        await this.page.waitForLoadState('networkidle');
        console.log('Quote Premium generated successfully');
    }
}
