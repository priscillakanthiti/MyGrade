import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../styles/components.styles';
import { colors, spacing } from '../theme';

export default function BlueHeader({ title, subtitle, right }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.headerBar, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.headerInner}>
        <View style={styles.headerTexts}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
        {right ? (
          <Pressable onPress={right.onPress} hitSlop={10} style={styles.headerAction}>
            <Ionicons name={right.icon} size={22} color={colors.white} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
