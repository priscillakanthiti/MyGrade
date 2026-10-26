import { ScrollView, View } from 'react-native';
import styles from '../styles/components.styles';

export default function Page({ children, scroll = true, center = false, contentStyle }) {
  if (!scroll) {
    return (
      <View style={styles.pageFixed}>
        <View style={[styles.pageInner, styles.pageInnerFill, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.pageScroll}
      contentContainerStyle={[styles.pageScrollContent, center && styles.pageScrollCentered]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.pageInner, contentStyle]}>{children}</View>
    </ScrollView>
  );
}
