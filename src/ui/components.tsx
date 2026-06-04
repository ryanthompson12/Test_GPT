/** Reusable presentational components built on React Native core. */
import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { formatMoney } from '@/lib/money';
import { colors, font, radius, spacing } from './theme';

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Muted({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

/** Money formatted from integer cents, optionally tinted by sign. */
export function MoneyText({
  cents,
  signed = false,
  size = font.body,
  weight = '600',
}: {
  cents: number;
  signed?: boolean;
  size?: number;
  weight?: 'normal' | '600' | '700';
}) {
  const color = !signed ? colors.text : cents >= 0 ? colors.positive : colors.negative;
  return (
    <Text style={{ color, fontSize: size, fontWeight: weight }}>{formatMoney(cents)}</Text>
  );
}

export function ProfitBadge({ cents }: { cents: number }) {
  const positive = cents >= 0;
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: positive ? colors.primarySoft : '#FBE4E1' },
      ]}>
      <Text
        style={{
          color: positive ? colors.primaryDark : colors.negative,
          fontWeight: '700',
          fontSize: font.small,
        }}>
        {formatMoney(cents)}
      </Text>
    </View>
  );
}

export function StatTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.statTile}>
      <Muted style={{ fontSize: font.small }}>{label}</Muted>
      <View style={{ marginTop: spacing.xs }}>{children}</View>
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const bg =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.negative : 'transparent';
  const fg = variant === 'secondary' ? colors.primary : '#FFFFFF';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: colors.primary,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}>
      <Text style={{ color: fg, fontWeight: '700', fontSize: font.body }}>{title}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  error,
  ...inputProps
}: { label: string; error?: string } & TextInputProps) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, error ? { borderColor: colors.negative } : null]}
        placeholderTextColor={colors.muted}
        {...inputProps}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        selected ? { backgroundColor: colors.primary, borderColor: colors.primary } : null,
      ]}>
      <Text style={{ color: selected ? '#FFF' : colors.text, fontSize: font.small, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Muted style={{ textAlign: 'center', marginTop: spacing.sm }}>{subtitle}</Muted> : null}
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: font.h3,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  muted: { color: colors.muted, fontSize: font.body },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  statTile: {
    flex: 1,
    minWidth: 140,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: font.small,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: font.body,
    color: colors.text,
    backgroundColor: colors.card,
  },
  errorText: { color: colors.negative, fontSize: font.small, marginTop: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  empty: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: font.h3, fontWeight: '700', color: colors.text, textAlign: 'center' },
});
