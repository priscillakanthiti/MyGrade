import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/components.styles';
import AppButton from './AppButton';
import { colors } from '../theme';

export default function EmptyState({ icon = 'albums-outline', title, children, actionTitle, onAction }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {children ? <Text style={styles.emptyText}>{children}</Text> : null}
      {actionTitle ? (
        <View style={styles.emptyAction}>
          <AppButton title={actionTitle} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
