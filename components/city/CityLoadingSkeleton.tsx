import React, { useEffect, useState } from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  cancelAnimation,
  FadeIn,
  FadeOut,
  type SharedValue,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { useTranslation } from "react-i18next";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;

const MORPH_INTERVAL = 2500;
const TEXT_INTERVAL = 2000;
const SHIMMER_WIDTH = 250;

type SkeletonVariant = "discover" | "transit";

interface CityLoadingSkeletonProps {
  variant: SkeletonVariant;
}

const DISCOVER_MESSAGES = [
  "Loading_searching_landmarks",
  "Loading_finding_gems",
  "Loading_collecting_hours",
  "Loading_enriching_photos",
  "Loading_ranking_spots",
];

const TRANSIT_MESSAGES = [
  "Loading_mapping_subway",
  "Loading_tracing_bus",
  "Loading_finding_tram",
  "Loading_discovering_ferry",
  "Loading_organizing_routes",
];

const DISCOVER_VARIANTS = [
  { badgeW: 70, nameW: 180, hoursW: 120 },
  { badgeW: 90, nameW: 140, hoursW: 100 },
  { badgeW: 55, nameW: 200, hoursW: 150 },
];

const TRANSIT_VARIANTS = [
  { nameW: 50, subW: 130 },
  { nameW: 35, subW: 110 },
  { nameW: 65, subW: 150 },
];

function ShimmerBar({
  width,
  height,
  borderRadius = 6,
  shimmer,
  color,
}: {
  width: number;
  height: number;
  borderRadius?: number;
  shimmer: SharedValue<number>;
  color: string;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmer.value,
          [0, 1],
          [-SHIMMER_WIDTH, CARD_WIDTH + SHIMMER_WIDTH],
        ),
      },
    ],
  }));

  return (
    <View
      style={[
        styles.bar,
        {
          width,
          height,
          borderRadius,
          backgroundColor: color,
          overflow: "hidden",
        },
      ]}
    >
      <Animated.View style={[{ width: SHIMMER_WIDTH, height: "100%" }, style]}>
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.25)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

function DiscoverSkeleton({
  badgeW,
  nameW,
  hoursW,
  shimmer,
  color,
}: {
  badgeW: number;
  nameW: number;
  hoursW: number;
  shimmer: SharedValue<number>;
  color: string;
}) {
  const overlayStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmer.value,
          [0, 1],
          [-SHIMMER_WIDTH, CARD_WIDTH],
        ),
      },
    ],
  }));

  return (
    <View style={[styles.discoverCard, { backgroundColor: color }]}>
      <View style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}>
        <Animated.View
          style={[{ width: SHIMMER_WIDTH, height: "100%" }, overlayStyle]}
        >
          <LinearGradient
            colors={["transparent", "rgba(255,255,255,0.15)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <View style={styles.discoverContent}>
        <ShimmerBar
          width={badgeW}
          height={20}
          borderRadius={10}
          shimmer={shimmer}
          color="rgba(255,255,255,0.15)"
        />
        <ShimmerBar
          width={nameW}
          height={18}
          borderRadius={6}
          shimmer={shimmer}
          color="rgba(255,255,255,0.15)"
        />
        <ShimmerBar
          width={hoursW}
          height={14}
          borderRadius={6}
          shimmer={shimmer}
          color="rgba(255,255,255,0.1)"
        />
      </View>
    </View>
  );
}

function TransitSkeleton({
  nameW,
  subW,
  shimmer,
  color,
}: {
  nameW: number;
  subW: number;
  shimmer: SharedValue<number>;
  color: string;
}) {
  return (
    <View style={[styles.transitItem, { backgroundColor: color }]}>
      <ShimmerBar
        width={24}
        height={24}
        borderRadius={12}
        shimmer={shimmer}
        color={color}
      />
      <View style={styles.transitText}>
        <ShimmerBar
          width={nameW}
          height={14}
          borderRadius={6}
          shimmer={shimmer}
          color={color}
        />
        <ShimmerBar
          width={subW}
          height={12}
          borderRadius={6}
          shimmer={shimmer}
          color={color}
        />
      </View>
    </View>
  );
}

export default function CityLoadingSkeleton({
  variant,
}: CityLoadingSkeletonProps) {
  const theme = useAppTheme();
  const { t } = useTranslation();

  const [variantIdx, setVariantIdx] = useState(0);
  const [textIdx, setTextIdx] = useState(0);

  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(shimmer);
  }, [shimmer]);

  useEffect(() => {
    const count =
      variant === "discover"
        ? DISCOVER_VARIANTS.length
        : TRANSIT_VARIANTS.length;
    const id = setInterval(
      () => setVariantIdx((i) => (i + 1) % count),
      MORPH_INTERVAL,
    );
    return () => clearInterval(id);
  }, [variant]);

  useEffect(() => {
    const count =
      variant === "discover"
        ? DISCOVER_MESSAGES.length
        : TRANSIT_MESSAGES.length;
    const id = setInterval(
      () => setTextIdx((i) => (i + 1) % count),
      TEXT_INTERVAL,
    );
    return () => clearInterval(id);
  }, [variant]);

  const messages =
    variant === "discover" ? DISCOVER_MESSAGES : TRANSIT_MESSAGES;
  const skelColor = theme.isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(0,0,0,0.06)";

  return (
    <View style={styles.container}>
      <View style={styles.skeletonArea}>
        <Animated.View
          key={variantIdx}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
        >
          {variant === "discover" ? (
            <DiscoverSkeleton
              {...DISCOVER_VARIANTS[variantIdx]}
              shimmer={shimmer}
              color={skelColor}
            />
          ) : (
            <TransitSkeleton
              {...TRANSIT_VARIANTS[variantIdx]}
              shimmer={shimmer}
              color={skelColor}
            />
          )}
        </Animated.View>
      </View>

      <View style={styles.textArea}>
        <Animated.View
          key={textIdx}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
        >
          <Text style={[styles.loadingText, { color: theme.subTextColor }]}>
            {t(messages[textIdx])}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  skeletonArea: {
    width: CARD_WIDTH,
    marginBottom: 20,
  },
  bar: {},
  discoverCard: {
    width: CARD_WIDTH,
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
  },
  discoverContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingTop: 40,
    paddingBottom: 12,
    gap: 6,
  },
  transitItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 4,
  },
  transitText: {
    marginLeft: 12,
    gap: 6,
  },
  textArea: {
    alignItems: "center",
    minHeight: 20,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    textAlign: "center",
  },
});
