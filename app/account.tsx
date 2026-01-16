// Version 1.3.6 - © Cactus Apps 2025
import { useAuth } from "@/lib/auth/auth-context";
import { supabase } from "@/lib/auth/supabase";
import { Avatar } from "@kolking/react-native-avatar";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { t } from "i18next";
import { Frown, Info, LogOut } from "lucide-react-native";
import * as React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const scheme = useColorScheme();
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
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );


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
          expires.getDate()
        );
        const days = Math.max(
          0,
          Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24))
        );
        setdaysLeft(days);
      }

      if (error) {
        console.log(error);
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
    await createDeleteRequest;
  };

  const createDeleteRequest = async () => {
    if (WantToDelete) {
      () => setModalVisible2(false);
      if (!userId || !email) {
        Alert.alert(t("Error"), t('User_ID_or_email_could_not_be_fetched'));
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
        Alert.alert(t("Limit_reached"), t('only_one_deletion'));
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
        console.error(error);
        Alert.alert(t("Error"), t('Request_could_not_be_sent'));
      } else {
        Alert.alert("Request_sent", "deletion_request_created");
        setRequest(data);
        updateProgress("pending");
      }
      setLoading(false);
    } else {
      setModalVisible2(true);
      return;
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, email]);

  if (loading) {
    return (
      <View style={styles.all}>
        <ActivityIndicator size="large" color="#466483ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View>
        <ImageBackground
          source={require("../assets/images/account.png")}
          style={styles.image}
          imageStyle={styles.imageStyle}
        >
          <View style={styles.account}>
            <Avatar
              size={80}
              name={email ?? undefined}
              email={email ?? undefined}
              colorize={true}
              radius={100}
              badgeColor="#146275ff"
              defaultSource={require("../assets/images/banner.jpeg")}
            />
          </View>
        </ImageBackground>
      </View>

      <View style={styles.container}>
        {email ? (
          <Text style={styles.email}>{t('Hello')} {email}</Text>
        ) : (
          <Text style={{ color: "red" }}>{t('An_error_has_occurred')}</Text>
        )}
      </View>

      <View>
        <View style={{ padding: 20 }}>
          <TouchableOpacity
            onPress={createDeleteRequest}
            disabled={loading}
            style={styles.button}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.text2}>{t('Delete_account')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {request &&
          (request.status === "pending" || request.status === "completed" ? (
            <>
              <View style={styles.container3}>
                <Text style={styles.text4}>
                  {t('status:')}{" "}
                  {request.status === "pending"
                    ? t("Pending")
                    : request.status === "completed"
                    ? t("Finished")
                    : "Completed"}
                </Text>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={["#466483ff", "#466483ff"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      width: `${progress * 100}%`,
                      height: "100%",
                      borderRadius: 9999,
                    }}
                  />
                </View>
                <Text style={styles.text5}>
                  {t('progress')}: {(progress * 100).toFixed(0)}%
                </Text>
                <Text
                  style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}
                >
                  {daysLeft !== null
                    ? [t(`Your_account_will_be_deleted_in`), `${daysLeft}`, t('days')]
                    : t("Deletion_date_is_loading...")}
                </Text>
              </View>
            </>
          ) : (
            request.status === "rejected" && (
              <View>
                <View style={{ alignItems: "center" }}>
                  <View style={styles.text6}>
                    <TouchableOpacity
                      onPress={() => setModalVisible(true)}
                      style={styles.button4}
                    >
                      <Info
                        size={27}
                        strokeWidth={2}
                        color={"#000"}
                        style={styles.icon2}
                      />
                    </TouchableOpacity>
                    <View style={styles.ups}>
                      <Frown
                        size={40}
                        strokeWidth={2}
                        color={scheme === "dark" ? "#000" : "#000"}
                      />
                      <Text style={{ fontSize: 26, fontWeight: "700" }}>
                        {" "}
                        Oops !
                      </Text>
                    </View>
                    <Text style={styles.text8}>{t('Something_went_wrong')}</Text>
                  </View>
                </View>
                <Modal
                  visible={ModalVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setModalVisible(false)}
                >
                  <View style={styles.modalBackground}>
                    <View style={styles.modalBox}>
                      <Text style={styles.text9}>{t('No_permission')}</Text>
                      <Text style={styles.text7}>
                        {t('no_permission_to_delete')}
                      </Text>
                      <View>
                        <TouchableOpacity
                          onPress={() => setModalVisible(false)}
                          style={styles.button3}
                        >
                          <Text style={styles.text2}>{t('okay')} </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              </View>
            )
          ))}
        <Modal
          visible={ModalVisible2}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible2(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalBox}>
              <Text style={styles.text9}>{t('Delete_account')}</Text>
              <Text style={styles.text7}>{t('sure_to_delete')}
              </Text>
              <View style={styles.buttons2}>
                <TouchableOpacity
                  onPress={deleteAccuntAction}
                  style={styles.buttonDelete}
                >
                  <Text style={styles.text2}>{t('Delete')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setModalVisible2(false)}
                  style={styles.button5}
                >
                  <Text style={styles.text2}>{t('Cancel')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
      <TouchableOpacity onPress={signOut} style={styles.signoutbutton}>
        <LogOut strokeWidth={3} color={"#d84646ff"} style={styles.icon} />
        <Text style={styles.text}>{t('Sign_Out')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
    account: {
      marginTop: 70,
    },
    placeholder: {
      marginVertical: 210,
    },
    buttons: {
      alignItems: "flex-start",
      flexDirection: "column",
      marginLeft: 35,
    },
    text: {
      fontSize: 15,
      fontWeight: "600",
      color: "#d84646ff",
    },
    textMini: {
      fontSize: 14,
      fontWeight: "500",
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
      alignSelf: "center",
    },
    signoutbutton: {
      flexDirection: "row",
      padding: 3,
      alignSelf: "center",
      bottom: 30,
      position: "absolute",
    },
    deleteAccount: {
      flexDirection: "row",
      padding: 3,
      marginVertical: 20,
    },
    container: {
      marginTop: 50,
      alignSelf: "center",
      marginVertical: 20,
    },
    all: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    icon: {
      marginRight: 16,
      color: scheme === "dark" ? "#d8d8d8ff" : "#fff",
    },
    email: {
      fontSize: 25,
      fontWeight: "bold",
      color: scheme === "dark" ? "#d8d8d8ff" : "#000",
    },
    imageStyle: {
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    },
    image: {
      width: 340,
      height: 110,
      alignSelf: "center",
      marginTop: 20,
    },
    buttons2: {
      flexDirection: "row",
    },
    modalBox: {
      width: "85%",
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 20,
    },
    ups: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "center",
    },
    modalBackground: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    icon2: {
      margin: 5,
    },
    text9: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 16,
      textAlign: "center",
    },
    text6: {
      marginTop: 20,
      width: "85%",
      backgroundColor: "#fff",
      borderRadius: 12,
      paddingTop: 12,
      padding: 15,
      paddingBottom: 20,
    },
    text7: {
      fontSize: 16,
    },
    container2: {
      width: "100%",
      backgroundColor: "#ffffff",
      borderRadius: 16,
      padding: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.5,
      elevation: 5,
      marginBottom: 16,
    },
    button: {
      backgroundColor: "#F85149",
      borderRadius: 6,
      paddingHorizontal: 20,
      paddingVertical: 12,
      width: "100%",
    },
    button3: {
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 12,
      marginTop: 20,
      width: "100%",
      backgroundColor: "#466483ff",
    },
    button5: {
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 12,
      marginTop: 20,
      marginLeft: 37,
      width: "40%",
      backgroundColor: "#466483ff",
    },
    buttonDelete: {
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 12,
      marginTop: 20,
      marginRight: 20,
      width: "40%",
      backgroundColor: "#F85149",
    },
    button4: {
      alignSelf: "flex-end",
    },
    text2: {
      color: "#ffffff",
      textAlign: "center",
      fontWeight: "600",
    },
    text8: {
      fontSize: 15,
      fontWeight: "600",
      alignSelf: "center",
      paddingTop: 8,
      paddingBottom: 13,
    },
    textbig: {
      color: "#000",
      textAlign: "center",
      fontWeight: "700",
      fontSize: 18,
      alignSelf: "center",
    },
    container3: {
      marginTop: 24,
      width: "100%",
      alignItems: "center",
    },
    text4: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 8,
      color: "#fff",
    },
    progressBar: {
      width: "91.67%",
      height: 16,
      backgroundColor: "#d1d5db",
      borderRadius: 999,
      overflow: "hidden",
    },
    text5: {
      color: "#6a7079ff",
      marginTop: 8,
    },
  });
