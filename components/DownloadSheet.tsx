import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Slider from "@react-native-community/slider";
import { Download, X, AlertTriangle } from "lucide-react-native";
import { tilesForBounds, estimateSizeMB } from "@/lib/storage/mbtiles";
import { downloadRegion } from "@/lib/storage/downloadTiles";
import { CircularWavyProgress, Host } from "@expo/ui/jetpack-compose";

interface Props {
  open: boolean;
  bounds: [number, number, number, number] | null; // west,south,east,north
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
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#F8FAFC",
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
      }}
    >
      <View>
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: "#94A3B8",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: "#1E293B",
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
            backgroundColor: value <= min ? "#F1F5F9" : color + "20",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "300",
              color: value <= min ? "#CBD5E1" : color,
            }}
          >
            −
          </Text>
        </TouchableOpacity>

        {/* Visuelle Skala */}
        <View style={{ flexDirection: "row", gap: 3 }}>
          {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((i) => (
            <TouchableOpacity key={i} onPress={() => onChange(i)}>
              <View
                style={{
                  width: i === value ? 10 : 6,
                  height: i === value ? 10 : 6,
                  borderRadius: 5,
                  backgroundColor:
                    i === value ? color : i < value ? color + "40" : "#E2E8F0",
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
            backgroundColor: value >= max ? "#F1F5F9" : color + "20",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "300",
              color: value >= max ? "#CBD5E1" : color,
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
        "Zu groß",
        "Bitte wähle ein kleineres Gebiet oder weniger Zoom-Stufen.",
      );
      return;
    }

    setProgress(0);
    setStatus("downloading");
    cancelRef.current = { cancelled: false };

    const id = `region_${Date.now()}`;
    const regionName =
      name.trim() || `Region ${new Date().toLocaleDateString("de")}`;

    const result = await downloadRegion(
      id,
      regionName,
      bounds,
      minZoom,
      maxZoom,
      (p) => {
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
      onDownloadComplete();
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={["45%", "70%"]}
      enablePanDownToClose={false}
      backgroundStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: "#CBD5E1", width: 40 }}
    >
      <BottomSheetScrollView contentContainerStyle={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Karte herunterladen</Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <X size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Zoom Slider */}
        <View style={s.section}>
          <ZoomStepper
            label="MIN ZOOM"
            value={minZoom}
            min={4}
            max={maxZoom - 1}
            onChange={setMinZoom}
            color="#2563EB"
          />
          <ZoomStepper
            label="MAX ZOOM"
            value={maxZoom}
            min={minZoom + 1}
            max={16}
            onChange={setMaxZoom}
            color="#2563EB"
          />
        </View>

        {/* Schätzung */}
        <View style={s.estimateBox}>
          <Text style={s.estimateText}>
            ~{tileCount.toLocaleString()} Tiles · ca. {estimatedMB} MB
          </Text>
          {tileCount > 50000 && (
            <View style={s.warningRow}>
              <AlertTriangle size={14} color="#F59E0B" />
              <Text style={s.warningText}>
                Gebiet zu groß – Zoom reduzieren
              </Text>
            </View>
          )}
        </View>

        {/* Progress */}
        {status === "downloading" && (
          <View style={{ alignItems: "center", paddingVertical: 24, gap: 16 }}>
            <Host matchContents>
              <CircularWavyProgress progress={progress / 100} color="#2563EB" />
            </Host>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#1E293B" }}>
              {progress}% heruntergeladen
            </Text>
            <TouchableOpacity
              onPress={() => (cancelRef.current.cancelled = true)}
              style={s.cancelBtn}
            >
              <Text style={s.cancelText}>Abbrechen</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === "done" && (
          <View style={s.doneBox}>
            <Text style={s.doneText}>Download abgeschlossen!</Text>
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
            <Download size={20} color="#fff" />
            <Text style={s.downloadBtnText}>Herunterladen</Text>
          </TouchableOpacity>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#111" },
  closeBtn: { backgroundColor: "#F1F5F9", borderRadius: 20, padding: 6 },
  section: { marginBottom: 20 },
  label: { fontSize: 14, color: "#64748B", marginBottom: 4 },
  value: { fontWeight: "700", color: "#1E293B" },
  estimateBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  estimateText: { fontSize: 15, fontWeight: "600", color: "#1E293B" },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  warningText: { fontSize: 13, color: "#F59E0B" },
  progressBox: { marginBottom: 20 },
  progressBar: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { height: "100%", backgroundColor: "#2563EB", borderRadius: 4 },
  progressText: { fontSize: 14, color: "#64748B", textAlign: "center" },
  cancelBtn: { marginTop: 8, alignItems: "center" },
  cancelText: { color: "#EF4444", fontWeight: "600" },
  doneBox: {
    padding: 16,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  doneText: { fontSize: 16, fontWeight: "600", color: "#16A34A" },
  downloadBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  downloadBtnDisabled: { backgroundColor: "#94A3B8" },
  downloadBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
