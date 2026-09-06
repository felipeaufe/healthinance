import { test, expect } from '@playwright/test';

test.describe('Autenticação e Proteção de Rotas (Healthinance)', () => {
  test('deve redirecionar usuário não autenticado que tenta acessar /dashboard para /login', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText('Acesse sua conta');
  });

  test('deve renderizar a tela de login com os campos e botões necessários', async ({
    page,
  }) => {
    await page.goto('/login');

    await expect(page.locator('h1')).toContainText('Acesse sua conta');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Entrar no Healthinance/i })
    ).toBeVisible();

    // Link para cadastro
    const registerLink = page.getByRole('link', { name: /Cadastre-se grátis/i });
    await expect(registerLink).toBeVisible();
  });

  test('deve renderizar a tela de cadastro e validar erro de senhas não coincidentes', async ({
    page,
  }) => {
    await page.goto('/register');

    await expect(page.locator('h1')).toContainText('Criar sua conta');
    await page.fill('input[placeholder="Seu Nome"]', 'Usuário Teste');
    await page.fill('input[placeholder="seu@email.com"]', 'teste@healthinance.app');
    await page.fill('input[placeholder="••••••••"] >> nth=0', 'senha123');
    await page.fill('input[placeholder="••••••••"] >> nth=1', 'senhaDiferente456');

    await page.getByRole('button', { name: /Criar Conta no Healthinance/i }).click();

    await expect(page.locator('text=As senhas digitadas não coincidem.')).toBeVisible();
  });

  test('deve renderizar a tela de recuperação de senha e link de retorno ao login', async ({
    page,
  }) => {
    await page.goto('/forgot-password');

    await expect(page.locator('h1')).toContainText('Recuperar senha');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Enviar link de recuperação/i })
    ).toBeVisible();

    const backLink = page.getByRole('link', { name: /Voltar para o login/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('deve renderizar a página inicial com o botão de conexão bancária Pluggy', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.getByText('Healthinance', { exact: true })).toBeVisible();
    await expect(
      page.locator('h1')
    ).toContainText('Sua saúde financeira em um único lugar');
    await expect(
      page.getByRole('button', { name: /Conectar Conta Bancária \(Open Finance\)/i })
    ).toBeVisible();
  });
});
