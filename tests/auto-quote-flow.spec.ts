import { test } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { LocationPage } from './pages/LocationPage';
import { AULocationPage } from './pages/AULocationPage';
import { TruckPage } from './pages/TruckPage';
import { RiskSummaryPage } from './pages/RiskSummaryPage';
import { EndorsementsPage } from './pages/EndorsementsPage';
import { QuoteSummaryPage } from './pages/QuoteSummaryPage';
import { AccountsPage } from './pages/AccountsPage';

test('TS008 - Verify Full Automobile Quote Flow', async ({ page }) => {
    // Set longer timeout for this long flow
    test.setTimeout(300000);

    // Initialize page objects
    const loginPage = new LoginPage(page);
    const homePage = new HomePage(page);
    const accountPage = new AccountsPage(page);
    const locationPage = new LocationPage(page);
    const auLocationPage = new AULocationPage(page);
    const truckPage = new TruckPage(page);
    const riskSummaryPage = new RiskSummaryPage(page);
    const endorsementsPage = new EndorsementsPage(page);
    const quoteSummaryPage = new QuoteSummaryPage(page);

    try {
        // Start from login and account creation
        console.log('Starting Full Automobile Quote Flow test...');
        await loginPage.login();
        await homePage.navigateToNewQuote();
        
        // Fill account details (reusing existing methods)
        await accountPage.fillNameOfApplicant('Hospital for Special Surgery - Radiology');
        await accountPage.fillSicCode('0971 - Hunting, Trapping, Game Propagation');
        await accountPage.selectLegalEntry('Corporation');
        await accountPage.proceedToApplication();

        // Location page steps
        console.log('Starting Location page flow...');
        await locationPage.waitForPageReady();
        await locationPage.saveAndNavigateToAULocation();

        // AU Location page steps
        console.log('Starting AU Location page flow...');
        await auLocationPage.waitForPageReady();
        await auLocationPage.configureAutomobileCoverage({
            limit: '25,000',
            basicEco: true,
            collision: true,
            otherThanCollision: true,
            additionalPIP: true,
            pipCoverage: 'Provided',
            pipOption: 'B'
        });
        await auLocationPage.proceedToAutomobileExposure();

        // Truck page steps
        console.log('Starting Truck page flow...');
        await truckPage.waitForPageReady();
        await truckPage.fillVehicleDetails({
            year: '2024',
            make: 'Mahindra',
            model: 'Thar',
            vin: '1234567890123456',
            originalCost: '500000',
            statedAmount: '300000'
        });
        await truckPage.selectClassifications();
        await truckPage.saveAndProceed();

        // Risk Summary page steps
        console.log('Starting Risk Summary page flow...');
        await riskSummaryPage.waitForPageReady();
        await riskSummaryPage.proceedToEndorsement();

        // Endorsements page steps
        console.log('Starting Endorsements page flow...');
        await endorsementsPage.waitForPageReady();
        await endorsementsPage.proceedToQuoteSummary();

        // Quote Summary page steps
        console.log('Starting Quote Summary page flow...');
        await quoteSummaryPage.waitForPageReady();
        await quoteSummaryPage.generateQuotePremium();

        console.log('Full Automobile Quote Flow test completed successfully');

    } catch (error) {
        if (error instanceof Error) {
            console.error('Full Automobile Quote Flow test failed:', error.message);
        } else {
            console.error('Full Automobile Quote Flow test failed:', error);
        }
        throw error;
    }
});
