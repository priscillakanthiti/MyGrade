import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';
import { fmt } from '../utils/stats';

const TONES = {
  improving: { icon: 'trending-up', bg: colors.successSoft, fg: colors.success, label: 'Improving' },
  declining: { icon: 'trending-down', bg: colors.dangerSoft, fg: colors.danger, label: 'Declining' },
  steady: { icon: 'remove', bg: colors.primarySoft, fg: colors.primaryDark, label: 'Steady' },
};

export default function TrendBadge({ trend }) {
  if (!trend) {
    return (
      <Text style={{ fontSize: font.size.sm, color: colors.muted, textAlign: 'center' }}>
        Marks from at least two terms are needed to show a trend.
      </Text>
    );
  }
  const t = TONES[trend.direction];
  const sign = trend.change > 0 ? '+' : '';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: t.bg,
        borderRadius: radius.md,
        padding: spacing.md,
      }}
    >
      <Ionicons name={t.icon} size={28} color={t.fg} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: font.size.md, fontWeight: font.weight.bold, color: t.fg }}>{t.label}</Text>
        <Text style={{ fontSize: font.size.sm, lineHeight: font.lineHeight.sm, color: colors.textSecondary }}>
          {trend.prev.label} to {trend.last.label}: {sign}{fmt(trend.change)} percentage points
          {trend.count > 2 ? ` (${trend.overall > 0 ? '+' : ''}${fmt(trend.overall)} since ${trend.first.label})` : ''}
        </Text>
      </View>
    </View>
  );
}
