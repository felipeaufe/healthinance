import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

describe('Fastify API Integration Tests (@healthinance/api)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('deve responder com 200 OK e status do serviço', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.status).toBe('ok');
      expect(json.service).toBe('@healthinance/api');
      expect(json.timestamp).toBeDefined();
    });
  });

  describe('GET /health/connections', () => {
    it('deve responder com o diagnóstico de conexões e campos obrigatórios', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health/connections',
      });

      expect([200, 503]).toContain(response.statusCode);
      const json = JSON.parse(response.payload);
      expect(json.connections).toBeDefined();
      expect(json.connections.database).toBeDefined();
      expect(json.connections.pluggy).toBeDefined();
    });

    it('deve responder 503 Service Unavailable quando uma conexão falhar', async () => {
      const dbModule = await import('@healthinance/database');
      vi.spyOn(dbModule, 'checkDatabaseConnection').mockResolvedValueOnce({
        ok: false,
        latencyMs: 10,
        error: 'Connection timeout',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/health/connections',
      });

      expect(response.statusCode).toBe(503);
      const json = JSON.parse(response.payload);
      expect(json.status).toBe('degraded');
      expect(json.connections.database.status).toBe('disconnected');
      expect(json.connections.database.error).toBe('Connection timeout');
    });
  });



  describe('POST /api/webhooks/pluggy', () => {
    it('deve responder 200 OK e acionar background sync para evento válido', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/webhooks/pluggy',
        payload: {
          event: 'item/updated',
          itemId: 'test-item-uuid-123',
          triggeredBy: 'USER',
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.received).toBe(true);
    });

    it('deve responder 400 Bad Request para payload de webhook inválido', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/webhooks/pluggy',
        payload: {
          event: 'unknown-event',
          // faltando itemId obrigatório
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Proteção de Rotas com Autenticação Supabase JWT', () => {
    it('deve responder 401 Unauthorized ao acessar /api/accounts sem token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/accounts',
      });

      expect(response.statusCode).toBe(401);
      const json = JSON.parse(response.payload);
      expect(json.error).toBe('Unauthorized');
    });

    it('deve responder 401 Unauthorized ao tentar gerar connect-token sem autenticação', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pluggy/connect-token',
      });

      expect(response.statusCode).toBe(401);
    });

    it('deve responder 401 Unauthorized ao acessar /api/transactions sem token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/transactions',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
