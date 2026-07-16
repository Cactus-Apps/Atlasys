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
import {
  Landmark,
  Star,
  Compass,
  UtensilsCrossed,
  Church,
  Bus,
  RailSymbol,
  TramFront,
  TrainFront,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;

const CYCLE_INTERVAL = 3000;
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

interface DiscoverCardData {
  color: string;
  icon: React.ReactNode;
  nameW: number;
  subW: number;
}

interface TransitCardData {
  ref: string;
  name: string;
  color: string;
  icon: React.ReactNode;
}

const DISCOVER_CARDS: DiscoverCardData[][] = [
  [
    { color: "#8B4513", icon: <Landmark size={16} color="#8B4513" />, nameW: 120, subW: 60 },
    { color: "#E8751A", icon: <Star size={16} color="#E8751A" />, nameW: 140, subW: 50 },
    { color: "#DAA520", icon: <Compass size={16} color="#DAA520" />, nameW: 100, subW: 70 },
  ],
  [
    { color: "#8B5CF6", icon: <Compass size={16} color="#8B5CF6" />, nameW: 130, subW: 55 },
    { color: "#B91C1C", icon: <Landmark size={16} color="#B91C1C" />, nameW: 110, subW: 65 },
    { color: "#7C3AED", icon: <Star size={16} color="#7C3AED" />, nameW: 150, subW: 45 },
  ],
  [
    { color: "#059669", icon: <Compass size={16} color="#059669" />, nameW: 90, subW: 75 },
    { color: "#C94B32", icon: <Church size={16} color="#C94B32" />, nameW: 135, subW: 50 },
    { color: "#E8751A", icon: <UtensilsCrossed size={16} color="#E8751A" />, nameW: 115, subW: 60 },
  ],
];

const TRANSIT_CARDS: TransitCardData[][] = [
  [
    { ref: "U1", name: "U-Bahn Linie U1", color: "#3B82F6", icon: <RailSymbol size={14} color="#fff" /> },
    { ref: "100", name: "Bus Linie 100", color: "#EF4444", icon: <Bus size={14} color="#fff" /> },
    { ref: "M10", name: "Tram M10", color: "#10B981", icon: <TramFront size={14} color="#fff" /> },
  ],
  [
    { ref: "U2", name: "U-Bahn Linie U2", color: "#3B82F6", icon: <RailSymbol size={14} color="#fff" /> },
    { ref: "200", name: "Bus Linie 200", color: "#EF4444", icon: <Bus size={14} color="#fff" /> },
    { ref: "S41", name: "S-Bahn Ring", color: "#F59E0B", icon: <TrainFront size={14} color="#fff" /> },
  ],
  [
    { ref: "U8", name: "U-Bahn Linie U8", color: "#3B82F6", icon: <RailSymbol size={14} color="#fff" /> },
    { ref: "M13", name: "Tram M13", color: "#10B981", icon: <TramFront size={14} color="#fff" /> },
    { ref: "300", name: "Bus Linie 300", color: "#EF4444", icon: <Bus size={14} color="#fff" /> },
  ],
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
          colors={["transparent", "rgba(255,255,255,0.3)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

function DiscoverSkeletonItem({
  card,
  shimmer,
  index,
  skelColor,
}: {
  card: DiscoverCardData;
  shimmer: SharedValue<number>;
  index: number;
  skelColor: string;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(400).delay(index * 100)}
      exiting={FadeOut.duration(300)}
      style={[styles.discoverItem, { backgroundColor: skelColor }]}
    >
      <View style={[styles.discoverIcon, { backgroundColor: card.color + "18" }]}>
        {card.icon}
      </View>
      <View style={styles.discoverText}>
        <ShimmerBar
          width={card.nameW}
          height={12}
          borderRadius={4}
          shimmer={shimmer}
          color={card.color + "20"}
        />
        <ShimmerBar
          width={card.subW}
          height={10}
          borderRadius={4}
          shimmer={shimmer}
          color={card.color + "12"}
        />
      </View>
      <View style={styles.discoverTrailing}>
        <View style={[styles.discoverStars]}>
          <Star size={8} color={card.color + "40"} fill={card.color + "40"} />
          <Star size={8} color={card.color + "40"} fill={card.color + "40"} />
          <Star size={8} color={card.color + "40"} fill={card.color + "40"} />
        </View>
      </View>
    </Animated.View>
  );
}

function TransitSkeletonItem({
  card,
  shimmer,
  index,
  skelColor,
}: {
  card: TransitCardData;
  shimmer: SharedValue<number>;
  index: number;
  skelColor: string;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(400).delay(index * 100)}
      exiting={FadeOut.duration(300)}
      style={[styles.transitItem, { backgroundColor: skelColor }]}
    >
      <View style={[styles.transitDot, { backgroundColor: card.color }]}>
        {card.icon}
      </View>
      <View style={styles.transitText}>
        <View style={styles.transitRefRow}>
          <View
            style={[styles.transitRefBadge, { backgroundColor: card.color }]}
          >
            <Text style={styles.transitRefText}>{card.ref}</Text>
          </View>
          <ShimmerBar
            width={80 + index * 30}
            height={12}
            borderRadius={4}
            shimmer={shimmer}
            color={card.color + "20"}
          />
        </View>
      </View>
      <View style={styles.transitTrailing}>
        <ShimmerBar
          width={40}
          height={10}
          borderRadius={4}
          shimmer={shimmer}
          color={card.color + "15"}
        />
      </View>
    </Animated.View>
  );
}

export default function CityLoadingSkeleton({
  variant,
}: CityLoadingSkeletonProps) {
  const theme = useAppTheme();
  const { t } = useTranslation();

  const [cycleIdx, setCycleIdx] = useState(0);
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
    const id = setInterval(() => {
      setCycleIdx((i) => (i + 1) % 3);
    }, CYCLE_INTERVAL);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const count =
      variant === "discover"
        ? DISCOVER_MESSAGES.length
        : TRANSIT_MESSAGES.length;
    const id = setInterval(() => setTextIdx((i) => (i + 1) % count), 2000);
    return () => clearInterval(id);
  }, [variant]);

  const messages =
    variant === "discover" ? DISCOVER_MESSAGES : TRANSIT_MESSAGES;
  const skelColor = theme.isDark
    ? "rgba(255,255,255,0.06)"
    : "rgba(0,0,0,0.04)";

  return (
    <View style={styles.container}>
      <View style={styles.skeletonArea}>
        {variant === "discover" ? (
          <View style={styles.discoverStack}>
            {DISCOVER_CARDS[cycleIdx].map((card, i) => (
              <DiscoverSkeletonItem
                key={`${cycleIdx}-${i}`}
                card={card}
                shimmer={shimmer}
                index={i}
                skelColor={skelColor}
              />
            ))}
          </View>
        ) : (
          <View style={styles.transitStack}>
            {TRANSIT_CARDS[cycleIdx].map((card, i) => (
              <TransitSkeletonItem
                key={`${cycleIdx}-${i}`}
                card={card}
                shimmer={shimmer}
                index={i}
                skelColor={skelColor}
              />
            ))}
          </View>
        )}
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
  discoverStack: {
    gap: 6,
  },
  discoverItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  discoverIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  discoverText: {
    marginLeft: 12,
    flex: 1,
    gap: 4,
  },
  discoverTrailing: {
    marginLeft: 8,
  },
  discoverStars: {
    flexDirection: "row",
    gap: 2,
  },
  transitStack: {
    gap: 6,
  },
  transitItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  transitDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  transitText: {
    marginLeft: 12,
    flex: 1,
    gap: 3,
  },
  transitRefRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  transitRefBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  transitRefText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  transitTrailing: {
    marginLeft: 8,
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
