import { useMemo, useState, useCallback, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import {
  MapPin,
  Satellite,
  Bookmark,
  Navigation,
  Activity,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Bug,
  Shield,
  type LucideIcon,
} from "lucide-react-native";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/lib/storage/zustand";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDE_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  "map-pin": MapPin,
  satellite: Satellite,
  bookmark: Bookmark,
  navigation: Navigation,
  shield: Shield,
  bug: Bug,
};

interface Slide {
  icon: string;
  titleKey: string;
  bodyKey: string;
  showPingToggle?: boolean;
}

const SLIDES: Slide[] = [
  { icon: "sparkles", titleKey: "US_welcome_title", bodyKey: "US_welcome_body" },
  { icon: "map-pin", titleKey: "US_poi_title", bodyKey: "US_poi_body" },
  { icon: "satellite", titleKey: "US_satellite_title", bodyKey: "US_satellite_body" },
  { icon: "bookmark", titleKey: "US_citymaps_title", bodyKey: "US_citymaps_body" },
  { icon: "navigation", titleKey: "US_navigation_title", bodyKey: "US_navigation_body" },
  { icon: "shield", titleKey: "US_privacy_title", bodyKey: "US_privacy_body", showPingToggle: true },
  { icon: "bug", titleKey: "US_bugfixes_title", bodyKey: "US_bugfixes_body" },
];

interface Props {
  visible: boolean;
  version: string;
  onClose: () => void;
}

