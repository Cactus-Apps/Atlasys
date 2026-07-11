import { MapIcon, Box, Download, Navigation } from "lucide-react-native";
import React, { memo } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import i18n from "@/app/i18n";

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
  return (
    <View style={s.container}>
      {[
        {
          icon: <Navigation color="#1E293B" size={22} />,
          onPress: () => {
            setRoute(null);
            setDistanceInfo(null);
            setRouteEnd(null);
            setRouteStart(
              markerPos
                ? { label: i18n.t("Poi_my_location"), coordinate: markerPos }
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
          {item.divider && <View style={s.divider} />}
          <TouchableOpacity onPress={item.onPress} style={s.btn}>
            {item.icon}
          </TouchableOpacity>
          {idx < 3 && !item.divider && <View style={s.hairline} />}
        </React.Fragment>
      ))}
    </View>
  );
});

const s = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 110,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
  },
  btn: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: { height: 1, backgroundColor: "#F1F5F9" },
  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: "#F1F5F9" },
});
