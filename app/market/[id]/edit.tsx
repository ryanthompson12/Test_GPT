import { useLocalSearchParams, useRouter } from 'expo-router';

import type { MarketFormValues } from '@/domain/schemas';
import { MarketForm } from '@/features/MarketForm';
import { useMarket, useUpdateMarket } from '@/features/hooks';
import { Loading } from '@/ui/components';

export default function EditMarketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const details = useMarket(id);
  const update = useUpdateMarket();

  if (details.isLoading || !details.data) return <Loading />;

  const m = details.data.market;
  const defaults: MarketFormValues = {
    name: m.name,
    marketTypeId: m.marketTypeId,
    location: m.location ?? '',
    date: m.date,
    setupMinutes: String(m.setupMinutes),
    sellingMinutes: String(m.sellingMinutes),
    teardownMinutes: String(m.teardownMinutes),
    status: m.status,
    notes: m.notes ?? '',
  };

  return (
    <MarketForm
      defaultValues={defaults}
      submitLabel="Save changes"
      onSubmit={(input) =>
        update.mutate({ id, patch: input }, { onSuccess: () => router.back() })
      }
    />
  );
}
