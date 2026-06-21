import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Download, X, AlertTriangle } from "lucide-react-native";
import { tilesForBounds, estimateSizeMB } from "@/lib/storage/mbtiles";
import { downloadRegion } from "@/lib/storage/downloadTiles";
import { useAppTheme } from "@/lib/theme";
import { reverseGeocode } from "@/lib/geocoding/geocoding";
import { useTranslation } from "react-i18next";
import CircularProgress from "../overlays/CircularWavyProgressIndicator";
import { posthog } from "@/lib/config/posthog";

interface Props {
  open: boolean;
  bounds: [number, number, number, number] | null;
  onClose: () => void;
  onDownloadComplete: () => void;
}

function ZoomStepper({
  label,
  value,
  min,
  max,
  onChange,
  color,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  color: string;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
        borderWidth: 1,
        borderRadius: theme.isModern ? 16 : 12,
        padding: 14,
        marginBottom: 10,
      }}
    >
      <View>
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: theme.subTextColor,
            letterSpacing: 0.5,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: theme.textColor,
            marginTop: 2,
          }}
        >
          {value}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor:
              value <= min
                ? theme.iconBg
                : color + (theme.isDark ? "40" : "20"),
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "300",
              color: value <= min ? theme.subTextColor : color,
            }}
          >
            −
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", gap: 3 }}>
          {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((i) => (
            <TouchableOpacity key={i} onPress={() => onChange(i)}>
              <View
                style={{
                  width: i === value ? 10 : 6,
                  height: i === value ? 10 : 6,
                  borderRadius: 5,
                  backgroundColor:
                    i === value
                      ? color
                      : i < value
                        ? color + "40"
                        : theme.borderColor,
                  marginTop: i === value ? 0 : 2,
                }}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor:
              value >= max
                ? theme.iconBg
                : color + (theme.isDark ? "40" : "20"),
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "300",
              color: value >= max ? theme.subTextColor : color,
            }}
          >
            +
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DownloadSheet({
  open,
  bounds,
  onClose,
  onDownloadComplete,
}: Props) {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
  const s = getStyles(theme);

  const sheetRef = useRef<BottomSheet>(null);
  const [minZoom, setMinZoom] = useState(8);
  const [maxZoom, setMaxZoom] = useState(14);
  const [name, setName] = useState("");
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<"idle" | "downloading" | "done">("idle");
  const cancelRef = useRef({ cancelled: false });

  React.useEffect(() => {
    if (open) sheetRef.current?.snapToIndex(1);
    else sheetRef.current?.close();
  }, [open]);

  useEffect(() => {
    if (open) {
      Promise.resolve().then(() => {
        setProgress(0);
        setStatus("idle");
      });
      cancelRef.current = { cancelled: false };
    }
  }, [open]);

  const tileCount = bounds
    ? tilesForBounds(
        bounds[0],
        bounds[1],
        bounds[2],
        bounds[3],
        minZoom,
        maxZoom,
      ).length
    : 0;
  const estimatedMB = estimateSizeMB(tileCount);

  const startDownload = async () => {
    if (!bounds) return;
    if (tileCount > 50000) {
      Alert.alert(
        t("Download_area_too_large_title"),
        t("Download_area_too_large_message"),
      );
      posthog.capture("Download_area_too_large", {
        min_zoom: minZoom,
        max_zoom: maxZoom,
        estimated_tiles: tileCount,
        estimated_mb: estimatedMB,
      });
      return;
    }

    posthog.capture("offline_download_started", {
      min_zoom: minZoom,
      max_zoom: maxZoom,
      estimated_tiles: tileCount,
      estimated_mb: estimatedMB,
    });

    setProgress(0);
    setStatus("downloading");
    cancelRef.current = { cancelled: false };

    const id = `region_${new Date().getTime()}`;

    const centerLat = (bounds[1] + bounds[3]) / 2;
    const centerLng = (bounds[0] + bounds[2]) / 2;

    let regionName = name.trim();
    if (!regionName) {
      const label = await reverseGeocode(centerLat, centerLng, undefined, i18n.language);
      regionName =
        label.split(",")[0].trim() ||
        `Region ${new Date().toLocaleDateString()}`;
    }

    const result = await downloadRegion(
      id,
      regionName,
      bounds,
      minZoom,
      maxZoom,
      (p) => {
        if (cancelRef.current.cancelled) return;
        setProgress(p.percent);
        if (
          p.status === "done" ||
          p.status === "cancelled" ||
          p.status === "error"
        ) {
          setStatus(p.status as "idle" | "downloading" | "done");
        }
      },
      cancelRef.current,
    );

    if (result) {
      setStatus("done");
      posthog.capture("offline_download_completed", {
        tile_count: tileCount,
      });
      onDownloadComplete();
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={["45%", "70%"]}
      enablePanDownToClose={false}
      backgroundStyle={{
        borderTopLeftRadius: theme.isModern ? 32 : 24,
        borderTopRightRadius: theme.isModern ? 32 : 24,
        backgroundColor: theme.bg,
      }}
      handleIndicatorStyle={{ backgroundColor: theme.subTextColor, width: 40 }}
    >
      <BottomSheetScrollView contentContainerStyle={s.container}>
        <View style={s.header}>
          <Text style={s.title}>{t("Download_sheet_title")}</Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <X size={20} color={theme.subTextColor} />
          </TouchableOpacity>
        </View>

        <View style={s.section}>
          <ZoomStepper
            label="MIN ZOOM"
            value={minZoom}
            min={4}
            max={maxZoom - 1}
            onChange={setMinZoom}
            color={theme.primary}
          />
          <ZoomStepper
            label="MAX ZOOM"
            value={maxZoom}
            min={minZoom + 1}
            max={16}
            onChange={setMaxZoom}
            color={theme.primary}
          />
        </View>

        <View style={s.estimateBox}>
          <Text style={s.estimateText}>
            {t("Download_tiles_estimate", {
              count: tileCount.toLocaleString(),
              mb: estimatedMB,
            })}
          </Text>
          {tileCount > 50000 && (
            <View style={s.warningRow}>
              <AlertTriangle size={14} color={theme.warning} />
              <Text style={s.warningText}>{t("Download_area_warning")}</Text>
            </View>
          )}
        </View>

        {status === "downloading" && (
          <View style={{ alignItems: "center", paddingVertical: 24, gap: 16 }}>
            <CircularProgress
              progress={progress / 100}
              color={theme.primary}
              size={100}
            />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: theme.textColor,
              }}
            >
              {t("Download_progress", { percent: Math.round(progress) })}
            </Text>
            <TouchableOpacity
              onPress={() => {
                cancelRef.current.cancelled = true;
                setStatus("idle");
                setProgress(0);
                posthog.capture("offline_download_cancelled", {
                  progress_at_cancel: progress,
                  tiles_done: Math.round((tileCount * progress) / 100),
                });
              }}
              style={s.cancelBtn}
            >
              <Text style={s.cancelText}>{t("Cancel")}</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === "done" && (
          <View style={s.doneBox}>
            <Text style={s.doneText}>{t("Download_done")}</Text>
          </View>
        )}

        {/* Download Button */}
        {status === "idle" && (
          <TouchableOpacity
            onPress={startDownload}
            disabled={!bounds || tileCount > 50000}
            style={[
              s.downloadBtn,
              (!bounds || tileCount > 50000) && s.downloadBtnDisabled,
            ]}
          >
            <Download size={20} color={theme.white} />
            <Text style={s.downloadBtnText}>{t("Download_button")}</Text>
          </TouchableOpacity>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const {
    cardBg,
    cardBgSecondary,
    textColor,
    subTextColor,
    borderColor,
    isModern,
    iconBg,
    warning,
    danger,
    success,
    successLight,
    primary,
    white,
    chevronColor,
  } = theme;

  return StyleSheet.create({
    container: { paddingHorizontal: 20, paddingBottom: 40 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    title: { fontSize: 20, fontWeight: "700", color: textColor },
    closeBtn: { backgroundColor: iconBg, borderRadius: 20, padding: 6 },
    section: { marginBottom: 20 },
    label: { fontSize: 14, color: subTextColor, marginBottom: 4 },
    value: { fontWeight: "700", color: textColor },
    estimateBox: {
      backgroundColor: cardBg,
      borderRadius: isModern ? 18 : 12,
      padding: 14,
      marginBottom: 20,
      borderColor: borderColor,
      borderWidth: 1,
    },
    estimateText: { fontSize: 15, fontWeight: "600", color: textColor },
    warningRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 6,
    },
    warningText: { fontSize: 13, color: warning },
    progressBox: { marginBottom: 20 },
    progressBar: {
      height: 8,
      backgroundColor: cardBgSecondary,
      borderRadius: 4,
      overflow: "hidden",
      marginBottom: 8,
    },
    progressFill: {
      height: "100%",
      backgroundColor: primary,
      borderRadius: 4,
    },
    progressText: { fontSize: 14, color: subTextColor, textAlign: "center" },
    cancelBtn: { marginTop: 8, alignItems: "center" },
    cancelText: { color: danger, fontWeight: "600" },
    doneBox: {
      padding: 16,
      backgroundColor: successLight,
      borderRadius: isModern ? 16 : 12,
      marginBottom: 20,
      alignItems: "center",
    },
    doneText: { fontSize: 16, fontWeight: "600", color: success },
    downloadBtn: {
      backgroundColor: primary,
      borderRadius: 14,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    downloadBtnDisabled: {
      backgroundColor: chevronColor,
    },
    downloadBtnText: { color: white, fontWeight: "700", fontSize: 16 },
  });
};
