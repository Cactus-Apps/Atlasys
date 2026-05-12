import { User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { router } from "expo-router";
import { useAuthStore } from "../storage/zustand";
import * as Sentry from "@sentry/react-native";
import * as WebBrowser from "expo-web-browser";
import { syncConsentToServer } from "@/app/onboarding";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { posthog } from "../config/posthog";
import { applyAnalyticsChoice } from "./analytics";

WebBrowser.maybeCompleteAuthSession();

type AuthContextType = {
  user: User | null;
  isLoadingUser: boolean;
  signUp: (
    email: string,
    password: string,
    options?: { captchaToken?: string },
  ) => Promise<string | null>;
  signIn: (
    email: string,
    password: string,
    options?: { captchaToken?: string },
  ) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);

  useEffect(() => {
    const loadUser = async () => {
      const timeout = setTimeout(() => {
        setIsLoadingUser(false);
      }, 10000);

      try {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user ?? null;
        setUser(sessionUser);
        if (sessionUser) {
          await syncStateFromMetadata(sessionUser);
        }
      } catch (err) {
        Sentry.captureException(err);
      } finally {
        clearTimeout(timeout);
        setIsLoadingUser(false);
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        const { clearStore } = useAuthStore.getState();
        if (currentUser) {
          await syncStateFromMetadata(currentUser);
        } else {
          clearStore({ preserveOnboarding: true });
        }
      },
    );

    loadUser();
    return () => listener.subscription.unsubscribe();
  }, []);

  const syncStateFromMetadata = async (targetUser: User) => {
    try {
      const {
        setSubscribed,
        setOnboardingCompleted,
        updateSettings,
        setUserId,
        settings,
      } = useAuthStore.getState();
      const metadata = targetUser.user_metadata || {};

      setUserId(targetUser.id);

      if (metadata.onboarding_completed !== undefined)
        setOnboardingCompleted(!!metadata.onboarding_completed);

      if (metadata.settings) {
        updateSettings({
          ...metadata.settings,
          // Gerätespezifische Settings nie vom Server überschreiben
          locationSharing: settings.locationSharing,
          analytics: settings.analytics,
        });
      }

      if (metadata.saved_places) {
        useAuthStore.setState({ savedPlaces: metadata.saved_places });
      }

      // Analytics-Modus anwenden – nach Settings-Sync damit der richtige Wert gelesen wird
      const analyticsChoice =
        useAuthStore.getState().settings.analytics ?? "none";
      applyAnalyticsChoice(analyticsChoice, targetUser.id);
    } catch (err) {
      Sentry.captureException(err);
    }
  };

  const syncStateToMetadata = async () => {
    if (!user) return;
    const { isSubscribed, isOnboardingCompleted, settings, savedPlaces } =
      useAuthStore.getState();
    try {
      await supabase.auth.updateUser({
        data: {
          is_subscribed: isSubscribed,
          onboarding_completed: isOnboardingCompleted,
          settings,
          saved_places: savedPlaces,
        },
      });
    } catch (err) {
      Sentry.captureException(err);
    }
  };

  useEffect(() => {
    if (!user) return;
    const unsub = useAuthStore.subscribe((state, prevState) => {
      if (
        JSON.stringify(state.savedPlaces) !==
          JSON.stringify(prevState.savedPlaces) ||
        state.isSubscribed !== prevState.isSubscribed ||
        state.isOnboardingCompleted !== prevState.isOnboardingCompleted
      ) {
        const timer = setTimeout(syncStateToMetadata, 3000);
        return () => clearTimeout(timer);
      }
    });
    return () => unsub();
  }, [user?.id]);

  // ── getUser: nach Login aufgerufen, einmalig ──────────────────────────────
  const getUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      setUser(data.user ?? null);

      if (data.user?.id) {
        await syncConsentToServer(data.user.id, supabase);
      }
      if (data.user) {
        // Analytics-Event einmalig hier – egal ob Email oder Google
        posthog.capture("user_signed_in", {
          method: data.user.app_metadata?.provider ?? "email",
        });
        router.replace("/(tabs)/mapscreen");
      }
    } catch (err) {
      Sentry.captureException(err);
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  // ── signUp ────────────────────────────────────────────────────────────────
  const signUp = async (
    email: string,
    password: string,
    options?: { captchaToken?: string },
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { captchaToken: options?.captchaToken },
      });
      if (error) throw error;

      if (data.session) {
        setUser(data.session.user);
        posthog.capture("user_signed_up", { method: "email" });
        return null;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginError) {
        if (loginError.message.includes("Email not confirmed")) {
          return "Bitte bestätige deine E-Mail-Adresse.";
        }
        throw loginError;
      }

      posthog.capture("user_signed_up", { method: "email" });
      await getUser();
      return null;
    } catch (err: any) {
      Sentry.captureException(err);
      return err.message || "Fehler bei der Registrierung";
    }
  };

  const signIn = async (
    email: string,
    password: string,
    options?: { captchaToken?: string },
  ) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken: options?.captchaToken },
      });
      if (error) throw error;
      await getUser();
      return null;
    } catch (err: any) {
      Sentry.captureException(err);
      return err.message || "Fehler beim Login";
    }
  };

  const signInWithGoogle = async (): Promise<string | null> => {
    try {
      const redirectTo =
        Platform.OS === "web"
          ? `${globalThis.location?.origin ?? "http://localhost:8081"}/callback`
          : Linking.createURL("callback");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: Platform.OS !== "web",
        },
      });

      if (error) throw error;
      if (!data.url) return "Keine OAuth URL erhalten";

      if (Platform.OS === "web") {
        globalThis.location?.assign(data.url);
        return null;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
        { showInRecents: false },
      );

      if (result.type === "dismiss" || result.type === "cancel") {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          await getUser();
          return null;
        }
        return null;
      }

      if (result.type !== "success" || !result.url) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          await getUser();
          return null;
        }
        return "Anmeldung nicht abgeschlossen";
      }

      try {
        const url = new URL(result.url);
        const code = url.searchParams.get("code");

        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session) {
              await getUser();
              return null;
            }
            throw exchangeError;
          }
        } else {
          const hash = url.hash?.replace(/^#/, "");
          if (hash) {
            const params = new URLSearchParams(hash);
            const access_token = params.get("access_token");
            const refresh_token = params.get("refresh_token");
            if (access_token && refresh_token) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
              if (sessionError) throw sessionError;
            }
          }
        }
      } catch (err) {
        const { data: sessionData } = await supabase.auth.getSession();
        Sentry.captureException(err);
        if (sessionData.session) {
          await getUser();
          return null;
        }
      }

      await getUser();
      return null;
    } catch (err: any) {
      Sentry.captureException(err);
      return err.message ?? "Google-Anmeldung fehlgeschlagen";
    }
  };

  const signOut = async () => {
    try {
      posthog.capture("user_signed_out");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      router.replace("/auth");
    } catch (err) {
      Sentry.captureException(err);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoadingUser, signUp, signIn, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be inside off <AuthProvider>");
  }
  return context;
}
