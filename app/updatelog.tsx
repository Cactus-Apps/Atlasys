import { t } from "i18next";
import { History, Zap, Sparkles, ChevronLeft } from "lucide-react-native";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import "./i18n";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const UpdateLog = () => {
  const theme = useAppTheme();
  const router = useRouter();
  const styles = getStyles(theme);

  const logs = [
    {
      version: "1.8.9",
      date: "2026-09-30",
      text: "Moved to the stable Expo SDK and refreshed the whole dependency tree for a more reliable build, smaller app size and smoother performance.",
      type: "improvement",
    },
    {
      version: "1.8.8",
      date: "2026-09-29",
      text: "New consent screen, so privacy-relevant changes are always explained before they apply. Redesigned Saved Places with cached map thumbnails and a new icon set for points of interest, reworked navigation instructions and more robust marker backups.",
      type: "feature",
    },
    {
      version: "1.8.7",
      date: "2026-09-19",
      text: "Location sharing is safer than ever: a kill switch can cut a session off remotely, background location keeps sharing with the screen off, and a live monitor keeps you in control. Streamlined the sharing channel and removed leftover internal test code.",
      type: "feature",
    },
    {
      version: "1.8.6",
      date: "2026-09-18",
      text: "Fixed Wikipedia articles and images that failed to load, city info now appears even when the image pipeline fails, and map requests are cancelled cleanly. Added internal tooling for automated map snapshots.",
      type: "improvement",
    },
    {
      version: "1.8.5",
      date: "2026-09-17",
      text: "People you are sharing with now appear directly on the map, and the sharing screen got a clearer layout. DM Sans and Lora are bundled, so typography renders instantly without a download. Navigation sidebar polish.",
      type: "feature",
    },
    {
      version: "1.8.4",
      date: "2026-09-12",
      text: "The big one: end-to-end encrypted location sharing. Share your live position with friends and family via QR code, protected by biometrics, with your keys stored only on your device. Plus a revamped navigation sidebar and an updated privacy policy.",
      type: "feature",
    },
    {
      version: "1.8.3",
      date: "2026-09-12",
      text: "Smoother map interaction: fewer re-renders while panning and zooming, a steadier compass heading and faster globe transitions.",
      type: "improvement",
    },
    {
      version: "1.8.2",
      date: "2026-08-30",
      text: "Faster and more reliable city details with improved transit and sights lookup, a shared request helper with better error handling, and routing upgrades.",
      type: "feature",
    },
    {
      version: "1.8.1",
      date: "2026-08-29",
      text: "Added an accessibility statement, a deeper navigation overhaul with clearer turn prompts, and further map improvements. Legal pages are now reachable straight from About.",
      type: "feature",
    },
    {
      version: "1.8.0",
      date: "2026-08-29",
      text: "Multi-stop route planning: add as many stops as you like and get one continuous route. Saved Places grew substantially, offline storage moved into a dedicated screen, and navigation got smarter.",
      type: "feature",
    },
    {
      version: "1.7.9",
      date: "2026-08-29",
      text: "Drop Pin: mark any spot on the map with a name, note and category. Added file backup for your markers so you can restore them later, place categories, and a redesigned offline maps screen.",
      type: "feature",
    },
    {
      version: "1.7.8",
      date: "2026-07-20",
      text: "Polished the full-screen update screen and made the update check lighter and more reliable across the app.",
      type: "improvement",
    },
    {
      version: "1.7.7",
      date: "2026-07-17",
      text: "Weather on the map: current conditions and a 7-day forecast for wherever you are. New city map icon, refreshed map styles, and a full-screen update screen with feature highlights.",
      type: "feature",
    },
    {
      version: "1.7.2",
      date: "2026-07-11",
      text: "New in-app update flow with a full-screen highlight of everything that changed, plus a redesigned onboarding and settings screen.",
      type: "feature",
    },
    {
      version: "1.7.1",
      date: "2026-07-11",
      text: "Polish pass across the app: cleaner map, account, sign-in, city and offline map screens, plus updated legal pages and licenses.",
      type: "improvement",
    },
    {
      version: "1.7.0",
      date: "2026-07-05",
      text: "New stop toast during navigation, bundled app fonts, a redesigned Saved Places screen, and a bigger theme overhaul.",
      type: "feature",
    },
    {
      version: "1.7.6",
      date: "2026-07-16",
      text: "Redesigned loading skeleton for city places and transit. Fixed POI detail click on map, improved map click detection with proper feature querying. Full-screen update screen with feature highlights.",
      type: "feature",
    },
    {
      version: "1.7.5",
      date: "2026-07-14",
      text: "New city loading skeleton with animated cards for places and transit information. Ping setting replaces analytics toggle.",
      type: "improvement",
    },
    {
      version: "1.7.4",
      date: "2026-07-12",
      text: "Bug fixes: TypeScript errors resolved, lint cleanup across codebase. Removed unused variables and fixed React hook dependencies.",
      type: "improvement",
    },
    {
      version: "1.7.3",
      date: "2026-07-11",
      text: "Live notifications with @notifee/react-native for navigation and offline map downloads. Fixed map flickering during navigation, POI modal first-click issue, POI details loading, empty modal after close, and full map re-render on GPS updates.",
      type: "feature",
    },
    {
      version: "1.6.9",
      date: "2026-06-21",
      text: "Renamed the satellite map style, improved the route sheet and the draw-bounds overlay, and refreshed the licenses screen.",
      type: "feature",
    },
    {
      version: "1.6.8",
      date: "2026-06-21",
      text: "New navigation sidebar with turn-by-turn directions, improved route planning, enhanced geocoding, circular progress indicator, and Zustand storage refactor.",
      type: "feature",
    },
    {
      version: "1.6.7",
      date: "2026-06-21",
      text: "Major city screen refactor with offline data caching, improved POI details, and geocoding/reverse geocoding enhancements.",
      type: "feature",
    },
    {
      version: "1.6.6",
      date: "2026-06-21",
      text: "New Apple-style and Satellite map styles, enhanced city detail screen with transit and sights browsing, and overpass API improvements.",
      type: "feature",
    },
    {
      version: "1.6.0",
      date: "2026-06-06",
      text: "Update announcement system with Orion Store deep link, new avatar system, tab bar redesign, improved account deletion, full i18n coverage, and new open source licenses.",
      type: "feature",
    },
    {
      version: "1.5.4",
      date: "2026-05-15",
      text: "Improved i18n localization, updated legal pages, design polish, and new app icon assets.",
      type: "feature",
    },
    {
      version: "1.5.3",
      date: "2026-05-12",
      text: "Major code cleanup: removed test files and paywall, overhauled licenses screen, settings improvements, and restructured utility libraries.",
      type: "improvement",
    },
    {
      version: "1.5.2",
      date: "2026-05-10",
      text: "New POI sheet, update banner, Overpass API integration, analytics, update context, and enhanced onboarding flow.",
      type: "feature",
    },
    {
      version: "1.5.1",
      date: "2026-05-06",
      text: "Complete onboarding redesign, new legal pages (privacy & terms) and map logger.",
      type: "feature",
    },
    {
      version: "1.5.0",
      date: "2026-04-26",
      text: "OAuth provider support, Supabase auth refactor, improved account screen, and map screen enhancements.",
      type: "feature",
    },
    {
      version: "1.4.9",
      date: "2026-04-12",
      text: "New navigation sidebar, expo update check, redesigned notifications screen, and settings improvements.",
      type: "feature",
    },
    {
      version: "1.4.8",
      date: "2026-04-10",
      text: "Feature request screen, major settings overhaul, theme system update, and announcement modal improvements.",
      type: "feature",
    },
    {
      version: "1.4.7",
      date: "2026-04-05",
      text: "Authentication refactor, weather component updates, i18n improvements, and storage optimizations.",
      type: "improvement",
    },
    {
      version: "1.4.6",
      date: "2026-04-04",
      text: "Re-added iOS native support, component restructuring with sheets_modal system, new ErrorSheet and MapStyleSheet.",
      type: "feature",
    },
    {
      version: "1.4.5",
      date: "2026-04-02",
      text: "Major refactor: theme system overhaul, new announcement system, geocoding integration, and removed unused assets.",
      type: "improvement",
    },
    {
      version: "1.4.4",
      date: "2026-03-07",
      text: "Initial iOS native support, offline maps tab, download tile system, draggable FAB, and draw bounds overlay.",
      type: "feature",
    },
    {
      version: "1.4.3",
      date: "2026-03-06",
      text: "New route sheet component and major map screen refactor with improved navigation.",
      type: "feature",
    },
    {
      version: "1.4.2",
      date: "2026-03-02",
      text: "Small map screen fixes and app entry point improvements.",
      type: "improvement",
    },
    {
      version: "1.4.1",
      date: "2026-03-02",
      text: "Bug fixes and minor map screen adjustments.",
      type: "improvement",
    },
    {
      version: "1.4.0",
      date: "2026-02-02",
      text: "Loading overlay component, massive map and profile screen refactoring, and Appwrite auth cleanup.",
      type: "feature",
    },
    {
      version: "1.3.9",
      date: "2026-01-29",
      text: "Massive map screen overhaul, new paywall system, auth paywall gate, and weather component updates.",
      type: "feature",
    },
    {
      version: "1.3.8",
      date: "2026-01-16",
      text: "Onboarding screen, new TabBarStyle, SkeletonView, and Zustand storage integration.",
      type: "feature",
    },
    {
      version: "1.3.7",
      date: "2026-01-09",
      text: "Map and profile screen redesign, tabs restructuring, and city details utility.",
      type: "improvement",
    },
    {
      version: "1.3.6",
      date: "2025-02-09",
      text: "Full localization in German, English, and French. UI Overhaul with glassmorphic design system.",
      type: "feature",
    },
    {
      version: "1.3.5",
      date: "2025-01-20",
      text: "New navigation system and expanded translations across most screens.",
      type: "improvement",
    },
    {
      version: "1.3.4",
      date: "2025-01-10",
      text: "New Profile screen and minor performance improvements.",
      type: "improvement",
    },
    {
      version: "1.3.2",
      date: "2024-12-25",
      text: "Improved home screen and weather display animations.",
      type: "feature",
    },
    {
      version: "1.3.1",
      date: "2024-12-15",
      text: "New home screen with advanced animation system.",
      type: "improvement",
    },
    {
      version: "1.3.0",
      date: "2024-12-01",
      text: "Redesigned account and update log screens for better readability.",
      type: "feature",
    },
    {
      version: "1.2.8",
      date: "2024-11-20",
      text: "Security improvements and a new, more secure login flow.",
      type: "improvement",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("Info_menu_update_log")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <History size={40} color="#2563EB" strokeWidth={2.5} />
          <Text style={styles.introTitle}>Version History</Text>
          <Text style={styles.introSub}>See what&apos;s new in Atlasys.</Text>
        </View>

        <View style={styles.timeline}>
          {logs.map((log, index) => (
            <View key={index} style={styles.logItem}>
              <View style={styles.timelineLine}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor:
                        log.type === "feature" ? "#2563EB" : "#94a3b8",
                    },
                  ]}
                />
                {index !== logs.length - 1 && <View style={styles.line} />}
              </View>

              <View style={styles.logCard}>
                <View style={styles.logHeader}>
                  <Text style={styles.versionTag}>{log.version}</Text>
                  {log.type === "feature" ? (
                    <Sparkles size={14} color="#2563EB" strokeWidth={3} />
                  ) : (
                    <Zap size={14} color="#94a3b8" />
                  )}
                </View>
                <Text style={styles.logText}>{log.text}</Text>
                <Text style={styles.logDate}>{log.date}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const { bg, cardBg, textColor, subTextColor, borderColor, isModern } = theme;

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
      fontFamily: fonts.bold,
      color: textColor,
    },
    backButton: {
      padding: 8,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    introSection: {
      alignItems: "center",
      marginBottom: 32,
      marginTop: 12,
    },
    introTitle: {
      fontSize: 24,
      fontFamily: fonts.bold,
      color: textColor,
      marginTop: 16,
    },
    introSub: {
      fontSize: 15,
      color: subTextColor,
      textAlign: "center",
      marginTop: 8,
    },
    timeline: {
      paddingLeft: 8,
    },
    logItem: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 0,
    },
    timelineLine: {
      alignItems: "center",
      width: 20,
    },
    timelineDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      zIndex: 1,
      marginTop: 24,
    },
    line: {
      width: 2,
      flex: 1,
      backgroundColor: borderColor,
      marginTop: -4,
      marginBottom: -24,
    },
    logCard: {
      flex: 1,
      backgroundColor: cardBg,
      borderRadius: isModern ? 24 : 20,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: borderColor,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isModern ? (theme.isDark ? 0 : 0.05) : 0.03,
      shadowRadius: isModern ? 16 : 10,
      elevation: 2,
    },
    logHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    versionTag: {
      fontSize: 14,
      fontFamily: fonts.bold,
      color: "#2563EB",
      backgroundColor: theme.isModern
        ? theme.iconBg
        : theme.isDark
          ? "rgba(37, 99, 235, 0.1)"
          : "#EFF6FF",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: isModern ? 8 : 6,
    },
    logText: {
      fontSize: 15,
      color: textColor,
      lineHeight: 22,
      fontFamily: fonts.medium,
    },
    logDate: {
      fontSize: 12,
      color: subTextColor,
      marginTop: 12,
      fontFamily: fonts.semibold,
    },
  });
};

export default UpdateLog;
