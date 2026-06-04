/**
 * The single source of truth for profit math. Pure functions only — no React,
 * no database — so they are fully unit-testable and reused identically by the
 * UI, the dashboard roll-ups, and the forecast cohort builder.
 *
 * Profit and its derivatives are always COMPUTED, never stored.
 */

import type { Expense, Market, Sale } from './models';

export interface MarketFinancials {
  /** integer cents */
  revenue: number;
  totalExpenses: number;
  cogs: number;
  profit: number;
  /** profit / revenue, in 0..1; null when there is no revenue. */
  margin: number | null;
  totalMinutes: number;
  totalHours: number;
  /** cents per hour; null when no time was logged. */
  profitPerHour: number | null;
  salesPerHour: number | null;
  /** profit / totalExpenses; null when no expenses. */
  roi: number | null;
}

export function sumSales(sales: Sale[]): number {
  return sales.reduce((total, s) => total + s.amount, 0);
}

export function sumExpenses(expenses: Expense[]): number {
  return expenses.reduce((total, e) => total + e.amount, 0);
}

export function sumCogs(expenses: Expense[], cogsCategoryIds: ReadonlySet<string>): number {
  return expenses.reduce(
    (total, e) => (cogsCategoryIds.has(e.categoryId) ? total + e.amount : total),
    0,
  );
}

/**
 * Compute every financial metric for one market.
 * `cogsCategoryIds` is the set of ExpenseCategory ids flagged isCOGS.
 */
export function computeMarketFinancials(
  market: Pick<Market, 'setupMinutes' | 'sellingMinutes' | 'teardownMinutes'>,
  sales: Sale[],
  expenses: Expense[],
  cogsCategoryIds: ReadonlySet<string>,
): MarketFinancials {
  const revenue = sumSales(sales);
  const totalExpenses = sumExpenses(expenses);
  const cogs = sumCogs(expenses, cogsCategoryIds);
  const profit = revenue - totalExpenses;

  const totalMinutes =
    market.setupMinutes + market.sellingMinutes + market.teardownMinutes;
  const totalHours = totalMinutes / 60;

  return {
    revenue,
    totalExpenses,
    cogs,
    profit,
    margin: revenue > 0 ? profit / revenue : null,
    totalMinutes,
    totalHours,
    profitPerHour: totalHours > 0 ? profit / totalHours : null,
    salesPerHour: totalHours > 0 ? revenue / totalHours : null,
    roi: totalExpenses > 0 ? profit / totalExpenses : null,
  };
}

export interface PeriodSummary {
  marketCount: number;
  revenue: number;
  totalExpenses: number;
  cogs: number;
  profit: number;
  /** mean profit per market in cents; 0 when no markets. */
  avgProfit: number;
  totalMinutes: number;
  /** blended cents per hour across the period; null when no time logged. */
  profitPerHour: number | null;
}

/** Aggregate a set of already-computed market financials into one summary. */
export function summarize(financials: MarketFinancials[]): PeriodSummary {
  const base: PeriodSummary = {
    marketCount: financials.length,
    revenue: 0,
    totalExpenses: 0,
    cogs: 0,
    profit: 0,
    avgProfit: 0,
    totalMinutes: 0,
    profitPerHour: null,
  };

  for (const f of financials) {
    base.revenue += f.revenue;
    base.totalExpenses += f.totalExpenses;
    base.cogs += f.cogs;
    base.profit += f.profit;
    base.totalMinutes += f.totalMinutes;
  }

  base.avgProfit = financials.length ? Math.round(base.profit / financials.length) : 0;
  const totalHours = base.totalMinutes / 60;
  base.profitPerHour = totalHours > 0 ? base.profit / totalHours : null;

  return base;
}

/** Month bucket key (yyyy-mm) for an ISO date string. */
export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}
