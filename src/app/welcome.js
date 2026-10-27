import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppLogo from '../components/AppLogo';
import styles from '../styles/welcome.styles';
import { colors } from '../theme';

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.center}>
        <AppLogo size={96} light />
        <Text style={styles.title}>My Grade App</Text>
        <View style={styles.divider} />
        <Text style={styles.statement}>
          Easily record and calculate student results - all in one place.
        </Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.primaryDark} />
        </Pressable>
      </View>
    </View>
  );
}
