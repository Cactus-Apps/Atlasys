import React, { useCallback } from "react";
import { Dimensions, View, StyleSheet } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { useAppTheme } from "@/lib/theme";

export const SCREEN_HEIGHT = Dimensions.get("window").height;
const DIVIDER_HEIGHT = 28;
const HANDLE_HEIGHT = 4;

export const MIN_TOP = 0.15;
export const MAX_TOP = 0.85;

interface Props {
  children: React.ReactNode;
  splitPosition: SharedValue<number>;
}

export default function BottomPanel({ children, splitPosition }: Props) {
  const theme = useAppTheme();
  const offset = useSharedValue(0.5);

  const SNAP_POINTS = [MIN_TOP, 0.35, 0.5, 0.6, MAX_TOP];

  const snap = useCallback((toValue: number) => {
    "worklet";
    splitPosition.value = withSpring(toValue, {
      damping: 110,
      mass: 4,
      stiffness: 900,
      overshootClamping: true,
    });
  }, []);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      offset.value = splitPosition.value;
    })
    .onUpdate((e) => {
      const delta = e.translationY / SCREEN_HEIGHT;
      splitPosition.value = Math.max(
        MIN_TOP,
        Math.min(MAX_TOP, offset.value + delta),
      );
    })
    .onEnd((e) => {
      const target = Math.max(
        MIN_TOP,
        Math.min(MAX_TOP, splitPosition.value + e.velocityY / SCREEN_HEIGHT),
      );
      const nearest = SNAP_POINTS.reduce((prev, curr) =>
        Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev,
      );
      snap(nearest);
    });

  const panelStyle = useAnimatedStyle(() => ({
    top: splitPosition.value * SCREEN_HEIGHT,
  }));

  const s = getStyles(theme);

  return (
    <Animated.View
      style={[s.panel, { backgroundColor: theme.bg }, panelStyle]}
    >
      <GestureDetector gesture={panGesture}>
        <View style={s.dragZone}>
          <View style={s.handleTrack}>
            <View
              style={[s.handleBar, { backgroundColor: theme.subTextColor }]}
            />
          </View>
        </View>
      </GestureDetector>
      <View style={s.content}>{children}</View>
    </Animated.View>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    dragZone: {
      height: DIVIDER_HEIGHT,
      justifyContent: "center",
      alignItems: "center",
    },
    handleTrack: {
      width: 48,
      height: HANDLE_HEIGHT + 8,
      justifyContent: "center",
      alignItems: "center",
    },
    handleBar: {
      width: 40,
      height: HANDLE_HEIGHT,
      borderRadius: HANDLE_HEIGHT / 2,
    },
    panel: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      boxShadow: "0 0 12px rgba(0,0,0,0.15)",
      elevation: 12,
      overflow: "hidden",
    },
    content: {
      flex: 1,
    },
  });
