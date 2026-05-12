import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useEffect } from "react";
import { useAppTheme } from "@/lib/theme";

type Props = {
  onFinish: () => void;
};

export default function AnimatedSplash({ onFinish }: Props) {
  const theme = useAppTheme();
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withTiming(1.1, { duration: 900 });
    opacity.value = withTiming(0, { duration: 600 }, (finished) => {
      if (finished) {
        runOnJS(onFinish)();
      }
    });
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Animated.Image
        source={require("../assets/images/icon.png")}
        style={[styles.logo, style]}
      />
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
