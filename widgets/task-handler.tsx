import { registerWidgetTaskHandler } from "react-native-android-widget";
import { TestWidget } from "./TestWidget";

export async function widgetTaskHandler(props: any) {
  const { widgetAction, widgetName, renderWidget } = props;

  if (widgetName === "TestWidget") {
    switch (widgetAction) {
      case "WIDGET_ADDED":
      case "WIDGET_UPDATE":
      case "WIDGET_RESIZED":
        renderWidget(<TestWidget />);
        break;
      default:
        break;
    }
  }
}

registerWidgetTaskHandler(widgetTaskHandler);