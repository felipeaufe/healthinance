import { describe, it, expect } from 'vitest';
import {
  WebhookEventSchema,
  PluggyItemStatusSchema,
  AccountDTOSchema,
  TransactionDTOSchema,
  AuthUserSchema,
  SyncItemParamsSchema,
  SyncItemResponseSchema,
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
});

