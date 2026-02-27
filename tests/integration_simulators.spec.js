import { test, expect } from '@playwright/test';

test.describe('MetaFin Integration: Wealth Lab & Simulators', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('mf_auth_token', 'tester.123456.mock_sig');
        });
        await page.goto('/app/lab');
        // Ensure we actually landed on the internal page
        await page.waitForURL('**/app/lab', { timeout: 15000 });
    });

    test('should allow access to Wealth Lab and run FIRE calculation', async ({ page }) => {
        // Check if we are in the Wealth Lab
        await expect(page.locator('h1:has-text("Laboratório Mestre de Wealth")')).toBeVisible({ timeout: 15000 });

        // Open FIRE Simulator
        await page.click('text=Independência Financeira');
        await expect(page.locator('text=Sua Independência Financeira')).toBeVisible();

        // Verify initial calculation (default values)
        const initialFireNumber = await page.locator('p:near(p:text("Meta FIRE"))').first().textContent();
        expect(initialFireNumber).not.toBe('');

        // Change monthly expenses and check if it updates the Meta FIRE
        // The Meta FIRE is 25x or 30x annual expenses depending on settings
        const expenseInput = page.locator('input').nth(1); // monthlyExpenses is usually 2nd
        await expenseInput.fill('10000'); // Increase expenses significantly

        // Wait for calculation debounce/re-render
        await page.waitForTimeout(500);

        const updatedFireNumber = await page.locator('p:near(p:text("Meta FIRE"))').first().textContent();

        // If expenses increased, Meta FIRE should increase
        expect(updatedFireNumber).not.toBe(initialFireNumber);
    });

    test('should show accurate progress bar based on investments', async ({ page }) => {
        await page.click('text=Independência Financeira');

        const investmentInput = page.locator('input').nth(2); // currentInvestments
        const expenseInput = page.locator('input').nth(1); // monthlyExpenses

        await expenseInput.fill('1000'); // low expenses -> low goal
        await investmentInput.fill('300000'); // high investment -> high progress

        await page.waitForTimeout(500);

        // Check if progress is 100% or close to it
        const progressText = await page.locator('p:near(p:text("Progresso"))').first().textContent();
        expect(progressText).toContain('100%');
    });

    test('should navigate back to simulator list', async ({ page }) => {
        await page.click('text=Independência Financeira');
        await page.click('button[title="Voltar aos Simuladores"]');
        await expect(page.locator('text=Laboratório Mestre de Wealth')).toBeVisible();
    });
});
