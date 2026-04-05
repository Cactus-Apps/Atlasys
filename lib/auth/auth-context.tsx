import { User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { router } from "expo-router";
import { useAuthStore } from "../storage/zustand";
import { initRevenueCat, checkPremiumStatus } from "./revenuecat";
import * as Sentry from "@sentry/react-native";

type AuthContextType = {
  user: User | null;
  isLoadingUser: boolean;
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
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
        console.warn("Auth initialization timed out.");
      }, 10000);

      try {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user ?? null;
        setUser(sessionUser);

        if (sessionUser) {
          await syncStateFromMetadata(sessionUser);
        }
      } catch (err) {
        console.error("Auth init error:", err);
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
          clearStore();
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
      } = useAuthStore.getState();
      const metadata = targetUser.user_metadata || {};

      setUserId(targetUser.id);
      await initRevenueCat(targetUser.id);

      const isPremium = await checkPremiumStatus();

      setSubscribed(isPremium || !!metadata.is_subscribed);
      if (metadata.onboarding_completed !== undefined)
        setOnboardingCompleted(!!metadata.onboarding_completed);
      if (metadata.settings) updateSettings(metadata.settings);

      if (metadata.saved_places) {
        useAuthStore.setState({ savedPlaces: metadata.saved_places });
      }
    } catch (err) {
      Sentry.captureException(err);
      console.error("Metadata sync error:", err);
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
      console.error("Error syncing to Supabase:", err);
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

  const getUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      setUser(data.user ?? null);
    } catch (err) {
      Sentry.captureException(err);
      console.log("Fehler beim Abrufen des Benutzers:", err);
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) throw error;

      if (data.session) {
        setUser(data.session.user);
        return null;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      await getUser();

      return null;
    } catch (err: any) {
      Sentry.captureException(err);
      return err.message || "Fehler bei der Registrierung";
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      await getUser();
      return null;
    } catch (err: any) {
      Sentry.captureException(err);
      return err.message || "Fehler beim Login";
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      router.replace("/auth");
      alert("Logout erfolgreich");
    } catch (err) {
      Sentry.captureException(err);
      console.error("Fehler beim Logout:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoadingUser, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be inside off <AuthProvider> ");
  }
  return context;
}
