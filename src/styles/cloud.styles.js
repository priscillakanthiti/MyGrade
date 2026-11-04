import { StyleSheet } from 'react-native';
import { colors, spacing, radius, font, shadow } from '../theme';

// Styles for: cloud-backup.js and restore.js
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
  title: {
    fontSize: font.size.xl,
    lineHeight: font.lineHeight.xl,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  sub: { fontSize: font.size.md, lineHeight: font.lineHeight.md, color: colors.muted },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successSoft,
  },
  statusBody: { flex: 1, gap: 2 },
  statusTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  statusLine: { fontSize: font.size.sm, color: colors.muted },
  summaryRow: { flexDirection: 'row', gap: spacing.md },
});
