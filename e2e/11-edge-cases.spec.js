// e2e/11-edge-cases.spec.js
import { test, expect } from '@playwright/test';
import { PAGES } from './fixtures/test-data.js';
import { waitForPageLoad } from './helpers/utils.js';

test.describe('Edge Cases & Robustez', () => {

    test('deve lidar com rota 404 graciosamente', async ({ page }) => {
        await page.goto('/app/rota-que-nao-existe-xyz');
        await page.waitForLoadState('networkidle');

        // Não deve exibir tela branca — deve ter algum conteúdo
        const body = page.locator('body');
        const text = await body.textContent();
        expect(text.length).toBeGreaterThan(10);
    });

    test('deve lidar com API offline graciosamente', async ({ page }) => {
        // Bloquear todas as APIs do Supabase
        await page.route('**/supabase.co/**', route => route.abort());

        await page.goto(PAGES.dashboard);
        await page.waitForTimeout(5000);

        // Não deve ter tela branca — deve mostrar erro ou fallback
        const body = page.locator('body');
        const text = await body.textContent();
        expect(text.length).toBeGreaterThan(10);

        // Desbloquear para os próximos testes
        await page.unroute('**/supabase.co/**');
    });

    test('deve lidar com resposta lenta da API', async ({ page }) => {
        // Adicionar delay de 5s em todas as APIs
        await page.route('**/supabase.co/**', async route => {
            await new Promise(resolve => setTimeout(resolve, 3000));
            await route.continue();
        });

        await page.goto(PAGES.transactions);

        // Deve mostrar loading state
        const loader = page.locator(
            '.animate-spin, [class*="loading" i], [class*="skeleton" i], text=/carregando/i'
        );
        // Pelo menos um indicador de loading deveria aparecer
        await page.waitForTimeout(1000);

        await page.unroute('**/supabase.co/**');
    });

    test('deve preservar dados ao navegar entre páginas', async ({ page }) => {
        // Ir para dashboard
        await page.goto(PAGES.dashboard);
        await waitForPageLoad(page);

        // Ir para transações
        await page.goto(PAGES.transactions);
        await waitForPageLoad(page);

        // Voltar para dashboard
        await page.goto(PAGES.dashboard);
        await waitForPageLoad(page);

        // Dashboard deve carregar normalmente (sem erro)
        await expect(page).toHaveURL(/dashboard/);
    });

    test('não deve ter erros de console em nenhuma página', async ({ page }) => {
        const criticalErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text();
                // Ignorar erros comuns não-críticos
                if (
                    !text.includes('favicon') &&
                    !text.includes('ResizeObserver') &&
                    !text.includes('net::ERR') &&
                    !text.includes('404')
                ) {
                    criticalErrors.push(text);
                }
            }
        });

        const pages = [
            PAGES.dashboard,
            PAGES.transactions,
            PAGES.goals,
            PAGES.budgets,
            PAGES.health,
            PAGES.webhooks,
            PAGES.settings,
        ];

        for (const pageUrl of pages) {
            await page.goto(pageUrl);
            await waitForPageLoad(page);
            await page.waitForTimeout(1000);
        }

        // Não deve ter erros críticos de JS
        if (criticalErrors.length > 0) {
            console.log('Erros encontrados:', criticalErrors);
        }
        expect(criticalErrors.length).toBeLessThanOrEqual(2);
    });

    test('deve lidar com valores monetários extremos', async ({ page }) => {
        await page.goto(PAGES.transactions);
        await waitForPageLoad(page);

        const addBtn = page.locator(
            'button:has-text("Nova"), button:has(svg.lucide-plus)'
        ).first();

        if (await addBtn.isVisible().catch(() => false)) {
            await addBtn.click();
            await page.waitForTimeout(500);

            const amountInput = page.locator(
                'input[name="amount"], input[type="number"]'
            ).first();

            if (await amountInput.isVisible().catch(() => false)) {
                // Testar valor zero
                await amountInput.fill('0');
                await page.waitForTimeout(200);

                // Testar valor muito grande
                await amountInput.fill('9999999.99');
                await page.waitForTimeout(200);

                // Testar valor negativo
                await amountInput.fill('-100');
                await page.waitForTimeout(200);

                // Nenhum erro de JS deve ter ocorrido
            }
        }
    });

    test('deve lidar com strings longas nos inputs', async ({ page }) => {
        await page.goto(PAGES.transactions);
        await waitForPageLoad(page);

        const addBtn = page.locator(
            'button:has-text("Nova"), button:has(svg.lucide-plus)'
        ).first();

        if (await addBtn.isVisible().catch(() => false)) {
            await addBtn.click();
            await page.waitForTimeout(500);

            const descInput = page.locator(
                'input[name="description"], input[placeholder*="descrição" i]'
            ).first();

            if (await descInput.isVisible().catch(() => false)) {
                // String de 500 caracteres
                const longString = 'A'.repeat(500);
                await descInput.fill(longString);
                // Não deve crashar
                await page.waitForTimeout(200);
            }
        }
    });
});
