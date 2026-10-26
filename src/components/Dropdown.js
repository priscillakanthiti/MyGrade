import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/components.styles';
import { colors } from '../theme';

export default function Dropdown({ label, icon, value, options, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.inputGroup}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <Pressable
        style={[styles.inputField, styles.dropdownField, open && styles.inputFocused]}
        onPress={() => setOpen(!open)}
      >
        {icon ? <Ionicons name={icon} size={20} color={colors.muted} /> : null}
        <Text style={[styles.dropdownText, !selected && styles.dropdownPlaceholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </Pressable>
      {open ? (
        <View style={styles.dropdownMenu}>
          {options.map((o, i) => {
            const active = o.value === value;
            return (
              <Pressable
                key={String(o.value)}
                style={[
                  styles.dropdownItem,
                  i === options.length - 1 && styles.dropdownItemLast,
                  active && styles.dropdownItemActive,
                ]}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}>
                  {o.label}
                </Text>
                {active ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
