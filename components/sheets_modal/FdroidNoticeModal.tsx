import { useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { TriangleAlertIcon, X } from "lucide-react-native";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { useTranslation } from "react-i18next";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function FdroidNoticeModal({ visible, onClose }: Props) {
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
          maxHeight: "85%",
          borderRadius: 24,
          padding: 28,
          backgroundColor: theme.cardBg,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 20,
          elevation: 12,
        },
        closeBtn: {
          position: "absolute",
          top: 16,
          right: 16,
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: theme.cardBgSecondary,
          alignItems: "center",
          justifyContent: "center",
        },
        iconWrap: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: theme.dangerLight,
          alignItems: "center",
          justifyContent: "center",
          alignSelf: "center",
          marginBottom: 20,
        },
        title: {
          fontSize: 20,
          fontFamily: fonts.bold,
          color: theme.textColor,
          textAlign: "center",
          marginBottom: 16,
        },
        bodyScroll: {
          flexGrow: 0,
          marginBottom: 24,
        },
        body: {
          fontSize: 14,
          fontFamily: fonts.regular,
          color: theme.subTextColor,
          lineHeight: 22,
          textAlign: "left",
        },
        btn: {
          backgroundColor: theme.primary,
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: "center",
          justifyContent: "center",
        },
        btnText: {
          fontFamily: fonts.bold,
          fontSize: 16,
          color: theme.white,
        },
      }),
    [theme],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.card}>
          <TouchableOpacity
            style={s.closeBtn}
            activeOpacity={0.7}
            onPress={onClose}
          >
            <X size={16} color={theme.subTextColor} />
          </TouchableOpacity>

          <View style={s.iconWrap}>
            <TriangleAlertIcon size={30} color={theme.danger} />
          </View>
          <Text style={s.title}>{t("FdroidNotice_title")}</Text>

          <ScrollView
            style={s.bodyScroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={s.body}>{t("FdroidNotice_body")}</Text>
          </ScrollView>

          <TouchableOpacity style={s.btn} activeOpacity={0.7} onPress={onClose}>
            <Text style={s.btnText}>{t("FdroidNotice_btn")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
