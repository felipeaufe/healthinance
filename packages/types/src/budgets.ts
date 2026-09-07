import { z } from 'zod';

export const BudgetStatusSchema = z.enum(['normal', 'warning', 'exceeded']);
export type BudgetStatus = z.infer<typeof BudgetStatusSchema>;

export const CreateBudgetSchema = z.object({
  category: z.string().min(1, 'A categoria é obrigatória'),
  amount: z.coerce.number().positive('O valor deve ser maior que zero'),
  periodMonth: z.coerce.number().int().min(1).max(12),
  periodYear: z.coerce.number().int().min(2000).max(2100),
  alertPercent: z.coerce.number().int().min(1).max(100).default(80),
});
export type CreateBudget = z.infer<typeof CreateBudgetSchema>;

export const UpdateBudgetSchema = z.object({
  amount: z.coerce.number().positive('O valor deve ser maior que zero').optional(),
  alertPercent: z.coerce.number().int().min(1).max(100).optional(),
});
export type UpdateBudget = z.infer<typeof UpdateBudgetSchema>;

export const BudgetsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});
export type BudgetsQuery = z.infer<typeof BudgetsQuerySchema>;

export const BudgetWithConsumptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  category: z.string(),
  amount: z.number(),
  periodMonth: z.number(),
  periodYear: z.number(),
  alertPercent: z.number(),
  spent: z.number(),
  remaining: z.number(),
  percentage: z.number(),
  status: BudgetStatusSchema,
  safeToSpendDaily: z.number(),
  daysRemaining: z.number(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});
export type BudgetWithConsumption = z.infer<typeof BudgetWithConsumptionSchema>;

export const BudgetsListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    budgets: z.array(BudgetWithConsumptionSchema),
    totalBudgeted: z.number(),
    totalSpent: z.number(),
  }),
  error: z.string().optional(),
});
export type BudgetsListResponse = z.infer<typeof BudgetsListResponseSchema>;
