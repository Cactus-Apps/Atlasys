import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
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
  Download,
  Upload,
  MapPin,
} from "lucide-react-native";
import Svg, { Circle, G } from "react-native-svg";
import { getTotalDiskCapacityAsync } from "expo-file-system/legacy";
import { fonts } from "@/lib/fonts";
import { listMBTiles, deleteMBTiles, MBTilesInfo } from "@/lib/storage/mbtiles";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/lib/storage/zustand";
import {
  exportMarkersToFile,
  importMarkersFromFile,
  BackupTooLargeError,
} from "@/lib/storage/markerBackupFile";

function StorageRing({
  usedBytes,
  totalBytes,
}: {
  usedBytes: number;
  totalBytes: number;
}) {
  const theme = useAppTheme();
  const { t } = useTranslation();
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
              fontFamily: fonts.bold,
              color: dark ? "#F8FAFC" : "#0F172A",
              letterSpacing: -1,
            }}
          >
            {usedLabel}
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontFamily: fonts.semibold,
              color: dark ? "#64748B" : "#94A3B8",
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            {t("Storage_title")}
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
            <Text
              style={{ fontSize: 11, color: color, fontFamily: fonts.bold }}
            >
              {Math.round(percent * 100)}% {t("Storage_of_10gb")}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function BackupCard({
  count,
  busy,
  onExport,
  onImport,
}: {
  count: number;
  busy: boolean;
  onExport: () => void;
  onImport: () => void;
}) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const dark = theme.isDark;
  const cardBg = theme.cardBg;
  const border = theme.borderColor;
  const itemRadius = theme.isModern ? 14 : 12;

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: theme.isModern ? 24 : 20,
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
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: itemRadius,
            backgroundColor: theme.iconBg,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <MapPin size={22} color="#3B82F6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontFamily: fonts.bold,
              color: theme.textColor,
            }}
          >
            {t("Backup_title")}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: theme.subTextColor,
              marginTop: 2,
            }}
          >
            {t("Backup_sub", { count })}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        <TouchableOpacity
          onPress={onExport}
          disabled={busy}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 13,
            borderRadius: itemRadius,
            backgroundColor: theme.primary,
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Download size={18} color={theme.white} />
          <Text
            style={{
              fontSize: 14,
              fontFamily: fonts.bold,
              color: theme.white,
            }}
          >
            {t("Backup_export")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onImport}
          disabled={busy}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 13,
            borderRadius: itemRadius,
            backgroundColor: theme.cardBgSecondary,
            borderWidth: 1,
            borderColor: border,
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Upload size={18} color={theme.textColor} />
          <Text
            style={{
              fontSize: 14,
              fontFamily: fonts.bold,
              color: theme.textColor,
            }}
          >
            {t("Backup_import")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyState({ dark }: { dark: boolean }) {
  const theme = useAppTheme();
  const { t } = useTranslation();

  return (
    <View
      style={{
        alignItems: "center",
        paddingVertical: 48,
        paddingHorizontal: 48,
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
          fontFamily: fonts.bold,
          color: dark ? "#F8FAFC" : "#0F172A",
          letterSpacing: -0.5,
        }}
      >
        {t("Storage_empty")}
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
            fontFamily: fonts.bold,
            color: theme.white,
            letterSpacing: -0.5,
          }}
        >
          {t("Go_to_Map")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function Storage() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const dark = theme.isDark;
  const [maps, setMaps] = useState<MBTilesInfo[]>([]);
  const [totalBytes, setTotalBytes] = useState(64 * 1024 * 1024 * 1024);
  const [, setModalVisible] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [alertBox, setAlertBox] = useState<{
    message: string;
  } | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);

  const customCount = useAuthStore((s) => s.customPlaces.length);

  const handleExport = async () => {
    if (backupBusy) return;
    const places = useAuthStore.getState().customPlaces;
    if (places.length === 0) {
      setAlertBox({ message: t("Backup_empty") });
      return;
    }
    try {
      setBackupBusy(true);
      await exportMarkersToFile(places);
      setAlertBox({
        message: t("Backup_exported", { count: places.length }),
      });
    } catch (err) {
      Sentry.captureException(err);
      setAlertBox({ message: t("Backup_error") });
    } finally {
      setBackupBusy(false);
    }
  };

  const handleImport = async () => {
    if (backupBusy) return;
    try {
      setBackupBusy(true);
      const { places, errors, canceled } = await importMarkersFromFile();
      if (canceled) return;
      if (places.length === 0) {
        setAlertBox({ message: t("Backup_error") });
        return;
      }
      const { added, updated } = useAuthStore
        .getState()
        .importCustomPlaces(places);
      const skipSuffix =
        errors > 0
          ? t("Backup_imported_skip", { count: errors })
          : "";
      setAlertBox({
        message:
          t("Backup_imported", { added, updated }) + skipSuffix,
      });
    } catch (err) {
      Sentry.captureException(err);
      setAlertBox({
        message: err instanceof BackupTooLargeError
          ? t("Backup_too_large")
          : t("Backup_error"),
      });
    } finally {
      setBackupBusy(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const load = async () => {
    const result = await listMBTiles();
    setMaps(result);
    try {
      const total = await getTotalDiskCapacityAsync();
      if (total) setTotalBytes(total);
    } catch (err: any) {
      Sentry.captureException(err);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => load());

    import("expo-file-system/legacy").then(({ readDirectoryAsync }) => {
      const dir =
        // eslint-disable-next-line @typescript-eslint/no-require-imports
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
      onRequestClose={() => setModalVisible(null)}
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
              fontFamily: fonts.bold,
              color: textPrimary,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            {t("Offline_delete_map_title")}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: textSecondary,
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 22,
            }}
          >
            {t("Offline_delete_map_confirm", {
              name: deleteTarget?.name ?? "",
            })}
          </Text>
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
                style={{
                  fontSize: 16,
                  fontFamily: fonts.bold,
                  color: textPrimary,
                }}
              >
                {t("Delete")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalVisible(null)}
              style={{
                flex: 1,
                backgroundColor: theme.cardBgSecondary,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: fonts.bold,
                  color: textPrimary,
                }}
              >
                {t("Cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const CustomAlertOverlay = (
    <Modal
      visible={alertBox !== null}
      transparent
      animationType="fade"
      onRequestClose={() => setAlertBox(null)}
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
              fontSize: 16,
              color: textSecondary,
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 22,
            }}
          >
            {alertBox?.message}
          </Text>
          <TouchableOpacity
            onPress={() => setAlertBox(null)}
            style={{
              backgroundColor: theme.primary,
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: fonts.bold,
                color: theme.white,
              }}
            >
              {t("OK")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: 30 }}>
      {AlertDialogOverlay}
      {CustomAlertOverlay}
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
          style={{
            fontSize: 18,
            fontFamily: fonts.bold,
            color: theme.textColor,
          }}
        >
          {t("Storage_title")}
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
            <BackupCard
              count={customCount}
              busy={backupBusy}
              onExport={handleExport}
              onImport={handleImport}
            />

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
                  fontFamily: fonts.bold,
                  color: textSecondary,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                {t("Storage_usage")}
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
                  { label: t("Storage_maps"), value: String(maps.length) },
                  {
                    label: t("Storage_total_tiles"),
                    value: maps
                      .reduce((s, m) => s + m.tileCount, 0)
                      .toLocaleString(),
                  },
                  { label: t("Storage_size"), value: formatSize(totalUsedBytes) },
                ].map((stat, i) => (
                  <View key={i} style={{ flex: 1, alignItems: "center" }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontFamily: fonts.bold,
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
                        fontFamily: fonts.medium,
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
                fontFamily: fonts.bold,
                color: textSecondary,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              {t("Storage_downloaded_regions")}
            </Text>
          </View>
        }
        ListEmptyComponent={<EmptyState dark={dark} />}
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
                style={{
                  fontSize: 15,
                  fontFamily: fonts.bold,
                  color: textPrimary,
                }}
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
                      fontFamily: fonts.bold,
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
                      fontFamily: fonts.bold,
                    }}
                  >
                    {formatSize(item.size)}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: textSecondary }}>
                {item.tileCount.toLocaleString()} {t("Storage_tiles")} ·{" "}
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
