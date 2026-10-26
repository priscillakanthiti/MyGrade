import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SchoolLogo from '../components/SchoolLogo';
import { theme } from '../theme';

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <View style={styles.top}>
        <SchoolLogo size={84} />
        <Text style={styles.school}>Catholic Institute Primary School</Text>
        <Text style={styles.tagline}>Learn  •  Grow  •  Build a Better Tomorrow</Text>

        <Text style={styles.welcomeSmall}>Welcome to the</Text>
        <Text style={styles.appName}>My Grade App</Text>
        <Text style={styles.sub}>Simple. Efficient. For a brighter future in education.</Text>
      </View>

      <View style={styles.imageWrap}>
        <Image
          source={require('../../assets/images/school-building.png')}
          style={styles.building}
          resizeMode="cover"
        />
      </View>

      <Pressable style={styles.button} onPress={() => router.push('/login')}>
        <Text style={styles.buttonText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 14,
  },
  top: { alignItems: 'center', gap: 2 },
  school: { fontSize: 20, fontWeight: 'bold', color: theme.text, textAlign: 'center', marginTop: 4 },
  tagline: { color: theme.muted, fontStyle: 'italic', textAlign: 'center', fontSize: 12 },
  welcomeSmall: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginTop: 14 },
  appName: { fontSize: 34, fontWeight: 'bold', color: theme.header },
  sub: { color: theme.muted, textAlign: 'center', fontSize: 14, marginTop: 4, maxWidth: 300 },
  imageWrap: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    minHeight: 80,
    borderRadius: 18,
    overflow: 'hidden',
  },
  building: { width: '100%', height: '100%' },
  button: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: theme.primary,
    padding: 15,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});