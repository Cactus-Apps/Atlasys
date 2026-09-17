import { FlexWidget, TextWidget } from "react-native-android-widget";

export function TestWidget() {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1c3a5e",
        borderRadius: 16,
        padding: 16,
      }}
    >
      <TextWidget
        text="Test Widget"
        style={{
          fontSize: 20,
          color: "#ffffff",
          fontFamily: "DMSans_700Bold",
        }}
      />
      <TextWidget
        text="Atlasys"
        style={{
          fontSize: 14,
          color: "#9db8d9",
          marginTop: 4,
          fontFamily: "DMSans_400Regular",
        }}
      />
    </FlexWidget>
  );
}