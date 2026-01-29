// Version 1.3.6 - © Cactus Apps 2025
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { Slot, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { useColorScheme } from "react-native";

function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoadingUser } = useAuth();
  const segments = useSegments();
  const redirecting = React.useRef(false);

  useEffect(() => {
    if (isLoadingUser || redirecting.current) return;

    redirecting.current = true;
    const inAuthGroup = segments[0] === "auth";

    if (!user && !inAuthGroup) {
      router.replace("/auth");
    } else if (user && inAuthGroup) {
      router.replace("/");
    }

    const t = setTimeout(() => (redirecting.current = false), 100);
    return () => clearTimeout(t);
  }, [user, segments, isLoadingUser, router]);

  if (isLoadingUser) return null;
  return <>{children}</>;
}


export default function RootLayout() {
  return (
    <AuthProvider>
      <RouteGuard>
        <Slot />
      </RouteGuard>
    </AuthProvider>
  );
}
