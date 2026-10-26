// ============================================================================
// MyGrade design system. Change a value here and the whole app updates.
// ============================================================================

export const colors = {
  // Brand
  primary: '#1D5FBF',
  primaryDark: '#0B2545',
  primarySoft: '#E9F0FB',

  // Surfaces
  background: '#F3F5F9',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F9FC',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',

  // Text
  text: '#0F172A',
  textSecondary: '#475569',
  muted: '#64748B',
  placeholder: '#94A3B8',
  headerMuted: '#A9BCD6',

  // Status
  success: '#157347',
  successSoft: '#E6F4EC',
  danger: '#B42318',
  dangerSoft: '#FDECEA',
  warning: '#8A5A00',
  warningSoft: '#FEF4DC',

  // Secondary accent
  accent: '#0E7490',
  accentSoft: '#E0F2F7',

  white: '#FFFFFF',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };

export const font = {
  size: { xs: 12, sm: 13, md: 15, lg: 17, xl: 20, xxl: 26, display: 32 },
  weight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
  lineHeight: { xs: 16, sm: 19, md: 22, lg: 25, xl: 28, xxl: 34, display: 40 },
};

export const layout = { maxWidth: 560, screenPadding: 20, controlHeight: 52 };

export const shadow = {
  card: {
    shadowColor: '#0B2545',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  raised: {
    shadowColor: '#0B2545',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6,
  },
};

// Kept so any older code that imports "theme" still works
export const theme = {
  primary: colors.primary,
  header: colors.primaryDark,
  bg: colors.background,
  card: colors.surface,
  text: colors.text,
  muted: colors.muted,
  border: colors.border,
  green: colors.successSoft,
  greenDark: colors.success,
  purple: colors.accentSoft,
  purpleDark: colors.accent,
  danger: colors.danger,
};

export const badgeColors = [
  { bg: '#E3EDFB', fg: '#1D5FBF' },
  { bg: '#E3F3EA', fg: '#157347' },
  { bg: '#DFF1F6', fg: '#0E7490' },
  { bg: '#FBEFD9', fg: '#9A5B0B' },
];
