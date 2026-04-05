import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Sentry from "@sentry/react-native";

type ConsentModalProps = {
  userId?: string;
  onConsentAccepted?: () => void;
};

export default function ConsentModal({
  userId,
  onConsentAccepted,
}: ConsentModalProps) {
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [accepted, setaccepted] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function checkConsent() {
      try {
        const saved = await SecureStore.getItemAsync("consent");
        if (!mounted) return;
        if (!saved) {
          setVisible(true);
        } else {
          const parsed = JSON.parse(saved);
          if (parsed?.accepted) {
            onConsentAccepted?.();
          } else {
            setVisible(true);
          }
        }
      } catch (err) {
        Sentry.captureException(err);
        console.error("Consent check failed:", err);
        setVisible(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    checkConsent();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAccept = async () => {
    setaccepted(true);
    const consent = {
      accepted: true,
      location_city: true,
      analytics: false,
      marketing: false,
      version: "v1.0",
      timestamp: new Date().toISOString(),
    };

    setVisible(false);
    onConsentAccepted?.();
  };

  const handleDecline = () => {
    BackHandler.exitApp();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Privacy & Consent</Text>
          <Text style={styles.text}>
            This app requests access to your approximate location (city-level)
            to display local features.{"\n\n"}✅ Your location will NOT be
            stored or shared.{"\n"}✅ You can revoke this anytime in your device
            settings.{"\n\n"}
            Do you agree?
          </Text>
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btn, styles.accept]}
              onPress={handleAccept}
            >
              <Text style={styles.btnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.decline]}
              onPress={handleDecline}
            >
              <Text style={styles.btnText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    elevation: 6,
  },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  text: { fontSize: 16, marginBottom: 24, lineHeight: 22 },
  buttons: { flexDirection: "row", justifyContent: "flex-end" },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 10,
  },
  accept: { backgroundColor: "#4CAF50" },
  decline: { backgroundColor: "#E53935" },
  btnText: { color: "#fff", fontWeight: "bold" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
