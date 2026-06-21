import { useEffect, useRef } from "react";
import { View, Animated, Easing, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTranslation } from "react-i18next";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function CircularProgress({
  progress, // 0–1
  color,
  size = 100,
}: {
  progress: number;
  color: string;
  size?: number;
}) {
  const { t } = useTranslation();
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Animated ring progress
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false, // SVG stroke props
    }).start();
  }, [progress]);

  // eslint-disable-next-line react-hooks/refs
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const percent = Math.round(progress * 100);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color + "25"}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          // Start at top instead of right
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Center label */}
      <View style={{ alignItems: "center" }}>
        <Text
          style={{
            color,
            fontSize: size * 0.22,
            fontWeight: "800",
            letterSpacing: -0.5,
          }}
        >
          {percent}%
        </Text>
        {percent < 100 && (
          <Text
            style={{
              color: color + "80",
              fontSize: size * 0.11,
              fontWeight: "500",
              marginTop: 2,
            }}
          >
            {t("Progress_loading")}
          </Text>
        )}
        {percent === 100 && (
          <Text
            style={{
              color,
              fontSize: size * 0.11,
              fontWeight: "600",
              marginTop: 2,
            }}
          >
            {t("Progress_done")}
          </Text>
        )}
      </View>
    </View>
  );
}
