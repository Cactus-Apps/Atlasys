import { createWidget } from "expo-widgets";
import { Box, Row, Column, Text, Button } from "@expo/ui/jetpack-compose";
import {
  fillMaxSize,
  fillMaxWidth,
  padding,
  background,
  clip,
  Shapes,
  wrapContentHeight,
} from "@expo/ui/jetpack-compose/modifiers";

export type TestWidgetProps = {
  title?: string;
  message?: string;
  count?: number;
};

export function TestWidgetComponent(props: TestWidgetProps) {
  "widget";
  const { title = "Atlasys", message = "Test Widget", count = 0 } = props;
  return (
    <Box
      modifiers={[
        fillMaxSize(),
        background("#0F1B2D"),
        padding(12, 12, 12, 12),
      ]}
    >
      <Column
        modifiers={[
          fillMaxSize(),
          padding(14, 14, 14, 14),
          background("#1C2B45"),
          clip(Shapes.RoundedCorner(16)),
        ]}
        horizontalAlignment="start"
        verticalArrangement="spaceBetween"
      >
        <Row
          modifiers={[fillMaxWidth()]}
          horizontalArrangement="spaceBetween"
          verticalAlignment="center"
        >
          <Text
            style={{ fontSize: 16, fontWeight: "bold" }}
            color="#FFFFFF"
            maxLines={1}
            overflow="ellipsis"
          >
            {title}
          </Text>
          <Box
            modifiers={[
              padding(8, 4, 8, 4),
              background("#E63946"),
              clip(Shapes.RoundedCorner(10)),
            ]}
          >
            <Text style={{ fontSize: 12, fontWeight: "bold" }} color="#FFFFFF">
              {count}
            </Text>
          </Box>
        </Row>
        <Text
          style={{ fontSize: 13 }}
          color="#9DB8D9"
          maxLines={2}
          overflow="ellipsis"
        >
          {message}
        </Text>
        <Button
          modifiers={[wrapContentHeight()]}
          onClick={() => ({ count: count + 1 })}
          colors={{ containerColor: "#2E4A75", contentColor: "#FFFFFF" }}
        >
          <Text style={{ fontSize: 13, fontWeight: "bold" }} color="#FFFFFF">
            +1
          </Text>
        </Button>
      </Column>
    </Box>
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