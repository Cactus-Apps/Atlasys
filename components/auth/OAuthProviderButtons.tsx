import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C43.94 37.08 46.98 31.38 46.98 24.55z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

type Props = {
  isDark: boolean;
  onGooglePress: () => void;
  googleLoading: boolean;
  /** z. B. während E-Mail-Login aktiv */
  disabled?: boolean;
};

export function OAuthProviderButtons({
  isDark,
  onGooglePress,
  googleLoading,
  disabled = false,
}: Props) {
  const busy = disabled || googleLoading;
  const googleBg = isDark ? "#131314" : "#FFFFFF";
  const googleBorder = isDark ? "#5F6368" : "#747775";
  const googleText = isDark ? "#E8EAED" : "#1F1F1F";

  return (
    <View style={styles.stack}>
      <TouchableOpacity
        style={[
          styles.pill,
          {
            backgroundColor: googleBg,
            borderColor: "transparent",
            elevation: 1,
          },
        ]}
        onPress={onGooglePress}
        disabled={busy}
        activeOpacity={0.85}
      >
        <View style={styles.leadingIcon}>
          {googleLoading ? (
            <ActivityIndicator color={googleText} />
          ) : (
            <GoogleLogo size={22} />
          )}
        </View>
        <Text style={[styles.label, { color: googleText }]}>
          {googleLoading ? "Signing in…" : "Sign in with Google"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    width: "100%",
    gap: 12,
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  leadingIcon: {
    position: "absolute",
    left: 18,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.15,
  },
});
