import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AccountsPage extends BasePage {
    // Form inputs with multiple selector strategies
    private zipCodeInput = this.page.locator([
        'input#zipdisable',
        'input[name="ZipId"][maxlength="5"]',
        'input[ng-model="selectedcols"][numbers-only]'
    ].join(', ')).first();

    private stateSelect = this.page.locator([
        'select#statedisable',
        'select[ng-model="selectedOption"][ng-change="onstatechange(selectedOption)"]'
    ].join(', ')).first();

    private citySelect = this.page.locator([
        'select#citydisabled',
        'select[name="singleSelect"][ng-model="selectedCityOption"]'
    ].join(', ')).first();

    private accountNameInput = this.page.locator([
        'input#custAccNameText',
        'input[ng-model="AccountNameText"].form-control'
    ].join(', ')).first();

    private accountIdInput = this.page.locator([
        'input#custAccIdText',
        'input[ng-model="AccountIdText"].form-control'
    ].join(', ')).first();

    private filterButton = this.page.locator([
        'button#accountsearchfilterbutton',
        'button[ng-click*="filtersearch(selectedcols,selectedOption,selectedCityOption)"]'
    ].join(', ')).first();

    private resultsTable = this.page.locator('table.table-striped.table-hover');
    private noRecordsMessage = this.page.locator('tr th[ng-show="noRecords"]');

    async waitForPageLoad() {
        console.log('Waiting for Customer Accounts page to load...');
        
        try {
            // Wait for URL to match
            await this.page.waitForURL(/Index\.html#\/accounts/, { timeout: 60000 });
            console.log('URL matched for Customer Accounts page');

            // Wait for loading overlay to disappear
            await this.page.waitForSelector('body:not(.pace-running)', { timeout: 60000 });
            console.log('Loading overlay disappeared');

            // Wait for Angular to finish loading
            await this.page.waitForSelector('.ng-scope', { state: 'attached', timeout: 60000 });
            console.log('Angular bindings initialized');

            // Wait for form elements to be ready
            await Promise.all([
                this.zipCodeInput.waitFor({ state: 'visible', timeout: 60000 }),
                this.stateSelect.waitFor({ state: 'visible', timeout: 60000 }),
                this.filterButton.waitFor({ state: 'visible', timeout: 60000 })
            ]);
            console.log('Form elements are visible');

            // Wait for state dropdown to be populated
            await this.page.waitForSelector('select#statedisable option.ng-scope', {
                state: 'attached',
                timeout: 60000
            });
            console.log('State dropdown populated');

            // Wait for network idle to ensure all Angular bindings are ready
            await this.page.waitForLoadState('networkidle', { timeout: 60000 });
            console.log('Network is idle');

            // Small delay for Angular digest cycle
            await this.page.waitForTimeout(1000);

            console.log('Customer Accounts page fully loaded');
        } catch (error) {
            console.error('Failed while waiting for page load:', error.message);
            throw error;
        }
    }

    async fillFilterForm(filterData: {
        zipCode?: string;
        state?: string;
        city?: string;
        accountName?: string;
        accountId?: string;
    }) {
        console.log('Filling filter form with provided data');
        
        // Initial page load wait
        await this.waitForPageLoad();
        await this.waitForLoadingComplete();

        // Helper function for filling inputs with retry
        const fillInput = async (locator: any, value: string, label: string) => {
            console.log(`Attempting to fill ${label} with: ${value}`);
            try {
                await locator.waitFor({ state: 'visible', timeout: 60000 });
                await locator.clear();
                await locator.fill(value);
                console.log(`Successfully filled ${label}`);
            } catch (error) {
                console.error(`Failed to fill ${label}:`, error.message);
                throw error;
            }
        };

        // Helper function for selecting options with retry
        const selectOption = async (locator: any, value: string, label: string) => {
            console.log(`Attempting to select ${label}: ${value}`);
            try {
                await locator.waitFor({ state: 'visible', timeout: 60000 });
                await locator.selectOption(value);
                await this.waitForLoadingComplete();
                console.log(`Successfully selected ${label}`);
            } catch (error) {
                console.error(`Failed to select ${label}:`, error.message);
                throw error;
            }
        };

        try {
            // Fill form fields in order
            if (filterData.zipCode) {
                await fillInput(this.zipCodeInput, filterData.zipCode, 'Zip Code');
            }

            if (filterData.state) {
                await selectOption(this.stateSelect, filterData.state, 'State');
                // Extra wait for city dropdown to update
                await this.page.waitForTimeout(1000);
            }

            if (filterData.city) {
                await selectOption(this.citySelect, filterData.city, 'City');
            }

            if (filterData.accountName) {
                await fillInput(this.accountNameInput, filterData.accountName, 'Account Name');
            }

            if (filterData.accountId) {
                await fillInput(this.accountIdInput, filterData.accountId, 'Account ID');
            }

            console.log('Successfully filled all form fields');
        } catch (error) {
            console.error('Failed to fill filter form:', error.message);
            throw error;
        }
    }
    waitForLoadingComplete() {
        throw new Error('Method not implemented.');
    }

    async applyFilter() {
        console.log('Applying filter...');
        // Wait for any previous operations to complete
        await this.waitForLoadingComplete();
        
        // Wait for filter button and ensure it's clickable
        await this.filterButton.waitFor({ state: 'visible' });
        await this.page.waitForTimeout(2000); // Wait for form values to settle
        
        // Click filter and wait for results
        await this.filterButton.click();
        await this.waitForLoadingComplete();
        
        // Wait for results to update
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(3000);
        console.log('Filter applied');
    }

    async verifyFilterResults(expectedData?: {
        zipCode?: string;
        state?: string;
        city?: string;
        accountName?: string;
        accountId?: string;
    }) {
        console.log('Verifying filter results...');
        
        // Wait for any loading to complete
        await this.waitForLoadingComplete();
        await this.page.waitForLoadState('networkidle', { timeout: 30000 });
        
        // Wait for table visibility with increased timeout
        await this.resultsTable.waitFor({ state: 'visible', timeout: 60000 });
        
        // Check for "No records" message
        const noRecordsVisible = await this.noRecordsMessage.isVisible();
        if (noRecordsVisible) {
            console.log('No records found in the results');
            return;
        }

        // Wait for actual results to be present and stable
        await this.page.waitForTimeout(2000); // Wait for results to stabilize
        const resultsRow = this.page.locator('tr.ng-scope').first();
        await resultsRow.waitFor({ state: 'visible', timeout: 60000 });

        if (expectedData) {
            console.log('Verifying result matches filter criteria...');

            if (expectedData.accountName) {
                const nameCell = resultsRow.locator('td span.ng-binding').first();
                await nameCell.waitFor({ state: 'visible', timeout: 30000 });
                const actualName = await nameCell.textContent();
                console.log('Found account name:', actualName?.trim());
                expect(actualName?.trim()).toBe(expectedData.accountName);
                console.log('Account name verified:', actualName);
            }

            if (expectedData.accountId) {
                const idCell = resultsRow.locator('td span.ng-binding').nth(1);
                await idCell.waitFor({ state: 'visible', timeout: 30000 });
                const actualId = await idCell.textContent();
                console.log('Found account ID:', actualId?.trim());
                expect(actualId?.trim()).toBe(expectedData.accountId);
                console.log('Account ID verified:', actualId);
            }

            if (expectedData.zipCode || expectedData.city || expectedData.state) {
                const addressCell = resultsRow.locator('td.ng-binding').last();
                const addressText = await addressCell.textContent();
                const cleanAddress = addressText?.trim() || '';
                console.log('Found address:', cleanAddress);

                if (expectedData.city) {
                    expect(cleanAddress).toContain(expectedData.city);
                    console.log('City verified in address');
                }
                if (expectedData.state) {
                    expect(cleanAddress).toContain(expectedData.state);
                    console.log('State verified in address');
                }
                if (expectedData.zipCode) {
                    expect(cleanAddress).toContain(expectedData.zipCode);
                    console.log('Zip code verified in address');
                }
            }
        }
        
        console.log('Filter results verification completed successfully');
    }
}
