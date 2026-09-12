import { MapProvider, Map, MapRef, Marker } from "react-native-maplibre-gl-js";
import React, { useEffect, useMemo, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { useSharingStore } from "@/lib/sharing/state";
import { useShareLock } from "@/lib/sharing/appLock";
import { sharingManager } from "@/lib/sharing/channel";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { Lock, MapPin } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

const PEER_MARKER_HTML = (color: string, name: string, status: string) => {
  if (status === "ended") {
    return `
<div style="display:flex; flex-direction:column; align-items:center; transform: translateY(-20px);">
  <div style="
    width:18px; height:18px; border-radius:50%;
    background:#ffffff;
    border: 3px solid ${color};
    opacity:0.85;
    box-shadow: 0 2px 6px rgba(0,0,0,0.35);
  "></div>
  <div style="margin-top:2px; padding:1px 6px; background: rgba(0,0,0,0.55); color:#fff; font-size:11px; border-radius:8px; max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
    ${name}
  </div>
</div>
`;
  }
  if (status === "offline") {
    return `
<div style="display:flex; flex-direction:column; align-items:center; transform: translateY(-20px);">
  <div style="
    width:18px; height:18px; border-radius:50%;
    background:${color};
    border: 2px solid #ffffff;
    opacity:0.6;
    box-shadow: 0 2px 6px rgba(0,0,0,0.35);
  "></div>
  <div style="margin-top:2px; padding:1px 6px; background: rgba(0,0,0,0.55); color:#fff; font-size:11px; border-radius:8px; max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
    ${name}
  </div>
</div>
`;
  }
  return `
<div style="display:flex; flex-direction:column; align-items:center; transform: translateY(-20px);">
  <div style="
    width:18px; height:18px; border-radius:50%;
    background:${color};
    border: 2.5px solid #ffffff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4), inset 0 0 6px rgba(255,255,255,0.6);
  "></div>
  <div style="margin-top:2px; padding:1px 6px; background: rgba(0,0,0,0.55); color:#fff; font-size:11px; border-radius:8px; max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
    ${name}
  </div>
</div>
`;
};

export default function MapScreen() {
  const { t } = useTranslation();
  const mapRef = useRef<MapRef | null>(null);
  const theme = useAppTheme();
  const peers = useSharingStore((s) => s.peers);
  const active = useSharingStore((s) => s.active);
  const { locked, enabled, requestUnlock } = useShareLock();

  useEffect(() => {
    void sharingManager.bootstrap();
  }, []);

  const styles = useMemo(() => getStyles(theme), [theme]);

  const peerMarkers = useMemo(
    () =>
      Object.values(peers).filter(
        (p) => p.latitude != null && p.longitude != null,
      ),
    [peers],
  );

  if (!active) {
    return (
      <MapProvider>
        <StatusBar hidden={true} />
        <Map
          ref={mapRef}
          options={{
            style: "https://tiles.openfreemap.org/styles/bright",
            center: [2.349014, 48.864716],
            zoom: 4,
          }}
          listeners={{
            mount: {
              rnListener: () => {
                mapRef.current?.setProjection({ type: "globe" });
              },
            },
          }}
        />
      </MapProvider>
    );
  }

  if (locked || !enabled) {
    return (
      <View style={styles.lockContainer}>
        <StatusBar style="light" />
        <View style={styles.lockCard}>
          <View style={styles.lockIconWrap}>
            <Lock size={30} color={theme.white} strokeWidth={2.5} />
          </View>
          <Text style={styles.lockTitle}>Live-Standorte geschützt</Text>
          <Text style={styles.lockBody}>
            Diese Ansicht zeigt geteilte Standorte. Entsperre sie biometrisch,
            um fortzufahren. Aufnahmen und App-Wechsel werden blockiert.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.lockButton,
              pressed && styles.lockButtonPressed,
            ]}
            onPress={() => void requestUnlock()}
          >
            <Text style={styles.lockButtonText}>Entsperren</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <MapProvider>
      <StatusBar hidden={true} />
      <Map
        ref={mapRef}
        options={{
          style: "https://tiles.openfreemap.org/styles/bright",
          center: [2.349014, 48.864716],
          zoom: 4,
        }}
        listeners={{
          mount: {
            rnListener: () => {
              mapRef.current?.setProjection({ type: "globe" });
            },
          },
        }}
      />
      {peerMarkers.map((peer) => {
        const color =
          peer.status === "ended"
            ? "#6b7280"
            : peer.status === "offline"
              ? theme.subTextColor
              : theme.accentColor;
        return (
          <Marker
            key={peer.id}
            options={{
              coordinate: [peer.longitude, peer.latitude],
              element: {
                innerHTML: PEER_MARKER_HTML(
                  color,
                  peer.name ?? peer.id.slice(0, 8),
                  peer.status,
                ),
              },
            }}
          />
        );
      })}
      {peerMarkers.length > 0 && (
        <View style={styles.hud}>
          <MapPin size={14} color={theme.white} strokeWidth={2.5} />
          <Text style={styles.hudText}>
            {t("Sharing_active_badge", { count: peerMarkers.length })}
          </Text>
        </View>
      )}
    </MapProvider>
  );
}

const getStyles = (_theme: ReturnType<typeof useAppTheme>) => {
  const theme = _theme;
  return StyleSheet.create({
    lockContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.bg,
      padding: 28,
    },
    lockCard: {
      width: "100%",
      maxWidth: 380,
      alignItems: "center",
      backgroundColor: theme.cardBg,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.borderColor,
      padding: 28,
    },
    lockIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.accentColor,
      marginBottom: 18,
    },
    lockTitle: {
      fontFamily: fonts.regular,
      fontWeight: "700",
      fontSize: 20,
      color: theme.textColor,
      marginBottom: 10,
      textAlign: "center",
    },
    lockBody: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 21,
      color: theme.subTextColor,
      textAlign: "center",
      marginBottom: 22,
    },
    lockButton: {
      backgroundColor: theme.accentColor,
      paddingVertical: 14,
      paddingHorizontal: 40,
      borderRadius: 16,
    },
    lockButtonPressed: {
      opacity: 0.85,
    },
    lockButtonText: {
      fontFamily: fonts.regular,
      fontWeight: "700",
      fontSize: 16,
      color: theme.white,
    },
    hud: {
      position: "absolute",
      top: 56,
      left: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(0,0,0,0.6)",
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    hudText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "600",
      fontFamily: fonts.regular,
    },
  });
};