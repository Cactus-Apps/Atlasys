// Version 1.3.6 - © Cactus Apps 2026
import { useAuth } from "@/lib/auth/auth-context";
import { supabase } from "@/lib/auth/supabase";
import { Avatar } from "@kolking/react-native-avatar";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { Info, LogOut, ChevronLeft } from "lucide-react-native";
import * as React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import * as Sentry from "@sentry/react-native";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/lib/theme";
import { posthog } from "@/lib/config/posthog";

interface DeleteRequest {
  id: string;
  email: string;
  status: "pending" | "completed" | "rejected" | "deleted";
  requested_at: string;
  updated_at: string;
  expires_at?: string;
}

export default function AccountScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [email, setEmail] = useState<string | null>(null);
  const theme = useAppTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [request, setRequest] = useState<DeleteRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loading2, setLoading2] = useState(false);
  const { t } = useTranslation();
  const [WantToDelete, setWantToDelete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ModalVisible, setModalVisible] = useState(false);
  const [ModalVisible2, setModalVisible2] = useState(false);
  const [daysLeft, setdaysLeft] = useState<number | null>(null);
  const styles = getStyles(theme);

  const copy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert(t("Copied"), t("Error_message_copied_to_clipboard"));
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (user) {
          setEmail(user.email ?? null);
        } else {
          const { data, error } = await supabase.auth.getUser();
          if (error) throw error;
          setEmail(data.user?.email ?? null);
        }
      } catch (err: any) {
        Sentry.captureException(err);
        Alert.alert(t("Error_loading_account"));
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [user]);

  const updateProgress = (status: DeleteRequest["status"]) => {
    switch (status) {
      case "pending":
        setProgress(0.0);
        break;
      case "rejected":
        setProgress(1);
        break;
      case "deleted":
        setProgress(1);
        break;
      case "completed":
        setProgress(1);
        break;
      default:
        setProgress(0);
    }
  };

  useEffect(() => {
    const checkRequestStatus = async () => {
      if (!userId) return;
      setLoading2(true);
      const { data, error } = await supabase
        .from("delete_requests")
        .select("*")
        .eq("user_id", userId)
        .eq("email", email)
        .order("requested_at", { ascending: false })
        .limit(1)
        .single();

      if (data?.expires_at) {
        const now = new Date();
        const expires = new Date(data.expires_at);
        const utc1 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        const utc2 = Date.UTC(
          expires.getFullYear(),
          expires.getMonth(),
          expires.getDate(),
        );
        const days = Math.max(
          0,
          Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24)),
        );
        setdaysLeft(days);
      }

      if (error) {
        setRequest(null);
      } else {
        setRequest(data);
        updateProgress(data.status);
      }
      setLoading2(false);
    };
    checkRequestStatus();
  }, [userId, email]);

  useEffect(() => {
    if (daysLeft !== null) {
      const prog = Math.max(0, Math.min(1, (10 - daysLeft) / 10));
      setProgress(prog);
    }
  }, [daysLeft]);

  useEffect(() => {
    const fetchUserIdAndEmail = async () => {
      const { data, error } = await supabase.auth.getUser();
      const user = data?.user;
      setUserId(user?.id ?? null);
      setEmail(user?.email ?? null);
    };
    fetchUserIdAndEmail();
  }, []);

  const deleteAccuntAction = async () => {
    setModalVisible2(false);
    setWantToDelete(true);
    await createDeleteRequest();
  };

  const createDeleteRequest = async () => {
    if (WantToDelete) {
      setModalVisible2(false);
      if (!userId || !email) {
        Alert.alert(t("Error"), t("User_ID_or_email_could_not_be_fetched"));
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const { data: existing, error: errorExisting } = await supabase
        .from("delete_requests")
        .select("*")
        .eq("user_id", userId)
        .gte("requested_at", today.toISOString())
        .lt("requested_at", tomorrow.toISOString());

      if (existing && existing.length > 0) {
        Alert.alert(t("Limit_reached"), t("only_one_deletion"));
        return;
      }
      const verification_code = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();

      setLoading(true);

      const { data, error } = await supabase.from("delete_requests").insert([
        {
          user_id: userId,
          email,
          verification_code,
          status: "pending",
        },
      ]);

      if (error) {
        Sentry.captureException(error);
        Alert.alert(t("Error"), t("Request_could_not_be_sent"));
      } else {
        posthog.capture("user_delete-account");
        Alert.alert(t("Success"), t("deletion_request_created"));
        setRequest(data as any);
        updateProgress("pending");
      }
      setLoading(false);
    } else {
      setModalVisible2(true);
    }
  };

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("delete_requests-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delete_requests" },
        (payload: any) => {
          if (payload.new.user_id === userId && payload.new.email === email) {
            const updated = payload.new as DeleteRequest;
            setRequest(updated);
            updateProgress(updated.status);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, email]);

  if (loading) {
    return (
      <View style={styles.all}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const textColor = theme.textColor;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.navigate("/(tabs)/profilescreen")}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("Account")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Avatar
              size={100}
              name={email ?? "U"}
              email={email ?? undefined}
              colorize={true}
              radius={50}
              badgeColor={theme.primary}
            />
          </View>
          <Text style={styles.emailText}>{email}</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{t("Account_status_active")}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("Account_section_security")}</Text>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => copy(userId ?? "")}
          >
            <View style={styles.menuIconContainer}>
              <Info size={20} color={theme.primary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuLabel}>{t("Account_menu_user_id")}</Text>
              <Text style={styles.menuValue} numberOfLines={1}>
                {userId}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>
            {t("Account_danger_zone_title")}
          </Text>
          <TouchableOpacity
            onPress={createDeleteRequest}
            disabled={loading}
            style={styles.deleteButton}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={theme.white} />
            ) : (
              <Text style={styles.deleteButtonText}>{t("Delete_account")}</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.dangerNote}>{t("Account_danger_zone_note")}</Text>
        </View>

        {request &&
          (request.status === "pending" || request.status === "completed") && (
            <View style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <Text style={styles.requestTitle}>
                  {t("Account_deletion_request_title")}
                </Text>
                <View
                  style={[
                    styles.statusTag,
                    {
                      backgroundColor:
                        request.status === "pending" ? "#FEF3C7" : "#D1FAE5",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTagText,
                      {
                        color:
                          request.status === "pending" ? "#92400E" : "#065F46",
                      },
                    ]}
                  >
                    {request.status === "pending"
                      ? t("Pending")
                      : t("Completed")}
                  </Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBarWrapper}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progress * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {t("Account_progress_percent", {
                    percent: (progress * 100).toFixed(0),
                  })}
                </Text>
              </View>

              {daysLeft !== null && (
                <Text style={styles.daysText}>
                  {t(`Your_account_will_be_deleted_in`)} {daysLeft} {t("days")}
                </Text>
              )}
            </View>
          )}

        <TouchableOpacity
          onPress={signOut}
          style={styles.signOutWrapper}
          activeOpacity={0.7}
        >
          <View style={styles.signOutButton}>
            <LogOut size={20} color={theme.danger} strokeWidth={2.5} />
            <Text style={styles.signOutText}>{t("Sign_Out")}</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={ModalVisible2}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible2(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t("Delete_account")}</Text>
            <Text style={styles.modalText}>{t("sure_to_delete")}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={deleteAccuntAction}
                style={styles.modalDeleteButton}
              >
                <Text style={styles.modalButtonText}>{t("Delete")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible2(false)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalButtonText}>{t("Cancel")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {request?.status === "rejected" && (
        <Modal
          visible={ModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{t("No_permission")}</Text>
              <Text style={styles.modalText}>
                {t("no_permission_to_delete")}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalButtonText}>{t("okay")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const {
    bg,
    cardBg,
    primaryLight,
    textColor,
    subTextColor,
    borderColor,
    isModern,
    primary,
    danger,
    dangerLight,
    success,
    successLight,
    overlay,
    white,
  } = theme;

  const defaultRadius = isModern ? 24 : 20;
  const innerRadius = isModern ? 16 : 10;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: cardBg,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: textColor,
    },
    backButton: {
      padding: 8,
      borderRadius: innerRadius,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    profileSection: {
      alignItems: "center",
      paddingVertical: 32,
      backgroundColor: cardBg,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    avatarWrapper: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
      marginBottom: 16,
    },
    emailText: {
      fontSize: 20,
      fontWeight: "800",
      color: textColor,
      marginBottom: 8,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: successLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: innerRadius,
      gap: 6,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: success,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "700",
      color: success,
    },
    card: {
      margin: 20,
      backgroundColor: cardBg,
      borderRadius: defaultRadius,
      padding: 16,
      borderWidth: 1,
      borderColor: borderColor,
      shadowColor: "#000",
      shadowOpacity: isModern ? (theme.isDark ? 0 : 0.06) : 0,
      shadowRadius: isModern ? 12 : 0,
      elevation: isModern ? 4 : 0,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: subTextColor,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 16,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
    },
    menuIconContainer: {
      width: 44,
      height: 44,
      borderRadius: innerRadius,
      backgroundColor: isModern ? theme.iconBg : primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    menuTextContainer: {
      marginLeft: 16,
      flex: 1,
    },
    menuLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: subTextColor,
    },
    menuValue: {
      fontSize: 15,
      fontWeight: "700",
      color: textColor,
      marginTop: 2,
    },
    dangerZone: {
      margin: 20,
      marginTop: 0,
      backgroundColor: dangerLight,
      borderRadius: defaultRadius,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.isDark ? danger : "rgba(239, 68, 68, 0.1)",
      shadowColor: "#000",
      shadowOpacity: isModern ? (theme.isDark ? 0 : 0.06) : 0,
      shadowRadius: isModern ? 12 : 0,
      elevation: isModern ? 4 : 0,
    },
    dangerTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: danger,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 16,
    },
    deleteButton: {
      backgroundColor: danger,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
      marginBottom: 12,
    },
    deleteButtonText: {
      color: white,
      fontWeight: "700",
      fontSize: 16,
    },
    dangerNote: {
      fontSize: 12,
      color: danger,
      textAlign: "center",
      lineHeight: 18,
    },
    signOutWrapper: {
      marginHorizontal: 20,
      marginTop: 10,
    },
    signOutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: cardBg,
      paddingVertical: 14,
      borderRadius: innerRadius,
      borderWidth: 1,
      borderColor: borderColor,
      gap: 10,
    },
    signOutText: {
      color: danger,
      fontWeight: "700",
      fontSize: 16,
    },
    requestCard: {
      margin: 20,
      marginTop: 0,
      backgroundColor: cardBg,
      borderRadius: defaultRadius,
      padding: 20,
      borderWidth: 1,
      borderColor: borderColor,
      shadowColor: "#000",
      shadowOpacity: isModern ? (theme.isDark ? 0 : 0.06) : 0,
      shadowRadius: isModern ? 12 : 0,
      elevation: isModern ? 4 : 0,
    },
    requestHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    requestTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: textColor,
    },
    statusTag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusTagText: {
      fontSize: 12,
      fontWeight: "700",
    },
    progressContainer: {
      marginBottom: 16,
    },
    progressBarWrapper: {
      height: 8,
      backgroundColor: theme.cardBgSecondary,
      borderRadius: 4,
      overflow: "hidden",
      marginBottom: 8,
    },
    progressBarFill: {
      height: "100%",
      backgroundColor: primary,
      borderRadius: 4,
    },
    progressText: {
      fontSize: 12,
      fontWeight: "600",
      color: subTextColor,
    },
    daysText: {
      fontSize: 14,
      fontWeight: "700",
      color: textColor,
      textAlign: "center",
    },
    modalBackground: {
      flex: 1,
      backgroundColor: overlay,
      justifyContent: "center",
      alignItems: "center",
    },
    modalBox: {
      width: "85%",
      backgroundColor: cardBg,
      borderRadius: defaultRadius,
      padding: 24,
      borderWidth: 1,
      borderColor: borderColor,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: textColor,
      textAlign: "center",
      marginBottom: 12,
    },
    modalText: {
      fontSize: 16,
      color: subTextColor,
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 22,
    },
    modalButtons: {
      flexDirection: "row",
      gap: 12,
    },
    modalDeleteButton: {
      flex: 1,
      backgroundColor: danger,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
    },
    modalCancelButton: {
      flex: 1,
      backgroundColor: theme.cardBgSecondary,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: textColor,
    },
    all: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: bg,
    },
  });
};
