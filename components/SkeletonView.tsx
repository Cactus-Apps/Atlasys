import { Skeleton } from "moti/skeleton";
import { View, StyleSheet } from "react-native";

export function CardSkeletonView() {
  return (
    <View style={styles.card}>
      <Skeleton colorMode="light" radius={16} height={120} width={340} />
    </View>
  );
}

export function CardSkeletonViewText() {
  return (
    <View style={styles.card}>
      <Skeleton colorMode="light" radius={16} height={120} width={340} />
      <View
        style={{
          position: "absolute",
          bottom: 92,
          right: 10,
          left: 30,
        }}
      >
        <Skeleton width={100} radius="round" colorMode="light" height={22} />
      </View>
      <View
        style={{
          position: "absolute",
          bottom: 22,
          right: 10,
          left: 30,
        }}
      >
        <Skeleton width={240} radius={16} colorMode="light" height={60} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 2,
    paddingVertical: 13,
    paddingHorizontal: 13,
  },
  cardSkeletonView: {
    alignItems: "center",
    justifyContent: "center",
    margin: 4,
  },
});
