import { ReactNode, useEffect } from "react";
import { useRouter } from "expo-router";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { useAuthStore } from "@/lib/storage/zustand";

export default function AuthPaywallGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isSubscribed = useAuthStore((s) => s.isSubscribed);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/auth");
    } else if (!isSubscribed) {
      router.replace("/paywall");
    }
  }, [user, isSubscribed]);

  if (!user || !isSubscribed) return null;

  return <>{children}</>;
}
