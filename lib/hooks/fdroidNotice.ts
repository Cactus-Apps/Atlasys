import AsyncStorage from "@react-native-async-storage/async-storage";

const FDROID_NOTICE_KEY = "fdroid_notice_shown";

export async function shouldShowFdroidNotice(): Promise<boolean> {
  const shown = await AsyncStorage.getItem(FDROID_NOTICE_KEY);
  return shown !== "1";
}

export async function markFdroidNoticeShown(): Promise<void> {
  await AsyncStorage.setItem(FDROID_NOTICE_KEY, "1");
}
