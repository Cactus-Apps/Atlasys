import { View, Text, Pressable, StyleSheet } from "react-native";
import Svg, { Rect, Path, Line } from "react-native-svg";
import { ChevronRight } from "lucide-react-native";
import { useAppTheme } from "@/lib/theme";
import { useMemo } from "react";

function CityMapsIcon({ size = 34 }) {
  const theme = useAppTheme();

  return (
    <Svg width={size} height={size} viewBox="0 0 34 34">
      <Rect x="1" y="1" width="32" height="32" rx="9" fill="#233252" />
      <Path
        d="M9 24 L9 11 L14 9 L20 11 L25 9 L25 22 L20 24 L14 22 Z"
        fill="none"
        stroke={theme.primary}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <Line
        x1="14"
        y1="9"
        x2="14"
        y2="22"
        stroke={theme.primary}
        strokeWidth="1"
        strokeDasharray="1.5 1.8"
      />
      <Line
        x1="20"
        y1="11"
        x2="20"
        y2="24"
        stroke={theme.primary}
        strokeWidth="1"
        strokeDasharray="1.5 1.8"
      />
    </Svg>
  );
}

export default function CityMapsButton({ onPress, isNew = true }: any) {
  const theme = useAppTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <CityMapsIcon />

      <View style={styles.textWrap}>
        <Text style={styles.title}>City Maps</Text>
        <Text style={styles.subtitle}>Transit routes and top attractions</Text>
      </View>

      <ChevronRight size={18} color="#7fa8ff" />

      {isNew && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>NEW</Text>
        </View>
      )}
    </Pressable>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const { cardBg, textColor, subTextColor, primary, warning, black } = theme;
  return StyleSheet.create({
    button: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: cardBg,
      borderWidth: 1.5,
      borderColor: primary,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    pressed: {
      opacity: 0.85,
    },
    textWrap: {
      flex: 1,
    },
    title: {
      color: textColor,
      fontSize: 15,
      fontWeight: "500",
    },
    subtitle: {
      color: subTextColor,
      fontSize: 12.5,
      marginTop: 2,
    },
    badge: {
      position: "absolute",
      top: -9,
      right: 14,
      backgroundColor: warning,
      borderRadius: 20,
      paddingVertical: 2,
      paddingHorizontal: 8,
    },
    badgeText: {
      color: black,
      fontSize: 10.5,
      fontWeight: "500",
    },
  });
};
