import { Redirect } from "expo-router";

export default function LegacyAuthIndex() {
  return <Redirect href="/auth" />;
}
