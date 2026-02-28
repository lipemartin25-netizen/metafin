// e2e/04-goals.spec.js
import { test, expect } from '@playwright/test';
import { PAGES, SAMPLE_GOAL } from './fixtures/test-data.js';
import { waitForPageLoad, uniqueId } from './helpers/utils.js';

test.describe('Metas Financeiras', () => {
    const testId = uniqueId();

    test.beforeEach(async ({ page }) => {
        await page.goto(PAGES.goals);
        await waitForPageLoad(page);
    });

    test('deve carregar página de metas', async ({ page }) => {
        await expect(page).toHaveURL(/goals/);
        const header = page.locator('h1, h2').filter({ hasText: /meta|goal/i });
        await expect(header.first()).toBeVisible({ timeout: 10000 });
    });

    test('deve abrir formulário de nova meta', async ({ page }) => {
        const addBtn = page.locator(
            'button:has-text("Nova"), button:has-text("Criar"), button:has-text("Adicionar"), button:has(svg.lucide-plus)'
        ).first();
        await addBtn.click();

        const form = page.locator('form, [role="dialog"], [class*="modal" i]');
        await expect(form.first()).toBeVisible({ timeout: 5000 });
    });

    test('deve criar uma nova meta', async ({ page }) => {
        const goalName = `${SAMPLE_GOAL.name} ${testId}`;

        const addBtn = page.locator(
            'button:has-text("Nova"), button:has-text("Criar"), button:has(svg.lucide-plus)'
        ).first();
        await addBtn.click();
        await page.waitForTimeout(500);

        // Preencher nome da meta
        const nameInput = page.locator(
            'input[name="name"], input[name="title"], input[placeholder*="nome" i], input[placeholder*="meta" i]'
        ).first();
        await nameInput.fill(goalName);

        // Preencher valor alvo
        const targetInput = page.locator(
            'input[name="target"], input[name="targetAmount"], input[placeholder*="valor" i], input[placeholder*="objetivo" i]'
        ).first();
        if (await targetInput.isVisible().catch(() => false)) {
            await targetInput.fill(SAMPLE_GOAL.targetAmount);
        }

        // Submit
        const submitBtn = page.locator(
            'button[type="submit"], button:has-text("Salvar"), button:has-text("Criar")'
        ).last();
        await submitBtn.click();

        // Verificar que a meta aparece
        await page.waitForTimeout(1000);
        const newGoal = page.locator(`text=${goalName}`).first();
        await expect(newGoal).toBeVisible({ timeout: 10000 });
    });

    test('deve mostrar progresso da meta', async ({ page }) => {
        // Verificar que há barras de progresso ou porcentagens
        const progress = page.locator(
            '[role="progressbar"], [class*="progress" i], text=/%/'
        );
        const hasProgress = await progress.count() > 0;
        // Se há metas, deve ter indicador de progresso
        const goals = page.locator('[class*="card" i], [class*="goal" i]');
        if (await goals.count() > 0) {
            expect(hasProgress).toBeTruthy();
        }
    });
});
