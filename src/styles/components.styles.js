import { StyleSheet } from 'react-native';
import { colors, spacing, radius, font, layout, shadow } from '../theme';

// ---------- Variants used by the shared components ----------
export const buttonVariants = {
  primary: { container: { backgroundColor: colors.primary }, textColor: colors.white },
  navy: { container: { backgroundColor: colors.primaryDark }, textColor: colors.white },
  secondary: {
    container: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary },
    textColor: colors.primary,
  },
  soft: { container: { backgroundColor: colors.primarySoft }, textColor: colors.primaryDark },
  success: { container: { backgroundColor: colors.success }, textColor: colors.white },
  accent: { container: { backgroundColor: colors.accent }, textColor: colors.white },
  danger: { container: { backgroundColor: colors.danger }, textColor: colors.white },
  dangerOutline: {
    container: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.danger },
    textColor: colors.danger,
  },
  ghost: { container: { backgroundColor: 'transparent' }, textColor: colors.primary },
};

export const noticeTones = {
  info: { backgroundColor: colors.primarySoft, borderColor: '#C9DBF5', color: colors.primaryDark, icon: 'information-circle-outline' },
  success: { backgroundColor: colors.successSoft, borderColor: '#BFE3CE', color: colors.success, icon: 'checkmark-circle-outline' },
  warning: { backgroundColor: colors.warningSoft, borderColor: '#F3DDA2', color: colors.warning, icon: 'alert-circle-outline' },
  danger: { backgroundColor: colors.dangerSoft, borderColor: '#F3C6C1', color: colors.danger, icon: 'close-circle-outline' },
};

export const statTones = {
  primary: { backgroundColor: colors.primarySoft, color: colors.primaryDark },
  success: { backgroundColor: colors.successSoft, color: colors.success },
  danger: { backgroundColor: colors.dangerSoft, color: colors.danger },
  warning: { backgroundColor: colors.warningSoft, color: colors.warning },
  accent: { backgroundColor: colors.accentSoft, color: colors.accent },
  neutral: { backgroundColor: colors.surface, color: colors.text },
};

// Icon box tones (used for action rows, list icons)
export const iconTones = {
  primary: { bg: colors.primarySoft, fg: colors.primary },
  success: { bg: colors.successSoft, fg: colors.success },
  accent: { bg: colors.accentSoft, fg: colors.accent },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
};

// ---------- Common building blocks reused by screen style files ----------
export const common = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  listItem: { width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  rowCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.card,
  },
  cardTitle: {
    fontSize: font.size.lg,
    lineHeight: font.lineHeight.lg,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  muted: { fontSize: font.size.sm, lineHeight: font.lineHeight.sm, color: colors.muted },
  row: { flexDirection: 'row', gap: spacing.md },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: font.size.lg, fontWeight: font.weight.bold },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  tagText: { fontSize: font.size.xs, fontWeight: font.weight.bold, color: colors.primaryDark },
  pressed: { opacity: 0.85 },
});

export default StyleSheet.create({
  // ----- Page -----
  pageScroll: { flex: 1, backgroundColor: colors.background },
  pageScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  pageScrollCentered: { justifyContent: 'center' },
  pageFixed: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.xl,
  },
  pageInner: { width: '100%', maxWidth: layout.maxWidth, gap: spacing.lg },
  pageInnerFill: { flex: 1 },

  // ----- Header -----
  headerBar: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerInner: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerTexts: { flex: 1 },
  headerTitle: {
    color: colors.white,
    fontSize: font.size.xxl,
    lineHeight: font.lineHeight.xxl,
    fontWeight: font.weight.bold,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: colors.headerMuted,
    fontSize: font.size.sm,
    lineHeight: font.lineHeight.sm,
    marginTop: 2,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ----- Button -----
  button: {
    minHeight: layout.controlHeight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonSmall: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  buttonText: {
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
    letterSpacing: 0.3,
  },
  buttonTextSmall: { fontSize: font.size.sm },
  pressed: { opacity: 0.86 },
  inactive: { opacity: 0.5 },

  // ----- Input -----
  inputGroup: { gap: 6 },
  inputLabel: {
    fontSize: font.size.sm,
    lineHeight: font.lineHeight.sm,
    fontWeight: font.weight.semibold,
    color: colors.textSecondary,
  },
  inputField: {
    minHeight: layout.controlHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  inputFocused: { borderColor: colors.primary, borderWidth: 1.5 },
  inputError: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  inputText: {
    flex: 1,
    fontSize: font.size.md,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  inputErrorText: { fontSize: font.size.xs, color: colors.danger },

  // ----- Dropdown -----
  dropdownField: { justifyContent: 'space-between' },
  dropdownText: { flex: 1, fontSize: font.size.md, color: colors.text, paddingVertical: spacing.md },
  dropdownPlaceholder: { color: colors.placeholder },
  dropdownMenu: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginTop: 4,
    ...shadow.card,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemLast: { borderBottomWidth: 0 },
  dropdownItemActive: { backgroundColor: colors.primarySoft },
  dropdownItemText: { flex: 1, fontSize: font.size.md, lineHeight: font.lineHeight.md, color: colors.text },
  dropdownItemTextActive: { color: colors.primaryDark, fontWeight: font.weight.semibold },

  // ----- Notice -----
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  noticeBody: { flex: 1, gap: 2 },
  noticeTitle: { fontSize: font.size.md, fontWeight: font.weight.bold },
  noticeText: { fontSize: font.size.sm, lineHeight: 20 },

  // ----- Stat tile -----
  statTile: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: font.size.xxl,
    lineHeight: font.lineHeight.xxl,
    fontWeight: font.weight.bold,
  },
  statLabel: {
    fontSize: font.size.xs,
    color: colors.textSecondary,
    fontWeight: font.weight.semibold,
    textAlign: 'center',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  // ----- Segmented / chips -----
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#E6EBF3',
    borderRadius: radius.md,
    padding: 4,
  },
  segItem: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  segItemActive: { backgroundColor: colors.surface, ...shadow.card },
  segText: {
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    color: colors.textSecondary,
  },
  segTextActive: { color: colors.primaryDark },
  chipsContent: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  chipActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  chipText: {
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    color: colors.textSecondary,
  },
  chipTextActive: { color: colors.white },

  // ----- Section title -----
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: font.size.lg,
    lineHeight: font.lineHeight.lg,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  sectionMeta: { fontSize: font.size.sm, color: colors.muted },

  // ----- Empty state -----
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: font.size.sm,
    lineHeight: 20,
    color: colors.muted,
    textAlign: 'center',
  },
  emptyAction: { marginTop: spacing.md, alignSelf: 'stretch' },

  // ----- Grade key -----
  gradeKey: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  gradeKeyTitle: {
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    color: colors.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  gradeKeyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  gradeDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeDotText: { fontSize: font.size.sm, fontWeight: font.weight.bold, color: colors.primaryDark },
  gradeKeyLabel: { flex: 1, fontSize: font.size.md, color: colors.text },
  gradeKeyRange: { fontSize: font.size.sm, color: colors.muted, fontWeight: font.weight.semibold },
});
