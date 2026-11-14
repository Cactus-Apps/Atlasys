import React from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Clock, ExternalLink, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { TRANSIT_ATTRIBUTION_URL } from "@/lib/transit/config";
import { getTransitModeMeta } from "@/lib/transit/modeMeta";
import {
  formatClock,
  formatTransitDistance,
  formatTransitDuration,
} from "@/lib/transit/format";
import type { TransitItinerary, TransitLeg } from "@/lib/transit/types";

interface Props {
  visible: boolean;
  itinerary: TransitItinerary | null;
  onClose: () => void;
}

export default function TransitItineraryDetails({
  visible,
  itinerary,
  onClose,
}: Props) {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
  const s = getStyles(theme);
  const locale = i18n.language || "en";

  if (!itinerary) return null;

  const transferLabel =
    itinerary.transfers > 0
      ? t("Route_transit_transfers", { count: itinerary.transfers })
      : t("Route_transit_direct");

  const renderLeg = (leg: TransitLeg, index: number) => {
    const isLast = index === itinerary.legs.length - 1;
    const meta = getTransitModeMeta(leg.mode);
    const Icon = meta.icon;
    const platform = leg.from.platform || leg.from.track;
    const stopCount = leg.intermediateStops.length;

    return (
      <View key={leg.id} style={s.legRow}>
        <View style={s.timelineCol}>
          <View style={[s.dot, { backgroundColor: leg.color }]} />
          {!isLast && <View style={s.timelineLine} />}
        </View>

        <View style={s.legContent}>
          <View style={s.legHeader}>
            <View style={[s.legIcon, { backgroundColor: `${leg.color}22` }]}>
              <Icon size={16} color={leg.color} />
            </View>
            {leg.isWalking ? (
              <Text style={s.legTitle}>
                {t("Route_transit_walk_leg", {
                  duration: formatTransitDuration(leg.duration, t),
                })}
                {leg.distance > 0
                  ? ` · ${formatTransitDistance(leg.distance)}`
                  : ""}
              </Text>
            ) : (
              <>
                <View style={[s.badge, { backgroundColor: leg.color }]}>
                  <Text
                    style={[
                      s.badgeText,
                      { color: leg.textColor || theme.white },
                    ]}
                  >
                    {leg.line || t(meta.labelKey)}
                  </Text>
                </View>
                {!!leg.headsign && (
                  <Text style={s.headsign} numberOfLines={1}>
                    {leg.headsign}
                  </Text>
                )}
              </>
            )}
          </View>

          <View style={s.stopRow}>
            <Text style={s.legTime}>
              {formatClock(leg.startTime, locale, itinerary.timeZone)}
            </Text>
            <Text style={s.stopName} numberOfLines={2}>
              {leg.from.name || t("Route_transit_unknown_stop")}
            </Text>
          </View>
          {!!platform && (
            <Text style={s.subText}>
              {t("Route_transit_platform", { platform })}
            </Text>
          )}
          {leg.agency && <Text style={s.subText}>{leg.agency}</Text>}
          {!leg.isWalking && stopCount > 0 && (
            <Text style={s.subText}>
              {t("Route_transit_stops", { count: stopCount })}
            </Text>
          )}

          <View style={[s.stopRow, s.stopRowEnd]}>
            <Text style={s.legTime}>
              {formatClock(leg.endTime, locale, itinerary.timeZone)}
            </Text>
            <Text style={s.stopName} numberOfLines={2}>
              {leg.to.name || t("Route_transit_unknown_stop")}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            s.sheet,
            { backgroundColor: theme.bg, borderColor: theme.borderColor },
          ]}
        >
          <View style={s.handle} />
          <View style={s.header}>
            <View>
              <Text style={s.title}>{t("Route_transit_details_title")}</Text>
              <View style={s.summaryRow}>
                <Clock size={13} color={theme.subTextColor} />
                <Text style={s.summaryText}>
                  {formatClock(itinerary.startTime, locale, itinerary.timeZone)}
                  {" – "}
                  {formatClock(itinerary.endTime, locale, itinerary.timeZone)}
                  {" · "}
                  {formatTransitDuration(itinerary.duration, t)}
                  {" · "}
                  {transferLabel}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <X size={18} color={theme.subTextColor} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {itinerary.legs.map(renderLeg)}

            {itinerary.combinedFromVia && (
              <View style={s.viaWarning}>
                <Text style={s.viaWarningText}>
                  {t("Route_transit_via_warning")}
                </Text>
              </View>
            )}

            <View style={s.footer}>
              <Text style={s.planningNote}>
                {t("Route_transit_planning_only")}
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(TRANSIT_ATTRIBUTION_URL)}
                style={s.attribution}
              >
                <Text style={s.attributionText}>
                  {t("Route_transit_attribution")}
                </Text>
                <ExternalLink size={12} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: theme.overlay,
    },
    sheet: {
      maxHeight: "86%",
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1,
      paddingTop: 8,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.subTextColor,
      opacity: 0.4,
      marginBottom: 8,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    title: { fontSize: 19, fontFamily: fonts.bold, color: theme.textColor },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 4,
      flexWrap: "wrap",
    },
    summaryText: { fontSize: 12, color: theme.subTextColor },
    closeBtn: {
      backgroundColor: theme.cardBgSecondary,
      borderRadius: 16,
      padding: 6,
    },
    scroll: { paddingHorizontal: 20 },
    scrollContent: { paddingBottom: 32 },
    legRow: { flexDirection: "row", gap: 10 },
    timelineCol: { width: 14, alignItems: "center" },
    dot: { width: 12, height: 12, borderRadius: 6, marginTop: 6 },
    timelineLine: {
      width: 2,
      flex: 1,
      backgroundColor: theme.borderColor,
      marginVertical: 2,
    },
    legContent: { flex: 1, paddingBottom: 18 },
    legHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 6,
    },
    legIcon: {
      width: 30,
      height: 30,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    legTitle: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      color: theme.textColor,
      flex: 1,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 7,
      maxWidth: 120,
    },
    badgeText: { fontSize: 12, fontFamily: fonts.bold },
    headsign: {
      flex: 1,
      fontSize: 13,
      color: theme.textColor,
      fontFamily: fonts.medium,
    },
    stopRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
    stopRowEnd: { marginTop: 6 },
    legTime: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: theme.textColor,
      fontVariant: ["tabular-nums"],
      minWidth: 42,
    },
    stopName: {
      flex: 1,
      fontSize: 13,
      color: theme.textColor,
      fontFamily: fonts.medium,
    },
    subText: {
      fontSize: 12,
      color: theme.subTextColor,
      marginLeft: 50,
      marginTop: 2,
    },
    viaWarning: {
      backgroundColor: theme.warningLight,
      borderRadius: 12,
      padding: 12,
      marginTop: 4,
    },
    viaWarningText: { fontSize: 12, color: theme.warningDark },
    footer: {
      marginTop: 16,
      paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.borderColor,
      gap: 8,
    },
    planningNote: { fontSize: 12, color: theme.subTextColor },
    attribution: { flexDirection: "row", alignItems: "center", gap: 5 },
    attributionText: {
      fontSize: 12,
      fontFamily: fonts.semibold,
      color: theme.primary,
    },
  });
