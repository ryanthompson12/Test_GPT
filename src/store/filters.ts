/**
 * UI-only state (not domain data). Domain data lives in SQLite + TanStack Query.
 */
import { create } from 'zustand';

import type { MarketStatus } from '@/domain/models';

export type StatusFilter = 'all' | MarketStatus;

interface FilterState {
  marketStatus: StatusFilter;
  setMarketStatus: (status: StatusFilter) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  marketStatus: 'all',
  setMarketStatus: (marketStatus) => set({ marketStatus }),
}));
