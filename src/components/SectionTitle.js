import { Text, View } from 'react-native';
import styles from '../styles/components.styles';

export default function SectionTitle({ title, meta }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}
    </View>
  );
}
