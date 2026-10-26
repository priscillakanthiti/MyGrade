import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/components.styles';
import { colors } from '../theme';

export default function AppInput({ label, icon, right, error, containerStyle, ...rest }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.inputGroup, containerStyle]}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <View style={[styles.inputField, focused && styles.inputFocused, error && styles.inputError]}>
        {icon ? (
          <Ionicons name={icon} size={20} color={focused ? colors.primary : colors.muted} />
        ) : null}
        <TextInput
          style={styles.inputText}
          placeholderTextColor={colors.placeholder}
          {...rest}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {right}
      </View>
      {error ? <Text style={styles.inputErrorText}>{error}</Text> : null}
    </View>
  );
}
