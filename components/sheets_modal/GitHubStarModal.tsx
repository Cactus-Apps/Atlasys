import { useMemo, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { Star, ExternalLink, X } from "lucide-react-native";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { useTranslation } from "react-i18next";

const GITHUB_URL = "https://github.com/Cactus-Apps/Atlasys";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function GitHubStarModal({ visible, onClose }: Props) {
  const theme = useAppTheme();
  const { t } = useTranslation();

  const handleOpen = useCallback(() => {
    Linking.openURL(GITHUB_URL);
    onClose();
  }, [onClose]);

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
          backgroundColor: "#FFFBEB",
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
          marginBottom: 10,
        },
        body: {
          fontSize: 14,
          fontFamily: fonts.regular,
          color: theme.subTextColor,
          lineHeight: 22,
          textAlign: "center",
          marginBottom: 24,
        },
        btn: {
          backgroundColor: "#24292e",
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: "center",
          flexDirection: "row",
          gap: 10,
          justifyContent: "center",
          marginBottom: 12,
        },
        btnText: {
          fontFamily: fonts.bold,
          fontSize: 16,
          color: theme.white,
        },
        dismissBtn: {
          borderRadius: 16,
          paddingVertical: 12,
          alignItems: "center",
        },
        dismissText: {
          fontFamily: fonts.medium,
          fontSize: 14,
          color: theme.subTextColor,
        },
      }),
    [theme],
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
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
            <Star size={30} color="#F59E0B" fill="#F59E0B" />
          </View>
          <Text style={s.title}>{t("GitHubStar_title")}</Text>
          <Text style={s.body}>{t("GitHubStar_body")}</Text>

          <TouchableOpacity
            style={s.btn}
            activeOpacity={0.7}
            onPress={handleOpen}
          >
            <ExternalLink size={18} color={theme.white} />
            <Text style={s.btnText}>{t("GitHubStar_btn")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.dismissBtn}
            activeOpacity={0.7}
            onPress={onClose}
          >
            <Text style={s.dismissText}>{t("Maybe_later")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
