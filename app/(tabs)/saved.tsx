// Version 1.3.6 - © Cactus Apps 2026
import React from "react";
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
import { Image } from "expo-image";
import * as Sentry from "@sentry/react-native";
import {
  MapPin,
  Navigation,
  Share2,
  Trash2,
  Bookmark,
  Lock,
  ExternalLinkIcon,
} from "lucide-react-native";
import { useAuthStore } from "@/lib/storage/zustand";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function SavedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const isDark = theme.isDark;
  const styles = getStyles(theme);

  const savedPlaces = useAuthStore((state) => state.savedPlaces);
  const removePlace = useAuthStore((state) => state.removePlace);
  const isSubscribed = useAuthStore((state) => state.isSubscribed);

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

  const handleRoute = (place: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/(tabs)/mapscreen",
      params: {
        destLat: place.latitude,
        destLon: place.longitude,
        destName: place.name,
        autoRoute: "true",
      },
    });
  };

  const handleShare = async (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const url = `https://de.wikipedia.org/wiki/${encodeURIComponent(
        item.name.replace(/ /g, "_"),
      )}`;
      await Share.share({
        message: `Schau dir diesen Ort an: ${item.name}\n${url}`,
        url: url,
      });
    } catch (err) {
      Sentry.captureException(err);
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={styles.card}
    >
      <View style={styles.imageContainer}>
        {item.thumbnail ? (
          <Image
            source={{ uri: item.thumbnail }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <MapPin size={32} color={theme.chevronColor} />
          </View>
        )}
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

      <View style={styles.infoContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.placeName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.placeLocation} numberOfLines={1}>
            {item.region ? `${item.region}, ` : ""}
            {item.country || "Unknown"}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => handleNavigate(item)}
          >
            <ExternalLinkIcon size={20} color={theme.white} />
            <Text style={styles.badgeText}>Open Map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={(e) => {
              e.stopPropagation();
              handleShare(item);
            }}
          >
            <Share2 size={20} color={theme.chevronColor} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  if (!isSubscribed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("Saved_Places")}</Text>
        </View>
        <View style={styles.lockContainer}>
          <View style={styles.lockIconCircle}>
            <Bookmark size={48} color={theme.chevronColor} strokeWidth={1.5} />
            <View style={styles.lockBadge}>
              <Lock size={16} color={theme.white} strokeWidth={3} />
            </View>
          </View>
          <Text style={styles.lockTitle}>{t("Premium_Feature")}</Text>
          <Text style={styles.lockSub}>{t("Premium_Lock_Sub")}</Text>
          <TouchableOpacity
            style={styles.unlockBtn}
            onPress={() => router.push("/paywall")}
          >
            <Text style={styles.unlockBtnText}>{t("Unlock_Now")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
    primaryLight,
    white,
    chevronColor,
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
    imageContainer: {
      width: "100%",
      height: 180,
      backgroundColor: cardBgSecondary,
    },
    image: {
      width: "100%",
      height: "100%",
    },
    placeholderImage: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    removeButton: {
      position: "absolute",
      top: 12,
      right: 12,
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
      width: 120,
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
