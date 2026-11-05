import * as ImagePicker from 'expo-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { readWithCloud } from './cloudVision';
import { readMark, wordsFromMlKit } from './markReader';

// Takes or picks ONE photo of a page mark and tries to read it.
//
// Order of attempts:
//   1. Google Cloud Vision (only if online and signed in to cloud backup)
//   2. The reader on the phone (ML Kit), which works offline
//   3. If neither can read it, the photo is still returned so the teacher types the mark
//
// Returns one of:
//   { cancelled: true }
//   { error }                                  real failure (camera permission, picker crash)
//   { uri, marks: [{ value, flagged, raw }], note, via }   one mark was read
//   { uri, marks: [], problem: { code, message }, via }    photo reached a reader, but no usable mark
//   { uri, marks: [], scannerNote }            no reader could run, so please type the mark
export async function scanMarks({ source, maxScore }) {
  try {
    const options = {
      mediaTypes: ['images'],
      allowsEditing: true, // lets the teacher crop tightly around the mark
      quality: 0.7,        // keeps the upload small on mobile data
      base64: true,        // needed by the cloud reader
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

    const asset = picked.assets[0];
    const uri = asset.uri;

    // 1. Cloud reader. Silent if it cannot be used.
    let words = null;
    let via = null;
    const cloud = await readWithCloud(asset.base64);
    if (cloud.words) {
      words = cloud.words;
      via = 'cloud';
    }

    // 2. Reader on the phone
    if (!words) {
      try {
        const ocr = await TextRecognition.recognize(uri);
        words = wordsFromMlKit(ocr);
        via = 'phone';
      } catch (e) {
        words = null;
      }
    }

    // 3. No reader could run at all. Not an error: the teacher types the mark.
    if (!words) {
      return {
        uri,
        marks: [],
        via: null,
        scannerNote: 'The automatic reader is not available right now, so please type the mark shown in the photo.',
      };
    }

    const result = readMark(words, { maxScore });
    if (!result.ok) {
      return { uri, marks: [], via, problem: { code: result.code, message: result.message } };
    }

    return {
      uri,
      via,
      note: result.note,
      marks: [{ value: result.value, flagged: result.flagged, raw: result.raw }],
    };
  } catch (e) {
    return { error: 'Something went wrong while scanning. Please try again, or type the marks.' };
  }
}
