import { Skeleton } from "moti/skeleton";
import { View, StyleSheet } from "react-native";
import { useAppTheme } from "@/lib/theme";

export function CardSkeletonView() {
  const theme = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.cardBg, borderRadius: theme.isModern ? 24 : 16 }]}>
      <Skeleton colorMode={theme.isDark ? "dark" : "light"} radius={16} height={120} width={340} />
    </View>
  );
}

export function CardSkeletonViewText() {
  const theme = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.cardBg, borderRadius: theme.isModern ? 24 : 16 }]}>
      <Skeleton colorMode={theme.isDark ? "dark" : "light"} radius={16} height={120} width={340} />
      <View
        style={{
          position: "absolute",
          bottom: 92,
          right: 10,
          left: 30,
        }}
      >
        <Skeleton width={100} radius="round" colorMode={theme.isDark ? "dark" : "light"} height={22} />
      </View>
      <View
        style={{
          position: "absolute",
          bottom: 22,
          right: 10,
          left: 30,
        }}
      >
        <Skeleton width={240} radius={16} colorMode={theme.isDark ? "dark" : "light"} height={60} />
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
