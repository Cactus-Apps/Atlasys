import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Download, X, AlertTriangle, CheckCircle2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { tilesForBounds, estimateSizeMB } from "@/lib/storage/mbtiles";
import {
  cityBounds,
  CITY_POI_LIMIT,
  CITY_DEFAULT_MAX_ZOOM,
  CITY_DEFAULT_MIN_ZOOM,
  type CityDownloadPhase,
} from "@/lib/storage/offlineCity";
import { useCityDownloads } from "@/lib/storage/cityDownloadStore";
import { ZoomStepper } from "./DownloadSheet";
import CircularProgress from "../overlays/CircularWavyProgressIndicator";

type Props = {
  open: boolean;
  cityId: string;
  cityName: string;
  latitude: number;
  longitude: number;
  onClose: () => void;
};

const PHASE_KEYS: Record<CityDownloadPhase, string> = {
  tiles: "City_download_phase_tiles",
  pois: "City_download_phase_pois",
  transit: "City_download_phase_transit",
  finalizing: "City_download_phase_finalizing",
};

export default function CityDownloadSheet({
  open,
  cityId,
  cityName,
  latitude,
  longitude,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const s = getStyles(theme);
  const sheetRef = useRef<BottomSheet>(null);

  const [minZoom, setMinZoom] = useState(CITY_DEFAULT_MIN_ZOOM);
  const [maxZoom, setMaxZoom] = useState(CITY_DEFAULT_MAX_ZOOM);

  const task = useCityDownloads((state) => state.tasks[cityId]);
  const pkg = useCityDownloads((state) => state.packages[cityId]);
  const start = useCityDownloads((state) => state.start);
  const cancel = useCityDownloads((state) => state.cancel);

  useEffect(() => {
    if (open) sheetRef.current?.snapToIndex(1);
    else sheetRef.current?.close();
  }, [open]);

  const bounds = cityBounds(latitude, longitude);
  const tileCount = tilesForBounds(
    bounds[0],
    bounds[1],
    bounds[2],
    bounds[3],
    minZoom,
    maxZoom,
  ).length;
  const estimatedMB = estimateSizeMB(tileCount);
  const tooLarge = tileCount > 50000;
  const downloading = task?.status === "downloading";
  const done = !!pkg || task?.status === "done";

  const handleStart = () => {
    start({ cityId, cityName, latitude, longitude, minZoom, maxZoom });
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={["45%", "80%"]}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{
        borderTopLeftRadius: theme.isModern ? 32 : 24,
        borderTopRightRadius: theme.isModern ? 32 : 24,
        backgroundColor: theme.bg,
      }}
      handleIndicatorStyle={{ backgroundColor: theme.subTextColor, width: 40 }}
    >
      <BottomSheetScrollView contentContainerStyle={s.container}>
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{t("City_download_title")}</Text>
            <Text style={s.subtitle}>
              {t("City_download_subtitle", { name: cityName })}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <X size={20} color={theme.subTextColor} />
          </TouchableOpacity>
        </View>

        <View style={s.includesBox}>
          <Text style={s.includesText}>
            {t("City_download_includes", { pois: CITY_POI_LIMIT })}
          </Text>
        </View>

        {!downloading && !done && (
          <>
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
              {tooLarge && (
                <View style={s.warningRow}>
                  <AlertTriangle size={14} color={theme.warning} />
                  <Text style={s.warningText}>
                    {t("Download_area_warning")}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {downloading && (
          <View style={s.progressBox}>
            <CircularProgress
              progress={(task?.percent ?? 0) / 100}
              color={theme.primary}
              size={100}
            />
            <Text style={s.progressPercent}>
              {t("Download_progress", {
                percent: Math.round(task?.percent ?? 0),
              })}
            </Text>
            <Text style={s.phaseText}>
              {t(PHASE_KEYS[task?.phase ?? "tiles"])}
            </Text>
            <TouchableOpacity onPress={() => cancel(cityId)} style={s.cancelBtn}>
              <Text style={s.cancelText}>{t("Cancel")}</Text>
            </TouchableOpacity>
          </View>
        )}

        {done && (
          <View style={s.doneBox}>
            <CheckCircle2 size={28} color={theme.success} />
            <Text style={s.doneText}>{t("City_download_done")}</Text>
            <Text style={s.phaseText}>{t("City_download_delete_hint")}</Text>
          </View>
        )}

        {!downloading && !done && (
          <TouchableOpacity
            onPress={handleStart}
            disabled={tooLarge}
            style={[s.downloadBtn, tooLarge && s.downloadBtnDisabled]}
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
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 16,
    },
    title: { fontSize: 20, fontFamily: fonts.bold, color: textColor },
    subtitle: {
      fontSize: 13,
      color: subTextColor,
      fontFamily: fonts.medium,
      marginTop: 4,
    },
    closeBtn: { backgroundColor: iconBg, borderRadius: 20, padding: 6 },
    section: { marginBottom: 16 },
    includesBox: {
      backgroundColor: cardBg,
      borderRadius: isModern ? 16 : 12,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor,
    },
    includesText: {
      fontSize: 14,
      color: textColor,
      fontFamily: fonts.semibold,
      lineHeight: 20,
    },
    estimateBox: {
      backgroundColor: cardBg,
      borderRadius: isModern ? 18 : 12,
      padding: 14,
      marginBottom: 20,
      borderColor,
      borderWidth: 1,
    },
    estimateText: {
      fontSize: 15,
      fontFamily: fonts.semibold,
      color: textColor,
    },
    warningRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 6,
    },
    warningText: { fontSize: 13, color: warning },
    progressBox: {
      alignItems: "center",
      paddingVertical: 16,
      gap: 12,
    },
    progressPercent: {
      fontSize: 16,
      fontFamily: fonts.semibold,
      color: textColor,
    },
    phaseText: {
      fontSize: 13,
      color: subTextColor,
      fontFamily: fonts.medium,
      textAlign: "center",
    },
    cancelBtn: { marginTop: 4, alignItems: "center" },
    cancelText: { color: danger, fontFamily: fonts.semibold },
    doneBox: {
      padding: 20,
      backgroundColor: successLight,
      borderRadius: isModern ? 18 : 14,
      marginBottom: 20,
      alignItems: "center",
      gap: 8,
    },
    doneText: { fontSize: 16, fontFamily: fonts.semibold, color: success },
    downloadBtn: {
      backgroundColor: primary,
      borderRadius: 14,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    downloadBtnDisabled: { backgroundColor: chevronColor },
    downloadBtnText: { color: white, fontFamily: fonts.bold, fontSize: 16 },
  });
};
