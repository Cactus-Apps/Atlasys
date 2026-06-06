import { useAuth } from "@/lib/auth/auth-context";
import { supabase } from "@/lib/auth/supabase";
import { Avatar } from "@avatune/react-native";
import nevmstasTheme from "@avatune/nevmstas-theme/react-native";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import {
  Info,
  LogOut,
  ChevronLeft,
  Shuffle,
  Check,
  Pencil,
  X,
  PaintBucket,
} from "lucide-react-native";
import { useEffect, useState, useCallback, useMemo } from "react";
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
import { useAuthStore } from "@/lib/storage/zustand";
import { generateRandomAvatarConfig } from "@/lib/avatar/avatar-utils";

interface DeleteRequest {
  id: string;
  email: string;
  status: "pending" | "completed" | null;
  requested_at: string;
  updated_at: string;
  expires_at?: string;
}

type PartOption = {
  label: string;
  value: string;
};

type PartCategory = {
  key: string;
  label: string;
  options: PartOption[];
};

const PART_CATEGORIES: PartCategory[] = [
  {
    key: "hair",
    label: "Hair",
    options: [
      { label: "Short", value: "short" },
      { label: "Medium", value: "medium" },
      { label: "Long", value: "long" },
      { label: "Bob Round", value: "bobRounded" },
      { label: "Bob Straight", value: "bobStraight" },
    ],
  },
  {
    key: "body",
    label: "Body",
    options: [
      { label: "Shirt", value: "shirt" },
      { label: "Sweater", value: "sweater" },
      { label: "T-Shirt", value: "tshirt" },
      { label: "Turtleneck", value: "turtleneck" },
    ],
  },
  {
    key: "eyes",
    label: "Eyes",
    options: [
      { label: "Boring", value: "boring" },
      { label: "Dots", value: "dots" },
      { label: "Open Circle", value: "openCircle" },
      { label: "Open Round", value: "openRounded" },
    ],
  },
  {
    key: "eyebrows",
    label: "Eyebrows",
    options: [
      { label: "Standard", value: "standard" },
      { label: "Angry", value: "angry" },
      { label: "Small", value: "small" },
    ],
  },
  {
    key: "mouth",
    label: "Mouth",
    options: [
      { label: "Smile", value: "smile" },
      { label: "Big Smile", value: "bigSmile" },
      { label: "Laugh", value: "laugh" },
      { label: "Flat", value: "flat" },
      { label: "Half Open", value: "halfOpen" },
      { label: "Frown", value: "frown" },
      { label: "Nervous", value: "nervous" },
    ],
  },
  {
    key: "nose",
    label: "Nose",
    options: [
      { label: "Dots", value: "dots" },
      { label: "Big", value: "big" },
      { label: "Curve", value: "curve" },
      { label: "Half Oval", value: "halfOval" },
    ],
  },
  {
    key: "faceHair",
    label: "Face Hair",
    options: [
      { label: "None", value: "none" },
      { label: "Beard", value: "beard" },
    ],
  },
];

const HAIR_COLORS = [
  "#1a1a1a",
  "#4a3728",
  "#6b4226",
  "#8b4513",
  "#d4a574",
  "#e8c9a0",
  "#c0392b",
  "#b0b0b0",
  "#f0f0f0",
  "#2980b9",
  "#e91e90",
  "#8e44ad",
];

const BODY_COLORS = [
  "#ffffff",
  "#1a1a1a",
  "#808080",
  "#e74c3c",
  "#3498db",
  "#27ae60",
  "#f1c40f",
  "#9b59b6",
  "#e91e63",
  "#e67e22",
  "#2c3e50",
  "#1abc9c",
];

const SKIN_COLORS = [
  "#fde8d0",
  "#f5d0b0",
  "#e8b890",
  "#d4a078",
  "#c49a6c",
  "#b8875e",
  "#9d7a54",
  "#7a5a3e",
  "#5a3e28",
  "#3e2a1a",
];

const BG_COLORS = [
  "#ffffff",
  "#f0f0f0",
  "#e0e0e0",
  "#2c3e50",
  "#1a1a2e",
  "#16213e",
  "#0f3460",
  "#e8f4f8",
  "#f0e6d3",
];

