import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Modal,
} from "react-native";
import { useAppTheme } from "@/lib/theme";
import * as Sentry from "@sentry/react-native";
import {
  Trash2,
  Map,
  HardDrive,
  WifiOff,
  ChevronLeft,
} from "lucide-react-native";
import Svg, { Circle, G } from "react-native-svg";
import { getTotalDiskCapacityAsync } from "expo-file-system/legacy";
import { listMBTiles, deleteMBTiles, MBTilesInfo } from "@/lib/storage/mbtiles";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

function StorageRing({
  usedBytes,
  totalBytes,
}: {
  usedBytes: number;
  totalBytes: number;
}) {
  const theme = useAppTheme();
  const dark = theme.isDark;

  const size = 180;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const referenceBytes = Math.min(totalBytes * 0.1, 10 * 1024 * 1024 * 1024);
  const percent = Math.min(usedBytes / referenceBytes, 1);
  const usedDash = Math.max(percent * circumference, percent > 0 ? 8 : 0);
  const gapDash = circumference - usedDash;

  const color =
    percent > 0.8 ? "#EF4444" : percent > 0.5 ? "#F59E0B" : "#3B82F6";
  const trackColor = dark ? "#1E293B" : "#F1F5F9";

  const usedMB = usedBytes / 1024 / 1024;
  const usedLabel =
    usedMB < 1000
      ? `${usedMB.toFixed(usedMB < 1 ? 2 : 1)} MB`
      : `${(usedMB / 1024).toFixed(2)} GB`;

  return (
    <View style={{ alignItems: "center", paddingVertical: 8 }}>
      <View
        style={{
          width: size,
          height: size,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={trackColor}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${usedDash} ${gapDash}`}
              strokeLinecap="round"
            />
          </G>
        </Svg>
        <View style={{ position: "absolute", alignItems: "center", gap: 2 }}>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "800",
              color: dark ? "#F8FAFC" : "#0F172A",
              letterSpacing: -1,
            }}
          >
            {usedLabel}
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: dark ? "#64748B" : "#94A3B8",
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            Offline Maps
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              marginTop: 2,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: color,
              }}
            />
            <Text style={{ fontSize: 11, color: color, fontWeight: "700" }}>
              {Math.round(percent * 100)}% von 10 GB
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function EmptyState({ dark }: { dark: boolean }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 48,
        gap: 16,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          backgroundColor: dark ? "#1E293B" : "#F1F5F9",
          justifyContent: "center",
          alignItems: "center",
          elevation: 3,
        }}
      >
        <WifiOff size={36} color={dark ? "#334155" : "#CBD5E1"} />
      </View>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "800",
          color: dark ? "#F8FAFC" : "#0F172A",
          letterSpacing: -0.5,
        }}
      >
        No offline maps
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: dark ? "#64748B" : "#94A3B8",
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Open the map and tap the download icon to save a region for offline use
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: theme.primary,
          borderRadius: 14,
          paddingVertical: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          paddingHorizontal: 30,
          elevation: 3,
        }}
        onPress={() => router.push("/(tabs)/mapscreen")}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "800",
            color: theme.white,
            letterSpacing: -0.5,
          }}
        >
          Go to Map
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function OfflineMapsTab() {
  const theme = useAppTheme();
  const dark = theme.isDark;
  const [maps, setMaps] = useState<MBTilesInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBytes, setTotalBytes] = useState(64 * 1024 * 1024 * 1024);
  const [ModalVisible, setModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const load = async () => {
    const result = await listMBTiles();
    setMaps(result);
    setLoading(false);
    try {
      const total = await getTotalDiskCapacityAsync();
      if (total) setTotalBytes(total);
    } catch {
      (err: any) => Sentry.captureException(err);
    }
  };

  useEffect(() => {
    load();

    import("expo-file-system/legacy").then(({ readDirectoryAsync }) => {
      const dir =
        require("expo-file-system/legacy").documentDirectory + "mbtiles/";
      readDirectoryAsync(dir).catch((err) => Sentry.captureException(err));
    });
  }, []);

  const totalUsedBytes = maps.reduce((sum, m) => sum + m.size, 0);

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const deleteMBTilesfunction = async () => {
    if (deleteTarget) {
      await deleteMBTiles(deleteTarget.id);
      setDeleteTarget(null);
      load();
    }
  };

  const bg = theme.bg;
  const cardBg = theme.cardBg;
  const border = theme.borderColor;
  const textPrimary = theme.textColor;
  const textSecondary = theme.subTextColor;
  const iconBg = theme.iconBg;
  const defaultRadius = theme.isModern ? 24 : 20;
  const innerRadius = theme.isModern ? 18 : 16;
  const itemRadius = theme.isModern ? 14 : 12;
  const danger = theme.danger;
  const overlay = theme.overlay;

  const AlertDialogOverlay = (
    <Modal
      visible={deleteTarget !== null}
      transparent
      animationType="fade"
      onRequestClose={() => setModalVisible(false)}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: overlay,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: "85%",
            backgroundColor: cardBg,
            borderRadius: defaultRadius,
            padding: 24,
            borderWidth: 1,
            borderColor: border,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: textPrimary,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            Karte löschen
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: textSecondary,
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 22,
            }}
          >{`Möchtest du "${deleteTarget?.name}" wirklich löschen?`}</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={deleteMBTilesfunction}
              style={{
                flex: 1,
                backgroundColor: danger,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "700", color: textPrimary }}
              >
                Löschen
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{
                flex: 1,
                backgroundColor: theme.cardBgSecondary,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "700", color: textPrimary }}
              >
                Abbrechen
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (!loading && maps.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, paddingTop: 30 }}>
        {AlertDialogOverlay}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => router.navigate("/(tabs)/profilescreen")}
            style={{ padding: 8 }}
          >
            <ChevronLeft size={24} color={theme.textColor} />
          </TouchableOpacity>
          <Text
            style={{ fontSize: 18, fontWeight: "700", color: theme.textColor }}
          >
            Offline Maps
          </Text>
          <View style={{ width: 44 }} />
        </View>
        <EmptyState dark={dark} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: 30 }}>
      {AlertDialogOverlay}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.navigate("/(tabs)/profilescreen")}
          style={{ padding: 8 }}
        >
          <ChevronLeft size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text
          style={{ fontSize: 18, fontWeight: "700", color: theme.textColor }}
        >
          Offline Maps
        </Text>
        <View style={{ width: 44 }} />
      </View>
      <FlatList
        data={maps}
        keyExtractor={(item) => item.id}
        style={{ backgroundColor: bg }}
        contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 8 }}>
            <View
              style={{
                backgroundColor: cardBg,
                borderRadius: defaultRadius,
                padding: 20,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: border,
                shadowColor: "#000",
                shadowOpacity: theme.isModern ? (dark ? 0 : 0.06) : 0,
                shadowRadius: theme.isModern ? 12 : 0,
                elevation: theme.isModern ? 4 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: textSecondary,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                Storage Usage
              </Text>
              <StorageRing usedBytes={totalUsedBytes} totalBytes={totalBytes} />
              <View
                style={{
                  flexDirection: "row",
                  marginTop: 4,
                  borderTopWidth: 1,
                  borderTopColor: border,
                  paddingTop: 16,
                  gap: 0,
                }}
              >
                {[
                  { label: "Maps", value: String(maps.length) },
                  {
                    label: "Total Tiles",
                    value: maps
                      .reduce((s, m) => s + m.tileCount, 0)
                      .toLocaleString(),
                  },
                  { label: "Size", value: formatSize(totalUsedBytes) },
                ].map((stat, i) => (
                  <View key={i} style={{ flex: 1, alignItems: "center" }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "800",
                        color: textPrimary,
                        letterSpacing: -0.5,
                      }}
                    >
                      {stat.value}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: textSecondary,
                        marginTop: 2,
                        fontWeight: "500",
                      }}
                    >
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: textSecondary,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Downloaded Regions
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: innerRadius,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              borderWidth: 1,
              borderColor: border,
              shadowColor: "#000",
              shadowOpacity: theme.isModern ? (dark ? 0 : 0.04) : 0,
              shadowRadius: theme.isModern ? 8 : 0,
              elevation: theme.isModern ? 2 : 0,
            }}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: itemRadius,
                backgroundColor: iconBg,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Map size={22} color="#3B82F6" />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{ fontSize: 15, fontWeight: "700", color: textPrimary }}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <View
                  style={{
                    backgroundColor: dark ? "#0F2847" : "#EFF6FF",
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#3B82F6",
                      fontWeight: "700",
                    }}
                  >
                    z{item.minZoom}–{item.maxZoom}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: dark ? "#1A2B1A" : "#F0FDF4",
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <HardDrive size={10} color="#22C55E" />
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#22C55E",
                      fontWeight: "700",
                    }}
                  >
                    {formatSize(item.size)}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: textSecondary }}>
                {item.tileCount.toLocaleString()} tiles ·{" "}
                {formatDate(item.createdAt)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(item.id, item.name)}
              style={{
                width: 38,
                height: 38,
                borderRadius: itemRadius,
                backgroundColor: dark ? "rgba(239, 68, 68, 0.1)" : "#FEF2F2",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Trash2 size={17} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
