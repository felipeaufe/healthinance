import { pgTable, varchar, uuid, integer, text, timestamp, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.js';



export const pluggyItems = pgTable('pluggy_items', {
  id: varchar('id', { length: 128 }).primaryKey().notNull(), // itemId da Pluggy
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  connectorId: integer('connector_id').notNull(),
  connectorName: varchar('connector_name', { length: 255 }),
  status: varchar('status', { length: 64 }).notNull().default('UPDATING'),
  errorCode: varchar('error_code', { length: 128 }),
  errorMessage: text('error_message'),
  lastUpdatedAt: timestamp('last_updated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const pluggyAccounts = pgTable('pluggy_accounts', {
  id: varchar('id', { length: 128 }).primaryKey().notNull(), // accountId da Pluggy
  itemId: varchar('item_id', { length: 128 })
    .notNull()
    .references(() => pluggyItems.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 64 }).notNull(),
  subtype: varchar('subtype', { length: 64 }),
  name: varchar('name', { length: 255 }).notNull(),
  balance: numeric('balance', { precision: 15, scale: 2 }).notNull().default('0'),
  currencyCode: varchar('currency_code', { length: 8 }).notNull().default('BRL'),
  number: varchar('number', { length: 64 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const pluggyTransactions = pgTable('pluggy_transactions', {
  id: varchar('id', { length: 128 }).primaryKey().notNull(), // transactionId da Pluggy
  accountId: varchar('account_id', { length: 128 })
    .notNull()
    .references(() => pluggyAccounts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  date: timestamp('date', { withTimezone: true }).notNull(),
  category: varchar('category', { length: 128 }),
  type: varchar('type', { length: 32 }).notNull(), // DEBIT ou CREDIT
  status: varchar('status', { length: 64 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relacionamentos Drizzle
export const usersRelations = relations(users, ({ many }) => ({
  items: many(pluggyItems),
  accounts: many(pluggyAccounts),
  transactions: many(pluggyTransactions),
}));

export const pluggyItemsRelations = relations(pluggyItems, ({ one, many }) => ({
  user: one(users, {
    fields: [pluggyItems.userId],
    references: [users.id],
  }),
  accounts: many(pluggyAccounts),
}));

export const pluggyAccountsRelations = relations(pluggyAccounts, ({ one, many }) => ({
  item: one(pluggyItems, {
    fields: [pluggyAccounts.itemId],
    references: [pluggyItems.id],
  }),
  user: one(users, {
    fields: [pluggyAccounts.userId],
    references: [users.id],
  }),
  transactions: many(pluggyTransactions),
}));

export const pluggyTransactionsRelations = relations(pluggyTransactions, ({ one }) => ({
  account: one(pluggyAccounts, {
    fields: [pluggyTransactions.accountId],
    references: [pluggyAccounts.id],
  }),
  user: one(users, {
    fields: [pluggyTransactions.userId],
    references: [users.id],
  }),
}));

export type PluggyItem = typeof pluggyItems.$inferSelect;
export type NewPluggyItem = typeof pluggyItems.$inferInsert;

export type PluggyAccount = typeof pluggyAccounts.$inferSelect;
export type NewPluggyAccount = typeof pluggyAccounts.$inferInsert;

export type PluggyTransaction = typeof pluggyTransactions.$inferSelect;
export type NewPluggyTransaction = typeof pluggyTransactions.$inferInsert;
