import { MapProvider, Map, MapRef } from "react-native-maplibre-gl-js";
import React, { useRef } from "react";
import { StatusBar } from "expo-status-bar";

export default function MapScreen() {
  const mapRef = useRef<MapRef | null>(null);

  const ensureGlobe = () => {
    mapRef.current?.setProjection({ type: "globe" });
  };

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
            rnListener: ensureGlobe,
          },
        }}
      />
    </MapProvider>
  );
}
