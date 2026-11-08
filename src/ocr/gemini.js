import { pictureSupabase } from './supabase';
import { createPictureSession } from './session';

const ensurePictureSession = createPictureSession(pictureSupabase);

const messages = {
  unauthorized: 'The picture reader could not authorize this scan. Please try again.',
  not_configured: 'Picture reading has not been set up yet. You can type the mark below.',
  too_large: 'This picture is too large. Crop closer to the mark and try again.',
  unsupported_image: 'Choose a JPEG, PNG, WebP or HEIC picture.',
  rate_limited: 'The picture reader is busy. Please try again shortly, or type the mark.',
  reader_timeout: 'The picture reader took too long. Please try again, or type the mark.',
};

// Gemini's key exists only in the Supabase function. No native OCR is required.
export async function readWithGemini(base64, { mimeType, maxScore }) {
  if (!pictureSupabase) return { unavailable: true, message: messages.not_configured };
  if (!base64) return { unavailable: true, message: 'The picture could not be prepared. Choose another photo or type the mark.' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35000);
  try {
    await ensurePictureSession();
    const { data, error } = await pictureSupabase.functions.invoke('read-mark', {
      body: { image: base64, mimeType, maxScore }, signal: controller.signal,
    });
    if (error) {
      if (controller.signal.aborted) return { unavailable: true, message: messages.reader_timeout };
      let code;
      try { code = (await error.context?.json())?.error; } catch { /* network error */ }
      return { unavailable: true, message: messages[code] || 'The picture reader could not be reached. Check your internet connection and try again, or type the mark.' };
    }
    if (!data?.mark || !['read', 'unclear', 'multiple', 'no_mark'].includes(data.mark.status)) {
      return { unavailable: true, message: 'The picture reader returned an unusable result. Please try again or type the mark.' };
    }
    return { mark: data.mark };
  } catch (error) {
    if (error?.code === 'anonymous_provider_disabled' || /anonymous.*(?:disabled|not allowed)/i.test(error?.message || '')) {
      return { unavailable: true, message: messages.not_configured };
    }
    return { unavailable: true, message: controller.signal.aborted ? messages.reader_timeout : 'Picture reading needs an internet connection. Try again or type the mark.' };
  } finally {
    clearTimeout(timer);
  }
}
