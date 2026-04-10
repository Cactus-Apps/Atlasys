import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { Slot } from "expo-router";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { AnimatedSplash } from "@/components/SplashScreen";
import * as Sentry from "@sentry/react-native";
import * as ImagePicker from "expo-image-picker";
import { Text, TextInput } from "react-native";
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  useFonts as useDMSansFonts,
} from "@expo-google-fonts/dm-sans";
import {
  Syne_600SemiBold,
  Syne_700Bold,
  Syne_800ExtraBold,
  useFonts as useSyneFonts,
} from "@expo-google-fonts/syne";

const SENTRY_DSN_init = process.env.EXPO_PUBLIC_SENTRY_DSN_INIT;

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
  dsn: SENTRY_DSN_init,
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

SplashScreen.preventAutoHideAsync();

function AppBootstrap() {
  const { isLoadingUser } = useAuth();
  const [animationDone, setAnimationDone] = useState(false);
  const [dmSansLoaded] = useDMSansFonts({
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
  });
  const [syneLoaded] = useSyneFonts({
    Syne_600SemiBold,
    Syne_700Bold,
    Syne_800ExtraBold,
  });

  useEffect(() => {
    if (!dmSansLoaded || !syneLoaded) return;

    (Text as any).defaultProps = (Text as any).defaultProps || {};
    (Text as any).defaultProps.style = [
      { fontFamily: "DMSans_400Regular" },
      (Text as any).defaultProps.style,
    ];

    (TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
    (TextInput as any).defaultProps.style = [
      { fontFamily: "DMSans_400Regular" },
      (TextInput as any).defaultProps.style,
    ];
  }, [dmSansLoaded, syneLoaded]);

  useEffect(() => {
    if (!isLoadingUser && animationDone && dmSansLoaded && syneLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isLoadingUser, animationDone, dmSansLoaded, syneLoaded]);

  if (!dmSansLoaded || !syneLoaded) return null;

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
  return (
    <AuthProvider>
      <AppBootstrap />
    </AuthProvider>
  );
});
