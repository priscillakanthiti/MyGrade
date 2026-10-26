import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles, { noticeTones } from '../styles/components.styles';

export default function Notice({ tone = 'info', title, children, style }) {
  const t = noticeTones[tone] || noticeTones.info;

  return (
    <View
      style={[styles.notice, { backgroundColor: t.backgroundColor, borderColor: t.borderColor }, style]}
    >
      <Ionicons name={t.icon} size={20} color={t.color} />
      <View style={styles.noticeBody}>
        {title ? <Text style={[styles.noticeTitle, { color: t.color }]}>{title}</Text> : null}
        <Text style={[styles.noticeText, { color: t.color }]}>{children}</Text>
      </View>
    </View>
  );
}
