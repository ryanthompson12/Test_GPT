import { Ionicons } from '@expo/vector-icons';
import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { computeMarketFinancials } from '@/domain/calculations';
import type { ExpenseCategory, PaymentMethod } from '@/domain/models';
import { cogsCategoryIds } from '@/features/analytics';
import {
  useAddExpense,
  useAddSale,
  useCategories,
  useDeleteMarket,
  useMarket,
  useRemoveExpense,
  useRemoveSale,
} from '@/features/hooks';
import { formatMarketDate } from '@/lib/date';
import { formatMoney, formatPercent, parseDollarsToCents } from '@/lib/money';
import {
  Button,
  Card,
  Chip,
  Field,
  Loading,
  MoneyText,
  Muted,
  SectionTitle,
  StatTile,
} from '@/ui/components';
import { colors, font, radius, spacing } from '@/ui/theme';

const PAYMENTS: { label: string; value: PaymentMethod | null }[] = [
  { label: 'Total', value: null },
  { label: 'Cash', value: 'cash' },
  { label: 'Card', value: 'card' },
  { label: 'Other', value: 'other' },
];

export default function MarketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const details = useMarket(id);
  const categories = useCategories();
  const addSale = useAddSale();
  const addExpense = useAddExpense();
  const removeSale = useRemoveSale();
  const removeExpense = useRemoveExpense();
  const deleteMarket = useDeleteMarket();

  const cogsIds = useMemo(() => cogsCategoryIds(categories.data ?? []), [categories.data]);
  const categoryName = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c.name])),
    [categories.data],
  );

  if (details.isLoading || categories.isLoading || !details.data || !categories.data) {
    return <Loading />;
  }

  const { market, sales, expenses } = details.data;
  const f = computeMarketFinancials(market, sales, expenses, cogsIds);

  const onDelete = () => {
    Alert.alert('Delete market', `Delete "${market.name}" and all its entries?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMarket.mutate(market.id, { onSuccess: () => router.back() }),
      },
    ]);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Stack.Screen
        options={{
          title: market.name,
          headerRight: () => (
            <Link href={`/market/${market.id}/edit`} asChild>
              <Pressable hitSlop={12}>
                <Ionicons name="create-outline" size={22} color={colors.primaryDark} />
              </Pressable>
            </Link>
          ),
        }}
      />

      <Card>
        <Muted>
          {formatMarketDate(market.date)} · <Muted style={{ textTransform: 'capitalize' }}>{market.status}</Muted>
        </Muted>
        <View style={{ marginTop: spacing.sm }}>
          <Muted style={{ fontSize: font.small }}>Profit</Muted>
          <MoneyText cents={f.profit} signed size={font.h1} weight="700" />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.lg }}>
          <StatTile label="Revenue">
            <MoneyText cents={f.revenue} size={font.h3} />
          </StatTile>
          <StatTile label="Expenses">
            <MoneyText cents={f.totalExpenses} size={font.h3} />
          </StatTile>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.lg }}>
          <StatTile label="Margin">
            <Muted style={{ color: colors.text, fontSize: font.h3, fontWeight: '700' }}>
              {formatPercent(f.margin)}
            </Muted>
          </StatTile>
          <StatTile label="Profit / hour">
            <MoneyText cents={Math.round(f.profitPerHour ?? 0)} signed size={font.h3} />
          </StatTile>
        </View>
        <Muted style={{ fontSize: font.small, marginTop: spacing.md }}>
          {f.totalHours > 0 ? `${f.totalHours.toFixed(1)} hrs logged` : 'No time logged yet'} · COGS{' '}
          {formatMoney(f.cogs)}
        </Muted>
      </Card>

      <Card>
        <SectionTitle>Sales</SectionTitle>
        {sales.length === 0 ? <Muted style={{ fontSize: font.small }}>No sales yet.</Muted> : null}
        {sales.map((s) => (
          <Row
            key={s.id}
            label={s.paymentMethod ? s.paymentMethod[0].toUpperCase() + s.paymentMethod.slice(1) : 'Sale'}
            amount={s.amount}
            onRemove={() => removeSale.mutate(s.id)}
          />
        ))}
        <AddSale onAdd={(amount, method) => addSale.mutate({ marketId: market.id, amount, paymentMethod: method })} />
      </Card>

      <Card>
        <SectionTitle>Expenses</SectionTitle>
        {expenses.length === 0 ? <Muted style={{ fontSize: font.small }}>No expenses yet.</Muted> : null}
        {expenses.map((e) => (
          <Row
            key={e.id}
            label={categoryName.get(e.categoryId) ?? 'Expense'}
            amount={e.amount}
            onRemove={() => removeExpense.mutate(e.id)}
          />
        ))}
        <AddExpense
          categories={categories.data}
          onAdd={(amount, categoryId) => addExpense.mutate({ marketId: market.id, amount, categoryId })}
        />
      </Card>

      <Button title="Delete market" variant="danger" onPress={onDelete} />
      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

function Row({ label, amount, onRemove }: { label: string; amount: number; onRemove: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
      <Muted style={{ color: colors.text, flex: 1 }}>{label}</Muted>
      <Muted style={{ color: colors.text, fontWeight: '600', marginRight: spacing.md }}>
        {formatMoney(amount)}
      </Muted>
      <Pressable onPress={onRemove} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color={colors.negative} />
      </Pressable>
    </View>
  );
}

function AddSale({ onAdd }: { onAdd: (amount: number, method: PaymentMethod | null) => void }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod | null>(null);

  const submit = () => {
    const cents = parseDollarsToCents(amount);
    if (cents <= 0) return;
    onAdd(cents, method);
    setAmount('');
    setMethod(null);
  };

  return (
    <View style={{ marginTop: spacing.md }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm }}>
        {PAYMENTS.map((p) => (
          <Chip key={p.label} label={p.label} selected={method === p.value} onPress={() => setMethod(p.value)} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Field label="" placeholder="Amount ($)" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
        </View>
        <Pressable
          onPress={submit}
          style={{ backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.lg, height: 48, justifyContent: 'center' }}>
          <Muted style={{ color: '#FFF', fontWeight: '700' }}>Add</Muted>
        </Pressable>
      </View>
    </View>
  );
}

function AddExpense({
  categories,
  onAdd,
}: {
  categories: ExpenseCategory[];
  onAdd: (amount: number, categoryId: string) => void;
}) {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ?? '');

  const submit = () => {
    const cents = parseDollarsToCents(amount);
    if (cents <= 0 || !categoryId) return;
    onAdd(cents, categoryId);
    setAmount('');
  };

  return (
    <View style={{ marginTop: spacing.md }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm }}>
        {categories.map((c) => (
          <Chip key={c.id} label={c.name} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Field label="" placeholder="Amount ($)" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
        </View>
        <Pressable
          onPress={submit}
          style={{ backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.lg, height: 48, justifyContent: 'center' }}>
          <Muted style={{ color: '#FFF', fontWeight: '700' }}>Add</Muted>
        </Pressable>
      </View>
    </View>
  );
}
