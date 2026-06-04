import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';

import type { MarketType } from '@/domain/models';
import { buildMarketRows, type MarketRow } from '@/features/analytics';
import { useAllMarketDetails, useCategories, useMarketTypes } from '@/features/hooks';
import { formatMarketDate } from '@/lib/date';
import { Chip, EmptyState, Loading, Muted, ProfitBadge } from '@/ui/components';
import { useFilterStore } from '@/store/filters';
import { colors, font, radius, spacing } from '@/ui/theme';

const FILTERS: { label: string; value: 'all' | 'planned' | 'completed' | 'cancelled' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Planned', value: 'planned' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function MarketsScreen() {
  const router = useRouter();
  const details = useAllMarketDetails();
  const categories = useCategories();
  const types = useMarketTypes();
  const { marketStatus, setMarketStatus } = useFilterStore();

  if (details.isLoading || categories.isLoading || !details.data || !categories.data) {
    return <Loading />;
  }

  const typeName = (id: string | null) =>
    (types.data ?? []).find((t: MarketType) => t.id === id)?.name ?? 'Uncategorized';

  const rows = buildMarketRows(details.data, categories.data).filter((r) =>
    marketStatus === 'all' ? true : r.market.status === marketStatus,
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: spacing.lg, paddingBottom: 0 }}>
        {FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            selected={marketStatus === f.value}
            onPress={() => setMarketStatus(f.value)}
          />
        ))}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => r.market.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 96 }}
        ListEmptyComponent={
          <EmptyState
            title="No markets here yet"
            subtitle="Tap the + button to add your first market and start tracking profit."
          />
        }
        renderItem={({ item }: { item: MarketRow }) => (
          <Link href={`/market/${item.market.id}`} asChild>
            <Pressable
              style={{
                backgroundColor: colors.card,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.lg,
                marginBottom: spacing.md,
              }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, paddingRight: spacing.md }}>
                  <Muted style={{ color: colors.text, fontWeight: '700', fontSize: font.body }}>
                    {item.market.name}
                  </Muted>
                  <Muted style={{ fontSize: font.small, marginTop: 2 }}>
                    {formatMarketDate(item.market.date)} · {typeName(item.market.marketTypeId)}
                  </Muted>
                </View>
                {item.market.status === 'completed' ? (
                  <ProfitBadge cents={item.profit} />
                ) : (
                  <View
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                      borderRadius: radius.pill,
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}>
                    <Muted style={{ fontSize: font.small, textTransform: 'capitalize' }}>
                      {item.market.status}
                    </Muted>
                  </View>
                )}
              </View>
            </Pressable>
          </Link>
        )}
      />

      <Pressable
        onPress={() => router.push('/market/new')}
        style={{
          position: 'absolute',
          right: spacing.lg,
          bottom: spacing.xl,
          backgroundColor: colors.primary,
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
          elevation: 4,
        }}>
        <Ionicons name="add" size={30} color="#FFF" />
      </Pressable>
    </View>
  );
}
