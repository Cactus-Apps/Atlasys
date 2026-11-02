import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

type AtlasysWidgetsNativeModule = {
  hasRouteInfoWidget: () => boolean;
  updateRouteInfoWidget: (snapshotJson: string) => boolean;
};

const nativeModule =
  Platform.OS === "android"
    ? requireOptionalNativeModule<AtlasysWidgetsNativeModule>(
        "AtlasysWidgets",
      )
    : null;

export function isWidgetSupportAvailable() {
  return nativeModule !== null;
}

export function hasRouteInfoWidget() {
  if (!nativeModule) return false;

  try {
    return nativeModule.hasRouteInfoWidget();
  } catch {
    return false;
  }
}

export function updateRouteInfoWidget(snapshot: unknown) {
  if (!nativeModule) return false;

  try {
    return nativeModule.updateRouteInfoWidget(JSON.stringify(snapshot));
  } catch {
    return false;
  }
}
