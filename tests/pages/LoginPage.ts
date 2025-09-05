import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import config from '../../config.json';

export class LoginPage extends BasePage {
  private usernameInput = this.page.getByRole('textbox', { name: 'User Name' });
  private passwordInput = this.page.getByRole('textbox', { name: 'Password' });
  private loginButton = this.page.getByRole('button', { name: 'LOGIN' });

  async waitForPageReady() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async isLoginPage() {
    try {
      await this.waitForPageReady();
      await this.loginButton.waitFor({ state: 'attached', timeout: 10000 });
      const isVisible = await this.loginButton.isVisible();
      console.log(`Login page check: ${isVisible ? 'Yes' : 'No'}`);
      return isVisible;
    } catch (error) {
      console.log('Login page check failed:', error.message);
      return false;
    }
  }

  async login(username: string = config.username, password: string = config.password) {
    try {
      // Always navigate to login page first
      console.log('Navigating to login page');
      await this.page.goto(config.appUrl);
      await this.waitForPageReady();
      
      // Wait for URL to indicate we're on login page
      await this.page.waitForURL(/.*\/Account\/Login.*/, { timeout: 30000 });
      console.log('Reached login page');

      // Wait for and fill credentials
      await this.usernameInput.waitFor({ state: 'visible' });
      await this.passwordInput.waitFor({ state: 'visible' });
      
      console.log('Entering login credentials');
      await this.usernameInput.fill(username);
      await this.passwordInput.fill(password);
      
      // Click login and wait for auth flow
      console.log('Clicking login button');
      await this.loginButton.click();

      console.log('Waiting for authentication flow');
      await this.page.waitForURL(/.*callback\.html.*/, { timeout: 30000 });
      console.log('Reached callback page');
      
      await this.page.waitForURL(/.*Index\.html#\/home.*/, { timeout: 30000 });
      console.log('Authentication complete - reached home page');
      
      await this.waitForPageReady();
    } catch (error) {
      console.error('Login failed:', error.message);
      throw error;
    }
  }
}
