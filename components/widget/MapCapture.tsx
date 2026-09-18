import { forwardRef, useImperativeHandle, useRef } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import {
  WebView,
  type WebViewMessageEvent,
} from "react-native-webview";
import type {
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
} from "react-native-webview/lib/WebViewTypes";

export interface WidgetMapPeer {
  id: string;
  latitude: number;
  longitude: number;
  name?: string;
}

export interface MapCaptureProps {
  style?: StyleProp<ViewStyle>;
  center: [number, number];
  zoom: number;
  peers?: WidgetMapPeer[];
  onCapture: (dataUrl: string) => void;
  onError?: (message: string) => void;
}

export interface MapCaptureHandle {
  capture: () => void;
  captureAt: (center: [number, number], zoom: number) => void;
}

const STYLE_URL = "https://tiles.openfreemap.org/styles/bright";
const MAPLIBRE_JS = "https://unpkg.com/maplibre-gl@5.23.0/dist/maplibre-gl.js";
const MAPLIBRE_CSS = "https://unpkg.com/maplibre-gl@5.23.0/dist/maplibre-gl.css";

function buildHtml(
  center: [number, number],
  zoom: number,
  peers: WidgetMapPeer[]
): string {
  const features = peers.map((peer) => ({
    type: "Feature",
    properties: { name: peer.name ?? peer.id },
    geometry: {
      type: "Point",
      coordinates: [peer.longitude, peer.latitude],
    },
  }));

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="${MAPLIBRE_CSS}">
<script src="${MAPLIBRE_JS}"></script>
<style>
  html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
  .maplibregl-ctrl { display: none !important; }
</style>
</head>
<body>
<div id="map"></div>
<script>
(function () {
  var center = ${JSON.stringify(center)};
  var zoom = ${JSON.stringify(zoom)};
  var peers = ${JSON.stringify(features)};

  function post(message) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    }
  }

  if (typeof maplibregl === 'undefined') {
    setTimeout(function () {
      post({ type: 'error', message: 'maplibre-gl CDN failed to load' });
    }, 500);
    return;
  }

  var map = new maplibregl.Map({
    container: 'map',
    style: '${STYLE_URL}',
    center: center,
    zoom: zoom,
    attributionControl: false,
  });

  window.__atlasysCapture = function () {
    try {
      var dataUrl = map.getCanvas().toDataURL('image/jpeg', 0.9);
      post({ type: 'capture', dataUrl: dataUrl });
    } catch (err) {
      post({ type: 'error', message: String(err) });
    }
  };

  window.__atlasysSetCamera = function (center, zoom) {
    map.jumpTo({ center: center, zoom: zoom });
  };

  map.on('load', function () {
    if (peers.length > 0) {
      map.addSource('peers', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: peers },
      });
      map.addLayer({
        id: 'peers-layer',
        type: 'circle',
        source: 'peers',
        paint: {
          'circle-radius': 7,
          'circle-color': '#3B82F6',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });
    }
  });

  map.on('error', function (e) {
    post({ type: 'error', message: String(e && e.error) });
  });

  map.once('idle', function () {
    window.__atlasysCapture();
  });
})();
</script>
</body>
</html>`;
}

export const MapCapture = forwardRef<MapCaptureHandle, MapCaptureProps>(
  function MapCapture(
    { style, center, zoom, peers = [], onCapture, onError },
    ref
  ) {
    const webViewRef = useRef<WebView>(null);
    const initial = useRef({ center, zoom, peers }).current;
    const html = useRef(buildHtml(initial.center, initial.zoom, initial.peers))
      .current;

    const handleMessage = (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data && data.type === "capture" && typeof data.dataUrl === "string") {
          onCapture(data.dataUrl);
        } else if (data && data.type === "error") {
          onError?.(String(data.message));
        }
      } catch {
        // ignore malformed messages
      }
    };

    const handleLoadError = (event: WebViewErrorEvent) =>
      onError?.(String(event.nativeEvent.description ?? event.nativeEvent.title));

    const handleHttpError = (event: WebViewHttpErrorEvent) =>
      onError?.(`HTTP ${event.nativeEvent.statusCode}`);

    useImperativeHandle(ref, () => ({
      capture: () => {
        webViewRef.current?.injectJavaScript(
          "window.__atlasysCapture && window.__atlasysCapture();"
        );
      },
      captureAt: (center: [number, number], zoom: number) => {
        webViewRef.current?.injectJavaScript(
          `window.__atlasysSetCamera && window.__atlasysSetCamera([${center[0]}, ${center[1]}], ${zoom}); setTimeout(function () { window.__atlasysCapture && window.__atlasysCapture(); }, 60);`
        );
      },
    }));

    return (
      <WebView
        ref={webViewRef}
        style={style}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        androidLayerType="hardware"
        onMessage={handleMessage}
        onError={handleLoadError}
        onHttpError={handleHttpError}
        source={{ html }}
      />
    );
  }
);