import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SECURITY_QUESTIONS } from '../utils/security';
import { theme } from '../theme';

export default function QuestionPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable style={styles.field} onPress={() => setOpen(!open)}>
        <Ionicons name="help-circle-outline" size={22} color={theme.muted} />
        <Text style={[styles.text, !value && { color: '#8A97AB' }]}>
          {value || 'Choose a recovery question'}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={theme.text} />
      </Pressable>
      {open && (
        <View style={styles.options}>
          {SECURITY_QUESTIONS.map((q) => (
            <Pressable
              key={q}
              style={styles.option}
              onPress={() => { onChange(q); setOpen(false); }}
            >
              <Text style={styles.optionText}>{q}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderWidth: 1, borderColor: theme.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
  },
  text: { flex: 1, fontSize: 15, color: theme.text },
  options: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, overflow: 'hidden', marginTop: 6 },
  option: { padding: 13, backgroundColor: '#F7FAFE', borderBottomWidth: 1, borderBottomColor: theme.border },
  optionText: { fontSize: 15, color: theme.text },
});