import { Tabs } from "expo-router";
import { Bookmark, HelpCircle, MapIcon, User } from "lucide-react-native";
import React, { ReactNode } from "react";
import { Pressable } from "react-native";
import { AppThemeReturn } from "@/lib/theme";

type Props = {
  theme: AppThemeReturn;
  children: ReactNode;
};

export function TabBarModern({ theme, children }: Props) {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        animation: "fade",
        contentStyle: {
          backgroundColor: theme.bg,
        },
        tabBarStyle: {
          backgroundColor: theme.bg,
        },
        headerShown: false,
        tabBarButton: (props: any) => <Pressable {...props} android_ripple={null} />,
        tabBarInactiveTintColor: theme.subTextColor,
        tabBarActiveTintColor: theme.accentColor,
        tabBarIcon: ({ color, size }: any) => {
          let IconComponent;
          switch (route.name) {
            case "mapscreen":
              IconComponent = MapIcon;
              break;
            case "saved":
              IconComponent = Bookmark;
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
      {children}
    </Tabs>
  );
}
