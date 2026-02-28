// e2e/helpers/utils.js
// Funções auxiliares para testes E2E

import { expect } from '@playwright/test';

/**
 * Espera o loading da página completar
 */
export async function waitForPageLoad(page) {
    // Esperar spinner desaparecer (se existir)
    const spinner = page.locator('.animate-spin');
    if (await spinner.isVisible({ timeout: 1000 }).catch(() => false)) {
        await spinner.waitFor({ state: 'hidden', timeout: 15000 });
    }
    // Esperar network idle
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
}

/**
 * Verifica se o usuário está autenticado (na área logada)
 */
export async function assertAuthenticated(page) {
    await expect(page).toHaveURL(/\/app\//);
    // Verificar que não redirecionou para login
    await expect(page).not.toHaveURL(/\/(login|register|$)/);
}

/**
 * Verifica se um toast/notificação apareceu
 */
export async function expectToast(page, text) {
    const toast = page.locator('[role="alert"], [data-sonner-toast], .toast, .Toastify__toast');
    await expect(toast.filter({ hasText: text }).first()).toBeVisible({ timeout: 5000 });
}

/**
 * Preenche um campo de formulário com label
 */
export async function fillField(page, label, value) {
    const field = page.getByLabel(label);
    await field.click();
    await field.fill(value);
}

/**
 * Limpa dados de teste criados durante os testes
 */
export async function cleanupTestData(page, description) {
    // Buscar e deletar itens com "Teste E2E" no nome
    const testItems = page.locator(`text=${description}`);
    const count = await testItems.count();
    for (let i = count - 1; i >= 0; i--) {
        const item = testItems.nth(i);
        const deleteBtn = item.locator('..').locator('[data-testid="delete-btn"], button:has(svg.lucide-trash-2)');
        if (await deleteBtn.isVisible().catch(() => false)) {
            await deleteBtn.click();
            // Confirmar exclusão se dialog aparecer
            page.on('dialog', dialog => dialog.accept());
            await page.waitForTimeout(500);
        }
    }
}

/**
 * Formata valor monetário BR
 */
export function formatBRL(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Gera string única para evitar colisão entre testes
 */
export function uniqueId() {
    return `E2E-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}
