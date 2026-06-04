import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { forecast, whatIf, type Confidence } from '@/domain/forecast';
import { buildForecastSamples } from '@/features/analytics';
import { useAllMarketDetails, useCategories, useMarketTypes } from '@/features/hooks';
import { centsToDollars, formatMoney, parseDollarsToCents } from '@/lib/money';
import { Card, Chip, EmptyState, Field, Loading, MoneyText, Muted, SectionTitle } from '@/ui/components';
import { colors, font, radius, spacing } from '@/ui/theme';

const CONFIDENCE_COLOR: Record<Confidence, string> = {
  low: colors.negative,
  medium: colors.warning,
  good: colors.positive,
};

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  low: 'Low — not much history yet',
  medium: 'Medium',
  good: 'Good',
};

export default function ForecastScreen() {
  const details = useAllMarketDetails();
  const categories = useCategories();
  const types = useMarketTypes();
  const [typeId, setTypeId] = useState<string | null>(null);

  const samples = useMemo(
    () =>
      details.data && categories.data
        ? buildForecastSamples(details.data, categories.data)
        : [],
    [details.data, categories.data],
  );

  const result = useMemo(() => forecast(samples, { marketTypeId: typeId }), [samples, typeId]);

  if (details.isLoading || categories.isLoading || !details.data) return <Loading />;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Muted style={{ marginBottom: spacing.md }}>
        Estimates are based only on your own completed markets — no guesswork.
      </Muted>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md }}>
        <Chip label="All types" selected={typeId === null} onPress={() => setTypeId(null)} />
        {(types.data ?? []).map((t) => (
          <Chip key={t.id} label={t.name} selected={typeId === t.id} onPress={() => setTypeId(t.id)} />
        ))}
      </View>

      {!result ? (
        <EmptyState
          title="Not enough history yet"
          subtitle="Complete a few markets and your forecast will appear here."
        />
      ) : (
        <>
          <Card>
            <Muted style={{ fontSize: font.small }}>You typically net</Muted>
            <MoneyText cents={result.expectedProfit} signed size={font.h1} weight="700" />
            <Muted style={{ marginTop: spacing.xs }}>
              Range {formatMoney(result.rangeLow)} – {formatMoney(result.rangeHigh)}
            </Muted>
            <View
              style={{
                alignSelf: 'flex-start',
                marginTop: spacing.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: radius.pill,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: CONFIDENCE_COLOR[result.confidence],
              }}>
              <Muted style={{ color: CONFIDENCE_COLOR[result.confidence], fontSize: font.small, fontWeight: '700' }}>
                Confidence: {CONFIDENCE_LABEL[result.confidence]}
              </Muted>
            </View>
            <Muted style={{ fontSize: font.small, marginTop: spacing.md }}>
              Based on your last {result.sampleSize} {result.basis === 'type' ? 'similar' : ''} market
              {result.sampleSize === 1 ? '' : 's'}
              {result.basis === 'all' && typeId ? ' (all types — too few of that type yet)' : ''}.
            </Muted>
            <Muted style={{ fontSize: font.small, marginTop: spacing.sm }}>
              Expected revenue {formatMoney(result.expectedRevenue)} · expected costs{' '}
              {formatMoney(result.expectedExpenses)}
            </Muted>
          </Card>

          <WhatIf
            baselineRevenue={result.expectedRevenue}
            baselineExpenses={result.expectedExpenses}
            baselineProfit={result.expectedProfit}
            onProject={(rev, exp) => whatIf(result, { revenue: rev, expenses: exp })}
          />
        </>
      )}
    </ScrollView>
  );
}

function WhatIf({
  baselineRevenue,
  baselineExpenses,
  baselineProfit,
  onProject,
}: {
  baselineRevenue: number;
  baselineExpenses: number;
  baselineProfit: number;
  onProject: (revenueCents: number, expensesCents: number) => { projectedProfit: number; deltaVsBaseline: number };
}) {
  const [revenue, setRevenue] = useState(String(centsToDollars(baselineRevenue)));
  const [expenses, setExpenses] = useState(String(centsToDollars(baselineExpenses)));

  const projection = onProject(parseDollarsToCents(revenue), parseDollarsToCents(expenses));

  return (
    <Card>
      <SectionTitle>What if…</SectionTitle>
      <Muted style={{ marginBottom: spacing.md, fontSize: font.small }}>
        Try different numbers — e.g. a higher booth fee or stronger sales — to see the effect.
      </Muted>
      <Field
        label="Expected sales ($)"
        keyboardType="decimal-pad"
        value={revenue}
        onChangeText={setRevenue}
      />
      <Field
        label="Expected costs ($)"
        keyboardType="decimal-pad"
        value={expenses}
        onChangeText={setExpenses}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Muted style={{ color: colors.text, fontWeight: '700' }}>Projected profit</Muted>
        <MoneyText cents={projection.projectedProfit} signed size={font.h3} weight="700" />
      </View>
      <Muted style={{ fontSize: font.small, marginTop: spacing.sm }}>
        {projection.deltaVsBaseline === 0
          ? 'Same as your typical market.'
          : `${projection.deltaVsBaseline > 0 ? '+' : ''}${formatMoney(projection.deltaVsBaseline)} vs. your typical ${formatMoney(baselineProfit)}.`}
      </Muted>
    </Card>
  );
}
