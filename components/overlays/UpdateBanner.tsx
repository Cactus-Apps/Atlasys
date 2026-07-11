import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { X, Download, RotateCcw } from "lucide-react-native";
import { useAppTheme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { useTranslation } from "react-i18next";
import { useUpdate } from "@/lib/hooks/update-context";

export function UpdateBanner() {
  const { t } = useTranslation();
  const { state, dismiss, reload } = useUpdate();
  const theme = useAppTheme();
  const styles = getStyles(theme);

  // Show banner only when an update is available, downloading, or ready
  if (
    !state ||
    state.status === "idle" ||
    state.status === "checking" ||
    state.status === "dismissed"
  ) {
    return null;
  }

  const handleReload = async () => {
    await reload();
  };

  return (
    <TouchableOpacity
      onPress={state.status === "ready" ? handleReload : undefined}
      activeOpacity={state.status === "ready" ? 0.7 : 1}
      disabled={state.status !== "ready"}
    >
      <View
        style={[
          styles.container,
          state.status === "ready" && styles.containerReady,
          state.status === "downloading" && styles.containerDownloading,
        ]}
      >
        <View style={styles.content}>
          {state.status === "available" && (
            <>
              <View style={styles.textContainer}>
                <Download size={20} color={theme.primary} />
                <View style={styles.textContent}>
                  <Text style={styles.title}>{t("Update_available")}</Text>
                  <Text style={styles.subtitle}>
                    {t("Update_downloading_sub")}
                  </Text>
                </View>
              </View>
              <ActivityIndicator color={theme.primary} size="small" />
            </>
          )}

          {state.status === "downloading" && (
            <>
              <View style={styles.textContainer}>
                <ActivityIndicator color={theme.primary} size="small" />
                <View style={styles.textContent}>
                  <Text style={styles.title}>
                    {t("Update_download_in_progress")}
                  </Text>
                  <Text style={styles.subtitle}>
                    {Math.round(state.progress)}%
                  </Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${state.progress}%` }]}
                />
              </View>
            </>
          )}

          {state.status === "ready" && (
            <View style={styles.row}>
              <View style={styles.textContainer}>
                <RotateCcw size={20} color={theme.success} />
                <View style={styles.textContent}>
                  <Text style={styles.title}>{t("Update_ready_title")}</Text>
                  <Text style={styles.subtitle}>
                    {t("Update_ready_subtitle")}
                  </Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.dismissButton]}
                  onPress={() => {
                    dismiss();
                  }}
                >
                  <X size={16} color={theme.textColor} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.reloadButton]}
                  onPress={handleReload}
                >
                  <RotateCcw size={16} color={theme.white} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {state.error && <Text style={styles.error}>{state.error}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => {
  return StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginVertical: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.isDark
        ? "rgba(59, 130, 246, 0.15)"
        : "rgba(59, 130, 246, 0.08)",
      borderWidth: 1,
      borderColor: theme.isDark
        ? "rgba(59, 130, 246, 0.3)"
        : "rgba(59, 130, 246, 0.2)",
    },
    containerReady: {
      backgroundColor: theme.isDark
        ? "rgba(34, 197, 94, 0.15)"
        : "rgba(34, 197, 94, 0.08)",
      borderColor: theme.isDark
        ? "rgba(34, 197, 94, 0.3)"
        : "rgba(34, 197, 94, 0.2)",
    },
    containerDownloading: {
      backgroundColor: theme.isDark
        ? "rgba(59, 130, 246, 0.15)"
        : "rgba(59, 130, 246, 0.08)",
      borderColor: theme.isDark
        ? "rgba(59, 130, 246, 0.3)"
        : "rgba(59, 130, 246, 0.2)",
    },
    content: {
      gap: 8,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
    },
    textContainer: {
      flexDirection: "row",
      gap: 12,
    },
    textContent: {},
    title: {
      fontSize: 14,
      fontFamily: fonts.bold,
      color: theme.textColor,
    },
    subtitle: {
      fontSize: 12,
      color: theme.subTextColor,
      marginTop: 2,
    },
    progressBar: {
      height: 6,
      backgroundColor: theme.isDark
        ? "rgba(59, 130, 246, 0.2)"
        : "rgba(59, 130, 246, 0.15)",
      borderRadius: 3,
      overflow: "hidden",
      marginTop: 4,
    },
    progressFill: {
      height: "100%",
      backgroundColor: theme.primary,
      borderRadius: 3,
    },
    actionButtons: {
      flexDirection: "row",
      gap: 8,
      marginLeft: 70,
      justifyContent: "flex-end",
    },
    button: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    dismissButton: {
      backgroundColor: theme.isDark
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(0, 0, 0, 0.05)",
    },
    reloadButton: {
      backgroundColor: theme.success,
    },
    error: {
      fontSize: 11,
      color: theme.danger,
      marginTop: 4,
    },
  });
};
