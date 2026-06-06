import { useMemo, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
} from "react-native";
import { Info, Sparkles, AlertTriangle, X } from "lucide-react-native";
import { Announcement, markAllSeen } from "@/lib/hooks/announcements";
import { useAppTheme } from "@/lib/theme";
import { posthog } from "@/lib/config/posthog";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/AntDesign";
import { Image } from "expo-image";
import * as Sentry from "@sentry/react-native";

const ORION_STORE_URL = "com.orion.store://";
const ORION_STORE_FALLBACK =
  "https://github.com/RookieEnough/Orion-Store/releases";
const RELEASE_PAGE_URL = "https://github.com/Cactus-Apps/Atlasys/releases";

interface Props {
  announcements: Announcement[];
  onClose: () => void;
}

export default function AnnouncementModal({ announcements, onClose }: Props) {
  const theme = useAppTheme();
  const { t, i18n } = useTranslation();

  const storeUpdate = useMemo(
    () => announcements.find((a) => a.is_store_update),
    [announcements],
  );

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
      t,
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
          flexDirection: "row",
          gap: 12,
          justifyContent: "center",
        },
        okText: { fontWeight: "700", fontSize: 16 },
        storeBody: {
          alignItems: "center",
          paddingVertical: 8,
        },
        storeIcon: { marginBottom: 12 },
        storeTitle: {
          fontSize: 18,
          fontWeight: "700",
          textAlign: "center",
          marginBottom: 8,
        },
        storeMsg: {
          fontSize: 14,
          lineHeight: 21,
          textAlign: "center",
          marginBottom: 16,
        },
        storeLink: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 4,
          borderRadius: 12,
          gap: 6,
        },
        storeLinkText: { fontWeight: "600", fontSize: 15 },
        cancelBtn: {
          paddingVertical: 12,
          alignItems: "center",
          marginTop: 8,
        },
        cancelText: { fontWeight: "500", fontSize: 14 },
      }),
    [theme],
  );

  const handleClose = useCallback(async () => {
    await markAllSeen(announcements.map((a) => a.id));
    onClose();
    posthog.capture("announcement_viewed", {
      count: announcements.length,
      type: announcements[0]?.type,
    });
  }, [announcements, onClose]);

  const handleOrionStore = useCallback(async () => {
    try {
      const supported = await Linking.canOpenURL(ORION_STORE_URL);
      if (supported) {
        await Linking.openURL(ORION_STORE_URL);
      } else {
        await Linking.openURL(ORION_STORE_FALLBACK);
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  }, []);

  const handleReleasePage = useCallback(async () => {
    try {
      await Linking.openURL(RELEASE_PAGE_URL);
    } catch (error) {
      Sentry.captureException(error);
    }
  }, []);

  if (!announcements.length) return null;

  // Store-Update Modal
  if (storeUpdate) {
    return (
      <Modal
        visible={true}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={s.overlay}>
          <View style={[s.card, { backgroundColor: theme.cardBg }]}>
            <View style={s.cardHeader}>
              <Text style={[s.cardTitle, { color: theme.textColor }]}>
                {storeUpdate.title}
              </Text>
              <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
                <X size={18} color={theme.subTextColor} />
              </TouchableOpacity>
            </View>

            <View style={s.storeBody}>
              <Sparkles size={48} color={theme.purple} style={s.storeIcon} />
              <Text style={[s.storeTitle, { color: theme.textColor }]}>
                {storeUpdate.title}
              </Text>
              <Text style={[s.storeMsg, { color: theme.subTextColor }]}>
                {storeUpdate.message}
              </Text>
              {storeUpdate.media_url && (
                <Image
                  source={{ uri: storeUpdate.media_url }}
                  style={{
                    width: "100%",
                    height: 200,
                    borderRadius: 12,
                    marginBottom: 16,
                  }}
                  contentFit="contain"
                />
              )}
            </View>

            <TouchableOpacity
              onPress={handleOrionStore}
              style={[s.storeLink, { backgroundColor: theme.orionStore }]}
            >
              <Image
                source={require("../../assets/images/icon-foreground.png")}
                style={{ height: 43, width: 43 }}
              />
              <Text style={[s.storeLinkText, { color: theme.white }]}>
                {t("Announcement_orion_store")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.okBtn, { backgroundColor: theme.white }]}
              onPress={handleReleasePage}
            >
              <Icon name="github" size={20} color={theme.black} />

              <Text style={[s.okText, { color: theme.black }]}>
                {t("Announcement_release_page")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelBtn} onPress={handleClose}>
              <Text style={[s.cancelText, { color: theme.subTextColor }]}>
                {t("Got it")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const title =
    announcements.length === 1
      ? announcements[0].title
      : t("Announcement_multiple", { count: announcements.length });

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
              {title}
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
                  {a.media_url && (
                    <Image
                      source={{ uri: a.media_url }}
                      style={{
                        width: "100%",
                        height: 200,
                        borderRadius: 12,
                        marginTop: 8,
                        marginBottom: 8,
                      }}
                      contentFit="contain"
                    />
                  )}

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
