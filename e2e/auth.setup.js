// e2e/auth.setup.js
import { test as setup, expect } from '@playwright/test';
import { TEST_USER, PAGES } from './fixtures/test-data.js';

setup('autenticar usuário de teste', async ({ page }) => {
    console.log('[SETUP] Iniciando autenticação...');

    // Navegar para login
    await page.goto(PAGES.login);
    await page.waitForLoadState('networkidle');

    // Preencher credenciais
    // Tentar encontrar o campo de email por diferentes seletores
    const emailInput = page.locator(
        'input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="Email"]'
    ).first();
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(TEST_USER.email);

    const passwordInput = page.locator(
        'input[type="password"], input[name="password"]'
    ).first();
    await passwordInput.fill(TEST_USER.password);

    // Clicar no botão de login
    const loginButton = page.locator(
        'button[type="submit"], button:has-text("Entrar"), button:has-text("Login"), button:has-text("Acessar")'
    ).first();
    await loginButton.click();

    // Esperar redirecionamento para área logada
    await page.waitForURL(/\/app\//, { timeout: 15000 });
    await expect(page).toHaveURL(/\/app\//);

    console.log('[SETUP] Autenticação concluída ✅');

    // Salvar estado de autenticação
    await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
