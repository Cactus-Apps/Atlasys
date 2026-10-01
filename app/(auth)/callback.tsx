import { useEffect } from "react";
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/(tabs)/mapscreen");
    });

    return () => data.subscription.unsubscribe();
  }, [router]);

  return <></>;
}
