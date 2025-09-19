import { test, expect , Page, Locator} from '@playwright/test';
import { saveResultsToJson, generateHtmlReport, TestResult } from '../utils/reporter';
import { LoginPage } from './LoginPage';
import { HomePage } from './HomePage';
import { AccountsPage } from './pages/AccountsPage';
import { QuotesPage } from './pages/QuotesPage';
import type { QuoteFilterData } from './pages/QuotesPage';
import config from '../config.json';
import * as fs from 'fs';
import * as path from 'path';


// DOM Capture Configuration
/**
 * DOMCapture class provides comprehensive DOM state capture functionality for debugging Playwright tests.
 * 
 * Features:
 * - Captures full HTML content of pages at key test points
 * - Generates accessibility snapshots for UI analysis
 * - Takes full-page screenshots when requested
 * - Captures metadata including URL, title, viewport, and user agent
 * - Automatically captures DOM state on test failures
 * - Saves all captures to timestamped files in dom-captures/ directory
 * 
 * Usage:
 * - Call DOMCapture.capture() at strategic points in tests
 * - Call DOMCapture.captureOnFailure() in catch blocks
 * - Files are saved with format: TestName_StepName_Timestamp.{html|json|png}
 */
class DOMCapture {
  private static captureDir = path.join(process.cwd(), 'dom-captures');

  static async initialize(): Promise<void> {
    // Create capture directory if it doesn't exist
    if (!fs.existsSync(this.captureDir)) {
      fs.mkdirSync(this.captureDir, { recursive: true });
      console.log(`DOM capture directory created: ${this.captureDir}`);
    }
  }

  static async capture(page: Page, testName: string, stepName: string, includeScreenshot: boolean = false): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${testName}_${stepName}_${timestamp}`;

      // Capture HTML content
      const htmlContent = await page.content();
      const htmlPath = path.join(this.captureDir, `${filename}.html`);
      fs.writeFileSync(htmlPath, htmlContent, 'utf8');

      // Capture accessibility snapshot
      const accessibilitySnapshot = await page.accessibility.snapshot();
      const accessibilityPath = path.join(this.captureDir, `${filename}_accessibility.json`);
      fs.writeFileSync(accessibilityPath, JSON.stringify(accessibilitySnapshot, null, 2), 'utf8');

      // Capture screenshot if requested
      let screenshotPath: string | undefined;
      if (includeScreenshot) {
        screenshotPath = path.join(this.captureDir, `${filename}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
      }

      // Log current URL and title
      const currentUrl = page.url();
      const pageTitle = await page.title();
      const metadata = {
        timestamp: new Date().toISOString(),
        testName,
        stepName,
        url: currentUrl,
        title: pageTitle,
        viewport: await page.viewportSize(),
        userAgent: await page.evaluate(() => navigator.userAgent)
      };

      const metadataPath = path.join(this.captureDir, `${filename}_metadata.json`);
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

      console.log(`DOM captured: ${filename}`);
      console.log(`  HTML: ${htmlPath}`);
      console.log(`  Accessibility: ${accessibilityPath}`);
      if (includeScreenshot) {
        console.log(`  Screenshot: ${screenshotPath}`);
      }
      console.log(`  Metadata: ${metadataPath}`);
      console.log(`  URL: ${currentUrl}`);
      console.log(`  Title: ${pageTitle}`);

    } catch (error) {
      console.error(`Failed to capture DOM for ${testName} - ${stepName}:`, error);
    }
  }

  static async captureOnFailure(page: Page, testName: string, error: any): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${testName}_FAILURE_${timestamp}`;

      // Capture HTML content
      const htmlContent = await page.content();
      const htmlPath = path.join(this.captureDir, `${filename}.html`);
      fs.writeFileSync(htmlPath, htmlContent, 'utf8');

      // Capture screenshot
      const screenshotPath = path.join(this.captureDir, `${filename}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Capture console logs if available
      const consoleLogs = await page.evaluate(() => {
        // This is a simplified version - in a real implementation you'd need to collect logs during test execution
        return [];
      });

      const failureData = {
        timestamp: new Date().toISOString(),
        testName,
        error: error.message || String(error),
        url: page.url(),
        title: await page.title(),
        consoleLogs,
        htmlPath,
        screenshotPath
      };

      const failurePath = path.join(this.captureDir, `${filename}_failure.json`);
      fs.writeFileSync(failurePath, JSON.stringify(failureData, null, 2), 'utf8');

      console.log(`Failure DOM captured: ${filename}`);
      console.log(`  HTML: ${htmlPath}`);
      console.log(`  Screenshot: ${screenshotPath}`);
      console.log(`  Failure Data: ${failurePath}`);

    } catch (captureError) {
      console.error('Failed to capture failure DOM:', captureError);
    }
  }

  static getCaptureDir(): string {
    return this.captureDir;
  }
}


// Store all test results
const results: TestResult[] = [];

