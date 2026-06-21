import { ensureTranslationsLoaded } from "./i18n";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { UpdateProvider } from "@/lib/hooks/update-context";
import { useAuthStore } from "@/lib/storage/zustand";
import { runExpoUpdateCheck } from "@/lib/hooks/expoUpdateCheck";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useRef, useState } from "react";
import AnimatedSplash from "@/components/overlays/SplashScreen";
import * as Sentry from "@sentry/react-native";
import type { ErrorEvent, EventHint } from "@sentry/core";
import * as ImagePicker from "expo-image-picker";
import { AppState, View, useColorScheme } from "react-native";
import { setupMapLibreLogger } from "@/lib/logs/mapLogger";
import { PostHogProvider } from "posthog-react-native";
import { posthog } from "@/lib/config/posthog";
import { StatusBar } from "expo-status-bar";

const SENTRY_DSN_init = process.env.EXPO_PUBLIC_SENTRY_DSN_INIT;

function sentryBeforeSend(
  event: ErrorEvent,
  _hint: EventHint,
): ErrorEvent | null {
  try {
    const { useAuthStore: store } = require("@/lib/storage/zustand");
    if (store.getState().settings.crashReports === false) {
      return null;
    }
  } catch (err) {
    Sentry.captureException(err);
  }
  const message = event.exception?.values?.[0]?.value ?? "";
  const ignoredNetworkErrors = [
    "tiles.openfreemap.org",
    "overpass-api.de",
    "kumi.systems",
    "nominatim.openstreetmap.org",
    "routing.openstreetmap.de",
    "Failed to check for update",
    "doesn't exist or isn't a directory",
    "Location request failed due to unsatisfied device settings",
    "Network request failed",
    "expo-updates: Network request failed",
    "LocationModule",
    "RuntimeScheduler_Modern",
    "SIGSEGV",
    "timeout",
  ];

  if (ignoredNetworkErrors.some((e) => message.includes(e))) {
    return null;
  }

  return event;
}

const handleChooseImage = async (addScreenshot: (uri: string) => void) => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });

  if (result.canceled) {
  } else {
    const uri = result.assets[0].uri;
    addScreenshot(uri);
  }
};

Sentry.init({
  dsn: SENTRY_DSN_init,
  beforeSend: sentryBeforeSend,
  integrations: [
    Sentry.feedbackIntegration({
      enableScreenshot: true,
      isEmailRequired: true,
      shouldValidateEmail: true,
      onAddScreenshot: handleChooseImage,
      enableTakeScreenshot: true,
      styles: {
        submitButton: {
          backgroundColor: "#E24B4A",
        },
        container: {
          backgroundColor: "transparent",
          shadowColor: "transparent",
        },
      },
      screenshotButtonOptions: {
        triggerLabel: "Take Screenshot",
        styles: {
          triggerButton: {
            marginBottom: 75,
          },
        },
      },

      namePlaceholder: "Fullname",
    }),
  ],
  sendDefaultPii: true,
  enableLogs: true,
});

setupMapLibreLogger("error");

function TelemetrySync() {
  const autoUpdateCheck = useAuthStore(
    (s) => s.settings.autoUpdateCheck !== false,
  );

  useEffect(() => {
    if (!autoUpdateCheck) return;
    runExpoUpdateCheck();
    const onAppState = (state: string) => {
      if (state === "active") runExpoUpdateCheck();
    };
    const sub = AppState.addEventListener("change", onAppState);
    const sixHours = 6 * 60 * 60 * 1000;
    const interval = setInterval(runExpoUpdateCheck, sixHours);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [autoUpdateCheck]);

  return null;
}

function AppBootstrap() {
  const { isLoadingUser, user } = useAuth();
  const [animationDone, setAnimationDone] = useState(false);
  const splashHiddenRef = useRef(false);
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

    if (inLegalScreen) return;

    if (
      !isOnboardingCompleted &&
      !inOnboarding &&
      !inLegalScreen &&
      !inAuthGroup
    ) {
      router.replace("/onboarding");
      return;
    }

    if (isOnboardingCompleted && !user && !inAuthGroup) {
      router.replace("/auth");
      return;
    }

    if (isOnboardingCompleted && user && inAuthGroup) {
      router.replace("/(tabs)/mapscreen");
      return;
    }
  }, [storeReady, isLoadingUser, user, isOnboardingCompleted, segments]);

  const isReady = storeReady && !isLoadingUser && i18nGate;

  if (!isReady) {
    return <AnimatedSplash onFinish={() => setAnimationDone(true)} />;
  }

  return (
    <>
      <Slot />
      {!animationDone && (
        <AnimatedSplash onFinish={() => setAnimationDone(true)} />
      )}
    </>
  );
}

export default Sentry.wrap(function RooLayout() {
  const themeZustand = useAuthStore((s) => s.settings.theme);
  const isDarkTheme = ["chill", "dark", "midnight", "ocean"].includes(
    themeZustand,
  );
  const theme = isDarkTheme ? "light" : "dark";

  return (
    <PostHogProvider
      client={posthog}
      autocapture={{
        captureScreens: false,
        captureTouches: true,
        propsToCapture: ["testID"],
      }}
    >
      <UpdateProvider>
        <AuthProvider>
          <TelemetrySync />
          <StatusBar style={theme} />
          <AppBootstrap />
        </AuthProvider>
      </UpdateProvider>
    </PostHogProvider>
  );
});
