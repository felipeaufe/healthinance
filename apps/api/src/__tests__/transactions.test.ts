import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";
import * as databaseModule from "@healthinance/database";

describe("Transactions Route Integration Tests (@healthinance/api)", () => {
  let app: FastifyInstance;
  const testUserId = "user-uuid-1111-1111";

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /api/transactions", () => {
    it("deve responder 401 Unauthorized se requisição não tiver token JWT", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/transactions",
      });

      expect(response.statusCode).toBe(401);
      const json = JSON.parse(response.payload);
      expect(json.error).toBe("Unauthorized");
    });

    it("deve responder 200 OK com lista de transações e resumo do mês", async () => {
      const token = app.jwt.sign({ sub: testUserId, email: "user@healthinance.app" });

      const mockTransactions = [
        {
          id: "tx-1",
          accountId: "acc-1",
          userId: testUserId,
          description: "Salário Empresa XYZ",
          amount: "8500.00",
          date: new Date(),
          category: "Renda",
          type: "CREDIT",
          status: "POSTED",
          createdAt: new Date(),
          accountName: "Conta Corrente",
          accountType: "BANK",
          bankName: "Pluggy Bank",
        },
        {
          id: "tx-2",
          accountId: "acc-1",
          userId: testUserId,
          description: "Aluguel Apartamento",
          amount: "-2200.00",
          date: new Date(),
          category: "Moradia",
          type: "DEBIT",
          status: "POSTED",
          createdAt: new Date(),
          accountName: "Conta Corrente",
          accountType: "BANK",
          bankName: "Pluggy Bank",
        },
      ];

      const mockMonthRows = [
        { amount: "8500.00", type: "CREDIT" },
        { amount: "-2200.00", type: "DEBIT" },
      ];

      let selectCallCount = 0;
      const mockDb = {
        select: vi.fn().mockImplementation(() => {
          selectCallCount++;
          if (selectCallCount === 1) {
            // Contagem total
            return {
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ total: 2 }]),
              }),
            };
          } else if (selectCallCount === 2) {
            // Transações paginadas
            return {
              from: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  leftJoin: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                      orderBy: vi.fn().mockReturnValue({
                        limit: vi.fn().mockReturnValue({
                          offset: vi.fn().mockResolvedValue(mockTransactions),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            };
          } else {
            // Linhas do mês corrente
            return {
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue(mockMonthRows),
              }),
            };
          }
        }),
      };

      vi.spyOn(databaseModule, "createDbClient").mockReturnValue(mockDb as any);

      const response = await app.inject({
        method: "GET",
        url: "/api/transactions?limit=10&page=1",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(true);
      expect(json.data.transactions).toHaveLength(2);
      expect(json.data.total).toBe(2);
      expect(json.data.page).toBe(1);
      expect(json.data.limit).toBe(10);
      expect(json.data.transactions[0].description).toBe("Salário Empresa XYZ");
      expect(json.data.transactions[0].amount).toBe(8500);
      expect(json.data.transactions[0].bankName).toBe("Pluggy Bank");
      expect(json.data.summary.monthlyIncome).toBe(8500);
      expect(json.data.summary.monthlyExpenses).toBe(2200);
      expect(json.data.summary.netBalance).toBe(6300);
      expect(json.data.summary.transactionsCount).toBe(2);
    });
  });
});
