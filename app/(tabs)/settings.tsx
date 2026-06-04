import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { getRepositories } from '@/data/repositories';
import { ensureSeededDefaults, seedDemoData } from '@/data/seed';
import {
  useCategories,
  useCreateCategory,
  useCreateMarketType,
  useMarketTypes,
} from '@/features/hooks';
import { Button, Card, Chip, Field, Loading, Muted, SectionTitle } from '@/ui/components';
import { colors, font, spacing } from '@/ui/theme';

export default function SettingsScreen() {
  const qc = useQueryClient();
  const categories = useCategories();
  const types = useMarketTypes();
  const createCategory = useCreateCategory();
  const createType = useCreateMarketType();

  const [categoryName, setCategoryName] = useState('');
  const [categoryIsCogs, setCategoryIsCogs] = useState(false);
  const [typeName, setTypeName] = useState('');

  if (categories.isLoading || types.isLoading) return <Loading />;

  const refreshAll = () => qc.invalidateQueries();

  const onAddCategory = () => {
    if (!categoryName.trim()) return;
    createCategory.mutate(
      { name: categoryName.trim(), isCOGS: categoryIsCogs },
      {
        onSuccess: () => {
          setCategoryName('');
          setCategoryIsCogs(false);
        },
      },
    );
  };

  const onAddType = () => {
    if (!typeName.trim()) return;
    createType.mutate(typeName.trim(), { onSuccess: () => setTypeName('') });
  };

  const onLoadDemo = () => {
    Alert.alert('Load demo data', 'This replaces your current data with sample markets. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Load',
        onPress: async () => {
          await getRepositories().resetAll();
          await seedDemoData(getRepositories());
          refreshAll();
        },
      },
    ]);
  };

  const onClear = () => {
    Alert.alert('Clear all data', 'This deletes every market, sale, and expense. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete everything',
        style: 'destructive',
        onPress: async () => {
          await getRepositories().resetAll();
          await ensureSeededDefaults();
          refreshAll();
        },
      },
    ]);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Card>
        <SectionTitle>Expense categories</SectionTitle>
        {(categories.data ?? []).map((c) => (
          <View key={c.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <Muted style={{ color: colors.text }}>{c.name}</Muted>
            {c.isCOGS ? <Muted style={{ fontSize: font.tiny, color: colors.primary }}>COGS</Muted> : null}
          </View>
        ))}
        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }} />
        <Field label="New category name" value={categoryName} onChangeText={setCategoryName} placeholder="e.g. Booth insurance" />
        <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
          <Chip
            label={categoryIsCogs ? '✓ Counts as cost of goods' : 'Counts as cost of goods'}
            selected={categoryIsCogs}
            onPress={() => setCategoryIsCogs((v) => !v)}
          />
        </View>
        <Button title="Add category" variant="secondary" onPress={onAddCategory} />
      </Card>

      <Card>
        <SectionTitle>Market types</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md }}>
          {(types.data ?? []).map((t) => (
            <View
              key={t.id}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: 999,
                backgroundColor: colors.primarySoft,
                marginRight: spacing.sm,
                marginBottom: spacing.sm,
              }}>
              <Muted style={{ color: colors.primaryDark, fontSize: font.small }}>{t.name}</Muted>
            </View>
          ))}
        </View>
        <Field label="New market type" value={typeName} onChangeText={setTypeName} placeholder="e.g. Night Market" />
        <Button title="Add type" variant="secondary" onPress={onAddType} />
      </Card>

      <Card>
        <SectionTitle>Data</SectionTitle>
        <Muted style={{ fontSize: font.small, marginBottom: spacing.md }}>
          Your data is stored privately on this device.
        </Muted>
        <View style={{ gap: spacing.md }}>
          <Button title="Load demo data" variant="secondary" onPress={onLoadDemo} />
          <Button title="Clear all data" variant="danger" onPress={onClear} />
        </View>
      </Card>

      <Card>
        <SectionTitle>Account</SectionTitle>
        <Muted style={{ fontSize: font.small }}>
          Currency: USD. Cloud accounts, multi-device sync, and subscriptions are coming in a future
          version — your data model is already built to support them.
        </Muted>
      </Card>
    </ScrollView>
  );
}
