import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";

export function Header({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  const theme = useAppTheme();
  const { cardBg, textColor, borderColor } = theme;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: cardBg,
        borderBottomWidth: 1,
        borderBottomColor: borderColor,
      }}
    >
      <TouchableOpacity
        onPress={onBack}
        style={{ padding: 8, borderRadius: 12 }}
      >
        <ChevronLeft size={24} color={textColor as any} />
      </TouchableOpacity>
      <Text
        style={{
          fontFamily: fonts.bold,
          fontSize: 24,
          color: theme.textColor,
        }}
      >
        {title}
      </Text>
      <View style={{ width: 44 }} />
    </View>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const theme = useAppTheme();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: 13,
          color: theme.subTextColor,
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

export function NoticeBox({ text }: { text: string }) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        marginTop: 16,
        padding: 14,
        borderRadius: 14,
        backgroundColor: theme.dangerLight,
        borderColor: theme.danger,
        borderWidth: 1,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.regular,
          fontSize: 13,
          lineHeight: 19,
          color: theme.textColor,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
