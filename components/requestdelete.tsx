import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";

interface DeleteRequest {
  id: string;
  email: string;
  status: "pending" | "approved" | "completed";
  requested_at: string;
  updated_at: string;
}

export default function UserDeleteScreen() {
  const [email, setEmail] = useState("");
  const [request, setRequest] = useState<DeleteRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const updateProgress = (status: DeleteRequest["status"]) => {
    switch (status) {
      case "pending":
        setProgress(0.33);
        break;
      case "approved":
        setProgress(0.66);
        break;
      case "completed":
        setProgress(1);
        break;
      default:
        setProgress(0);
    }
  };

  const checkRequestStatus = async () => {
    if (!email) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("delete_requests")
      .select("*")
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
    setLoading(false);
  };

  const createDeleteRequest = async () => {
    if (!email) {
      Alert.alert("Fehler", "Bitte gib deine E-Mail-Adresse ein.");
      return;
    }

    const verification_code = Math.random().toString(36).substring(2,10).toUpperCase();

    setLoading(true);
    const { data, error } = await supabase
      .from("delete_requests")
      .insert([{verification_code, status: 'pending',email }])

    if (error) {
      console.error(error);
      Alert.alert("Fehler", "Anfrage konnte nicht gesendet werden.");
    } else {
      Alert.alert("Anfrage gesendet", "Dein Löschantrag wurde erstellt.");
      setRequest(data);
      updateProgress("pending");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!email) return;
    const channel = supabase
      .channel("delete_requests-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delete_requests" },
        (payload: any) => {
          if (payload.new.email === email) {
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
  }, [email]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>🧹 Konto löschen</Text>
      <TextInput
        placeholder="Deine E-Mail-Adresse"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.container2}
      />

      <TouchableOpacity
        onPress={createDeleteRequest}
        disabled={loading}
        style={styles.button}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.text2}>
            Löschung beantragen
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={checkRequestStatus} className="mt-3">
        <Text style={styles.text3}>
          Aktuellen Status abrufen
        </Text>
      </TouchableOpacity>

      {request && (
        <View style={styles.container3}>
          <Text style={styles.text4}>
            Status: {request.status === "pending"
              ? "Ausstehend"
              : request.status === "approved"
              ? "Bestätigt"
              : request.status === "completed"
              ? "Fertig"
              : "Abgeschlossen"}
          </Text>

          <View style={styles.progressBar}>
            <LinearGradient
              colors={["#ef4444", "#f59e0b", "#10b981"]}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  container2: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#f56565',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    width: '100%',
  },
  text2: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  text3: {
    color: '#3b82f6',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  container3: {
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
  },
  text4: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    width: '91.67%',
    height: 16,
    backgroundColor: '#d1d5db',
    borderRadius: 999,
    overflow: 'hidden',
  },
  text5: {
    color: '#4b5563',
    marginTop: 8,
  },

});
