import { z } from 'zod';

export const PluggyItemStatusSchema = z.enum([
  'UPDATING',
  'UPDATED',
  'WAITING_USER_INPUT',
  'LOGIN_ERROR',
  'OUTDATED',
  'DELETED',
]);
export type PluggyItemStatus = z.infer<typeof PluggyItemStatusSchema>;

export const ConnectTokenResponseSchema = z.object({
  accessToken: z.string(),
});
export type ConnectTokenResponse = z.infer<typeof ConnectTokenResponseSchema>;

export const WebhookEventSchema = z.object({
  event: z.string(),
  itemId: z.string(),
  error: z.string().nullable().optional(),
  triggeredBy: z.enum(['USER', 'SYNC']).optional(),
});
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

export const AccountTypeSchema = z.enum([
  'BANK',
  'CREDIT',
  'INVESTMENT',
  'OTHER',
]);
export type AccountType = z.infer<typeof AccountTypeSchema>;

export const AccountSubtypeSchema = z.enum([
  'CHECKING_ACCOUNT',
  'SAVINGS_ACCOUNT',
  'CREDIT_CARD',
  'INVESTMENT_ACCOUNT',
  'OTHER',
]);
export type AccountSubtype = z.infer<typeof AccountSubtypeSchema>;

export const TransactionTypeSchema = z.enum(['DEBIT', 'CREDIT']);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const AccountDTOSchema = z.object({
  id: z.string().uuid().or(z.string()),
  itemId: z.string(),
  type: AccountTypeSchema,
  subtype: AccountSubtypeSchema.optional().nullable(),
  name: z.string(),
  balance: z.number(),
  currencyCode: z.string().default('BRL'),
  bankName: z.string().optional().nullable(),
});
export type AccountDTO = z.infer<typeof AccountDTOSchema>;

export const TransactionDTOSchema = z.object({
  id: z.string().uuid().or(z.string()),
  accountId: z.string(),
  description: z.string(),
  amount: z.number(),
  date: z.string(),
  category: z.string().optional().nullable(),
  type: TransactionTypeSchema,
  status: z.string().optional().nullable(),
});
export type TransactionDTO = z.infer<typeof TransactionDTOSchema>;

export const SyncItemParamsSchema = z.object({
  id: z.string().min(1, 'Item ID é obrigatório'),
});
export type SyncItemParams = z.infer<typeof SyncItemParamsSchema>;

export const SyncItemResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z
    .object({
      itemId: z.string(),
      status: z.string().optional(),
    })
    .optional(),
  error: z.string().optional(),
});
export type SyncItemResponse = z.infer<typeof SyncItemResponseSchema>;
