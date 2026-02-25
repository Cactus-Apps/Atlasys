import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { Slot } from "expo-router";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { AnimatedSplash } from "@/components/SplashScreen";

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

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppBootstrap />
    </AuthProvider>
  );
}

