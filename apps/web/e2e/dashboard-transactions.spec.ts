import { test, expect } from "@playwright/test";
import {
  createDbClient,
  pluggyAccounts,
  pluggyItems,
  pluggyTransactions,
  eq,
} from "@healthinance/database";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

test.describe("Dashboard de Transações e Extrato (Healthinance)", () => {
  const TEST_EMAIL = "felipe.teste.dev.1788726227971@gmail.com";
  const TEST_PASSWORD = "Password@123456";
  const TEST_USER_ID = "b903f662-49d5-4067-b6f7-3c08c004aad4";

  const SEED_ITEM_ID = "e2e-item-test-tx";
  const SEED_ACCOUNT_ID = "e2e-account-test-tx";
  const SEED_TX_INCOME_ID = "e2e-tx-income-test";
  const SEED_TX_EXPENSE_ID = "e2e-tx-expense-test";

  test.beforeEach(async () => {
    const db = createDbClient();
    try {
      await db.delete(pluggyTransactions).where(eq(pluggyTransactions.accountId, SEED_ACCOUNT_ID));
      await db.delete(pluggyAccounts).where(eq(pluggyAccounts.id, SEED_ACCOUNT_ID));
      await db.delete(pluggyItems).where(eq(pluggyItems.id, SEED_ITEM_ID));

      await db.insert(pluggyItems).values({
        id: SEED_ITEM_ID,
        userId: TEST_USER_ID,
        connectorId: 2,
        connectorName: "Pluggy Bank Sandbox",
        status: "UPDATED",
      });

      await db.insert(pluggyAccounts).values({
        id: SEED_ACCOUNT_ID,
        itemId: SEED_ITEM_ID,
        userId: TEST_USER_ID,
        type: "BANK",
        subtype: "CHECKING_ACCOUNT",
        name: "Conta Corrente E2E Tx",
        balance: "5000.00",
        currencyCode: "BRL",
        number: "7788-0",
      });

      const today = new Date();

      await db.insert(pluggyTransactions).values([
        {
          id: SEED_TX_INCOME_ID,
          accountId: SEED_ACCOUNT_ID,
          userId: TEST_USER_ID,
          description: "Depósito Salário E2E",
          amount: "3500.00",
          date: today,
          category: "Renda",
          type: "CREDIT",
          status: "POSTED",
        },
        {
          id: SEED_TX_EXPENSE_ID,
          accountId: SEED_ACCOUNT_ID,
          userId: TEST_USER_ID,
          description: "Compra Mercado E2E",
          amount: "-500.00",
          date: today,
          category: "Alimentação",
          type: "DEBIT",
          status: "POSTED",
        },
      ]);
    } catch (e) {
      console.warn("Erro no seed de transações para teste:", e);
    }
  });

  test.afterEach(async () => {
    const db = createDbClient();
    try {
      await db.delete(pluggyTransactions).where(eq(pluggyTransactions.accountId, SEED_ACCOUNT_ID));
      await db.delete(pluggyAccounts).where(eq(pluggyAccounts.id, SEED_ACCOUNT_ID));
      await db.delete(pluggyItems).where(eq(pluggyItems.id, SEED_ITEM_ID));
    } catch (e) {
      console.warn("Erro no teardown de transações:", e);
    }
  });

  test("deve renderizar os indicadores do mês e o feed de transações no Dashboard", async ({
    page,
  }) => {
    // 1. Login
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Acesse sua conta");
    await page.fill("#login-email", TEST_EMAIL);
    await page.fill("#login-password", TEST_PASSWORD);
    await page.getByRole("button", { name: /Entrar no Healthinance/i }).click();

    // 2. Aguarda navegação para o dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByText("Sessão Autenticada")).toBeVisible();

    // 3. Valida Indicadores do Mês
    await expect(page.locator("text=Receitas do Mês")).toBeVisible();
    await expect(page.getByTestId("monthly-income")).toContainText("3.500,00");

    await expect(page.locator("text=Despesas do Mês")).toBeVisible();
    await expect(page.getByTestId("monthly-expenses")).toContainText("500,00");

    await expect(page.locator("text=Resultado Líquido")).toBeVisible();
    await expect(page.getByTestId("monthly-net-balance")).toContainText("3.000,00");

    // 4. Valida Feed do Extrato de Transações
    const feed = page.getByTestId("transactions-feed");
    await expect(feed).toBeVisible();

    const incomeItem = page.getByTestId(`transaction-item-${SEED_TX_INCOME_ID}`);
    await expect(incomeItem).toBeVisible();
    await expect(incomeItem.getByText("Depósito Salário E2E")).toBeVisible();
    await expect(incomeItem.getByText("Renda")).toBeVisible();
    await expect(incomeItem.getByText(/\+\s*R\$\s*3\.500,00/)).toBeVisible();

    const expenseItem = page.getByTestId(`transaction-item-${SEED_TX_EXPENSE_ID}`);
    await expect(expenseItem).toBeVisible();
    await expect(expenseItem.getByText("Compra Mercado E2E")).toBeVisible();
    await expect(expenseItem.getByText("Alimentação")).toBeVisible();
    await expect(expenseItem.getByText(/-\s*R\$\s*500,00/)).toBeVisible();
  });
});
