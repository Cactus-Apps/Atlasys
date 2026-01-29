import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Home, User, HelpCircle, MapIcon, Bookmark } from "lucide-react-native";

const { width } = Dimensions.get("window");

type Props = {
  state: any;
  descriptors: any;
  navigation: any;
  colorScheme: "light" | "dark" | null;
};

export function CustomTabBar1({
  state,
  descriptors,
  navigation,
  colorScheme,
}: Props) {
  const TAB_COUNT = state.routes.length;
  const TAB_WIDTH = width / TAB_COUNT;

  const INDICATOR_WIDTH = 46;

  const translateX = useSharedValue(
    state.index * TAB_WIDTH + (TAB_WIDTH - INDICATOR_WIDTH) / 2
  );

  useEffect(() => {
    translateX.value = withTiming(
      state.index * TAB_WIDTH + (TAB_WIDTH - INDICATOR_WIDTH) / 2,
      {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      }
    );
  }, [state.index, TAB_WIDTH]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const getIcon = (name: string, color: string, size: number) => {
    switch (name) {
      case "index":
        return <Home color={color} size={size} />;
      case "mapscreen":
        return <MapIcon color={color} size={size} />;
      case "saved":
        return <Bookmark color={color} size={size} />;
      case "profilescreen":
        return <User color={color} size={size} />;
      default:
        return <HelpCircle color={color} size={size} />;
    }
  };

  return (
    <BlurView
      intensity={80}
      tint={colorScheme === "dark" ? "dark" : "light"}
      style={styles.tabBarContainer}
    >
        <View style={styles.indicatorMask}>
          <Animated.View
            style={[
              styles.indicator,
              { width: INDICATOR_WIDTH },
              indicatorStyle,
            ]}
          />
          </View>

        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;

          const color = isFocused
            ? "#466483ff"
            : colorScheme === "dark"
            ? "#8e8e93"
            : "#6e6e73";

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tab}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(route.name)}
            >
              {getIcon(route.name, color, 25)}
              <Text style={[styles.label, { color }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: "row",
    height: 72,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    zIndex: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
  indicatorMask: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: 4,
    overflow: "hidden",
  },
  indicator: {
    height: 4,
    backgroundColor: "#466483ff",
    borderRadius: 2,
  },
});
