require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const fetch = globalThis.fetch || require("node-fetch");

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.EXPO_PUBLIC_REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function run() {
  const { data: requests, error } = await supabase
    .from("delete_requests")
    .select("id,user_id")
    .lte("expires_at", new Date().toISOString())
    .neq("status", "deleted");

  if (error) {
    console.error("Fehler beim Laden der Requests:", error);
    return;
  }

  if (!requests || requests.length === 0) {
    console.log("Keine abgelaufenen Requests gefunden.");
    return;
  }

  for (const r of requests) {
    try {
      console.log("Verarbeite user:", r.user_id, "request:", r.id);

      const resp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${r.user_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          apiKey: SERVICE_ROLE_KEY ?? "",
          "Content-Type": "application/json",
        },
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error("Fehler beim Löschen des Auth-Users:", resp.status, text);
        await supabase
          .from("delete_requests")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", r.id);
        continue;
      }

      const { error: updErr } = await supabase
        .from("delete_requests")
        .update({ status: "deleted", updated_at: new Date().toISOString() })
        .eq("id", r.id);

      if (updErr) {
        console.error("Fehler beim Aktualisieren des Requests:", updErr);
      } else {
        console.log("Erfolgreich gelöscht und Request aktualisiert:", r.id);
      }
    } catch (e) {
      console.error("Unhandled error for request", r.id, e);
    }
  }
}

run().catch((e) => {
  console.error("Script-Fehler:", e);
  process.exit(1);
});
