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
import { fetchUnseen, Announcement } from "@/lib/announcements";
import AnnouncementModal from "@/components/sheets_modal/AnnouncementModal";

function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoadingUser } = useAuth();
  const segments = useSegments();
  const redirecting = React.useRef(false);

  useEffect(() => {
    if (isLoadingUser || redirecting.current) return;

    redirecting.current = true;
    const inAuthGroup = segments[0] === "auth";

    if (!user && !inAuthGroup) {
      router.replace("/auth");
    } else if (user && inAuthGroup) {
      router.replace("/");
    }

    const t = setTimeout(() => (redirecting.current = false), 100);
    return () => clearTimeout(t);
  }, [user, segments, isLoadingUser, router]);

  if (isLoadingUser) return null;
  return <>{children}</>;
}

export default function TabsLayout() {
  const scheme = useColorScheme();
  const TabBar = useTabStore((s) => s.TabBar);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetchUnseen().then(setAnnouncements);
  }, []);

  return (
    <>
      <RouteGuard>
        {TabBar === "CustomTabBar1" ? (
          <Tabs
            screenOptions={{ headerShown: false }}
            tabBar={(props) => <CustomTabBar1 colorScheme={null} {...props} />}
          >
            <Tabs.Screen name="index" options={{ title: "Home" }} />
            <Tabs.Screen name="mapscreen" options={{ title: "map" }} />
            <Tabs.Screen name="saved" options={{ title: "Saved" }} />
            <Tabs.Screen name="profilescreen" options={{ title: "profile" }} />
          </Tabs>
        ) : (
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
            <Tabs.Screen name="index" options={{ title: "Home" }} />
            <Tabs.Screen name="mapscreen" options={{ title: "Map" }} />
            <Tabs.Screen name="saved" options={{ title: "Saved" }} />
            <Tabs.Screen name="profilescreen" options={{ title: "Profile" }} />
          </Tabs>
        )}
      </RouteGuard>
      <AnnouncementModal
        announcements={announcements}
        onClose={() => setAnnouncements([])}
      />
    </>
  );
}
