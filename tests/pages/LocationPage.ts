import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LocationPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async saveAndNavigateToAULocation() {
        console.log('Saving Location and navigating to AU Location...');
        const saveButton = this.page.getByRole('button', { name: 'Save' });
        await this.clickAndWaitForNavigation(saveButton, /.*\/AULocation/);
        console.log('Successfully navigated to AU Location page');
    }
}
