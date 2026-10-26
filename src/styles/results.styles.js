import { StyleSheet } from 'react-native';
import { colors, spacing, radius, font, shadow } from '../theme';

// Styles for: results.js and student-report.js
export default StyleSheet.create({
  centerMsg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  msg: { textAlign: 'center', fontSize: font.size.md, lineHeight: font.lineHeight.md, color: colors.muted },

  // Summary header card
  header: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: 4,
    ...shadow.card,
  },
  title: {
    fontSize: font.size.xxl,
    lineHeight: font.lineHeight.xxl,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  sub: { fontSize: font.size.sm, lineHeight: font.lineHeight.sm, color: colors.muted, textAlign: 'center' },
  termTag: {
    marginTop: spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  termTagText: { fontSize: font.size.xs, fontWeight: font.weight.bold, letterSpacing: 0.4 },
  metaRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaItem: { flex: 1, alignItems: 'center', gap: 2 },
  metaValue: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  metaLabel: {
    fontSize: font.size.xs,
    color: colors.muted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  statsRow: { flexDirection: 'row', gap: spacing.md },
  hint: { textAlign: 'center', color: colors.muted, fontSize: font.size.sm },

  // Student report header
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  avatarText: { color: colors.white, fontSize: 30, fontWeight: font.weight.bold },
  statValueSmall: { fontSize: font.size.lg },

  // Tables
  table: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  headRow: { backgroundColor: colors.primaryDark, borderBottomWidth: 0 },
  altRow: { backgroundColor: colors.surfaceAlt },
  totalRow: { backgroundColor: colors.primarySoft, borderBottomWidth: 0 },
  cell: {
    paddingVertical: 13,
    paddingHorizontal: 6,
    textAlign: 'center',
    color: colors.text,
    fontSize: font.size.sm,
    lineHeight: font.lineHeight.sm,
  },
  headText: {
    color: colors.white,
    fontWeight: font.weight.bold,
    fontSize: font.size.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pos: { width: 44 },
  nameCol: { flex: 1, textAlign: 'left' },
  gen: { width: 40 },
  totalCol: { width: 84 },
  resultCol: { width: 92 },
  fullName: { width: 160, textAlign: 'left' },
  markCol: { width: 82 },
  fullTotal: { width: 84 },
  pctCol: { width: 62 },
  gradeCol: { width: 58 },
  fullResult: { width: 94 },
  bold: { fontWeight: font.weight.bold },
  missing: { color: colors.danger },

  // Student report table
  subjectCol: { flex: 1, textAlign: 'left', paddingLeft: spacing.lg },
  reportMark: { width: 84 },
  reportGrade: { width: 120, paddingRight: spacing.sm },

  note: { textAlign: 'center', color: colors.muted, fontSize: font.size.sm },
  pressed: { opacity: 0.85 },
});
