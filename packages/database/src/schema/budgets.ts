import { pgTable, uuid, varchar, numeric, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.js';

export const budgets = pgTable('budgets', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 128 }).notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  periodMonth: integer('period_month').notNull(),
  periodYear: integer('period_year').notNull(),
  alertPercent: integer('alert_percent').notNull().default(80),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, {
    fields: [budgets.userId],
    references: [users.id],
  }),
}));

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
