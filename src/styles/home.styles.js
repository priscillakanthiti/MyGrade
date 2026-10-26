import { StyleSheet } from 'react-native';
import { colors, spacing, radius, font, shadow } from '../theme';

// Styles for: (tabs)/index.js
export default StyleSheet.create({
  greetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  greetTexts: { flex: 1, gap: 2 },
  greetSmall: {
    fontSize: font.size.sm,
    color: colors.muted,
    fontWeight: font.weight.semibold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  greetName: {
    fontSize: font.size.xxl,
    lineHeight: font.lineHeight.xxl,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  greetSchool: { fontSize: font.size.sm, lineHeight: font.lineHeight.sm, color: colors.textSecondary },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },

  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadow.card,
  },
  statsRow: { flexDirection: 'row', gap: spacing.md },

  actionRow: {
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
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTexts: { flex: 1, gap: 2 },
  actionTitle: {
    fontSize: font.size.lg,
    lineHeight: font.lineHeight.lg,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  actionSub: { fontSize: font.size.sm, lineHeight: font.lineHeight.sm, color: colors.muted },
  pressed: { opacity: 0.85 },
  footer: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: font.size.xs,
    letterSpacing: 0.4,
    marginTop: spacing.sm,
  },
});