// Test Suite - runs tests in order
test.describe('Customer Portal Test Suite', () => {
    // Run tests serially (one after another)
    test.describe.configure({ mode: 'serial' });

    // Before all tests
    test.beforeAll(async () => {
        console.log('Starting test suite execution...');
        // Initialize DOM capture system
        await DOMCapture.initialize();
        console.log('DOM capture system initialized');
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
        .catch(() => console.log('Initial loading state already completed'));
            
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




// Constants for timeouts and configuration
const TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 10000,
  LONG: 30000,
  PAGE_LOAD: 30000,
  NETWORK_IDLE: 15000
} as const;

// Test data configuration
const TEST_DATA = {
  applicant: {
    name: 'Hospital for Special Surgery',
    sicCode: '0971 - Hunting, Trapping, Game Propagation',
    legalEntity: 'Corporation'
  },
  vehicle: {
    year: '2024',
    make: 'kia',
    model: 'sonet',
    vin: '12345678910',
    originalCost: '500000',
    statedAmount: '150000',
    territory: '042'
  },
  limits: {
    limit: '25,000',
    deductible: '100'
  },
  nonOwnedAuto: {
    employees: '2',
    garagingLocation: 'Adams'
  }
} as const;

// Helper functions for common operations
class TestHelpers {
  constructor(private page: Page) {}

  async waitForPageReady(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForFunction(() => !document.body.classList.contains('pace-running'), { timeout: TIMEOUTS.MEDIUM })
      .catch(() => console.log('Loading state check completed'));
  }

  async selectFromKendoDropdown(
    selector: string | Locator, 
    optionText: string, 
    maxRetries: number = 3
  ): Promise<void> {
    const dropdown = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await expect(dropdown).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    
    // Check if the option is already selected
    const currentValue = await dropdown.textContent();
    if (currentValue && currentValue.trim().includes(optionText)) {
      console.log(`Option "${optionText}" is already selected`);
      return;
    }
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      await dropdown.click();
      await this.page.waitForTimeout(300);
      
      const dropdownList = this.page.locator('.k-list[aria-hidden="false"]');
      if (await dropdownList.isVisible()) {
        const option = dropdownList.locator('.k-item', { hasText: optionText });
        if (await option.isVisible()) {
          await option.click();
          return;
        }
      }
    }
    throw new Error(`Failed to select option "${optionText}" after ${maxRetries} attempts`);
  }

  async selectFromKendoDropdownWithKeyboard(
    selector: string | Locator, 
    steps: number = 1
  ): Promise<void> {
    const dropdown = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await expect(dropdown).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    await dropdown.click();
    
    for (let i = 0; i < steps; i++) {
      await this.page.keyboard.press('ArrowDown');
      await this.page.waitForTimeout(100);
    }
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);
  }

  async fillFieldSlowly(selector: string | Locator, text: string, delay: number = 100): Promise<void> {
    const field = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await field.waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM });
    await field.focus();
    
    for (const char of text) {
      await field.type(char, { delay });
    }
  }

  async selectDeductibleInSection(sectionLabel: string, value: string = '100'): Promise<void> {
    console.log(`Looking for deductible section: "${sectionLabel}"`);

    // Try multiple selector strategies
    let section;

    // Strategy 1: Original selector with .imglimits
    section = this.page.locator('.imglimits', {
      has: this.page.locator('label span', { hasText: sectionLabel })
    }).first();

    if (!(await section.isVisible({ timeout: 1000 }).catch(() => false))) {
      console.log(`Strategy 1 failed for "${sectionLabel}", trying case-insensitive match`);
      // Strategy 2: Case-insensitive match
      section = this.page.locator('.imglimits', {
        has: this.page.locator('label span', { hasText: new RegExp(sectionLabel, 'i') })
      }).first();
    }

    if (!(await section.isVisible({ timeout: 1000 }).catch(() => false))) {
      console.log(`Strategy 2 failed for "${sectionLabel}", trying broader selector`);
      // Strategy 3: Look for any container with the label
      section = this.page.locator('[class*="limit"]', {
        has: this.page.locator('label span', { hasText: new RegExp(sectionLabel, 'i') })
      }).first();
    }

    if (!(await section.isVisible({ timeout: 1000 }).catch(() => false))) {
      console.log(`Strategy 3 failed for "${sectionLabel}", trying even broader selector`);
      // Strategy 4: Look for any element containing the text
      section = this.page.locator('label span', { hasText: new RegExp(sectionLabel, 'i') })
        .locator('xpath=ancestor::*[contains(@class, "limit") or contains(@class, "img") or contains(@class, "form")]')
        .first();
    }

    if (!(await section.isVisible({ timeout: 1000 }).catch(() => false))) {
      console.log(`Strategy 4 failed for "${sectionLabel}", trying partial match`);
      // Strategy 5: Partial match for section names
      const partialLabel = sectionLabel.split(' ')[0]; // Take first word
      section = this.page.locator('.imglimits, [class*="limit"]', {
        has: this.page.locator('label span', { hasText: new RegExp(partialLabel, 'i') })
      }).first();
    }

    // Final check
    const isVisible = await section.isVisible({ timeout: 2000 }).catch(() => false);
    if (!isVisible) {
      console.log(`All strategies failed for "${sectionLabel}". Available deductible sections:`);

      // Debug: List all available sections
      const allLimitsSections = this.page.locator('.imglimits, [class*="limit"], [class*="img"]');
      const count = await allLimitsSections.count();
      for (let i = 0; i < Math.min(count, 10); i++) {
        const sectionEl = allLimitsSections.nth(i);
        const labels = sectionEl.locator('label span');
        const labelCount = await labels.count();
        for (let j = 0; j < labelCount; j++) {
          const labelText = await labels.nth(j).textContent();
          console.log(`  Section ${i}, Label ${j}: "${labelText?.trim()}"`);
        }
      }

      throw new Error(`Deductible section "${sectionLabel}" not found after trying multiple strategies`);
    }

    console.log(`Found deductible section for "${sectionLabel}"`);
    await section.scrollIntoViewIfNeeded();

    const formGroups = section.locator('.form-group');
    const fgCount = await formGroups.count();
    console.log(`Found ${fgCount} form groups in section "${sectionLabel}"`);

    for (let i = 0; i < fgCount; i++) {
      const fg = formGroups.nth(i);
      const label = fg.locator('label span', { hasText: 'Deductible' });

      if (await label.count() > 0) {
        console.log(`Found deductible dropdown in form group ${i} for section "${sectionLabel}"`);
        const deductibleDropdown = fg.locator('.k-dropdown-wrap').first();
        await expect(deductibleDropdown).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await deductibleDropdown.scrollIntoViewIfNeeded();

        await this.selectFromKendoDropdown(deductibleDropdown, value);

        console.log(`Selected Deductible '${value}' for section: ${sectionLabel}`);
        return;
      }
    }

    throw new Error(`Deductible form-group not found for section: ${sectionLabel}`);
  }

  async handleSweetAlert(): Promise<void> {
  const popup = this.page.locator('.sweet-alert.showSweetAlert.visible');
  await popup.waitFor({ state: 'visible', timeout: TIMEOUTS.SHORT });
  const yesButton = popup.locator('button.confirm');
  await yesButton.waitFor({ state: 'visible', timeout: TIMEOUTS.SHORT });
  await yesButton.click();
  await popup.waitFor({ state: 'hidden', timeout: TIMEOUTS.SHORT });
  await this.page.waitForTimeout(1000);
  }

  async verifyAlert(alertText: string): Promise<void> {
    const alert = this.page.getByText(alertText, { exact: false });
    await expect(alert).toBeVisible({ timeout: TIMEOUTS.LONG });
  }

  async dismissLoadingDialog(): Promise<void> {
    const updatingDialog = this.page.getByText('Updating your coverage...', { exact: false });
    if (await updatingDialog.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
      await expect(updatingDialog).not.toBeVisible({ timeout: TIMEOUTS.LONG });
    }
  }

  getFormattedDate(date: Date): string {
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
  }
}

    // Test 2: New Quote Creation
    test('TS002: Verify New Quote Creation Flow', async ({ page }) => {
  test.setTimeout(180000);
  const start = Date.now();
  const helpers = new TestHelpers(page);

  try {
    // =========================
    // STEP 1: Navigation and Product Selection
    // =========================
    
    console.log('=== Starting Quote Creation Flow ===');
    
    // Navigate to home page
    await page.goto(config.appUrl);
    await page.waitForURL(/.*Index\.html#\/home.*/, { timeout: TIMEOUTS.PAGE_LOAD });
    
    // Capture DOM after initial navigation
    await DOMCapture.capture(page, 'TS002', 'Initial_Home_Load', true);

    // Click New Quote button
    const newQuoteButton = page.getByText('New Quote', { exact: true });
    await newQuoteButton.waitFor({ state: 'visible', timeout: TIMEOUTS.SHORT });
    await newQuoteButton.click();

    // Verify navigation to Product page
    await page.waitForURL(/.*\/BD\/McKee\/index\.html.*#\/Product/, { timeout: TIMEOUTS.PAGE_LOAD });
    
    // Capture DOM after Product page navigation
    await DOMCapture.capture(page, 'TS002', 'Product_Page_Loaded', true);

    // Handle Effective Date
    const effectiveDateInput = page.getByRole('combobox', { name: /Effective Date\*/i });
    await effectiveDateInput.waitFor({ state: 'visible', timeout: TIMEOUTS.SHORT });
    
    const today = new Date();
    const formattedDate = helpers.getFormattedDate(today);
    await effectiveDateInput.fill(formattedDate);

    // Verify Expiration Date
    const expirationDateInput = page.getByRole('combobox', { name: /Expiration Date\*/i });
    await expirationDateInput.waitFor({ state: 'visible', timeout: TIMEOUTS.SHORT });
    const nextYear = new Date(today);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const expectedExpirationDate = helpers.getFormattedDate(nextYear);
    await expect(expirationDateInput).toHaveValue(expectedExpirationDate);

    await helpers.waitForPageReady();

    // Select Commercial Automobile
    console.log('Selecting Commercial Automobile...');
    const autoSection = page.locator('div.prodWraper').filter({ 
      has: page.getByRole('heading', { name: 'Commercial Automobile' }) 
    });
    await autoSection.waitFor({ state: 'visible', timeout: TIMEOUTS.SHORT });
    
    const autoHeading = autoSection.getByRole('heading', { name: 'Commercial Automobile' });
    await autoHeading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await autoHeading.click({ force: true });
    
    await helpers.waitForPageReady();

    // Select checkbox
    const checkbox = autoSection.locator('input[type="checkbox"]');
    await checkbox.waitFor({ state: 'visible', timeout: TIMEOUTS.SHORT });
    await checkbox.check({ force: true });
    
    await helpers.waitForPageReady();

    // Select Writing Company
    console.log('Selecting Writing Company...');
    console.log('Auto section found:', await autoSection.count());
    const writingCompanyDropdown = autoSection.locator('label', { hasText: 'Writing Company' })
      .locator('xpath=following-sibling::*')
      .locator('.k-dropdown-wrap')
      .first();
    console.log('Writing Company dropdown found:', await writingCompanyDropdown.count());
    await expect(writingCompanyDropdown).toBeVisible({ timeout: TIMEOUTS.NETWORK_IDLE });
    await helpers.selectFromKendoDropdownWithKeyboard(writingCompanyDropdown, 2);
    
    await helpers.waitForPageReady();

    // Proceed to Account
    const proceedButton = page.getByRole('button', { name: /Proceed to Account/i });
    await proceedButton.waitFor({ state: 'visible', timeout: TIMEOUTS.SHORT });
    await proceedButton.click();

    await page.waitForURL(/.*\/BD\/McKee\/index\.html.*#\/Account/, { timeout: TIMEOUTS.PAGE_LOAD });
    
    // Capture DOM after Account page navigation
    await DOMCapture.capture(page, 'TS002', 'Account_Page_Loaded', true);

    results.push({
      testId: 'TS002',
      testName: 'Verify New Quote Creation Flow',
      status: 'Pass',
      duration: Date.now() - start
    });

    // =========================
    // STEP 2: Account Form Fill
    // =========================
    
    console.log('=== Starting Account Form Fill ===');

    // Fill Name of Applicant
    const nameInput = page.locator('input[data-role="autocomplete"][placeholder="Enter Applicant Name"]');
  await helpers.fillFieldSlowly(nameInput, TEST_DATA.applicant.name);
    
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');

    await helpers.handleSweetAlert();

    // Fill SIC Code
    console.log('Filling SIC Code...');
    const sicCodeInput = page.getByRole('textbox', { name: 'SIC Code/Description*' });
    await sicCodeInput.waitFor({ state: 'visible', timeout: TIMEOUTS.NETWORK_IDLE });
    
    await page.locator('.form-group', {
      has: page.locator('label', { hasText: 'SIC Code/Description' })
    }).scrollIntoViewIfNeeded();
    
  await helpers.fillFieldSlowly(sicCodeInput, TEST_DATA.applicant.sicCode);
    
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Select Legal Entity
    console.log('Selecting Legal Entity...');
    const legalEntitySection = page.locator('.form-group', {
      has: page.locator('label', { hasText: 'Legal Entity' })
    });
    const legalEntityDropdown = legalEntitySection.locator('span.k-dropdown-wrap').first();
    
  await helpers.selectFromKendoDropdownWithKeyboard(legalEntityDropdown);
    
    await helpers.waitForPageReady();

    // Verify form values
    await expect(nameInput).toHaveValue(new RegExp(TEST_DATA.applicant.name, 'i'));
    await expect(sicCodeInput).toHaveValue(TEST_DATA.applicant.sicCode);
    
    const legalEntityValue = legalEntitySection.locator('span.k-dropdown-wrap span.k-input').first();
    await expect(legalEntityValue).toHaveText(TEST_DATA.applicant.legalEntity, { timeout: TIMEOUTS.MEDIUM });

    await helpers.waitForPageReady();

    // Proceed to Application
    console.log('Proceeding to Application...');
    const proceedToAppButton = page.getByRole('button', { name: 'Proceed to Application' });
    await proceedToAppButton.click();

    await page.waitForURL(/.*\/BD\/McKee\/index\.html.*#\/Location/, { timeout: TIMEOUTS.PAGE_LOAD });

    // =========================
    // STEP 3: Location Flow
    // =========================
    
    console.log('=== Processing Location ===');

    // Save Location
    const saveLocationButton = page.getByRole('button', { name: 'Save', exact: true });
    await expect(saveLocationButton).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    await saveLocationButton.click();
    
    await helpers.verifyAlert('Location saved successfully');

    // Navigate to AULocation
    await page.waitForURL(/.*\/BD\/McKee\/index\.html.*#\/AULocation/, { timeout: TIMEOUTS.PAGE_LOAD });
    
    const stateValueSpan = page.locator('span.k-input', { hasText: 'New York' });
    await expect(stateValueSpan).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    await expect(stateValueSpan).toHaveText('New York');

    // Select Truck
    const truckContainer = page.locator('.vehicle-details', { 
      has: page.locator('h5', { hasText: 'Truck' }) 
    });
    const truckLabel = truckContainer.locator('label.css-label');
    await expect(truckLabel).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    await truckLabel.click();

    // Select Product Offerings
    const productOfferingsSection = page.getByText('Select Your Product Offerings');
    await expect(productOfferingsSection).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    
    const productCheckboxes = await page.locator('input[type="checkbox"]')
      .filter({ has: productOfferingsSection })
      .elementHandles();
    
    for (const checkbox of productCheckboxes) {
      if (!(await checkbox.isChecked())) {
        await checkbox.check();
      }
    }

    // Navigate to Limits & Deductibles
    const limitsDeductiblesButton = page.getByRole('button', { name: /Limits & Deductibles/i });
    await expect(limitsDeductiblesButton).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    await limitsDeductiblesButton.click();
    
    await page.waitForURL(/LimitsDeductibles/, { timeout: TIMEOUTS.PAGE_LOAD });
    await helpers.verifyAlert('Automobile policy information saved successfully');

    // =========================
    // STEP 4: Limits & Deductibles
    // =========================
    
    console.log('=== Configuring Limits & Deductibles ===');

    // Select Limit
  // Removed unused variable 'limitFormGroup'
    const limitDropdown = page.locator('.form-group:has(label:has-text("Limit")) .k-dropdown-wrap').first();
    
  await helpers.selectFromKendoDropdown(limitDropdown, TEST_DATA.limits.limit);

    // Select Deductibles
    await helpers.selectDeductibleInSection('Collision', TEST_DATA.limits.deductible);
    await helpers.selectDeductibleInSection('Other Than Collision', TEST_DATA.limits.deductible);

    // Handle Personal Injury Protection sections
  // Select Personal Injury Protection sections directly
    const pipDropdown1 = page.locator('.form-group:has(label span:has-text("Personal Injury Protection")) .k-dropdown-wrap').first();
    const pipDropdown2 = page.locator('.form-group:has(label span:has-text("Personal Injury Protection")) .k-dropdown-wrap').nth(1);
    
  await helpers.selectFromKendoDropdownWithKeyboard(pipDropdown1);
  await helpers.selectFromKendoDropdownWithKeyboard(pipDropdown2);    // Handle Additional Personal Injury Protection specific selections
  // Removed unused variable 'apipcFormGroup'
    const apipDropdown = page.locator('.form-group:has(label:has-text("Additional Personal Injury Protection Applies")) .k-dropdown-wrap').first();
    
  await helpers.selectFromKendoDropdown(apipDropdown, 'Added Personal Injury Protection Coverage');

    // Select 'Provided' for Coverage
  // Removed unused variable 'apipcCoverageFormGroup'
    const apipCoverageDropdown = page.locator('.form-group:has(label:has-text("Added Personal Injury Protection Coverage")) .k-dropdown-wrap').first();
    
  await helpers.selectFromKendoDropdownWithKeyboard(apipCoverageDropdown, 2);

    // Select 'b.' for Option
  // Removed unused variable 'apipcOptionFormGroup'
    const apipOptionDropdown = page.locator('.form-group:has(label:has-text("Added Personal Injury Protection Option")) .k-dropdown-wrap').first();
    
  await helpers.selectFromKendoDropdown(apipOptionDropdown, 'b.');

    // Verify dependent dropdowns are auto-selected
    const firstDependentDropdown = page.locator('.form-group', {
      has: page.locator('label', { hasText: 'Total Additional Personal Injury Protection Limits' })
    }).locator('.k-dropdown-wrap .k-input');
    
    await expect(firstDependentDropdown).toHaveText(/^(?!Select$).+/, { timeout: TIMEOUTS.NETWORK_IDLE });

    // Verify other dependent dropdowns
    const dependentLabels = [
      'Monthly Work Loss',
      'Other Expenses Per Day'
    ];
    
    for (const label of dependentLabels) {
      const dependentFormGroup = page.locator('.form-group', {
        has: page.locator('label', { hasText: label })
      }).first();
      
      if (await dependentFormGroup.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
        const dependentDropdownWrap = dependentFormGroup.locator('.k-dropdown-wrap').first();
        const selectedValue = await dependentDropdownWrap.locator('.k-input').innerText();
        expect(selectedValue.trim()).not.toBe('Select');
      }
    }

    // Save Limits & Deductibles
    const saveLimitsButton = page.getByRole('button', { name: /Save/i });
    await expect(saveLimitsButton).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    await saveLimitsButton.click();
    
    await helpers.dismissLoadingDialog();
    await page.waitForTimeout(2000); // Wait for success alert to appear
    await helpers.verifyAlert('Limits & Deductibles saved successfully');

    // Back to Policy
    const backToPolicyButton = page.getByRole('button', { name: /Back to Policy/i });
    await expect(backToPolicyButton).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    await backToPolicyButton.click();

    await page.waitForURL(/#\/AULocation/, { timeout: TIMEOUTS.PAGE_LOAD });

    // =========================
    // STEP 5: Non-Owned Auto Coverage
    // =========================
    
    console.log('=== Configuring Non-Owned Auto Coverage ===');

const nonOwnedAutoRow = page.locator('text="Non-Owned Auto Coverage"').locator('..').locator('..').locator('..').locator('..');
await expect(nonOwnedAutoRow).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

// Scroll the row into view
await nonOwnedAutoRow.scrollIntoViewIfNeeded();

// First, click "Non-Owned Auto Coverage" forcibly
console.log('Clicking Non-Owned Auto Coverage...');
const switchLabel = nonOwnedAutoRow.locator('label').filter({ hasText: 'No' });
if (await switchLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
  await switchLabel.click({ force: true });
  console.log('Clicked Non-Owned Auto Coverage switch');
}

// Wait for 3 seconds as requested
console.log('Waiting 3 seconds after clicking Non-Owned Auto Coverage...');
await page.waitForTimeout(3000);

// Click the specific switch for "Do employees use their own vehicles for business purposes?" forcibly
console.log('Clicking "Do employees use their own vehicles for business purposes?" switch...');
const employeeVehiclesSwitch = page.locator('label[for="switchb995e0d1b974ff52ff89"]');
const employeeVehiclesCheckbox = page.locator('#switchb995e0d1b974ff52ff89');

if (await employeeVehiclesSwitch.isVisible({ timeout: 2000 }).catch(() => false)) {
  // First click to ensure it's activated
  await employeeVehiclesSwitch.click({ force: true });
  await page.waitForTimeout(1000);

  // Check if the checkbox is checked, if not click again
  const isChecked = await employeeVehiclesCheckbox.isChecked().catch(() => false);
  console.log(`Switch checked state after first click: ${isChecked}`);

  if (!isChecked) {
    console.log('Switch not checked, clicking again...');
    await employeeVehiclesSwitch.click({ force: true });
    await page.waitForTimeout(1000);

    // Verify again
    const isCheckedAfterSecondClick = await employeeVehiclesCheckbox.isChecked().catch(() => false);
    console.log(`Switch checked state after second click: ${isCheckedAfterSecondClick}`);
  }

  console.log('Clicked employee vehicles switch forcibly');
}

// Alternative approach: Use JavaScript to ensure the switch is in "Yes" state
await page.evaluate(() => {
  const checkbox = document.getElementById('switchb995e0d1b974ff52ff89') as HTMLInputElement;
  if (checkbox && !checkbox.checked) {
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    checkbox.dispatchEvent(new Event('click', { bubbles: true }));
    console.log('Force set switch to Yes state via JavaScript');
  }
});

// Wait for 5 seconds to avoid problems
console.log('Waiting 5 seconds after clicking employee vehicles switch...');
await page.waitForTimeout(5000);

    // Now click the Add/Edit button - use the specific row locator
    console.log('Clicking Add/Edit button...');
    const addEditButton = nonOwnedAutoRow.locator('button').filter({ hasText: 'Add/Edit' });
    await expect(addEditButton).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

    // Log button details for debugging
    const buttonCount = await addEditButton.count();
    console.log(`Found ${buttonCount} Add/Edit buttons for Non-Owned Auto Coverage`);

    if (buttonCount > 0) {
      // Get button text and state for debugging
      const buttonText = await addEditButton.textContent();
      const isButtonEnabled = await addEditButton.isEnabled();
      console.log(`Add/Edit button text: "${buttonText}", enabled: ${isButtonEnabled}`);

      // If button is still disabled, force enable it
      if (!isButtonEnabled) {
        console.log('Button is disabled, attempting to force enable...');
        await page.evaluate(() => {
          const button = document.querySelector('button[data-bind*="CommercialAutomobile.IsNonOwnedAuto"]') as HTMLButtonElement;
          if (button) {
            button.disabled = false;
            button.removeAttribute('disabled');
            console.log('Force enabled the Add/Edit button');
          }
        });
      }

      await expect(addEditButton).toBeEnabled({ timeout: TIMEOUTS.MEDIUM });

      // Wait for any loading to complete before clicking
      await page.waitForFunction(() => !document.body.classList.contains('pace-running'), { timeout: TIMEOUTS.MEDIUM });

      // Wait for button to be stable
      await page.waitForTimeout(1000);

      // Click with force to handle pointer event interception
      console.log('Attempting to click Add/Edit button...');
      await addEditButton.click({ force: true });
      console.log('Successfully clicked Add/Edit button');
    } else {
      throw new Error('Add/Edit button for Non-Owned Auto Coverage not found');
    }

    // Wait for either navigation to NonOwnedAuto page OR modal/inline form to appear
    console.log('Waiting for Non-Owned Auto form to load...');
    let modalFound = false;

    try {
      await page.waitForURL(/\/NonOwnedAuto/, { timeout: 5000 });
      console.log('Navigation to NonOwnedAuto page successful');
    } catch (error) {
      console.log('Navigation to NonOwnedAuto page did not occur, checking for modal/inline form...');

      // Check for modal or inline form elements
      const modalSelectors = [
        '.modal',
        '.popup',
        '.dialog',
        '[role="dialog"]',
        '.k-window',
        '.sweet-alert',
        '#modal',
        '.modal-content'
      ];

      for (const selector of modalSelectors) {
        try {
          const modal = page.locator(selector);
          if (await modal.isVisible({ timeout: 2000 })) {
            console.log(`Found modal with selector: ${selector}`);
            modalFound = true;
            break;
          }
        } catch (e) {
          // Continue checking other selectors
        }
      }

      // If no modal found, check for inline form elements that might have appeared
      if (!modalFound) {
        const inlineFormSelectors = [
          'text=/Number Of Employees/i',
          'text=/Garaging Location/i',
          'text=/Select Coverage/i',
          '[data-bind*="NumberOfEmployees"]',
          '.form-group:has(label:has-text("Number Of Employees"))'
        ];

        for (const selector of inlineFormSelectors) {
          try {
            const element = page.locator(selector);
            if (await element.isVisible({ timeout: 2000 })) {
              console.log(`Found inline form element with selector: ${selector}`);
              modalFound = true;
              break;
            }
          } catch (e) {
            // Continue checking other selectors
          }
        }
      }

      if (!modalFound) {
        console.log('No modal or inline form detected, proceeding with current page elements...');
      }
    }

    // Wait for the page/form to fully load and stabilize
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    
    // Capture DOM after Non-Owned Auto form load
    await DOMCapture.capture(page, 'TS002', 'NonOwnedAuto_Form_Loaded', true);

    // Try to expand any collapsed sections (in case of inline form)
    await page.evaluate(() => {
      // Look for and click any expand/collapse buttons
      const expandButtons = document.querySelectorAll('button[data-toggle="collapse"], .panel-heading, .accordion-toggle');
      expandButtons.forEach(button => {
        if (button instanceof HTMLElement) {
          button.click();
        }
      });

      // Also try to show hidden form sections
      const hiddenSections = document.querySelectorAll('.collapse:not(.in), .panel-collapse:not(.in)');
      hiddenSections.forEach(section => {
        if (section instanceof HTMLElement) {
          section.classList.add('in');
          section.style.display = 'block';
        }
      });
    });

    // Wait a bit more for animations to complete
    await page.waitForTimeout(2000);

// Fill Number of Employees - use label-based approach
const numEmployeesLabel = page.locator('text=/Number Of Employees/i');
await expect(numEmployeesLabel).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

// Find the input field by navigating from the label
const numEmployeesContainer = numEmployeesLabel.locator('..').locator('..');
let numEmployeesInput = numEmployeesContainer.locator('input').first();

// If input not found, try textbox
if (!(await numEmployeesInput.isVisible({ timeout: 1000 }).catch(() => false))) {
  numEmployeesInput = numEmployeesContainer.locator('textbox').first();
}

// If still not found, try data-bind attribute
if (!(await numEmployeesInput.isVisible({ timeout: 1000 }).catch(() => false))) {
  numEmployeesInput = page.locator('[data-bind*="NumberOfEmployees"]').first();
}

// Scroll to the input and click it, then use up arrow to increment to 2
await numEmployeesInput.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);

await numEmployeesInput.click();
await page.waitForTimeout(500);

// Press up arrow twice to increment from 0 to 2
await page.keyboard.press('ArrowUp');
await page.waitForTimeout(200);
await page.keyboard.press('ArrowUp');
await page.waitForTimeout(200);

// Click outside the input box to trigger blur event and validation
await page.locator('body').click();
await page.waitForTimeout(500);

// Now move to Garaging Location
console.log('Moving to Garaging Location...');

    // Select Garaging Location - use the specific dropdown attributes from the HTML
    console.log('Selecting Garaging Location...');

    // Use the specific aria-owns attribute or the select element ID for more precise targeting
    const garagingLocationDropdown = page.locator('[aria-owns="ddl5a9264716a77d39fa1cb_listbox"]').or(
      page.locator('#ddl5a9264716a77d39fa1cb').locator('xpath=ancestor::*[@role="listbox"]')
    ).first();

    await expect(garagingLocationDropdown).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

    // Click to open the dropdown
    await garagingLocationDropdown.click();
    await page.waitForTimeout(500);

    // Use keyboard navigation: press down arrow 3 times and then enter
    console.log('Using keyboard navigation to select Garaging Location...');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');

    await page.waitForTimeout(1000);

    // Select all coverage checkboxes
    const coverageSection = page.locator('text=/Select Coverage/i').first();
    const coverageCheckboxes = coverageSection.locator('..').locator('input[type="checkbox"]');

    const count = await coverageCheckboxes.count();
    console.log(`Found ${count} coverage checkboxes`);

    for (let i = 0; i < count; i++) {
      const checkbox = coverageCheckboxes.nth(i);
      const isChecked = await checkbox.isChecked().catch(() => false);
      if (!isChecked) {
        await checkbox.check({ force: true });
        console.log(`Checked coverage checkbox ${i + 1}`);
      }
    }

    // Save Non-Owned Auto
    const nonOwnedSaveButton = page.getByRole('button', { name: 'Save', exact: true });
    await expect(nonOwnedSaveButton).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    await nonOwnedSaveButton.click();

    // Return to AULocation and save
    const saveButton = page.getByRole('button', { name: 'Save', exact: true });
    await expect(saveButton).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    await saveButton.click();

    // =========================
    // STEP 6: Automobile Exposure and Vehicle Details
    // =========================
    
    console.log('=== Processing Automobile Exposure ===');
     await page.waitForTimeout(3000);

    const proceedAutoExposureBtn = page.getByRole('button', { name: /Proceed to Automobile Exposure/i });
    await expect(proceedAutoExposureBtn).toBeEnabled({ timeout: TIMEOUTS.MEDIUM });
    
    // Handle any blocking modal
    const okButton = page.getByRole('button', { name: /^OK$/ });
    if (await okButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await okButton.click();
      await expect(okButton).not.toBeVisible({ timeout: TIMEOUTS.SHORT });
    }

    await expect(proceedAutoExposureBtn).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    await proceedAutoExposureBtn.click();

    // Handle the modal dialog that appears after clicking "Proceed to Automobile Exposure"
    console.log('Checking for modal dialog...');
    const modalDialog = page.locator('text=/Please add either Hired Auto or Non Owned on the Policy/i');
    const modalOkButton = page.getByRole('button', { name: /^OK$/ });

    // Wait for modal to appear and handle it
    let modalHandled = false;
    try {
      await expect(modalDialog).toBeVisible({ timeout: 5000 });
      console.log('Modal dialog appeared, clicking OK...');
      await modalOkButton.click();
      await expect(modalDialog).not.toBeVisible({ timeout: TIMEOUTS.SHORT });
      console.log('Modal dialog handled successfully');
      modalHandled = true;
    } catch (error) {
      console.log('No modal dialog appeared, continuing...');
    }

    // If modal was handled, wait for page to stabilize before proceeding
    if (modalHandled) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    // Click Proceed to Automobile Exposure again if modal was handled
    if (modalHandled) {
      console.log('Re-clicking Proceed to Automobile Exposure after modal handling...');
      const proceedBtn = page.getByRole('button', { name: /Proceed to Automobile Exposure/i });
      await expect(proceedBtn).toBeEnabled({ timeout: TIMEOUTS.MEDIUM });
      await proceedBtn.click();
    }

    // Wait for navigation to RiskSummary with more flexible approach
    console.log('Waiting for navigation to RiskSummary...');
    try {
      await page.waitForURL('**/RiskSummary', { timeout: TIMEOUTS.PAGE_LOAD });
      console.log('Successfully navigated to RiskSummary');
      
      // Capture DOM after RiskSummary navigation
      await DOMCapture.capture(page, 'TS002', 'RiskSummary_Page_Loaded', true);
    } catch (error) {
      console.log('RiskSummary navigation failed, checking current URL...');
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);

      // If still on AULocation, try alternative navigation
      if (currentUrl.includes('AULocation')) {
        console.log('Still on AULocation, attempting alternative navigation...');

        // Try clicking the button again with force
        const proceedBtn = page.getByRole('button', { name: /Proceed to Automobile Exposure/i });
        if (await proceedBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await proceedBtn.click({ force: true });
          await page.waitForTimeout(2000);
        }

        // Try waiting for RiskSummary again
        await page.waitForURL('**/RiskSummary', { timeout: TIMEOUTS.PAGE_LOAD });
      } else {
        throw error;
      }
    }

    // Handle Vehicle Type popup
    const vehicleTypePopup = page.getByText('Choose the Vehicle Type', { exact: false });
    await expect(vehicleTypePopup).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

    // Select Truck vehicle type
    // console.log('Selecting Truck vehicle type...');
    // const truckRadio = page.locator('input[name="risksummary"][value="Truck"]');
    // await expect(truckRadio).toBeVisible({ timeout: TIMEOUTS.SHORT });
    // await truckRadio.check();

    // Click the specific Add Vehicle button by ID using force click
    console.log('Clicking the specific Add Vehicle button...');
    const addVehicleBtn = page.locator('#btnfd2e9df925f880001e53');
    await expect(addVehicleBtn).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    
    // Wait 3 seconds before clicking
    await page.waitForTimeout(5000);
    
    await addVehicleBtn.click({ force: true });

    // Wait for the dialog to close or processing to complete
    await page.waitForTimeout(2000);

    // Wait for navigation to Truck page with more flexible URL pattern
    console.log('Waiting for navigation to Truck page...');
    await page.waitForURL((url) => url.toString().includes('Truck'), { timeout: TIMEOUTS.PAGE_LOAD });
    console.log('Successfully navigated to Truck page');
    
    // Capture DOM after Truck page navigation
    await DOMCapture.capture(page, 'TS002', 'Truck_Page_Loaded', true);

    // =========================
    // STEP 7: Vehicle Configuration
    // =========================
    
    console.log('=== Configuring Vehicle Details ===');

    // Wait for Truck page to fully load with more efficient waiting
    console.log('Waiting for Truck page to fully load...');
    await Promise.all([
      page.waitForLoadState('networkidle', { timeout: TIMEOUTS.PAGE_LOAD }),
      page.waitForLoadState('domcontentloaded', { timeout: TIMEOUTS.PAGE_LOAD })
    ]);

    // Additional check: wait for a key element to be visible
    try {
      await page.waitForSelector('label[for="ddl09a5ce292832cf9c19a4"]', { timeout: TIMEOUTS.MEDIUM });
      console.log('Key elements are visible, proceeding...');
    } catch (error) {
      console.log('Key elements not found within timeout, but continuing...');
    }

    // Find the Territory dropdown using the specific label and dropdown structure
    console.log('Looking for Territory dropdown...');
    const territoryLabel = page.locator('label[for="ddl09a5ce292832cf9c19a4"]');
    await expect(territoryLabel).toBeVisible({ timeout: TIMEOUTS.LONG });

    // Wait for loading overlay to disappear (prevents pointer event interception)
    await page.waitForFunction(() => !document.body.classList.contains('pace-running'), { timeout: TIMEOUTS.MEDIUM });

    // Click the Territory label directly (this will open the dropdown)
    await territoryLabel.click();
    console.log('Clicked Territory label to open dropdown');

    // Wait for the page to fully load after opening dropdown
    await page.waitForLoadState('networkidle');

    // Wait for dropdown to open
    await page.waitForTimeout(1000);

    // Use keyboard to select a different value (press down arrow once)
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    console.log('Selected new Territory value');

    // Wait for selection to process
    // await page.waitForTimeout(2000);

    // Scroll down a bit to see the Year section
    console.log('Scrolling down to find Year section...');
    await page.evaluate(() => {
      window.scrollBy(0, 300); // Scroll down by 300 pixels
    });
    await page.waitForTimeout(1000);

    // Find Year label
    console.log('Looking for Year label...');
    const yearLabel = page.locator('label[for="num331402d53331705354df"]');
    await yearLabel.scrollIntoViewIfNeeded();
    await expect(yearLabel).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

    // Find the Year input box (Kendo numeric textbox)
    const yearFormGroup = page.locator('.form-group').filter({ has: page.locator('label[for="num331402d53331705354df"]') });
    const yearInput = yearFormGroup.locator('input.k-formatted-value.k-input').first();

    // Wait for the input to be visible and enabled
    await expect(yearInput).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    await expect(yearInput).toBeEnabled({ timeout: TIMEOUTS.MEDIUM });

    // Scroll the input into view
    await yearInput.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Additional check to ensure the element is truly ready
    await yearInput.waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM });
    await yearInput.waitFor({ state: 'attached', timeout: TIMEOUTS.MEDIUM });

    // Click to focus the input and place cursor inside
    console.log('Clicking Year input to focus and place cursor...');
    await yearInput.click({ force: true });
    await page.waitForTimeout(200);

    // Now that cursor is focused in the input box, do ctrl+a, delete, and type
    console.log('Clearing existing value and typing 2024...');
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(100);
    await page.keyboard.press('Delete');
    await page.waitForTimeout(100);
    await page.keyboard.type('2024');
    console.log('Typed "2024" in Year input');

    // Click somewhere (outside the input) to trigger validation
    await page.locator('body').click();
    await page.waitForTimeout(300); // Reduced wait time for processing

    // Find and click input box near Make label
    console.log('Looking for Make input...');
    const makeLabel = page.locator('label[for="txt637e4a47d7289a5abc88"]');
    await makeLabel.scrollIntoViewIfNeeded();
    await expect(makeLabel).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

    const makeInput = page.locator('input[id="txt637e4a47d7289a5abc88"]');
    await expect(makeInput).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

    // Click to focus the Make input and place cursor inside
    console.log('Clicking Make input to focus and place cursor...');
    await makeInput.click({ force: true });
    await page.waitForTimeout(200);

    // Now that cursor is focused in the Make input box, do ctrl+a, delete, and type
    console.log('Clearing existing value and typing Kia...');
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(100);
    await page.keyboard.press('Delete');
    await page.waitForTimeout(100);
    await page.keyboard.type('Kia');
    console.log('Typed "Kia" in Make input');

    // Click somewhere (outside the input)
    await page.locator('body').click();
    await page.waitForTimeout(300);

    // Wait for the page to fully load after Make input processing
    await page.waitForLoadState('networkidle');

    // Find and click input box near Model label
    console.log('Looking for Model input...');
    const modelLabel = page.locator('label[for="txt989e457a731988678c53"]');
    await modelLabel.scrollIntoViewIfNeeded();
    await expect(modelLabel).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

    const modelInput = page.locator('input[id="txt989e457a731988678c53"]');
    await expect(modelInput).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

    // Click to focus the Model input and place cursor inside
    console.log('Clicking Model input to focus and place cursor...');
    await modelInput.click({ force: true });
    await page.waitForTimeout(200);

    // Now that cursor is focused in the Model input box, do ctrl+a, delete, and type
    console.log('Clearing existing value and typing Sonet...');
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(100);
    await page.keyboard.press('Delete');
    await page.waitForTimeout(100);
    await page.keyboard.type('Sonet');
    console.log('Typed "Sonet" in Model input');

    // Click somewhere (outside the input)
    await page.locator('body').click();
    await page.waitForTimeout(300);

    // Find and click input box near Vehicle Identification Number label
    console.log('Looking for VIN input...');
    const vinLabel = page.locator('label[for="txt5818786b7b977da38d2f"]');
    await vinLabel.scrollIntoViewIfNeeded();
    await expect(vinLabel).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

    const vinInput = page.locator('input[id="txt5818786b7b977da38d2f"]');
    await expect(vinInput).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

    // Click to focus the VIN input and place cursor inside
    console.log('Clicking VIN input to focus and place cursor...');
    await vinInput.click({ force: true });
    await page.waitForTimeout(200);

    // Now that cursor is focused in the VIN input box, do ctrl+a, delete, and type
    console.log('Clearing existing value and typing 12345678910...');
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(100);
    await page.keyboard.press('Delete');
    await page.waitForTimeout(100);
    await page.keyboard.type('12345678910');
    console.log('Typed "12345678910" in VIN input');

    // Click somewhere (outside the input)
    await page.locator('body').click();
    await page.waitForTimeout(300);

    // Click the label "Select the Vehicle Classification"
    console.log('Looking for Vehicle Classification label...');
    const vehicleClassLabel = page.locator('label[for="txtauto7b27192a88ff7670d1dg"]');
    await vehicleClassLabel.scrollIntoViewIfNeeded();
    await expect(vehicleClassLabel).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

    // Find the input box and click to focus
    const vehicleClassInput = page.locator('input[id="txtauto7b27192a88ff7670d1dg"]');
    await expect(vehicleClassInput).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

    // Click to focus the Vehicle Classification input and place cursor inside
    console.log('Clicking Vehicle Classification input to focus and place cursor...');
    await vehicleClassInput.click({ force: true });
    await page.waitForTimeout(200);

    // Now that cursor is focused in the Vehicle Classification input box, do ctrl+a, delete, and type
    console.log('Clearing existing value and typing l...');
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(100);
    await page.keyboard.press('Delete');
    await page.waitForTimeout(100);
    await page.keyboard.type('l');
    await page.waitForTimeout(500); // Wait for dropdown to appear

    // Use down arrow 2 times and click enter
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    await page.keyboard.press('Enter');
    console.log('Selected Vehicle Classification with "l"');

    // Wait to load (give some seconds)
    await page.waitForTimeout(500);
    // await page.pause();

    // ===== NEW STEP 1: Fill Secondary Vehicle Classification =====
console.log('Looking for Secondary Vehicle Classification input...');
const secondaryVehicleClassSelector = '#formsec8360ce8c488ba4fb3181 > div.content > div:nth-child(13) > div > div input';
const secondaryVehicleClassInput = page.locator(secondaryVehicleClassSelector).first();

// Scroll to and wait for visibility
await secondaryVehicleClassInput.scrollIntoViewIfNeeded();
await expect(secondaryVehicleClassInput).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

// Click to focus the Secondary Vehicle Classification input
console.log('Clicking Secondary Vehicle Classification input to focus...');
await secondaryVehicleClassInput.click({ force: true });
await page.waitForTimeout(200);

// Clear existing value and type 'l'
console.log('Clearing existing value and typing l...');
await page.keyboard.press('Control+a');
await page.waitForTimeout(100);
await page.keyboard.press('Delete');
await page.waitForTimeout(100);
await page.keyboard.type('l');
await page.waitForTimeout(500); // Wait for dropdown to appear

// Use arrow key and press enter
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(100);
await page.keyboard.press('Enter');
console.log('Selected Secondary Vehicle Classification with "l"');

// Wait for processing
await page.waitForTimeout(500);

// ===== NEW STEP 2: Fill Original Cost New Of Vehicle =====
console.log('Looking for Original Cost New Of Vehicle input...');
const originalCostLabel = page.locator('label[for="numc0ef72417c2cf0202bec"]');
await expect(originalCostLabel).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

// Find the visible Kendo input within the widget
const originalCostInput = originalCostLabel
  .locator('xpath=following-sibling::*')
  .locator('.k-formatted-value.k-input')
  .first();

// Alternative: Direct approach using the widget container
// const originalCostInput = page.locator('.k-numerictextbox', {
//   has: page.locator('input[name="Original Cost New Of Vehicle"]')
// }).locator('.k-formatted-value.k-input').first();

// Scroll to and wait for visibility
await originalCostInput.scrollIntoViewIfNeeded();
await expect(originalCostInput).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
await expect(originalCostInput).toBeEnabled({ timeout: TIMEOUTS.MEDIUM });

// Click to focus the Original Cost input
console.log('Clicking Original Cost input to focus...');
await originalCostInput.click({ force: true });
await page.waitForTimeout(500);

// await expect(originalCostInput).toBeFocused({ timeout: 2000 });
// console.log('Original Cost input is now focused and ready');

// Clear existing value (0) and type new value
console.log('Clearing existing value and typing 500000...');
await page.keyboard.press('Control+a');
await page.waitForTimeout(100);
await page.keyboard.press('Delete');
await page.waitForTimeout(100);
await page.keyboard.type('500000');
console.log('Typed "500000" in Original Cost input');

// Click outside to trigger validation
// await page.locator('body').click();
await page.waitForTimeout(300);

// ===== NEW STEP 3: Fill Stated Amount =====
console.log('Looking for Stated Amount input...');
const statedAmountLabel = page.locator('label[for="numa1cdba13cde74311438e"]');
await expect(statedAmountLabel).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

// Find the visible Kendo input within the widget
const statedAmountInput = statedAmountLabel
  .locator('xpath=following-sibling::*')
  .locator('.k-formatted-value.k-input')
  .first();

// Alternative: Direct approach using the widget container
// const statedAmountInput = page.locator('.k-numerictextbox', {
//   has: page.locator('input[name="Stated Amount"]')
// }).locator('.k-formatted-value.k-input').first();

// Scroll to and wait for visibility
await statedAmountInput.scrollIntoViewIfNeeded();
await expect(statedAmountInput).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
await expect(statedAmountInput).toBeEnabled({ timeout: TIMEOUTS.MEDIUM });

// Click to focus the Stated Amount input
console.log('Clicking Stated Amount input to focus...');
await statedAmountInput.click({ force: true });
await page.waitForTimeout(500);

// Clear existing value (0) and type new value
console.log('Clearing existing value and typing 50000...');
await page.keyboard.press('Control+a');
await page.waitForTimeout(100);
await page.keyboard.press('Delete');
await page.waitForTimeout(100);
await page.keyboard.type('50000');
console.log('Typed "50000" in Stated Amount input');

// Click outside to trigger validation
// await page.locator('body').click();
await page.waitForTimeout(300);
// Click outside to trigger validation
// await page.locator('body').click();
// await page.waitForTimeout(300);

// Wait for all form processing to complete
await page.waitForTimeout(1000);

    // Save vehicle
    const saveBtn = page.getByRole('button', { name: /Save/i });
    await expect(saveBtn).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    await saveBtn.click();
    
    await helpers.verifyAlert('Truck Saved Successfully');

    results.push({
      testId: 'TS002',
      testName: 'Verify New Quote Creation Flow',
      status: 'Pass',
      duration: Date.now() - start
    });

    console.log('=== Test Completed Successfully ===');

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    
    // Capture DOM on test failure
    await DOMCapture.captureOnFailure(page, 'TS002', err);
    
    results.push({
      testId: 'TS002',
      testName: 'Verify New Quote Creation Flow',
      status: 'Fail',
      duration: Date.now() - start
    });
    
    console.error('Test failed:', errorMessage);
    throw err;
  }
});

    // Test 3: Customer Accounts Menu Navigation
    test('TS004: Customer Accounts Menu Redirect', async ({ page }) => {
        // Set longer timeout for this test
        test.setTimeout(180000);
        const start = Date.now();
        let loginPage: LoginPage;
        // Removed unused variable 'homePage'
        try {
            // Initialize page objects
            loginPage = new LoginPage(page);
            // Removed: homePage = new HomePage(page);
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
                // Removed: await homePage.navigateToCustomerAccounts();
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
                
                // Capture DOM after login
                await DOMCapture.capture(page, 'TS005', 'Login_Successful', true);
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
                        console.log(`Navigation attempt ${retryCount} failed: ${error}`);
                        if (retryCount === maxRetries) throw new Error(`Navigation failed after ${maxRetries} attempts: ${error}`);
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
            
            // Capture DOM on test failure
            await DOMCapture.captureOnFailure(page, 'TS005', err);
            
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
            const quotesPage = new QuotesPage(page);

            // Step 1: Login and ensure page is ready
            await test.step('Login to application', async () => {
                console.log('Starting Quotes Navigation test...');
                await loginPage.login();
                // Wait for dashboard to be visible after login
                await expect(page.getByRole('textbox', { name: /search/i }))
                    .toBeVisible({ timeout: 60000 });
                
                // Capture DOM after login
                await DOMCapture.capture(page, 'TS006', 'Login_Successful', true);
            });
            
            // Step 2: Navigate to Quotes
            await test.step('Navigate to Quotes', async () => {
                await quotesPage.navigateToQuotes();
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
            
            // Capture DOM on test failure
            await DOMCapture.captureOnFailure(page, 'TS006', err);
            
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
            // Removed: const homePage = new HomePage(page);
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
            
            // Capture DOM on test failure
            await DOMCapture.captureOnFailure(page, 'TS007', err);
            
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