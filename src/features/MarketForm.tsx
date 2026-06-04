/** Shared add/edit form for a Market. Used by market/new and market/[id]/edit. */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, View } from 'react-native';

import type { MarketStatus } from '@/domain/models';
import { marketFormSchema, type MarketFormValues } from '@/domain/schemas';
import type { NewMarketInput } from '@/data/repositories/types';
import { useMarketTypes } from '@/features/hooks';
import { Button, Chip, Field, Muted, SectionTitle } from '@/ui/components';
import { colors, font, spacing } from '@/ui/theme';

const STATUSES: MarketStatus[] = ['planned', 'completed', 'cancelled'];

export function formValuesToInput(v: MarketFormValues): NewMarketInput {
  const toMin = (s: string) => (s === '' ? 0 : parseInt(s, 10));
  return {
    name: v.name.trim(),
    marketTypeId: v.marketTypeId,
    location: v.location.trim() || null,
    date: v.date,
    setupMinutes: toMin(v.setupMinutes),
    sellingMinutes: toMin(v.sellingMinutes),
    teardownMinutes: toMin(v.teardownMinutes),
    status: v.status,
    notes: v.notes.trim() || null,
  };
}

export function MarketForm({
  defaultValues,
  submitLabel,
  onSubmit,
}: {
  defaultValues: MarketFormValues;
  submitLabel: string;
  onSubmit: (input: NewMarketInput) => void;
}) {
  const types = useMarketTypes();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MarketFormValues>({
    resolver: zodResolver(marketFormSchema),
    defaultValues,
  });

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <Field
            label="Market name"
            value={field.value}
            onChangeText={field.onChange}
            placeholder="e.g. Riverside Craft Fair"
            error={errors.name?.message}
          />
        )}
      />

      <Muted style={{ fontSize: font.small, fontWeight: '600', color: colors.text, marginBottom: spacing.sm }}>
        Market type
      </Muted>
      <Controller
        control={control}
        name="marketTypeId"
        render={({ field }) => (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
            {(types.data ?? []).map((t) => (
              <Chip
                key={t.id}
                label={t.name}
                selected={field.value === t.id}
                onPress={() => field.onChange(field.value === t.id ? null : t.id)}
              />
            ))}
          </View>
        )}
      />

      <Controller
        control={control}
        name="date"
        render={({ field }) => (
          <Field
            label="Date (YYYY-MM-DD)"
            value={field.value}
            onChangeText={field.onChange}
            placeholder="2026-06-20"
            autoCapitalize="none"
            error={errors.date?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="location"
        render={({ field }) => (
          <Field label="Location (optional)" value={field.value} onChangeText={field.onChange} />
        )}
      />

      <SectionTitle>Time (for your per-hour profit)</SectionTitle>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="setupMinutes"
            render={({ field }) => (
              <Field label="Setup (min)" keyboardType="number-pad" value={field.value} onChangeText={field.onChange} />
            )}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="sellingMinutes"
            render={({ field }) => (
              <Field label="Selling (min)" keyboardType="number-pad" value={field.value} onChangeText={field.onChange} />
            )}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="teardownMinutes"
            render={({ field }) => (
              <Field label="Teardown (min)" keyboardType="number-pad" value={field.value} onChangeText={field.onChange} />
            )}
          />
        </View>
      </View>

      <Muted style={{ fontSize: font.small, fontWeight: '600', color: colors.text, marginBottom: spacing.sm }}>
        Status
      </Muted>
      <Controller
        control={control}
        name="status"
        render={({ field }) => (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
            {STATUSES.map((s) => (
              <Chip
                key={s}
                label={s[0].toUpperCase() + s.slice(1)}
                selected={field.value === s}
                onPress={() => field.onChange(s)}
              />
            ))}
          </View>
        )}
      />

      <Controller
        control={control}
        name="notes"
        render={({ field }) => (
          <Field label="Notes (optional)" value={field.value} onChangeText={field.onChange} multiline />
        )}
      />

      <Button title={submitLabel} onPress={handleSubmit((v) => onSubmit(formValuesToInput(v)))} />
      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}
