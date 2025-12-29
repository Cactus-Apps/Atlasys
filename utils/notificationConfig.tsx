import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { supabase } from "@/lib/supabase";

export const subscribeToNewRequests = () => {
  const channel = supabase
    .channel("delete-requests")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "delete_requests" },
      async (payload: any) => {
        console.log("New request:", payload.new);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "New deletion request",
            body: `From ${payload.new.email}`,
            sound: "default",
          },
          trigger: null,
        });
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
};

export async function registerForPushNotificationsAsync() {
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Notifications are disabled");
      return;
    }
  } else {
  }
}
