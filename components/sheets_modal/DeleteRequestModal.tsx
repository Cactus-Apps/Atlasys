import React, { useMemo } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { AlertTriangle, X, Clock } from "lucide-react-native";
import { useAppTheme } from "@/lib/theme";
import { useTranslation } from "react-i18next";

interface Props {
  visible: boolean;
  status: "pending" | "completed" | null;
  onClose: () => void;
}

export default function DeleteRequestModal({
  visible,
  status,
  onClose,
}: Props) {
  const theme = useAppTheme();
  const { t } = useTranslation();

  const s = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: theme.overlay,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        },
        card: {
          width: "100%",
          borderRadius: 24,
          padding: 24,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 20,
          elevation: 12,
        },
        cardHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        },
        cardTitle: { fontSize: 20, fontWeight: "700" },
        closeBtn: {
          backgroundColor: theme.cardBgSecondary,
          borderRadius: 20,
          padding: 6,
        },
        iconContainer: {
          alignItems: "center",
          marginBottom: 16,
        },
        message: {
          fontSize: 15,
          lineHeight: 22,
          textAlign: "center",
          marginBottom: 24,
        },
        okBtn: {
          backgroundColor:
            status === "completed" ? theme.danger : theme.tabIndicator,
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: "center",
        },
        okText: { fontWeight: "700", fontSize: 16 },
      }),
    [theme, status],
  );

  if (!visible || !status) return null;

  const isDeleted = status === "completed";
  const IconComponent = isDeleted ? AlertTriangle : Clock;
  const iconColor = isDeleted ? theme.danger : theme.tabIndicator;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={[s.card, { backgroundColor: theme.cardBg }]}>
          <View style={s.cardHeader}>
            <Text style={[s.cardTitle, { color: theme.textColor }]}>
              {t("Delete_account")}
            </Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <X size={18} color={theme.subTextColor} />
            </TouchableOpacity>
          </View>

          <View style={s.iconContainer}>
            <IconComponent size={48} color={iconColor} />
          </View>

          <Text style={[s.message, { color: theme.subTextColor }]}>
            {isDeleted
              ? t("DeleteRequest_account_deleted_message")
              : t("DeleteRequest_account_completed_message")}
          </Text>

          <TouchableOpacity style={s.okBtn} onPress={onClose}>
            <Text style={[s.okText, { color: theme.white }]}>
              {t("DeleteRequest_understood")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
