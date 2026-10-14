import { ensureTranslationsLoaded } from "./i18n";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { useAuthStore } from "@/lib/storage/zustand";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import AnimatedSplash from "@/components/overlays/SplashScreen";
import { useColorScheme } from "react-native";
import { setupMapLibreLogger } from "@/lib/logs/mapLogger";
import { StatusBar } from "expo-status-bar";
import { useAppFonts } from "@/lib/fonts";
import { SharingKillSwitchMonitor } from "@/components/overlays/SharingKillSwitchMonitor";
import { hasAcceptedCurrentConsent } from "@/lib/consent";

setupMapLibreLogger("error");

function AppBootstrap() {
  const { isLoadingUser, user } = useAuth();
  const [animationDone, setAnimationDone] = useState(false);
  const [fontsLoaded] = useAppFonts();
  const [i18nGate, setI18nGate] = useState(false);
  const [storeReady, setStoreReady] = useState(
    useAuthStore.persist.hasHydrated(),
  );
  const isOnboardingCompleted = useAuthStore((s) => s.isOnboardingCompleted);
  const segments = useSegments();
  const router = useRouter();
  const systemScheme = useColorScheme();
  const updateSettings = useAuthStore((s) => s.updateSettings);
  const currentTheme = useAuthStore((s) => s.settings.theme);
  const [routingReady, setRoutingReady] = useState(false);

  useEffect(() => {
    if (animationDone) return;
    const fallbackTimer = setTimeout(() => {
      setAnimationDone(true);
    }, 4000);

    return () => clearTimeout(fallbackTimer);
  }, [animationDone]);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      Promise.resolve().then(() => setStoreReady(true));
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      Promise.resolve().then(() => setStoreReady(true));
    });
    return unsub;
  }, []);

  useEffect(() => {
    let cancelled = false;
    ensureTranslationsLoaded().then(() => {
      if (!cancelled) setI18nGate(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!storeReady) return;

    if (currentTheme === "light" && systemScheme) {
      const autoTheme = systemScheme === "dark" ? "dark" : "light";
      updateSettings({ theme: autoTheme });
    }
  }, [storeReady, currentTheme, systemScheme, updateSettings]);

  useEffect(() => {
    if (!storeReady || isLoadingUser || !i18nGate) return;

    const inAuthGroup = segments[0] === "auth" || segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";
    const inLegalScreen = segments[0] === "(legal)";
    const inConsentScreen = segments[0] === "consent";

    if (inLegalScreen || inConsentScreen) {
      Promise.resolve().then(() => setRoutingReady(true));
      return;
    }

    let cancelled = false;

    (async () => {
      const consentAccepted = await hasAcceptedCurrentConsent();
      if (cancelled) return;

      if (!consentAccepted && isOnboardingCompleted) {
        router.replace("/consent");
        setRoutingReady(true);
        return;
      }

      if (!isOnboardingCompleted && !inOnboarding && !inAuthGroup) {
        router.replace("/onboarding");
        setRoutingReady(true);
        return;
      }

      if (isOnboardingCompleted && !user && !inAuthGroup) {
        router.replace("/auth");
        setRoutingReady(true);
        return;
      }

      if (isOnboardingCompleted && user && inAuthGroup) {
        router.replace("/(tabs)/mapscreen");
        setRoutingReady(true);
        return;
      }

      setRoutingReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    storeReady,
    isLoadingUser,
    user,
    isOnboardingCompleted,
    segments,
    i18nGate,
    router,
  ]);

  const isReady =
    storeReady && !isLoadingUser && i18nGate && fontsLoaded && routingReady;

  if (!isReady) {
    return <AnimatedSplash onFinish={() => setAnimationDone(true)} />;
  }

  return (
    <>
      <Slot />
      <SharingKillSwitchMonitor />
      {!animationDone && (
        <AnimatedSplash onFinish={() => setAnimationDone(true)} />
      )}
    </>
  );
}

export default function RooLayout() {
  const themeZustand = useAuthStore((s) => s.settings.theme);
  const isDarkTheme = ["chill", "dark", "midnight", "ocean"].includes(
    themeZustand,
  );
  const theme = isDarkTheme ? "light" : "dark";

  return (
    <AuthProvider>
      <StatusBar style={theme} />
      <AppBootstrap />
    </AuthProvider>
  );
}
