import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Plus, Minus, RefreshCw, Send } from "lucide-react-native";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { Box, Column, Row, Text as WidgetText, Button, Host } from "@expo/ui/jetpack-compose";
import {
  fillMaxSize,
  fillMaxWidth,
  padding,
  background,
  clip,
  Shapes,
  wrapContentHeight,
} from "@expo/ui/jetpack-compose/modifiers";
import { widget } from "@/widgets/test-widget";
import type { TestWidgetProps } from "@/widgets/test-widget";

function TestWidgetPreview(props: TestWidgetProps) {
  const { title = "Atlasys", message = "Test Widget", count = 0 } = props;
  return (
    <Host style={{ width: "100%", height: 240, borderRadius: 20 }}>
      <Box
        modifiers={[
          fillMaxSize(),
          background("#0F1B2D"),
          padding(12, 12, 12, 12),
        ]}
      >
        <Column
          modifiers={[
            fillMaxSize(),
            padding(14, 14, 14, 14),
            background("#1C2B45"),
            clip(Shapes.RoundedCorner(16)),
          ]}
          horizontalAlignment="start"
          verticalArrangement="spaceBetween"
        >
          <Row
            modifiers={[fillMaxWidth()]}
            horizontalArrangement="spaceBetween"
            verticalAlignment="center"
          >
            <WidgetText
              style={{ fontSize: 16, fontWeight: "bold" }}
              color="#FFFFFF"
              maxLines={1}
              overflow="ellipsis"
            >
              {title}
            </WidgetText>
            <Box
              modifiers={[
                padding(8, 4, 8, 4),
                background("#E63946"),
                clip(Shapes.RoundedCorner(10)),
              ]}
            >
              <WidgetText style={{ fontSize: 12, fontWeight: "bold" }} color="#FFFFFF">
                {count}
              </WidgetText>
            </Box>
          </Row>
          <WidgetText
            style={{ fontSize: 13 }}
            color="#9DB8D9"
            maxLines={2}
            overflow="ellipsis"
          >
            {message}
          </WidgetText>
          <Button
            modifiers={[wrapContentHeight()]}
            onClick={() => undefined}
            colors={{ containerColor: "#2E4A75", contentColor: "#FFFFFF" }}
          >
            <WidgetText style={{ fontSize: 13, fontWeight: "bold" }} color="#FFFFFF">
              +1
            </WidgetText>
          </Button>
        </Column>
      </Box>
    </Host>
  );
}

const TITLE_PRESETS = ["Atlasys", "Kompass", "Karte", "Notfall"];
const MESSAGE_PRESETS = [
  "Test Widget",
  "Standorte werden geteilt",
  "Keine Verbindung",
  "Bereit",
];

export default function TestScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const styles = getStyles(theme);
  const [title, setTitle] = useState("Atlasys");
  const [message, setMessage] = useState("Test Widget");
  const [count, setCount] = useState(3);

  useEffect(() => {
    return () => {
      try {
        widget.reload();
      } catch {
        // widget native object may be unavailable in some dev contexts
      }
    };
  }, []);

  const pushToWidget = () => {
    widget.updateSnapshot({ title, message, count });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Widget Test</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>
          Vorschau des TestWidget-Layouts. Mit den Steuerelementen unten kannst du
          Props ändern und per updateSnapshot an das Homescreen-Widget senden.
        </Text>

        <View style={styles.previewCard}>
          <TestWidgetPreview title={title} message={message} count={count} />
        </View>

        <WidgetText
          style={{ fontSize: 12 }}
          color={theme.subTextColor}
        >
          {`Aktuelle Props: title="${title}" • message="${message}" • count=${count}`}
        </WidgetText>

        <Text style={styles.sectionTitle}>Titel</Text>
        <View style={styles.chipRow}>
          {TITLE_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[styles.chip, title === preset && styles.chipActive]}
              onPress={() => setTitle(preset)}
            >
              <Text style={[styles.chipText, title === preset && styles.chipTextActive]}>
                {preset}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Nachricht</Text>
        <View style={styles.chipRow}>
          {MESSAGE_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[styles.chip, message === preset && styles.chipActive]}
              onPress={() => setMessage(preset)}
            >
              <Text style={[styles.chipText, message === preset && styles.chipTextActive]}>
                {preset}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Counter</Text>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => setCount((c) => Math.max(0, c - 1))}
          >
            <Minus size={20} color={theme.textColor} />
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{count}</Text>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => setCount((c) => c + 1)}
          >
            <Plus size={20} color={theme.textColor} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={pushToWidget}>
          <Send size={18} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>updateSnapshot</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => widget.reload()}
        >
          <RefreshCw size={18} color={theme.textColor} />
          <Text style={[styles.actionButtonText, styles.actionButtonSecondaryText]}>
            reload
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const { bg, cardBg, textColor, subTextColor, borderColor, primary, white } = theme;
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
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    backButton: {
      width: 44,
      padding: 8,
    },
    headerTitle: {
      fontFamily: fonts.displayBold,
      fontSize: 20,
      color: textColor,
    },
    content: {
      padding: 16,
      paddingBottom: 48,
    },
    hint: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 19,
      color: subTextColor,
      marginBottom: 14,
    },
    previewCard: {
      borderRadius: 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: borderColor,
    },
    sectionTitle: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      color: subTextColor,
      letterSpacing: 0.5,
      marginTop: 18,
      marginBottom: 8,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 99,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderColor,
    },
    chipActive: {
      backgroundColor: primary,
      borderColor: primary,
    },
    chipText: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: textColor,
    },
    chipTextActive: {
      color: white,
    },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: borderColor,
      padding: 8,
    },
    stepperButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      backgroundColor: "rgba(0,0,0,0.05)",
    },
    stepperValue: {
      fontFamily: fonts.displayBold,
      fontSize: 24,
      color: textColor,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: primary,
      borderRadius: 16,
      paddingVertical: 14,
      marginTop: 18,
    },
    actionButtonSecondary: {
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderColor,
    },
    actionButtonText: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: "#FFFFFF",
    },
    actionButtonSecondaryText: {
      color: textColor,
    },
  });
};