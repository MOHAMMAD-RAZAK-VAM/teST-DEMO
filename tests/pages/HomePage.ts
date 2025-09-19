import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private searchTypeCombobox = this.page.locator('select.form-control');
    private searchInput = this.page.getByRole('textbox', { name: /Search By/i });
    private searchButton = this.page.getByRole('button', { name: /Search/i });
    private resultsTable = this.page.getByRole('table');
    private hamburgerMenu = this.page.locator('#hamburger');
    private customerAccountsLink = this.page.getByRole('link', { name: 'Customer Accounts' });
    private quotesLink = this.page.getByRole('link', { name: 'Quotes' });

    async waitForPageLoad() {
        await this.searchTypeCombobox.waitFor({ state: 'visible', timeout: 15000 });
        console.log('Home page loaded - search combobox visible');
    }

    async changeSearchType(type: 'Customer Account Name' | 'Quote ID') {
        console.log(`Changing search type to: ${type}`);
        
        // Wait for any loading to complete
        await this.page.waitForFunction(() => !document.body.classList.contains('pace-running'), { timeout: 10000 })
            .catch(() => console.log('Initial loading state already completed'));
        
        // Wait for and click the dropdown
        await this.searchTypeCombobox.waitFor({ state: 'visible', timeout: 10000 });
        await this.searchTypeCombobox.click();
        
        // Use the select element directly
        await this.page.selectOption('select.form-control', type);
        
        // Wait for the change to take effect
        await this.page.waitForFunction(
            ([expectedType, selector]) => {
                const select = document.querySelector(selector);
                return select instanceof HTMLSelectElement && select.value === expectedType;
            },
            [type, 'select.form-control'],
            { timeout: 10000 }
        );
        
        console.log(`Search type changed to: ${type}`);
        
        // Wait a moment for the UI to update
        await this.page.waitForTimeout(1000);
    }

    private async waitForLoadingComplete(timeout = 30000) {
        try {
            await this.page.waitForFunction(
                () => !document.body.classList.contains('pace-running'),
                { timeout }
            );
        } catch (e) {
            console.log('Loading state check completed or timed out');
        }
    }

    private async retryClick(locator: any, maxAttempts = 3) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await locator.waitFor({ state: 'visible', timeout: 30000 });
                await this.page.waitForTimeout(1000); // Stability wait
                await locator.click({ timeout: 30000 });
                return true;
            } catch (error) {
                if (error instanceof Error) {
                    console.log(`Click attempt ${attempt} failed: ${error.message}`);
                } else {
                    console.log(`Click attempt ${attempt} failed with unknown error`);
                }
                if (attempt === maxAttempts) throw error;
                await this.page.waitForTimeout(1000); // Wait before retry
            }
        }
        return false;
    }

    async searchByText(searchText: string) {
        console.log(`Starting search for: ${searchText}`);
        
        try {
            // Wait for and interact with search input
            await this.searchInput.waitFor({ state: 'visible', timeout: 30000 });
            await this.searchInput.clear();
            await this.searchInput.fill(searchText);
            console.log('Search text entered');
            
            // Wait for any initial loading to complete
            await this.waitForLoadingComplete();
            
            // Try to click the search button with retries
            console.log('Attempting to click search button');
            await this.retryClick(this.searchButton);
            console.log('Search button clicked successfully');
            
            // Wait for search results loading to complete
            await this.waitForLoadingComplete();
            console.log('Search completed');
            
        } catch (error) {
            console.error('Search operation failed:', error);
            throw error;
        }
    }

    async verifySearchResults(expectedText: string) {
        console.log(`Verifying results contain: ${expectedText}`);
        
        // Wait for results with increased timeout
        await this.resultsTable.waitFor({ state: 'visible', timeout: 30000 });
        
        // Wait for loading to finish
        await this.waitForLoadingComplete();
        
        console.log('Table content loaded, checking for expected text');
        
        await expect(this.resultsTable).toContainText(new RegExp(expectedText, 'i'), {
            timeout: 30000
        });
        
        console.log('Results verified successfully');
    }

    async navigateToCustomerAccounts() {
        console.log('Attempting to navigate to Customer Accounts');
        
        // Wait for any initial loading to complete
        await this.page.waitForSelector('body:not(.pace-running)', { timeout: 60000 });
        
        // Wait for and click hamburger menu
        await expect(this.hamburgerMenu).toBeVisible({ timeout: 60000 });
        await expect(this.hamburgerMenu).toBeEnabled({ timeout: 60000 });
        await this.hamburgerMenu.click();
        
        // Wait for loading and click Customer Accounts link
        await this.page.waitForSelector('body:not(.pace-running)', { timeout: 60000 });
        await expect(this.customerAccountsLink).toBeVisible({ timeout: 10000 });
        await this.customerAccountsLink.click();
        
        // Verify navigation
        await expect(this.page).toHaveURL(/Index\.html#\/accounts/);
        await this.page.waitForSelector('body:not(.pace-running)', { timeout: 60000 });
        
        // Verify we're on the right page
        await expect(this.page.getByRole('heading', { name: /Customer Accounts/i }))
            .toBeVisible({ timeout: 60000 });
        
        // Small delay for stability
        await this.page.waitForTimeout(500);
        
        console.log('Successfully navigated to Customer Accounts page');
    }

    async navigateToQuotes() {
        console.log('Attempting to navigate to Quotes');
        
        // Wait for any initial loading to complete
        await this.page.waitForSelector('body:not(.pace-running)', { timeout: 60000 });
        
        // Wait for and click hamburger menu
        await expect(this.hamburgerMenu).toBeVisible({ timeout: 60000 });
        await expect(this.hamburgerMenu).toBeEnabled({ timeout: 60000 });
        await this.hamburgerMenu.click();
        
        // Wait for loading and click Quotes link
        await this.page.waitForSelector('body:not(.pace-running)', { timeout: 60000 });
        await expect(this.quotesLink).toBeVisible({ timeout: 10000 });
        await this.quotesLink.click();
        
        // Verify navigation
        await expect(this.page).toHaveURL(/Index\.html#\/quotes/);
        await this.page.waitForSelector('body:not(.pace-running)', { timeout: 60000 });
        
        // Verify we're on the right page
        await expect(this.page.getByRole('heading', { name: /Quotes/i }))
            .toBeVisible({ timeout: 60000 });
        
        // Small delay for stability
        await this.page.waitForTimeout(500);
        
        console.log('Successfully navigated to Quotes page');
    }

    async navigateToNewQuote() {
        console.log('Navigating to create new quote...');
        
        // First navigate to quotes page
        await this.navigateToQuotes();
        
        // Look for and click "New Quote" button
        // Try different possible selectors for the New Quote button
        const newQuoteButton = this.page.getByRole('button', { name: /New Quote/i })
            .or(this.page.getByRole('link', { name: /New Quote/i }))
            .or(this.page.locator('button:has-text("New Quote")'))
            .or(this.page.locator('a:has-text("New Quote")'))
            .or(this.page.locator('[data-testid*="new-quote"]'))
            .or(this.page.locator('#new-quote-btn'));
        
        await expect(newQuoteButton).toBeVisible({ timeout: 10000 });
        await newQuoteButton.click();
        
        // Wait for navigation to new quote page
        await this.page.waitForLoadState('networkidle', { timeout: 30000 });
        
        console.log('Successfully navigated to new quote creation page');
    }
}
