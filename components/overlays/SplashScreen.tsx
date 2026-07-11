import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useEffect } from "react";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";

const vectorLight = require("@/assets/images/icons/Vector-light.png");
const vectorDark = require("@/assets/images/icons/Vector-dark.png");

export default function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const theme = useAppTheme();
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.92);
  const titleOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    logoScale.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    titleOpacity.value = withDelay(
      280,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
    taglineOpacity.value = withDelay(
      450,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
    const timer = setTimeout(() => {
      runOnJS(onFinish)();
    }, 2200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFinish]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const img = theme.isDark ? vectorLight : vectorDark;

  return (
    <View style={[styles.container, { backgroundColor: theme.startbg }]}>
      <Animated.Image source={img} style={[styles.logo, logoStyle]} />
      <Animated.View style={[titleStyle, styles.textWrapper]}>
        <Text style={[styles.title, { color: theme.startPrimary }]}>
          Atlasys
        </Text>
      </Animated.View>
      <Animated.View style={[taglineStyle, styles.textWrapper]}>
        <Text style={[styles.tagline, { color: theme.subTextColor }]}>
          Maps without tracking
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    gap: 12,
  },
  logo: {
    width: 88,
    height: 88,
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
  },
  textWrapper: {
    alignItems: "center",
  },
  tagline: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
});
