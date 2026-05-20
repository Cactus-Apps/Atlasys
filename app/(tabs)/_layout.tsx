import { CustomTabBar1 } from "@/components/TabBarStyle";
import { Tabs } from "expo-router";
import { useTabStore } from "@/lib/storage/zustand";
import { Bookmark, HelpCircle, MapIcon, User } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { fetchUnseen, Announcement } from "@/utils/announcements";
import AnnouncementModal from "@/components/sheets_modal/AnnouncementModal";
import { useAppTheme } from "@/lib/theme";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
  const { t } = useTranslation();
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
          <Tabs.Screen name="mapscreen" options={{ title: t("Tab_map") }} />
          <Tabs.Screen name="saved" options={{ title: t("Tab_saved") }} />
          <Tabs.Screen
            name="profilescreen"
            options={{ title: t("Tab_profile") }}
          />
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
          <Tabs.Screen name="mapscreen" options={{ title: t("Tab_map") }} />
          <Tabs.Screen name="saved" options={{ title: t("Tab_saved") }} />
          <Tabs.Screen
            name="profilescreen"
            options={{ title: t("Tab_profile") }}
          />
        </Tabs>
      )}
      <AnnouncementModal
        announcements={announcements}
        onClose={() => setAnnouncements([])}
      />
    </>
  );
}
