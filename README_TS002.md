# Playwright Test Suite - TS002 Vehicle Details Generator

## Overview
This test suite contains TS002 which demonstrates a complete end-to-end flow for creating a new quote in an insurance application and filling vehicle details.

## TS002 Test Flow

### Step 1: Navigation and Product Selection
- Navigate to the insurance application
- Select "Commercial Automobile" product
- Choose writing company
- Proceed to Account section

### Step 2: Account Form Fill
- Fill applicant name with autocomplete
- Select SIC Code/Description
- Choose Legal Entity
- Proceed to Application/Location

### Step 3: Location Flow with Product Designation Fix
- Fill location details with Florida address
- **Handle product designation validation** - This was the key fix that resolves the "Please designate at least one product for this location" error
- Use multiple strategies to ensure products are selected:
  - Check existing checkboxes
  - Use JavaScript evaluation to force selection
  - Retry mechanisms for validation errors
- Save location successfully

### Step 4: AULocation Navigation
- Navigate to AULocation page
- Set up product offerings

### Step 5: Limits & Deductibles
- Configure coverage limits
- Set deductibles for Collision and Other Than Collision
- Handle Personal Injury Protection settings

### Step 6: Non-Owned Auto Coverage
- Configure employee vehicle usage
- Set coverage options

### Step 7: Automobile Exposure and Vehicle Details
- Navigate to RiskSummary
- Add vehicle (Truck type)
- **Fill Vehicle Details** - The main objective:
  - **Year**: 2024
  - **Make**: Kia
  - **Model**: Sonet
  - **VIN**: 12345678910
  - **Vehicle Classification**: Selected from dropdown

## Key Improvements Made

### 1. Product Designation Fix
The original test was failing at the location save step due to "Please designate at least one product for this location" validation. The fix includes:
- Comprehensive checkbox detection and selection
- JavaScript evaluation to force product selection
- Retry mechanisms with alternative approaches
- DOM capture for debugging failed attempts

### 2. Robust Vehicle Details Filling
- Multiple selector strategies (data-bind attributes, ID patterns)
- Fallback mechanisms for element detection
- Proper field clearing and typing
- Dropdown selection with keyboard navigation
- Success verification with multiple indicators

### 3. Enhanced Error Handling
- DOM capture on failures for debugging
- Alternative element selection strategies
- Retry mechanisms for transient failures
- Comprehensive logging for troubleshooting

## Test Data Configuration

```typescript
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
}
```

## Running the Test

```bash
# Run the specific test
npx playwright test tests/test-suite.spec.ts --grep "TS002"

# Run with headed browser to see the execution
npx playwright test tests/test-suite.spec.ts --grep "TS002" --headed

# Run with debugging
npx playwright test tests/test-suite.spec.ts --grep "TS002" --debug
```

## DOM Capture Feature

The test includes comprehensive DOM capture functionality:
- Captures HTML, accessibility snapshots, and screenshots at key points
- Saves files in `dom-captures/` directory with timestamps
- Automatically captures on test failures
- Helps with debugging and understanding page structure

## Browser Session Management

- Includes retry mechanisms for browser crashes
- Handles session conflicts gracefully
- Automatic cleanup and restart capabilities

## Success Criteria

The test passes when:
1. All navigation steps complete successfully
2. Product designation validation is resolved
3. Location is saved without errors
4. Vehicle details are filled correctly:
   - Year: 2024
   - Make: Kia
   - Model: Sonet
   - VIN: 12345678910
   - Vehicle Classification: Selected
5. Vehicle is saved successfully

## Files Modified

- `tests/test-suite.spec.ts` - Main test file with TS002 implementation
- Enhanced with DOM capture, robust error handling, and product designation fixes

This test demonstrates a complete automation solution for insurance quote creation with vehicle details filling, addressing the key challenges of dynamic web elements, validation requirements, and complex form interactions.</content>
<parameter name="filePath">c:\Users\MohammadRazakAbdulRa\OneDrive - ValueMomentum, Inc\Documents\mcp-playwright\README_TS002.md
