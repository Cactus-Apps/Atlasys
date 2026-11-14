import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ChevronRight, Clock, Footprints } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import type { TransitItinerary } from "@/lib/transit/types";
import { getTransitModeMeta } from "@/lib/transit/modeMeta";
import { formatClock, formatTransitDuration } from "@/lib/transit/format";

interface Props {
  itinerary: TransitItinerary;
  selected?: boolean;
  onPress: () => void;
}

export default function TransitItineraryCard({
  itinerary,
  selected = false,
  onPress,
}: Props) {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
  const s = getStyles(theme);
  const locale = i18n.language || "en";

  const transitLegs = itinerary.legs.filter((leg) => !leg.isWalking);
  const walkSeconds = itinerary.legs
    .filter((leg) => leg.isWalking)
    .reduce((sum, leg) => sum + leg.duration, 0);
  const transferLabel =
    itinerary.transfers > 0
      ? t("Route_transit_transfers", { count: itinerary.transfers })
      : t("Route_transit_direct");

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        s.card,
        {
          backgroundColor: selected ? theme.primaryLight : theme.cardBg,
          borderColor: selected ? theme.primary : theme.borderColor,
        },
      ]}
    >
      <View style={s.header}>
        <View style={s.timeRow}>
          <Text style={s.time}>
            {formatClock(itinerary.startTime, locale, itinerary.timeZone)}
          </Text>
          <ChevronRight size={14} color={theme.subTextColor} />
          <Text style={s.time}>
            {formatClock(itinerary.endTime, locale, itinerary.timeZone)}
          </Text>
        </View>
        <View style={s.durationRow}>
          <Clock size={13} color={theme.primary} />
          <Text style={s.duration}>
            {formatTransitDuration(itinerary.duration, t)}
          </Text>
        </View>
      </View>

      <View style={s.metaRow}>
        <Text style={s.meta}>{transferLabel}</Text>
        {walkSeconds > 0 && (
          <View style={s.walkMeta}>
            <Footprints size={12} color={theme.subTextColor} />
            <Text style={s.meta}>{formatTransitDuration(walkSeconds, t)}</Text>
          </View>
        )}
        {itinerary.combinedFromVia && (
          <Text style={[s.meta, s.viaMeta]}>
            {t("Route_transit_via_short")}
          </Text>
        )}
      </View>

      <View style={s.legRow}>
        {transitLegs.map((leg) => {
          const meta = getTransitModeMeta(leg.mode);
          return (
            <View key={leg.id} style={s.legItem}>
              <View style={[s.badge, { backgroundColor: leg.color }]}>
                <Text
                  style={[s.badgeText, { color: leg.textColor || theme.white }]}
                  numberOfLines={1}
                >
                  {leg.line || t(meta.labelKey)}
                </Text>
              </View>
              <ChevronRight size={12} color={theme.subTextColor} />
            </View>
          );
        })}
        {transitLegs.length === 0 && (
          <Text style={s.meta}>{t("Route_transit_walk_only")}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    card: {
      borderWidth: 1.5,
      borderRadius: theme.isModern ? 18 : 14,
      padding: 14,
      marginTop: 10,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    timeRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    time: {
      fontSize: 17,
      fontFamily: fonts.bold,
      color: theme.textColor,
      fontVariant: ["tabular-nums"],
    },
    durationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    duration: {
      fontSize: 13,
      fontFamily: fonts.semibold,
      color: theme.primary,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 4,
    },
    meta: { fontSize: 12, color: theme.subTextColor },
    walkMeta: { flexDirection: "row", alignItems: "center", gap: 3 },
    viaMeta: { color: theme.warning, fontFamily: fonts.semibold },
    legRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      marginTop: 10,
      gap: 2,
    },
    legItem: { flexDirection: "row", alignItems: "center", gap: 2 },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 7,
      maxWidth: 140,
    },
    badgeText: { fontSize: 12, fontFamily: fonts.bold },
  });
