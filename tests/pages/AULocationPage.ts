import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AULocationPage extends BasePage {
    private readonly truckTab: Locator;
    private readonly limitsButton: Locator;
    private readonly limitDropdown: Locator;
    private readonly saveButton: Locator;
    private readonly proceedButton: Locator;

    constructor(page: Page) {
        super(page);
        
        // Initialize Locators
        this.truckTab = page.getByRole('tab', { name: 'Truck' });
        this.limitsButton = page.getByRole('button', { name: 'Limits & Deductibles' });
        this.limitDropdown = page.locator('select[name="Limit"]');
        this.saveButton = page.getByRole('button', { name: 'Save' });
        this.proceedButton = page.getByRole('button', { name: 'Proceed to Automobile Exposure' });
    }

    async configureAutomobileCoverage(options: {
        limit: string;
        basicEco: boolean;
        collision: boolean;
        otherThanCollision: boolean;
        additionalPIP: boolean;
        pipCoverage: string;
        pipOption: string;
    }) {
        console.log('Configuring Automobile Coverage...');
        
        // Click Truck tab
        await this.clickElement(this.truckTab);
        
        // Click Limits & Deductibles
        await this.clickElement(this.limitsButton);

        // Set limit
        await this.waitForElement(this.limitDropdown);
        await this.limitDropdown.selectOption(options.limit);

        // Configure coverages
        if (options.basicEco) {
            await this.configureCoverage('Basic Eco', true);
        }
        if (options.collision) {
            await this.configureCoverage('Collision', true);
        }
        if (options.otherThanCollision) {
            await this.configureCoverage('Other than Collision', true);
        }
        if (options.additionalPIP) {
            await this.configureCoverage('Additional Personal Injury Protection Applies', true);
            await this.configureCoverage('Added Personal Injury Coverage', options.pipCoverage);
            await this.configureCoverage('Added Personal Injury Protection Option', options.pipOption);
        }

        // Save changes
        await this.clickElement(this.saveButton);

        // Handle alert
        await this.handleAlert('accept');
    }

    private async configureCoverage(name: string, value: boolean | string) {
        console.log(`Configuring coverage: ${name} = ${value}`);
        const section = this.page.locator('.coverage-section', {
            has: this.page.getByText(name)
        });
        
        if (typeof value === 'boolean') {
            const checkbox = section.locator('input[type="checkbox"]');
            await checkbox.setChecked(value);
        } else {
            const dropdown = section.locator('select');
            await dropdown.selectOption(value);
        }
    }

    async proceedToAutomobileExposure() {
        console.log('Proceeding to Automobile Exposure...');
        await this.clickAndWaitForNavigation(this.proceedButton, /.*\/Truck/);

        // Handle the Add Vehicle popup
        const addVehicleButton = this.page.getByRole('button', { name: 'Add Vehicle' });
        await this.clickElement(addVehicleButton);
    }
}
