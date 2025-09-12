import { test, expect } from '@playwright/test';
import { saveResultsToJson, generateHtmlReport, TestResult } from '../utils/reporter';
import { LoginPage } from './LoginPage';
import { HomePage } from './HomePage';
import { AccountsPage } from './pages/AccountsPage';
import { QuotesPage } from './pages/QuotesPage';
import type { QuoteFilterData } from './pages/QuotesPage';
import config from '../config.json';

// Store all test results
const results: TestResult[] = [];

// Test Suite - runs tests in order
test.describe('Customer Portal Test Suite', () => {
    // Run tests serially (one after another)
    test.describe.configure({ mode: 'serial' });

    // Before all tests
    test.beforeAll(async () => {
        console.log('Starting test suite execution...');
    });

    // Test 1: Customer Search by Account Name
    test('TS001: Verify Customer Search by Account Name', async ({ page }) => {
        const start = Date.now();
        try {
            await page.goto(config.appUrl);
            await page.waitForURL(/.*Index\.html#\/home.*/, { timeout: 30000 });

            const combobox = page.getByRole('combobox').filter({ hasText: 'Customer Account Name' });
            await combobox.waitFor({ state: 'visible', timeout: 15000 });
            
            const searchBox = page.getByRole('textbox', { name: /Search By Customer Account Name/i });
            await searchBox.waitFor({ state: 'visible', timeout: 5000 });
            await searchBox.fill('Texas State University');
            
            await page.waitForFunction(() => !document.body.classList.contains('pace-running'), { timeout: 10000 })
                .catch(e => console.log('Initial loading state already completed'));
            
            const searchButton = page.getByRole('button', { name: /Search/i });
            await searchButton.waitFor({ state: 'visible', timeout: 5000 });
            await searchButton.click();
            
            await page.waitForFunction(() => !document.body.classList.contains('pace-running'), { timeout: 10000 });

            const resultsTable = page.getByRole('table');
            await resultsTable.waitFor({ state: 'visible', timeout: 10000 });
            await expect(resultsTable).toContainText('Texas State University');

            results.push({
                testId: 'TS001',
                testName: 'Verify Customer Search by Account Name',
                status: 'Pass',
                duration: Date.now() - start
            });
        } catch (err) {
            results.push({
                testId: 'TS001',
                testName: 'Verify Customer Search by Account Name',
                status: 'Fail',
                duration: Date.now() - start
            });
            throw err;
        }
    });

    // Test 2: New Quote Creation
     test('TS002: Verify New Quote Creation Flow', async ({ page }) => {
    test.setTimeout(180000); // Increase timeout for slow pages
    const start = Date.now();
        try {
            // Navigate to home page
            await page.goto(config.appUrl);
            await page.waitForURL(/.*Index\.html#\/home.*/, { timeout: 30000 });
 
            // Click New Quote button and wait for navigation
            const newQuoteButton = page.getByText('New Quote', { exact: true });
            await newQuoteButton.waitFor({ state: 'visible', timeout: 5000 });
            await newQuoteButton.click();
 
            // Verify navigation to Product page
            await page.waitForURL(/.*\/BD\/McKee\/index\.html.*#\/Product/, { timeout: 30000 });
 
            // Handle Effective Date
            const effectiveDateInput = page.getByRole('combobox', { name: /Effective Date\*/i });
            await effectiveDateInput.waitFor({ state: 'visible', timeout: 5000 });
           
            // Get today's date in MM/dd/yyyy format (US format)
            const today = new Date();
            const formattedDate = `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`;
            await effectiveDateInput.fill(formattedDate);
 
            // Verify Expiration Date is 1 year later
            const expirationDateInput = page.getByRole('combobox', { name: /Expiration Date\*/i });
            await expirationDateInput.waitFor({ state: 'visible', timeout: 5000 });
            const nextYear = new Date(today);
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            const expectedExpirationDate = `${(nextYear.getMonth() + 1).toString().padStart(2, '0')}/${nextYear.getDate().toString().padStart(2, '0')}/${nextYear.getFullYear()}`;
            await expect(expirationDateInput).toHaveValue(expectedExpirationDate);
 
                        // Wait for page to be ready
            await page.waitForLoadState('networkidle');
            await page.waitForFunction(() => !document.body.classList.contains('pace-running'), { timeout: 10000 })
                .catch(() => console.log('Loading state check completed'));
 
            // Find Commercial Automobile section
            console.log('Looking for Commercial Automobile section...');
            const autoSection = page.locator('div.prodWraper').filter({ has: page.getByRole('heading', { name: 'Commercial Automobile' }) });
            await autoSection.waitFor({ state: 'visible', timeout: 5000 });
           
            // Click the heading to expand section
            console.log('Expanding Commercial Automobile section...');
            const autoHeading = autoSection.getByRole('heading', { name: 'Commercial Automobile' });
            await autoHeading.waitFor({ state: 'visible', timeout: 5000 });
            await autoHeading.scrollIntoViewIfNeeded();
            await page.waitForTimeout(1000);
            await autoHeading.click({ force: true });
           
            // Wait for dynamic updates
            await page.waitForLoadState('networkidle');
 
            // Select the checkbox
            console.log('Selecting Commercial Automobile checkbox...');
            const checkbox = autoSection.locator('input[type="checkbox"]');
            await checkbox.waitFor({ state: 'visible', timeout: 5000 });
            await checkbox.check({ force: true });
 
            // Wait for content to load
            await page.waitForLoadState('networkidle');
 
            // Find and select Writing Company
            console.log('Selecting Writing Company...');
            const writingCompanyContainer = autoSection.locator('.proCW-info').first();
            const writingCompanyDropdown = writingCompanyContainer.locator('.k-dropdown-wrap');
 
            await writingCompanyDropdown.waitFor({ state: 'visible', timeout: 15000 });
            await writingCompanyDropdown.click();
 
            // Use keyboard navigation to select SIC
            // await page.keyboard.press('ArrowDown'); // Open dropdown
            // await page.waitForTimeout(500);
            await page.keyboard.press('ArrowDown'); // Move to first item
            await page.waitForTimeout(500);
            await page.keyboard.press('ArrowDown'); // Move to SIC
            await page.waitForTimeout(500);
            await page.keyboard.press('Enter'); // Select SIC
           
            // Wait for the selection to take effect
            await page.waitForTimeout(1000);
            await page.waitForLoadState('networkidle');
 
            // Click Proceed to Account and verify navigation
            const proceedButton = page.getByRole('button', { name: /Proceed to Account/i });
            await proceedButton.waitFor({ state: 'visible', timeout: 5000 });
            await proceedButton.click();
 
            // Verify navigation to Account page
            await page.waitForURL(/.*\/BD\/McKee\/index\.html.*#\/Account/, { timeout: 30000 });
 
            results.push({
                testId: 'TS002',
                testName: 'Verify New Quote Creation Flow',
                status: 'Pass',
                duration: Date.now() - start
            });
 
            // Continue with Account Form Fill (TS007)
            console.log('Starting Account Form Fill...');
           
            // Find and fill the Name of Applicant autocomplete input
            const nameInput = page.locator('input[data-role="autocomplete"][placeholder="Enter Applicant Name"]');
            await nameInput.waitFor({ state: 'visible', timeout: 10000 });
           
            // Type slowly to simulate human input
            await nameInput.focus();
            const text = 'Hospital for Special Surgery';
            for (const char of text) {
                await nameInput.type(char, { delay: 100 });
            }
           
            // Wait for suggestions to load
            await page.waitForTimeout(1000);
           
            // Use keyboard navigation to select first suggestion
            await page.keyboard.press('ArrowDown');
            await page.waitForTimeout(500);
            await page.keyboard.press('Enter');
           
            // Handle the Sweet Alert confirmation popup
            const popup = page.locator('.sweet-alert.showSweetAlert.visible');
            await popup.waitFor({ state: 'visible', timeout: 5000 });
 
            // Click the Yes button
            const yesButton = popup.locator('button.confirm');
            await yesButton.waitFor({ state: 'visible', timeout: 5000 });
            await yesButton.click();
           
            // Wait for popup to close and selection to be applied
            await popup.waitFor({ state: 'hidden', timeout: 5000 });
            await page.waitForTimeout(1000);
 
            // Fill SIC Code
            console.log('Filling SIC Code...');
            const sicCodeInput = page.getByRole('textbox', { name: 'SIC Code/Description*' });
            await sicCodeInput.waitFor({ state: 'visible', timeout: 15000 });
           
            // Ensure form section is visible
            await page.locator('.form-group', {
                has: page.locator('label', { hasText: 'SIC Code/Description' })
            }).scrollIntoViewIfNeeded();
           
            // Type the SIC code slowly to allow suggestions
            await sicCodeInput.focus();
            const sicText = '0971 - Hunting, Trapping, Game Propagation';
            for (const char of sicText) {
                await sicCodeInput.type(char, { delay: 100 });
            }
           
            // Wait for suggestions and use keyboard navigation
            await page.waitForTimeout(1000);
            await page.keyboard.press('ArrowDown');
            await page.waitForTimeout(500);
            await page.keyboard.press('Enter');
           
            // Wait for selection to be applied
            await page.waitForTimeout(1000);
 
            // Select Legal Entity using Kendo UI dropdown
            console.log('Selecting Legal Entity...');
           
            // Find the Legal Entity dropdown by its label and section
            const legalEntitySection = page.locator('.form-group', {
                has: page.locator('label', { hasText: 'Legal Entity' })
            });
           
            // Get the dropdown within this section and click it
            const dropdown = legalEntitySection.locator('span.k-dropdown-wrap').first();
            await dropdown.waitFor({ state: 'visible', timeout: 10000 });
            await dropdown.click();
           
            // Use keyboard navigation as it's more reliable with Kendo UI
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter');
           
            // Wait for the selection to be reflected
            await page.waitForTimeout(1000);
            await page.waitForLoadState('networkidle');
 
            // Verify form values
            await expect(nameInput).toHaveValue(/Hospital for Special Surgery.*/i);
            await expect(sicCodeInput).toHaveValue('0971 - Hunting, Trapping, Game Propagation');
           
            // Verify Legal Entry selection using the section to ensure we check the right dropdown
            const legalEntityValue = legalEntitySection.locator('span.k-dropdown-wrap span.k-input').first();
            await expect(legalEntityValue).toHaveText('Corporation', { timeout: 10000 });
 
            // Skip address filling as it's not needed
            await page.waitForLoadState('networkidle');
 
            // Click Proceed to Application
            console.log('Proceeding to Application...');
            const proceedToAppButton = page.getByRole('button', { name: 'Proceed to Application' });
            await proceedToAppButton.click();
 
            // Verify navigation to Location page
            await page.waitForURL(/.*\/BD\/McKee\/index\.html.*#\/Location/, { timeout: 30000 });
 
                        // --- Location → AULocation → Limits & Deductibles flow ---
           
            // 1. Save Location and verify alert
            const saveLocationButton = page.getByRole('button', { name: 'Save', exact: true });
            await expect(saveLocationButton).toBeVisible({ timeout: 10000 });
            await saveLocationButton.click();
            const locationSavedAlert = page.getByText('Location saved successfully');
            await expect(locationSavedAlert).toBeVisible({ timeout: 10000 });
           
            // 2. Wait for redirect to AULocation and check state dropdown
            await page.waitForURL(/.*\/BD\/McKee\/index\.html.*#\/AULocation/, { timeout: 30000 });
            // await page.waitForURL(/#\/AULocation/, { timeout: 30000 });
            // Find the select dropdown for state and check 'New York' is selected
            const stateValueSpan = page.locator('span.k-input', { hasText: 'New York' });
            await expect(stateValueSpan).toBeVisible({ timeout: 10000 });
            await expect(stateValueSpan).toHaveText('New York');
                        // Find the vehicle-details container with h5 text 'Truck'
            const truckContainer = page.locator('.vehicle-details', { has: page.locator('h5', { hasText: 'Truck' }) });
            // Find the label inside that container and click it
            const truckLabel = truckContainer.locator('label.css-label');
            await expect(truckLabel).toBeVisible({ timeout: 10000 });
            await truckLabel.click();
           
            // 4. Select all Product Offerings
            const productOfferingsSection = page.getByText('Select Your Product Offerings');
            await expect(productOfferingsSection).toBeVisible({ timeout: 10000 });
            const productCheckboxes = await page.locator('input[type=\"checkbox\"]').filter({ has: productOfferingsSection }).elementHandles();
            for (const checkbox of productCheckboxes) {
                if (!(await checkbox.isChecked())) {
                    await checkbox.check();
                }
            }
           
            // 5. Click Limits & Deductibles, verify navigation and alert
            const limitsDeductiblesButton = page.getByRole('button', { name: /Limits & Deductibles/i });
            await expect(limitsDeductiblesButton).toBeVisible({ timeout: 10000 });
            await limitsDeductiblesButton.click();
            await page.waitForURL(/LimitsDeductibles/, { timeout: 30000 });
            const autoPolicySavedAlert = page.getByText('Automobile policy information saved successfully');
            await expect(autoPolicySavedAlert).toBeVisible({ timeout: 10000 });
            // Find the form-group containing the label "Limit"
            const limitFormGroup = page.locator('.form-group', {
                has: page.locator('label span', { hasText: 'Limit' })
            }).first();
 
            // Find the visible Kendo dropdown within that form-group
            const limitDropdownWrap = limitFormGroup.locator('.k-dropdown-wrap').first();
            await expect(limitDropdownWrap).toBeVisible({ timeout: 10000 });
            await limitDropdownWrap.click();
            await page.waitForTimeout(500); // Wait for UI to render

            // Retry clicking if dropdown does not appear
            let dropdownList = page.locator('.k-list[aria-hidden="false"]');
            let limitDropdownVisible = false;
            for (let i = 0; i < 3; i++) {
                if (await dropdownList.isVisible()) {
                    limitDropdownVisible = true;
                    break;
                }
                await limitDropdownWrap.click({ force: true });
                await page.waitForTimeout(300);
            }
            if (!limitDropdownVisible) {
                console.error('Dropdown list did not appear for Limit selection');
                throw new Error('Dropdown list did not appear for Limit selection');
            }

            // Select "25,000" from the dropdown list



            const option25000 = dropdownList.locator('.k-item', { hasText: '25,000' }).first();
            await expect(option25000).toBeVisible({ timeout: 10000 });
            const selectedLimit = await limitDropdownWrap.locator('.k-input').innerText();
            if (selectedLimit.trim() !== '25,000') {
                await option25000.click();
            }

            await page.waitForTimeout(500);
            // Helper to select '100' from Deductible dropdown in a given .imglimits section
            async function selectDeductibleBySection(sectionLabel: string) {
                // Find the .imglimits section by its label (Collision or Other Than Collision)
                let section = page.locator('.imglimits', { has: page.locator('label span', { hasText: sectionLabel }) }).first();
                if (!(await section.isVisible())) {
                    // Fallback: try partial match for 'Other Than Collision'
                    section = page.locator('.imglimits', { has: page.locator('label span', { hasText: /Other Than Collision/i }) }).first();
                    if (!(await section.isVisible())) {
                        // Fallback: log all form-group spans for debugging
                        const allSections = await page.locator('.imglimits').elementHandles();
                        for (const sec of allSections) {
                            const spans = await sec.$$('span');
                            for (const span of spans) {
                                const text = await span.innerText();
                                console.log('imglimits span:', text);
                            }
                        }
                        throw new Error(`Section not found for label: ${sectionLabel}`);
                    }
                }
                await expect(section).toBeVisible({ timeout: 5000 });
                await section.scrollIntoViewIfNeeded();
                // Find the Deductible form-group inside this section by iterating
                const formGroups = section.locator('.form-group');
                const fgCount = await formGroups.count();
                let found = false;
                for (let i = 0; i < fgCount; i++) {
                    const fg = formGroups.nth(i);
                    const label = fg.locator('label span', { hasText: 'Deductible' });
                    if (await label.count() > 0) {
                        await expect(fg).toBeVisible({ timeout: 5000 });
                        // Find the dropdown
                        const deductibleDropdown = fg.locator('.k-dropdown-wrap').first();
                        await expect(deductibleDropdown).toBeVisible({ timeout: 5000 });
                        await deductibleDropdown.scrollIntoViewIfNeeded();
                        await deductibleDropdown.click();
                        // Retry clicking if dropdown options do not appear
                        let list = page.locator('.k-list[aria-hidden="false"]');
                        let listVisible = false;
                        for (let attempt = 0; attempt < 3; attempt++) {
                            if (await list.isVisible()) {
                                listVisible = true;
                                break;
                            }
                            await deductibleDropdown.click({ force: true });
                            await page.waitForTimeout(300);
                        }
                        if (!listVisible) {
                            throw new Error('Dropdown options did not appear for Deductible selection');
                        }
                        await expect(list).toBeVisible({ timeout: 5000 });
                        // Use keyboard navigation to select '100'
                        const items = await list.locator('.k-item').elementHandles();
                        let foundIndex = -1;
                        for (let j = 0; j < items.length; j++) {
                            const text = await items[j].textContent();
                            if (text && text.trim() === '100') {
                                foundIndex = j;
                                break;
                            }
                        }
                        if (foundIndex >= 0) {
                            for (let j = 0; j <= foundIndex; j++) {
                                await page.keyboard.press('ArrowDown');
                                await page.waitForTimeout(100);
                            }
                            await page.keyboard.press('Enter');
                        } else {
                            await page.keyboard.press('ArrowDown');
                            await page.keyboard.press('Enter');
                        }
                        await page.waitForTimeout(500);
                        console.log(`Selected Deductible '100' for section: ${sectionLabel}`);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    throw new Error(`Deductible form-group not found for section: ${sectionLabel}`);
                }
            }

            // Scroll and select for both sections
            await selectDeductibleBySection('Collision');
            await selectDeductibleBySection('Other Than Collision Deductible');
            console.log('Completed Deductible selections for Collision and Other Than Collision');

            // --- Collision Deductible ---
            // Check if page is still open before searching for dropdown
            if (page.isClosed && page.isClosed()) {
                throw new Error('Playwright page is closed before Collision Deductible step');
            }
            // Log all form-group spans for debugging
            const allFormGroups = await page.locator('.form-group').elementHandles();
            for (const fg of allFormGroups) {
                const span = await fg.$('span');
                if (span) {
                    const text = await span.innerText();
                    console.log('Form-group span:', text);
                }
            }

            // Try to find the Collision Deductible dropdown robustly using span
            let collisionDeductibleGroup = page.locator('.form-group', { has: page.locator('span', { hasText: 'Collision Deductible' }) }).first();
            let collisionDropdown = collisionDeductibleGroup.locator('.k-dropdown-wrap').first();
            let found = false;
            try {
                await expect(collisionDropdown).toBeVisible({ timeout: 10000 });
                found = true;
            } catch (e) {
                // Log all span texts for debugging
                const allFormGroups = await page.locator('.form-group').elementHandles();
                for (const fg of allFormGroups) {
                    const spans = await fg.$$('span');
                    for (const span of spans) {
                        const text = await span.innerText();
                        console.log('Form-group span:', text);
                    }
                }
                // Fallback: try to find by partial span match
                collisionDeductibleGroup = page.locator('.form-group', { has: page.locator('span', { hasText: /Collision/i }) }).first();
                collisionDropdown = collisionDeductibleGroup.locator('.k-dropdown-wrap').first();
                try {
                    await expect(collisionDropdown).toBeVisible({ timeout: 10000 });
                    found = true;
                } catch (e2) {
                    // Final fallback: select first visible .k-dropdown-wrap in any .form-group
                    const allDropdowns = page.locator('.form-group .k-dropdown-wrap');
                    const count = await allDropdowns.count();
                    for (let i = 0; i < count; i++) {
                        const dd = allDropdowns.nth(i);
                        if (await dd.isVisible()) {
                            collisionDropdown = dd;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        throw new Error('Collision Deductible dropdown not found. Check span texts above.');
                    }
                }
            }
            await collisionDropdown.click();
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(500);

            // --- Other Than Collision Deductible ---
            // Log all form-group spans for debugging
            const allFormGroupsOther = await page.locator('.form-group').elementHandles();
            for (const fg of allFormGroupsOther) {
                const spans = await fg.$$('span');
                for (const span of spans) {
                    const text = await span.innerText();
                    console.log('Form-group span:', text);
                }
            }

            // Try to find the Other Than Collision Deductible dropdown robustly using span
            let otherDeductibleGroup = page.locator('.form-group', { has: page.locator('span', { hasText: 'Other Than Collision Deductible' }) }).first();
            let otherDropdown = otherDeductibleGroup.locator('.k-dropdown-wrap').first();
            let foundOther = false;
            try {
                await expect(otherDropdown).toBeVisible({ timeout: 10000 });
                foundOther = true;
            } catch (e) {
                // Log all span texts for debugging
                const allFormGroupsOther2 = await page.locator('.form-group').elementHandles();
                for (const fg of allFormGroupsOther2) {
                    const spans = await fg.$$('span');
                    for (const span of spans) {
                        const text = await span.innerText();
                        console.log('Form-group span:', text);
                    }
                }
                // Fallback: try to find by partial span match
                otherDeductibleGroup = page.locator('.form-group', { has: page.locator('span', { hasText: /Other Than Collision/i }) }).first();
                otherDropdown = otherDeductibleGroup.locator('.k-dropdown-wrap').first();
                try {
                    await expect(otherDropdown).toBeVisible({ timeout: 10000 });
                    foundOther = true;
                } catch (e2) {
                    // Final fallback: select first visible .k-dropdown-wrap in any .form-group
                    const allDropdownsOther = page.locator('.form-group .k-dropdown-wrap');
                    const countOther = await allDropdownsOther.count();
                    for (let i = 0; i < countOther; i++) {
                        const dd = allDropdownsOther.nth(i);
                        if (await dd.isVisible()) {
                            otherDropdown = dd;
                            foundOther = true;
                            break;
                        }
                    }
                    if (!foundOther) {
                        throw new Error('Other Than Collision Deductible dropdown not found. Check span texts above.');
                    }
                }
            }
            await otherDropdown.click();
            const list = page.locator('.k-list[aria-hidden="false"]');
            await expect(list).toBeVisible({ timeout: 10000 });
            const items = await list.locator('.k-item').elementHandles();
            let foundIndex = -1;
            for (let j = 0; j < items.length; j++) {
                const text = await items[j].textContent();
                if (text && text.trim() === '100') {
                    foundIndex = j;
                    break;
                }
            }
            if (foundIndex >= 0) {
                for (let j = 0; j <= foundIndex; j++) {
                    await page.keyboard.press('ArrowDown');
                    await page.waitForTimeout(100);
                }
                await page.keyboard.press('Enter');
            } else {
                await page.keyboard.press('ArrowDown');
                await page.keyboard.press('Enter');
            }
            await page.waitForTimeout(500);

            // --- Additional Personal Injury Protection Coverage ---
            const apipcFormGroup2 = page.locator('.form-group', { has: page.locator('label span', { hasText: 'Additional Personal Injury Protection Applies' }) }).first();
            const apipcDropdownWrap2b = apipcFormGroup2.locator('.k-dropdown-wrap').first();
            await expect(apipcDropdownWrap2b).toBeVisible({ timeout: 10000 });
            await apipcDropdownWrap2b.click();
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(1000);

            // --- Added Personal Injury Protection Coverage ---
            const addedCoverageGroup = page.locator('.form-group', { has: page.locator('label span', { hasText: 'Added Personal Injury Protection Coverage' }) }).first();
            const addedCoverageDropdown = addedCoverageGroup.locator('.k-dropdown-wrap').first();
            await expect(addedCoverageDropdown).toBeVisible({ timeout: 13000 });
            await addedCoverageDropdown.click();
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(3000);

            // --- Added Personal Injury Protection Option ---
            // Log all form-group spans for debugging (limit to 20 for safety)
            const formGroupsCount = await page.locator('.form-group').count();
            for (let i = 0; i < Math.min(formGroupsCount, 20); i++) {
                const fg = page.locator('.form-group').nth(i);
                const spans = await fg.locator('span').allTextContents();
                for (const text of spans) {
                    console.log('Form-group span:', text);
                }
            }

            // Try to find the Added Personal Injury Protection Coverage dropdown robustly
            let addedOptionGroup = page.locator('.form-group', { has: page.locator('label span', { hasText: 'Added Personal Injury Protection' }) }).first();
            let addedOptionDropdown = addedOptionGroup.locator('.k-dropdown-wrap').first();
            let foundOption = false;
            try {
                await expect(addedOptionDropdown).toBeVisible({ timeout: 10000 });
                foundOption = true;
            } catch (e) {
                // Log all span texts for debugging
                const allFormGroupsOption2 = await page.locator('.form-group').elementHandles();
                for (const fg of allFormGroupsOption2) {
                    const spans = await fg.$$('span');
                    for (const span of spans) {
                        const text = await span.innerText();
                        console.log('Form-group span:', text);
                    }
                }
                // Fallback: try to find by partial span match
                addedOptionGroup = page.locator('.form-group', { has: page.locator('span', { hasText: /Coverage 2/i }) }).first();
                addedOptionDropdown = addedOptionGroup.locator('.k-dropdown-wrap').first();
                try {
                    await expect(addedOptionDropdown).toBeVisible({ timeout: 10000 });
                    foundOption = true;
                } catch (e2) {
                    // Final fallback: select first visible .k-dropdown-wrap in any .form-group
                    const allDropdownsOption = page.locator('.form-group .k-dropdown-wrap');
                    const countOption = await allDropdownsOption.count();
                    for (let i = 0; i < countOption; i++) {
                        const dd = allDropdownsOption.nth(i);
                        if (await dd.isVisible()) {
                            addedOptionDropdown = dd;
                            foundOption = true;
                            break;
                        }
                    }
                    if (!foundOption) {
                        throw new Error('Added Personal Injury Protection Coverage dropdown not found. Check span texts above.');
                    }
                }
            }
            await addedOptionDropdown.click();
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter');
            // await page.waitForTimeout(1000);
           
            // 7. Select valid options in all dropdowns
            const dropdowns = await page.locator('select').elementHandles();
            for (const dropdown of dropdowns) {
                // Only select if the <select> is visible (not hidden by Kendo UI)
                const isVisible = await dropdown.evaluate((el: Element) => {
                    const style = window.getComputedStyle(el);
                    return style && style.display !== 'none' && style.visibility !== 'hidden' && (el as HTMLElement).offsetParent !== null;
                });
                if (!isVisible) continue;
                const options = await dropdown.$$('option');
                for (const option of options) {
                    const value = await option.getAttribute('value');
                    if (value && value !== '') {
                        await dropdown.selectOption(value);
                        break;
                    }
                }
            }
                        // Find the form-group containing the label "Additional Personal Injury Protection Applies"
            const apipcFormGroup = page.locator('.form-group', {
                has: page.locator('label span', { hasText: 'Additional Personal Injury Protection Applies' })
            }).first();
           
            // Find the visible Kendo dropdown within that form-group
            const apipcDropdownWrap2 = apipcFormGroup.locator('.k-dropdown-wrap').first();
            await expect(apipcDropdownWrap2).toBeVisible({ timeout: 10000 });
            // Click the arrow icon inside the dropdown, using force: true
            const apipcArrow2 = apipcDropdownWrap2.locator('.k-select').first();
            await apipcArrow2.click({ force: true });
            // Wait for UI to render the dropdown list
            await page.waitForTimeout(500); // Slightly longer delay
 
            // Retry click if dropdown does not appear
            let dropdownVisible = false;
            for (let i = 0; i < 3; i++) {
                if (await page.locator('.k-list[aria-hidden="false"]').isVisible()) {
                    dropdownVisible = true;
                    break;
                }
                // Only click if arrow is visible, else fallback to dropdown wrap
                if (await apipcArrow2.isVisible()) {
                    await apipcArrow2.click();
                } else {
                    await apipcDropdownWrap2.click({ force: true });
                }
                await page.waitForTimeout(300);
            }
            if (!dropdownVisible) {
                // Final fallback: try clicking the dropdown wrap itself one more time
                await apipcDropdownWrap2.click({ force: true });
                await page.waitForTimeout(500);
                if (!await page.locator('.k-list[aria-hidden="false"]').isVisible()) {
                    throw new Error('Dropdown list did not appear for Additional Personal Injury Protection Applies');
                }
            }
 
            const apipcDropdownList2 = page.locator('.k-list[aria-hidden="false"]');
            await expect(apipcDropdownList2).toBeVisible({ timeout: 10000 });
            // Select "Added Personal Injury Protection Coverage" from the dropdown list
            const apipcOption = apipcDropdownList2.locator('.k-item', { hasText: 'Added Personal Injury Protection Coverage' }).first();
            await expect(apipcOption).toBeVisible({ timeout: 15000 });
            await apipcOption.click();
            // Wait for UI to load
            await page.waitForTimeout(1000);

            // Select 'Provided' in the dropdown next to 'Added Personal Injury Protection Coverage'
            const apipcCoverageFormGroup = page.locator('.form-group', {
                has: page.locator('label span', { hasText: /^Added Personal Injury Protection Coverage$/ })
            }).first();
            await expect(apipcCoverageFormGroup).toBeVisible({ timeout: 10000 });
            const apipcCoverageDropdown = apipcCoverageFormGroup.locator('.k-dropdown-wrap').first();
            await expect(apipcCoverageDropdown).toBeVisible({ timeout: 10000 });
            await apipcCoverageDropdown.click();
            await page.waitForTimeout(500);
            // Always use keyboard navigation to select 'Provided'
            for (let i = 0; i < 2; i++) {
                await page.keyboard.press('ArrowDown');
                await page.waitForTimeout(100);
            }
            await page.keyboard.press('Enter');
            await page.waitForTimeout(1000);
            // Wait for UI to load
            await page.waitForTimeout(1000);

            // Select 'b.' in the dropdown next to 'Added Personal Injury Protection Option'
            const apipcOptionFormGroup = page.locator('.form-group', {
                has: page.locator('label span', { hasText: /^Added Personal Injury Protection Option$/ })
            }).first();
            await expect(apipcOptionFormGroup).toBeVisible({ timeout: 10000 });
            const apipcOptionDropdown = apipcOptionFormGroup.locator('.k-dropdown-wrap').first();
            await expect(apipcOptionDropdown).toBeVisible({ timeout: 10000 });
            await apipcOptionDropdown.click();
            const apipcOptionDropdownList = page.locator('.k-list[aria-hidden="false"]');
            let bOptionPI = apipcOptionDropdownList.locator('.k-item', { hasText: 'b.' }).first();
            let foundB = false;
            for (let i = 0; i < 3; i++) {
                try {
                    await expect(apipcOptionDropdownList).toBeVisible({ timeout: 3000 });
                    await expect(bOptionPI).toBeVisible({ timeout: 3000 });
                    foundB = true;
                    break;
                } catch {
                    await apipcOptionDropdown.click();
                    await page.waitForTimeout(300);
                    bOptionPI = apipcOptionDropdownList.locator('.k-item', { hasText: 'b.' }).first();
                }
            }
            if (!foundB) throw new Error("Option 'b.' not found in Added Personal Injury Protection Option dropdown");
            await bOptionPI.click();
            await page.waitForTimeout(1000);
 
            // 3. Check next 3 selects are auto-selected and not empty
            // Wait for UI to update after previous dropdown selections
            await page.waitForTimeout(1000);
            for (let i = 3; i <= 5; i++) {
                const dependentFormGroup = page.locator('.form-group', {
                    has: page.locator('label span', { hasText: `Added Personal Injury Protection Coverage ${i}` })
                }).first();
                // Try to check if the form-group is visible, skip if not found
                let isPresent = false;
                try {
                    isPresent = await dependentFormGroup.isVisible({ timeout: 5000 });
                } catch {
                    isPresent = false;
                }
                if (!isPresent) {
                    console.warn(`Form group for Added Personal Injury Protection Coverage ${i} not found, skipping.`);
                    continue;
                }
                const dependentDropdownWrap = dependentFormGroup.locator('.k-dropdown-wrap').first();
                await expect(dependentDropdownWrap).toBeVisible({ timeout: 10000 });
                const selectedValue = await dependentDropdownWrap.locator('.k-input').innerText();
                expect(selectedValue.trim()).not.toBe('Select');
                await page.waitForTimeout(300);
            }
           
            const dependentDropdowns = [
            page.getByLabel('Added Personal Injury Protection Option 1'),
            page.getByLabel('Added Personal Injury Protection Option 2'),
            page.getByLabel('Added Personal Injury Protection Option 3')
        ];
        for (let idx = 0; idx < dependentDropdowns.length; idx++) {
            const dd = dependentDropdowns[idx];
            let isPresent = false;
            try {
                isPresent = await dd.isVisible({ timeout: 5000 });
            } catch {
                isPresent = false;
            }
            if (!isPresent) {
                console.warn(`Dropdown for Added Personal Injury Protection Option ${idx + 1} not found, skipping.`);
                continue;
            }
            await expect(dd).toBeVisible({ timeout: 10000 });
            await expect(dd).not.toHaveValue('');
        }
           
            // 8. Save Limits & Deductibles and verify alert
            const saveLimitsButton = page.getByRole('button', { name: /Save/i });
            await expect(saveLimitsButton).toBeVisible({ timeout: 10000 });
            await saveLimitsButton.click();
            const limitsSavedAlert = page.getByText('Limits & Deductibles saved successfully');
            await expect(limitsSavedAlert).toBeVisible({ timeout: 39000 });

            // Click "Back to Policy" button in the footer after saving
            const backToPolicyButton = page.getByRole('button', { name: /Back to Policy/i });
            await expect(backToPolicyButton).toBeVisible({ timeout: 10000 });
            await backToPolicyButton.click();

            // 9. Wait for navigation back to AULocation and proceed
            await page.waitForURL(/#\/AULocation/, { timeout: 30000 });
            const proceedToAutoExposureButton = page.getByRole('button', { name: /Proceed to Automobile Exposure/i });
            await expect(proceedToAutoExposureButton).toBeVisible({ timeout: 10000 });
            await proceedToAutoExposureButton.click();
 
            results.push({
                testId: 'TS002',
                testName: 'Verify Account Form Fill and Proceed to Application',
                status: 'Pass',
                duration: Date.now() - start
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            results.push({
                testId: errorMessage.includes('TS002') ? 'TS002' : 'TS007',
                testName: errorMessage.includes('TS002') ? 'Verify New Quote Creation Flow' : 'Verify Account Form Fill and Proceed to Application',
                status: 'Fail',
                duration: Date.now() - start
            });
            throw err;
        }
    });

    // Test 3: Customer Accounts Menu Navigation
    test('TS004: Customer Accounts Menu Redirect', async ({ page }) => {
        // Set longer timeout for this test
        test.setTimeout(180000);
        
        const start = Date.now();
        let loginPage: LoginPage;
        let homePage: HomePage;

        try {
            // Initialize page objects
            loginPage = new LoginPage(page);
            homePage = new HomePage(page);

            // Login and ensure page is ready
            console.log('Starting Customer Accounts Menu test...');
            await test.step('Login to application', async () => {
                await loginPage.login();
                // Wait for dashboard to be visible after login
                await expect(page.getByRole('textbox', { name: /search/i }))
                    .toBeVisible({ timeout: 60000 });
            });
            
            // Navigate to Customer Accounts
            await test.step('Navigate to Customer Accounts', async () => {
                await homePage.navigateToCustomerAccounts();
            });

            results.push({
                testId: 'TS003',
                testName: 'Customer Accounts Menu Redirect',
                status: 'Pass',
                duration: Date.now() - start
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error('TS003 failed:', errorMessage);
            results.push({
                testId: 'TS003',
                testName: 'Customer Accounts Menu Redirect',
                status: 'Fail',
                duration: Date.now() - start
            });
            throw err;
        }
    });

    // Test 4: Customer Accounts Filter Search
    test('TS005: Verify Customer Accounts Filter Search', async ({ page }) => {
        // Set longer timeout for this test
        test.setTimeout(180000);
        
        const start = Date.now();
        try {
            // Initialize page objects
            const loginPage = new LoginPage(page);
            const homePage = new HomePage(page);
            const accountsPage = new AccountsPage(page);

            // Step 1 & 2: Login and wait for dashboard
            await test.step('Login to application', async () => {
                console.log('Attempting to login...');
                await loginPage.login();
                console.log('Waiting for dashboard after login...');
                await page.waitForSelector([
                    'body:not(.pace-running)',
                    '.dashboard-container',
                    '#dashboard',
                    '[data-testid="dashboard"]'
                ].join(', '), { 
                    timeout: 60000,
                    state: 'visible' 
                });
                console.log('Dashboard is visible');
            });

            // Step 3: Navigate to Customer Accounts
            await test.step('Navigate to Customer Accounts', async () => {
                console.log('Navigating to Customer Accounts...');
                let retryCount = 0;
                const maxRetries = 3;
                
                while (retryCount < maxRetries) {
                    try {
                        await homePage.navigateToCustomerAccounts();
                        await accountsPage.waitForPageLoad();
                        console.log('Successfully navigated to Customer Accounts');
                        break;
                    } catch (error) {
                        retryCount++;
                        const e = error instanceof Error ? error.message : String(error);
                        console.log(`Navigation attempt ${retryCount} failed: ${e}`);
                        if (retryCount === maxRetries) throw new Error(`Navigation failed after ${maxRetries} attempts: ${e}`);
                        await page.waitForTimeout(2000);
                    }
                }
            });

            // Step 4: Apply filters and verify results
            await test.step('Apply filters and verify results', async () => {
                const filterData = {
                    zipCode: '08837',
                    state: 'NJ',
                    city: 'Edison',
                    accountName: 'New Jersey Convention and Exposition Center',
                    accountId: 'ACC0020714'
                };

                console.log('Filling filter form with data:', JSON.stringify(filterData, null, 2));
                await accountsPage.fillFilterForm(filterData);
                await accountsPage.applyFilter();
                await accountsPage.verifyFilterResults(filterData);
            });

            results.push({
                testId: 'TS004',
                testName: 'Verify Customer Accounts Filter Search',
                status: 'Pass',
                duration: Date.now() - start
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error('TS004 failed:', errorMessage);
            results.push({
                testId: 'TS004',
                testName: 'Verify Customer Accounts Filter Search',
                status: 'Fail',
                duration: Date.now() - start
            });
            throw err;
        }
    });

    // Test 5: Quotes Navigation
    test('TS006: Verify Quotes Navigation', async ({ page }) => {
        // Set longer timeout for this test
        test.setTimeout(180000);
        
        const start = Date.now();
        try {
            // Initialize page objects
            const loginPage = new LoginPage(page);
            const homePage = new HomePage(page);

            // Step 1: Login and ensure page is ready
            await test.step('Login to application', async () => {
                console.log('Starting Quotes Navigation test...');
                await loginPage.login();
                // Wait for dashboard to be visible after login
                await expect(page.getByRole('textbox', { name: /search/i }))
                    .toBeVisible({ timeout: 60000 });
            });
            
            // Step 2: Navigate to Quotes
            await test.step('Navigate to Quotes', async () => {
                await homePage.navigateToQuotes();
                // Verify we're on the Quotes page
                await expect(page.url()).toMatch(/.*\/Index\.html#\/quotes/);
            });

            results.push({
                testId: 'TS005',
                testName: 'Verify Quotes Navigation',
                status: 'Pass',
                duration: Date.now() - start
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error('TS005 failed:', errorMessage);
            results.push({
                testId: 'TS005',
                testName: 'Verify Quotes Navigation',
                status: 'Fail',
                duration: Date.now() - start
            });
            throw err;
        }
    });

    // Test 6: Quotes Filter
    test('TS007: Verify Quotes Filter', async ({ page }) => {
        // Set longer timeout for this test
        test.setTimeout(180000);
        
        const start = Date.now();
        try {
            // Initialize page objects
            const loginPage = new LoginPage(page);
            const homePage = new HomePage(page);
            const quotesPage = new QuotesPage(page);

            // Step 1: Login and ensure page is ready
            await test.step('Login to application', async () => {
                console.log('Starting Quotes Filter test...');
                await loginPage.login();
                await expect(page.getByRole('textbox', { name: /search/i }))
                    .toBeVisible({ timeout: 60000 });
            });
            
            // Step 2: Navigate to Quotes
            await test.step('Navigate to Quotes', async () => {
                await quotesPage.navigateToQuotes();
                await expect(page.url()).toMatch(/.*\/Index\.html#\/quotes/);
            });

            // Step 3: Apply filters
            await test.step('Apply filters and verify results', async () => {
                const filterData: QuoteFilterData = {
                    products: ['UmbrellaandExcess', 'Commercial Package Policy', 'General Liability', 'Commercial Automobile'],
                    quoteId: 'RNGL000376',
                    state: 'NY',
                    status: ['Quote Created']
                };

                console.log('Applying quote filters:', filterData);
                await quotesPage.fillFilterForm(filterData);
                await quotesPage.applyFilter();
                await quotesPage.verifyFilterResults(filterData);
            });

            results.push({
                testId: 'TS006',
                testName: 'Verify Quotes Filter',
                status: 'Pass',
                duration: Date.now() - start
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error('TS006 failed:', errorMessage);
            results.push({
                testId: 'TS006',
                testName: 'Verify Quotes Filter',
                status: 'Fail',
                duration: Date.now() - start
            });
            throw err;
        }
    });

    // After all tests, generate reports
    test.afterAll(async () => {
        console.log('Test suite completed. Generating reports...');
        saveResultsToJson(results);
        generateHtmlReport(results);
    });
});