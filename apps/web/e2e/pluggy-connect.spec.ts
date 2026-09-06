import { test, expect } from '@playwright/test';

test.describe('Fluxo Completo de Conexão Bancária Pluggy Connect', () => {
  const TEST_EMAIL = 'felipe.teste.dev.1788726227971@gmail.com';
  const TEST_PASSWORD = 'Password@123456';

  test('usuário deslogado na home ao clicar em conectar deve ser redirecionado para login', async ({
    page,
  }) => {
    await page.goto('/');

    const connectBtn = page.getByRole('button', {
      name: /Conectar Conta Bancária \(Open Finance\)/i,
    });
    await expect(connectBtn).toBeVisible();
    await connectBtn.click();

    // Deve redirecionar para a tela de login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText('Acesse sua conta');
  });

  test('usuário autenticado no dashboard gera connect-token com sucesso (HTTP 200)', async ({
    page,
  }) => {
    // 1. Navega para a página de login
    await page.goto('/login');

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.getByRole('button', { name: /Entrar no Healthinance/i }).click();

    // 2. Aguarda redirecionamento para o dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByText('Sessão Autenticada')).toBeVisible();

    // 3. Monitora requisições de rede para a rota do connect-token
    const connectTokenPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/pluggy/connect-token') &&
        response.request().method() === 'POST',
      { timeout: 15000 }
    );

    // 4. Clica no botão de Conectar Conta Bancária
    const connectButton = page.getByRole('button', {
      name: /Conectar Conta Bancária/i,
    });
    await expect(connectButton).toBeVisible();
    await connectButton.click();

    // 5. Valida a resposta da API Fastify
    const response = await connectTokenPromise;
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('success', true);
    expect(json.data).toHaveProperty('accessToken');
    expect(typeof json.data.accessToken).toBe('string');
    expect(json.data.accessToken.length).toBeGreaterThan(20);

    // 6. Garante que nenhuma mensagem de erro de autenticação ou 401 foi exibida na tela
    await expect(page.locator('text=Token de autenticação Supabase')).toHaveCount(0);
    await expect(page.locator('text=Erro ao inicializar conexão bancária')).toHaveCount(0);
  });
});
