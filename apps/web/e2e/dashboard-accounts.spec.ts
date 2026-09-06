import { test, expect } from '@playwright/test';
import { createDbClient, pluggyAccounts, pluggyItems, eq } from '@healthinance/database';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

test.describe('Dashboard de Contas Bancárias (Healthinance)', () => {
  const TEST_EMAIL = 'felipe.teste.dev.1788726227971@gmail.com';
  const TEST_PASSWORD = 'Password@123456';
  const TEST_USER_ID = 'b903f662-49d5-4067-b6f7-3c08c004aad4';

  const SEED_ITEM_ID = 'e2e-item-test-dashboard';
  const SEED_ACCOUNT_ID = 'e2e-account-test-dashboard';

  test.beforeEach(async () => {
    // Insere dados de conta para validar renderização dinâmica no Dashboard
    const db = createDbClient();
    try {
      await db.delete(pluggyAccounts).where(eq(pluggyAccounts.id, SEED_ACCOUNT_ID));
      await db.delete(pluggyItems).where(eq(pluggyItems.id, SEED_ITEM_ID));

      await db
        .insert(pluggyItems)
        .values({
          id: SEED_ITEM_ID,
          userId: TEST_USER_ID,
          connectorId: 2,
          connectorName: 'Pluggy Bank Sandbox',
          status: 'UPDATED',
        });

      await db
        .insert(pluggyAccounts)
        .values({
          id: SEED_ACCOUNT_ID,
          itemId: SEED_ITEM_ID,
          userId: TEST_USER_ID,
          type: 'BANK',
          subtype: 'CHECKING_ACCOUNT',
          name: 'Conta Corrente E2E',
          balance: '12500.50',
          currencyCode: 'BRL',
          number: '9988-1',
        });
    } catch (e) {
      console.warn('Erro no seed de teste:', e);
    }
  });

  test.afterEach(async () => {
    // Limpeza dos dados de seed
    const db = createDbClient();
    try {
      await db.delete(pluggyAccounts).where(eq(pluggyAccounts.id, SEED_ACCOUNT_ID));
      await db.delete(pluggyItems).where(eq(pluggyItems.id, SEED_ITEM_ID));
    } catch (e) {
      console.warn('Erro no teardown de teste:', e);
    }
  });

  test('deve renderizar o dashboard com saldo consolidado dinâmico e cards de contas', async ({
    page,
  }) => {
    // 1. Efetua login
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Acesse sua conta');
    await page.fill('#login-email', TEST_EMAIL);
    await page.fill('#login-password', TEST_PASSWORD);
    await page.getByRole('button', { name: /Entrar no Healthinance/i }).click();

    // 2. Aguarda navegação para o dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByText('Sessão Autenticada')).toBeVisible();

    // 3. Valida Saldo Total Consolidado
    await expect(page.locator('text=Saldo Total Disponível')).toBeVisible();
    await expect(page.locator('p').filter({ hasText: /R\$\s*12\.500,50/ })).toBeVisible();

    // 4. Valida Instituições Conectadas
    await expect(page.locator('text=Instituições Conectadas')).toBeVisible();
    await expect(page.getByText('1 banco', { exact: true })).toBeVisible();

    // 5. Valida seção de Minhas Contas Bancárias e card individual
    await expect(page.getByRole('heading', { name: /Minhas Contas Bancárias/i })).toBeVisible();
    const accountCard = page.getByTestId(`account-card-${SEED_ACCOUNT_ID}`);
    await expect(accountCard).toBeVisible();
    await expect(accountCard.getByText('Conta Corrente E2E')).toBeVisible();
    await expect(accountCard.getByText('Pluggy Bank Sandbox')).toBeVisible();
    await expect(accountCard.getByText(/R\$\s*12\.500,50/)).toBeVisible();
  });
});
