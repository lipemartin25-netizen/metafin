// e2e/10-settings.spec.js
import { test, expect } from '@playwright/test';
import { PAGES } from './fixtures/test-data.js';
import { waitForPageLoad } from './helpers/utils.js';

test.describe('Configurações', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(PAGES.settings);
        await waitForPageLoad(page);
    });

    test('deve carregar página de configurações', async ({ page }) => {
        await expect(page).toHaveURL(/settings/);
        const header = page.locator('h1, h2').filter({ hasText: /config|settings|preferên/i });
        await expect(header.first()).toBeVisible({ timeout: 10000 });
    });

    test('deve exibir informações do perfil', async ({ page }) => {
        const profileSection = page.locator(
            'text=/perfil|profile|email|nome/i'
        );
        await expect(profileSection.first()).toBeVisible({ timeout: 5000 });
    });
});
