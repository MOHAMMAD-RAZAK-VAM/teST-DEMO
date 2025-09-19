import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class TruckPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async fillVehicleDetails(details: {
        year: string;
        make: string;
        model: string;
        vin: string;
        originalCost: string;
        statedAmount: string;
    }) {
        console.log('Filling vehicle details...');

        // Fill Year
        const yearInput = this.page.getByRole('textbox', { name: 'Year' });
        await this.fillField(yearInput, details.year);

        // Fill Make
        const makeInput = this.page.getByRole('textbox', { name: 'Make' });
        await this.fillField(makeInput, details.make);

        // Fill Model
        const modelInput = this.page.getByRole('textbox', { name: 'Model' });
        await this.fillField(modelInput, details.model);

        // Fill VIN
        const vinInput = this.page.getByRole('textbox', { name: 'Vehicle Identification Number' });
        await this.fillField(vinInput, details.vin);

        // Fill Original Cost
        const costInput = this.page.getByRole('textbox', { name: 'Original Cost New of Vehicle' });
        await this.fillField(costInput, details.originalCost);

        // Fill Stated Amount
        const statedAmountInput = this.page.getByRole('textbox', { name: 'Stated Amount' });
        await this.fillField(statedAmountInput, details.statedAmount);
    }

    async selectClassifications() {
        console.log('Selecting vehicle classifications...');

        // Select Vehicle Classification
        const primaryClass = this.page.getByRole('textbox', { name: 'Select Vehicle Classification' });
        await this.fillField(primaryClass, 'l');
        await this.page.waitForTimeout(1000);
        await this.page.keyboard.press('ArrowUp');
        await this.page.keyboard.press('Enter');

        // Select Secondary Classification
        const secondaryClass = this.page.getByRole('textbox', { name: 'Secondary Vehicle Classification' });
        await this.fillField(secondaryClass, 'k');
        await this.page.waitForTimeout(1000);
        await this.page.keyboard.press('ArrowDown');
        await this.page.keyboard.press('Enter');
    }

    async saveAndProceed() {
        console.log('Saving and proceeding from Truck page...');
        const saveButton = this.page.getByRole('button', { name: 'Save' });
        await this.clickAndWaitForNavigation(saveButton, /.*\/RiskSummary/);
    }
}
