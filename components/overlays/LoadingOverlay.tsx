import React, { useEffect } from "react";
import { StyleSheet, View, Text, Dimensions } from "react-native";
import { BookOpen } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { useAppTheme } from "@/lib/theme";

export function LoadingOverlay() {
  const theme = useAppTheme();
  const scale = useSharedValue(1);
  const styles = getStyles(theme);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 600 }),
        withTiming(1, { duration: 600 }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.loadingOverlay}>
      <Animated.View style={[styles.loadingLogo, animatedStyle]}>
        <BookOpen color="#007AFF" size={48} />
      </Animated.View>
      <Text style={styles.statusText}>Wird gesucht...</Text>
    </View>
  );
}
const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  return StyleSheet.create({
    statusText: {
      marginTop: 20,
      fontSize: 18,
      fontWeight: "600",
      color: theme.textColor,
    },
    loadingOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.bg,
    },
    loadingLogo: {
      backgroundColor: theme.cardBg,
      padding: 20,
      borderRadius: theme.isModern ? 40 : 30,
      shadowColor: "#007AFF",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 15,
      elevation: 10,
    },
  });
};
