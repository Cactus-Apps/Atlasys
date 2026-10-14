import React, { useCallback, useEffect } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import {
  Camera,
  CommonResolutions,
  useCameraDevice,
  useCameraPermission,
  useFrameOutput,
  type Frame,
} from "react-native-vision-camera";
import { useSharedValue } from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import { decodeQrFromLuma, type ScanRegion } from "@/lib/qr/decode";

/**
 * Camera preview that reads QR codes.
 *
 * Replaces `expo-camera`'s `CameraView` + `onBarcodeScanned`. `expo-camera`
 * pulls `com.google.android.gms:play-services-code-scanner` and MLKit into the
 * Android build, so this build decodes the luminance plane with ZXing instead.
 *
 * Decoding happens on the frame worklet; only a hit crosses back to the JS
 * thread. Bookkeeping that both runtimes must agree on lives in reanimated
 * shared values, because refs are copied into the worklet runtime rather than
 * shared with it.
 */

/** ZXing is far too slow to run on every frame; ~8 attempts a second is plenty. */
const DECODE_INTERVAL_MS = 120;

const FULL_FRAME: ScanRegion = { x: 0, y: 0, width: 1, height: 1 };

type Props = {
  /** Keep the camera running and feed frames to the decoder. */
  active: boolean;
  /**
   * Blocks decoding until it flips back to `false`. A caller that stays on the
   * scan screen after a hit (e.g. while it applies an invite) sets this, then
   * clears it to allow the next attempt.
   */
  blocked: boolean;
  /** Fired once per accepted scan. */
  onScanned: (value: string) => void;
  /** Restrict decoding to part of the frame, as 0..1 fractions. */
  scanRegion?: ScanRegion;
  /** Shown instead of the camera while camera permission is missing. */
  renderPermissionPrompt: () => React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function QrScanner({
  active,
  blocked,
  onScanned,
  scanRegion,
  renderPermissionPrompt,
  style,
}: Props) {
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();

  // Worklet-owned state: never read or written on the JS thread, which is what
  // keeps the React Compiler's immutability rule out of this file.
  const wasBlocked = useSharedValue(blocked);
  const delivered = useSharedValue(false);
  const lastDecodeAt = useSharedValue(0);

  useEffect(() => {
    if (!active || hasPermission) return;
    void requestPermission();
  }, [active, hasPermission, requestPermission]);

  const deliverValue = useCallback(
    (value: string) => {
      onScanned(value);
    },
    [onScanned],
  );

  const onFrame = useCallback(
    (frame: Frame) => {
      "worklet";
      try {
        if (blocked) return;

        // The caller just re-armed us: forget the previous hit and throttle.
        if (wasBlocked.value) {
          // eslint-disable-next-line react-hooks/immutability
          wasBlocked.value = false;
          // eslint-disable-next-line react-hooks/immutability
          delivered.value = false;
          // eslint-disable-next-line react-hooks/immutability
          lastDecodeAt.value = 0;
        }
        if (delivered.value) return;

        const now = Date.now();
        if (now - lastDecodeAt.value < DECODE_INTERVAL_MS) return;
        lastDecodeAt.value = now;

        const planes = frame.getPlanes();
        if (planes.length === 0) return;
        const luma = planes[0];

        const value = decodeQrFromLuma(
          luma.getPixelBuffer(),
          frame.width,
          frame.height,
          luma.bytesPerRow,
          scanRegion ?? FULL_FRAME,
        );

        if (value != null) {
          delivered.value = true;
          runOnJS(deliverValue)(value);
        }
      } catch {
        // A dropped or torn-down frame is normal; never let it reach the
        // worklet error handler.
      }
    },
    [blocked, deliverValue, delivered, lastDecodeAt, scanRegion, wasBlocked],
  );

  const frameOutput = useFrameOutput({
    targetResolution: CommonResolutions.VGA_4_3,
    pixelFormat: "yuv",
    dropFramesWhileBusy: true,
    onFrame,
  });

  if (!hasPermission) {
    return (
      <View style={[styles.container, style]}>{renderPermissionPrompt()}</View>
    );
  }

  if (device == null) {
    return <View style={[styles.container, style]} />;
  }

  return (
    <View style={[styles.container, style]}>
      <Camera
        device={device}
        isActive={active}
        outputs={[frameOutput]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
});