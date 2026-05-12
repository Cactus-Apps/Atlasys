import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/lib/storage/zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  FadeIn,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
} from "react-native-reanimated";
import {
  Shield,
  MapPin,
  Navigation,
  WifiOff,
  ChevronRight,
  ArrowRight,
  Check,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Sentry from "@sentry/react-native";
import { useAppTheme } from "@/lib/theme";
import { posthog } from "@/lib/config/posthog";
import { applyAnalyticsChoice } from "@/lib/auth/analytics";

const CONSENT_VERSION = "1.0";
const CONSENT_KEY = "atlasys_consent_v" + CONSENT_VERSION;

async function saveConsentLocally(): Promise<void> {
  await AsyncStorage.setItem(
    CONSENT_KEY,
    JSON.stringify({
      version: CONSENT_VERSION,
      acceptedAt: new Date().toISOString(),
      platform: Platform.OS,
    }),
  );
}

export async function syncConsentToServer(
  userId: string,
  supabase: any,
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(CONSENT_KEY);
    if (!raw) return;
    const consent = JSON.parse(raw);
    await supabase.from("user_consents").upsert({
      user_id: userId,
      consent_version: consent.version,
      accepted_at: consent.acceptedAt,
      platform: consent.platform,
    });
  } catch (error) {
    Sentry.captureException(error);
  }
}

const { width, height } = Dimensions.get("window");

type Slide = {
  id: number;
  tag: string;
  headline: string;
  sub: string;
  accentColor: string;
  gradientColors: readonly [string, string, string];
  visual: "map_preview" | "privacy" | "routing" | "offline" | "opensource";
};

const SLIDES: Slide[] = [
  {
    id: 1,
    tag: "Karte neu gedacht",
    headline: "Deine Karte.\nKeine Werbung.\nKeine Tracker.",
    sub: "Atlasys basiert auf OpenStreetMap – offen, transparent und komplett ohne Datensammlung.",
    accentColor: "#00C4B4",
    gradientColors: ["#0A1628", "#0D2137", "#0A1628"],
    visual: "map_preview",
  },
  {
    id: 2,
    tag: "Open Source",
    headline: "100% offen.\nGeprüft von\njedem.",
    sub: "Der vollständige Quellcode ist auf GitHub einsehbar. Keine versteckten Hintertüren – vertrau dem Code, nicht unserem Wort.",
    accentColor: "#3B82F6",
    gradientColors: ["#0A1220", "#0F1E35", "#0A1220"],
    visual: "opensource",
  },
  {
    id: 3,
    tag: "Navigation",
    headline: "Route planen\nwie ein Profi.",
    sub: "Auto, Fahrrad, zu Fuß – Routen werden über den öffentlichen OSRM-Dienst berechnet. Dabei werden nur anonyme Koordinaten übertragen – kein Name, kein Account, keine Speicherung.",
    accentColor: "#22C55E",
    gradientColors: ["#081A12", "#0D2A1C", "#081A12"],
    visual: "routing",
  },
  {
    id: 4,
    tag: "Offline-Karten",
    headline: "Kein Netz?\nKein Problem.",
    sub: "Lade ganze Regionen herunter und navigiere auch ohne Internetverbindung – ideal für Berge, Reisen und Randgebiete.",
    accentColor: "#F59E0B",
    gradientColors: ["#1A1200", "#2A1D00", "#1A1200"],
    visual: "offline",
  },
  {
    id: 5,
    tag: "Deine Privatsphäre",
    headline: "Du gehörst\nnicht zum\nProdukt.",
    sub: "Kein Account nötig für die Grundfunktionen. Kein Google. Kein Tracking. Atlasys gehört dir.",
    accentColor: "#A855F7",
    gradientColors: ["#120A1A", "#1E0F2A", "#120A1A"],
    visual: "privacy",
  },
];

