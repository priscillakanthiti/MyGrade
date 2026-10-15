import { Image } from 'react-native';

export default function SchoolLogo({ size = 100 }) {
  return (
    <Image
      source={require('../../assets/images/school-logo.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}