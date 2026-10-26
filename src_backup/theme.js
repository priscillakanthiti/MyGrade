export const colors = {
  primary: '#1272D3',
  primaryDark: '#0B4F9E',
  primarySoft: '#E6F0FB',
  background: '#F3F6FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFD',
  border: '#E1E8F2',
  borderStrong: '#C9D6E8',
  text: '#0F1B33',
  textSecondary: '#4A5A78',
  muted: '#7083A0',
  placeholder: '#94A3B8',
  success: '#15803D',
  successSoft: '#E3F5EA',
  danger: '#B42318',
  dangerSoft: '#FDECEA',
  warning: '#92580A',
  warningSoft: '#FEF3D7',
  accent: '#6B46C1',
  accentSoft: '#EEE9FB',
  white: '#FFFFFF',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };

export const font = {
  size: { xs: 12, sm: 13, md: 15, lg: 17, xl: 20, xxl: 26, display: 34 },
  weight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
  lineHeight: { sm: 18, md: 22, lg: 24, xl: 28 },
};

export const layout = { maxWidth: 560, screenPadding: 16, controlHeight: 50 };

export const shadow = {
  card: {
    shadowColor: '#0F1B33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  raised: {
    shadowColor: '#0F1B33',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
};

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
  { bg: '#DCEBFB', fg: '#1272D3' },
  { bg: '#DDF3E6', fg: '#15803D' },
  { bg: '#EAE3FA', fg: '#6B46C1' },
  { bg: '#FCE9CF', fg: '#B45309' },
];
