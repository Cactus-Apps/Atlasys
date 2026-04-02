// components/DraggableFAB.tsx
import { Equal } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Platform,
} from "react-native";

const { width: W, height: H } = Dimensions.get("window");

const SNAP_MARGIN = 16;
const FAB_GAP = 0;
const CONTAINER_W = 48;
const CONTAINER_H = 48 * 4 + 3;

type SnapPosition = {
  x: number;
  y: number;
  id: string;
};

function getSnapPositions(): SnapPosition[] {
  return [
    {
      id: "right",
      x: W - CONTAINER_W - SNAP_MARGIN,
      y: H / 2 - CONTAINER_H / 2,
    },
    { id: "left", x: SNAP_MARGIN, y: H / 2 - CONTAINER_H / 2 },
  ];
}

function getNearestSnap(x: number, y: number): SnapPosition {
  const snaps = getSnapPositions();
  return snaps.reduce((best, snap) => {
    const d = Math.hypot(snap.x - x, snap.y - y);
    const bd = Math.hypot(best.x - x, best.y - y);
    return d < bd ? snap : best;
  });
}

interface Props {
  children: React.ReactNode;
}

export default function DraggableFAB({ children }: Props) {
  const defaultSnap = {
    id: "right",
    x: W - CONTAINER_W - SNAP_MARGIN,
    y: H / 2 - CONTAINER_H / 2,
  };

  const pan = useRef(
    new Animated.ValueXY({ x: defaultSnap.x, y: defaultSnap.y }),
  ).current;
  const currentPos = useRef({ x: defaultSnap.x, y: defaultSnap.y });
  const [dragging, setDragging] = useState(false);
  const [snapId, setSnapId] = useState("bot-right");

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,

      onPanResponderGrant: () => {
        pan.setOffset({ x: currentPos.current.x, y: currentPos.current.y });
        pan.setValue({ x: 0, y: 0 });
        setDragging(true);
      },

      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),

      onPanResponderRelease: (_, g) => {
        pan.flattenOffset();
        const rawX = currentPos.current.x + g.dx;
        const rawY = currentPos.current.y + g.dy;
        const snap = getNearestSnap(rawX, rawY);

        Animated.spring(pan, {
          toValue: { x: snap.x, y: snap.y },
          useNativeDriver: false,
          tension: 120,
          friction: 8,
        }).start();

        currentPos.current = { x: snap.x, y: snap.y };
        setSnapId(snap.id);
        setDragging(false);
      },
    }),
  ).current;

  useEffect(() => {
    const id = pan.addListener(({ x, y }) => {
      currentPos.current = { x, y };
    });
    return () => pan.removeListener(id);
  }, []);

  return (
    <Animated.View
      style={[styles.container, { transform: pan.getTranslateTransform() }]}
    >
      {/* Drag Handle – nur dieser ist ziehbar */}
      <Equal />

      {/* Buttons – normal tippbar, kein panHandler */}
      <View
        style={[
          snapId.includes("left") ? styles.shadowRight : styles.shadowLeft,
        ]}
      >
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 100,
  },
  fabStack: {
    gap: FAB_GAP,
    borderRadius: 16,
    padding: 0,
  },
  shadowLeft: {
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  shadowRight: {
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  handle: {
    width: "100%",
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "transparent",
    cursor: "grab",
  },
  handleLine: {
    width: 20,
    height: 2,
    borderRadius: 2,
    backgroundColor: "rgba(100,116,139,0.5)",
  },
  dragging: {
    opacity: 0.85,
    transform: [{ scale: 1.05 }],
  },
  dragIndicator: {
    position: "absolute",
    top: -6,
    alignSelf: "center",
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
});
