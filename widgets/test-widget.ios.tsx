import { createWidget } from "expo-widgets";
import { ZStack, VStack, HStack, Text } from "@expo/ui/swift-ui";
import {
  background,
  padding,
  font,
  foregroundStyle,
  shapes,
} from "@expo/ui/swift-ui/modifiers";

export type TestWidgetProps = {
  title?: string;
  message?: string;
  count?: number;
};

export function TestWidgetComponent(props: TestWidgetProps) {
  "widget";
  const { title = "Atlasys", message = "Test Widget", count = 0 } = props;
  return (
    <ZStack modifiers={[background("#0F1B2D")]}>
      <VStack
        alignment="leading"
        spacing={10}
        modifiers={[
          padding({ all: 14 }),
          background("#1C2B45", shapes.roundedRectangle({ cornerRadius: 16 })),
        ]}
      >
        <HStack spacing={8} alignment="center">
          <Text
            modifiers={[
              font({ size: 16, weight: "bold" }),
              foregroundStyle("#FFFFFF"),
            ]}
          >
            {title}
          </Text>
          <Text
            modifiers={[
              font({ size: 12, weight: "bold" }),
              foregroundStyle("#FFFFFF"),
              padding({ all: 4 }),
              background("#E63946", shapes.roundedRectangle({ cornerRadius: 10 })),
            ]}
          >
            {count}
          </Text>
        </HStack>
        <Text
          modifiers={[
            font({ size: 13, weight: "regular" }),
            foregroundStyle("#9DB8D9"),
          ]}
        >
          {message}
        </Text>
      </VStack>
    </ZStack>
  );
}

export const widget = createWidget(
  "TestWidget",
  TestWidgetComponent,
  {
    title: "Atlasys",
    message: "Test Widget",
    count: 3,
  },
);

export default widget;