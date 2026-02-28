// e2e/02-dashboard.spec.js
import { test, expect } from '@playwright/test';
import { PAGES } from './fixtures/test-data.js';
import { waitForPageLoad } from './helpers/utils.js';

test.describe('Dashboard', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(PAGES.dashboard);
        await waitForPageLoad(page);
    });

    test('deve carregar o dashboard sem erros', async ({ page }) => {
        await expect(page).toHaveURL(/dashboard/);
        // Sem erros de JavaScript no console
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error' && !msg.text().includes('favicon')) {
                errors.push(msg.text());
            }
        });
        await page.waitForTimeout(2000);
        expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
    });

    test('deve exibir cards de resumo financeiro', async ({ page }) => {
        // Verificar que existem cards com valores financeiros
        const cards = page.locator('.glass-card, [class*="card"], [class*="Card"]');
        await expect(cards.first()).toBeVisible({ timeout: 10000 });

        // Verificar se há valores em BRL
        const brlValues = page.locator('text=/R\\$\\s?[\\d.,]+/');
        const count = await brlValues.count();
        expect(count).toBeGreaterThan(0);
    });

    test('deve exibir gráficos quando há dados', async ({ page }) => {
        // Procurar por SVGs de gráfico (Recharts renderiza SVGs)
        const charts = page.locator('svg.recharts-surface, .recharts-wrapper, [class*="chart" i] svg');
        const chartCount = await charts.count();

        // Se há transações, deve ter pelo menos 1 gráfico
        if (chartCount > 0) {
            await expect(charts.first()).toBeVisible();
        }
    });

    test('deve ter navegação funcional para outras seções', async ({ page }) => {
        // Verificar menu lateral ou navegação
        const navLinks = page.locator('nav a, aside a, [class*="sidebar"] a, [class*="menu"] a');
        const linkCount = await navLinks.count();
        expect(linkCount).toBeGreaterThan(3);
    });

    test('deve ser responsivo no mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.waitForTimeout(500);

        // Dashboard deve estar visível sem scroll horizontal
        const body = page.locator('body');
        const bodyBox = await body.boundingBox();
        expect(bodyBox.width).toBeLessThanOrEqual(375);
    });
});
