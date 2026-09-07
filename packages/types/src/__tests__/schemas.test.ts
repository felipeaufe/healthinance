import { describe, it, expect } from 'vitest';
import {
  WebhookEventSchema,
  PluggyItemStatusSchema,
  AccountDTOSchema,
  TransactionDTOSchema,
  AuthUserSchema,
  SyncItemParamsSchema,
  SyncItemResponseSchema,
  AccountWithConnectorSchema,
  AccountsListResponseSchema,
  TransactionWithAccountSchema,
  TransactionsQuerySchema,
  MonthlyFinancialSummarySchema,
  TransactionsListResponseSchema,
} from '../index.js';

describe('Zod Schemas Unit Tests (@healthinance/types)', () => {
  describe('WebhookEventSchema', () => {
    it('deve validar um payload de webhook válido da Pluggy', () => {
      const validPayload = {
        event: 'item/updated',
        itemId: 'item-123456',
        triggeredBy: 'USER',
      };

      const result = WebhookEventSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.event).toBe('item/updated');
        expect(result.data.itemId).toBe('item-123456');
      }
    });

    it('deve rejeitar payload de webhook sem itemId', () => {
      const invalidPayload = {
        event: 'item/created',
      };

      const result = WebhookEventSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('deve rejeitar triggeredBy inválido', () => {
      const invalidPayload = {
        event: 'item/created',
        itemId: 'item-123',
        triggeredBy: 'UNKNOWN',
      };

      const result = WebhookEventSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('PluggyItemStatusSchema', () => {
    it('deve aceitar os status válidos do ciclo de vida da Pluggy', () => {
      const statuses = ['UPDATING', 'UPDATED', 'WAITING_USER_INPUT', 'LOGIN_ERROR', 'OUTDATED', 'DELETED'];
      statuses.forEach((status) => {
        expect(PluggyItemStatusSchema.safeParse(status).success).toBe(true);
      });
    });

    it('deve rejeitar status desconhecido', () => {
      expect(PluggyItemStatusSchema.safeParse('UNKNOWN_STATUS').success).toBe(false);
    });
  });

  describe('AccountDTOSchema', () => {
    it('deve validar uma conta bancária com moeda padrão BRL', () => {
      const accountData = {
        id: 'acc-uuid-123',
        itemId: 'item-uuid-123',
        type: 'BANK',
        subtype: 'CHECKING_ACCOUNT',
        name: 'Conta Corrente Principal',
        balance: 1542.5,
      };

      const result = AccountDTOSchema.safeParse(accountData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currencyCode).toBe('BRL');
        expect(result.data.balance).toBe(1542.5);
      }
    });
  });

  describe('TransactionDTOSchema', () => {
    it('deve validar transação financeira com tipos DEBIT e CREDIT', () => {
      const debitTx = {
        id: 'tx-1',
        accountId: 'acc-1',
        description: 'Supermercado',
        amount: -150.0,
        date: '2026-09-06T12:00:00.000Z',
        type: 'DEBIT',
      };

      const creditTx = {
        id: 'tx-2',
        accountId: 'acc-1',
        description: 'Salário',
        amount: 5000.0,
        date: '2026-09-05T08:00:00.000Z',
        type: 'CREDIT',
      };

      expect(TransactionDTOSchema.safeParse(debitTx).success).toBe(true);
      expect(TransactionDTOSchema.safeParse(creditTx).success).toBe(true);
    });

    it('deve rejeitar transação com tipo inválido', () => {
      const invalidTx = {
        id: 'tx-1',
        accountId: 'acc-1',
        description: 'Pix',
        amount: 100,
        date: '2026-09-06T12:00:00.000Z',
        type: 'PIX_TRANSFER', // Inválido
      };

      expect(TransactionDTOSchema.safeParse(invalidTx).success).toBe(false);
    });
  });

  describe('AuthUserSchema', () => {
    it('deve validar usuário com email e uuid válidos', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@healthinance.app',
        name: 'Felipe Augusto',
      };

      expect(AuthUserSchema.safeParse(user).success).toBe(true);
    });

    it('deve rejeitar usuário com email com formato inválido', () => {
      const invalidUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'invalid-email-format',
      };

      expect(AuthUserSchema.safeParse(invalidUser).success).toBe(false);
    });
  });

  describe('SyncItemParamsSchema', () => {
    it('deve validar parâmetros contendo id não vazio', () => {
      expect(SyncItemParamsSchema.safeParse({ id: 'item-123' }).success).toBe(true);
    });

    it('deve rejeitar parâmetros com id vazio', () => {
      expect(SyncItemParamsSchema.safeParse({ id: '' }).success).toBe(false);
    });
  });

  describe('SyncItemResponseSchema', () => {
    it('deve validar resposta de sucesso com itemId', () => {
      const response = {
        success: true,
        message: 'Item sincronizado com sucesso',
        data: {
          itemId: 'item-123',
          status: 'UPDATED',
        },
      };
      expect(SyncItemResponseSchema.safeParse(response).success).toBe(true);
    });

    it('deve validar resposta de erro com mensagem', () => {
      const response = {
        success: false,
        message: 'Erro na sincronização',
        error: 'Item não encontrado na Pluggy',
      };
      expect(SyncItemResponseSchema.safeParse(response).success).toBe(true);
    });
  });

  describe('AccountWithConnectorSchema & AccountsListResponseSchema', () => {
    it('deve validar conta com conector bancário', () => {
      const account = {
        id: 'acc-uuid-1',
        itemId: 'item-uuid-1',
        userId: 'user-uuid-1',
        type: 'BANK',
        subtype: 'CHECKING_ACCOUNT',
        name: 'Conta Corrente',
        balance: 36180.75,
        currencyCode: 'BRL',
        connectorName: 'Pluggy Bank',
      };

      const result = AccountWithConnectorSchema.safeParse(account);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.connectorName).toBe('Pluggy Bank');
        expect(result.data.balance).toBe(36180.75);
      }
    });

    it('deve validar resposta de lista de contas com métricas consolidadas', () => {
      const response = {
        success: true,
        data: {
          accounts: [
            {
              id: 'acc-1',
              itemId: 'item-1',
              userId: 'user-1',
              type: 'BANK',
              name: 'Conta Corrente',
              balance: 1000,
              connectorName: 'Nubank',
            },
          ],
          totalBalance: 1000,
          institutionsCount: 1,
        },
      };

      const result = AccountsListResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data.totalBalance).toBe(1000);
        expect(result.data.data.institutionsCount).toBe(1);
      }
    });
  });

  describe('TransactionWithAccountSchema & TransactionsListResponseSchema', () => {
    it('deve validar transação enriquecida com dados da conta', () => {
      const tx = {
        id: 'tx-uuid-1',
        accountId: 'acc-uuid-1',
        userId: 'user-uuid-1',
        description: 'Supermercado Pão de Açúcar',
        amount: -254.8,
        date: '2026-09-06T14:30:00.000Z',
        category: 'Alimentação',
        type: 'DEBIT',
        accountName: 'Conta Corrente',
        bankName: 'Pluggy Bank',
      };

      const result = TransactionWithAccountSchema.safeParse(tx);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(-254.8);
        expect(result.data.bankName).toBe('Pluggy Bank');
        expect(result.data.category).toBe('Alimentação');
      }
    });

    it('deve validar parâmetros de consulta de transações', () => {
      const query = {
        accountId: 'acc-1',
        limit: '15',
        page: '2',
      };

      const result = TransactionsQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(15);
        expect(result.data.page).toBe(2);
      }
    });

    it('deve validar sumário financeiro mensal com receitas e despesas', () => {
      const summary = {
        monthlyIncome: 12500.0,
        monthlyExpenses: 4200.5,
        netBalance: 8299.5,
        transactionsCount: 18,
      };

      const result = MonthlyFinancialSummarySchema.safeParse(summary);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.netBalance).toBe(8299.5);
      }
    });

    it('deve validar resposta de listagem de transações com sumário', () => {
      const response = {
        success: true,
        data: {
          transactions: [
            {
              id: 'tx-1',
              accountId: 'acc-1',
              userId: 'user-1',
              description: 'Transferência Pix Recebida',
              amount: 1500.0,
              date: '2026-09-06T10:00:00.000Z',
              type: 'CREDIT',
              category: 'Renda',
            },
          ],
          total: 1,
          page: 1,
          limit: 20,
          summary: {
            monthlyIncome: 1500.0,
            monthlyExpenses: 0,
            netBalance: 1500.0,
            transactionsCount: 1,
          },
        },
      };

      const result = TransactionsListResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });
});


