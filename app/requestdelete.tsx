import { LinearGradient } from "expo-linear-gradient";
import { Frown, Info } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { supabase } from "../lib/supabase";

interface DeleteRequest {
  id: string;
  email: string;
  status: "pending" | "approved" | "completed" | "rejected";
  requested_at: string;
  updated_at: string;
}

export default function UserDeleteScreen() {
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [request, setRequest] = useState<DeleteRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [WantToDelete, setWantToDelete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ModalVisible, setModalVisible] = useState(false);
  const [ModalVisible2, setModalVisible2] = useState(false);
  const scheme = useColorScheme();
  const styles = getStyles(
    scheme === "light" || scheme === "dark" ? scheme : null
  );

  const updateProgress = (status: DeleteRequest["status"]) => {
    switch (status) {
      case "pending":
        setProgress(0.0);
        break;
      case "rejected":
        setProgress(1);
        break;
      case "approved":
        setProgress(0.5);
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
        Alert.alert(
          "Fehler",
          "Benutzer-ID oder E-Mail konnte nicht abgerufen werden."
        );
        return;
      }

      const verification_code = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();

      setLoading(true);
      const { data, error } = await supabase
        .from("delete_requests")
        .insert([
          { user_id: userId, email, verification_code, status: "pending" },
        ]);

      if (error) {
        console.error(error);
        Alert.alert("Fehler", "Anfrage konnte nicht gesendet werden.");
      } else {
        Alert.alert("Anfrage gesendet", "Dein Löschantrag wurde erstellt.");
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

  return (
    <View style={styles.containera}>
      <Text style={styles.text9}>Konto löschen</Text>
      <TouchableOpacity
        onPress={createDeleteRequest}
        disabled={loading}
        style={styles.button}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.text2}>Löschung beantragen</Text>
        )}
      </TouchableOpacity>

      {request &&
        (request.status === "pending" ||
        request.status === "approved" ||
        request.status === "completed" ? (
          <>
            <View style={styles.container3}>
              <Text style={styles.text4}>
                Status:{" "}
                {request.status === "pending"
                  ? "Ausstehend"
                  : request.status === "approved"
                  ? "Bestätigt"
                  : request.status === "completed"
                  ? "Fertig"
                  : "Abgeschlossen"}
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
                Fortschritt: {(progress * 100).toFixed(0)}%
              </Text>
            </View>
          </>
        ) : (
          request.status === "rejected" && (
            <View style={styles.text6}>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={styles.button4}
              >
                <Info
                  size={27}
                  strokeWidth={2}
                  color={"#000"}
                  style={styles.icon}
                />
              </TouchableOpacity>
              <View style={styles.ups}>
                <Frown
                  size={40}
                  strokeWidth={2}
                  color={scheme === "dark" ? "#000" : "#000"}
                />
                <Text style={{ fontSize: 26, fontWeight: "700" }}> Ups !</Text>
              </View>
              <Text style={styles.text8}> Das ist etwas schief gelaufen </Text>
              <Modal
                visible={ModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
              >
                <View style={styles.modalBackground}>
                  <View style={styles.modalBox}>
                    <Text style={styles.text9}> Keine Berechtigung</Text>
                    <Text style={styles.text7}>
                      Sie haben nicht die berechtigung das Konto zu löschen oder
                      Ihnen gehört das Konto nicht. Falls Ihnen das Konto doch
                      gehört, bitte schreiben Sie eine E-mail an
                      cactus_apps@proton.me.
                    </Text>
                    <View>
                      <TouchableOpacity
                        onPress={() => setModalVisible(false)}
                        style={styles.button3}
                      >
                        <Text style={styles.text2}> OK </Text>
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
            <Text style={styles.text9}>Account Löschen</Text>
            <Text style={styles.text7}>
              Wollen Sie Ihren Account wirklich löschen. Dadurch werder all ihre
              Daten nach 10 Tagen gelöscht und sie danach nicht mehr
              wiederhetstellbar.
            </Text>
            <View style={styles.buttons2}>
              <TouchableOpacity
                onPress={deleteAccuntAction}
                style={styles.buttonDelete}
              >
                <Text style={styles.text2}> Löschen </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible2(false)}
                style={styles.button5}
              >
                <Text style={styles.text2}> Abbrechen </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (scheme: "light" | "dark" | null) =>
  StyleSheet.create({
    containera: {
      flex: 1,
      backgroundColor: "#f7fafc",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
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
    icon: {
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
      backgroundColor: "#f56565",
      borderRadius: 16,
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
    },
    progressBar: {
      width: "91.67%",
      height: 16,
      backgroundColor: "#d1d5db",
      borderRadius: 999,
      overflow: "hidden",
    },
    text5: {
      color: "#4b5563",
      marginTop: 8,
    },
  });
