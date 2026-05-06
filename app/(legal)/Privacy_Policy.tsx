// Privacy Policy — Atlasys © Cactus Apps 2026
import { useAppTheme } from "@/lib/theme";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Shield } from "lucide-react-native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";

// ─── Inhalt ───────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    title: "Verantwortlicher",
    content: `Cactus Apps\nE-Mail: cactus_apps@proton.me\n\nDiese Datenschutzerklärung gilt für die mobile App Atlasys und beschreibt, welche personenbezogenen Daten wir verarbeiten, zu welchem Zweck, auf welcher Rechtsgrundlage und welche Rechte dir zustehen.`,
  },
  {
    title: "1. Welche Daten wir verarbeiten",
    content: `Je nach Nutzung der App können folgende Datenkategorien verarbeitet werden:\n\n• Identifikationsdaten: E-Mail-Adresse, Nutzername\n• Kontodaten: Profilinformationen, Account-ID\n• Nutzungsdaten: Anonyme Nutzungsstatistiken (nur mit deiner Einwilligung)\n• Verbindungsdaten: Login-Zeitstempel, IP-Adresse (temporär)\n• Einwilligungsnachweis: Zeitstempel und Version deiner Zustimmung zu AGB und Datenschutz (DSGVO Art. 7)`,
  },
  {
    title: "2. Standortdaten",
    content: `Die App kann deinen ungefähren Standort (Stadt/Region) zur Bereitstellung von Kartenfunktionen anfragen.\n\nWichtig: Dein Standort wird nicht in unserer Datenbank gespeichert, nicht protokolliert und nicht an Dritte weitergegeben. Er wird ausschließlich im Arbeitsspeicher des Geräts verwendet und danach sofort verworfen.\n\nDie Abfrage erfolgt über Expo Location und nur nach deiner ausdrücklichen Genehmigung. Du kannst diese Berechtigung jederzeit in den Geräteeinstellungen widerrufen.`,
  },
  {
    title: "3. Rechtsgrundlagen",
    content: `• Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO): z. B. Bereitstellung deines Kontos\n• Einwilligung (Art. 6 Abs. 1 lit. a DSGVO): z. B. Standortabfrage, Analysedaten\n• Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO): z. B. Sicherheitslogs, Betrugsprävention`,
  },
  {
    title: "4. Open Source & Transparenz",
    content: `Atlasys ist vollständig Open Source. Der gesamte Quellcode ist unter github.com/Cactus-Apps/Atlasys einsehbar. Es gibt keine versteckten Datensammlungen, Werbe-SDKs oder Tracker.\n\nVerwendete Kartendaten stammen von OpenStreetMap (openstreetmap.org) und werden unter der ODbL-Lizenz genutzt. Routing läuft über OSRM lokal – deine Route verlässt niemals dein Gerät.`,
  },
  {
    title: "5. Aufbewahrungsfristen",
    content: `• Kontodaten: Solange dein Konto aktiv ist oder gesetzliche Pflichten bestehen\n• Sicherheitslogs: Begrenzte Zeit für Debug- und Sicherheitszwecke\n• Einwilligungsnachweise: Solange zum Nachweis der Compliance erforderlich oder bis zum Widerruf`,
  },
  {
    title: "6. Empfänger / Auftragsverarbeiter",
    content: `• Supabase: Authentifizierung, Datenbank und Speicher (Auftragsverarbeitungsvertrag vorhanden)\n• Sentry: Absturzberichte zur Qualitätssicherung\n• OpenFreeMap / OpenStreetMap: Kartenkacheln (keine personenbezogenen Daten übertragen)\n• OSRM: Routing (lokal berechnet, keine Serveranfragen mit personenbezogenen Daten)`,
  },
  {
    title: "7. Internationale Übermittlungen",
    content: `Wenn Daten außerhalb der EU/des EWR übertragen werden, erfolgt dies auf Basis geeigneter Garantien (z. B. Angemessenheitsbeschluss oder Standardvertragsklauseln der EU-Kommission).`,
  },
  {
    title: "8. Deine Rechte",
    content: `Du hast folgende Rechte nach DSGVO:\n\n• Auskunft (Art. 15)\n• Berichtigung (Art. 16)\n• Löschung (Art. 17)\n• Einschränkung der Verarbeitung (Art. 18)\n• Datenübertragbarkeit (Art. 20)\n• Widerspruch (Art. 21)\n• Widerruf der Einwilligung (Art. 7 Abs. 3)\n\nZur Ausübung deiner Rechte wende dich an: cactus_apps@proton.me\n\nDu hast außerdem das Recht, eine Beschwerde bei der zuständigen Datenschutz-Aufsichtsbehörde einzureichen.`,
  },
  {
    title: "9. Datenpannenmeldung",
    content: `Im Fall einer Datenpanne melden wir den Vorfall innerhalb von 72 Stunden der zuständigen Aufsichtsbehörde (sofern ein Risiko besteht) und informieren betroffene Nutzer bei voraussichtlich hohem Risiko.`,
  },
  {
    title: "10. Änderungen",
    content: `Diese Datenschutzerklärung kann aus rechtlichen oder technischen Gründen aktualisiert werden. Die aktuelle Version ist stets in der App und auf unserer Website verfügbar. Bei wesentlichen Änderungen wirst du erneut um Einwilligung gebeten.\n\nAktualisiert: Mai 2026 · Version 1.0`,
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Privacy_Policy() {
  const theme = useAppTheme();
  const styles = getStyles(theme);

  // Wenn aus dem Onboarding-Consent geöffnet → zurück zum Consent Gate
  const params = useLocalSearchParams<{ from?: string }>();
  const fromConsent = params.from === "consent";

  const handleBack = () => {
    if (fromConsent) {
      // Direkt zum Consent Gate zurück, nicht zum Start des Onboardings
      router.replace({
        pathname: "/onboarding",
        params: { showConsent: "true" },
      });
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Datenschutzerklärung</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro-Banner */}
        <View style={styles.introBanner}>
          <View style={styles.introIconWrap}>
            <Shield size={28} color="#00C4B4" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.introTitle}>Deine Daten, deine Kontrolle.</Text>
            <Text style={styles.introSub}>
              Atlasys ist Open Source und sammelt keine Daten ohne deine
              Einwilligung.
            </Text>
          </View>
        </View>

        {/* Sektionen */}
        {SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
            {i < SECTIONS.length - 1 && <View style={styles.divider} />}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Fragen? cactus_apps@proton.me</Text>
          <Text style={styles.footerText}>
            Quellcode: github.com/Cactus-Apps/Atlasys
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const {
    bg,
    cardBg,
    textColor,
    subTextColor,
    borderColor,
    isModern,
    primaryLight,
  } = theme;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop:
        Platform.OS === "ios" ? 56 : (StatusBar.currentHeight ?? 24) + 12,
      backgroundColor: cardBg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: borderColor,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: textColor,
    },
    backButton: {
      width: 44,
      height: 44,
      justifyContent: "center",
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 48,
    },
    // Intro Banner
    introBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: "rgba(0,196,180,0.10)",
      borderWidth: 1,
      borderColor: "rgba(0,196,180,0.30)",
      borderRadius: isModern ? 18 : 12,
      padding: 16,
      marginBottom: 24,
    },
    introIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "rgba(0,196,180,0.15)",
      justifyContent: "center",
      alignItems: "center",
    },
    introTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: textColor,
      marginBottom: 3,
    },
    introSub: {
      fontSize: 13,
      color: subTextColor,
      lineHeight: 18,
    },
    // Sektionen
    section: {
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: textColor,
      marginBottom: 8,
      letterSpacing: 0.2,
    },
    sectionContent: {
      fontSize: 14,
      color: subTextColor,
      lineHeight: 22,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: borderColor,
      marginVertical: 20,
    },
    // Footer
    footer: {
      marginTop: 28,
      paddingTop: 20,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: borderColor,
      gap: 6,
      alignItems: "center",
    },
    footerText: {
      fontSize: 12,
      color: subTextColor,
      textAlign: "center",
    },
  });
};
