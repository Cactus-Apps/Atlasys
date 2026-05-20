import { useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/auth/supabase";
import { GoogleLogo } from "@/components/auth/OAuthProviderButtons";
import { useTranslation } from "react-i18next";

export default function AuthCallback() {
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.replace("/(tabs)/mapscreen");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/(tabs)/mapscreen");
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <GoogleLogo size={40} />
      <Text style={{ fontSize: 26, color: "#fff", gap: 16 }}>
        {t("Auth_callback_signing_in")}
      </Text>
    </View>
  );
}
