import React, { useEffect, useRef } from "react";
import {
  FlatList,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/lib/theme";
import { ImageBackground } from "expo-image";
import * as Sentry from "@sentry/react-native";
import {
  MapPin,
  Share2,
  Trash2,
  Bookmark,
  ExternalLinkIcon,
  Building2,
} from "lucide-react-native";
import { useAuthStore } from "@/lib/storage/zustand";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { posthog } from "@/lib/config/posthog";
import { StatusBar } from "expo-status-bar";
import { reverseGeocodeAddress } from "@/lib/geocoding/geocoding";

export default function SavedScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const statusBarTheme = theme.isDark ? "light" : "dark";

  const savedPlaces = useAuthStore((state) => state.savedPlaces);
  const removePlace = useAuthStore((state) => state.removePlace);
  const updatePlace = useAuthStore((state) => state.updatePlace);

  const handleRemove = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removePlace(name);
  };

  const handleNavigate = (place: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/(tabs)/mapscreen",
      params: {
        destLat: String(place.latitude),
        destLon: String(place.longitude),
        destName: place.name,
      },
    });
  };

  const handleCityMap = (place: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const cityId = place.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const q =
      `name=${encodeURIComponent(place.name)}&latitude=${place.latitude}&longitude=${place.longitude}` +
      (place.region ? `&region=${encodeURIComponent(place.region)}` : "") +
      (place.country ? `&country=${encodeURIComponent(place.country)}` : "") +
      (place.thumbnail
        ? `&thumbnail=${encodeURIComponent(place.thumbnail)}`
        : "");
    router.push(`/city/${cityId}?${q}` as any);
  };

  const handleShare = async (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const wikiLang = (i18n.language || "en").split("-")[0];
      const url = `https://${wikiLang}.wikipedia.org/wiki/${encodeURIComponent(
        item.name.replace(/ /g, "_"),
      )}`;
      await Share.share({
        message: t("Share_place_message", { name: item.name, url }),
        url: url,
      });
    } catch (err) {
      Sentry.captureException(err);
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const hasThumbnail = !!item.thumbnail;

    const nameContent = (
      <View style={styles.textContainer}>
        <Text
          style={[styles.placeName, hasThumbnail && styles.whiteText]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text style={styles.placeLocation} numberOfLines={1}>
          {item.country || "Unknown"}
        </Text>
      </View>
    );

    const actionContent = (
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionBtnPrimary,
            hasThumbnail && styles.actionBtnOverlayPrimary,
          ]}
          onPress={() => {
            handleCityMap(item);
            posthog.capture("saved_place_citymap");
          }}
        >
          <Building2 size={20} color={theme.white} />

          <Text style={styles.badgeText}>{t("Saved_open_city_map")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, hasThumbnail && styles.actionBtnOverlay]}
          onPress={() => {
            handleNavigate(item);
            posthog.capture("saved_place_opened", {
              country: item.country,
              has_thumbnail: !!item.thumbnail,
            });
          }}
        >
          <ExternalLinkIcon
            size={20}
            color={hasThumbnail ? theme.white : theme.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, hasThumbnail && styles.actionBtnOverlay]}
          onPress={(e) => {
            e.stopPropagation();
            handleShare(item);
          }}
        >
          <Share2
            size={20}
            color={hasThumbnail ? theme.white : theme.chevronColor}
          />
        </TouchableOpacity>
      </View>
    );

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        style={styles.card}
      >
        {item.thumbnail ? (
          <ImageBackground
            source={{
              uri: item.thumbnail,
              headers: { Referer: "https://en.wikipedia.org/" },
            }}
            style={styles.cardBackground}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          >
            <View style={styles.overlay}>
              <View style={styles.topRow}>
                {nameContent}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRemove(item.name);
                  }}
                >
                  <Trash2 size={18} color={theme.danger} />
                </TouchableOpacity>
              </View>
              <View style={styles.bottomRow}>{actionContent}</View>
            </View>
          </ImageBackground>
        ) : (
          <View style={styles.noImageContainer}>
            <View style={styles.placeholderImage}>
              <MapPin size={32} color={theme.chevronColor} />
            </View>
            {nameContent}
            {actionContent}
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={statusBarTheme} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("Saved_Places")}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{savedPlaces.length}</Text>
        </View>
      </View>

      <FlatList
        data={savedPlaces}
        renderItem={renderItem}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Bookmark
                size={48}
                color={theme.chevronColor}
                strokeWidth={1.5}
              />
            </View>
            <Text style={styles.emptyTitle}>{t("No_saved_places")}</Text>
            <Text style={styles.emptySub}>{t("Explore_map_to_save")}</Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => router.push("/(tabs)/mapscreen")}
            >
              <Text style={styles.exploreBtnText}>{t("Go_to_Map")}</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const {
    bg,
    cardBg,
    cardBgSecondary,
    textColor,
    subTextColor,
    borderColor,
    isModern,
    primary,
    white,
    accentColorbg,
  } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
      backgroundColor: cardBg,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "900",
      color: textColor,
      letterSpacing: -0.5,
    },
    badge: {
      backgroundColor: primary,
      paddingHorizontal: 10,
      paddingVertical: 2,
      borderRadius: 12,
      marginLeft: 12,
    },
    badgeText: {
      color: white,
      fontSize: 14,
      fontWeight: "800",
    },
    listContent: {
      padding: 16,
      paddingBottom: 100,
    },
    card: {
      backgroundColor: cardBg,
      borderRadius: isModern ? 32 : 24,
      marginBottom: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: borderColor,
      shadowColor: theme.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isModern ? (theme.isDark ? 0 : 0.08) : 0.05,
      shadowRadius: isModern ? 16 : 12,
      elevation: isModern ? 4 : 3,
    },
    cardBackground: {
      width: "100%",
      minHeight: 220,
    },
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      padding: 16,
      justifyContent: "space-between",
      minHeight: 220,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    bottomRow: {
      flexDirection: "row",
      justifyContent: "flex-start",
    },
    noImageContainer: {
      width: "100%",
      minHeight: 200,
      backgroundColor: cardBgSecondary,
      padding: 16,
    },
    actionBtnOverlay: {
      backgroundColor: "rgba(255,255,255,0.15)",
    },
    actionBtnOverlayPrimary: {
      backgroundColor: accentColorbg,
    },
    placeholderImage: {
      width: "100%",
      height: 140,
      alignItems: "center",
      justifyContent: "center",
    },
    whiteText: {
      color: "#fff",
    },
    whiteSubText: {
      color: "rgba(255,255,255,0.75)",
    },
    removeButton: {
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.black,
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    infoContainer: {
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    textContainer: {
      flex: 1,
    },
    placeName: {
      fontSize: 18,
      fontWeight: "800",
      color: textColor,
    },
    placeLocation: {
      fontSize: 14,
      color: subTextColor,
      marginTop: 2,
      fontWeight: "500",
    },
    actions: {
      flexDirection: "row",
      gap: 8,
    },
    actionBtn: {
      width: 44,
      height: 44,
      flexDirection: "row",
      borderRadius: isModern ? 16 : 14,
      backgroundColor: isModern
        ? theme.iconBg
        : theme.isDark
          ? "rgba(255, 255, 255, 0.05)"
          : cardBgSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    actionBtnPrimary: {
      width: 170,
      height: 44,
      flexDirection: "row",
      gap: 10,
      borderRadius: isModern ? 16 : 14,
      backgroundColor: isModern
        ? theme.iconBg
        : theme.isDark
          ? primary
          : primary,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 100,
    },
    emptyIconCircle: {
      width: 100,
      height: 100,
      borderRadius: isModern ? 32 : 50,
      backgroundColor: isModern
        ? theme.iconBg
        : theme.isDark
          ? "rgba(255, 255, 255, 0.03)"
          : cardBgSecondary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: textColor,
      marginBottom: 8,
    },
    emptySub: {
      fontSize: 15,
      color: subTextColor,
      textAlign: "center",
      paddingHorizontal: 40,
      lineHeight: 22,
    },
    exploreBtn: {
      marginTop: 32,
      backgroundColor: primary,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: isModern ? 20 : 16,
    },
    exploreBtnText: {
      color: white,
      fontSize: 16,
      fontWeight: "800",
    },
    lockContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    lockIconCircle: {
      width: 120,
      height: 120,
      borderRadius: isModern ? 40 : 60,
      backgroundColor: isModern
        ? theme.iconBg
        : theme.isDark
          ? "rgba(255, 255, 255, 0.03)"
          : cardBgSecondary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 32,
    },
    lockBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: primary,
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 4,
      borderColor: bg,
    },
    lockTitle: {
      fontSize: 24,
      fontWeight: "900",
      color: textColor,
      marginBottom: 12,
    },
    lockSub: {
      fontSize: 16,
      color: subTextColor,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 40,
    },
    unlockBtn: {
      backgroundColor: primary,
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: isModern ? 24 : 18,
      shadowColor: primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    unlockBtnText: {
      color: white,
      fontSize: 18,
      fontWeight: "800",
    },
  });
};
