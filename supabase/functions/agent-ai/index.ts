// SkupOS — funkcja AI (Edge Function). P0: tylko zalogowany personel, limit dzienny, klucz tylko na serwerze.
// Sekrety (Supabase → Edge Functions → Secrets): ANTHROPIC_API_KEY, opcjonalnie ANTHROPIC_MODEL, AI_DAILY_LIMIT.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: { message: "Tylko POST" } }, 405);

  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: { message: "Zaloguj się, aby korzystać z AI." } }, 401);

  // klient z tokenem UŻYTKOWNIKA — RLS i funkcje działają w jego imieniu
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: u, error: ue } = await sb.auth.getUser();
  if (ue || !u?.user) return json({ error: { message: "Sesja wygasła — zaloguj się ponownie." } }, 401);

  const limit = Number(Deno.env.get("AI_DAILY_LIMIT") || 60);
  const { data: ok, error: le } = await sb.rpc("ai_zuzyj", { p_limit: limit });
  if (le) return json({ error: { message: "Błąd sprawdzania limitu AI." } }, 500);
  if (!ok) return json({ error: { message: `Dzienny limit AI (${limit} zapytań) wykorzystany albo brak uprawnień.` } }, 429);

  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: { message: "Złe zapytanie" } }, 400); }
  const payload = {
    model: Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-5-5",
    max_tokens: Math.min(Number(body.max_tokens) || 1500, 2500),
    system: typeof body.system === "string" ? body.system.slice(0, 20000) : undefined,
    messages: Array.isArray(body.messages) ? body.messages.slice(-20) : [],
  };
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return new Response(await r.text(), { status: r.status, headers: { ...CORS, "Content-Type": "application/json" } });
});
