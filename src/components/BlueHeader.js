import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';

export default function BlueHeader({ title, right }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 14 }]}>
      <Text style={styles.title}>{title}</Text>
      {right ? (
        <Pressable onPress={right.onPress} hitSlop={12}>
          <Ionicons name={right.icon} size={28} color="#fff" />
        </Pressable>
      ) : (
        <View style={{ width: 28 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: theme.header,
    paddingHorizontal: 18,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
});