export default function UpdateScreen({ visible, version, onClose }: Props) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const pingOn = useAuthStore((s) => s.settings.ping === true);
  const updateSettings = useAuthStore((s) => s.updateSettings);

  const s = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: theme.bg,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingTop: Platform.OS === "ios" ? 60 : 40,
          paddingBottom: 12,
        },
        headerLeft: {
          flexDirection: "row",
          gap: 6,
        },
        headerTitle: {
          fontSize: 13,
          fontFamily: fonts.medium,
          color: theme.subTextColor,
        },
        headerVersion: {
          fontSize: 13,
          fontFamily: fonts.bold,
          color: theme.primary,
        },
        skipBtn: {
          paddingHorizontal: 12,
          paddingVertical: 6,
        },
        skipText: {
          fontSize: 14,
          fontFamily: fonts.semibold,
          color: theme.subTextColor,
        },
        slidesContainer: {
          flex: 1,
        },
        slide: {
          width: SCREEN_WIDTH,
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        },
        iconCircle: {
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: theme.primaryLight,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 32,
        },
        slideTitle: {
          fontSize: 24,
          fontFamily: fonts.bold,
          color: theme.textColor,
          textAlign: "center",
          marginBottom: 12,
        },
        slideBody: {
          fontSize: 15,
          fontFamily: fonts.regular,
          color: theme.subTextColor,
          textAlign: "center",
          lineHeight: 24,
          maxWidth: 320,
        },
        toggleRow: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.cardBgSecondary,
          borderRadius: 16,
          padding: 16,
          gap: 12,
          marginTop: 24,
          width: "100%",
          maxWidth: 320,
        },
        toggleIconWrap: {
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: pingOn
            ? theme.primaryLight
            : "rgba(128,128,128,0.1)",
          alignItems: "center",
          justifyContent: "center",
        },
        toggleText: {
          flex: 1,
        },
        toggleLabel: {
          fontSize: 14,
          fontFamily: fonts.semibold,
          color: theme.textColor,
        },
        toggleSub: {
          fontSize: 12,
          fontFamily: fonts.regular,
          color: theme.subTextColor,
          marginTop: 2,
        },
        footer: {
          paddingHorizontal: 24,
          paddingBottom: Platform.OS === "ios" ? 48 : 32,
          paddingTop: 16,
        },
        progressRow: {
          flexDirection: "row",
          justifyContent: "center",
          gap: 6,
          marginBottom: 20,
        },
        progressDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.borderColor,
        },
        progressDotActive: {
          backgroundColor: theme.primary,
          width: 24,
        },
        progressDotDone: {
          backgroundColor: theme.primary,
        },
        navRow: {
          flexDirection: "row",
          gap: 12,
        },
        navBtn: {
          flex: 1,
          borderRadius: 16,
          paddingVertical: 16,
          alignItems: "center",
          flexDirection: "row",
          gap: 8,
          justifyContent: "center",
        },
        navBtnPrimary: {
          backgroundColor: theme.primary,
        },
        navBtnSecondary: {
          backgroundColor: theme.cardBgSecondary,
        },
        navBtnText: {
          fontFamily: fonts.bold,
          fontSize: 16,
          color: theme.subTextColor,
        },
        navBtnTextPrimary: {
          color: theme.white,
        },
      }),
    [theme, pingOn],
  );

  const isLast = page === SLIDES.length - 1;

  const handleNext = useCallback(() => {
    if (isLast) {
      onClose();
      return;
    }
    const next = page + 1;
    setPage(next);
    scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
  }, [page, isLast, onClose]);

  const handleBack = useCallback(() => {
    if (page === 0) return;
    const prev = page - 1;
    setPage(prev);
    scrollRef.current?.scrollTo({ x: prev * SCREEN_WIDTH, animated: true });
  }, [page]);

  const handleSkip = useCallback(() => {
    onClose();
  }, [onClose]);

  const onScroll = useCallback(
    (e: any) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const newPage = Math.round(offsetX / SCREEN_WIDTH);
      if (newPage !== page) setPage(newPage);
    },
    [page],
  );

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={s.overlay}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>Atlasys</Text>
            <Text style={s.headerVersion}>v{version}</Text>
          </View>
          <TouchableOpacity style={s.skipBtn} onPress={handleSkip}>
            <Text style={s.skipText}>{t("UpdateScreen_skip")}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          scrollEventThrottle={16}
          contentOffset={{ x: 0, y: 0 }}
          style={s.slidesContainer}
        >
          {SLIDES.map((slide, i) => {
            const IconComponent = SLIDE_ICONS[slide.icon] ?? Sparkles;
            return (
              <View key={i} style={s.slide}>
                <View style={s.iconCircle}>
                  <IconComponent size={40} color={theme.primary} />
                </View>
                <Text style={s.slideTitle}>{t(slide.titleKey, { version })}</Text>
                <Text style={s.slideBody}>{t(slide.bodyKey)}</Text>

                {slide.showPingToggle && (
                  <View style={s.toggleRow}>
                    <View style={s.toggleIconWrap}>
                      <Activity
                        size={20}
                        color={pingOn ? theme.primary : theme.subTextColor}
                      />
                    </View>
                    <View style={s.toggleText}>
                      <Text style={s.toggleLabel}>
                        {t("UpdateScreen_ping_label")}
                      </Text>
                      <Text style={s.toggleSub}>
                        {t("UpdateScreen_ping_sub")}
                      </Text>
                    </View>
                    <Switch
                      value={pingOn}
                      onValueChange={(v) => updateSettings({ ping: v })}
                      trackColor={{
                        false: theme.borderColor,
                        true: theme.primaryLight,
                      }}
                      thumbColor={pingOn ? theme.primary : theme.white}
                      ios_backgroundColor={
                        Platform.OS === "ios" ? theme.borderColor : undefined
                      }
                    />
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        <View style={s.footer}>
          <View style={s.progressRow}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  s.progressDot,
                  i === page && s.progressDotActive,
                  i < page && s.progressDotDone,
                ]}
              />
            ))}
          </View>

          <View style={s.navRow}>
            {page > 0 && (
              <TouchableOpacity
                style={[s.navBtn, s.navBtnSecondary]}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <ChevronLeft size={18} color={theme.subTextColor} />
                <Text style={s.navBtnText}>{t("UpdateScreen_back")}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.navBtn, s.navBtnPrimary]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={[s.navBtnText, s.navBtnTextPrimary]}>
                {isLast ? t("UpdateScreen_finish") : t("UpdateScreen_next")}
              </Text>
              {isLast ? (
                <Check size={18} color={theme.white} />
              ) : (
                <ChevronRight size={18} color={theme.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
