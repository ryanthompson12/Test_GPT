import { Link } from 'expo-router';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { LineChart, PieChart } from 'react-native-gifted-charts';

import { buildDashboard } from '@/features/analytics';
import { useAllMarketDetails, useCategories } from '@/features/hooks';
import { formatMoney, formatPercent } from '@/lib/money';
import {
  Card,
  EmptyState,
  Loading,
  MoneyText,
  Muted,
  SectionTitle,
  StatTile,
} from '@/ui/components';
import { colors, font, spacing } from '@/ui/theme';

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const details = useAllMarketDetails();
  const categories = useCategories();

  if (details.isLoading || categories.isLoading || !details.data || !categories.data) {
    return <Loading />;
  }

  const data = buildDashboard(details.data, categories.data);
  const chartWidth = width - spacing.lg * 2 - spacing.lg * 2;

  if (data.completedCount === 0) {
    return (
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
        <EmptyState
          title="No completed markets yet"
          subtitle="Add a market and mark it completed to see your profit, charts, and per-hour earnings here."
        />
      </ScrollView>
    );
  }

  const lineData = data.monthlyTrend.map((m) => ({
    value: Math.round(m.value / 100),
    label: m.label,
  }));

  const pieData = data.expenseBreakdown.slice(0, 8).map((e, i) => ({
    value: e.value,
    color: colors.chart[i % colors.chart.length],
    text: e.label,
  }));

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Card>
        <Muted style={{ fontSize: font.small }}>This month's profit</Muted>
        <MoneyText cents={data.thisMonth.profit} signed size={font.h1} weight="700" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.lg }}>
          <StatTile label="All-time profit">
            <MoneyText cents={data.allTime.profit} signed size={font.h3} weight="700" />
          </StatTile>
          <StatTile label="Profit / hour">
            <MoneyText
              cents={Math.round(data.allTime.profitPerHour ?? 0)}
              signed
              size={font.h3}
              weight="700"
            />
          </StatTile>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.lg }}>
          <StatTile label="Revenue (all time)">
            <MoneyText cents={data.allTime.revenue} size={font.h3} />
          </StatTile>
          <StatTile label="Avg profit / market">
            <MoneyText cents={data.allTime.avgProfit} signed size={font.h3} />
          </StatTile>
        </View>
      </Card>

      {lineData.length >= 2 ? (
        <Card>
          <SectionTitle>Profit by month</SectionTitle>
          <LineChart
            data={lineData}
            width={chartWidth}
            height={180}
            color={colors.primary}
            thickness={3}
            dataPointsColor={colors.primaryDark}
            yAxisTextStyle={{ color: colors.muted, fontSize: font.tiny }}
            xAxisLabelTextStyle={{ color: colors.muted, fontSize: font.tiny }}
            yAxisColor={colors.border}
            xAxisColor={colors.border}
            curved
            noOfSections={4}
            yAxisLabelPrefix="$"
          />
        </Card>
      ) : null}

      <Card>
        <SectionTitle>Where the money goes</SectionTitle>
        <View style={{ alignItems: 'center', marginVertical: spacing.md }}>
          <PieChart data={pieData} donut radius={90} innerRadius={55} />
        </View>
        {data.expenseBreakdown.slice(0, 8).map((e, i) => (
          <View
            key={e.categoryId}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.chart[i % colors.chart.length],
                marginRight: spacing.sm,
              }}
            />
            <Muted style={{ flex: 1, color: colors.text, fontSize: font.small }}>{e.label}</Muted>
            <Muted style={{ fontSize: font.small }}>{formatMoney(e.value)}</Muted>
          </View>
        ))}
      </Card>

      <Card>
        <SectionTitle>Highlights</SectionTitle>
        {data.best ? (
          <Link href={`/market/${data.best.market.id}`}>
            <View style={{ marginBottom: spacing.md }}>
              <Muted style={{ fontSize: font.small }}>Best market</Muted>
              <Muted style={{ color: colors.text, fontWeight: '600' }}>
                {data.best.market.name} · {formatMoney(data.best.profit)}
                {data.best.profitPerHour !== null
                  ? ` · ${formatMoney(Math.round(data.best.profitPerHour))}/hr`
                  : ''}
              </Muted>
            </View>
          </Link>
        ) : null}
        {data.worst && data.worst.market.id !== data.best?.market.id ? (
          <Link href={`/market/${data.worst.market.id}`}>
            <View>
              <Muted style={{ fontSize: font.small }}>Needs attention</Muted>
              <Muted style={{ color: colors.text, fontWeight: '600' }}>
                {data.worst.market.name} · {formatMoney(data.worst.profit)}
              </Muted>
            </View>
          </Link>
        ) : null}
        <Muted style={{ fontSize: font.small, marginTop: spacing.md }}>
          Overall margin: {formatPercent(data.allTime.revenue > 0 ? data.allTime.profit / data.allTime.revenue : null)}
        </Muted>
      </Card>
    </ScrollView>
  );
}
