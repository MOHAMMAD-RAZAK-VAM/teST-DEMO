import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class RiskSummaryPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async proceedToEndorsement() {
        console.log('Proceeding to Endorsement from Risk Summary...');
        const proceedButton = this.page.getByRole('button', { name: 'Proceed to Endorsement' });
        await this.clickAndWaitForNavigation(proceedButton, /.*\/AutoEndorsements/);
    }
}
