import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from './AppButton';
import { editMarkImage } from '../ocr/image';
import { fitPhoto, moveCrop, photoCrop } from '../ocr/cropGeometry';
import { colors } from '../theme';

const fullPhoto = { x: 0, y: 0, width: 1, height: 1 };

export default function MarkPhotoEditor({ asset, onCancel, onConfirm }) {
  const [photo, setPhoto] = useState(asset);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [rect, setRect] = useState(fullPhoto);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const alive = useRef(true);
  const rectRef = useRef(rect);
  rectRef.current = rect;
  const drag = useRef(null);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, [asset.uri]);

  const frame = photo && viewport.width && viewport.height
    ? fitPhoto(photo.width, photo.height, viewport.width, viewport.height) : null;
  function startDrag(event) {
    if (!frame || busy) return;
    const { locationX: x, locationY: y, pageX, pageY } = event.nativeEvent;
    const current = rectRef.current;
    const left = frame.x + current.x * frame.width, top = frame.y + current.y * frame.height;
    const right = left + current.width * frame.width, bottom = top + current.height * frame.height;
    const corners = [['topLeft', left + 18, top + 18], ['topRight', right - 18, top + 18],
      ['bottomLeft', left + 18, bottom - 18], ['bottomRight', right - 18, bottom - 18]];
    const nearest = corners.sort((a, b) => Math.hypot(x - a[1], y - a[2]) - Math.hypot(x - b[1], y - b[2]))[0];
    drag.current = { rect: current, pageX, pageY,
      handle: Math.hypot(x - nearest[1], y - nearest[2]) < 48 ? nearest[0] : 'move' };
  }

  function dragCrop(event) {
    if (!drag.current || !frame || busy) return;
    const { pageX, pageY } = event.nativeEvent;
    setRect(moveCrop(drag.current.rect, (pageX - drag.current.pageX) / frame.width,
      (pageY - drag.current.pageY) / frame.height, drag.current.handle));
  }

  async function rotate(degrees) {
    if (busy || !photo) return;
    setBusy(true); setError('');
    try {
      const next = await editMarkImage(photo, { rotation: degrees });
      if (alive.current) { setPhoto(next); setRect(fullPhoto); }
    } catch {
      if (alive.current) setError('The photo could not be rotated. Please try again.');
    } finally { if (alive.current) setBusy(false); }
  }

  async function confirm() {
    if (busy || !photo) return;
    setBusy(true); setError('');
    try {
      const cropped = await editMarkImage(photo, { crop: photoCrop(rect, photo.width, photo.height) });
      if (alive.current) onConfirm(cropped);
    } catch {
      if (alive.current) setError('The crop could not be saved. Please try again.');
    } finally { if (alive.current) setBusy(false); }
  }

  return (
    <Modal visible animationType="fade" onRequestClose={() => { if (!busy) onCancel(); }}>
      <SafeAreaView style={s.screen}>
        <Text style={s.title}>Crop the page mark</Text>
        <Text style={s.help}>Drag the corner handles around the awarded mark. Include its circle. Rotate only if the writing is sideways.</Text>
        <View testID="mark-crop-preview" style={s.viewport} onLayout={event => setViewport(event.nativeEvent.layout)}>
          {frame ? <>
            <Image pointerEvents="none" source={{ uri: photo.uri }} resizeMode="stretch"
              style={{ position: 'absolute', left: frame.x, top: frame.y, width: frame.width, height: frame.height }} />
            <View collapsable={false} pointerEvents="box-only" style={StyleSheet.absoluteFillObject}
              onStartShouldSetResponderCapture={() => !busy} onStartShouldSetResponder={() => !busy}
              onMoveShouldSetResponder={() => !busy} onResponderGrant={startDrag} onResponderMove={dragCrop}
              onResponderTerminationRequest={() => false}
              onResponderRelease={() => { drag.current = null; }} onResponderTerminate={() => { drag.current = null; }}>
            <View testID="mark-crop-selection" pointerEvents="none" style={[s.crop, {
              left: frame.x + rect.x * frame.width, top: frame.y + rect.y * frame.height,
              width: rect.width * frame.width, height: rect.height * frame.height,
            }]}>
              <View style={[s.handle, s.topLeft]} />
              <View style={[s.handle, s.topRight]} />
              <View style={[s.handle, s.bottomLeft]} />
              <View style={[s.handle, s.bottomRight]} />
            </View>
            </View>
          </> : null}
          {busy ? <View style={s.loading}><ActivityIndicator size="large" color={colors.white} /></View> : null}
        </View>
        {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
        <View style={s.actions}>
          <AppButton title="Rotate left" icon="arrow-undo" variant="soft" size="sm" disabled={busy || !photo} onPress={() => rotate(-90)} style={s.grow} />
          <AppButton title="Rotate right" icon="arrow-redo" variant="soft" size="sm" disabled={busy || !photo} onPress={() => rotate(90)} style={s.grow} />
        </View>
        <View style={s.actions}>
          <AppButton title="Cancel" variant="ghost" onPress={onCancel} disabled={busy} style={s.grow} />
          <AppButton title="Use photo" icon="checkmark" onPress={confirm} disabled={busy || !photo} style={s.grow} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, padding: 20, gap: 14, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  help: { fontSize: 14, lineHeight: 20, color: colors.muted },
  viewport: { flex: 1, margin: 14, backgroundColor: colors.primaryDark },
  crop: { position: 'absolute', borderWidth: 2, borderColor: '#60D8FF' },
  handle: { position: 'absolute', width: 36, height: 36, borderWidth: 3, borderColor: colors.white, backgroundColor: '#1D5FBFCC', borderRadius: 8 },
  topLeft: { left: 0, top: 0 }, topRight: { right: 0, top: 0 },
  bottomLeft: { left: 0, bottom: 0 }, bottomRight: { right: 0, bottom: 0 },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#00000055' },
  actions: { flexDirection: 'row', gap: 12 }, grow: { flex: 1 },
  error: { color: colors.danger, fontSize: 14 },
});
