/**
 * Pure selectors that turn raw market details into dashboard and forecast
 * view-models. No React, no DB — reuses the domain calculation layer.
 */
import {
  computeMarketFinancials,
  monthKey,
  summarize,
  type PeriodSummary,
} from '@/domain/calculations';
import type { ExpenseCategory, Market, MarketWithDetails } from '@/domain/models';
import type { ForecastSample } from '@/domain/forecast';

export function cogsCategoryIds(categories: ExpenseCategory[]): Set<string> {
  return new Set(categories.filter((c) => c.isCOGS).map((c) => c.id));
}

export interface MarketRow {
  market: Market;
  revenue: number;
  profit: number;
  profitPerHour: number | null;
}

export interface DashboardData {
  allTime: PeriodSummary;
  thisMonth: PeriodSummary;
  completedCount: number;
  monthlyTrend: { label: string; value: number }[];
  expenseBreakdown: { categoryId: string; label: string; value: number }[];
  best: MarketRow | null;
  worst: MarketRow | null;
}

const completedOnly = (details: MarketWithDetails[]) =>
  details.filter((d) => d.market.status === 'completed');

/** Per-market summary rows (used by the Markets list and best/worst callouts). */
export function buildMarketRows(
  details: MarketWithDetails[],
  categories: ExpenseCategory[],
): MarketRow[] {
  const cogs = cogsCategoryIds(categories);
  return details.map((d) => {
    const f = computeMarketFinancials(d.market, d.sales, d.expenses, cogs);
    return {
      market: d.market,
      revenue: f.revenue,
      profit: f.profit,
      profitPerHour: f.profitPerHour,
    };
  });
}

export function buildDashboard(
  details: MarketWithDetails[],
  categories: ExpenseCategory[],
): DashboardData {
  const cogs = cogsCategoryIds(categories);
  const completed = completedOnly(details);

  const financials = completed.map((d) =>
    computeMarketFinancials(d.market, d.sales, d.expenses, cogs),
  );

  const thisMonthKey = monthKey(new Date().toISOString().slice(0, 10));
  const thisMonthFinancials = completed
    .filter((d) => monthKey(d.market.date) === thisMonthKey)
    .map((d) => computeMarketFinancials(d.market, d.sales, d.expenses, cogs));

  // Monthly profit trend (chronological).
  const byMonth = new Map<string, number>();
  completed.forEach((d, i) => {
    const key = monthKey(d.market.date);
    byMonth.set(key, (byMonth.get(key) ?? 0) + financials[i].profit);
  });
  const monthlyTrend = [...byMonth.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, value]) => ({ label: key.slice(5), value }));

  // Expense breakdown by category.
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const byCategory = new Map<string, number>();
  for (const d of completed) {
    for (const e of d.expenses) {
      byCategory.set(e.categoryId, (byCategory.get(e.categoryId) ?? 0) + e.amount);
    }
  }
  const expenseBreakdown = [...byCategory.entries()]
    .map(([categoryId, value]) => ({
      categoryId,
      label: categoryName.get(categoryId) ?? 'Other',
      value,
    }))
    .sort((a, b) => b.value - a.value);

  // Best / worst by profit.
  const rows = completed.map((d, i) => ({
    market: d.market,
    revenue: financials[i].revenue,
    profit: financials[i].profit,
    profitPerHour: financials[i].profitPerHour,
  }));
  const sortedByProfit = [...rows].sort((a, b) => b.profit - a.profit);

  return {
    allTime: summarize(financials),
    thisMonth: summarize(thisMonthFinancials),
    completedCount: completed.length,
    monthlyTrend,
    expenseBreakdown,
    best: sortedByProfit[0] ?? null,
    worst: sortedByProfit.length > 1 ? sortedByProfit[sortedByProfit.length - 1] : null,
  };
}

/** Reduce completed markets to the samples the forecast engine consumes. */
export function buildForecastSamples(
  details: MarketWithDetails[],
  categories: ExpenseCategory[],
): ForecastSample[] {
  const cogs = cogsCategoryIds(categories);
  return completedOnly(details).map((d) => {
    const f = computeMarketFinancials(d.market, d.sales, d.expenses, cogs);
    return {
      id: d.market.id,
      date: d.market.date,
      marketTypeId: d.market.marketTypeId,
      revenue: f.revenue,
      totalExpenses: f.totalExpenses,
    };
  });
}
