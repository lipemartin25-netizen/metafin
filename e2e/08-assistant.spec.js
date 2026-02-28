// e2e/08-assistant.spec.js
import { test, expect } from '@playwright/test';
import { PAGES } from './fixtures/test-data.js';
import { waitForPageLoad } from './helpers/utils.js';

test.describe('Assistente IA', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(PAGES.assistant);
        await waitForPageLoad(page);
    });

    test('deve carregar página do assistente', async ({ page }) => {
        await expect(page).toHaveURL(/assistant/);
        const header = page.locator('h1, h2').filter({ hasText: /assistente|assistant|chat|ia/i });
        await expect(header.first()).toBeVisible({ timeout: 10000 });
    });

    test('deve ter campo de input para mensagem', async ({ page }) => {
        const chatInput = page.locator(
            'textarea, input[placeholder*="mensagem" i], input[placeholder*="message" i], input[placeholder*="pergunte" i], [contenteditable="true"]'
        ).first();
        await expect(chatInput).toBeVisible({ timeout: 5000 });
    });

    test('deve enviar mensagem e receber resposta', async ({ page }) => {
        const chatInput = page.locator(
            'textarea, input[placeholder*="mensagem" i], input[placeholder*="pergunte" i]'
        ).first();

        await chatInput.fill('Qual é meu saldo atual?');

        // Enviar (Enter ou botão)
        const sendBtn = page.locator(
            'button[type="submit"], button:has(svg.lucide-send), button:has-text("Enviar")'
        ).first();

        if (await sendBtn.isVisible().catch(() => false)) {
            await sendBtn.click();
        } else {
            await chatInput.press('Enter');
        }

        // Esperar resposta da IA (pode demorar)
        await page.waitForTimeout(10000);

        // Verificar que apareceu pelo menos uma resposta
        const messages = page.locator(
            '[class*="message" i], [class*="chat" i][class*="bubble" i], [class*="response" i], [class*="assistant" i]'
        );
        expect(await messages.count()).toBeGreaterThanOrEqual(1);
    });

    test('não deve expor PII na mensagem enviada à IA', async ({ page }) => {
        // Interceptar requests para APIs de IA
        const aiRequests = [];
        await page.route('**/api/ai-chat**', async (route) => {
            const request = route.request();
            const body = request.postDataJSON();
            aiRequests.push(body);
            await route.continue();
        });

        const chatInput = page.locator(
            'textarea, input[placeholder*="mensagem" i]'
        ).first();
        await chatInput.fill('Analise minhas finanças');

        const sendBtn = page.locator(
            'button[type="submit"], button:has(svg.lucide-send)'
        ).first();
        if (await sendBtn.isVisible().catch(() => false)) {
            await sendBtn.click();
        } else {
            await chatInput.press('Enter');
        }

        await page.waitForTimeout(3000);

        // Verificar que nenhum request contém CPF, senha, etc.
        for (const req of aiRequests) {
            const bodyStr = JSON.stringify(req).toLowerCase();
            expect(bodyStr).not.toContain('cpf');
            expect(bodyStr).not.toContain('senha');
            expect(bodyStr).not.toContain('password');
            expect(bodyStr).not.toContain('credit_card');
        }
    });
});
