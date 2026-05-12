// components/sheets_modal/PoiSheet.tsx — Atlasys © Cactus Apps 2026
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Share,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import {
  X,
  Route,
  Share2,
  Phone,
  Globe,
  Mail,
  Clock,
  MapPin,
  Accessibility,
  ChefHat,
  Star,
  Info,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "@/lib/theme";
import {
  fetchPOIDetails,
  parseOpeningHours,
  OverpassPOIDetails,
} from "@/lib/geocoding/overpass";

type SelectedPoi = {
  name: string;
  type: string;
  subclass: string;
  osm_id: number;
  lat: number;
  lon: number;
};

type RoutePoint = {
  label: string;
  coordinate: [number, number];
};

interface Props {
  sheetRef: React.RefObject<BottomSheet | null>;
  selectedPoi: SelectedPoi | null;
  snapPoints: string[];
  markerPos: [number, number] | undefined;
  onClose: () => void;
  onRouteStart: (start: RoutePoint | null, end: RoutePoint) => void;
}

// ─── Info-Zeile ───────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  onPress,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
  valueColor?: string;
}) {
  const theme = useAppTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      style={s.infoRow}
    >
      <View style={[s.infoIcon, { backgroundColor: theme.cardBgSecondary }]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.infoLabel, { color: theme.subTextColor }]}>
          {label}
        </Text>
        <Text
          style={[
            s.infoValue,
            { color: valueColor ?? theme.textColor },
            onPress && { textDecorationLine: "underline" },
          ]}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

