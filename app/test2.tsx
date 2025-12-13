import React from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

const HelpFeedbackScreen = () => {
  // Beispiel-URLs oder Funktionen für Aktionen
  const feedbackUrl = "mailto:feedback@deineapp.de?subject=Feedback%20zur%20App";
  const faqUrl = "https://deineapp.de/faq";
  const supportEmail = "support@deineapp.de";

  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Fehler", "Link kann nicht geöffnet werden.");
      }
    } catch (error) {
      Alert.alert("Fehler", "Beim Öffnen des Links ist ein Fehler aufgetreten.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Help & Feedback</Text>

      <TouchableOpacity style={styles.card} onPress={() => openUrl(feedbackUrl)} activeOpacity={0.8}>
        <Text style={styles.cardTitle}>Feedback geben</Text>
        <Text style={styles.cardDescription}>
          Teile uns deine Ideen, Wünsche oder allgemeines Feedback mit, damit wir die App verbessern können.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => openUrl(faqUrl)} activeOpacity={0.8}>
        <Text style={styles.cardTitle}>Hilfe & FAQ</Text>
        <Text style={styles.cardDescription}>
          Häufig gestellte Fragen und Antworten, um dir schnell weiterzuhelfen.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => openUrl(`mailto:${supportEmail}?subject=Supportanfrage`)}
        activeOpacity={0.8}
      >
        <Text style={styles.cardTitle}>Kontakt zum Support</Text>
        <Text style={styles.cardDescription}>
          Schreibe uns direkt eine E-Mail, wenn du Hilfe benötigst oder Fragen hast.
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#333",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    color: "#146275",
  },
  cardDescription: {
    fontSize: 16,
    color: "#555",
    lineHeight: 22,
  },
});

export default HelpFeedbackScreen;
