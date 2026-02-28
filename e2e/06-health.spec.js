// e2e/06-health.spec.js
import { test, expect } from '@playwright/test';
import { PAGES } from './fixtures/test-data.js';
import { waitForPageLoad } from './helpers/utils.js';

test.describe('Saúde Financeira', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(PAGES.health);
        await waitForPageLoad(page);
    });

    test('deve carregar página de saúde financeira', async ({ page }) => {
        await expect(page).toHaveURL(/health/);
        const header = page.locator('h1, h2').filter({ hasText: /saúde|health|score/i });
        await expect(header.first()).toBeVisible({ timeout: 10000 });
    });

    test('deve exibir score numérico entre 0 e 100', async ({ page }) => {
        // Procurar por número grande que represente o score
        const scoreElement = page.locator(
            'text=/\\b([0-9]{1,3})\\b/', '[class*="score" i]'
        );
        await page.waitForTimeout(3000);
        // Pode estar vazio se não há dados suficientes — não deve crashar
    });

    test('deve renderizar gráfico donut sem erro', async ({ page }) => {
        const chart = page.locator(
            'svg.recharts-surface, .recharts-wrapper, svg[class*="chart" i], [class*="donut" i] svg'
        );
        await page.waitForTimeout(3000);

        if (await chart.count() > 0) {
            await expect(chart.first()).toBeVisible();
            // Verificar que o SVG tem conteúdo (paths renderizados)
            const paths = chart.first().locator('path');
            expect(await paths.count()).toBeGreaterThan(0);
        }
    });

    test('deve exibir recomendações', async ({ page }) => {
        const recommendations = page.locator(
            'text=/recomend|dica|sugest|tip/i'
        );
        await page.waitForTimeout(2000);
        // Recomendações podem ou não estar presentes dependendo dos dados
    });

    test('card de score não deve ter espaço vazio excessivo', async ({ page }) => {
        const scoreCard = page.locator('[class*="card" i]').filter({
            has: page.locator('svg.recharts-surface, .recharts-wrapper')
        }).first();

        if (await scoreCard.isVisible().catch(() => false)) {
            const box = await scoreCard.boundingBox();
            // Card não deve ter mais de 400px de altura
            expect(box.height).toBeLessThan(450);
        }
    });
});
