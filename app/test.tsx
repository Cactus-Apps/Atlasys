import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { ChevronLeft, Compass, Navigation } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { WidgetPreview, requestWidgetUpdate } from "react-native-android-widget";
import { CompassWidget } from "../widgets/CompassWidget";
import { getDeviceHeading, saveWidgetHeading } from "@/lib/compass";

const AUTO_REFRESH_MS = 3000;

export default function TestScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const styles = getStyles(theme);
  const [heading, setHeading] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const pushToWidget = useCallback(async (value: number) => {
    await requestWidgetUpdate({
      widgetName: "CompassWidget",
      renderWidget: async () => <CompassWidget heading={value} />,
    });
  }, []);

  const applyHeading = useCallback(
    async (value: number) => {
      const normalized = ((value % 360) + 360) % 360;
      setHeading(normalized);
      await saveWidgetHeading(normalized);
      void pushToWidget(normalized);
    },
    [pushToWidget]
  );

  useEffect(() => {
    if (!autoRefresh) return;

    let running = true;

    const tick = async () => {
      const value = await getDeviceHeading();
      if (!running) return;
      await applyHeading(value);
    };

    void tick();
    const id = setInterval(tick, AUTO_REFRESH_MS);

    return () => {
      running = false;
      clearInterval(id);
    };
  }, [autoRefresh, applyHeading]);

  const handlePreset = (value: number) => {
    setAutoRefresh(false);
    void applyHeading(value);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kompass Widget</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.hint}>
          Vorschau des Kompass-Widgets. Im Auto-Modus wird die GPS-Kursrichtung
          alle 3 Sekunden gelesen und ans Widget geschickt.
        </Text>

        <View style={styles.headingRow}>
          <Compass size={20} color={theme.accentColor} />
          <Text style={styles.headingValue}>{Math.round(heading)}°</Text>
          <Text style={styles.headingLabel}>Heading</Text>
        </View>

        <View style={styles.card}>
          <WidgetPreview
            renderWidget={() => <CompassWidget heading={heading} />}
            width={180}
            height={180}
            showBorder
            highlightClickableAreas
          />
        </View>

        <View style={styles.autoRow}>
          <Text style={styles.autoLabel}>Auto (GPS) alle 3s</Text>
          <Switch
            value={autoRefresh}
            onValueChange={setAutoRefresh}
            trackColor={{ true: theme.accentColor, false: theme.subTextColor }}
            thumbColor={theme.white}
          />
        </View>

        <View style={styles.presetRow}>
          {[0, 90, 180, 270].map((value) => (
            <TouchableOpacity
              key={value}
              style={styles.presetButton}
              activeOpacity={0.8}
              onPress={() => handlePreset(value)}
            >
              <Text style={styles.presetText}>{value}°</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          activeOpacity={0.8}
          onPress={() => void applyHeading(heading)}
        >
          <Navigation size={18} color={theme.white} />
          <Text style={styles.buttonText}>Widget updaten</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const { bg, cardBg, textColor, subTextColor, borderColor } = theme;

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
    hint: {
      fontSize: 14,
      lineHeight: 20,
      color: subTextColor,
      marginBottom: 16,
    },
    headingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },
    headingValue: {
      fontSize: 22,
      fontFamily: fonts.bold,
      color: textColor,
    },
    headingLabel: {
      fontSize: 14,
      color: subTextColor,
    },
    card: {
      backgroundColor: cardBg,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: borderColor,
      alignItems: "center",
    },
    autoRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 4,
      marginTop: 16,
    },
    autoLabel: {
      fontSize: 15,
      fontFamily: fonts.semibold,
      color: textColor,
    },
    presetRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
    },
    presetButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.accentColor,
    },
    presetText: {
      fontSize: 15,
      fontFamily: fonts.semibold,
      color: theme.accentColor,
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 16,
      marginTop: 16,
    },
    buttonPrimary: {
      backgroundColor: theme.accentColor,
    },
    buttonText: {
      color: theme.white,
      fontSize: 15,
      fontFamily: fonts.semibold,
    },
  });
};