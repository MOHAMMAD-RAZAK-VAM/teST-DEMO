# Copilot Instructions

You are assisting with Playwright TypeScript E2E tests for this project.

## General Rules
- Always use Playwright MCP to discover selectors dynamically (no static guessing).
- Use Page Object Model (POM):
  - `pages/BasePage.ts` for shared actions
  - `pages/LoginPage.ts` for authentication
  - `pages/HomePage.ts` for home page interactions
  - Add more pages as needed
- Use `config.json` for:
  - URL
  - username
  - password
- Use `test-data/*.json` for test-specific input values.
- Use role-based selectors (`getByRole`) wherever possible.
- Always add explicit waits for navigation and elements.
- Save tests under the `tests/` folder with descriptive filenames.
- Add meaningful test names and comments.
- Tests must iterate and re-run until they pass reliably.

## Assertion Guidelines
- Always verify final URLs after navigation.
- Validate headers, selectors, and visible text.
- Ensure data-driven fields (from test-data) are correctly displayed in UI.
- Fail fast with clear error messages when expectations are not met.

## Example Test Names
- "Verify Quick Transactions Flow"
- "Verify Customer Search by Account Name"
- "Verify Homepage Tabs"
