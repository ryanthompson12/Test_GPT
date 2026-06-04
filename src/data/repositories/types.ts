/**
 * Repository interfaces — the single architectural seam between the app and its
 * storage. Every screen and hook depends ONLY on these interfaces (obtained via
 * getRepositories()), never on SQLite or Drizzle directly.
 *
 * To move to a managed backend later, implement these same interfaces against
 * Supabase and flip the factory in ./index.ts — no UI or hook changes required.
 */
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

export type NewMarketInput = {
  name: string;
  marketTypeId: string | null;
  location: string | null;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  setupMinutes: number;
  sellingMinutes: number;
  teardownMinutes: number;
  status: MarketStatus;
  notes?: string | null;
};

export type NewSaleInput = {
  marketId: string;
  amount: number;
  description?: string | null;
  paymentMethod?: PaymentMethod | null;
};

export type NewExpenseInput = {
  marketId: string;
  categoryId: string;
  amount: number;
  note?: string | null;
};

export interface MarketTypeRepository {
  list(): Promise<MarketType[]>;
  create(name: string): Promise<MarketType>;
}

export interface ExpenseCategoryRepository {
  list(): Promise<ExpenseCategory[]>;
  create(input: { name: string; isCOGS?: boolean }): Promise<ExpenseCategory>;
}

export interface MarketRepository {
  list(): Promise<Market[]>;
  get(id: string): Promise<Market | null>;
  create(input: NewMarketInput): Promise<Market>;
  update(id: string, patch: Partial<NewMarketInput>): Promise<Market>;
  remove(id: string): Promise<void>;
}

export interface SaleRepository {
  listByMarket(marketId: string): Promise<Sale[]>;
  create(input: NewSaleInput): Promise<Sale>;
  remove(id: string): Promise<void>;
}

export interface ExpenseRepository {
  listByMarket(marketId: string): Promise<Expense[]>;
  create(input: NewExpenseInput): Promise<Expense>;
  remove(id: string): Promise<void>;
}

/** Top-level facade returned by getRepositories(). */
export interface Repositories {
  marketTypes: MarketTypeRepository;
  categories: ExpenseCategoryRepository;
  markets: MarketRepository;
  sales: SaleRepository;
  expenses: ExpenseRepository;

  /** Convenience aggregates used by the detail screen, dashboard and forecast. */
  getMarketDetails(marketId: string): Promise<MarketWithDetails | null>;
  getAllMarketDetails(): Promise<MarketWithDetails[]>;

  /** Wipe all user data (used by the demo-data reset in Settings). */
  resetAll(): Promise<void>;
}
