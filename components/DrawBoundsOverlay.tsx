// components/DrawBoundsOverlay.tsx
import React, { useRef, useState } from "react";
import {
  View,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Check, X } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

interface Props {
  onConfirm: (bounds: [number, number, number, number]) => void; // west,south,east,north
  onCancel: () => void;
  mapRef: any;
}

export default function DrawBoundsOverlay({
  onConfirm,
  onCancel,
  mapRef,
}: Props) {
  // Start mit einem Rechteck in der Bildschirmmitte (als Pixel)
  const [box, setBox] = useState({
    left: width * 0.15,
    top: height * 0.25,
    right: width * 0.85,
    bottom: height * 0.65,
  });

  const boxRef = useRef(box);
  boxRef.current = box;

  const makeHandle = (corner: "nw" | "ne" | "se" | "sw") =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        const b = { ...boxRef.current };
        if (corner === "nw") {
          b.left = Math.min(b.right - 60, b.left + g.dx);
          b.top = Math.min(b.bottom - 60, b.top + g.dy);
        }
        if (corner === "ne") {
          b.right = Math.max(b.left + 60, b.right + g.dx);
          b.top = Math.min(b.bottom - 60, b.top + g.dy);
        }
        if (corner === "se") {
          b.right = Math.max(b.left + 60, b.right + g.dx);
          b.bottom = Math.max(b.top + 60, b.bottom + g.dy);
        }
        if (corner === "sw") {
          b.left = Math.min(b.right - 60, b.left + g.dx);
          b.bottom = Math.max(b.top + 60, b.bottom + g.dy);
        }
        setBox({ ...b });
      },
    });

  // PanResponder für das gesamte Rechteck (verschieben)
  const moveResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => {
      const b = boxRef.current;
      setBox({
        left: b.left + g.dx,
        top: b.top + g.dy,
        right: b.right + g.dx,
        bottom: b.bottom + g.dy,
      });
    },
  });

  const handleConfirm = async () => {
    if (!mapRef.current) return;
    // Pixel → Geo-Koordinaten konvertieren
    try {
      const nw = await mapRef.current.unproject([box.left, box.top]);
      const se = await mapRef.current.unproject([box.right, box.bottom]);
      onConfirm([nw.lng, se.lat, se.lng, nw.lat]); // west, south, east, north
    } catch {
      // Fallback via mapCenterRef
      onCancel();
    }
  };

  const nwHandle = makeHandle("nw");
  const neHandle = makeHandle("ne");
  const seHandle = makeHandle("se");
  const swHandle = makeHandle("sw");

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dunkle Overlay-Bereiche außerhalb des Rechtecks */}
      <View
        style={[s.dimmed, { top: 0, left: 0, right: 0, height: box.top }]}
      />
      <View
        style={[s.dimmed, { top: box.bottom, left: 0, right: 0, bottom: 0 }]}
      />
      <View
        style={[
          s.dimmed,
          {
            top: box.top,
            left: 0,
            width: box.left,
            height: box.bottom - box.top,
          },
        ]}
      />
      <View
        style={[
          s.dimmed,
          {
            top: box.top,
            left: box.right,
            right: 0,
            height: box.bottom - box.top,
          },
        ]}
      />

      {/* Rechteck-Rahmen + verschiebbar */}
      <View
        {...moveResponder.panHandlers}
        style={[
          s.rect,
          {
            left: box.left,
            top: box.top,
            width: box.right - box.left,
            height: box.bottom - box.top,
          },
        ]}
      >
        {/* Kreuz-Linien in der Mitte */}
        <View style={s.crossH} />
        <View style={s.crossV} />
      </View>

      {/* Eck-Handles */}
      {(
        [
          ["nw", box.left, box.top],
          ["ne", box.right, box.top],
          ["se", box.right, box.bottom],
          ["sw", box.left, box.bottom],
        ] as const
      ).map(([corner, x, y]) => (
        <View
          key={corner}
          {...(corner === "nw"
            ? nwHandle
            : corner === "ne"
              ? neHandle
              : corner === "se"
                ? seHandle
                : swHandle
          ).panHandlers}
          style={[s.handle, { left: x - 16, top: y - 16 }]}
        />
      ))}

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onCancel} style={s.cancelBtn}>
          <X size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Bereich auswählen</Text>
          <Text style={s.headerSub}>Ecken ziehen · Rechteck verschieben</Text>
        </View>
        <TouchableOpacity onPress={handleConfirm} style={s.confirmBtn}>
          <Check size={18} color="#fff" />
          <Text style={s.confirmText}>OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  dimmed: { position: "absolute", backgroundColor: "rgba(0,0,0,0.45)" },
  rect: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#2563EB",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  crossH: {
    position: "absolute",
    width: "100%",
    height: 1,
    backgroundColor: "rgba(37,99,235,0.3)",
  },
  crossV: {
    position: "absolute",
    height: "100%",
    width: 1,
    backgroundColor: "rgba(37,99,235,0.3)",
  },
  handle: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1a1a2e",
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cancelBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 8,
  },
  confirmBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  confirmText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  headerSub: { color: "#94A3B8", fontSize: 12, marginTop: 2 },
});
