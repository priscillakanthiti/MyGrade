import * as ImagePicker from 'expo-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { extractMarks } from './parseMarks';

// Takes a photo (or picks one) and reads the numbers on it.
// Everything happens on the phone: no internet and no cloud service is used.
//
// source: 'camera' | 'library'
// Returns one of:
//   { cancelled: true }
//   { error: 'message for the teacher' }
//   { marks: [...], ignored: number, rawText: string }
export async function scanMarks({ source, maxScore }) {
  try {
    const options = {
      mediaTypes: ['images'],
      allowsEditing: true, // lets the teacher crop tightly around the marks
      quality: 1,
    };

    let picked;
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        return { error: 'Camera permission was not given. Allow the camera in the phone settings, or choose a photo instead.' };
      }
      picked = await ImagePicker.launchCameraAsync(options);
    } else {
      picked = await ImagePicker.launchImageLibraryAsync(options);
    }
    if (picked.canceled || !picked.assets || !picked.assets[0]) return { cancelled: true };

    let ocr;
    try {
      ocr = await TextRecognition.recognize(picked.assets[0].uri);
    } catch (e) {
      return {
        error: 'The scanner could not run on this phone. Scanning is not available in Expo Go, only in the installed app. You can still type the marks.',
      };
    }

    const { marks, ignored } = extractMarks(ocr, { maxScore });
    return { marks, ignored, rawText: (ocr && ocr.text) || '' };
  } catch (e) {
    return { error: 'Something went wrong while scanning. Please try again, or type the marks.' };
  }
}
