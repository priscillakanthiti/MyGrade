import { ActivityIndicator, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles, { buttonVariants } from '../styles/components.styles';

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  iconRight = false,
  loading = false,
  disabled = false,
  size = 'md',
  style,
}) {
  const v = buttonVariants[variant] || buttonVariants.primary;
  const inactive = disabled || loading;
  const small = size === 'sm';
  const iconNode = icon ? <Ionicons name={icon} size={small ? 16 : 20} color={v.textColor} /> : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        v.container,
        pressed && styles.pressed,
        inactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.textColor} />
      ) : (
        <>
          {!iconRight ? iconNode : null}
          <Text style={[styles.buttonText, small && styles.buttonTextSmall, { color: v.textColor }]}>
            {title}
          </Text>
          {iconRight ? iconNode : null}
        </>
      )}
    </Pressable>
  );
}
