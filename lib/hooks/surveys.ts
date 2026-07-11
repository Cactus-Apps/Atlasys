import { supabase } from "@/lib/auth/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";

export type SurveyQuestion = {
  id: string;
  survey_id: string;
  question: string;
  options: string[];
  sort_order: number;
};

export type Survey = {
  id: string;
  title: string;
  active: boolean;
  min_app_version: string | null;
  created_at: string;
  questions: SurveyQuestion[];
};

export type SubmitResult = { alreadyCompleted: boolean };

const COMPLETED_KEY = "completed_surveys";

function parseVersion(v: string): number[] {
  return v.split(".").map((part) => {
    const num = parseInt(part, 10);
    return isNaN(num) ? 0 : num;
  });
}

function meetsMinVersion(appVersion: string, minVersion: string): boolean {
  const app = parseVersion(appVersion);
  const min = parseVersion(minVersion);
  for (let i = 0; i < Math.max(app.length, min.length); i++) {
    const a = app[i] ?? 0;
    const m = min[i] ?? 0;
    if (a > m) return true;
    if (a < m) return false;
  }
  return true;
}

async function getCompletedSurveys(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(COMPLETED_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function hasUserResponded(surveyId: string, userId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from("survey_responses")
    .select("id", { count: "exact", head: true })
    .eq("survey_id", surveyId)
    .eq("user_id", userId);

  if (error) {
    console.warn("hasUserResponded check failed:", error.message);
    return false;
  }
  return (count ?? 0) > 0;
}

export async function fetchActiveSurvey(
  userId?: string | null,
): Promise<Survey | null> {
  const { data, error } = await supabase
    .from("surveys")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data?.length) return null;

  const survey = data[0];
  const appVersion = Application.nativeApplicationVersion ?? "0.0.0";

  if (survey.min_app_version && !meetsMinVersion(appVersion, survey.min_app_version)) {
    return null;
  }

  const completed = await getCompletedSurveys();
  if (completed.includes(survey.id)) return null;

  if (userId) {
    const serverAnswered = await hasUserResponded(survey.id, userId);
    if (serverAnswered) {
      await markSurveyCompleted(survey.id);
      return null;
    }
  }

  const { data: questions, error: qError } = await supabase
    .from("survey_questions")
    .select("*")
    .eq("survey_id", survey.id)
    .order("sort_order", { ascending: true });

  if (qError || !questions?.length) return null;

  return { ...survey, questions };
}

export async function markSurveyCompleted(surveyId: string): Promise<void> {
  const completed = await getCompletedSurveys();
  if (!completed.includes(surveyId)) {
    await AsyncStorage.setItem(COMPLETED_KEY, JSON.stringify([...completed, surveyId]));
  }
}

export async function submitSurveyResponses(
  surveyId: string,
  userId: string,
  responses: { questionId: string; answer: string; freeText?: string }[],
): Promise<SubmitResult> {
  const alreadyAnswered = await hasUserResponded(surveyId, userId);
  if (alreadyAnswered) {
    return { alreadyCompleted: true };
  }

  const rows = responses.map((r) => ({
    survey_id: surveyId,
    question_id: r.questionId,
    user_id: userId,
    answer: r.answer,
    free_text: r.freeText || null,
  }));

  const { error } = await supabase.from("survey_responses").insert(rows);
  if (error) {
    console.warn("Failed to submit survey responses:", error.message);
    if (error.code === "23505") {
      return { alreadyCompleted: true };
    }
  }

  return { alreadyCompleted: false };
}
