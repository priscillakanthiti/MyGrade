import { StyleSheet } from 'react-native';
import { colors, spacing, radius, font, layout, shadow } from '../theme';

export const buttonVariants = {
  primary: { container: { backgroundColor: colors.primary }, textColor: colors.white },
  secondary: {
    container: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary },
    textColor: colors.primary,
  },
  soft: { container: { backgroundColor: colors.primarySoft }, textColor: colors.primaryDark },
  success: { container: { backgroundColor: colors.success }, textColor: colors.white },
  accent: { container: { backgroundColor: colors.accent }, textColor: colors.white },
  danger: { container: { backgroundColor: colors.danger }, textColor: colors.white },
  ghost: { container: { backgroundColor: 'transparent' }, textColor: colors.primary },
};

export const noticeTones = {
  info: { backgroundColor: colors.primarySoft, borderColor: '#C7DCF5', color: colors.primaryDark, icon: 'information-circle-outline' },
  success: { backgroundColor: colors.successSoft, borderColor: '#BFE5CC', color: colors.success, icon: 'checkmark-circle-outline' },
  warning: { backgroundColor: colors.warningSoft, borderColor: '#F5DDA0', color: colors.warning, icon: 'alert-circle-outline' },
  danger: { backgroundColor: colors.dangerSoft, borderColor: '#F5C6C2', color: colors.danger, icon: 'close-circle-outline' },
};

export const statTones = {
  primary: { backgroundColor: colors.primarySoft, color: colors.primaryDark },
  success: { backgroundColor: colors.successSoft, color: colors.success },
  danger: { backgroundColor: colors.dangerSoft, color: colors.danger },
  warning: { backgroundColor: colors.warningSoft, color: colors.warning },
  accent: { backgroundColor: colors.accentSoft, color: colors.accent },
  neutral: { backgroundColor: colors.surface, color: colors.text },
};

export const common = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.xl,
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
  cardTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  muted: { fontSize: font.size.sm, color: colors.muted, lineHeight: font.lineHeight.sm },
  row: { flexDirection: 'row', gap: spacing.md },
});

export default StyleSheet.create({
  pageScroll: { flex: 1, backgroundColor: colors.background },
  pageScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.xl,
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
    fontWeight: font.weight.bold,
  },
  headerSubtitle: {
    color: '#C9DCF2',
    fontSize: font.size.sm,
    marginTop: 2,
  },
  headerAction: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },

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
    letterSpacing: 0.2,
  },
  buttonTextSmall: { fontSize: font.size.sm },
  pressed: { opacity: 0.85 },
  inactive: { opacity: 0.5 },

  inputGroup: { gap: 6 },
  inputLabel: {
    fontSize: font.size.sm,
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

  dropdownField: { justifyContent: 'space-between' },
  dropdownText: { flex: 1, fontSize: font.size.md, color: colors.text, paddingVertical: spacing.md },
  dropdownPlaceholder: { color: colors.placeholder },
  dropdownMenu: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemLast: { borderBottomWidth: 0 },
  dropdownItemActive: { backgroundColor: colors.primarySoft },
  dropdownItemText: { flex: 1, fontSize: font.size.md, color: colors.text },
  dropdownItemTextActive: { color: colors.primaryDark, fontWeight: font.weight.semibold },

  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  noticeBody: { flex: 1, gap: 2 },
  noticeTitle: { fontSize: font.size.md, fontWeight: font.weight.bold },
  noticeText: { fontSize: font.size.sm, lineHeight: 19 },

  statTile: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: font.size.xxl, fontWeight: font.weight.bold },
  statLabel: {
    fontSize: font.size.sm,
    color: colors.textSecondary,
    fontWeight: font.weight.semibold,
    textAlign: 'center',
  },

  segmented: {
    flexDirection: 'row',
    backgroundColor: '#E6ECF5',
    borderRadius: radius.md,
    padding: 4,
  },
  segItem: {
    flex: 1,
    minHeight: 40,
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
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: {
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    color: colors.textSecondary,
  },
  chipTextActive: { color: colors.white },
});
