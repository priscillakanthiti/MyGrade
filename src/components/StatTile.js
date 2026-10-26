import { Text, View } from 'react-native';
import styles, { statTones } from '../styles/components.styles';

export default function StatTile({ value, label, tone = 'neutral', valueStyle, style }) {
  const t = statTones[tone] || statTones.neutral;

  return (
    <View style={[styles.statTile, { backgroundColor: t.backgroundColor }, style]}>
      <Text
        style={[styles.statValue, { color: t.color }, valueStyle]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
