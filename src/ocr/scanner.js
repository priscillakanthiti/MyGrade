import * as ImagePicker from 'expo-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { extractMarks } from './parseMarks';


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

    const uri = picked.assets[0].uri;

    // The scanner tries to pre-fill the mark. If it cannot (or is not available),
    // the photo is still returned so the teacher can read it and type the mark.
    let ocr = null;
    let scannerNote = '';
    try {
      ocr = await TextRecognition.recognize(uri);
    } catch (e) {
      scannerNote = 'The automatic reader is not available on this phone, so please type the mark shown in the photo.';
    }

    const { marks, ignored } = ocr ? extractMarks(ocr, { maxScore }) : { marks: [], ignored: 0 };
    return { uri, marks, ignored, scannerNote, rawText: (ocr && ocr.text) || '' };
  } catch (e) {
    return { error: 'Something went wrong while scanning. Please try again, or type the marks.' };
  }
}
