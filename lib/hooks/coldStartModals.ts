import AsyncStorage from "@react-native-async-storage/async-storage";

const COLD_START_COUNT_KEY = "cold_start_count";
const FIRST_INSTALL_KEY = "first_install_date";
const GITHUB_STAR_KEY = "last_github_star_shown";
const FEEDBACK_KEY = "last_feedback_shown";
const ANY_RANDOM_MODAL_KEY = "last_random_modal_shown";

const MIN_COLD_STARTS = 5;
const MIN_DAYS_SINCE_INSTALL = 3;

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function incrementColdStartCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(COLD_START_COUNT_KEY);
  const count = raw ? parseInt(raw, 10) || 0 : 0;
  const next = count + 1;
  await AsyncStorage.setItem(COLD_START_COUNT_KEY, String(next));
  return next;
}

async function getDaysSinceInstall(): Promise<number> {
  const raw = await AsyncStorage.getItem(FIRST_INSTALL_KEY);
  if (!raw) {
    await AsyncStorage.setItem(FIRST_INSTALL_KEY, Date.now().toString());
    return 0;
  }
  const firstInstall = parseInt(raw, 10);
  if (isNaN(firstInstall)) {
    await AsyncStorage.setItem(FIRST_INSTALL_KEY, Date.now().toString());
    return 0;
  }
  const diffMs = Date.now() - firstInstall;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

async function meetsUsageThreshold(): Promise<boolean> {
  const count = await incrementColdStartCount();
  if (count < MIN_COLD_STARTS) return false;

  const days = await getDaysSinceInstall();
  return days >= MIN_DAYS_SINCE_INSTALL;
}

async function wasShownThisMonth(key: string): Promise<boolean> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return false;
  return raw === currentMonth();
}

async function markShownThisMonth(key: string): Promise<void> {
  await AsyncStorage.setItem(key, currentMonth());
}

export async function shouldShowGitHubStar(): Promise<boolean> {
  if (!(await meetsUsageThreshold())) return false;
  if (await wasShownThisMonth(ANY_RANDOM_MODAL_KEY)) return false;
  return Math.random() < 0.3;
}

export async function markGitHubStarShown(): Promise<void> {
  await markShownThisMonth(GITHUB_STAR_KEY);
  await markShownThisMonth(ANY_RANDOM_MODAL_KEY);
}

export async function shouldShowFeedback(): Promise<boolean> {
  if (!(await meetsUsageThreshold())) return false;
  if (await wasShownThisMonth(ANY_RANDOM_MODAL_KEY)) return false;
  return Math.random() < 0.15;
}

export async function markFeedbackShown(): Promise<void> {
  await markShownThisMonth(FEEDBACK_KEY);
  await markShownThisMonth(ANY_RANDOM_MODAL_KEY);
}
