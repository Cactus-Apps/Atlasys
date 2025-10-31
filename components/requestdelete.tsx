import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  TextInput,
  View
} from "react-native";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE;

export default function RequestDeleteByEmail() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequest() {
    if (!email.trim()) return Alert.alert("Bitte E-Mail eingeben");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}`, {
        method: "POST",
        headers: {
           "Content-Type": "application/json",
           'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`
          },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const json = await res.json();
      if (!res.ok) {
        Alert.alert("Fehler", json?.message || "Server error");
      } else {
        Alert.alert(
          "Erfolg",
          `Request gesendet. Request ID: ${json.requestId || "—"}`
        );
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert("Fehler", err?.message || "Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ padding: 16 }}>
      <TextInput
        placeholder="Deine E-Mail"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 8, marginBottom: 8, borderColor: '#000'}}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Button title="Account löschen anfordern" onPress={handleRequest} />
      )}
    </View>
  );
}
