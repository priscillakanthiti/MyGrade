import { StyleSheet } from 'react-native';
import { colors, spacing, radius, font, shadow } from '../theme';

// Styles for: register-class.js, new-term.js, account-security.js
export default StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.lg,
    ...shadow.card,
  },
  cardTitle: {
    fontSize: font.size.xl,
    lineHeight: font.lineHeight.xl,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  cardSub: { fontSize: font.size.md, lineHeight: font.lineHeight.md, color: colors.muted },
  heading: { alignItems: 'center', gap: 4 },
  headingTitle: {
    fontSize: font.size.xxl,
    lineHeight: font.lineHeight.xxl,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  headingSub: { fontSize: font.size.md, color: colors.muted, textAlign: 'center' },
  twoCols: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1 },
});
