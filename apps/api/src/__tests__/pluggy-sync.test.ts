import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import * as pluggyService from '../services/pluggy.js';
import * as databaseModule from '@healthinance/database';

describe('Pluggy Sync Integration Tests (@healthinance/api)', () => {
  let app: FastifyInstance;
  const testUserId = 'user-uuid-1111-1111';
  const otherUserId = 'user-uuid-9999-9999';

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/pluggy/items/:id/sync', () => {
    it('deve responder 401 Unauthorized se requisição não tiver token JWT', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pluggy/items/item-123/sync',
      });

      expect(response.statusCode).toBe(401);
      const json = JSON.parse(response.payload);
      expect(json.error).toBe('Unauthorized');
    });

    it('deve responder 403 Forbidden se o item pertencer a outro usuário', async () => {
      const token = app.jwt.sign({ sub: testUserId, email: 'user@healthinance.app' });

      // Mocka o db para retornar item com userId diferente
      const mockDb = {
        query: {
          pluggyItems: {
            findFirst: vi.fn().mockResolvedValue({
              id: 'item-of-other-user',
              userId: otherUserId,
              connectorId: 2,
              status: 'UPDATED',
            }),
          },
        },
      };
      vi.spyOn(databaseModule, 'createDbClient').mockReturnValueOnce(mockDb as any);

      const response = await app.inject({
        method: 'POST',
        url: '/api/pluggy/items/item-of-other-user/sync',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(403);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(false);
      expect(json.message).toContain('Acesso negado');
    });

    it('deve responder 200 OK e sincronizar quando o item pertencer ao usuário', async () => {
      const token = app.jwt.sign({ sub: testUserId, email: 'user@healthinance.app' });

      const mockDb = {
        query: {
          pluggyItems: {
            findFirst: vi.fn().mockResolvedValue({
              id: 'my-item-123',
              userId: testUserId,
              connectorId: 2,
              status: 'UPDATED',
            }),
          },
        },
      };
      vi.spyOn(databaseModule, 'createDbClient').mockReturnValueOnce(mockDb as any);
      vi.spyOn(pluggyService, 'syncItemData').mockResolvedValueOnce({
        itemId: 'my-item-123',
        status: 'UPDATED',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/pluggy/items/my-item-123/sync',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(true);
      expect(json.message).toBe('Item sincronizado com sucesso');
      expect(json.data.itemId).toBe('my-item-123');
      expect(json.data.status).toBe('UPDATED');
    });

    it('deve responder 200 OK quando o item for recém-conectado (não existente ainda no banco local)', async () => {
      const token = app.jwt.sign({ sub: testUserId, email: 'user@healthinance.app' });

      const mockDb = {
        query: {
          pluggyItems: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
        },
      };
      vi.spyOn(databaseModule, 'createDbClient').mockReturnValueOnce(mockDb as any);
      vi.spyOn(pluggyService, 'syncItemData').mockResolvedValueOnce({
        itemId: 'new-connected-item',
        status: 'UPDATING',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/pluggy/items/new-connected-item/sync',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(true);
      expect(json.data.itemId).toBe('new-connected-item');
    });

    it('deve responder 500 Internal Server Error quando a API da Pluggy falhar', async () => {
      const token = app.jwt.sign({ sub: testUserId, email: 'user@healthinance.app' });

      const mockDb = {
        query: {
          pluggyItems: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
        },
      };
      vi.spyOn(databaseModule, 'createDbClient').mockReturnValueOnce(mockDb as any);
      vi.spyOn(pluggyService, 'syncItemData').mockRejectedValueOnce(
        new Error('Pluggy API rate limit exceeded')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/api/pluggy/items/item-with-error/sync',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(500);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Pluggy API rate limit exceeded');
    });
  });
});