export default function PoiSheet({
  sheetRef,
  selectedPoi,
  snapPoints,
  markerPos,
  onClose,
  onRouteStart,
}: Props) {
  const theme = useAppTheme();
  const [details, setDetails] = useState<OverpassPOIDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const lastOsmId = useRef<number | null>(null);

  // Overpass-Daten laden wenn POI sich ändert
  useEffect(() => {
    if (!selectedPoi?.osm_id || selectedPoi.osm_id === lastOsmId.current)
      return;
    lastOsmId.current = selectedPoi.osm_id;
    setDetails(null);
    setLoading(true);

    fetchPOIDetails(selectedPoi.osm_id).then((data) => {
      setDetails(data);
      setLoading(false);
    });
  }, [selectedPoi?.osm_id]);

  if (!selectedPoi) return null;

  const openStatus = details?.openingHours
    ? parseOpeningHours(details.openingHours)
    : null;

  const address = [
    details?.street && details?.housenumber
      ? `${details.street} ${details.housenumber}`
      : details?.street,
    details?.postcode && details?.city
      ? `${details.postcode} ${details.city}`
      : details?.city,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={(i) => {
        if (i === -1) onClose();
      }}
      backgroundStyle={{
        borderTopLeftRadius: theme.isModern ? 32 : 24,
        borderTopRightRadius: theme.isModern ? 32 : 24,
        backgroundColor: theme.bg,
      }}
      handleIndicatorStyle={{ backgroundColor: theme.subTextColor, width: 40 }}
    >
      <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            {/* Name */}
            <Text
              style={[s.name, { color: theme.textColor }]}
              numberOfLines={2}
            >
              {selectedPoi.name}
            </Text>

            {/* Kategorie-Badge + Öffnungsstatus */}
            <View style={s.badgeRow}>
              <View style={[s.badge, { backgroundColor: theme.primaryLight }]}>
                <Text style={[s.badgeText, { color: theme.primary }]}>
                  {selectedPoi.subclass || selectedPoi.type}
                </Text>
              </View>

              {openStatus && (
                <View
                  style={[
                    s.badge,
                    { backgroundColor: openStatus.color + "20" },
                  ]}
                >
                  <View
                    style={[s.dot, { backgroundColor: openStatus.color }]}
                  />
                  <Text style={[s.badgeText, { color: openStatus.color }]}>
                    {openStatus.label}
                  </Text>
                </View>
              )}
            </View>

            {/* Beschreibung */}
            {details?.description && (
              <Text style={[s.description, { color: theme.subTextColor }]}>
                {details.description}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={[s.closeBtn, { backgroundColor: theme.cardBgSecondary }]}
          >
            <X size={18} color={theme.subTextColor} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* ── Action Buttons ── */}
        <View style={s.actions}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onRouteStart(
                markerPos
                  ? { label: "Mein Standort", coordinate: markerPos }
                  : null,
                {
                  label: selectedPoi.name,
                  coordinate: [selectedPoi.lon, selectedPoi.lat],
                },
              );
              sheetRef.current?.close();
            }}
            style={[s.primaryBtn, { backgroundColor: theme.primary }]}
          >
            <Route color="#fff" size={20} />
            <Text style={s.primaryBtnText}>Route starten</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const elementType = selectedPoi.osm_id > 0 ? "node" : "way";
              await Share.share({
                message: `${selectedPoi.name}\nhttps://www.openstreetmap.org/${elementType}/${Math.abs(selectedPoi.osm_id)}`,
              });
            }}
            style={[s.iconBtn, { backgroundColor: theme.cardBgSecondary }]}
          >
            <Share2 color={theme.primary} size={20} />
          </TouchableOpacity>

          {details?.phone && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${details.phone}`)}
              style={[s.iconBtn, { backgroundColor: theme.successLight }]}
            >
              <Phone color={theme.success} size={20} />
            </TouchableOpacity>
          )}

          {details?.website && (
            <TouchableOpacity
              onPress={() =>
                Linking.openURL(
                  details.website!.startsWith("http")
                    ? details.website!
                    : `https://${details.website}`,
                )
              }
              style={[s.iconBtn, { backgroundColor: theme.infoLight }]}
            >
              <Globe color={theme.info} size={20} />
            </TouchableOpacity>
          )}
        </View>

        <View style={[s.divider, { backgroundColor: theme.borderColor }]} />

        {/* ── Details laden ── */}
        {loading && (
          <View style={s.loadingRow}>
            <ActivityIndicator color={theme.primary} size="small" />
            <Text style={[s.loadingText, { color: theme.subTextColor }]}>
              Details werden geladen…
            </Text>
          </View>
        )}

        {/* ── Info-Zeilen ── */}
        {!loading && details && (
          <View style={s.infoSection}>
            {/* Öffnungszeiten (vollständig) */}
            {details.openingHours && (
              <InfoRow
                icon={<Clock size={16} color={theme.primary} />}
                label="Öffnungszeiten"
                value={details.openingHours}
                valueColor={openStatus?.color}
              />
            )}

            {/* Adresse */}
            {address ? (
              <InfoRow
                icon={<MapPin size={16} color={theme.primary} />}
                label="Adresse"
                value={address}
                onPress={() =>
                  Linking.openURL(
                    `https://www.openstreetmap.org/?mlat=${selectedPoi.lat}&mlon=${selectedPoi.lon}`,
                  )
                }
              />
            ) : null}

            {/* Telefon */}
            {details.phone && (
              <InfoRow
                icon={<Phone size={16} color={theme.success} />}
                label="Telefon"
                value={details.phone}
                onPress={() => Linking.openURL(`tel:${details.phone}`)}
                valueColor={theme.success}
              />
            )}

            {/* Website */}
            {details.website && (
              <InfoRow
                icon={<Globe size={16} color={theme.info} />}
                label="Website"
                value={details.website.replace(/^https?:\/\//, "")}
                onPress={() =>
                  Linking.openURL(
                    details.website!.startsWith("http")
                      ? details.website!
                      : `https://${details.website}`,
                  )
                }
                valueColor={theme.info}
              />
            )}

            {/* E-Mail */}
            {details.email && (
              <InfoRow
                icon={<Mail size={16} color={theme.purple} />}
                label="E-Mail"
                value={details.email}
                onPress={() => Linking.openURL(`mailto:${details.email}`)}
                valueColor={theme.purple}
              />
            )}

            {/* Küche (Restaurants) */}
            {details.cuisine && (
              <InfoRow
                icon={<ChefHat size={16} color={theme.warning} />}
                label="Küche"
                value={details.cuisine}
              />
            )}

            {/* Sterne (Hotels) */}
            {details.stars && (
              <InfoRow
                icon={<Star size={16} color={theme.warning} />}
                label="Kategorie"
                value={`${"★".repeat(parseInt(details.stars))} (${details.stars} Sterne)`}
              />
            )}

            {/* Rollstuhlzugang */}
            {details.wheelchair && (
              <InfoRow
                icon={<Accessibility size={16} color={theme.info} />}
                label="Barrierefreiheit"
                value={
                  details.wheelchair === "yes"
                    ? "Rollstuhlgerecht"
                    : details.wheelchair === "limited"
                      ? "Eingeschränkt zugänglich"
                      : "Nicht rollstuhlgerecht"
                }
                valueColor={
                  details.wheelchair === "yes"
                    ? theme.success
                    : details.wheelchair === "limited"
                      ? theme.warning
                      : theme.danger
                }
              />
            )}

            {/* Koordinaten */}
            <InfoRow
              icon={<MapPin size={16} color={theme.subTextColor} />}
              label="Koordinaten"
              value={`${selectedPoi.lat.toFixed(5)}, ${selectedPoi.lon.toFixed(5)}`}
            />

            {/* OSM Link */}
            <InfoRow
              icon={<Info size={16} color={theme.subTextColor} />}
              label="Quelle"
              value="OpenStreetMap · Daten bearbeiten"
              onPress={() => {
                const elementType = selectedPoi.osm_id > 0 ? "node" : "way";
                Linking.openURL(
                  `https://www.openstreetmap.org/${elementType}/${Math.abs(selectedPoi.osm_id)}`,
                );
              }}
              valueColor={theme.subTextColor}
            />
          </View>
        )}

        {/* Keine Details verfügbar */}
        {!loading && !details && (
          <Text style={[s.noDetails, { color: theme.subTextColor }]}>
            Keine weiteren Details verfügbar.
          </Text>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
    alignItems: "center",
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
  },
  infoSection: {
    paddingHorizontal: 20,
    gap: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  noDetails: {
    textAlign: "center",
    fontSize: 14,
    paddingVertical: 24,
  },
});
