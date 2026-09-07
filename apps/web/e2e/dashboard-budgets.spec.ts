import { test, expect } from '@playwright/test';
import {
  createDbClient,
  budgets,
  pluggyAccounts,
  pluggyItems,
  pluggyTransactions,
  eq,
} from '@healthinance/database';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

test.describe('Dashboard de Orçamentos e Limites - Safe to Spend (Healthinance)', () => {
  const TEST_EMAIL = 'felipe.teste.dev.1788726227971@gmail.com';
  const TEST_PASSWORD = 'Password@123456';
  const TEST_USER_ID = 'b903f662-49d5-4067-b6f7-3c08c004aad4';

  const SEED_ITEM_ID = 'e2e-item-test-budgets';
  const SEED_ACCOUNT_ID = 'e2e-account-test-budgets';
  const SEED_TX_ALIMENTACAO_ID = 'e2e-tx-alim-test';
  const SEED_TX_LAZER_ID = 'e2e-tx-lazer-test';

  const SEED_BUDGET_ALIM_ID = 'b0000001-0000-0000-0000-000000000001';
  const SEED_BUDGET_LAZER_ID = 'b0000002-0000-0000-0000-000000000002';

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  test.beforeEach(async () => {
    const db = createDbClient();
    try {
      // Limpeza prévia
      await db.delete(budgets).where(eq(budgets.userId, TEST_USER_ID));
      await db.delete(pluggyTransactions).where(eq(pluggyTransactions.accountId, SEED_ACCOUNT_ID));
      await db.delete(pluggyAccounts).where(eq(pluggyAccounts.id, SEED_ACCOUNT_ID));
      await db.delete(pluggyItems).where(eq(pluggyItems.id, SEED_ITEM_ID));

      // 1. Setup de conta e transações
      await db.insert(pluggyItems).values({
        id: SEED_ITEM_ID,
        userId: TEST_USER_ID,
        connectorId: 2,
        connectorName: 'Pluggy Bank Sandbox',
        status: 'UPDATED',
      });

      await db.insert(pluggyAccounts).values({
        id: SEED_ACCOUNT_ID,
        itemId: SEED_ITEM_ID,
        userId: TEST_USER_ID,
        type: 'BANK',
        subtype: 'CHECKING_ACCOUNT',
        name: 'Conta Corrente E2E Budgets',
        balance: '10000.00',
        currencyCode: 'BRL',
        number: '1234-5',
      });

      await db.insert(pluggyTransactions).values([
        {
          id: SEED_TX_ALIMENTACAO_ID,
          accountId: SEED_ACCOUNT_ID,
          userId: TEST_USER_ID,
          description: 'Restaurante & Mercado E2E',
          amount: '-500.00',
          date: now,
          category: 'Alimentação',
          type: 'DEBIT',
          status: 'POSTED',
        },
        {
          id: SEED_TX_LAZER_ID,
          accountId: SEED_ACCOUNT_ID,
          userId: TEST_USER_ID,
          description: 'Cinema & Streaming E2E',
          amount: '-220.00',
          date: now,
          category: 'Lazer',
          type: 'DEBIT',
          status: 'POSTED',
        },
      ]);

      // 2. Setup de orçamentos (Alimentação com 50% de consumo, Lazer com 110% de consumo)
      await db.insert(budgets).values([
        {
          id: SEED_BUDGET_ALIM_ID,
          userId: TEST_USER_ID,
          category: 'Alimentação',
          amount: '1000.00',
          periodMonth: currentMonth,
          periodYear: currentYear,
          alertPercent: 80,
        },
        {
          id: SEED_BUDGET_LAZER_ID,
          userId: TEST_USER_ID,
          category: 'Lazer',
          amount: '200.00',
          periodMonth: currentMonth,
          periodYear: currentYear,
          alertPercent: 80,
        },
      ]);
    } catch (e) {
      console.warn('Erro no seed de orçamentos para teste:', e);
    }
  });

  test.afterEach(async () => {
    const db = createDbClient();
    try {
      await db.delete(budgets).where(eq(budgets.userId, TEST_USER_ID));
      await db.delete(pluggyTransactions).where(eq(pluggyTransactions.accountId, SEED_ACCOUNT_ID));
      await db.delete(pluggyAccounts).where(eq(pluggyAccounts.id, SEED_ACCOUNT_ID));
      await db.delete(pluggyItems).where(eq(pluggyItems.id, SEED_ITEM_ID));
    } catch (e) {
      console.warn('Erro no teardown de orçamentos:', e);
    }
  });

  test('deve renderizar os tetos orçamentários, termômetro e Safe to Spend', async ({
    page,
  }) => {
    // 1. Login
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Acesse sua conta');
    await page.fill('#login-email', TEST_EMAIL);
    await page.fill('#login-password', TEST_PASSWORD);
    await page.getByRole('button', { name: /Entrar no Healthinance/i }).click();

    // 2. Aguarda navegação para o dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByText('Sessão Autenticada')).toBeVisible();

    // 3. Valida seção de orçamentos
    const budgetsSection = page.getByTestId('budgets-section');
    await expect(budgetsSection).toBeVisible();
    await expect(page.getByText('Orçamentos & Limites de Gastos')).toBeVisible();

    // 4. Valida Card de Alimentação (Consumo 50% - No Controle)
    const cardAlim = page.getByTestId('budget-card-Alimentação');
    await expect(cardAlim).toBeVisible();
    await expect(cardAlim.getByText('Alimentação')).toBeVisible();
    await expect(cardAlim.getByText('Teto: R$ 1.000,00')).toBeVisible();
    await expect(cardAlim.getByText('R$ 500,00 gastos')).toBeVisible();
    await expect(cardAlim.getByText('50.0%')).toBeVisible();
    await expect(cardAlim.getByText('No Controle')).toBeVisible();

    const safeToSpendAlim = page.getByTestId('budget-safetospend-Alimentação');
    await expect(safeToSpendAlim).toBeVisible();
    await expect(safeToSpendAlim.getByText(/\/ dia/)).toBeVisible();

    // 5. Valida Card de Lazer (Consumo 110% - Teto Estourado)
    const cardLazer = page.getByTestId('budget-card-Lazer');
    await expect(cardLazer).toBeVisible();
    await expect(cardLazer.getByText('Lazer')).toBeVisible();
    await expect(cardLazer.getByText('Teto: R$ 200,00')).toBeVisible();
    await expect(cardLazer.getByText('R$ 220,00 gastos')).toBeVisible();
    await expect(cardLazer.getByText('110.0%')).toBeVisible();
    await expect(cardLazer.getByText('Teto Estourado')).toBeVisible();

    const safeToSpendLazer = page.getByTestId('budget-safetospend-Lazer');
    await expect(safeToSpendLazer).toBeVisible();
    await expect(safeToSpendLazer.getByText('R$ 0,00 / dia')).toBeVisible();
  });

  test('deve exibir estado vazio e permitir cadastrar novo orçamento interativamente', async ({
    page,
  }) => {
    // 1. Limpa os orçamentos para testar o estado vazio
    const db = createDbClient();
    await db.delete(budgets).where(eq(budgets.userId, TEST_USER_ID));

    // 2. Login
    await page.goto('/login');
    await page.fill('#login-email', TEST_EMAIL);
    await page.fill('#login-password', TEST_PASSWORD);
    await page.getByRole('button', { name: /Entrar no Healthinance/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // 3. Valida estado vazio
    const emptyState = page.getByTestId('budgets-empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState.getByText(/Nenhum teto orçamentário configurado/i)).toBeVisible();

    // 4. Abre modal para criar orçamento
    await page.getByTestId('add-budget-button').click();
    const modal = page.getByTestId('budget-modal');
    await expect(modal).toBeVisible();

    // 5. Preenche e envia formulário
    await modal.locator('input[type="number"]').first().fill('850');
    await modal.getByRole('button', { name: /Salvar Orçamento/i }).click();

    // 6. Modal fecha e novo card aparece
    await expect(modal).not.toBeVisible();
    const newCard = page.getByTestId('budget-card-Alimentação');
    await expect(newCard).toBeVisible();
    await expect(newCard.getByText('Teto: R$ 850,00')).toBeVisible();
  });
});
