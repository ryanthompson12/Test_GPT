/**
 * TanStack Query hooks — the only thing the screens import to read/write data.
 * Every queryFn/mutationFn calls the repository interface, so swapping the
 * backend later changes nothing here.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { getRepositories } from '@/data/repositories';
import type {
  NewExpenseInput,
  NewMarketInput,
  NewSaleInput,
} from '@/data/repositories/types';

const repos = getRepositories();

export const keys = {
  markets: ['markets'] as const,
  marketDetails: (id: string) => ['marketDetails', id] as const,
  allDetails: ['allDetails'] as const,
  marketTypes: ['marketTypes'] as const,
  categories: ['categories'] as const,
};

/** Invalidate everything that depends on market data after a write. */
function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: keys.markets });
    qc.invalidateQueries({ queryKey: keys.allDetails });
    qc.invalidateQueries({ queryKey: ['marketDetails'] });
  };
}

// ---- reads -----------------------------------------------------------------

export function useMarketTypes() {
  return useQuery({ queryKey: keys.marketTypes, queryFn: () => repos.marketTypes.list() });
}

export function useCategories() {
  return useQuery({ queryKey: keys.categories, queryFn: () => repos.categories.list() });
}

export function useMarket(id: string) {
  return useQuery({ queryKey: keys.marketDetails(id), queryFn: () => repos.getMarketDetails(id) });
}

export function useAllMarketDetails() {
  return useQuery({ queryKey: keys.allDetails, queryFn: () => repos.getAllMarketDetails() });
}

// ---- writes ----------------------------------------------------------------

export function useCreateMarket() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (input: NewMarketInput) => repos.markets.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateMarket() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<NewMarketInput> }) =>
      repos.markets.update(id, patch),
    onSuccess: invalidate,
  });
}

export function useDeleteMarket() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (id: string) => repos.markets.remove(id),
    onSuccess: invalidate,
  });
}

export function useAddSale() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (input: NewSaleInput) => repos.sales.create(input),
    onSuccess: invalidate,
  });
}

export function useRemoveSale() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (id: string) => repos.sales.remove(id),
    onSuccess: invalidate,
  });
}

export function useAddExpense() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (input: NewExpenseInput) => repos.expenses.create(input),
    onSuccess: invalidate,
  });
}

export function useRemoveExpense() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (id: string) => repos.expenses.remove(id),
    onSuccess: invalidate,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; isCOGS?: boolean }) => repos.categories.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.categories }),
  });
}

export function useCreateMarketType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => repos.marketTypes.create(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.marketTypes }),
  });
}
