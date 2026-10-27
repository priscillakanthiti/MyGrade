import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// Generic app mark (no school branding). Change the icon name or colours here.
export default function AppLogo({ size = 88, light = false }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: light ? colors.white : colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons
        name="ribbon"
        size={size * 0.52}
        color={light ? colors.primaryDark : colors.white}
      />
    </View>
  );
}
