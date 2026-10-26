import { StyleSheet } from 'react-native';
import { colors, spacing, radius, font, shadow } from '../theme';

// Styles for: students.js and subjects.js
export default StyleSheet.create({
  header: { gap: spacing.lg, marginBottom: spacing.sm },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.lg,
    ...shadow.card,
  },
  formTitle: {
    fontSize: font.size.lg,
    lineHeight: font.lineHeight.lg,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  formRow: { flexDirection: 'row', gap: spacing.md },
  grow2: { flex: 2 },
  grow1: { flex: 1 },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  count: { textAlign: 'center', color: colors.muted, fontSize: font.size.sm },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.card,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: font.size.lg, fontWeight: font.weight.bold },
  badge: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  cardTitle: {
    fontSize: font.size.md,
    lineHeight: font.lineHeight.md,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  cardMeta: { fontSize: font.size.sm, color: colors.muted },
  genderChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  genderText: { fontSize: font.size.xs, fontWeight: font.weight.bold, color: colors.primaryDark },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerSoft,
  },
});
