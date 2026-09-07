import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import * as databaseModule from '@healthinance/database';

describe('Budgets Routes Integration Tests (@healthinance/api)', () => {
  let app: FastifyInstance;
  const testUserId = 'user-uuid-1111-1111';

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Autenticação e Proteção por JWT', () => {
    it('deve responder 401 Unauthorized para GET /api/budgets sem token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/budgets',
      });
      expect(response.statusCode).toBe(401);
    });

    it('deve responder 401 Unauthorized para POST /api/budgets sem token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/budgets',
        payload: {
          category: 'Alimentação',
          amount: 1000,
          periodMonth: 9,
          periodYear: 2026,
        },
      });
      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/budgets (Listagem, Consumo em Tempo Real e Safe to Spend)', () => {
    it('deve calcular corretamente o ritmo diário seguro quando consumo está dentro do teto', async () => {
      const token = app.jwt.sign({ sub: testUserId, email: 'user@healthinance.app' });

      const mockBudgets = [
        {
          id: 'budget-1',
          userId: testUserId,
          category: 'Alimentação',
          amount: '1000.00',
          periodMonth: 9,
          periodYear: 2026,
          alertPercent: 80,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockTransactions = [
        {
          amount: '-300.00',
          category: 'Alimentação',
          type: 'DEBIT',
        },
        {
          amount: '-100.00',
          category: 'Alimentação',
          type: 'DEBIT',
        },
      ];

      let selectCalls = 0;
      const mockDb = {
        select: vi.fn().mockImplementation(() => {
          selectCalls++;
          if (selectCalls === 1) {
            // budgets
            return {
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue(mockBudgets),
                }),
              }),
            };
          } else {
            // transactions
            return {
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue(mockTransactions),
              }),
            };
          }
        }),
      };

      vi.spyOn(databaseModule, 'createDbClient').mockReturnValue(mockDb as any);

      const response = await app.inject({
        method: 'GET',
        url: '/api/budgets?month=9&year=2026',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(true);
      expect(json.data.budgets).toHaveLength(1);

      const budget = json.data.budgets[0];
      expect(budget.category).toBe('Alimentação');
      expect(budget.amount).toBe(1000);
      expect(budget.spent).toBe(400);
      expect(budget.remaining).toBe(600);
      expect(budget.percentage).toBe(40);
      expect(budget.status).toBe('normal');
      expect(budget.safeToSpendDaily).toBeGreaterThan(0);
      expect(json.data.totalBudgeted).toBe(1000);
      expect(json.data.totalSpent).toBe(400);
    });

    it('deve definir Safe to Spend como 0,00 e status "exceeded" quando consumo >= 100%', async () => {
      const token = app.jwt.sign({ sub: testUserId, email: 'user@healthinance.app' });

      const mockBudgets = [
        {
          id: 'budget-over',
          userId: testUserId,
          category: 'Lazer',
          amount: '500.00',
          periodMonth: 9,
          periodYear: 2026,
          alertPercent: 80,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockTransactions = [
        {
          amount: '-550.00',
          category: 'Lazer',
          type: 'DEBIT',
        },
      ];

      let selectCalls = 0;
      const mockDb = {
        select: vi.fn().mockImplementation(() => {
          selectCalls++;
          if (selectCalls === 1) {
            return {
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue(mockBudgets),
                }),
              }),
            };
          } else {
            return {
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue(mockTransactions),
              }),
            };
          }
        }),
      };

      vi.spyOn(databaseModule, 'createDbClient').mockReturnValue(mockDb as any);

      const response = await app.inject({
        method: 'GET',
        url: '/api/budgets?month=9&year=2026',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      const budget = json.data.budgets[0];
      expect(budget.spent).toBe(550);
      expect(budget.percentage).toBe(110);
      expect(budget.status).toBe('exceeded');
      expect(budget.safeToSpendDaily).toBe(0);
      expect(budget.remaining).toBe(0);
    });
  });

  describe('POST /api/budgets (Criação de Orçamento)', () => {
    it('deve criar novo teto orçamentário e retornar 201 Created', async () => {
      const token = app.jwt.sign({ sub: testUserId, email: 'user@healthinance.app' });

      const createdBudget = {
        id: 'new-budget-id',
        userId: testUserId,
        category: 'Transporte',
        amount: '600.00',
        periodMonth: 9,
        periodYear: 2026,
        alertPercent: 80,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]), // não existe ainda
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([createdBudget]),
          }),
        }),
      };

      vi.spyOn(databaseModule, 'createDbClient').mockReturnValue(mockDb as any);

      const response = await app.inject({
        method: 'POST',
        url: '/api/budgets',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          category: 'Transporte',
          amount: 600,
          periodMonth: 9,
          periodYear: 2026,
        },
      });

      expect(response.statusCode).toBe(201);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(true);
      expect(json.data.category).toBe('Transporte');
      expect(json.data.amount).toBe(600);
    });

    it('deve rejeitar criação com valor negativo', async () => {
      const token = app.jwt.sign({ sub: testUserId, email: 'user@healthinance.app' });

      const response = await app.inject({
        method: 'POST',
        url: '/api/budgets',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          category: 'Transporte',
          amount: -50,
          periodMonth: 9,
          periodYear: 2026,
        },
      });

      expect(response.statusCode).toBe(400);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(false);
    });
  });

  describe('PUT /api/budgets/:id e DELETE /api/budgets/:id', () => {
    it('deve atualizar o orçamento e responder 200 OK', async () => {
      const token = app.jwt.sign({ sub: testUserId, email: 'user@healthinance.app' });

      const updatedBudget = {
        id: 'budget-1',
        userId: testUserId,
        category: 'Alimentação',
        amount: '1200.00',
        periodMonth: 9,
        periodYear: 2026,
        alertPercent: 85,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDb = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([updatedBudget]),
            }),
          }),
        }),
      };

      vi.spyOn(databaseModule, 'createDbClient').mockReturnValue(mockDb as any);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/budgets/budget-1',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          amount: 1200,
          alertPercent: 85,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(true);
      expect(json.data.amount).toBe(1200);
    });

    it('deve excluir o orçamento e responder 200 OK', async () => {
      const token = app.jwt.sign({ sub: testUserId, email: 'user@healthinance.app' });

      const mockDb = {
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'budget-1' }]),
          }),
        }),
      };

      vi.spyOn(databaseModule, 'createDbClient').mockReturnValue(mockDb as any);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/budgets/budget-1',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(true);
      expect(json.message).toBe('Orçamento removido com sucesso');
    });
  });
});
