// Version 1.3.6 - © Cactus Apps 2026
import { CustomTabBar1 } from "@/components/TabBarStyle";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { Tabs } from "expo-router";
import { useColorScheme, View } from "react-native";
import { useTabStore } from "@/lib/storage/zustand";
import { Bookmark, HelpCircle, Home, MapIcon, User } from "lucide-react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { AnimatedSplash } from "@/components/SplashScreen";
import { fetchUnseen, Announcement } from "@/utils/announcements";
import AnnouncementModal from "@/components/sheets_modal/AnnouncementModal";
import { useAppTheme } from "@/lib/theme";

export default function TabsLayout() {
  const theme = useAppTheme();
  const TabBar = useTabStore((s) => s.NewTabBar);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetchUnseen().then(setAnnouncements);
  }, []);

  const themeKey = `${theme.bg}|${theme.accentColor}|${theme.subTextColor}|${theme.borderColor}|${theme.theme}`;

  return (
    <>
      {TabBar ? (
        <Tabs
          screenOptions={{ headerShown: false }}
          tabBar={(props) => (
            <CustomTabBar1
              key={`tabbar-${themeKey}`}
              colorScheme={null}
              {...props}
            />
          )}
        >
          <Tabs.Screen name="mapscreen" options={{ title: "map" }} />
          <Tabs.Screen name="saved" options={{ title: "Saved" }} />
          <Tabs.Screen name="profilescreen" options={{ title: "profile" }} />
        </Tabs>
      ) : (
        <Tabs
          key={`tabs-${themeKey}`}
          screenOptions={({ route }) => ({
            animation: "fade",
            contentStyle: {
              backgroundColor: theme.bg,
            },
            tabBarStyle: {
              backgroundColor: theme.bg,
            },
            headerShown: false,
            tabBarActiveTintColor: theme.accentColor,
            tabBarIcon: ({ color, size }) => {
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
              return (
                <IconComponent width={size} height={size} stroke={color} />
              );
            },
          })}
        >
          <Tabs.Screen name="mapscreen" options={{ title: "Map" }} />
          <Tabs.Screen name="saved" options={{ title: "Saved" }} />
          <Tabs.Screen name="profilescreen" options={{ title: "Profile" }} />
        </Tabs>
      )}
      <AnnouncementModal
        announcements={announcements}
        onClose={() => setAnnouncements([])}
      />
    </>
  );
}
