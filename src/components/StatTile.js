import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles, { statTones } from '../styles/components.styles';

// Pass onPress to make the tile tappable (shows a small arrow).
export default function StatTile({ value, label, tone = 'neutral', valueStyle, style, onPress }) {
  const t = statTones[tone] || statTones.neutral;
  const base = [styles.statTile, { backgroundColor: t.backgroundColor }, style];

  const content = (
    <>
      <Text
        style={[styles.statValue, { color: t.color }, valueStyle]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
      {onPress ? <Ionicons name="chevron-forward" size={14} color={t.color} /> : null}
    </>
  );

  if (!onPress) return <View style={base}>{content}</View>;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [...base, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}
