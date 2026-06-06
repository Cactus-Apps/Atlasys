import React from "react";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { AppThemeReturn } from "@/lib/theme";
import { useTranslation } from "react-i18next";

type Props = {
  theme: AppThemeReturn;
};

export function TabBarNative({ theme }: Props) {
  const { t } = useTranslation();

  return (
    <NativeTabs
      iconColor={{
        default: theme.subTextColor,
        selected: theme.accentColor,
      }}
      backgroundColor={theme.bg}
      labelVisibilityMode="labeled"
    >
      <NativeTabs.Trigger name="mapscreen">
        <NativeTabs.Trigger.Icon
          sf={{ default: "map", selected: "map.fill" }}
          md="map"
        />
        <NativeTabs.Trigger.Label>{t("Tab_map")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="saved">
        <NativeTabs.Trigger.Icon
          sf={{ default: "bookmark", selected: "bookmark.fill" }}
          md="bookmark"
        />
        <NativeTabs.Trigger.Label>{t("Tab_saved")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profilescreen">
        <NativeTabs.Trigger.Icon
          sf={{ default: "person", selected: "person.fill" }}
          md="person"
        />
        <NativeTabs.Trigger.Label>{t("Tab_profile")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
