import { StyleSheet } from 'react-native';
import { colors, spacing, radius, font, shadow } from '../theme';

// Styles for: class-stats.js
export const CHART_HEIGHT = 150;

export default StyleSheet.create({
  centerMsg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  msg: { textAlign: 'center', fontSize: font.size.md, lineHeight: font.lineHeight.md, color: colors.muted },

  header: { alignItems: 'center', gap: 4 },
  title: {
    fontSize: font.size.xxl,
    lineHeight: font.lineHeight.xxl,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  sub: { fontSize: font.size.sm, color: colors.muted, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: spacing.md },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.card,
  },
  cardTitle: {
    fontSize: font.size.lg,
    lineHeight: font.lineHeight.lg,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  cardSub: { fontSize: font.size.sm, lineHeight: font.lineHeight.sm, color: colors.muted },

  // Boys vs girls
  twoCols: { flexDirection: 'row', gap: spacing.md },
  genderCol: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  genderName: {
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    color: colors.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  bigNumber: {
    fontSize: font.size.xxl,
    lineHeight: font.lineHeight.xxl,
    fontWeight: font.weight.bold,
  },
  smallLine: { fontSize: font.size.sm, color: colors.textSecondary },

  // Progress bars
  barTrack: { height: 8, borderRadius: 4, backgroundColor: '#E6EBF3', overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },

  // Subjects
  subjectHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  subjectName: { flex: 1, fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  tag: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: radius.pill },
  tagText: { fontSize: font.size.xs, fontWeight: font.weight.bold },
  avgRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  avgText: { fontSize: font.size.sm, color: colors.textSecondary },
  avgPct: { fontSize: font.size.xl, fontWeight: font.weight.bold },
  factRow: { flexDirection: 'row', gap: spacing.md },
  fact: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
  },
  factLabel: {
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    color: colors.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  factValue: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  factName: { fontSize: font.size.sm, color: colors.textSecondary },
  genderLine: { fontSize: font.size.sm, color: colors.muted },

  // Progress chart
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md, marginTop: spacing.sm },
  group: { flex: 1, alignItems: 'center', gap: 6 },
  barsArea: {
    height: CHART_HEIGHT + 22,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
    alignSelf: 'stretch',
  },
  barCol: { alignItems: 'center', justifyContent: 'flex-end', width: 30 },
  bar: { width: 26, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  barValue: { fontSize: font.size.xs, fontWeight: font.weight.bold, color: colors.textSecondary, marginBottom: 3 },
  groupLabel: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text, textAlign: 'center' },
  groupRank: { fontSize: font.size.xs, color: colors.muted },
  legend: { flexDirection: 'row', gap: spacing.lg, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: font.size.xs, color: colors.textSecondary },
});
