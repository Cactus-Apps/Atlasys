import {
  Sortable,
  SortableItem,
  SortableRenderItemProps,
} from "react-native-reanimated-dnd";
import { View, Text, StyleSheet, Button } from "react-native";
import { JSX, useCallback } from "react";
import Gpskoords from "@/components/HomeScreenComponents/Gpskoords";
import Clock from "@/components/HomeScreenComponents/Clock";
import Weather from "@/components/weather";
import Timer from "@/components/HomeScreenComponents/Timer";
import * as Sentry from "@sentry/react-native";

const componentMap: Record<string, JSX.Element> = {
  "1": <Clock />,
  "2": <Weather />,
  "3": <Gpskoords />,
  "4": <Timer />,
};

const tasks = [
  { id: "1", title: "Learn React Native" },
  { id: "2", title: "Build an app" },
  { id: "3", title: "Deploy to store" },
  { id: "4", title: "Deploy to store" },
];

export default function Notification() {
  const renderItem = useCallback(
    (props: SortableRenderItemProps<(typeof tasks)[0]>) => {
      const { item, id, ...rest } = props;
      return (
        <SortableItem key={id} id={id} data={item} {...rest}>
          {componentMap[item.id]}
        </SortableItem>
      );
    },
    [],
  );

  return (
    <>
      <Sortable
        data={tasks}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 25 }}
        itemHeight={130}
      />
      <Button
        title="Try!"
        onPress={() => {
          Sentry.captureException(new Error("First error"));
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  task: {},
});
