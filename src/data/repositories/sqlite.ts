/**
 * SQLite/Drizzle implementation of the repository interfaces. This is the only
 * place that knows about the database. Rows are mapped to clean domain models.
 */
import { randomUUID } from 'expo-crypto';
import { asc, desc, eq } from 'drizzle-orm';

import type {
  Expense,
  ExpenseCategory,
  Market,
  MarketStatus,
  MarketType,
  MarketWithDetails,
  PaymentMethod,
  Sale,
} from '@/domain/models';
import { db } from '../db/client';
import * as t from '../db/schema';
import type {
  NewExpenseInput,
  NewMarketInput,
  NewSaleInput,
  Repositories,
} from './types';

const now = () => new Date().toISOString();

// ---- row -> domain mappers -------------------------------------------------

const toMarketType = (r: typeof t.marketTypes.$inferSelect): MarketType => ({
  id: r.id,
  name: r.name,
  isSystemDefault: r.isSystemDefault,
});

const toCategory = (r: typeof t.expenseCategories.$inferSelect): ExpenseCategory => ({
  id: r.id,
  name: r.name,
  isCOGS: r.isCogs,
  isSystemDefault: r.isSystemDefault,
  sortOrder: r.sortOrder,
});

const toMarket = (r: typeof t.markets.$inferSelect): Market => ({
  id: r.id,
  name: r.name,
  marketTypeId: r.marketTypeId,
  location: r.location,
  date: r.date,
  startTime: r.startTime,
  endTime: r.endTime,
  setupMinutes: r.setupMinutes,
  sellingMinutes: r.sellingMinutes,
  teardownMinutes: r.teardownMinutes,
  status: r.status as MarketStatus,
  notes: r.notes,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

const toExpense = (r: typeof t.expenses.$inferSelect): Expense => ({
  id: r.id,
  marketId: r.marketId,
  categoryId: r.categoryId,
  amount: r.amount,
  note: r.note,
  createdAt: r.createdAt,
});

const toSale = (r: typeof t.sales.$inferSelect): Sale => ({
  id: r.id,
  marketId: r.marketId,
  amount: r.amount,
  description: r.description,
  paymentMethod: (r.paymentMethod as PaymentMethod | null) ?? null,
  createdAt: r.createdAt,
});

// ---- repositories ----------------------------------------------------------

export function createSqliteRepositories(): Repositories {
  const markets = {
    async list(): Promise<Market[]> {
      const rows = await db.select().from(t.markets).orderBy(desc(t.markets.date));
      return rows.map(toMarket);
    },
    async get(id: string): Promise<Market | null> {
      const rows = await db.select().from(t.markets).where(eq(t.markets.id, id)).limit(1);
      return rows[0] ? toMarket(rows[0]) : null;
    },
    async create(input: NewMarketInput): Promise<Market> {
      const row = {
        id: randomUUID(),
        name: input.name,
        marketTypeId: input.marketTypeId,
        location: input.location ?? null,
        date: input.date,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        setupMinutes: input.setupMinutes,
        sellingMinutes: input.sellingMinutes,
        teardownMinutes: input.teardownMinutes,
        status: input.status,
        notes: input.notes ?? null,
        createdAt: now(),
        updatedAt: now(),
      };
      await db.insert(t.markets).values(row);
      return toMarket(row as typeof t.markets.$inferSelect);
    },
    async update(id: string, patch: Partial<NewMarketInput>): Promise<Market> {
      await db
        .update(t.markets)
        .set({ ...patch, updatedAt: now() })
        .where(eq(t.markets.id, id));
      const updated = await this.get(id);
      if (!updated) throw new Error(`Market ${id} not found after update`);
      return updated;
    },
    async remove(id: string): Promise<void> {
      await db.delete(t.expenses).where(eq(t.expenses.marketId, id));
      await db.delete(t.sales).where(eq(t.sales.marketId, id));
      await db.delete(t.markets).where(eq(t.markets.id, id));
    },
  };

  const sales = {
    async listByMarket(marketId: string): Promise<Sale[]> {
      const rows = await db.select().from(t.sales).where(eq(t.sales.marketId, marketId));
      return rows.map(toSale);
    },
    async create(input: NewSaleInput): Promise<Sale> {
      const row = {
        id: randomUUID(),
        marketId: input.marketId,
        amount: input.amount,
        description: input.description ?? null,
        paymentMethod: input.paymentMethod ?? null,
        createdAt: now(),
      };
      await db.insert(t.sales).values(row);
      return toSale(row as typeof t.sales.$inferSelect);
    },
    async remove(id: string): Promise<void> {
      await db.delete(t.sales).where(eq(t.sales.id, id));
    },
  };

  const expenses = {
    async listByMarket(marketId: string): Promise<Expense[]> {
      const rows = await db.select().from(t.expenses).where(eq(t.expenses.marketId, marketId));
      return rows.map(toExpense);
    },
    async create(input: NewExpenseInput): Promise<Expense> {
      const row = {
        id: randomUUID(),
        marketId: input.marketId,
        categoryId: input.categoryId,
        amount: input.amount,
        note: input.note ?? null,
        createdAt: now(),
      };
      await db.insert(t.expenses).values(row);
      return toExpense(row as typeof t.expenses.$inferSelect);
    },
    async remove(id: string): Promise<void> {
      await db.delete(t.expenses).where(eq(t.expenses.id, id));
    },
  };

  const marketTypes = {
    async list(): Promise<MarketType[]> {
      const rows = await db.select().from(t.marketTypes).orderBy(asc(t.marketTypes.name));
      return rows.map(toMarketType);
    },
    async create(name: string): Promise<MarketType> {
      const row = { id: randomUUID(), name, isSystemDefault: false };
      await db.insert(t.marketTypes).values(row);
      return toMarketType(row as typeof t.marketTypes.$inferSelect);
    },
  };

  const categories = {
    async list(): Promise<ExpenseCategory[]> {
      const rows = await db
        .select()
        .from(t.expenseCategories)
        .orderBy(asc(t.expenseCategories.sortOrder), asc(t.expenseCategories.name));
      return rows.map(toCategory);
    },
    async create(input: { name: string; isCOGS?: boolean }): Promise<ExpenseCategory> {
      const row = {
        id: randomUUID(),
        name: input.name,
        isCogs: input.isCOGS ?? false,
        isSystemDefault: false,
        sortOrder: 100,
      };
      await db.insert(t.expenseCategories).values(row);
      return toCategory(row as typeof t.expenseCategories.$inferSelect);
    },
  };

  return {
    marketTypes,
    categories,
    markets,
    sales,
    expenses,

    async getMarketDetails(marketId: string): Promise<MarketWithDetails | null> {
      const market = await markets.get(marketId);
      if (!market) return null;
      const [marketSales, marketExpenses] = await Promise.all([
        sales.listByMarket(marketId),
        expenses.listByMarket(marketId),
      ]);
      return { market, sales: marketSales, expenses: marketExpenses };
    },

    async getAllMarketDetails(): Promise<MarketWithDetails[]> {
      const all = await markets.list();
      const allSales = await db.select().from(t.sales);
      const allExpenses = await db.select().from(t.expenses);
      return all.map((market) => ({
        market,
        sales: allSales.filter((s) => s.marketId === market.id).map(toSale),
        expenses: allExpenses.filter((e) => e.marketId === market.id).map(toExpense),
      }));
    },

    async resetAll(): Promise<void> {
      await db.delete(t.expenses);
      await db.delete(t.sales);
      await db.delete(t.markets);
      await db.delete(t.expenseCategories);
      await db.delete(t.marketTypes);
    },
  };
}
