import { NativeModules, Platform } from 'react-native';
import { geminiMarkResult } from './geminiResult';

// Only accept an isolated number or an explicit total label. Never strip signs,
// repair digits, choose among question scores, or infer a total from other text.
export function localMarkResult(text, maxScore) {
  const raw = String(text || '').trim()
    .replace(/^(?:page\s+)?total(?:\s*[:=]\s*|\s+)/i, '').trim();
  const match = raw.replace(',', '.').match(/^(\d+(?:\.\d+)?|\.\d+)(?:\s*\/\s*(\d+(?:\.\d+)?|\.\d+))?$/);
  if (!match) return { ok: false };
  return geminiMarkResult({ status: 'read', raw, value: Number(match[1]) }, maxScore);
}

export async function readOnDevice(uri, maxScore) {
  if (Platform.OS === 'web' || !NativeModules.TextRecognition) return { ok: false };
  try {
    // Lazy loading keeps Expo Go working when the native reader is not installed.
    const reader = require('@react-native-ml-kit/text-recognition').default;
    const result = await reader.recognize(uri);
    return localMarkResult(result.text, maxScore);
  } catch {
    return { ok: false };
  }
}
