import {
  computeMarketFinancials,
  summarize,
  monthKey,
} from '../calculations';
import type { Expense, Sale } from '../models';

const sale = (amount: number, id = Math.random().toString()): Sale => ({
  id,
  marketId: 'm1',
  amount,
  description: null,
  paymentMethod: null,
  createdAt: '2026-01-01T00:00:00.000Z',
});

const expense = (amount: number, categoryId: string, id = Math.random().toString()): Expense => ({
  id,
  marketId: 'm1',
  categoryId,
  amount,
  note: null,
  createdAt: '2026-01-01T00:00:00.000Z',
});

const COGS = new Set(['cat-cogs']);

describe('computeMarketFinancials', () => {
  it('computes profit, margin, and per-hour metrics for a typical market', () => {
    // $500 revenue, $180 expenses ($120 COGS), 10 total hours.
    const sales = [sale(50000)];
    const expenses = [expense(12000, 'cat-cogs'), expense(6000, 'cat-fee')];
    const f = computeMarketFinancials(
      { setupMinutes: 60, sellingMinutes: 480, teardownMinutes: 60 }, // 600 min = 10h
      sales,
      expenses,
      COGS,
    );

    expect(f.revenue).toBe(50000);
    expect(f.totalExpenses).toBe(18000);
    expect(f.cogs).toBe(12000);
    expect(f.profit).toBe(32000); // $320
    expect(f.margin).toBeCloseTo(0.64, 5); // 64%
    expect(f.totalHours).toBe(10);
    expect(f.profitPerHour).toBe(3200); // $32/hr
    expect(f.salesPerHour).toBe(5000); // $50/hr
    expect(f.roi).toBeCloseTo(32000 / 18000, 5);
  });

  it('guards divide-by-zero: no revenue, no time, no expenses', () => {
    const f = computeMarketFinancials(
      { setupMinutes: 0, sellingMinutes: 0, teardownMinutes: 0 },
      [],
      [],
      COGS,
    );
    expect(f.revenue).toBe(0);
    expect(f.profit).toBe(0);
    expect(f.margin).toBeNull();
    expect(f.profitPerHour).toBeNull();
    expect(f.salesPerHour).toBeNull();
    expect(f.roi).toBeNull();
  });

  it('produces a negative profit when expenses exceed revenue', () => {
    const f = computeMarketFinancials(
      { setupMinutes: 30, sellingMinutes: 300, teardownMinutes: 30 }, // 6h
      [sale(10000)],
      [expense(15000, 'cat-fee')],
      COGS,
    );
    expect(f.profit).toBe(-5000); // -$50
    expect(f.profitPerHour).toBeCloseTo(-5000 / 6, 5);
  });
});

describe('summarize', () => {
  it('rolls up multiple markets into totals and averages', () => {
    const a = computeMarketFinancials(
      { setupMinutes: 0, sellingMinutes: 300, teardownMinutes: 0 }, // 5h
      [sale(40000)],
      [expense(10000, 'cat-fee')],
      COGS,
    );
    const b = computeMarketFinancials(
      { setupMinutes: 0, sellingMinutes: 300, teardownMinutes: 0 }, // 5h
      [sale(60000)],
      [expense(20000, 'cat-fee')],
      COGS,
    );
    const s = summarize([a, b]);
    expect(s.marketCount).toBe(2);
    expect(s.revenue).toBe(100000);
    expect(s.totalExpenses).toBe(30000);
    expect(s.profit).toBe(70000);
    expect(s.avgProfit).toBe(35000);
    expect(s.totalMinutes).toBe(600);
    expect(s.profitPerHour).toBe(7000); // $70 over 10h
  });

  it('handles an empty set', () => {
    const s = summarize([]);
    expect(s.marketCount).toBe(0);
    expect(s.profit).toBe(0);
    expect(s.avgProfit).toBe(0);
    expect(s.profitPerHour).toBeNull();
  });
});

describe('monthKey', () => {
  it('extracts yyyy-mm', () => {
    expect(monthKey('2026-06-04')).toBe('2026-06');
  });
});
