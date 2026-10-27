import { Text, View } from 'react-native';
import styles, { CHART_HEIGHT } from '../styles/stats.styles';
import { colors } from '../theme';
import { fmt } from '../utils/stats';

// Grouped bar chart: one group per term, student bar next to the class average bar.
// points: [{ label, pct, classAverage, rank, classSize }]
export default function ProgressChart({ points, studentLabel = 'Student' }) {
  function height(v) {
    if (v === null || v === undefined) return 0;
    return Math.max(4, (Math.min(v, 100) / 100) * CHART_HEIGHT);
  }

  return (
    <View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>{studentLabel}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.borderStrong }]} />
          <Text style={styles.legendText}>Class average</Text>
        </View>
      </View>

      <View style={styles.chart}>
        {points.map((p) => (
          <View key={p.termId} style={styles.group}>
            <View style={styles.barsArea}>
              <View style={styles.barCol}>
                <Text style={styles.barValue}>{p.pct === null ? '-' : `${fmt(p.pct, 0)}%`}</Text>
                <View style={[styles.bar, { height: height(p.pct), backgroundColor: colors.primary }]} />
              </View>
              <View style={styles.barCol}>
                <Text style={styles.barValue}>
                  {p.classAverage === null ? '-' : `${fmt(p.classAverage, 0)}%`}
                </Text>
                <View
                  style={[styles.bar, { height: height(p.classAverage), backgroundColor: colors.borderStrong }]}
                />
              </View>
            </View>
            <Text style={styles.groupLabel} numberOfLines={1}>{p.label}</Text>
            {p.rank !== null ? (
              <Text style={styles.groupRank}>Position {p.rank}/{p.classSize}</Text>
            ) : (
              <Text style={styles.groupRank}>No marks</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
