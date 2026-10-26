import { Text, View } from 'react-native';
import styles from '../styles/components.styles';
import { GRADE_SCALE } from '../utils/grading';

export default function GradeKey() {
  return (
    <View style={styles.gradeKey}>
      <Text style={styles.gradeKeyTitle}>Grade key</Text>
      {GRADE_SCALE.map((g) => (
        <View key={g.value} style={styles.gradeKeyRow}>
          <View style={styles.gradeDot}>
            <Text style={styles.gradeDotText}>{g.value}</Text>
          </View>
          <Text style={styles.gradeKeyLabel}>{g.label}</Text>
          <Text style={styles.gradeKeyRange}>{g.range}</Text>
        </View>
      ))}
    </View>
  );
}
