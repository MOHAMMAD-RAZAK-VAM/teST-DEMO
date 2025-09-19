import { test } from '@playwright/test';
import { LoginPage } from './LoginPage';
import { HomePage } from './HomePage';
import config from '../config.json';

test('TS002: Verify Quote ID Search', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const homePage = new HomePage(page);

  // Step 1: Navigate to app and expect redirect to login
  console.log(`Navigating to ${config.appUrl}`);
  await page.goto(config.appUrl);
  
  // Wait for redirect to login page
  await page.waitForURL(/.*\/Account\/Login.*/, { timeout: 30000 });
  console.log('Redirected to login page successfully');
  
  // Step 2: Login and handle authentication flow
  await loginPage.login(config.username, config.password);

  // Step 4: Wait for page load
  await homePage.waitForPageLoad();
  
  // Wait for any initial loading to complete
  await page.waitForFunction(() => !document.body.classList.contains('pace-running'), { timeout: 10000 })
    .catch(() => console.log('Page already loaded'));
  
  // Change search type to Quote ID
  await homePage.changeSearchType('Quote ID');

  // Step 5: Perform quote search using an existing quote ID
  await homePage.searchByText('QCA010654');

  // Step 6: Verify results
  await homePage.verifySearchResults('QCA010654');
});
