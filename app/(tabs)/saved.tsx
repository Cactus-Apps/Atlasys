import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Share,
  Linking,
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
  Globe,
} from "lucide-react-native";
import { useAuthStore } from "@/lib/storage/zustand";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { fonts } from "@/lib/fonts";
import {
  placeCategoryColor,
  placeCategoryLabel,
  placeCategoryMeta,
} from "@/components/sheets_modal/DropPinSheet";
import {
  WIKI_IMAGE_HEADERS,
  cacheThumbnail,
  deleteCachedThumbnail,
  getCachedThumbnailUri,
  sweepThumbnailCache,
} from "@/lib/storage/thumbnailCache";
import { parseOpeningHours } from "@/lib/geocoding/overpass";
import { getPOIIcon, poiBgColor, poiColor } from "@/lib/geocoding/poiIcons";

export default function SavedScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const statusBarTheme = theme.isDark ? "light" : "dark";

  const [activeTab, setActiveTab] = useState<"cities" | "places" | "markers">(
    "cities",
  );

  const savedPlaces = useAuthStore((state) => state.savedPlaces);
  const removePlace = useAuthStore((state) => state.removePlace);
  const savedPois = useAuthStore((state) => state.savedPois);
  const removePoi = useAuthStore((state) => state.removePoi);
  const customPlaces = useAuthStore((state) => state.customPlaces);
  const removeCustomPlace = useAuthStore((state) => state.removeCustomPlace);

  const poiCacheKey = (osmId: number) => `poi-${osmId}`;
  const navNonceRef = useRef(0);

  const [thumbCacheState, setThumbCacheState] = useState<
    Record<string, string>
  >({});
  const [poiThumbCache, setPoiThumbCache] = useState<Record<string, string>>(
    {},
  );

  const cachedThumbnails = (() => {
    const names = new Set(savedPlaces.map((p) => p.name));
    const filtered: Record<string, string> = {};
    for (const [key, val] of Object.entries(thumbCacheState)) {
      if (names.has(key)) filtered[key] = val;
    }
    return filtered;
  })();

  const cachedPoiThumbs = (() => {
    const names = new Set(savedPois.map((p) => poiCacheKey(p.osmId)));
    const filtered: Record<string, string> = {};
    for (const [key, val] of Object.entries(poiThumbCache)) {
      if (names.has(key)) filtered[key] = val;
    }
    return filtered;
  })();

  useEffect(() => {
    let cancelled = false;

    const placesWithThumbnail = savedPlaces.filter((p) => !!p.thumbnail);
    const poisWithImage = savedPois.filter((p) => !!p.image);
    sweepThumbnailCache([
      ...savedPlaces,
      ...savedPois.map((p) => ({
        name: poiCacheKey(p.osmId),
        thumbnail: p.image,
      })),
    ]);

    if (placesWithThumbnail.length === 0 && poisWithImage.length === 0) return;

    (async () => {
      const results: Record<string, string> = {};
      const poiResults: Record<string, string> = {};
      await Promise.all([
        ...placesWithThumbnail.map(async (place) => {
          const uri = await cacheThumbnail(place.name, place.thumbnail!);
          if (uri) results[place.name] = uri;
        }),
        ...poisWithImage.map(async (poi) => {
          const uri = await cacheThumbnail(poiCacheKey(poi.osmId), poi.image!);
          if (uri) poiResults[poiCacheKey(poi.osmId)] = uri;
        }),
      ]);
      if (!cancelled) {
        setThumbCacheState((prev) => ({ ...prev, ...results }));
        setPoiThumbCache((prev) => ({ ...prev, ...poiResults }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [savedPlaces, savedPois]);

  const handleRemoveMarker = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeCustomPlace(id);
  };

  const handleMarkerNavigate = (marker: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/(tabs)/mapscreen",
      params: {
        destLat: String(marker.latitude),
        destLon: String(marker.longitude),
        destName: marker.name || marker.address || "Marker",
      },
    });
  };

  const handleRemove = (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removePlace(item.name);
    deleteCachedThumbnail(item.name, item.thumbnail ?? undefined);
    setThumbCacheState((prev) => {
      const next = { ...prev };
      delete next[item.name];
      return next;
    });
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
    const rawSlug = place.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const cityId = rawSlug || encodeURIComponent(place.name.toLowerCase());

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

  const handlePoiNavigate = (poi: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/(tabs)/mapscreen",
      params: {
        poiName: poi.name,
        poiLat: String(poi.latitude),
        poiLon: String(poi.longitude),
        poiType: poi.category || "",
        poiSubclass: poi.subclass || "",
        poiOsmId: String(poi.osmId),
        poiOsmType: poi.osmType || "",
        handledAt: String(navNonceRef.current++),
      },
    });
  };

  const handleRemovePoi = (poi: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removePoi(poi.osmId);
    deleteCachedThumbnail(poiCacheKey(poi.osmId), poi.image || undefined);
    setPoiThumbCache((prev) => {
      const next = { ...prev };
      delete next[poiCacheKey(poi.osmId)];
      return next;
    });
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const localThumb = item.thumbnail
      ? (cachedThumbnails[item.name] ??
        getCachedThumbnailUri(item.name, item.thumbnail))
      : null;
    const hasThumbnail = !!localThumb || !!item.thumbnail;

    const nameContent = (
      <View style={styles.textContainer}>
        <Text
          style={[styles.placeLocation, hasThumbnail && styles.whiteSubText]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text
          style={[styles.placeLocation, hasThumbnail && styles.whiteSubText]}
          numberOfLines={1}
        >
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
          }}
        >
          <Building2 size={20} color={theme.white} />

          <Text style={styles.badgeText}>{t("Saved_open_city_map")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, hasThumbnail && styles.actionBtnOverlay]}
          onPress={() => {
            handleNavigate(item);
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
        {localThumb || item.thumbnail ? (
          <ImageBackground
            source={
              localThumb
                ? { uri: localThumb }
                : { uri: item.thumbnail, headers: WIKI_IMAGE_HEADERS }
            }
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
                    handleRemove(item);
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
            <View style={styles.topRow}>
              <View style={styles.placeholderImage}>
                <MapPin size={32} color={theme.chevronColor} />
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleRemove(item);
                }}
              >
                <Trash2 size={18} color={theme.danger} />
              </TouchableOpacity>
            </View>
            {nameContent}
            {actionContent}
          </View>
        )}
      </Animated.View>
    );
  };

  const renderMarkerItem = ({ item, index }: { item: any; index: number }) => {
    const isCustom = item.category === "custom";
    const metaKey = isCustom ? item.categoryIcon : item.category;
    const meta = placeCategoryMeta(metaKey);
    const Icon = meta?.icon;
    const color = placeCategoryColor(metaKey);
    const label = isCustom
      ? item.customCategory || t("Place_cat_other")
      : placeCategoryLabel(item.category, t);

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 80).springify()}
        style={styles.markerCard}
      >
        <View style={[styles.markerIcon, { backgroundColor: color + "20" }]}>
          {Icon && <Icon size={22} color={color} />}
        </View>
        <View style={styles.markerInfo}>
          <Text style={styles.markerName} numberOfLines={1}>
            {item.name || item.address || t("Place_default_name")}
          </Text>
          <View style={styles.markerMetaRow}>
            <View
              style={[styles.markerCatTag, { backgroundColor: color + "18" }]}
            >
              <Text style={[styles.markerCatText, { color }]} numberOfLines={1}>
                {label}
              </Text>
            </View>
            {!!item.address && (
              <Text style={styles.markerAddress} numberOfLines={1}>
                {item.address}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.markerActions}>
          <TouchableOpacity
            style={styles.markerActionBtn}
            onPress={() => handleMarkerNavigate(item)}
          >
            <MapPin size={18} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.markerActionBtn}
            onPress={() => handleRemoveMarker(item.id)}
          >
            <Trash2 size={18} color={theme.danger} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderPoiItem = ({ item, index }: { item: any; index: number }) => {
    const key = poiCacheKey(item.osmId);
    const localThumb = item.image
      ? (cachedPoiThumbs[key] ?? getCachedThumbnailUri(key, item.image))
      : null;
    const hasImage = !!localThumb || !!item.image;
    const cat = item.category || item.subclass || "";
    const Icon = getPOIIcon(cat);
    const color = poiColor(cat);
    const bgColor = poiBgColor(cat);
    const openStatus = item.openingHours
      ? parseOpeningHours(item.openingHours)
      : null;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 80).springify()}
        style={styles.poiCard}
      >
        {hasImage ? (
          <ImageBackground
            source={
              localThumb
                ? { uri: localThumb }
                : { uri: item.image, headers: WIKI_IMAGE_HEADERS }
            }
            style={styles.poiImageHeader}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          ></ImageBackground>
        ) : (
          <View style={[styles.poiPlaceholder, { backgroundColor: bgColor }]}>
            <Icon size={44} color={color} strokeWidth={1.75} />
          </View>
        )}

        <View style={styles.poiBody}>
          <Text style={styles.poiName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.poiMetaRow}>
            <View style={[styles.poiCatTag, { backgroundColor: color + "18" }]}>
              <Text style={[styles.poiCatText, { color }]} numberOfLines={1}>
                {item.subclass || item.category}
              </Text>
            </View>
            {openStatus && (
              <View
                style={[
                  styles.poiStatusTag,
                  { backgroundColor: openStatus.color + "20" },
                ]}
              >
                <View
                  style={[
                    styles.poiStatusDot,
                    { backgroundColor: openStatus.color },
                  ]}
                />
                <Text
                  style={[styles.poiStatusText, { color: openStatus.color }]}
                  numberOfLines={1}
                >
                  {openStatus.label}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.poiActionsRow}>
            <TouchableOpacity
              style={[
                styles.poiActionBtnPrimary,
                { backgroundColor: theme.primary },
              ]}
              onPress={() => handlePoiNavigate(item)}
            >
              <MapPin size={18} color={theme.white} />
              <Text style={styles.poiActionBtnPrimaryText}>
                {t("Show_on_map")}
              </Text>
            </TouchableOpacity>
            {!!item.website && (
              <TouchableOpacity
                style={styles.poiActionBtn}
                onPress={() =>
                  Linking.openURL(
                    item.website.startsWith("http")
                      ? item.website
                      : `https://${item.website}`,
                  )
                }
              >
                <Globe size={18} color={theme.info} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.poiActionBtn}
              onPress={() => handleRemovePoi(item)}
            >
              <Trash2 size={18} color={theme.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={statusBarTheme} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("Saved_Places")}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {activeTab === "cities"
              ? savedPlaces.length
              : activeTab === "places"
                ? savedPois.length
                : customPlaces.length}
          </Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "cities" && styles.activeTab]}
          onPress={() => setActiveTab("cities")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "cities" && styles.activeTabText,
            ]}
          >
            Saved Cities
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "places" && styles.activeTab]}
          onPress={() => setActiveTab("places")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "places" && styles.activeTabText,
            ]}
          >
            Saved Places
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "markers" && styles.activeTab]}
          onPress={() => setActiveTab("markers")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "markers" && styles.activeTabText,
            ]}
          >
            Saved Markers
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "cities" && (
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
      )}

      {activeTab === "places" && (
        <FlatList
          data={savedPois}
          renderItem={renderPoiItem}
          keyExtractor={(item) => String(item.osmId)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <MapPin
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
      )}

      {activeTab === "markers" && (
        <FlatList
          data={customPlaces}
          renderItem={renderMarkerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <MapPin
                  size={48}
                  color={theme.chevronColor}
                  strokeWidth={1.5}
                />
              </View>
              <Text style={styles.emptyTitle}>{t("No_saved_markers")}</Text>
              <Text style={styles.emptySub}>{t("Add_markers_hint")}</Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => router.push("/(tabs)/mapscreen")}
              >
                <Text style={styles.exploreBtnText}>{t("Go_to_Map")}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
      fontFamily: fonts.bold,
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
      fontFamily: fonts.bold,
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
      fontFamily: fonts.bold,
      color: textColor,
    },
    placeLocation: {
      fontSize: 14,
      color: subTextColor,
      marginTop: 2,
      fontFamily: fonts.medium,
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
      fontFamily: fonts.bold,
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
      fontFamily: fonts.bold,
    },
    tabContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: cardBg,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    tab: {
      flex: 1,
      paddingVertical: 14,
      marginHorizontal: 4,
      borderRadius: isModern ? 16 : 12,
      backgroundColor: isModern
        ? theme.iconBg
        : theme.isDark
          ? "rgba(255, 255, 255, 0.05)"
          : cardBgSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    activeTab: {
      borderColor: primary,
      borderWidth: 2,
    },
    tabText: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: subTextColor,
    },
    activeTabText: {
      color: white,
      fontFamily: fonts.bold,
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
      fontFamily: fonts.bold,
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
      fontFamily: fonts.bold,
    },
    markerCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: cardBg,
      borderRadius: isModern ? 20 : 16,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: borderColor,
      shadowColor: theme.black,
      shadowOpacity: isModern ? (theme.isDark ? 0 : 0.05) : 0.04,
      shadowRadius: isModern ? 10 : 8,
      elevation: isModern ? 3 : 2,
    },
    markerIcon: {
      width: 46,
      height: 46,
      borderRadius: isModern ? 14 : 12,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    markerInfo: {
      flex: 1,
      gap: 4,
    },
    markerName: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: textColor,
    },
    markerMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    markerCatTag: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 20,
      maxWidth: "60%",
    },
    markerCatText: {
      fontSize: 11,
      fontFamily: fonts.bold,
    },
    markerAddress: {
      flex: 1,
      fontSize: 12,
      color: subTextColor,
      fontFamily: fonts.medium,
    },
    markerActions: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
    },
    markerActionBtn: {
      width: 38,
      height: 38,
      borderRadius: isModern ? 12 : 10,
      backgroundColor: theme.iconBg,
      alignItems: "center",
      justifyContent: "center",
    },
    poiCard: {
      backgroundColor: cardBg,
      borderRadius: isModern ? 24 : 18,
      marginBottom: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: borderColor,
      shadowColor: theme.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isModern ? (theme.isDark ? 0 : 0.06) : 0.05,
      shadowRadius: isModern ? 14 : 10,
      elevation: isModern ? 3 : 2,
    },
    poiImageHeader: {
      width: "100%",
      height: 180,
    },
    poiImageOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.25)",
      padding: 12,
      alignItems: "flex-end",
    },
    poiPlaceholder: {
      height: 150,
      alignItems: "center",
      justifyContent: "center",
    },
    poiPlaceholderRemove: {
      position: "absolute",
      top: 12,
      right: 12,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    poiBody: {
      padding: 14,
      gap: 8,
    },
    poiName: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: textColor,
    },
    poiMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap",
    },
    poiCatTag: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
      maxWidth: "55%",
    },
    poiCatText: {
      fontSize: 11,
      fontFamily: fonts.bold,
    },
    poiStatusTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
    },
    poiStatusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    poiStatusText: {
      fontSize: 11,
      fontFamily: fonts.bold,
    },
    poiActionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 2,
    },
    poiActionBtnPrimary: {
      flex: 1,
      height: 40,
      flexDirection: "row",
      gap: 8,
      borderRadius: isModern ? 14 : 12,
      alignItems: "center",
      justifyContent: "center",
    },
    poiActionBtnPrimaryText: {
      color: white,
      fontSize: 14,
      fontFamily: fonts.bold,
    },
    poiActionBtn: {
      width: 40,
      height: 40,
      borderRadius: isModern ? 12 : 10,
      backgroundColor: theme.iconBg,
      alignItems: "center",
      justifyContent: "center",
    },
  });
};
