import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/auth/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.replace("/(tabs)/mapscreen");
      }
    });

    // Fallback: falls Session schon da ist
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/(tabs)/mapscreen");
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );
}
