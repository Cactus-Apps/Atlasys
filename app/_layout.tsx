import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { Slot } from "expo-router";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { AnimatedSplash } from "@/components/SplashScreen";
import * as Sentry from "@sentry/react-native";
import * as ImagePicker from "expo-image-picker";

const SENTRY_DNS_init = process.env.EXPO_PUBLIC_SENTRY_DNS_INIT!;

const handleChooseImage = async (addScreenshot: (uri: string) => void) => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });

  if (result.canceled) {
    console.log("User canceled image choice.");
  } else {
    const uri = result.assets[0].uri;
    addScreenshot(uri);
  }
};

Sentry.init({
  dsn: SENTRY_DNS_init,
  integrations: [
    Sentry.feedbackIntegration({
      styles: {
        submitButton: {
          backgroundColor: "#466483ff",
          borderRadius: 10,
        },
      },
      enableScreenshot: true,
      onAddScreenshot: handleChooseImage,
      enableTakeScreenshot: true,
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

SplashScreen.preventAutoHideAsync();

function AppBootstrap() {
  const { isLoadingUser } = useAuth();
  const [animationDone, setAnimationDone] = useState(false);

  useEffect(() => {
    if (!isLoadingUser && animationDone) {
      SplashScreen.hideAsync();
    }
  }, [isLoadingUser, animationDone]);

  return (
    <>
      <Slot />
      {!animationDone && (
        <AnimatedSplash onFinish={() => setAnimationDone(true)} />
      )}
    </>
  );
}

export default Sentry.wrap(function RootLayout() {
  return (
    <AuthProvider>
      <AppBootstrap />
    </AuthProvider>
  );
});
