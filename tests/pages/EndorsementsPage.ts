import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class EndorsementsPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async proceedToQuoteSummary() {
        console.log('Proceeding to Quote Summary from Endorsements...');
        const proceedButton = this.page.getByRole('button', { name: 'Proceed to Endorsement' });
        await this.clickAndWaitForNavigation(proceedButton, /.*\/AUQuoteSummary/);
    }
}
