import { z } from 'zod';
import { AccountTypeSchema, AccountSubtypeSchema } from './pluggy.js';

export const AccountWithConnectorSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  userId: z.string(),
  type: AccountTypeSchema.or(z.string()),
  subtype: AccountSubtypeSchema.optional().nullable().or(z.string().nullable()),
  name: z.string(),
  balance: z.number().or(z.string()),
  currencyCode: z.string().default('BRL'),
  number: z.string().optional().nullable(),
  connectorName: z.string().optional().nullable(),
  connectorId: z.number().optional().nullable(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type AccountWithConnector = z.infer<typeof AccountWithConnectorSchema>;

export const AccountsListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    accounts: z.array(AccountWithConnectorSchema),
    totalBalance: z.number(),
    institutionsCount: z.number(),
  }),
  error: z.string().optional(),
});

export type AccountsListResponse = z.infer<typeof AccountsListResponseSchema>;
