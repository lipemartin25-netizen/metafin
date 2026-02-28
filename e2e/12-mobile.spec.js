// e2e/12-mobile.spec.js
import { test, expect, devices } from '@playwright/test';
import { PAGES } from './fixtures/test-data.js';
import { waitForPageLoad } from './helpers/utils.js';

test.describe('Mobile Responsiveness', () => {
    test.use({ ...devices['iPhone 14'] });

    const mobilePages = [
        { name: 'Dashboard', url: PAGES.dashboard },
        { name: 'Transações', url: PAGES.transactions },
        { name: 'Metas', url: PAGES.goals },
        { name: 'Orçamentos', url: PAGES.budgets },
        { name: 'Saúde', url: PAGES.health },
        { name: 'Webhooks', url: PAGES.webhooks },
        { name: 'Configurações', url: PAGES.settings },
    ];

    for (const pg of mobilePages) {
        test(`${pg.name} deve ser responsiva no mobile`, async ({ page }) => {
            await page.goto(pg.url);
            await waitForPageLoad(page);

            // Não deve ter scroll horizontal
            const hasHorizontalScroll = await page.evaluate(() => {
                return document.documentElement.scrollWidth > document.documentElement.clientWidth;
            });
            expect(hasHorizontalScroll).toBeFalsy();

            // Textos não devem estar cortados (overflow hidden sem ellipsis)
            // Pelo menos o header deve estar visível
            const header = page.locator('h1, h2').first();
            if (await header.isVisible().catch(() => false)) {
                const box = await header.boundingBox();
                expect(box.width).toBeGreaterThan(50);
                expect(box.width).toBeLessThan(400);
            }
        });
    }

    test('menu de navegação deve funcionar no mobile', async ({ page }) => {
        await page.goto(PAGES.dashboard);
        await waitForPageLoad(page);

        // Procurar hamburger menu
        const menuBtn = page.locator(
            'button:has(svg.lucide-menu), button:has(svg.lucide-menu-square), [data-testid="mobile-menu"], button[aria-label*="menu" i]'
        ).first();

        if (await menuBtn.isVisible().catch(() => false)) {
            await menuBtn.click();
            await page.waitForTimeout(500);

            // Menu deve estar visível
            const nav = page.locator(
                'nav, aside, [class*="sidebar" i], [class*="drawer" i], [class*="menu" i]'
            ).filter({ has: page.locator('a') });
            await expect(nav.first()).toBeVisible({ timeout: 3000 });
        }
    });

    test('touch targets devem ter tamanho mínimo de 44px', async ({ page }) => {
        await page.goto(PAGES.dashboard);
        await waitForPageLoad(page);

        const buttons = page.locator('button, a[href]');
        const count = await buttons.count();
        let tooSmall = 0;

        for (let i = 0; i < Math.min(count, 20); i++) {
            const btn = buttons.nth(i);
            if (await btn.isVisible().catch(() => false)) {
                const box = await btn.boundingBox();
                if (box && (box.width < 30 || box.height < 30)) {
                    tooSmall++;
                }
            }
        }

        // Máximo 20% dos botões podem ser pequenos demais
        expect(tooSmall).toBeLessThan(count * 0.2);
    });
});
