/**
 * Transparent, explainable forecasting — deliberately NOT machine learning.
 *
 * The forecast is a recency-windowed average over the vendor's own completed
 * markets of a similar type, presented with a visible range and the exact list
 * of source markets it came from, so a non-technical vendor can trust it.
 */

export type Confidence = 'low' | 'medium' | 'good';

/** One completed market reduced to the numbers the forecast needs (cents). */
export interface ForecastSample {
  id: string;
  /** ISO date (yyyy-mm-dd) used to pick the most recent markets. */
  date: string;
  marketTypeId: string | null;
  revenue: number;
  totalExpenses: number;
}

export interface ForecastResult {
  /** mean of the cohort, in cents */
  expectedProfit: number;
  expectedRevenue: number;
  expectedExpenses: number;
  /** lowest / highest profit observed in the cohort, in cents */
  rangeLow: number;
  rangeHigh: number;
  confidence: Confidence;
  sampleSize: number;
  /** 'type' when scoped to a market type, 'all' when it fell back to everything. */
  basis: 'type' | 'all';
  /** ids of the exact markets that produced this number, newest first. */
  sourceMarketIds: string[];
}

export interface ForecastOptions {
  /** When set, scope the cohort to this market type (with fallback). */
  marketTypeId?: string | null;
  /** How many recent markets to average. Default 5. */
  window?: number;
  /** Minimum cohort size before we fall back to all markets. Default 3. */
  minCohort?: number;
}

const profitOf = (s: ForecastSample) => s.revenue - s.totalExpenses;
const mean = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);

function confidenceFor(n: number): Confidence {
  if (n < 3) return 'low';
  if (n < 5) return 'medium';
  return 'good';
}

/**
 * Produce a forecast from completed markets. Returns null when there is no
 * history at all to base a prediction on.
 */
export function forecast(
  completedMarkets: ForecastSample[],
  options: ForecastOptions = {},
): ForecastResult | null {
  const { marketTypeId = null, window = 5, minCohort = 3 } = options;

  let basis: 'type' | 'all' = 'all';
  let cohort = completedMarkets;

  if (marketTypeId) {
    const typed = completedMarkets.filter((m) => m.marketTypeId === marketTypeId);
    if (typed.length >= minCohort) {
      cohort = typed;
      basis = 'type';
    }
  }

  if (cohort.length === 0) return null;

  // Most recent `window` markets.
  const recent = [...cohort]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, window);

  const profits = recent.map(profitOf);

  return {
    expectedProfit: mean(profits),
    expectedRevenue: mean(recent.map((m) => m.revenue)),
    expectedExpenses: mean(recent.map((m) => m.totalExpenses)),
    rangeLow: Math.min(...profits),
    rangeHigh: Math.max(...profits),
    confidence: confidenceFor(recent.length),
    sampleSize: recent.length,
    basis,
    sourceMarketIds: recent.map((m) => m.id),
  };
}

export interface WhatIfResult {
  projectedProfit: number;
  /** projectedProfit minus the baseline expectedProfit, in cents */
  deltaVsBaseline: number;
}

/**
 * "What-if" projection: override expected revenue and/or expenses and see the
 * resulting profit and how it differs from the baseline forecast.
 */
export function whatIf(
  baseline: ForecastResult,
  override: { revenue?: number; expenses?: number },
): WhatIfResult {
  const revenue = override.revenue ?? baseline.expectedRevenue;
  const expenses = override.expenses ?? baseline.expectedExpenses;
  const projectedProfit = revenue - expenses;
  return {
    projectedProfit,
    deltaVsBaseline: projectedProfit - baseline.expectedProfit,
  };
}
