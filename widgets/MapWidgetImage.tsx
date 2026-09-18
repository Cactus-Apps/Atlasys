import {
  FlexWidget,
  ImageWidget,
  type ImageWidgetSource,
} from "react-native-android-widget";

const PLACEHOLDER_DATA_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGOQsYoDAAEqALXNcX2gAAAAAElFTkSuQmCC";

export function MapWidgetImage({ uri }: { uri?: string | null }) {
  const image: ImageWidgetSource =
    uri && uri.length > 0
      ? (uri as ImageWidgetSource)
      : PLACEHOLDER_DATA_URI;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 16,
      }}
    >
      <ImageWidget
        image={image}
        imageWidth={1000}
        imageHeight={440}
        radius={16}
        resizeMode="cover"
        style={{
          width: "match_parent",
          height: "match_parent",
        }}
      />
    </FlexWidget>
  );
}