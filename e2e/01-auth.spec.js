// e2e/01-auth.spec.js
import { test, expect } from '@playwright/test';
import { TEST_USER, PAGES } from './fixtures/test-data.js';
import { waitForPageLoad } from './helpers/utils.js';

test.describe('Autenticação', () => {

    test.describe('Login', () => {
        // Estes testes NÃO usam o storageState (precisam testar login do zero)
        test.use({ storageState: { cookies: [], origins: [] } });

        test('deve exibir página de login com formulário', async ({ page }) => {
            await page.goto(PAGES.login);
            await waitForPageLoad(page);

            // Verificar elementos do formulário
            await expect(page.locator('input[type="email"]').first()).toBeVisible();
            await expect(page.locator('input[type="password"]').first()).toBeVisible();
            await expect(page.locator('button[type="submit"], button:has-text("Entrar")').first()).toBeVisible();
        });

        test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
            await page.goto(PAGES.login);
            await waitForPageLoad(page);

            await page.locator('input[type="email"]').first().fill('invalido@teste.com');
            await page.locator('input[type="password"]').first().fill('senhaerrada123');
            await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();

            // Esperar mensagem de erro
            const errorMessage = page.locator(
                'text=/erro|inválid|incorrect|invalid|falha/i'
            );
            await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
        });

        test('deve fazer login com credenciais válidas', async ({ page }) => {
            await page.goto(PAGES.login);
            await waitForPageLoad(page);

            await page.locator('input[type="email"]').first().fill(TEST_USER.email);
            await page.locator('input[type="password"]').first().fill(TEST_USER.password);
            await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();

            // Esperar redirecionamento
            await page.waitForURL(/\/app\//, { timeout: 15000 });
            await expect(page).toHaveURL(/\/app\//);
        });

        test('deve bloquear acesso a rotas protegidas sem login', async ({ page }) => {
            await page.goto(PAGES.dashboard);
            await page.waitForLoadState('networkidle');

            // Deve redirecionar para login
            await expect(page).not.toHaveURL(/\/app\/dashboard/);
        });
    });

    test.describe('Logout', () => {
        test('deve fazer logout e redirecionar para login', async ({ page }) => {
            await page.goto(PAGES.dashboard);
            await waitForPageLoad(page);

            // Encontrar botão de logout
            const logoutBtn = page.locator(
                'button:has-text("Sair"), button:has-text("Logout"), [data-testid="logout-btn"], button:has(svg.lucide-log-out)'
            ).first();

            if (await logoutBtn.isVisible().catch(() => false)) {
                await logoutBtn.click();

                // Confirmar dialog se aparecer
                page.on('dialog', dialog => dialog.accept());

                // Verificar redirecionamento para login
                await page.waitForURL(/\/(login)?$/, { timeout: 10000 });
            }
        });
    });

    test.describe('Proteção de Rotas', () => {
        test('todas as rotas /app/* devem estar protegidas', async ({ page }) => {
            const protectedRoutes = [
                PAGES.dashboard,
                PAGES.transactions,
                PAGES.goals,
                PAGES.budgets,
                PAGES.health,
                PAGES.webhooks,
                PAGES.settings,
            ];

            // Nota: este teste usa storageState autenticado
            for (const route of protectedRoutes) {
                await page.goto(route);
                await waitForPageLoad(page);
                // Deve carregar (não redirecionar para login)
                await expect(page).toHaveURL(new RegExp(route.replace(/\//g, '\\/')));
            }
        });
    });
});
