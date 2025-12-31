// Version 1.3.6 - © Cactus Apps 2025
import { AuthProvider } from "@/lib/auth-context";
import { Tabs } from "expo-router";
import { HelpCircle, Home, MapIcon, User } from "lucide-react-native";
import React from "react";
import { useColorScheme } from "react-native";

export default function TabsLayout() {
  const scheme = useColorScheme();

  return (
    <AuthProvider>
    <Tabs
      screenOptions={({ route }) => ({
        animation: "fade",
        contentStyle: {
          backgroundColor: scheme === "dark" ? "#0D1117" : "#e2d7d7ff",
        },
        tabBarStyle: {
          backgroundColor: scheme === "dark" ? "#2c2a28ff" : "#e2d7d7ff",
        },
        headerShown: false,
        tabBarActiveTintColor: "#466483ff",
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
      <Tabs.Screen name="mapscreen" options={{ title: "map" }} />
      <Tabs.Screen name="profilescreen" options={{ title: "profile" }} />
    </Tabs>
    </AuthProvider>
  );
}
