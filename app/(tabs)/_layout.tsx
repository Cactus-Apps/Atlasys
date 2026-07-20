import { TabBars } from "@/components/tab-bars";
import { TabBarNative } from "@/components/tab-bars/TabBarNative";
import { Tabs } from "expo-router";
import { useAuthStore } from "@/lib/storage/zustand";
import React, { useEffect, useRef, useState } from "react";
import { fetchUnseen, Announcement } from "@/lib/hooks/announcements";
import AnnouncementModal from "@/components/sheets_modal/AnnouncementModal";
import DeleteRequestModal from "@/components/sheets_modal/DeleteRequestModal";
import UpdateScreen from "@/components/sheets_modal/UpdateScreen";
import { fetchCurrentVersion } from "@/lib/hooks/useUpdateInfo";
import SurveyModal from "@/components/sheets_modal/SurveyModal";
import GitHubStarModal from "@/components/sheets_modal/GitHubStarModal";
import FeedbackModal from "@/components/sheets_modal/FeedbackModal";
import { supabase } from "@/lib/auth/supabase";
import { useAuth } from "@/lib/auth/auth-context";
import {
  checkDeleteStatus,
  clearAllUserData,
  revokeGoogleToken,
  DeleteRequest,
} from "@/lib/hooks/deleteAccount";
import { useAppTheme } from "@/lib/theme";
import { useTranslation } from "react-i18next";
import { fetchActiveSurvey, Survey } from "@/lib/hooks/surveys";
import {
  shouldShowGitHubStar,
  markGitHubStarShown,
  shouldShowFeedback,
  markFeedbackShown,
} from "@/lib/hooks/coldStartModals";

type ColdStartModal = "survey" | "github" | "feedback" | null;

export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const tabTheme = useAuthStore((s) => s.settings.tabTheme) ?? "modern";
  const { signOut, user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [deleteReq, setDeleteReq] = useState<DeleteRequest | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateScreen, setShowUpdateScreen] = useState(false);
  const [updateVersion, setUpdateVersion] = useState("");
  const deletingRef = useRef(false);

  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [coldStartModal, setColdStartModal] = useState<ColdStartModal>(null);

  useEffect(() => {
    fetchUnseen().then(setAnnouncements);
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const checkForUpdate = async () => {
      const lastSeen = useAuthStore.getState().lastSeenUpdateVersion;
      const dbVersion = await fetchCurrentVersion();
      if (dbVersion && dbVersion !== lastSeen) {
        setUpdateVersion(dbVersion);
        queueMicrotask(() => setShowUpdateScreen(true));
      }
    };

    checkForUpdate();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const evaluateColdStartModal = async () => {
      const survey = await fetchActiveSurvey(user.id);
      if (survey) {
        setActiveSurvey(survey);
        setColdStartModal("survey");
        return;
      }

      if (await shouldShowGitHubStar()) {
        setColdStartModal("github");
        return;
      }

      if (await shouldShowFeedback()) {
        setColdStartModal("feedback");
      }
    };

    evaluateColdStartModal();
  }, [user?.id]);

  const handleColdStartModalClose = async () => {
    if (coldStartModal === "github") {
      await markGitHubStarShown();
    } else if (coldStartModal === "feedback") {
      await markFeedbackShown();
    }
    setColdStartModal(null);
    setActiveSurvey(null);
  };

  useEffect(() => {
    if (!user?.id) return;

    const check = async () => {
      const req = await checkDeleteStatus(user.id);
      if (req) {
        setDeleteReq(req);
        setShowDeleteModal(true);
      }
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`delete-requests-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*" as const,
          schema: "public",
          table: "delete_requests",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const data = payload.new as DeleteRequest;
          if (data.status && ["completed", "deleted"].includes(data.status)) {
            setDeleteReq(data);
            setShowDeleteModal(true);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const themeKey = `${theme.bg}|${theme.accentColor}|${theme.subTextColor}|${theme.borderColor}|${theme.theme}|${tabTheme}`;

  const handleDeleteClose = async () => {
    if (deletingRef.current) return;
    deletingRef.current = true;
    setShowDeleteModal(false);
    await revokeGoogleToken();
    await clearAllUserData(signOut);
  };

  return (
    <>
      {tabTheme === "native" ? (
        <TabBarNative theme={theme} />
      ) : (
        <TabBars key={themeKey} tabTheme={tabTheme} theme={theme}>
          <Tabs.Screen name="mapscreen" options={{ title: t("Tab_map") }} />
          <Tabs.Screen name="saved" options={{ title: t("Tab_saved") }} />
          <Tabs.Screen
            name="profilescreen"
            options={{ title: t("Tab_profile") }}
          />
        </TabBars>
      )}
      <AnnouncementModal
        announcements={announcements}
        onClose={() => setAnnouncements([])}
      />
      <DeleteRequestModal
        visible={showDeleteModal}
        status={deleteReq?.status ?? null}
        onClose={handleDeleteClose}
      />
      <UpdateScreen
        visible={showUpdateScreen}
        version={updateVersion}
        onClose={() => {
          if (updateVersion) {
            useAuthStore
              .getState()
              .setLastSeenUpdateVersion(updateVersion);
          }
          setShowUpdateScreen(false);
          setUpdateVersion("");
        }}
      />
      <SurveyModal
        visible={coldStartModal === "survey"}
        survey={activeSurvey}
        onClose={handleColdStartModalClose}
      />
      <GitHubStarModal
        visible={coldStartModal === "github"}
        onClose={handleColdStartModalClose}
      />
      <FeedbackModal
        visible={coldStartModal === "feedback"}
        onClose={handleColdStartModalClose}
      />
    </>
  );
}
