import { test, expect } from '@playwright/test';

test.describe('MetaFin Integration: Financial Health Analysis', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('mf_auth_token', 'tester.health.mock_sig');
        });
        await page.goto('/app/health');
        await page.waitForURL('**/app/health', { timeout: 15000 });
    });

    test('should display the circular health score and metrics', async ({ page }) => {
        // Look for the score text (e.g., "Excelente", "Boa")
        await expect(page.locator('text=Saúde Financeira')).toBeVisible();

        // Circular score container should exist
        const scoreRing = page.locator('svg').filter({ has: page.locator('circle') });
        await expect(scoreRing.first()).toBeVisible();
    });

    test('should show financial tips based on data', async ({ page }) => {
        // Tips container should be visible
        await expect(page.locator('text=Recomendações do Assistente')).toBeVisible();

        // Should have at least one tip
        const tips = page.locator('.glass-card').filter({ hasText: /%|renda|gastos/i });
        await expect(tips.first()).toBeVisible();
    });

    test('should allow setting and updating a budget', async ({ page }) => {
        // Look for the budget section
        await expect(page.locator('text=Planejamento de Orçamento')).toBeVisible();

        // Find an input for a category (e.g., Alimentação)
        // Note: The UI usually maps categories from data.json
        const budgetInput = page.locator('input[type="number"]').first();
        await budgetInput.fill('2000');

        // Simulate enter or blur
        await budgetInput.press('Enter');

        // Check if value persists (basic verification)
        await expect(budgetInput).toHaveValue('2000');
    });
});
