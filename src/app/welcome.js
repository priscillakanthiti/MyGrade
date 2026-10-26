import { Image, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SchoolLogo from '../components/SchoolLogo';
import AppButton from '../components/AppButton';
import styles from '../styles/auth.styles';

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.welcomeScreen}>
      <View style={[styles.hero, { paddingTop: insets.top + 28 }]}>
        <View style={styles.heroLogoWrap}>
          <SchoolLogo size={84} />
        </View>
        <Text style={styles.heroSchool}>Catholic Institute Primary School</Text>
        <Text style={styles.heroTagline}>Learn  |  Grow  |  Build a Better Tomorrow</Text>
      </View>

      <View style={[styles.welcomeBody, { paddingBottom: insets.bottom + 20 }]}>
        <View>
          <Text style={styles.welcomeEyebrow}>Welcome to</Text>
          <Text style={styles.appName}>My Grade App</Text>
        </View>
        <Text style={styles.appSub}>
          Simple, efficient record keeping and reporting for a brighter future in education.
        </Text>

        <View style={styles.imageWrap}>
          <Image
            source={require('../../assets/images/school-building.png')}
            style={styles.building}
            resizeMode="cover"
          />
        </View>

        <View style={styles.welcomeFooter}>
          <AppButton
            title="Get Started"
            icon="arrow-forward"
            iconRight
            onPress={() => router.push('/login')}
          />
        </View>
      </View>
    </View>
  );
}
