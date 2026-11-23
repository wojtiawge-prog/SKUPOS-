/* ════════════════════════════════════════════════════
   KONFIGURACJA — APLIKACJA WŁAŚCICIELA  (SkupOS)
   Jeden kod dla właściciela i klienta. Portal klienta: folder /klient/
   ════════════════════════════════════════════════════ */
window.SUPA = {
  url:  "https://ejqrzkvcwadvuwwdshso.supabase.co",
  anon: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqcXJ6a3Zjd2FkdnV3d2RzaHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjkxNDEsImV4cCI6MjA5Nzg0NTE0MX0.fSNbyHb3wQdhYIB2lqfUJrxSX9QVjCpWLYSrAtj8nmc"
};
window.APP_MODE = "owner";
// Adres portalu klienta (zaproszenia, kod QR) — liczony automatycznie, nic nie podmieniasz.
window.KLIENT_URL = new URL("klient/", location.href).href;
