import { registerWidgetTaskHandler } from "react-native-android-widget";
import { TestWidget } from "./TestWidget";
import { CompassWidget } from "./CompassWidget";
import { loadWidgetHeading } from "../lib/compass";

export async function widgetTaskHandler(props: any) {
  const { widgetAction, widgetName, renderWidget } = props;

  switch (widgetName) {
    case "TestWidget":
      switch (widgetAction) {
        case "WIDGET_ADDED":
        case "WIDGET_UPDATE":
        case "WIDGET_RESIZED":
          renderWidget(<TestWidget />);
          break;
        default:
          break;
      }
      break;

    case "CompassWidget":
      switch (widgetAction) {
        case "WIDGET_ADDED":
        case "WIDGET_UPDATE":
        case "WIDGET_RESIZED":
          const heading = await loadWidgetHeading();
          renderWidget(<CompassWidget heading={heading} />);
          break;
        default:
          break;
      }
      break;

    default:
      break;
  }
}

registerWidgetTaskHandler(widgetTaskHandler);