import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import * as databaseModule from '@healthinance/database';

describe('Accounts Route Integration Tests (@healthinance/api)', () => {
  let app: FastifyInstance;
  const testUserId = 'user-uuid-1111-1111';

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/accounts', () => {
    it('deve responder 401 Unauthorized se requisição não tiver token JWT', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/accounts',
      });

      expect(response.statusCode).toBe(401);
      const json = JSON.parse(response.payload);
      expect(json.error).toBe('Unauthorized');
    });

    it('deve responder 200 OK com contas e métricas calculadas para usuário autenticado', async () => {
      const token = app.jwt.sign({ sub: testUserId, email: 'user@healthinance.app' });

      const mockAccounts = [
        {
          id: 'acc-1',
          itemId: 'item-1',
          userId: testUserId,
          type: 'BANK',
          subtype: 'CHECKING_ACCOUNT',
          name: 'Conta Corrente',
          balance: '36180.75',
          currencyCode: 'BRL',
          number: '12345-6',
          createdAt: new Date(),
          updatedAt: new Date(),
          connectorName: 'Pluggy Bank',
          connectorId: 2,
        },
        {
          id: 'acc-2',
          itemId: 'item-1',
          userId: testUserId,
          type: 'CREDIT',
          subtype: 'CREDIT_CARD',
          name: 'Mastercard Black',
          balance: '-872.05',
          currencyCode: 'BRL',
          number: '9876',
          createdAt: new Date(),
          updatedAt: new Date(),
          connectorName: 'Pluggy Bank',
          connectorId: 2,
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(mockAccounts),
            }),
          }),
        }),
      };

      vi.spyOn(databaseModule, 'createDbClient').mockReturnValue(mockDb as any);

      const response = await app.inject({
        method: 'GET',
        url: '/api/accounts',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(true);
      expect(json.data.accounts).toHaveLength(2);
      expect(json.data.accounts[0].name).toBe('Conta Corrente');
      expect(json.data.accounts[0].balance).toBe(36180.75);
      expect(json.data.accounts[0].connectorName).toBe('Pluggy Bank');
      expect(json.data.totalBalance).toBeCloseTo(35308.7, 1);
      expect(json.data.institutionsCount).toBe(1);
    });
  });
});
