# Playwright Test Suite Implementation Guide

## Overview
This document provides comprehensive instructions for implementing Playwright test suites following the patterns established in the customer portal test suite. The implementation includes advanced DOM capture, robust error handling, and enterprise-grade test automation practices.

## Table of Contents
1. [Project Structure](#project-structure)
2. [Import Organization](#import-organization)
3. [DOM Capture System](#dom-capture-system)
4. [Test Suite Configuration](#test-suite-configuration)
5. [Helper Classes and Utilities](#helper-classes-and-utilities)
6. [Constants and Configuration](#constants-and-configuration)
7. [Page Object Pattern](#page-object-pattern)
8. [Test Organization Patterns](#test-organization-patterns)
9. [Error Handling and Recovery](#error-handling-and-recovery)
10. [Selector Strategies](#selector-strategies)
11. [Form Interaction Patterns](#form-interaction-patterns)
12. [Navigation and URL Handling](#navigation-and-url-handling)
13. [Modal and Dialog Management](#modal-and-dialog-management)
14. [Loading State Management](#loading-state-management)
15. [Retry and Resilience Patterns](#retry-and-resilience-patterns)
16. [Result Tracking and Reporting](#result-tracking-and-reporting)
17. [Screenshot and Accessibility Testing](#screenshot-and-accessibility-testing)

## Project Structure

```
tests/
├── test-suite.spec.ts          # Main test suite file
├── pages/                      # Page Object classes
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── HomePage.ts
│   ├── AccountsPage.ts
│   ├── QuotesPage.ts
│   └── ...
├── utils/
│   └── reporter.ts             # Test reporting utilities
├── dom-captures/               # DOM capture storage (auto-created)
├── test-results/               # Test execution results
└── playwright-report/          # Playwright HTML reports

config/
├── config.json                 # Application configuration
└── playwright.config.ts        # Playwright configuration
```

## Import Organization

```typescript
// 1. Playwright core imports
import { test, expect, Page, Locator } from '@playwright/test';

// 2. Utility imports (file system, path, etc.)
import * as fs from 'fs';
import * as path from 'path';

// 3. Custom utility imports
import { saveResultsToJson, generateHtmlReport, TestResult } from '../utils/reporter';

// 4. Page Object imports
import { LoginPage } from './LoginPage';
import { HomePage } from './HomePage';
import { AccountsPage } from './pages/AccountsPage';

// 5. Configuration imports
import config from '../config.json';

// 6. Type imports (if needed)
import type { QuoteFilterData } from './pages/QuotesPage';
```

## DOM Capture System

### Implementation Pattern

```typescript
class DOMCapture {
  private static captureDir = path.join(process.cwd(), 'dom-captures');

  static async initialize(): Promise<void> {
    if (!fs.existsSync(this.captureDir)) {
      fs.mkdirSync(this.captureDir, { recursive: true });
      console.log(`DOM capture directory created: ${this.captureDir}`);
    }
  }

  static async capture(
    page: Page,
    testName: string,
    stepName: string,
    includeScreenshot: boolean = false
  ): Promise<void> {
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
      if (includeScreenshot) {
        const screenshotPath = path.join(this.captureDir, `${filename}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
      }

      // Capture metadata
      const metadata = {
        timestamp: new Date().toISOString(),
        testName,
        stepName,
        url: page.url(),
        title: await page.title(),
        viewport: await page.viewportSize(),
        userAgent: await page.evaluate(() => navigator.userAgent)
      };

      const metadataPath = path.join(this.captureDir, `${filename}_metadata.json`);
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

      console.log(`DOM captured: ${filename}`);
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

      // Capture failure data
      const failureData = {
        timestamp: new Date().toISOString(),
        testName,
        error: error.message || String(error),
        url: page.url(),
        title: await page.title(),
        htmlPath,
        screenshotPath
      };

      const failurePath = path.join(this.captureDir, `${filename}_failure.json`);
      fs.writeFileSync(failurePath, JSON.stringify(failureData, null, 2), 'utf8');

      console.log(`Failure DOM captured: ${filename}`);
    } catch (captureError) {
      console.error('Failed to capture failure DOM:', captureError);
    }
  }
}
```

### Usage Patterns

```typescript
// Initialize in beforeAll
test.beforeAll(async () => {
  await DOMCapture.initialize();
});

// Capture at key points
await DOMCapture.capture(page, 'TS001', 'Initial_Home_Load', true);

// Capture on failure
} catch (err) {
  await DOMCapture.captureOnFailure(page, 'TS001', err);
  throw err;
}
```

## Test Suite Configuration

```typescript
test.describe('Customer Portal Test Suite', () => {
  // Run tests serially (one after another)
  test.describe.configure({ mode: 'serial' });

  // Global setup
  test.beforeAll(async () => {
    console.log('Starting test suite execution...');
    await DOMCapture.initialize();
  });

  // Global teardown
  test.afterAll(async () => {
    saveResultsToJson(results);
    generateHtmlReport(results);
  });
});
```

## Helper Classes and Utilities

### TestHelpers Class Pattern

```typescript
class TestHelpers {
  constructor(private page: Page) {}

  async waitForPageReady(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForFunction(() =>
      !document.body.classList.contains('pace-running'),
      { timeout: TIMEOUTS.MEDIUM }
    ).catch(() => console.log('Loading state check completed'));
  }

  async selectFromKendoDropdown(
    selector: string | Locator,
    optionText: string,
    maxRetries: number = 3
  ): Promise<void> {
    const dropdown = typeof selector === 'string'
      ? this.page.locator(selector)
      : selector;

    await expect(dropdown).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

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
}
```

## Constants and Configuration

```typescript
// Timeout constants
const TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 10000,
  LONG: 30000,
  PAGE_LOAD: 30000,
  NETWORK_IDLE: 15000
} as const;

// Test data constants
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
  }
} as const;
```

## Page Object Pattern

### Base Page Object

```typescript
export class BasePage {
  constructor(protected page: Page) {}

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url);
    await this.waitForPageLoad();
  }
}
```

### Specific Page Object

```typescript
export class LoginPage extends BasePage {
  private readonly usernameInput = this.page.getByRole('textbox', { name: /username/i });
  private readonly passwordInput = this.page.getByRole('textbox', { name: /password/i });
  private readonly loginButton = this.page.getByRole('button', { name: /login/i });

  async login(username?: string, password?: string): Promise<void> {
    const user = username || config.defaultUser.username;
    const pass = password || config.defaultUser.password;

    await this.usernameInput.fill(user);
    await this.passwordInput.fill(pass);
    await this.loginButton.click();

    await this.page.waitForURL(/.*dashboard.*/, { timeout: 30000 });
  }
}
```

## Test Organization Patterns

### Test Structure with Steps

```typescript
test('TS001: Verify Customer Search by Account Name', async ({ page }) => {
  test.setTimeout(180000);
  const start = Date.now();
  const helpers = new TestHelpers(page);

  try {
    // Step 1: Navigation
    await test.step('Navigate to home page', async () => {
      await page.goto(config.appUrl);
      await page.waitForURL(/.*Index\.html#\/home.*/, { timeout: TIMEOUTS.PAGE_LOAD });
      await DOMCapture.capture(page, 'TS001', 'Initial_Home_Load', true);
    });

    // Step 2: Search operation
    await test.step('Perform customer search', async () => {
      const searchBox = page.getByRole('textbox', { name: /Search By Customer Account Name/i });
      await searchBox.fill('Texas State University');
      await page.getByRole('button', { name: /Search/i }).click();
      await helpers.waitForPageReady();
    });

    // Step 3: Verification
    await test.step('Verify search results', async () => {
      const resultsTable = page.getByRole('table');
      await expect(resultsTable).toContainText('Texas State University');
    });

    results.push({
      testId: 'TS001',
      testName: 'Verify Customer Search by Account Name',
      status: 'Pass',
      duration: Date.now() - start
    });

  } catch (err) {
    await DOMCapture.captureOnFailure(page, 'TS001', err);
    results.push({
      testId: 'TS001',
      testName: 'Verify Customer Search by Account Name',
      status: 'Fail',
      duration: Date.now() - start
    });
    throw err;
  }
});
```

## Error Handling and Recovery

### Comprehensive Error Handling

```typescript
try {
  // Test logic here
  await riskyOperation();

  results.push({
    testId: 'TS001',
    testName: 'Test Name',
    status: 'Pass',
    duration: Date.now() - start
  });

} catch (err) {
  const errorMessage = err instanceof Error ? err.message : String(err);

  // Capture DOM on failure for debugging
  await DOMCapture.captureOnFailure(page, 'TS001', err);

  // Log detailed error information
  console.error('Test failed:', errorMessage);

  // Record failure result
  results.push({
    testId: 'TS001',
    testName: 'Test Name',
    status: 'Fail',
    duration: Date.now() - start
  });

  throw err; // Re-throw to maintain test framework behavior
}
```

## Selector Strategies

### Multiple Fallback Strategies

```typescript
async selectDeductibleInSection(sectionLabel: string, value: string = '100'): Promise<void> {
  console.log(`Looking for deductible section: "${sectionLabel}"`);

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

  // Final verification
  const isVisible = await section.isVisible({ timeout: 2000 }).catch(() => false);
  if (!isVisible) {
    throw new Error(`Deductible section "${sectionLabel}" not found after trying multiple strategies`);
  }

  console.log(`Found deductible section for "${sectionLabel}"`);
  await section.scrollIntoViewIfNeeded();
}
```

## Form Interaction Patterns

### Slow Form Filling

```typescript
async fillFieldSlowly(selector: string | Locator, text: string, delay: number = 100): Promise<void> {
  const field = typeof selector === 'string' ? this.page.locator(selector) : selector;
  await field.waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM });
  await field.focus();

  for (const char of text) {
    await field.type(char, { delay });
  }
}
```

### Autocomplete Handling

```typescript
// Fill SIC Code with autocomplete
const sicCodeInput = page.getByRole('textbox', { name: 'SIC Code/Description*' });
await helpers.fillFieldSlowly(sicCodeInput, TEST_DATA.applicant.sicCode);

await page.waitForTimeout(1000);
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(500);
await page.keyboard.press('Enter');
```

## Navigation and URL Handling

### URL Pattern Matching

```typescript
// Navigate with URL verification
await page.goto(config.appUrl);
await page.waitForURL(/.*Index\.html#\/home.*/, { timeout: TIMEOUTS.PAGE_LOAD });

// Verify navigation to specific page
await page.waitForURL(/.*\/BD\/McKee\/index\.html.*#\/Product/, { timeout: TIMEOUTS.PAGE_LOAD });

// Flexible URL matching
await page.waitForURL((url) => url.toString().includes('Truck'), { timeout: TIMEOUTS.PAGE_LOAD });
```

## Modal and Dialog Management

### SweetAlert Handling

```typescript
async handleSweetAlert(): Promise<void> {
  const popup = this.page.locator('.sweet-alert.showSweetAlert.visible');
  await popup.waitFor({ state: 'visible', timeout: TIMEOUTS.SHORT });
  const yesButton = popup.locator('button.confirm');
  await yesButton.waitFor({ state: 'visible', timeout: TIMEOUTS.SHORT });
  await yesButton.click();
  await popup.waitFor({ state: 'hidden', timeout: TIMEOUTS.SHORT });
  await this.page.waitForTimeout(1000);
}
```

### Modal Detection and Handling

```typescript
// Handle modal dialog that appears after clicking
const modalDialog = page.getByText('Please add either Hired Auto or Non Owned on the Policy/i');
const modalOkButton = page.getByRole('button', { name: /^OK$/ });

let modalHandled = false;
try {
  await expect(modalDialog).toBeVisible({ timeout: 5000 });
  console.log('Modal dialog appeared, clicking OK...');
  await modalOkButton.click();
  await expect(modalDialog).not.toBeVisible({ timeout: TIMEOUTS.SHORT });
  modalHandled = true;
} catch (error) {
  console.log('No modal dialog appeared, continuing...');
}
```

## Loading State Management

### Pace.js Loading Indicator

```typescript
async waitForPageReady(): Promise<void> {
  await this.page.waitForLoadState('networkidle');
  await this.page.waitForFunction(() =>
    !document.body.classList.contains('pace-running'),
    { timeout: TIMEOUTS.MEDIUM }
  ).catch(() => console.log('Loading state check completed'));
}

// Usage throughout tests
await helpers.waitForPageReady();
```

## Retry and Resilience Patterns

### Retry Logic for Dropdown Selection

```typescript
async selectFromKendoDropdown(
  selector: string | Locator,
  optionText: string,
  maxRetries: number = 3
): Promise<void> {
  const dropdown = typeof selector === 'string'
    ? this.page.locator(selector)
    : selector;

  await expect(dropdown).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

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
```

### Navigation Retry Pattern

```typescript
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
    if (retryCount === maxRetries)
      throw new Error(`Navigation failed after ${maxRetries} attempts: ${error}`);
    await page.waitForTimeout(2000);
  }
}
```

## Result Tracking and Reporting

### Test Result Collection

```typescript
// Global results array
const results: TestResult[] = [];

// In each test
results.push({
  testId: 'TS001',
  testName: 'Verify Customer Search by Account Name',
  status: 'Pass',
  duration: Date.now() - start
});

// In catch block
results.push({
  testId: 'TS001',
  testName: 'Verify Customer Search by Account Name',
  status: 'Fail',
  duration: Date.now() - start
});
```

### Report Generation

```typescript
test.afterAll(async () => {
  console.log('Test suite completed. Generating reports...');
  saveResultsToJson(results);
  generateHtmlReport(results);
});
```

## Screenshot and Accessibility Testing

### Accessibility Snapshot

```typescript
// Capture accessibility information
const accessibilitySnapshot = await page.accessibility.snapshot();
const accessibilityPath = path.join(this.captureDir, `${filename}_accessibility.json`);
fs.writeFileSync(accessibilityPath, JSON.stringify(accessibilitySnapshot, null, 2), 'utf8');
```

### Full Page Screenshots

```typescript
// Capture full page screenshot
const screenshotPath = path.join(this.captureDir, `${filename}.png`);
await page.screenshot({ path: screenshotPath, fullPage: true });
```

## Configuration Management

### Config File Structure

```json
{
  "appUrl": "https://your-app-url.com",
  "defaultUser": {
    "username": "testuser",
    "password": "testpass"
  },
  "timeouts": {
    "short": 5000,
    "medium": 10000,
    "long": 30000
  }
}
```

### TypeScript Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 180000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

## Best Practices Summary

1. **Always use DOM capture** for debugging complex test failures
2. **Implement multiple selector strategies** for resilient element location
3. **Use helper classes** to encapsulate common operations
4. **Handle loading states** properly with pace.js or similar indicators
5. **Implement retry logic** for flaky operations
6. **Use test.step()** for better test organization and reporting
7. **Capture screenshots and accessibility data** at key test points
8. **Handle modals and dialogs** proactively
9. **Use constants** for timeouts and test data
10. **Implement comprehensive error handling** with detailed logging
11. **Use Page Object pattern** for maintainable test code
12. **Generate multiple report formats** (JSON, HTML)
13. **Use TypeScript** for better type safety and IDE support
14. **Organize tests serially** when they depend on each other
15. **Use semantic locators** (roles, labels) over CSS selectors when possible

## Implementation Checklist

- [ ] Set up project structure with proper directories
- [ ] Implement DOMCapture class for debugging
- [ ] Create helper classes for common operations
- [ ] Define constants for timeouts and test data
- [ ] Implement Page Object classes
- [ ] Set up test suite configuration with serial mode
- [ ] Implement comprehensive error handling
- [ ] Add retry logic for flaky operations
- [ ] Set up result tracking and reporting
- [ ] Configure accessibility and screenshot capture
- [ ] Test all patterns with sample scenarios
- [ ] Generate documentation for maintenance

This guide provides a complete framework for implementing robust, maintainable Playwright test suites with enterprise-grade features for debugging, error handling, and reporting.
