import { z } from "zod";
import { TransactionTypeSchema } from "./pluggy.js";

export const TransactionWithAccountSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  userId: z.string(),
  description: z.string(),
  amount: z.number(),
  date: z.string().or(z.date()),
  category: z.string().optional().nullable(),
  type: TransactionTypeSchema.or(z.string()),
  status: z.string().optional().nullable(),
  accountName: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  accountType: z.string().optional().nullable(),
  createdAt: z.date().or(z.string()).optional(),
});

export type TransactionWithAccount = z.infer<typeof TransactionWithAccountSchema>;

export const TransactionsQuerySchema = z.object({
  accountId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20).optional(),
  page: z.coerce.number().min(1).default(1).optional(),
});

export type TransactionsQuery = z.infer<typeof TransactionsQuerySchema>;

export const MonthlyFinancialSummarySchema = z.object({
  monthlyIncome: z.number(),
  monthlyExpenses: z.number(),
  netBalance: z.number(),
  transactionsCount: z.number(),
});

export type MonthlyFinancialSummary = z.infer<typeof MonthlyFinancialSummarySchema>;

export const TransactionsListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    transactions: z.array(TransactionWithAccountSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    summary: MonthlyFinancialSummarySchema.optional(),
  }),
  error: z.string().optional(),
});

export type TransactionsListResponse = z.infer<typeof TransactionsListResponseSchema>;
