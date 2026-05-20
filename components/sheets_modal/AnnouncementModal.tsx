import React, { useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  StyleSheet,
} from "react-native";
import { Info, Sparkles, AlertTriangle, X } from "lucide-react-native";
import { Announcement, markAllSeen } from "@/utils/announcements";
import { useAppTheme } from "@/lib/theme";
import { posthog } from "@/lib/config/posthog";
import { useTranslation } from "react-i18next";

interface Props {
  announcements: Announcement[];
  onClose: () => void;
}

export default function AnnouncementModal({ announcements, onClose }: Props) {
  const theme = useAppTheme();
  const { t, i18n } = useTranslation();

  const typeConfig = useMemo(
    () => ({
      info: {
        icon: Info,
        color: theme.info,
        bg: theme.infoLight,
        label: t("Announcement_type_info"),
      },
      update: {
        icon: Sparkles,
        color: theme.purple,
        bg: theme.purpleLight,
        label: t("Announcement_type_update"),
      },
      warning: {
        icon: AlertTriangle,
        color: theme.warning,
        bg: theme.warningLight,
        label: t("Announcement_type_warning"),
      },
    }),
    [
      theme.info,
      theme.infoLight,
      theme.purple,
      theme.purpleLight,
      theme.warning,
      theme.warningLight,
    ],
  );

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
        item: { paddingVertical: 16 },
        itemBorder: {
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
        badge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          alignSelf: "flex-start",
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 20,
          marginBottom: 8,
        },
        badgeText: { fontSize: 12, fontWeight: "700" },
        itemTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
        itemMsg: { fontSize: 14, lineHeight: 21 },
        itemDate: { fontSize: 11, marginTop: 8 },
        okBtn: {
          marginTop: 20,
          backgroundColor: theme.tabIndicator,
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: "center",
        },
        okText: { fontWeight: "700", fontSize: 16 },
      }),
    [theme],
  );

  const handleClose = async () => {
    await markAllSeen(announcements.map((a) => a.id));
    onClose();
    posthog.capture("announcement_viewed", {
      count: announcements.length,
      type: announcements[0]?.type,
    });
  };

  if (!announcements.length) return null;

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={s.overlay}>
        <View style={[s.card, { backgroundColor: theme.cardBg }]}>
          {/* Header */}
          <View style={s.cardHeader}>
            <Text style={[s.cardTitle, { color: theme.textColor }]}>
              {announcements.length === 1
                ? announcements[0].type === "update"
                  ? t("Announcement_type_update")
                  : t("Announcement_single")
                : t("Announcement_multiple", { count: announcements.length })}
            </Text>
            <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
              <X size={18} color={theme.subTextColor} />
            </TouchableOpacity>
          </View>

          {/* Announcements */}
          <ScrollView
            style={{ maxHeight: 420 }}
            showsVerticalScrollIndicator={false}
          >
            {announcements.map((a, idx) => {
              const cfg = typeConfig[a.type] ?? typeConfig.info;
              const Icon = cfg.icon;
              return (
                <View
                  key={a.id}
                  style={[
                    s.item,
                    { borderColor: theme.borderColor },
                    idx < announcements.length - 1 && s.itemBorder,
                  ]}
                >
                  {/* Type Badge */}
                  <View style={[s.badge, { backgroundColor: cfg.bg }]}>
                    <Icon size={14} color={cfg.color} />
                    <Text style={[s.badgeText, { color: cfg.color }]}>
                      {cfg.label}
                    </Text>
                  </View>

                  <Text style={[s.itemTitle, { color: theme.textColor }]}>
                    {a.title}
                  </Text>
                  <Text style={[s.itemMsg, { color: theme.subTextColor }]}>
                    {a.message}
                  </Text>

                  <Text style={[s.itemDate, { color: theme.subTextColor }]}>
                    {new Date(a.created_at).toLocaleDateString(i18n.language, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Button */}
          <TouchableOpacity style={s.okBtn} onPress={handleClose}>
            <Text style={[s.okText, { color: theme.white }]}>
              {t("Got it")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
