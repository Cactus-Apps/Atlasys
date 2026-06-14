import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  Platform,
  Animated,
} from "react-native";
import { X } from "lucide-react-native";
import { useAppTheme } from "@/lib/theme";
import { useTranslation } from "react-i18next";
import cityStyle from "@/assets/map/city-style.json";
import googlestyle from "@/assets/map/google-style.json"
import type { StyleSpecification } from "maplibre-gl";

export type MapTheme = {
  key: string;
  labelKey: string;
  url: string | StyleSpecification;
  colors: string[]; // preview swatches instead of bitmap thumbnails
};

export const MAP_THEMES: MapTheme[] = [
  {
    key: "bright",
    labelKey: "Map_theme_bright",
    url: "https://tiles.openfreemap.org/styles/bright",
    colors: ["#a8d5a2", "#f5f0e8", "#c8e6f5"], // green, beige, blue
  },
  {
    key: "dark",
    labelKey: "Map_theme_dark",
    url: "https://tiles.openfreemap.org/styles/dark",
    colors: ["#2d4a3e", "#1a1a2e", "#16213e"],
  },
  {
    key: "liberty",
    labelKey: "Map_theme_liberty",
    url: "https://tiles.openfreemap.org/styles/liberty",
    colors: ["#c8d8a8", "#e8d5b0", "#b8c8d8"],
  },
  {
    key: "city",
    labelKey: "Map_theme_city",
    url: cityStyle as StyleSpecification,
    colors: ["#e8e0d4", "#f2efe9", "#a8d4e6"],
  },
  {
    key: "google",
    labelKey: "Goggle Maps",
    url: googlestyle as StyleSpecification,
    colors: ["#e8e0d4", "#f2efe9", "#a8d4e6"],
  },
];

interface Props {
  open: boolean;
  currentTheme: string;
  onSelect: (theme: MapTheme) => void;
  onClose: () => void;
}

export default function MapStyleSheet({
  open,
  currentTheme,
  onSelect,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Dimmed Overlay */}
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose} />

      {/* Sheet */}
      <View style={[s.sheet, { backgroundColor: theme.cardBg }]}>
        {/* Handle */}
        <View style={[s.handle, { backgroundColor: theme.subTextColor }]} />

        {/* Header */}
        <View style={s.header}>
          <Text style={[s.title, { color: theme.textColor }]}>
            {t("Map_style_sheet_title")}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={[s.closeBtn, { backgroundColor: theme.iconBg }]}
          >
            <X size={18} color={theme.subTextColor} />
          </TouchableOpacity>
        </View>

        {/* Theme previews */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.previewRow}
        >
          {MAP_THEMES.map((mt) => {
            const isActive = mt.key === currentTheme;
            return (
              <TouchableOpacity
                key={mt.key}
                onPress={() => onSelect(mt)}
                style={s.previewItem}
              >
                <View
                  style={[
                    s.previewImageWrapper,
                    isActive && s.previewImageWrapperActive,
                  ]}
                >
                  {/* Stylized map preview */}
                  <View style={{ flex: 1, backgroundColor: mt.colors[1] }}>
                    {/* Road-like strokes */}
                    <View
                      style={{
                        position: "absolute",
                        top: "40%",
                        left: 0,
                        right: 0,
                        height: 3,
                        backgroundColor: mt.colors[0],
                        opacity: 0.8,
                      }}
                    />
                    <View
                      style={{
                        position: "absolute",
                        top: "60%",
                        left: 0,
                        right: 0,
                        height: 2,
                        backgroundColor: mt.colors[0],
                        opacity: 0.6,
                      }}
                    />
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: "30%",
                        width: 2,
                        backgroundColor: mt.colors[0],
                        opacity: 0.6,
                      }}
                    />
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: "65%",
                        width: 3,
                        backgroundColor: mt.colors[0],
                        opacity: 0.8,
                      }}
                    />
                    {/* Water */}
                    <View
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: "40%",
                        height: "25%",
                        backgroundColor: mt.colors[2],
                        opacity: 0.7,
                        borderTopRightRadius: 12,
                      }}
                    />
                    {/* Buildings */}
                    <View
                      style={{
                        position: "absolute",
                        top: "15%",
                        left: "35%",
                        width: 14,
                        height: 14,
                        backgroundColor: mt.colors[0],
                        opacity: 0.5,
                      }}
                    />
                    <View
                      style={{
                        position: "absolute",
                        top: "20%",
                        left: "52%",
                        width: 10,
                        height: 10,
                        backgroundColor: mt.colors[0],
                        opacity: 0.4,
                      }}
                    />
                  </View>
                </View>
                <Text
                  style={[
                    s.previewLabel,
                    { color: isActive ? theme.tabIndicator : theme.textColor },
                    isActive && { fontWeight: "700" },
                  ]}
                >
                  {t(mt.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    paddingTop: 12,
    boxShadow: "0 0 20px rgba(0,0,0,0.2)",
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
    opacity: 0.4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: "700" },
  closeBtn: { borderRadius: 20, padding: 6 },
  previewRow: { gap: 16, paddingBottom: 8 },
  previewItem: { alignItems: "center", width: 100 },
  previewImageWrapper: {
    width: 100,
    height: 80,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2.5,
    borderColor: "transparent",
  },
  previewImageWrapperActive: { borderColor: "#007AFF" },
  previewImage: { width: "100%", height: "100%" },
  previewLabel: { marginTop: 8, fontSize: 13 },
});
