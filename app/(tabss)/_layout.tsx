import { Tabs } from "expo-router";
import {
  Dimensions,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import React from "react";
import { HelpCircle, Home, MapIcon, User } from "lucide-react-native";

const { width } = Dimensions.get("window");

type Props = {
  state: any;
  descriptors: any;
  navigation: any;
};

function CustomTabBar({ state, descriptors, navigation }: Props) {
  const TAB_COUNT = state.routes.length;
  const TAB_WIDTH = width / TAB_COUNT;

  const translateX = useSharedValue(state.index * TAB_WIDTH);

  React.useEffect(() => {
    translateX.value = withTiming(state.index * TAB_WIDTH, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [state.index, TAB_WIDTH]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <BlurView intensity={80} tint="light" style={styles.blurContainer}>
      <View style={styles.tabBarContainer}>
        {/* Indicator Mask */}
        <View style={styles.indicatorMask}>
          <Animated.View
            style={[styles.indicator, { width: TAB_WIDTH }, indicatorStyle]}
          />
        </View>

        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const isFocused = state.index === index;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BlurView>
  );
}

export default function AppTabs() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let IconComponent;
          switch (route.name) {
            case "index":
              IconComponent = Home;
              break;
            case "mapscreen":
              IconComponent = MapIcon;
              break;
            case "profilescreen":
              IconComponent = User;
              break;
            default:
              IconComponent = HelpCircle;
              break;
          }
          return <IconComponent width={size} height={size} stroke={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="test3" options={{ title: "Search" }} />
      <Tabs.Screen name="test4" options={{ title: "Notifications" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
    backgroundColor: '#3e83ae'
  },
  tabLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
  },
  tabLabelFocused: {
    color: "#fff",
  },
  tabBarContainer: {
    flexDirection: "row",
    height: 60,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  indicatorMask: {
    position: "absolute",
    width: "100%",
    height: 3,
    top: 0,
    overflow: "hidden",
  },
  indicator: {
    width: 20,
    height: 3,
    backgroundColor: "#007AFF",
    borderRadius: 2,
  },
});
