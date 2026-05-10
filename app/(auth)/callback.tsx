import { useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/auth/supabase";
import { GoogleLogo } from "@/components/auth/OAuthProviderButtons";

export default function AuthCallback() {
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
        Signing in with Google
      </Text>
    </View>
  );
}
