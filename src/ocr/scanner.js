import * as ImagePicker from 'expo-image-picker';
import { readWithGemini } from './gemini';
import { geminiMarkResult } from './geminiResult';
import { prepareMarkImage } from './image';

// Capture first so several pages can be collected before reading their marks.
export async function captureMarkPage(source) {
  try {
    const options = {
      mediaTypes: ['images'],
      // Normalize orientation and crop in our editor instead of the Android
      // camera/crop activity, whose output can rotate on some devices.
      allowsEditing: false,
      quality: 0.85,
      base64: false,
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
    if (picked.canceled || !picked.assets?.[0]) return { cancelled: true };
    return { asset: picked.assets[0] };
  } catch {
    return { error: 'The photo could not be taken or selected. Please try again.' };
  }
}

// Keep the photo even if reading fails, so its mark can be entered manually.
export async function readMarkPage(asset, maxScore) {
  const uri = asset.uri;
  let prepared;
  try {
    prepared = await prepareMarkImage(asset);
    // Plain text OCR cannot verify whether loops belong to the handwriting,
    // an enclosing circle, or the paper ruling. Read the actual image instead.
    const cloud = await readWithGemini(await prepared.encode(), {
      mimeType: 'image/jpeg',
      maxScore,
    });
    if (cloud.unavailable) {
      return {
        uri,
        marks: [],
        via: null,
        scannerNote: cloud.message,
      };
    }

    const result = geminiMarkResult(cloud.mark, maxScore);
    if (!result.ok) {
      return { uri, marks: [], via: 'gemini', problem: { code: result.code, message: result.message } };
    }

    return {
      uri,
      via: 'gemini',
      note: result.note,
      marks: [{ value: result.value, flagged: result.flagged, raw: result.raw }],
    };
  } catch (e) {
    return { uri, marks: [], scannerNote: 'The page could not be read. Type its mark or take another photo.' };
  } finally {
    prepared?.release();
  }
}

// Single-page helper for callers that want to capture and read immediately.
export async function scanMarks({ source, maxScore }) {
  const captured = await captureMarkPage(source);
  if (!captured.asset) return captured;
  return readMarkPage(captured.asset, maxScore);
}
