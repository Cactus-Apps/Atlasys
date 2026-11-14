import { GeoJSONSource } from "react-native-maplibre-gl-js";
import type { TransitItinerary } from "@/lib/transit/types";

interface Props {
  itinerary: TransitItinerary | null;
}

export default function TransitRouteLayer({ itinerary }: Props) {
  if (!itinerary) return null;

  return (
    <>
      {itinerary.legs.map((leg, index) => {
        if (!leg.geometry || leg.geometry.length < 2) return null;

        const sourceId = `transit-leg-${index}`;
        const width = leg.isWalking ? 4 : 6;

        return (
          <GeoJSONSource
            key={`${sourceId}-${leg.geometry.length}-${leg.color}`}
            id={sourceId}
            source={{
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: leg.geometry,
                },
              },
            }}
            layers={[
              {
                layer: {
                  id: `${sourceId}-casing`,
                  type: "line",
                  layout: {
                    "line-join": "round",
                    "line-cap": "round",
                  },
                  paint: {
                    "line-color": "#000000",
                    "line-width": width + 2.5,
                    "line-opacity": 0.15,
                  },
                },
              },
              {
                layer: {
                  id: `${sourceId}-line`,
                  type: "line",
                  layout: {
                    "line-join": "round",
                    "line-cap": leg.isWalking ? "butt" : "round",
                  },
                  paint: {
                    "line-color": leg.color,
                    "line-width": width,
                    ...(leg.isWalking ? { "line-dasharray": [1.5, 1.5] } : {}),
                  },
                },
              },
            ]}
          />
        );
      })}
    </>
  );
}
