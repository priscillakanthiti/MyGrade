import { StyleSheet } from 'react-native';
import { colors, spacing, radius, font, shadow } from '../theme';

// Styles for: (tabs)/classes.js and (tabs)/results-tab.js
export default StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    ...shadow.card,
  },
  pressed: { opacity: 0.85 },
  badge: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: font.size.lg, fontWeight: font.weight.bold, letterSpacing: 0.3 },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: {
    fontSize: font.size.lg,
    lineHeight: font.lineHeight.lg,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  cardMeta: { fontSize: font.size.sm, lineHeight: font.lineHeight.sm, color: colors.muted },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  countText: {
    fontSize: font.size.sm,
    color: colors.textSecondary,
    fontWeight: font.weight.semibold,
  },
});
