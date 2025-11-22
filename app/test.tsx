import { Clock4 } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function InitialComponent ()  {
  const [time, setTime] = useState(new Date());
  return (
  <View style={styles.card}>
    <View>
      <Text style={styles.time}> Aktuelle Zeit</Text>
      <Text style={styles.timetime}>
        {""}
        {time.toLocaleTimeString()}
      </Text>
      <Text style={styles.timezone}> {timezone}</Text>
    </View>
    <View>
      <Clock4
        style={{ marginLeft: 158, marginTop: 22 }}
        color="#3B82F6"
        strokeWidth={3}
        size={36}
      />
    </View>
  </View>
  );
}

const initialData = [
  { key: "1", component: <InitialComponent /> },
  { key: "2", label: "View 2" },
  { key: "3", label: "View 3" },
];

interface Item {
  id: number;
  label: string;
}

interface RenderItemProps {
  item: any;
  drag: () => void;
  isActive: boolean;
}

export default function App(props: { items: Item[] }) {
  const [data, setData] = useState(initialData);
  const [DragOn, setDragOn] = useState(true);

  const renderItem = ({ item, drag, isActive }: RenderItemProps) => (
    <View
      style={{
        backgroundColor: isActive ? "#fff" : "transparent",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        margin: 4,
      }}
    >
        {DragOn === true ? 
      <TouchableOpacity onLongPress={drag}>
      <Text> {item.component}</Text>
      </TouchableOpacity>
        : <Text> {item.component}</Text>}
    </View>
  );

  return (
    <GestureHandlerRootView>
      <DraggableFlatList
        data={data}
        onDragEnd={({ data }) => setData(data)}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    width: 340,
    height: 120,
    elevation: 1,
    marginVertical: 12,
    paddingVertical: 13,
    paddingHorizontal: 13,
    flexDirection: "row",
  },
  time: {
    color: "#4B5563",
    fontSize: 18,
    fontWeight: "500",
  },
  timetime: {
    color: "#1F2937",
    fontSize: 26,
    fontWeight: "700",
  },
  timezone: {
    color: "#6B7280",
    fontSize: 17,
    fontWeight: "500",
  },
});