const COLOR_LABEL_KEYS: Record<string, string> = {
  hairColor: "Avatar_hairColor",
  bodyColor: "Avatar_bodyColor",
  headColor: "Avatar_headColor",
  backgroundColor: "Avatar_backgroundColor",
};

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
  const [progress, setProgress] = useState(0);
  const [ModalVisible, setModalVisible] = useState(false);
  const [ModalVisible2, setModalVisible2] = useState(false);
  const [daysLeft, setdaysLeft] = useState<number | null>(null);
  const styles = getStyles(theme);

  const avatarConfig = useAuthStore((s) => s.avatarConfig);
  const setAvatarConfig = useAuthStore((s) => s.setAvatarConfig);
  const [editConfig, setEditConfig] = useState<
    Record<string, string | undefined>
  >({});
  const [isEditing, setIsEditing] = useState(false);
  const [colorKey, setColorKey] = useState<string | null>(null);

  const seed = email ?? undefined;

  const savedConfig = useMemo(
    () =>
      avatarConfig
        ? Object.fromEntries(
            Object.entries(avatarConfig).filter(([k]) => k !== "seed"),
          )
        : {},
    [avatarConfig],
  );

  const editingProps = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(editConfig).filter(([k]) => k !== "seed"),
      ),
    [editConfig],
  );

  useEffect(() => {
    if (isEditing) {
      setEditConfig(avatarConfig ? { ...avatarConfig } : {});
      setColorKey(null);
    }
  }, [isEditing]);

  const randomize = useCallback(() => {
    setEditConfig(generateRandomAvatarConfig());
  }, []);

  const updatePart = useCallback((key: string, value: string) => {
    setEditConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateColor = useCallback((key: string, value: string) => {
    setEditConfig((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "headColor") next.earsColor = value;
      return next;
    });
  }, []);

  const saveAvatarConfig = useCallback(() => {
    setAvatarConfig(
      Object.keys(editConfig).length > 0 ? (editConfig as any) : null,
    );
    setIsEditing(false);
  }, [editConfig, setAvatarConfig]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditConfig(avatarConfig ? { ...avatarConfig } : {});
  }, [avatarConfig]);

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

  const createDeleteRequest = async () => {
    if (!user) throw new Error("Not logged in");
    setModalVisible2(true);
  };

  const confirmDeleteRequest = async () => {
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
      .eq("status", "pending")
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

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("delete_requests")
        .insert([
          {
            user_id: userId,
            email,
            verification_code,
            status: "pending",
            push_token: "",
          },
        ])
        .select()
        .single();

      if (error) {
        Sentry.captureException(error);
        Alert.alert(t("Error"), t("Request_could_not_be_sent"));
      } else {
        posthog.capture("user_delete-account");
        Alert.alert(t("Success"), t("deletion_request_created"));
        setRequest(data);
        updateProgress("pending");
      }
    } catch (err) {
      Sentry.captureException(err);
      Alert.alert(t("Error"), t("Request_could_not_be_sent"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`delete-requests-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*" as const,
          schema: "public",
          table: "delete_requests",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as DeleteRequest;
          setRequest(updated);
          updateProgress(updated.status);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

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
          <TouchableOpacity
            onPress={() => setIsEditing(true)}
            style={styles.avatarWrapper}
          >
            <Avatar
              theme={nevmstasTheme}
              seed={seed}
              size={100}
              accessories="none"
              hats="none"
              {...savedConfig}
            />
            <View style={styles.editBadge}>
              <Pencil size={16} color={theme.white} />
            </View>
          </TouchableOpacity>
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

        {request && request.status === "pending" && (
          <View style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <Text style={styles.requestTitle}>
                {t("Account_deletion_request_title")}
              </Text>
              <View
                style={[
                  styles.statusTag,
                  {
                    backgroundColor: "#FEF3C7",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    {
                      color: "#92400E",
                    },
                  ]}
                >
                  {t("Pending")}
                </Text>
              </View>
            </View>
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
                onPress={confirmDeleteRequest}
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

      <Modal
        visible={isEditing}
        transparent
        animationType="slide"
        onRequestClose={cancelEditing}
      >
        <SafeAreaView style={styles.editModalContainer}>
          <View style={styles.editModalHeader}>
            <TouchableOpacity
              onPress={cancelEditing}
              style={styles.editModalClose}
            >
              <X size={24} color={textColor} />
            </TouchableOpacity>
            <Text style={styles.editModalTitle}>{t("Edit Avatar")}</Text>
            <TouchableOpacity
              onPress={randomize}
              style={styles.editModalRandomize}
            >
              <Shuffle size={18} color={theme.primary} />
              <Text style={styles.randomizeText}>{t("Randomize")}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.editModalPreview}>
            <Avatar
              theme={nevmstasTheme}
              seed={seed}
              size={160}
              accessories="none"
              hats="none"
              {...editingProps}
            />
          </View>
          <ScrollView contentContainerStyle={styles.editModalContent}>
            <View style={styles.editModalSection}>
              <Text style={styles.editModalSectionTitle}>{t("Parts")}</Text>
              {PART_CATEGORIES.map((cat) => (
                <View key={cat.key} style={styles.partRow}>
                  <Text style={styles.partLabel}>{cat.label}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.partOptions}>
                      {cat.options.map((opt) => {
                        const selected = editConfig[cat.key] === opt.value;
                        return (
                          <TouchableOpacity
                            key={opt.value}
                            onPress={() => updatePart(cat.key, opt.value)}
                            style={[
                              styles.partOption,
                              selected && styles.partOptionSelected,
                            ]}
                          >
                            {selected && (
                              <Check size={14} color={theme.white} />
                            )}
                            <Text
                              style={[
                                styles.partOptionText,
                                selected && styles.partOptionTextSelected,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              ))}
            </View>

            <View style={styles.editModalSection}>
              <Text style={styles.editModalSectionTitle}>
                {t("Avatar_colors")}
              </Text>
              {(
                [
                  "hairColor",
                  "bodyColor",
                  "headColor",
                  "backgroundColor",
                ] as const
              ).map((ckey) => (
                <View key={ckey} style={styles.colorRow}>
                  <TouchableOpacity
                    style={styles.colorRowHeader}
                    onPress={() => setColorKey(colorKey === ckey ? null : ckey)}
                  >
                    <PaintBucket size={16} color={textColor} />
                    <Text style={styles.colorRowLabel}>
                      {t(COLOR_LABEL_KEYS[ckey])}
                    </Text>
                    <View
                      style={[
                        styles.colorSwatchSmall,
                        {
                          backgroundColor:
                            editConfig[ckey] ||
                            (ckey === "headColor"
                              ? "#f5d0b0"
                              : ckey === "hairColor"
                                ? "#4a3728"
                                : ckey === "backgroundColor"
                                  ? "transparent"
                                  : "#3498db"),
                        },
                      ]}
                    />
                  </TouchableOpacity>
                  {colorKey === ckey && (
                    <View style={styles.colorGrid}>
                      {(ckey === "headColor"
                        ? SKIN_COLORS
                        : ckey === "hairColor"
                          ? HAIR_COLORS
                          : ckey === "backgroundColor"
                            ? BG_COLORS
                            : BODY_COLORS
                      ).map((c) => {
                        const selected = editConfig[ckey] === c;
                        return (
                          <TouchableOpacity
                            key={c}
                            onPress={() => updateColor(ckey, c)}
                            style={[
                              styles.colorSwatch,
                              { backgroundColor: c },
                              selected && styles.colorSwatchSelected,
                            ]}
                          />
                        );
                      })}
                      {ckey === "backgroundColor" && (
                        <TouchableOpacity
                          onPress={() => {
                            setEditConfig((prev) => {
                              const next = { ...prev };
                              delete next.backgroundColor;
                              return next;
                            });
                          }}
                          style={[
                            styles.colorSwatch,
                            styles.colorSwatchNone,
                            !editConfig.backgroundColor &&
                              styles.colorSwatchSelected,
                          ]}
                        >
                          <X size={18} color="#999" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.editModalFooter}>
            <TouchableOpacity onPress={cancelEditing} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>{t("Cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={saveAvatarConfig} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>{t("Save")}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
    editBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: cardBg,
    },
    editModalContainer: {
      flex: 1,
      backgroundColor: bg,
    },
    editModalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: cardBg,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    editModalClose: {
      padding: 8,
      borderRadius: innerRadius,
    },
    editModalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: textColor,
    },
    editModalRandomize: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: innerRadius,
    },
    randomizeText: {
      fontSize: 13,
      fontWeight: "700",
      color: primary,
    },
    editModalContent: {
      padding: 20,
      paddingBottom: 40,
    },
    editModalPreview: {
      alignItems: "center",
      paddingVertical: 20,
      marginVertical: 20,
      marginHorizontal: 20,
      backgroundColor: cardBg,
      borderRadius: defaultRadius,
      borderWidth: 1,
      borderColor: borderColor,
    },
    editModalSection: {
      marginBottom: 24,
    },
    editModalSectionTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: subTextColor,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 16,
    },
    partRow: {
      marginBottom: 16,
    },
    partLabel: {
      fontSize: 12,
      fontWeight: "800",
      color: subTextColor,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 8,
    },
    partOptions: {
      flexDirection: "row",
      gap: 8,
    },
    partOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: innerRadius,
      backgroundColor: theme.cardBgSecondary,
      borderWidth: 1,
      borderColor: borderColor,
    },
    partOptionSelected: {
      backgroundColor: primary,
      borderColor: primary,
    },
    partOptionText: {
      fontSize: 13,
      fontWeight: "600",
      color: textColor,
    },
    partOptionTextSelected: {
      color: white,
    },
    colorRow: {
      marginBottom: 12,
    },
    colorRowHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: cardBg,
      borderRadius: innerRadius,
      borderWidth: 1,
      borderColor: borderColor,
    },
    colorRowLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: "700",
      color: textColor,
    },
    colorSwatchSmall: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: borderColor,
    },
    colorGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 8,
      paddingLeft: 4,
    },
    colorSwatch: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: borderColor,
    },
    colorSwatchSelected: {
      borderColor: primary,
      borderWidth: 3,
    },
    colorSwatchNone: {
      backgroundColor: cardBg,
      alignItems: "center",
      justifyContent: "center",
      borderStyle: "dashed",
    },
    editModalFooter: {
      flexDirection: "row",
      gap: 12,
      padding: 20,
      paddingBottom: 30,
      borderTopWidth: 1,
      borderTopColor: borderColor,
      backgroundColor: cardBg,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: innerRadius,
      alignItems: "center",
      backgroundColor: theme.cardBgSecondary,
    },
    cancelBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: textColor,
    },
    saveBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: innerRadius,
      alignItems: "center",
      backgroundColor: primary,
    },
    saveBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: white,
    },
    all: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: bg,
    },
  });
};
