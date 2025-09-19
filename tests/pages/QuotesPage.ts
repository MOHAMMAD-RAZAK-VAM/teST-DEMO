import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { HomePage } from '../HomePage';

export interface QuoteFilterData {
    products?: string[];
    quoteId?: string;
    state?: string;
    status?: string[];
    dateType?: 'Policy Effective Date' | 'Transaction Date';
    fromDate?: string;
    toDate?: string;
    agencyName?: string;
    currentlyAssignedTo?: string;
    underwriterOnFile?: string;
}

export class QuotesPage extends BasePage {
    private homePage: HomePage;

    constructor(page: Page) {
        super(page);
        this.homePage = new HomePage(page);
    }

    async navigateToQuotes() {
        console.log('Starting navigation to Quotes page...');
        await this.homePage.navigateToQuotes();
        console.log('Successfully navigated to Quotes page');
    }

    async fillFilterForm(filterData: QuoteFilterData) {
        console.log('Filling quote filter form with data:', filterData);

        // Select Products
        if (filterData.products) {
            for (const product of filterData.products) {
                const checkbox = this.page.locator('label.css-label', { hasText: product })
                    .or(this.page.locator(`input[type="checkbox"][name="selectedProcuts[]"] + label`, { hasText: product }));
                await checkbox.click();
            }
        }

        // Fill Quote ID
        if (filterData.quoteId) {
            await this.page.locator('#quoteIdText').fill(filterData.quoteId);
        }

        // Select State
        if (filterData.state) {
            await this.page.locator('select[ng-model="filterSearchCriteria.selectedState"]').selectOption(filterData.state);
        }

        // Select Status
        if (filterData.status && filterData.status.length > 0) {
            // Click status dropdown to open
            await this.page.locator('button.dropdown-toggle').click();
            
            // Select each status
            for (const status of filterData.status) {
                const statusCheckbox = this.page.locator('.dropdown-menu label', { hasText: status });
                await statusCheckbox.click();
            }
            
            // Close dropdown by clicking outside
            await this.page.locator('body').click();
        }

        // Select Date Type and Dates
        if (filterData.dateType) {
            await this.page.locator('#Id_selectDate').selectOption(filterData.dateType);
            
            if (filterData.fromDate) {
                await this.page.locator('input[data-ng-model="filterSearchCriteria.fromDate1"]').fill(filterData.fromDate);
            }
            
            if (filterData.toDate) {
                await this.page.locator('input[data-ng-model="filterSearchCriteria.toDate1"]').fill(filterData.toDate);
            }
        }

        // Fill Agency Name if provided
        if (filterData.agencyName) {
            await this.page.locator('#id_agency_name').fill(filterData.agencyName);
            // Wait for and select from typeahead if needed
            await this.page.waitForTimeout(1000);
        }

        // Fill Currently Assigned To if provided
        if (filterData.currentlyAssignedTo) {
            await this.page.locator('#Id_agency_assigned').fill(filterData.currentlyAssignedTo);
            await this.page.waitForTimeout(1000);
        }

        // Fill Underwriter on File if provided
        if (filterData.underwriterOnFile) {
            await this.page.locator('#Id_agency_uwfile').fill(filterData.underwriterOnFile);
            await this.page.waitForTimeout(1000);
        }
    }

    async applyFilter() {
        console.log('Applying quote filter...');
        await this.page.locator('button.btn-blue:not([disabled])').click();
        await this.page.waitForLoadState('networkidle');
    }

    async resetFilter() {
        console.log('Resetting quote filter...');
        await this.page.locator('a.vam-MR15', { hasText: 'Reset' }).click();
        await this.page.waitForLoadState('networkidle');
    }

    async verifyFilterResults(filterData: QuoteFilterData) {
        console.log('Verifying filter results...');
        
        // Wait for loading to complete
        await this.page.waitForSelector('.pace-running', { state: 'hidden', timeout: 30000 })
            .catch(() => console.log('Loading indicator not found or already hidden'));

        // Get the results table using row content
        const resultsTable = this.page.locator('table:has(tr:has-text("Customer Account Name"):has-text("Quote ID"):has-text("Status"))');

        // Verify Quote ID in results
        if (filterData.quoteId) {
            console.log(`Verifying Quote ID: ${filterData.quoteId}`);
            await expect(resultsTable.getByText(filterData.quoteId, { exact: true }))
                .toBeVisible({ timeout: 10000 });
        }

        // Verify State in results by checking the Customer Account Name column
        if (filterData.state) {
            console.log(`Verifying State: ${filterData.state}`);
            const stateCell = resultsTable
                .locator('td', { hasText: new RegExp(`Test ${filterData.state} state`) })
                .first();
            await expect(stateCell).toBeVisible({ timeout: 10000 });
        }

        // Verify Status if provided
        if (filterData.status && filterData.status.length > 0) {
            console.log(`Verifying Status: ${filterData.status[0]}`);
            // Find the status cell in the row containing our Quote ID
            const statusCell = resultsTable
                .locator(`tr:has(td:has-text("${filterData.quoteId}")) td:nth-child(8) span.vam-display-block.ng-binding`)
                .first();
            await expect(statusCell).toHaveText(filterData.status[0], { timeout: 10000 });
        }

        // Additional verification that the table contains data
        const rows = await resultsTable.locator('tbody tr').count();
        console.log(`Found ${rows} results in the table`);
        expect(rows).toBeGreaterThan(0);
    }

    async verifyQuotesPage() {
        console.log('Verifying Quotes page...');
        await expect(this.page).toHaveURL(/.*\/Index\.html#\/quotes/);
        console.log('URL verification successful');
    }
}
