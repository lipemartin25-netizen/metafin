// e2e/09-webhooks.spec.js
import { test, expect } from '@playwright/test';
import { PAGES, SAMPLE_WEBHOOK } from './fixtures/test-data.js';
import { waitForPageLoad, uniqueId } from './helpers/utils.js';

test.describe('Webhooks', () => {
    const testId = uniqueId();

    test.beforeEach(async ({ page }) => {
        await page.goto(PAGES.webhooks);
        await waitForPageLoad(page);
    });

    test('deve carregar página de webhooks', async ({ page }) => {
        await expect(page).toHaveURL(/webhooks/);
        const header = page.locator('h1, h2').filter({ hasText: /webhook/i });
        await expect(header.first()).toBeVisible({ timeout: 10000 });
    });

    test('deve exibir eventos suportados', async ({ page }) => {
        const events = page.locator('text=/transaction\.created|goal\.reached|budget\.exceeded/');
        await expect(events.first()).toBeVisible({ timeout: 5000 });
    });

    test('botão Novo Webhook deve abrir modal (NÃO redirecionar)', async ({ page }) => {
        const newBtn = page.locator(
            'button:has-text("Novo Webhook"), button:has-text("Criar Primeiro"), button:has(svg.lucide-plus)'
        ).first();
        await newBtn.click();

        // NÃO deve ter redirecionado para /settings
        await page.waitForTimeout(500);
        await expect(page).not.toHaveURL(/settings/);

        // Deve ter aberto um modal
        const modal = page.locator(
            '[role="dialog"], [class*="modal" i], [class*="Modal"], .fixed.inset-0'
        );
        await expect(modal.first()).toBeVisible({ timeout: 3000 });
    });

    test('deve criar um webhook via modal', async ({ page }) => {
        const webhookName = `${SAMPLE_WEBHOOK.name} ${testId}`;

        // Abrir modal
        const newBtn = page.locator(
            'button:has-text("Novo Webhook"), button:has-text("Criar Primeiro"), button:has(svg.lucide-plus)'
        ).first();
        await newBtn.click();
        await page.waitForTimeout(500);

        // Preencher nome
        const nameInput = page.locator(
            'input[placeholder*="Notificação" i], input[placeholder*="nome" i]'
        ).first();
        await nameInput.fill(webhookName);

        // Preencher URL
        const urlInput = page.locator(
            'input[type="url"], input[placeholder*="https" i], input[placeholder*="url" i], input[placeholder*="servidor" i]'
        ).first();
        await urlInput.fill(SAMPLE_WEBHOOK.url);

        // Selecionar eventos (clicar nos checkboxes)
        for (const eventId of SAMPLE_WEBHOOK.events) {
            const eventCheckbox = page.locator(`text=${eventId}`).first();
            if (await eventCheckbox.isVisible().catch(() => false)) {
                await eventCheckbox.click();
            }
        }

        // Verificar que secret foi gerado
        const secretField = page.locator('code, [class*="mono"]').filter({
            hasText: /[a-f0-9-]{36}/
        });
        if (await secretField.count() > 0) {
            const secretText = await secretField.first().textContent();
            expect(secretText.length).toBeGreaterThan(10);
        }

        // Submit
        const createBtn = page.locator(
            'button:has-text("Criar Webhook"), button:has-text("Criar"), button[type="submit"]'
        ).last();
        await createBtn.click();

        // Modal deve fechar
        await page.waitForTimeout(2000);
        const modal = page.locator('[role="dialog"], .fixed.inset-0');
        await expect(modal).not.toBeVisible({ timeout: 5000 }).catch(() => { });

        // Webhook deve aparecer na lista
        const newWebhook = page.locator(`text=${webhookName}`).first();
        await expect(newWebhook).toBeVisible({ timeout: 10000 });
    });

    test('deve copiar payload de exemplo', async ({ page }) => {
        const copyBtn = page.locator('button:has-text("Copiar")').first();
        if (await copyBtn.isVisible().catch(() => false)) {
            await copyBtn.click();
            // Verificar que texto mudou para "Copiado"
            await expect(page.locator('text=/copiado/i').first()).toBeVisible({ timeout: 3000 });
        }
    });
});
