import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ShieldCheck } from "lucide-react-native";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";

type Props = {
  text: string;
};

export default function PrivacyNotice({ text }: Props) {
  const theme = useAppTheme();

  const s = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 10,
          backgroundColor: theme.cardBgSecondary,
          borderRadius: 14,
          padding: 14,
          marginTop: 16,
        },
        icon: {
          marginTop: 1,
        },
        text: {
          flex: 1,
          fontSize: 12,
          fontFamily: fonts.regular,
          color: theme.subTextColor,
          lineHeight: 18,
        },
      }),
    [theme],
  );

  return (
    <View style={s.row}>
      <ShieldCheck size={16} color={theme.subTextColor} style={s.icon} />
      <Text style={s.text}>{text}</Text>
    </View>
  );
}