function VisualPlaceholder({
  type,
  accent,
}: {
  type: Slide["visual"];
  accent: string;
}) {
  const theme = useAppTheme();
  const s = useMemo(() => getStyles(theme), [theme.isDark, theme.isModern]);
  if (type === "map_preview") {
    return (
      <View style={[s.frame, { borderColor: accent + "40" }]}>
        <Image
          source={require("../assets/images/map-demo.jpg")}
          style={s.mapPreview}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (type === "routing") {
    return (
      <View style={[s.frame, { borderColor: accent + "40" }]}>
        <View style={s.routeCard}>
          <Image
            source={require("../assets/images/route-demo.jpg")}
            style={s.mapPreview2}
            resizeMode="cover"
          />
          <View style={s.modeRow}>
            {["Auto", "Rad", "Fuß"].map((m) => (
              <View
                key={m}
                style={[
                  s.modeChip,
                  m.includes("Auto") && {
                    backgroundColor: accent + "30",
                    borderColor: accent,
                  },
                ]}
              >
                <Text
                  style={[s.modeText, m.includes("Auto") && { color: accent }]}
                >
                  {m}
                </Text>
              </View>
            ))}
          </View>
          <View
            style={[
              s.infoBox,
              { backgroundColor: accent + "15", borderColor: accent + "40" },
            ]}
          >
            <Text style={[s.infoVal, { color: accent }]}>23 Min.</Text>
            <View style={s.infoDivider} />
            <Text style={[s.infoVal, { color: accent }]}>8.4 km</Text>
          </View>
          <Text style={s.privacyNote}>
            🔒 Berechnung erfolgt lokal · Keine Serverdaten
          </Text>
        </View>
      </View>
    );
  }

  if (type === "offline") {
    return (
      <View style={[s.frame, { borderColor: accent + "40" }]}>
        <View style={s.offlineCard}>
          <WifiOff size={32} color={accent} />
          <Text style={[s.offlineTitle, { color: accent }]}>
            Offline bereit
          </Text>
          {[
            { name: "Bayern, Deutschland", size: "142 MB", tiles: "12.400" },
            { name: "Wien, Österreich", size: "48 MB", tiles: "4.200" },
          ].map((r) => (
            <View
              key={r.name}
              style={[s.regionRow, { borderColor: accent + "30" }]}
            >
              <View style={[s.regionIcon, { backgroundColor: accent + "20" }]}>
                <MapPin size={14} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.regionName}>{r.name}</Text>
                <Text style={s.regionMeta}>
                  {r.tiles} Tiles · {r.size}
                </Text>
              </View>
            </View>
          ))}
          <Text style={s.privacyNote}>Speicherplatz selbst verwalten</Text>
        </View>
      </View>
    );
  }

  if (type === "privacy") {
    return (
      <View style={[s.frame, { borderColor: accent + "40" }]}>
        <View style={s.privacyCard}>
          <View style={[s.shieldBg, { backgroundColor: accent + "15" }]}>
            <Shield size={52} color={accent} />
          </View>
          {[
            { label: "Kein Google Analytics", ok: true },
            { label: "Kein Facebook SDK", ok: true },
            { label: "Keine Werbung", ok: true },
            { label: "Kein Databroker", ok: true },
            { label: "Lokale Verarbeitung", ok: true },
          ].map((item) => (
            <View key={item.label} style={s.checkRow}>
              <View style={[s.checkBullet, { backgroundColor: accent + "30" }]}>
                <Text
                  style={{ color: accent, fontSize: 10, fontWeight: "700" }}
                >
                  ✓
                </Text>
              </View>
              <Text style={s.checkLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[s.frame, { borderColor: accent + "40" }]}>
      <View style={s.codeCard}>
        <View style={[s.codeHeader, { backgroundColor: accent + "20" }]}>
          <View style={s.codeTrafficLight}>
            {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
              <View key={c} style={[s.trafficDot, { backgroundColor: c }]} />
            ))}
          </View>
          <Text style={[s.codeFilename, { color: accent }]}>MapScreen.tsx</Text>
        </View>
        <View style={s.codeBody}>
          {[
            { indent: 0, text: "// Keine Tracker, kein SDK", color: "#6B7280" },
            { indent: 0, text: "const privacy = true;", color: "#60A5FA" },
            { indent: 0, text: "const openSource = true;", color: "#60A5FA" },
            { indent: 0, text: "", color: "#fff" },
            {
              indent: 0,
              text: "// 100% offen. Geprüft von jedem",
              color: "#6B7280",
            },
            {
              indent: 0,
              text: "github.com/Cactus-Apps/Atlasys;",
              color: "#A78BFA",
            },
          ].map((line, i) => (
            <Text
              key={i}
              style={[
                s.codeLine,
                { color: line.color, paddingLeft: line.indent * 12 },
              ]}
            >
              {line.text}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const params = useLocalSearchParams<{ showConsent?: string }>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [showConsent, setShowConsent] = useState(params.showConsent === "true");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const theme = useAppTheme();
  const s = useMemo(() => getStyles(theme), [theme.isDark, theme.isModern]);

  type AnalyticsChoice = "full" | "anonymous" | "none";
  const [analyticsChoice, setAnalyticsChoice] =
    useState<AnalyticsChoice>("none");
  const updateSettings = useAuthStore((s) => s.updateSettings);

  const router = useRouter();
  const setOnboardingCompleted = useAuthStore((s) => s.setOnboardingCompleted);

  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) {
      setShowConsent(true);
    } else {
      setDirection("forward");
      setCurrentIndex((i) => i + 1);
    }
  }, [isLast]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowConsent(true);
  }, []);

  const handleAccept = useCallback(async () => {
    if (!acceptedTerms || !acceptedPrivacy) {
      setConsentError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await saveConsentLocally();
      updateSettings({ analytics: analyticsChoice });
      applyAnalyticsChoice(analyticsChoice, undefined);
      posthog.capture("onboarding_completed", {
        analytics_choice: analyticsChoice,
      });
    } catch (error) {
      Sentry.captureException(error);
    } finally {
      setOnboardingCompleted(true);
      router.replace("/auth");
    }
  }, [acceptedTerms, acceptedPrivacy]);

  useEffect(() => {
    setShowConsent(params.showConsent === "true");
  }, [params.showConsent]);

  const handleDotPress = useCallback(
    (idx: number) => {
      if (idx === currentIndex || showConsent) return;
      setDirection(idx > currentIndex ? "forward" : "back");
      setCurrentIndex(idx);
    },
    [currentIndex, showConsent],
  );

  const enterAnim =
    direction === "forward"
      ? SlideInRight.duration(350)
      : SlideInLeft.duration(350);
  const exitAnim =
    direction === "forward"
      ? SlideOutLeft.duration(350)
      : SlideOutRight.duration(350);

  if (showConsent) {
    return (
      <ScrollView style={s.root}>
        <StatusBar style="auto" />
        <LinearGradient
          colors={["#0A0F1E", "#101828", "#0A0F1E"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={s.safe}>
          <Animated.View
            entering={SlideInRight.duration(350)}
            style={s.consentContainer}
          >
            <View style={s.consentIconWrap}>
              <View style={s.consentIconBg}>
                <Shield size={36} color="#00C4B4" />
              </View>
            </View>

            <Text style={s.consentHeadline}>Fast geschafft.</Text>
            <Text style={s.consentSub}>
              Bevor du startest, bestätige bitte dass du unsere
              Nutzungsbedingungen und Datenschutzerklärung gelesen und
              akzeptiert hast.
            </Text>
            <Text style={s.consentLegal}>
              Deine Zustimmung wird lokal mit Zeitstempel gespeichert und nach
              der Anmeldung deinem Konto zugeordnet – gemäß DSGVO Art. 7.
            </Text>

            <View style={s.checkboxArea}>
              <TouchableOpacity
                style={[
                  s.checkboxRow,
                  consentError && !acceptedTerms && s.checkboxRowError,
                ]}
                onPress={() => {
                  setAcceptedTerms((v) => !v);
                  setConsentError(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <View style={[s.checkbox, acceptedTerms && s.checkboxChecked]}>
                  {acceptedTerms && (
                    <Check size={13} color="#fff" strokeWidth={3} />
                  )}
                </View>
                <Text style={s.checkboxText}>
                  Ich akzeptiere die{" "}
                  <Text
                    style={s.checkboxLink}
                    onPress={() =>
                      router.push({
                        pathname: "/(legal)/Terms_of_Use",
                        params: { from: "consent" },
                      })
                    }
                  >
                    Nutzungsbedingungen
                  </Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  s.checkboxRow,
                  consentError && !acceptedPrivacy && s.checkboxRowError,
                ]}
                onPress={() => {
                  setAcceptedPrivacy((v) => !v);
                  setConsentError(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[s.checkbox, acceptedPrivacy && s.checkboxChecked]}
                >
                  {acceptedPrivacy && (
                    <Check size={13} color="#fff" strokeWidth={3} />
                  )}
                </View>
                <Text style={s.checkboxText}>
                  Ich habe die{" "}
                  <Text
                    style={s.checkboxLink}
                    onPress={() =>
                      router.push({
                        pathname: "/(legal)/Privacy_Policy",
                        params: { from: "consent" },
                      })
                    }
                  >
                    Datenschutzerklärung
                  </Text>{" "}
                  gelesen und stimme zu
                </Text>
              </TouchableOpacity>
            </View>

            <View style={s.analyticsSection}>
              <Text style={s.sectionLabel}>Analyse & Verbesserung</Text>

              {/* Kompakte Chip-Reihe */}
              <View style={s.analyticsChipRow}>
                {(["none", "anonymous", "full"] as AnalyticsChoice[]).map(
                  (choice) => (
                    <TouchableOpacity
                      key={choice}
                      style={[
                        s.analyticsChip,
                        analyticsChoice === choice && s.analyticsChipActive,
                      ]}
                      onPress={() => {
                        setAnalyticsChoice(choice);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text
                        style={[
                          s.analyticsChipText,
                          analyticsChoice === choice &&
                            s.analyticsChipTextActive,
                        ]}
                      >
                        {choice === "none" && "Keine"}
                        {choice === "anonymous" && "Anonym ✓"}
                        {choice === "full" && "Vollständig"}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>

              {/* Kurze Beschreibung nur der gewählten Option */}
              <Text style={s.analyticsHint}>
                {analyticsChoice === "none" && "Keine Daten werden gesendet."}
                {analyticsChoice === "anonymous" &&
                  "Nur anonyme Nutzungsdaten, kein Account-Bezug."}
                {analyticsChoice === "full" &&
                  "Nutzungsverhalten wird mit deinem Account verknüpft."}
              </Text>
            </View>

            {consentError && (
              <Animated.View entering={FadeIn.duration(200)} style={s.errorBox}>
                <Text style={s.errorText}>
                  Bitte akzeptiere beide Dokumente um fortzufahren.
                </Text>
              </Animated.View>
            )}

            <Text style={s.versionNote}>
              AGB & Datenschutz Version {CONSENT_VERSION} · Atlasys v1.5
            </Text>

            <TouchableOpacity
              onPress={handleAccept}
              activeOpacity={0.85}
              style={[
                s.nextBtn,
                {
                  backgroundColor:
                    acceptedTerms && acceptedPrivacy
                      ? "#00C4B4"
                      : "rgba(255,255,255,0.1)",
                  marginTop: 8,
                },
              ]}
            >
              <Text
                style={[
                  s.nextBtnText,
                  {
                    color:
                      acceptedTerms && acceptedPrivacy
                        ? "#fff"
                        : "rgba(255,255,255,0.4)",
                  },
                ]}
              >
                Akzeptieren & Starten
              </Text>
              <ArrowRight
                size={18}
                color={
                  acceptedTerms && acceptedPrivacy
                    ? "#fff"
                    : "rgba(255,255,255,0.3)"
                }
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowConsent(false)}
              style={{ alignItems: "center", paddingVertical: 12 }}
            >
              <Text style={s.skipText}>← Zurück</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar style="auto" />

      <LinearGradient
        colors={slide.gradientColors}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={s.gridOverlay} pointerEvents="none" />

      <View style={s.safe}>
        <View style={s.header}>
          <View style={[s.appBadge, { borderColor: slide.accentColor + "40" }]}>
            <Navigation size={14} color={slide.accentColor} />
            <Text style={[s.appBadgeText, { color: slide.accentColor }]}>
              Atlasys
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSkip}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={s.skipText}>Überspringen</Text>
          </TouchableOpacity>
        </View>

        <Animated.View
          key={`slide-${currentIndex}`}
          entering={enterAnim}
          exiting={exitAnim}
          style={s.slideContent}
        >
          <View style={s.visualArea}>
            <VisualPlaceholder type={slide.visual} accent={slide.accentColor} />
          </View>

          <View style={s.textArea}>
            <View
              style={[
                s.tagPill,
                {
                  backgroundColor: slide.accentColor + "20",
                  borderColor: slide.accentColor + "50",
                },
              ]}
            >
              <Text style={[s.tagText, { color: slide.accentColor }]}>
                {slide.tag}
              </Text>
            </View>

            <Text style={s.headline}>{slide.headline}</Text>
            <Text style={s.sub}>{slide.sub}</Text>
          </View>
        </Animated.View>

        <View style={s.footer}>
          <View style={s.dots}>
            {SLIDES.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleDotPress(i)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Animated.View
                  style={[
                    s.dot,
                    i === currentIndex && {
                      backgroundColor: slide.accentColor,
                      width: 24,
                    },
                    i !== currentIndex && { backgroundColor: "#FFFFFF20" },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.85}
            style={[s.nextBtn, { backgroundColor: slide.accentColor }]}
          >
            {isLast ? (
              <>
                <Text style={s.nextBtnText}>Jetzt starten</Text>
                <ArrowRight size={18} color="#fff" />
              </>
            ) : (
              <>
                <Text style={s.nextBtnText}>Weiter</Text>
                <ChevronRight size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {currentIndex === SLIDES.length - 1 && (
            <Animated.Text entering={FadeIn.delay(200)} style={s.footNote}>
              Account erforderlich · Jederzeit abmeldbar
            </Animated.Text>
          )}
        </View>
      </View>
    </View>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const {
    bg,
    textColor,
    subTextColor,
    white,
    borderColor,
    cardBg,
    cardBgSecondary,
    danger,
    dangerLight,
    primaryLight,
    sub3,
    sub5,
    sub6,
    sub1,
  } = theme;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: bg,
    },
    gridOverlay: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.04,
    },
    safe: {
      flex: 1,
      paddingTop: 28,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 8,
    },
    appBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      backgroundColor: "rgba(255,255,255,0.05)",
    },
    appBadgeText: {
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    skipText: {
      color: subTextColor,
      fontSize: 14,
      fontWeight: "500",
    },
    slideContent: {
      flex: 1,
      paddingHorizontal: 20,
    },
    visualArea: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 12,
    },
    textArea: {
      paddingBottom: 16,
    },
    tagPill: {
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: 1,
      marginBottom: 14,
    },
    tagText: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    headline: {
      fontSize: 32,
      fontWeight: "800",
      color: white,
      lineHeight: 38,
      letterSpacing: -0.5,
      marginBottom: 14,
    },
    sub: {
      fontSize: 15,
      color: subTextColor,
      lineHeight: 22,
    },
    footer: {
      paddingHorizontal: 24,
      paddingBottom: Platform.OS === "ios" ? 32 : 24,
      gap: 20,
    },
    dots: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    dot: {
      height: 6,
      width: 6,
      borderRadius: 3,
      backgroundColor: borderColor,
    },
    nextBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 17,
      borderRadius: 18,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    },
    nextBtnText: {
      color: white,
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    footNote: {
      textAlign: "center",
      color: subTextColor,
      fontSize: 12,
    },
    consentContainer: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: Platform.OS === "ios" ? 32 : 24,
      justifyContent: "center",
    },
    consentIconWrap: {
      alignItems: "center",
      marginBottom: 24,
    },
    consentIconBg: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: primaryLight,
      borderWidth: 1,
      borderColor: borderColor,
      justifyContent: "center",
      alignItems: "center",
    },
    consentHeadline: {
      fontSize: 30,
      fontWeight: "800",
      color: white,
      textAlign: "center",
      letterSpacing: -0.5,
      marginBottom: 12,
    },
    consentSub: {
      fontSize: 15,
      color: subTextColor,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 10,
    },
    consentLegal: {
      fontSize: 12,
      color: subTextColor,
      textAlign: "center",
      lineHeight: 18,
      marginBottom: 28,
      paddingHorizontal: 8,
    },
    checkboxArea: {
      gap: 12,
      marginBottom: 16,
    },
    checkboxRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderColor,
      borderRadius: 14,
      padding: 14,
    },
    checkboxRowError: {
      borderColor: danger,
      backgroundColor: dangerLight,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: borderColor,
      justifyContent: "center",
      alignItems: "center",
      flexShrink: 0,
      marginTop: 1,
    },
    checkboxChecked: {
      backgroundColor: "#00C4B4",
      borderColor: "#00C4B4",
    },
    checkboxText: {
      flex: 1,
      fontSize: 14,
      color: textColor,
      lineHeight: 20,
    },
    checkboxLink: {
      color: "#00C4B4",
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    errorBox: {
      backgroundColor: dangerLight,
      borderWidth: 1,
      borderColor: danger,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 12,
    },
    errorText: {
      color: danger,
      fontSize: 13,
      textAlign: "center",
    },
    versionNote: {
      fontSize: 11,
      color: subTextColor,
      textAlign: "center",
      marginBottom: 16,
    },
    frame: {
      width: width - 56,
      height: height * 0.36,
      borderRadius: 24,
      borderWidth: 1,
      backgroundColor: "rgba(255,255,255,0.04)",
      overflow: "hidden",
      justifyContent: "center",
      alignItems: "center",
    },
    // Map Preview
    mapGrid: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: "row",
      flexWrap: "wrap",
    },
    mapPreview: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    },
    mapPreview2: {
      width: "100%",
      height: "40%",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 8,
    },
    mapPreviewImage: {
      opacity: 0.85,
    },
    mapTile: {
      width: (width - 56) / 5,
      height: (height * 0.36) / 6,
    },
    routeLine: {
      position: "absolute",
      width: 3,
      height: "60%",
      borderRadius: 2,
      left: "40%",
      top: "20%",
      opacity: 0.6,
    },
    pinWrapper: {
      position: "absolute",
      alignItems: "center",
    },
    pinOuter: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
    },
    pinInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    pinPulse: {
      position: "absolute",
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      opacity: 0.3,
    },
    badge: {
      position: "absolute",
      bottom: 12,
      left: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      borderWidth: 1,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: "600",
    },
    // Route Card
    routeCard: {
      width: "90%",
      gap: 12,
    },
    routeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 8,
    },
    routeDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    routeLineH: {
      flex: 1,
      height: 2,
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: 1,
    },
    modeRow: {
      flexDirection: "row",
      gap: 8,
    },
    modeChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: cardBgSecondary,
      borderWidth: 1,
      borderColor: borderColor,
    },
    modeText: {
      fontSize: 12,
      color: subTextColor,
      fontWeight: "500",
    },
    infoBox: {
      flexDirection: "row",
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      justifyContent: "space-around",
      alignItems: "center",
    },
    infoVal: {
      fontSize: 20,
      fontWeight: "800",
      flex: 1,
      textAlign: "center",
    },
    infoDivider: {
      width: 1,
      height: 28,
      backgroundColor: borderColor,
    },
    privacyNote: {
      fontSize: 11,
      color: subTextColor,
      textAlign: "center",
    },
    // Offline Card
    offlineCard: {
      width: "90%",
      alignItems: "center",
      gap: 10,
    },
    offlineTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginTop: 4,
    },
    regionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      width: "100%",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: "rgba(255,255,255,0.04)",
    },
    regionIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    regionName: {
      color: textColor,
      fontSize: 13,
      fontWeight: "600",
    },
    regionMeta: {
      color: subTextColor,
      fontSize: 11,
    },
    // Privacy Card
    privacyCard: {
      width: "90%",
      alignItems: "center",
      gap: 8,
    },
    shieldBg: {
      width: 88,
      height: 88,
      borderRadius: 44,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    checkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      width: "100%",
    },
    checkBullet: {
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    checkLabel: {
      color: textColor,
      fontSize: 13,
      fontWeight: "500",
    },
    // Code Card (Open Source)
    codeCard: {
      width: "90%",
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderColor,
    },
    codeHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 10,
    },
    codeTrafficLight: {
      flexDirection: "row",
      gap: 5,
    },
    trafficDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    codeFilename: {
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 0.3,
    },
    codeBody: {
      padding: 14,
      gap: 3,
    },
    codeLine: {
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
      fontSize: 12,
      lineHeight: 20,
    },
    ghBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      margin: 12,
      marginTop: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      alignSelf: "flex-start",
    },
    analyticsOption: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: sub1,
      backgroundColor: "rgba(255,255,255,0.04)",
      marginBottom: 8,
    },
    analyticsOptionActive: {
      borderColor: "#00C4B4",
      backgroundColor: "rgba(0,196,180,0.08)",
    },
    analyticsOptionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: "#fff",
      marginBottom: 2,
    },
    analyticsOptionSub: {
      fontSize: 12,
      color: sub5,
      lineHeight: 16,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: sub3,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 1,
      flexShrink: 0,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "#00C4B4",
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: sub6,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    analyticsSection: {
      marginBottom: 12,
    },
    analyticsChipRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 6,
    },
    analyticsChip: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: "rgba(255,255,255,0.15)",
      backgroundColor: "rgba(255,255,255,0.05)",
      alignItems: "center",
    },
    analyticsChipActive: {
      borderColor: "#00C4B4",
      backgroundColor: "rgba(0,196,180,0.15)",
    },
    analyticsChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: sub5,
    },
    analyticsChipTextActive: {
      color: "#00C4B4",
    },
    analyticsHint: {
      fontSize: 11,
      color: sub1,
      textAlign: "center",
    },
  });
};
