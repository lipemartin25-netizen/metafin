import { test, expect } from '@playwright/test';

test.describe('MetaFin Smoke Suite (P0)', () => {

    test('should load the home page with correct branding and mobile menu', async ({ page, isMobile }) => {
        await page.goto('/');
        await expect(page.locator('text=MetaFin').first()).toBeVisible();

        if (isMobile) {
            // Check if the hamburger menu is visible
            await expect(page.locator('button >> svg.lucide-menu')).toBeVisible();
            await page.click('button >> svg.lucide-menu');
            // Check menu items
            await expect(page.locator('text=Tecnologia')).toBeVisible();
            await page.click('button >> svg.lucide-x');
        } else {
            const signupBtn = page.locator('text=Iniciar Agora').first();
            await expect(signupBtn).toBeVisible();
        }
    });

    test('should render the login page correctly with new fields', async ({ page }) => {
        await page.goto('/login');

        // New Login UI uses Identification (userId)
        await expect(page.locator('input[id="userId"]')).toBeVisible();
        await expect(page.locator('text=Acessar Ecossistema')).toBeVisible();
        await expect(page.locator('text=Continuar com Google')).toBeVisible();

        // Unhappy path: submit empty form
        await page.locator('button[type="submit"]').click();
        await expect(page).toHaveURL(/.*login/);
    });

    test('should handle invalid login with error feedback', async ({ page }) => {
        await page.goto('/login');

        await page.locator('input[id="userId"]').fill('fake-user-id');
        const submitBtn = page.locator('button[type="submit"]');

        await submitBtn.click();

        // Check for error message
        await expect(page.locator('text=Falha')).toBeVisible({ timeout: 10000 });
    });
});
