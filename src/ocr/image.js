import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

// Resize only the cropped mark, preserving aspect ratio and small decimal dots.
// Encode for upload only if the on-device reader needs a cloud fallback.
export async function prepareMarkImage(asset) {
  const context = ImageManipulator.manipulate(asset.uri);
  let image;
  try {
    const longest = Math.max(asset.width || 0, asset.height || 0);
    if (longest > 1280) {
      context.resize(asset.width >= asset.height ? { width: 1280 } : { height: 1280 });
    }
    image = await context.renderAsync();
    const options = { format: SaveFormat.JPEG, compress: 0.85 };
    const prepared = await image.saveAsync(options);
    return {
      uri: prepared.uri,
      encode: async () => Platform.OS === 'web'
        ? (await image.saveAsync({ ...options, base64: true })).base64
        : new File(prepared.uri).base64(),
      release: () => { image.release(); context.release(); },
    };
  } catch (error) {
    image?.release();
    context.release();
    throw error;
  }
}
