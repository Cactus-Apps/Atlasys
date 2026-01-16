import {
  MapProvider,
  Map,
  Marker,
  MapRef,
  MarkerRef,
  GeoJSONSource,
  VectorTileSource,
} from "react-native-maplibre-gl-js";
import React, { useEffect, useRef, useState } from "react";
import { TouchableOpacity, View, Text, Modal, Alert } from "react-native";

const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.EXPO_PUBLIC_RAPIDAPI_HOST;

type CityResult = {
  id: number | string;
  city: string;
  name?: string;
  country: string;
  region?: string;
  latitude: number;
  longitude: number;
  population?: number;
};

export default function App() {
  const [query, setQuery] = useState("");
  const [start, setStart] = useState<[number, number] | null>([9, 53]);
  const [end, setEnd] = useState<[number, number] | null>([10, 50]);
  const [city, setCity] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [Info, setInfo] = useState<{
    distance: number;
    duration: number;
  } | null>();
  const [profile, setProfile] = useState<"driving" | "cycling" | "walking">(
    "driving"
  );
  const [route, setRoute] = useState<any>(null);
  const mapRef = useRef<MapRef | null>(null);
  const markerRef = useRef<MarkerRef | null>(null);
  const markerRef2 = useRef<MarkerRef | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [results, setResults] = useState<CityResult[]>([]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => searchCities(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  async function searchCities(q: string) {
    setLoadingSearch(true);
    try {
      const url = `https://${RAPIDAPI_HOST}/v1/geo/cities?namePrefix=${encodeURIComponent(
        q
      )}&limit=8&sort=-population`;
      const resp = await fetch(url, {
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY ?? "",
          "X-RapidAPI-Host": RAPIDAPI_HOST ?? "",
        },
      });
      if (!resp.ok) {
        console.log("GeoDB_error", `${resp.status}`);
        setResults([]);
        setLoadingSearch(false);
        return;
      }
      const json = await resp.json();
      const arr = (json.data || []).map((it: any) => ({
        id: it.id ?? `${it.latitude}-${it.longitude}`,
        city: it.city || it.name || `${it.city}, ${it.country}`,
        name: it.name ?? it.city,
        country: it.country,
        region: it.region,
        latitude: it.latitude,
        longitude: it.longitude,
        population: it.population,
      }));
      setResults(arr);
    } catch (err) {
      Alert.alert("Search_error", `${err}`);
      setResults([]);
    } finally {
      setLoadingSearch(false);
    }
  }

  const fitRouteBounds = () => {
    if (!mapRef.current || !start || !end) return;
    const bounds: [number, number, number, number] = [
      Math.min(start[0], end[0]),
      Math.min(start[1], end[1]),
      Math.max(start[0], end[0]),
      Math.max(start[1], end[1]),
    ];
    mapRef.current.fitBounds(bounds, {
      padding: 60,
      duration: 800,
    });
  };

  useEffect(() => {
    if (!start || !end) return;

    const fetchRoute = async () => {
      const url =
        `https://router.project-osrm.org/route/v1/${profile}/` +
        `${start[0]},${start[1]};${end[0]},${end[1]}` +
        `?overview=full&alternatives=true&geometries=geojson`;

      const res = await fetch(url);
      const json = await res.json();

      const geometry = json.routes?.[0]?.geometry;
      if (!json.routes?.length) return;

      setRoute(json.routes);
      setInfo({
        distance: json.routes[0].distance,
        duration: json.routes[0].duration,
      });
      fitRouteBounds();
    };

    fetchRoute().catch(console.error);
  }, [start, end, profile]);

  return (
    <MapProvider>
      <Map
        ref={mapRef}
        options={{ style: "https://tiles.openfreemap.org/styles/bright" }}
      />
      {start && (
        <Marker
          ref={markerRef}
          options={{
            coordinate: start,
            element: {
              innerHTML: `<h1>Start</h1>`,
            },
          }}
        />
      )}
      {end && (
        <Marker
          ref={markerRef2}
          options={{
            coordinate: end,
            element: {
              innerHTML: `<h1>End</h1>`,
            },
          }}
        />
      )}
      {route &&
        route.map((r: any, i: number) => (
          <GeoJSONSource
            key={`r${i}`}
            id={`route-${i}`}
            source={{ type: "geojson", data: r.geometry }}
            layers={[
              {
                layer: {
                  id: `route-line-${i}`,
                  type: "line",
                  paint: {
                    "line-width": i === 0 ? 6 : 3,
                    "line-color": i === 0 ? "#1d4ed8" : "#94a3b8",
                  },
                },
              },
            ]}
          />
        ))}
      <VectorTileSource
        id="cities-source"
        source={{
          type: "vector",
          tiles: ["https://tiles.openfreemap.org/planet/v3/{z}/{x}/{y}.pbf"],
        }}
        layers={[
          {
            layer: {
              id: "cities-layer",
              type: "symbol",
              "source-layer": "place",
              minzoom: 5,
              filter: ["in", ["get", "class"], ["literal", ["city", "town"]]],
              layout: {
                "text-field": ["get", "name"],
                "text-size": 12,
              },
            },
            listeners: {
              click: async (e: any) => {
                if (!mapRef.current) return;

                const features = await mapRef.current.queryRenderedFeatures(
                  e.point,
                  { layers: ["cities-layer"] }
                );

                if (!features.length) return;

                const clickLngLat = e.lngLat;

                const closest = features.reduce((best: any, curr: any) => {
                  const [lon, lat] = curr.geometry.coordinates;

                  const d =
                    Math.abs(lon - clickLngLat.lng) +
                    Math.abs(lat - clickLngLat.lat);

                  if (!best) return { f: curr, d };
                  return d < best.d ? { f: curr, d } : best;
                }, null).f;

                const props = closest.properties || {};

                setCity({
                  name:
                    props.name ||
                    props.name_en ||
                    props.name_de ||
                    props.place_name ||
                    "Unbekannte Stadt",
                  country:
                    props.iso_a2 || props.country || props.country_code || null,
                  population: props.population || null,
                });

                setCity({
                  name: closest.properties?.name,
                  country: closest.properties?.iso_a2,
                  population: closest.properties?.population,
                });

                mapRef.current.flyTo({
                  center: closest.geometry.coordinates,
                  zoom: 9,
                  duration: 800,
                });

                setModalVisible(true);
              },
            },
          },
        ]}
      />

      {Info && (
        <View
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            backgroundColor: "#fff",
            padding: 10,
            borderRadius: 8,
          }}
        >
          <Text>{(Info.distance / 1000).toFixed(1)} km</Text>
          <Text>{(Info.duration / 60).toFixed(0)} min</Text>
          <TouchableOpacity>
            <Text> {city?.country}</Text>
          </TouchableOpacity>
        </View>
      )}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              padding: 20,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>
              {city?.name}
            </Text>
            {city?.country && <Text>Land: {city.country}</Text>}
            {city?.population && (
              <Text>Einwohner: {city.population.toLocaleString()}</Text>
            )}

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ color: "blue", marginTop: 10 }}>Schließen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </MapProvider>
  );
}
