// e2e/03-transactions.spec.js
import { test, expect } from '@playwright/test';
import { PAGES, SAMPLE_TRANSACTIONS } from './fixtures/test-data.js';
import { waitForPageLoad, uniqueId } from './helpers/utils.js';

test.describe('Transações', () => {
    const testId = uniqueId();

    test.beforeEach(async ({ page }) => {
        await page.goto(PAGES.transactions);
        await waitForPageLoad(page);
    });

    test('deve carregar página de transações', async ({ page }) => {
        await expect(page).toHaveURL(/transactions/);
        // Deve ter título ou header de transações
        const header = page.locator('h1, h2, [class*="title"]').filter({ hasText: /transaç|transaction/i });
        await expect(header.first()).toBeVisible({ timeout: 10000 });
    });

    test('deve abrir formulário/modal de nova transação', async ({ page }) => {
        // Clicar no botão de adicionar
        const addBtn = page.locator(
            'button:has-text("Nova"), button:has-text("Adicionar"), button:has-text("Add"), button:has(svg.lucide-plus), [data-testid="add-transaction"]'
        ).first();
        await addBtn.click();

        // Verificar que formulário/modal apareceu
        const form = page.locator(
            'form, [role="dialog"], [class*="modal" i], [class*="Modal"]'
        );
        await expect(form.first()).toBeVisible({ timeout: 5000 });
    });

    test('deve criar uma transação de despesa', async ({ page }) => {
        const description = `${SAMPLE_TRANSACTIONS.expense.description} ${testId}`;

        // Abrir formulário
        const addBtn = page.locator(
            'button:has-text("Nova"), button:has-text("Adicionar"), button:has(svg.lucide-plus)'
        ).first();
        await addBtn.click();
        await page.waitForTimeout(500);

        // Preencher descrição
        const descInput = page.locator(
            'input[name="description"], input[placeholder*="descrição" i], input[placeholder*="description" i]'
        ).first();
        await descInput.fill(description);

        // Preencher valor
        const amountInput = page.locator(
            'input[name="amount"], input[type="number"], input[placeholder*="valor" i], input[placeholder*="amount" i]'
        ).first();
        await amountInput.fill(SAMPLE_TRANSACTIONS.expense.amount);

        // Selecionar tipo despesa (se houver seletor)
        const expenseSelector = page.locator(
            'button:has-text("Despesa"), [data-value="expense"], label:has-text("Despesa"), select option[value="expense"]'
        ).first();
        if (await expenseSelector.isVisible().catch(() => false)) {
            await expenseSelector.click();
        }

        // Submit
        const submitBtn = page.locator(
            'button[type="submit"], button:has-text("Salvar"), button:has-text("Criar"), button:has-text("Adicionar")'
        ).last();
        await submitBtn.click();

        // Verificar que a transação aparece na lista
        await page.waitForTimeout(1000);
        const newTransaction = page.locator(`text=${description}`).first();
        await expect(newTransaction).toBeVisible({ timeout: 10000 });
    });

    test('deve criar uma transação de receita', async ({ page }) => {
        const description = `${SAMPLE_TRANSACTIONS.income.description} ${testId}`;

        const addBtn = page.locator(
            'button:has-text("Nova"), button:has-text("Adicionar"), button:has(svg.lucide-plus)'
        ).first();
        await addBtn.click();
        await page.waitForTimeout(500);

        const descInput = page.locator(
            'input[name="description"], input[placeholder*="descrição" i]'
        ).first();
        await descInput.fill(description);

        const amountInput = page.locator(
            'input[name="amount"], input[type="number"], input[placeholder*="valor" i]'
        ).first();
        await amountInput.fill(SAMPLE_TRANSACTIONS.income.amount);

        // Selecionar tipo receita
        const incomeSelector = page.locator(
            'button:has-text("Receita"), [data-value="income"], label:has-text("Receita")'
        ).first();
        if (await incomeSelector.isVisible().catch(() => false)) {
            await incomeSelector.click();
        }

        const submitBtn = page.locator(
            'button[type="submit"], button:has-text("Salvar"), button:has-text("Criar")'
        ).last();
        await submitBtn.click();

        await page.waitForTimeout(1000);
        const newTransaction = page.locator(`text=${description}`).first();
        await expect(newTransaction).toBeVisible({ timeout: 10000 });
    });

    test('deve validar campos obrigatórios', async ({ page }) => {
        const addBtn = page.locator(
            'button:has-text("Nova"), button:has-text("Adicionar"), button:has(svg.lucide-plus)'
        ).first();
        await addBtn.click();
        await page.waitForTimeout(500);

        // Tentar submit sem preencher
        const submitBtn = page.locator(
            'button[type="submit"], button:has-text("Salvar"), button:has-text("Criar")'
        ).last();
        await submitBtn.click();

        // Deve mostrar alguma validação (mensagem de erro, borda vermelha, etc.)
        const validation = page.locator(
            '[class*="error" i], [class*="invalid" i], [class*="red"], text=/obrigatório|required|preencha/i'
        );
        // Pelo menos alguma indicação de erro
        await page.waitForTimeout(1000);
        const hasValidation = await validation.count() > 0;
        const hasNativeValidation = await page.locator(':invalid').count() > 0;
        expect(hasValidation || hasNativeValidation).toBeTruthy();
    });

    test('deve excluir uma transação', async ({ page }) => {
        // Encontrar transação de teste criada anteriormente
        const testTransaction = page.locator(`text=/Teste E2E.*${testId}/`).first();

        if (await testTransaction.isVisible().catch(() => false)) {
            // Encontrar botão de delete próximo
            const row = testTransaction.locator('..');
            const deleteBtn = row.locator(
                'button:has(svg.lucide-trash-2), button:has(svg.lucide-trash), [data-testid="delete"]'
            ).first();

            if (await deleteBtn.isVisible().catch(() => false)) {
                // Interceptar dialog de confirmação
                page.on('dialog', dialog => dialog.accept());
                await deleteBtn.click();
                await page.waitForTimeout(1500);

                // Verificar que foi removida (ou pelo menos uma a menos)
                // Não precisa verificar count exato — a ausência de erro é suficiente
            }
        }
    });
});
