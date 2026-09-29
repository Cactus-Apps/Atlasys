import { useEffect, useRef } from "react";
import { Alert, AppState, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { useSharingStore } from "@/lib/sharing/state";
import { sharingManager } from "@/lib/sharing/channel";
import { killSwitchText, SUPPORT_EMAIL } from "@/lib/sharing/killSwitch";

/**
 * Mounted once at the app root. Loads the share session, passively enforces
 * the remote kill switch (only fetches while a share is active) and shows a
 * one-time alert when a running share is force-stopped by the admin.
 */
export function SharingKillSwitchMonitor() {
  const { t } = useTranslation();
  const reason = useSharingStore((s) => s.disabledReason);
  const message = useSharingStore((s) => s.disabledMessage);
  const killed = useSharingStore((s) => s.killedWhileActive);
  const shownRef = useRef(false);

  useEffect(() => {
    void sharingManager.bootstrap();
    const stopPolling = sharingManager.startKillSwitchPolling();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void sharingManager.refreshKillSwitch();
    });
    return () => {
      stopPolling();
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (!killed || shownRef.current) return;
    shownRef.current = true;
    useSharingStore.getState().setKilledWhileActive(false);
    Alert.alert(
      t("Sharing_disabled_title"),
      killSwitchText(t, reason ?? "safety", message),
      [
        {
          text: t("Sharing_support_contact"),
          onPress: () => {
            void Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
          },
        },
        {
          text: t("Common_ok"),
          style: "cancel",
          onPress: () => {
            shownRef.current = false;
          },
        },
      ],
    );
  }, [killed, reason, message, t]);

  return null;
}
