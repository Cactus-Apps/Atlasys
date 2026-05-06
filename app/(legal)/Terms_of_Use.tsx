// Terms of Service — Atlasys © Cactus Apps 2026
import { useAppTheme } from "@/lib/theme";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Scale } from "lucide-react-native";
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
    title: "Anbieter",
    content: `Cactus Apps\nE-Mail: cactus_apps@proton.me\n\nDiese Nutzungsbedingungen regeln die Nutzung der mobilen App Atlasys. Mit der Nutzung der App erklärst du dich mit diesen Bedingungen einverstanden.`,
  },
  {
    title: "1. Nutzungsrecht",
    content: `Cactus Apps gewährt dir ein persönliches, nicht übertragbares, nicht ausschließliches und widerrufliches Recht, die App auf deinen eigenen Geräten zu nutzen.\n\nDieses Recht erlischt automatisch, wenn du gegen diese Nutzungsbedingungen verstößt.`,
  },
  {
    title: "2. Open Source & Proprietäre Komponenten",
    content: `Atlasys ist teilweise Open Source. Der auf GitHub (github.com/Cactus-Apps/Atlasys) veröffentlichte Quellcode steht unter der dort angegebenen Lizenz (MIT + Commons Clause).\n\nFolgendes ist ausdrücklich nicht gestattet:\n\n• Reverse Engineering, Dekompilierung oder Disassemblierung von Teilen der App, die nicht als Open Source auf GitHub veröffentlicht sind\n• Extraktion von Algorithmen, Designs, Backend-Konfigurationen oder proprietären Inhalten aus den App-Binärdateien\n• Umgehung von Lizenzprüfungen, Premium-Mechanismen oder Authentifizierungssystemen\n• Erstellung von Derivaten auf Basis nicht-öffentlicher Komponenten\n\nDer Open-Source-Code darf gemäß der MIT-Lizenz mit Commons Clause verwendet werden – jedoch nicht für den kommerziellen Verkauf eines Produkts, das primär auf Atlasys basiert, ohne separate kommerzielle Lizenz.`,
  },
  {
    title: "3. Erlaubte Nutzung",
    content: `Du darfst die App ausschließlich für legale, persönliche und nicht-kommerzielle Zwecke nutzen. Folgendes ist erlaubt:\n\n• Private Navigation und Kartenfunktionen nutzen\n• Offline-Karten für den Eigenbedarf herunterladen\n• Gespeicherte Orte für dich selbst verwalten\n• Fehler melden und zum Open-Source-Teil beitragen (Pull Requests willkommen)`,
  },
  {
    title: "4. Verbotene Nutzung",
    content: `Folgende Handlungen sind untersagt:\n\n• Nutzung der App für illegale Aktivitäten jeglicher Art\n• Automatisiertes Abrufen von Kartendaten (Scraping) in Mengen, die den Dienst belasten\n• Weitergabe deiner Zugangsdaten an Dritte\n• Nutzung der App zur Überwachung oder Verfolgung anderer Personen ohne deren Wissen\n• Verbreitung von Inhalten über die App, die gegen geltendes Recht verstoßen\n• Missbrauch der Feedback- oder Bug-Report-Funktion`,
  },
  {
    title: "5. Drittanbieter-Dienste",
    content: `Atlasys nutzt folgende externe Dienste, für die deren eigene Nutzungsbedingungen gelten:\n\n• OpenStreetMap / OpenFreeMap: Kartendaten (ODbL-Lizenz)\n• OSRM / routing.openstreetmap.de: Routenberechnung\n• Supabase: Authentifizierung und Datenspeicherung\n• Sentry: Absturzberichte\n\nCactus Apps ist nicht verantwortlich für Inhalte, Verfügbarkeit oder Datenpraktiken dieser Drittanbieter.`,
  },
  {
    title: "6. Premium-Funktionen",
    content: `Bestimmte Funktionen der App sind kostenpflichtig (Premium). Käufe erfolgen über den jeweiligen App-Store (Google Play / Apple App Store) und unterliegen deren Bedingungen.\n\n• Käufe sind grundsätzlich nicht erstattungsfähig, sofern nicht gesetzlich vorgeschrieben\n• Bei technischen Problemen wende dich an cactus_apps@proton.me\n• Cactus Apps behält sich vor, den Umfang von Premium-Funktionen zu ändern, kündigt wesentliche Einschränkungen jedoch vorab an`,
  },
  {
    title: "7. Verfügbarkeit & Änderungen",
    content: `Cactus Apps bemüht sich um eine kontinuierliche Verfügbarkeit der App, übernimmt jedoch keine Garantie für ununterbrochenen Betrieb. Wartungsarbeiten oder Updates können vorübergehend zu Einschränkungen führen.\n\nWir behalten uns vor, Funktionen zu ändern, hinzuzufügen oder zu entfernen. Wesentliche Änderungen werden in der App angekündigt.`,
  },
  {
    title: "8. Haftungsausschluss",
    content: `Die App wird „wie besehen" ohne ausdrückliche oder stillschweigende Garantien bereitgestellt.\n\nCactus Apps haftet nicht für:\n\n• Schäden durch fehlerhafte Navigationsdaten (OpenStreetMap-Daten können unvollständig sein)\n• Datenverlust durch technische Fehler\n• Schäden durch die Nutzung verlinkter Drittanbieter-Dienste\n• Indirekte oder Folgeschäden\n\nDie Haftung für Vorsatz und grobe Fahrlässigkeit sowie für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit bleibt unberührt.`,
  },
  {
    title: "9. Geistiges Eigentum",
    content: `Der Name „Atlasys", das App-Logo und alle nicht auf GitHub veröffentlichten Designelemente sind Eigentum von Cactus Apps und dürfen ohne ausdrückliche schriftliche Genehmigung nicht verwendet werden.\n\nDer Open-Source-Code auf GitHub steht unter der dort angegebenen Lizenz. Attribution (Nennung) ist bei Verwendung erforderlich.`,
  },
  {
    title: "10. Kündigung",
    content: `Du kannst die Nutzung jederzeit beenden und dein Konto löschen. Cactus Apps kann deinen Zugang bei Verstoß gegen diese Bedingungen ohne Vorankündigung sperren oder beenden.\n\nNach Kündigung werden deine Daten gemäß unserer Datenschutzerklärung gelöscht.`,
  },
  {
    title: "11. Anwendbares Recht & Streitigkeiten",
    content: `Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts.\n\nBei Streitigkeiten versuchen wir zunächst eine einvernehmliche Lösung. Kontakt: cactus_apps@proton.me\n\nGerichtsstand ist, soweit gesetzlich zulässig, der Sitz von Cactus Apps.\n\nHinweis: Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung bereit: ec.europa.eu/consumers/odr`,
  },
  {
    title: "12. Änderungen der Nutzungsbedingungen",
    content: `Cactus Apps kann diese Nutzungsbedingungen bei Bedarf aktualisieren. Wesentliche Änderungen werden in der App mitgeteilt. Die fortgesetzte Nutzung nach Bekanntgabe gilt als Zustimmung.\n\nDie jeweils aktuelle Version ist stets in der App und auf atlasys.app abrufbar.\n\nStand: Mai 2026 · Version 1.0`,
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Terms_of_Use() {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const params = useLocalSearchParams<{ from?: string }>();
  const fromConsent = params.from === "consent";

  const handleBack = () => {
    if (fromConsent) {
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
        <Text style={styles.headerTitle}>Nutzungsbedingungen</Text>
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
            <Scale size={28} color="#3B82F6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.introTitle}>Klare Regeln, faire Nutzung.</Text>
            <Text style={styles.introSub}>
              Open Source wo möglich – proprietäre Teile bleiben geschützt.
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
          <Text style={styles.footerText}>github.com/Cactus-Apps/Atlasys</Text>
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
    infoLight,
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
    introBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: "rgba(59,130,246,0.10)",
      borderWidth: 1,
      borderColor: "rgba(59,130,246,0.30)",
      borderRadius: isModern ? 18 : 12,
      padding: 16,
      marginBottom: 24,
    },
    introIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "rgba(59,130,246,0.15)",
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
