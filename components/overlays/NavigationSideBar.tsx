import { MapIcon, Box, Download, Navigation } from "lucide-react-native";
import React, { memo, useEffect, useMemo, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  type SharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import i18n from "@/app/i18n";

const FAB_W = 48;
const FAB_H = 194;
const EDGE = 16;
const TOP_GAP = 150;
const BOTTOM_GAP = 110;
const DOT = 14;
const HORIZ_INDEX = 1;

type Snap = { id: string; x: number; y: number };

function getSnaps(W: number, H: number): Snap[] {
  "worklet";
  const cx = W / 2 - FAB_W / 2;
  const by = H - BOTTOM_GAP - FAB_H;
  const cy = H / 2 - FAB_H / 2;
  return [
    { id: "bottom-left", x: EDGE, y: by },
    { id: "bottom-center", x: cx, y: by },
    { id: "bottom-right", x: W - FAB_W - EDGE, y: by },
    { id: "mid-left", x: EDGE, y: cy },
    { id: "mid-right", x: W - FAB_W - EDGE, y: cy },
    { id: "top-left", x: EDGE, y: TOP_GAP },
  ];
}

function nearestSnap(x: number, y: number, W: number, H: number): number {
  "worklet";
  const snaps = getSnaps(W, H);
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < snaps.length; i++) {
    const d = Math.hypot(snaps[i].x - x, snaps[i].y - y);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

const clamp = (v: number, min: number, max: number) => {
  "worklet";
  return Math.min(max, Math.max(min, v));
};

function SnapDot({
  active,
  index,
}: {
  active: SharedValue<number>;
  index: number;
}) {
  const style = useAnimatedStyle(() => {
    const isActive = active.value === index;
    return {
      backgroundColor: withSpring(isActive ? "#3B82F6" : "#ffffff", {
        damping: 20,
        stiffness: 300,
      }),
      borderColor: withSpring(isActive ? "#ffffff" : "#64748B", {
        damping: 20,
        stiffness: 300,
      }),
      opacity: withSpring(isActive ? 1 : 0.55, { damping: 20, stiffness: 300 }),
      transform: [
        {
          scale: withSpring(isActive ? 1.35 : 1, {
            damping: 20,
            stiffness: 300,
          }),
        },
      ],
    };
  });
  return <Animated.View style={[s.dot, style]} />;
}

interface Props {
  markerPos: [number, number] | undefined;
  resetPitch: () => void;
  setRoute: (r: any) => void;
  setDistanceInfo: (d: any) => void;
  setRouteEnd: (p: any) => void;
  setRouteStart: (p: any) => void;
  setRouteSheetOpen: (v: boolean) => void;
  setMapStyleSheetOpen: (v: boolean) => void;
  setDrawMode: (v: boolean) => void;
}

export default memo(function NavigationSideBar({
  markerPos,
  resetPitch,
  setRoute,
  setDistanceInfo,
  setRouteEnd,
  setRouteStart,
  setRouteSheetOpen,
  setMapStyleSheetOpen,
  setDrawMode,
}: Props) {
  const { width: Wd, height: Hd } = useWindowDimensions();
  const snaps = useMemo(() => getSnaps(Wd, Hd), [Wd, Hd]);
  const [savedPos, setSavedPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  const initX = savedPos ? clamp(savedPos.x, 0, Wd - FAB_W) : snaps[2].x;
  const initY = savedPos ? clamp(savedPos.y, 0, Hd - FAB_H) : snaps[2].y;

  const tx = useSharedValue(initX);
  const ty = useSharedValue(initY);
  const startX = useSharedValue(initX);
  const startY = useSharedValue(initY);
  const draggingSV = useSharedValue(0);
  const horizontalSV = useSharedValue(0);
  const activeSnap = useSharedValue(2);
  const [isDragging, setIsDragging] = useState(false);
  const [isHorizontal, setIsHorizontal] = useState(false);

  useEffect(() => {
    const idx = nearestSnap(tx.value, ty.value, Wd, Hd);
    horizontalSV.value = idx === HORIZ_INDEX ? 1 : 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHorizontal(idx === HORIZ_INDEX);
    const s = getSnaps(Wd, Hd)[idx];
    tx.value = withSpring(s.x, { damping: 40, stiffness: 500 });
    ty.value = withSpring(s.y, { damping: 40, stiffness: 500 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Wd, Hd]);

  const savePos = (x: number, y: number) => {
    setSavedPos({ x, y });
  };

  const pan = Gesture.Pan()
    .minDistance(8)
    .onStart(() => {
      const idx = nearestSnap(tx.value, ty.value, Wd, Hd);
      startX.value = tx.value;
      startY.value = ty.value;
      draggingSV.value = 1;
      activeSnap.value = idx;
      // eslint-disable-next-line react-hooks/immutability
      horizontalSV.value = idx === HORIZ_INDEX ? 1 : 0;
      runOnJS(setIsHorizontal)(idx === HORIZ_INDEX);
      runOnJS(setIsDragging)(true);
    })
    .onUpdate((e) => {
      const horiz = horizontalSV.value === 1;
      const offX = horiz ? (FAB_H - FAB_W) / 2 : 0;
      const offY = horiz ? FAB_H - FAB_W : 0;
      // eslint-disable-next-line react-hooks/immutability
      tx.value = clamp(
        startX.value + e.translationX,
        offX,
        Wd - (horiz ? FAB_H : FAB_W) + offX,
      );
      // eslint-disable-next-line react-hooks/immutability
      ty.value = clamp(
        startY.value + e.translationY,
        -offY,
        Hd - (horiz ? FAB_W : FAB_H) - offY,
      );
      activeSnap.value = nearestSnap(tx.value, ty.value, Wd, Hd);
    })
    .onEnd(() => {
      const idx = activeSnap.value;
      const s = getSnaps(Wd, Hd)[idx];
      // eslint-disable-next-line react-hooks/immutability
      tx.value = withSpring(s.x, { damping: 30, stiffness: 400, mass: 0.7 });
      // eslint-disable-next-line react-hooks/immutability
      ty.value = withSpring(s.y, { damping: 30, stiffness: 400, mass: 0.7 });
      draggingSV.value = 0;
      activeSnap.value = -1;
      // eslint-disable-next-line react-hooks/immutability
      horizontalSV.value = idx === HORIZ_INDEX ? 1 : 0;
      runOnJS(savePos)(s.x, s.y);
      runOnJS(setIsHorizontal)(idx === HORIZ_INDEX);
      runOnJS(setIsDragging)(false);
      runOnJS(Haptics.selectionAsync)();
    });

  const fabStyle = useAnimatedStyle(() => {
    const horiz = isHorizontal;
    const offX = horiz ? (FAB_H - FAB_W) / 2 : 0;
    const offY = horiz ? FAB_H - FAB_W : 0;
    return {
      left: tx.value - offX,
      top: ty.value + offY,
      width: horiz ? FAB_H : FAB_W,
      height: horiz ? FAB_W : FAB_H,
      opacity: draggingSV.value ? 0.92 : 1,
      transform: [{ scale: draggingSV.value ? 0.78 : 1 }],
    };
  }, [isHorizontal]);

  return (
    <>
      {isDragging && (
        <View pointerEvents="none" style={s.snapLayer}>
          {snaps.map((snap, i) => (
            <View
              key={snap.id}
              style={[
                s.dotSlot,
                { left: snap.x + FAB_W / 2, top: snap.y + FAB_H / 2 },
              ]}
            >
              <SnapDot active={activeSnap} index={i} />
            </View>
          ))}
        </View>
      )}
      <GestureDetector gesture={pan}>
        <Animated.View style={[s.fab, isHorizontal && s.row, fabStyle]}>
          {[
            {
              icon: <Navigation color="#1E293B" size={22} />,
              onPress: () => {
                setRoute(null);
                setDistanceInfo(null);
                setRouteEnd(null);
                setRouteStart(
                  markerPos
                    ? {
                        label: i18n.t("Poi_my_location"),
                        coordinate: markerPos,
                      }
                    : null,
                );
                setRouteSheetOpen(true);
              },
            },
            {
              icon: <MapIcon color="#1E293B" size={22} />,
              onPress: () => setMapStyleSheetOpen(true),
              divider: true,
            },
            {
              icon: <Box color="#1E293B" size={22} />,
              onPress: resetPitch,
            },
            {
              icon: <Download color="#1E293B" size={22} />,
              onPress: () => setDrawMode(true),
            },
          ].map((item, idx) => (
            <React.Fragment key={idx}>
              {item.divider && (
                <View style={isHorizontal ? s.dividerV : s.divider} />
              )}
              <TouchableOpacity onPress={item.onPress} style={s.btn}>
                {item.icon}
              </TouchableOpacity>
              {idx < 3 && !item.divider && (
                <View style={isHorizontal ? s.hairlineV : s.hairline} />
              )}
            </React.Fragment>
          ))}
        </Animated.View>
      </GestureDetector>
    </>
  );
});

const s = StyleSheet.create({
  fab: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
    zIndex: 0,
  },
  row: { flexDirection: "row" },
  snapLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  dotSlot: {
    position: "absolute",
    width: DOT,
    height: DOT,
    marginLeft: -DOT / 2,
    marginTop: -DOT / 2,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  btn: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: { height: 1, backgroundColor: "#F1F5F9" },
  dividerV: { width: 1, backgroundColor: "#F1F5F9" },
  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: "#F1F5F9" },
  hairlineV: { width: StyleSheet.hairlineWidth, backgroundColor: "#F1F5F9" },
});
