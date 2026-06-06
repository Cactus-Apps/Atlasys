import { supabase } from "@/lib/auth/supabase";
import { useAuthStore } from "@/lib/storage/zustand";
import * as Sentry from "@sentry/react-native";

export interface DeleteRequest {
  id: string;
  user_id: string;
  email: string;
  status: "pending" | "completed" | null;
  requested_at: string;
  updated_at: string;
  expires_at?: string;
  verification_code?: string;
  push_token?: string;
}

export async function checkDeleteStatus(
  userId: string | null,
): Promise<DeleteRequest | null> {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("delete_requests")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["completed", "deleted"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as DeleteRequest;
}

export async function revokeGoogleToken() {
  try {
    const { data } = await supabase.auth.getSession();
    const provider = data.session?.user.app_metadata.provider;
    const token = data.session?.provider_token;
    if (token && provider === "google") {
      await fetch(
        `https://accounts.google.com/o/oauth2/revoke?token=${token}`,
        { method: "POST" },
      ).then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Token revocation failed: ${errorText}`);
        }
      });
    }
  } catch (err) {
    Sentry.captureException(err);
  }
}

export async function clearAllUserData(signOut: () => Promise<void>) {
  // Attempt all cleanup steps independently
  try {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      await supabase.auth.updateUser({
        data: { saved_places: [], settings: {} },
      });
    }
  } catch (err) {
    Sentry.captureException(err);
  }
  try {
    await signOut();
  } catch (err) {
    Sentry.captureException(err);
  }

  try {
    useAuthStore.getState().clearStore({ preserveOnboarding: true });
  } catch (err) {
    Sentry.captureException(err);
  }
}
