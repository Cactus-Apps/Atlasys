import React from "react";
import { RasterTileSource } from "react-native-maplibre-gl-js";
import {
  TRAFFIC_ATTRIBUTION,
  TRAFFIC_BEFORE_ID,
  trafficTileTemplate,
} from "@/lib/traffic/config";

type Props = {
  enabled: boolean;
  themeKey: string;
  incidents?: boolean;
  minzoom?: number;
  opacity?: number;
};

export default function TrafficLayer({
  enabled,
  themeKey,
  incidents = true,
  minzoom = 7,
  opacity = 0.8,
}: Props) {
  const flowTiles = trafficTileTemplate("flow");
  const incidentTiles = trafficTileTemplate("incidents");

  if (!enabled || !flowTiles) return null;

  const beforeId = TRAFFIC_BEFORE_ID[themeKey];
  const before = beforeId ? { beforeId } : {};

  return (
    <>
      <RasterTileSource
        id="traffic-flow"
        source={{
          type: "raster",
          tiles: [flowTiles],
          tileSize: 256,
          minzoom,
          maxzoom: 18,
          attribution: TRAFFIC_ATTRIBUTION,
        }}
        layers={[
          {
            layer: {
              id: "traffic-flow-layer",
              type: "raster",
              minzoom,
              paint: { "raster-opacity": opacity },
            },
            ...before,
          },
        ]}
      />
      {incidents && incidentTiles && (
        <RasterTileSource
          id="traffic-incidents"
          source={{
            type: "raster",
            tiles: [incidentTiles],
            tileSize: 256,
            minzoom,
            maxzoom: 22,
            attribution: TRAFFIC_ATTRIBUTION,
          }}
          layers={[
            {
              layer: {
                id: "traffic-incidents-layer",
                type: "raster",
                minzoom,
                paint: { "raster-opacity": opacity },
              },
              ...before,
            },
          ]}
        />
      )}
    </>
  );
}
