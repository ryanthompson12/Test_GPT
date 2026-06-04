import { useRouter } from 'expo-router';

import type { MarketFormValues } from '@/domain/schemas';
import { MarketForm } from '@/features/MarketForm';
import { useCreateMarket } from '@/features/hooks';
import { todayISO } from '@/lib/date';

const EMPTY: MarketFormValues = {
  name: '',
  marketTypeId: null,
  location: '',
  date: todayISO(),
  setupMinutes: '',
  sellingMinutes: '',
  teardownMinutes: '',
  status: 'planned',
  notes: '',
};

export default function NewMarketScreen() {
  const router = useRouter();
  const create = useCreateMarket();

  return (
    <MarketForm
      defaultValues={EMPTY}
      submitLabel="Save market"
      onSubmit={(input) =>
        create.mutate(input, {
          onSuccess: (market) => router.replace(`/market/${market.id}`),
        })
      }
    />
  );
}
