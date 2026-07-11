import { useMemo, useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
} from "react-native";
import { ShieldCheck, BarChart3, ArrowRight, Check } from "lucide-react-native";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/lib/storage/zustand";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function UpdateInfoModal({ visible, onClose }: Props) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const analyticsOn = useAuthStore((s) => s.settings.analytics);
  const updateSettings = useAuthStore((s) => s.updateSettings);

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
        iconWrap: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.primaryLight,
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
          marginBottom: 12,
        },
        body: {
          fontSize: 14,
          fontFamily: fonts.regular,
          color: theme.subTextColor,
          lineHeight: 22,
          textAlign: "center",
          marginBottom: 24,
        },
        toggleRow: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.cardBgSecondary,
          borderRadius: 16,
          padding: 16,
          gap: 12,
          marginBottom: 24,
        },
        toggleIcon: {
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: analyticsOn
            ? theme.primaryLight
            : "rgba(255,255,255,0.05)",
          alignItems: "center",
          justifyContent: "center",
        },
        toggleText: {
          flex: 1,
        },
        toggleLabel: {
          fontSize: 14,
          fontFamily: fonts.semibold,
          color: theme.textColor,
        },
        toggleSub: {
          fontSize: 12,
          fontFamily: fonts.regular,
          color: theme.subTextColor,
          marginTop: 2,
        },
        btn: {
          backgroundColor: analyticsOn ? theme.primary : theme.cardBgSecondary,
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: "center",
          flexDirection: "row",
          gap: 10,
          justifyContent: "center",
        },
        btnText: {
          fontFamily: fonts.bold,
          fontSize: 16,
          color: analyticsOn ? theme.white : theme.subTextColor,
        },
        dots: {
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
          marginTop: 16,
        },
        dot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.borderColor,
        },
        dotActive: {
          backgroundColor: theme.primary,
        },
      }),
    [theme, analyticsOn],
  );

  const handleClose = useCallback(() => {
    setPage(0);
    onClose();
  }, [onClose]);

  const handleNext = useCallback(() => {
    setPage(1);
  }, []);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.card}>
          {page === 0 ? (
            <>
              <View style={s.iconWrap}>
                <ShieldCheck size={28} color={theme.primary} />
              </View>
              <Text style={s.title}>{t("UpdateInfo_title")}</Text>
              <Text style={s.body}>{t("UpdateInfo_page1_body")}</Text>
              <TouchableOpacity
                style={s.toggleRow}
                activeOpacity={0.7}
                onPress={() =>
                  updateSettings({ analytics: !analyticsOn })
                }
              >
                <View style={s.toggleIcon}>
                  <BarChart3
                    size={20}
                    color={analyticsOn ? theme.primary : theme.subTextColor}
                  />
                </View>
                <View style={s.toggleText}>
                  <Text style={s.toggleLabel}>
                    {t("UpdateInfo_analytics_label")}
                  </Text>
                  <Text style={s.toggleSub}>
                    {t("UpdateInfo_analytics_sub")}
                  </Text>
                </View>
                <Switch
                  value={analyticsOn}
                  onValueChange={(v) => updateSettings({ analytics: v })}
                  trackColor={{
                    false: theme.borderColor,
                    true: theme.primaryLight,
                  }}
                  thumbColor={analyticsOn ? theme.primary : theme.white}
                  ios_backgroundColor={
                    Platform.OS === "ios" ? theme.borderColor : undefined
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={s.btn}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={s.btnText}>{t("UpdateInfo_next")}</Text>
                <ArrowRight size={18} color={analyticsOn ? theme.white : theme.subTextColor} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={s.iconWrap}>
                <Check size={28} color={theme.primary} />
              </View>
              <Text style={s.title}>{t("UpdateInfo_page2_title")}</Text>
              <Text style={s.body}>{t("UpdateInfo_page2_body")}</Text>
              <TouchableOpacity
                style={s.toggleRow}
                activeOpacity={0.7}
                onPress={() =>
                  updateSettings({ analytics: !analyticsOn })
                }
              >
                <View style={s.toggleIcon}>
                  <BarChart3
                    size={20}
                    color={analyticsOn ? theme.primary : theme.subTextColor}
                  />
                </View>
                <View style={s.toggleText}>
                  <Text style={s.toggleLabel}>
                    {t("UpdateInfo_analytics_label")}
                  </Text>
                  <Text style={s.toggleSub}>
                    {t("UpdateInfo_analytics_sub")}
                  </Text>
                </View>
                <Switch
                  value={analyticsOn}
                  onValueChange={(v) => updateSettings({ analytics: v })}
                  trackColor={{
                    false: theme.borderColor,
                    true: theme.primaryLight,
                  }}
                  thumbColor={analyticsOn ? theme.primary : theme.white}
                  ios_backgroundColor={
                    Platform.OS === "ios" ? theme.borderColor : undefined
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={s.btn}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={s.btnText}>{t("UpdateInfo_finish")}</Text>
                <Check size={18} color={analyticsOn ? theme.white : theme.subTextColor} />
              </TouchableOpacity>
            </>
          )}
          <View style={s.dots}>
            <View style={[s.dot, page === 0 && s.dotActive]} />
            <View style={[s.dot, page === 1 && s.dotActive]} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
