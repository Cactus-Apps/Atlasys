import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useEffect, useState } from "react";
import { useAppTheme } from "@/lib/theme";
import { useAuthStore } from "@/lib/storage/zustand";

const vectorLight = require("@/assets/images/icons/Vector-light.png");
const vectorDark = require("@/assets/images/icons/Vector-dark.png");

export default function AnimatedSplash({ onFinish }: any) {
  const theme = useAppTheme();
  const themeZustand = useAuthStore((s) => s.settings.theme);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withTiming(1.5, { duration: 1000 }, (finished) => {
      if (!finished) return;
      scale.value = withTiming(0.5, { duration: 1000 }, (finished2) => {
        if (!finished2) return;
        opacity.value = withTiming(1.5, { duration: 600 }, (finished3) => {
          if (finished3) {
            runOnJS(onFinish);
          }
        });
      });
    });
    return () => {
      scale.value = 1;
      opacity.value = 0;
    };
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const styleText = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: opacity.value }],
  }));

  const img = ["chill", "dark", "midnight", "ocean"].includes(themeZustand)
    ? vectorLight
    : ["forest", "light", "modern"].includes(themeZustand)
      ? vectorDark
      : vectorLight;

  return (
    <View style={[styles.container, { backgroundColor: theme.startbg }]}>
      <Animated.Image source={img} style={[styles.logo, style]} />
      <Animated.Text
        style={[
          { fontSize: 27, fontWeight: "bold", color: theme.startPrimary },
          styleText,
        ]}
      >
        Atlasys
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  logo: {
    width: 120,
    height: 120,
  },
});
