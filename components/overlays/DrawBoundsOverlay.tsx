// not used yet
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Check, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "@/lib/theme";
import * as Sentry from "@sentry/react-native";

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
  const { t } = useTranslation();
  const theme = useAppTheme();
  const s = getStyles(theme);

  // Start with a centered rectangle (screen pixels)
  const [box, setBox] = useState({
    left: width * 0.15,
    top: height * 0.25,
    right: width * 0.85,
    bottom: height * 0.65,
  });

  const boxRef = useRef(box);
  useEffect(() => {
    boxRef.current = box;
  }, [box]);

  const [moveHandlers, setMoveHandlers] = useState<Record<string, any>>({});
  const [nwHandlers, setNwHandlers] = useState<Record<string, any>>({});
  const [neHandlers, setNeHandlers] = useState<Record<string, any>>({});
  const [seHandlers, setSeHandlers] = useState<Record<string, any>>({});
  const [swHandlers, setSwHandlers] = useState<Record<string, any>>({});

  useEffect(() => {
    let moveStart: typeof box = boxRef.current;
    let cornerStart: typeof box = boxRef.current;

    setMoveHandlers(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          moveStart = { ...boxRef.current };
        },
        onPanResponderMove: (_, g) => {
          setBox({
            left: moveStart.left + g.dx,
            top: moveStart.top + g.dy,
            right: moveStart.right + g.dx,
            bottom: moveStart.bottom + g.dy,
          });
        },
      }).panHandlers,
    );

    const makeHandle = (corner: "nw" | "ne" | "se" | "sw") =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          cornerStart = { ...boxRef.current };
        },
        onPanResponderMove: (_, g) => {
          const b = { ...cornerStart };
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

    setNwHandlers(makeHandle("nw").panHandlers);
    setNeHandlers(makeHandle("ne").panHandlers);
    setSeHandlers(makeHandle("se").panHandlers);
    setSwHandlers(makeHandle("sw").panHandlers);
  }, []);

  const handleConfirm = async () => {
    if (!mapRef.current) return;
    // Convert pixels to geographic coordinates
    try {
      const nw = await mapRef.current.unproject([box.left, box.top]);
      const se = await mapRef.current.unproject([box.right, box.bottom]);
      onConfirm([nw.lng, se.lat, se.lng, nw.lat]); // west, south, east, north
    } catch (err) {
      Sentry.captureException(err);
      onCancel();
    }
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dimmed areas outside the selection rectangle */}
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

      {/* Rectangle frame (draggable) */}
      <View
        {...moveHandlers}
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
        {/* Crosshair at center */}
        <View style={s.crossH} />
        <View style={s.crossV} />
      </View>

      {/* Corner handles */}
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
          {...{
            nw: nwHandlers,
            ne: neHandlers,
            se: seHandlers,
            sw: swHandlers,
          }[corner]}
          style={[s.handle, { left: x - 16, top: y - 16 }]}
        />
      ))}

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onCancel} style={s.cancelBtn}>
          <X size={20} color={theme.textColor} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>{t("DrawBounds_select_area")}</Text>
          <Text style={s.headerSub}>{t("DrawBounds_drag_hint")}</Text>
        </View>
        <TouchableOpacity onPress={handleConfirm} style={s.confirmBtn}>
          <Check size={18} color={theme.white} />
          <Text style={s.confirmText}>{t("OK")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const { primary, bg, iconBg, textColor, subTextColor, white, overlay } =
    theme;

  return StyleSheet.create({
    dimmed: { position: "absolute", backgroundColor: overlay },
    rect: {
      position: "absolute",
      borderWidth: 2,
      borderColor: primary,
      backgroundColor: "transparent",
      justifyContent: "center",
      alignItems: "center",
    },
    crossH: {
      position: "absolute",
      width: "100%",
      height: 1,
      backgroundColor: primary,
      opacity: 0.3,
    },
    crossV: {
      position: "absolute",
      height: "100%",
      width: 1,
      backgroundColor: primary,
      opacity: 0.3,
    },
    handle: {
      position: "absolute",
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: primary,
      borderWidth: 3,
      borderColor: white,
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
      backgroundColor: bg,
      paddingTop: 54,
      paddingBottom: 16,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    cancelBtn: {
      backgroundColor: iconBg,
      borderRadius: 20,
      padding: 8,
    },
    confirmBtn: {
      backgroundColor: primary,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    confirmText: { color: white, fontWeight: "700", fontSize: 15 },
    headerTitle: { color: textColor, fontSize: 17, fontWeight: "700" },
    headerSub: { color: subTextColor, fontSize: 12, marginTop: 2 },
  });
};
