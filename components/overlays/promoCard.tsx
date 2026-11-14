import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  title: string;
  tagline: string;
  cta: string;
  url: string;
  logo: any;
  preview: any;
  badge?: string;
};

export function PromoCard({
  title,
  tagline,
  cta,
  url,
  logo,
  preview,
  badge,
}: Props) {
  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      accessibilityRole="link"
      accessibilityLabel={`${title}. ${tagline}`}
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={styles.previewWrap}>
        <Image source={preview} style={styles.preview} resizeMode="cover" />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.row}>
        <View style={styles.logoWrap}>
          <Image source={logo} style={styles.logoImg} resizeMode="cover" />
        </View>
        <View style={styles.texts}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.tagline} numberOfLines={2}>
            {tagline}
          </Text>
        </View>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>{cta}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 12,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#1c1c1e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  previewWrap: { height: 140 },
  preview: { width: "50%", height: "50%" },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: "hidden",
  },
  logoImg: {
    width: "100%",
    height: "100%",
    transform: [{ scale: 1 }],
  },
  texts: { flex: 1 },
  title: { color: "#fff", fontSize: 16, fontWeight: "700" },
  tagline: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 },
  cta: {
    backgroundColor: "#2f80ed",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
