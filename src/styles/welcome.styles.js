import { StyleSheet } from 'react-native';
import { colors, spacing, radius, font, shadow } from '../theme';

// Styles for: welcome.js. Change colours, sizes and spacing here.
export default StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.xl,
  },
  center: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.white,
    fontSize: 44,
    lineHeight: 52,
    fontWeight: font.weight.bold,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: spacing.xl,
  },
  divider: {
    width: 56,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#5B9BFF',
    marginVertical: spacing.xl,
  },
  statement: {
    color: colors.headerMuted,
    fontSize: font.size.lg,
    lineHeight: 26,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  footer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  button: {
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadow.raised,
  },
  buttonText: {
    color: colors.primaryDark,
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    letterSpacing: 0.3,
  },
  pressed: { opacity: 0.88 },
});
