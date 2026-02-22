import { test, expect } from '@playwright/test';

test.describe('MetaFin Smoke Suite (P0)', () => {

    test('should load the home page with correct branding', async ({ page }) => {
        // Navigate to the root
        await page.goto('/');

        // Verify title or visible text contains 'MetaFin'
        await expect(page.locator('text=MetaFin').first()).toBeVisible();

        // Verify the main CTA is present
        const cta = page.locator('text=Começar Grátis').first();
        await expect(cta).toBeVisible();
        await cta.click();

        // Verify it navigates to the signup page
        await expect(page).toHaveURL(/.*signup/);
    });

    test('should render the login page correctly', async ({ page }) => {
        await page.goto('/login');

        // Verify login form elements
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
        await expect(page.locator('text=Fazer Login com o Google')).toBeVisible();

        // Unhappy path: submit empty form
        await page.locator('button[type="submit"]').click();

        // HTML5 validation should kick in, we can just check URL didn't change
        await expect(page).toHaveURL(/.*login/);
    });

    // Adding a chaos test: Double click auth
    test('should handle rage-clicking submit button gracefully on login', async ({ page }) => {
        await page.goto('/login');

        await page.locator('input[type="email"]').fill('fake@email.com');
        await page.locator('input[type="password"]').fill('password123');

        const submitBtn = page.locator('button[type="submit"]');

        // Rage click
        await submitBtn.click();
        await submitBtn.click({ force: true });

        // Assuming the app disables the button or shows a loading state
        // We expect it to show 'Erro ao fazer login' or Supabase error because of invalid creds
        // Not crash the app.
        await expect(page.locator('text=Erro')).toBeVisible({ timeout: 10000 });
    });
});
