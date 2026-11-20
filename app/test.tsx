import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";
import {
  Map,
  MapProvider,
  Marker,
  MarkerRef,
  type MapRef,
} from "react-native-maplibre-gl-js";
import type { StyleSpecification } from "maplibre-gl";
import {
  POI_CATEGORIES,
  POI_ICON_IDS,
  buildCustomPoiStyle,
  usePoiIconUris,
} from "@/lib/map/poiCategories";
import darkStyle from "@/assets/map/dark-style.json";
import { LocationCoords, useLocation } from "@/lib/geocoding/location";
import { useAppTheme } from "@/lib/theme";
import { darken } from "./(tabs)/mapscreen";

export default function Test() {
  const mapRef = useRef<MapRef | null>(null);
  const pendingIcons = useRef(new Set<string>());
  const customStyle = useMemo(
    () => buildCustomPoiStyle(darkStyle as StyleSpecification, { dark: true }),
    [],
  );
  const location = useLocation();
  const centeredOnceRef = useRef(false);
  const latestLocationRef = useRef(location);
  const markerRef = useRef<MarkerRef | null>(null);
  const iconUris = usePoiIconUris();
  const theme = useAppTheme();

  const iconUriById = useMemo(
    () =>
      Object.fromEntries(
        POI_CATEGORIES.map((category) => [
          POI_ICON_IDS[category.key],
          iconUris[category.key],
        ]),
      ) as Record<string, string | undefined>,
    [iconUris],
  );

  const registerIcon = useCallback(
    async (id: string) => {
      const uri = iconUriById[id];
      if (!uri || pendingIcons.current.has(id)) return;

      pendingIcons.current.add(id);
      try {
        if (!(await mapRef.current?.hasImage(id))) {
          await mapRef.current?.addImage(id, uri, { pixelRatio: 2 });
        }
      } catch (cause) {
        console.warn("POI icon could not be registered", id, cause);
      } finally {
        pendingIcons.current.delete(id);
      }
    },
    [iconUriById],
  );

  const registerAllIcons = useCallback(async () => {
    await Promise.all(
      POI_CATEGORIES.map((category) =>
        registerIcon(POI_ICON_IDS[category.key]),
      ),
    );
  }, [registerIcon]);

  useEffect(() => {
    void registerAllIcons();
  }, [customStyle, registerAllIcons]);

  const centerOnLocationOnce = useCallback(() => {
    if (centeredOnceRef.current) return;
    const coords = latestLocationRef.current;
    if (!coords || !mapRef.current) return;

    centeredOnceRef.current = true;
    mapRef.current.flyTo({ center: coords, zoom: 14, duration: 800 });
  }, []);

  useEffect(() => {
    latestLocationRef.current = location;
    centerOnLocationOnce();
  }, [location, centerOnLocationOnce]);

  const listeners = useMemo(
    () => ({
      mount: {
        rnListener: () => {
          void registerAllIcons();
          centerOnLocationOnce();
        },
      },
      load: {
        objectListener: () => {
          void registerAllIcons();
          centerOnLocationOnce();
        },
      },
      styleimagemissing: {
        objectListener: (event: { id: string }) => {
          if (event.id.startsWith("atlasys-poi-")) void registerIcon(event.id);
        },
      },
    }),
    [registerAllIcons, registerIcon, centerOnLocationOnce],
  );

  const [initialCenter] = useState<LocationCoords | undefined>(() => location);

  const mapOptions = useMemo(
    () => ({
      style: customStyle,
      center: initialCenter,
      zoom: 14,
    }),
    [customStyle, initialCenter],
  );

  return (
    <View style={s.container}>
      <MapProvider>
        <Map ref={mapRef} options={mapOptions} listeners={listeners} />
        <Marker
          ref={markerRef}
          options={{
            coordinate: location,
            draggable: false,
            element: {
              innerHTML: `
                      <style>
                        .pin {
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          width: 40px;
                          height: 40px;
                           background: radial-gradient(circle at 50% 50%, ${theme.accentColor}, ${darken(theme.accentColor, 0.4)});
                           border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%;
                          box-shadow:
                            0 4px 8px rgba(0, 0, 0, 0.3),
                            inset 0 2px 4px rgba(255, 255, 255, 0.6);
                          position: relative;
                          cursor: pointer;
                          transition: transform 0.2s ease;
                        }
                      </style>
                      <div class="pin" title="Location">
                      </div>
                    `,
            },
          }}
        />
      </MapProvider>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});
