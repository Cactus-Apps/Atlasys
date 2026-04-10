import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Clipboard,
  Linking,
  Alert,
} from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { X, AlertCircle, Copy, Github, Check } from "lucide-react-native";
import { useAppTheme } from "@/lib/theme";
import * as Application from "expo-application";

interface Props {
  open: boolean;
  onClose: () => void;
  errorTitle: string;
  error: string | Error | Record<string, any> | null | undefined;
  errorCode?: string; // z.B. "ERR_NETWORK_001"
  stillAvailable?: string[]; // Was trotzdem noch geht
  githubRepo?: string; // z.B. "cactus-apps/atlasys"
}

export default function ErrorSheet({
  open,
  onClose,
  errorTitle,
  error,
  errorCode,
  stillAvailable = [],
  githubRepo = "cactus-apps/atlasys",
}: Props) {
  const theme = useAppTheme();
  const s = getStyles(theme);
  const sheetRef = useRef<BottomSheet>(null);
  const didMount = useRef(false);
  const [copied, setCopied] = React.useState(false);

  const appVersion = Application.nativeApplicationVersion ?? "–";
  const buildNumber = Application.nativeBuildVersion ?? "–";

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (open) {
      const t = setTimeout(() => sheetRef.current?.snapToIndex(1), 50);
      return () => clearTimeout(t);
    } else {
      sheetRef.current?.close();
    }
  }, [open]);

  const errorMessage =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : error
          ? JSON.stringify(error, null, 2)
          : "Unbekannter Fehler";

  const errorDetails = [
    `Fehler: ${errorTitle}`,
    `Nachricht: ${errorMessage}`,
    errorCode ? `Code: ${errorCode}` : null,
    `App-Version: v${appVersion}`,
    `Build: #${buildNumber}`,
    `Plattform: ${Platform.OS} ${Platform.Version}`,
    `Datum: ${new Date().toLocaleString("de")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const handleCopy = () => {
    Clipboard.setString(errorDetails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGithubIssue = () => {
    const title = encodeURIComponent(`[Bug] ${errorTitle}`);
    const body = encodeURIComponent(
      `## Fehlerbeschreibung\n\n${errorMessage}\n\n## Details\n\`\`\`\n${errorDetails}\n\`\`\``,
    );
    Linking.openURL(
      `https://github.com/${githubRepo}/issues/new?title=${title}&body=${body}`,
    );
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={["50%", "80%"]}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{
        borderTopLeftRadius: theme.isModern ? 32 : 24,
        borderTopRightRadius: theme.isModern ? 32 : 24,
        backgroundColor: theme.bg,
      }}
      handleIndicatorStyle={{ backgroundColor: theme.subTextColor, width: 40 }}
    >
      <BottomSheetScrollView contentContainerStyle={s.container}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.errorIconBox}>
              <AlertCircle size={18} color={theme.danger} />
            </View>
            <View>
              <Text style={s.headerSub}>Fehlerdiagnose</Text>
              <Text style={s.title}>{errorTitle}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <X size={16} color={theme.subTextColor} />
          </TouchableOpacity>
        </View>

        {/* Fehlermeldung */}
        <View style={s.errorBox}>
          <Text style={s.errorText}>{errorMessage}</Text>
        </View>

        {/* Details Grid */}
        <View style={s.detailsBox}>
          <Text style={s.sectionLabel}>Details</Text>
          <View style={s.detailsGrid}>
            {errorCode && (
              <View style={s.detailItem}>
                <Text style={s.detailKey}>Fehlercode</Text>
                <Text style={[s.detailValue, { fontFamily: "monospace" }]}>
                  {errorCode}
                </Text>
              </View>
            )}
            <View style={s.detailItem}>
              <Text style={s.detailKey}>App-Version</Text>
              <Text style={s.detailValue}>v{appVersion}</Text>
            </View>
            <View style={s.detailItem}>
              <Text style={s.detailKey}>Build</Text>
              <Text style={s.detailValue}>#{buildNumber}</Text>
            </View>
            <View style={s.detailItem}>
              <Text style={s.detailKey}>Plattform</Text>
              <Text style={s.detailValue}>
                {Platform.OS === "ios" ? "iOS" : "Android"} {Platform.Version}
              </Text>
            </View>
          </View>
        </View>

        {/* Weiterhin verfügbar */}
        {stillAvailable.length > 0 && (
          <View style={s.availableBox}>
            <Text style={s.sectionLabel}>Weiterhin verfügbar</Text>
            {stillAvailable.map((item, i) => (
              <View key={i} style={s.availableItem}>
                <View style={s.checkCircle}>
                  <Check size={12} color={theme.success} strokeWidth={3} />
                </View>
                <Text style={s.availableText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Buttons */}
        <View style={s.btnRow}>
          <TouchableOpacity style={s.btnSecondary} onPress={handleCopy}>
            {copied ? (
              <Check size={16} color={theme.textColor} />
            ) : (
              <Copy size={16} color={theme.textColor} />
            )}
            <Text style={s.btnSecondaryText}>
              {copied ? "Kopiert!" : "Kopieren"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.btnPrimary} onPress={handleGithubIssue}>
            <Github size={16} color={theme.white} />
            <Text style={s.btnPrimaryText}>GitHub Issue</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const {
    bg,
    cardBg,
    textColor,
    subTextColor,
    borderColor,
    isModern,
    iconBg,
    danger,
    dangerLight,
    dangerDark,
    success,
    successLight,
    white,
  } = theme;

  return StyleSheet.create({
    container: { paddingHorizontal: 20, paddingBottom: 40 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    errorIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: dangerLight,
      justifyContent: "center",
      alignItems: "center",
    },
    headerSub: { fontSize: 11, color: subTextColor },
    title: { fontSize: 17, fontWeight: "600", color: textColor },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: iconBg,
      justifyContent: "center",
      alignItems: "center",
    },
    errorBox: {
      backgroundColor: dangerLight,
      borderRadius: isModern ? 16 : 12,
      padding: 14,
      marginBottom: 14,
      borderWidth: 0.5,
      borderColor: danger,
    },
    errorText: { fontSize: 13, color: danger, lineHeight: 20 },
    detailsBox: {
      backgroundColor: cardBg,
      borderRadius: isModern ? 16 : 12,
      padding: 14,
      marginBottom: 14,
      borderWidth: 0.5,
      borderColor: borderColor,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: subTextColor,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    detailsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    detailItem: { width: "47%" },
    detailKey: { fontSize: 11, color: subTextColor, marginBottom: 2 },
    detailValue: { fontSize: 13, fontWeight: "500", color: textColor },
    availableBox: { marginBottom: 20 },
    availableItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: cardBg,
      borderRadius: isModern ? 12 : 10,
      marginBottom: 6,
      borderWidth: 0.5,
      borderColor: borderColor,
    },
    checkCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: successLight,
      justifyContent: "center",
      alignItems: "center",
    },
    availableText: { fontSize: 13, color: textColor },
    btnRow: { flexDirection: "row", gap: 10 },
    btnSecondary: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 13,
      borderRadius: isModern ? 16 : 12,
      backgroundColor: cardBg,
      borderWidth: 0.5,
      borderColor: borderColor,
    },
    btnSecondaryText: { fontSize: 14, fontWeight: "500", color: textColor },
    btnPrimary: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 13,
      borderRadius: isModern ? 16 : 12,
      backgroundColor: danger,
    },
    btnPrimaryText: { fontSize: 14, fontWeight: "500", color: white },
  });
};
