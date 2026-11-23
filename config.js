/* ════════════════════════════════════════════════════
   KONFIGURACJA — APLIKACJA WŁAŚCICIELA  (SkupOS)
   Baza: SKUPOS-prod (Frankfurt). Klucz poniżej jest PUBLICZNY z założenia
   (anon/publishable) — dane chroni RLS w bazie. Klucza service_role NIGDY tu nie wpisujemy.
   ════════════════════════════════════════════════════ */
window.SUPA = {
  url:  "https://irwoybtcwclmdqihkkdg.supabase.co",
  anon: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlyd295YnRjd2NsbWRxaWhra2RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU0NDM5OTMsImV4cCI6MjExMTAxOTk5M30.EnUWczElzllxioFMGxk9FxVNiM3d0FWpGn-SP7yw_Jc"
};
// Tryb pracy:
//   domyślnie „local” — podgląd z danymi pokazowymi, bez logowania (nic nie idzie do bazy),
//   ?tryb=chmura — logowanie i prawdziwa baza (zapamiętywane na tym urządzeniu),
//   ?tryb=podglad — powrót do podglądu.
// Po „wdrażamy” domyślnym trybem zostanie chmura.
(function () {
  var t = null;
  try { t = new URLSearchParams(location.search).get("tryb"); } catch (e) {}
  try {
    var prev = localStorage.getItem("sk_tryb") || "podglad";
    if ((t === "chmura" || t === "podglad") && t !== prev) {
      // zmiana trybu = czysta karta: dane pokazowe nie trafią do prawdziwej firmy, a prawdziwe nie zostają w podglądzie
      var keep = { sk_theme: 1, sk_big: 1 };
      Object.keys(localStorage).forEach(function (k) { if (k.indexOf("sk_") === 0 && !keep[k]) localStorage.removeItem(k); });
      localStorage.setItem("sk_tryb", t);
    }
    t = localStorage.getItem("sk_tryb");
  } catch (e) {}
  window.APP_MODE = t === "chmura" ? "owner" : "local";
})();
// Dane w tabelach nowej bazy (cennik, przyjęcia, klienci, wydania), reszta w „ustawieniach”.
window.SKUPOS_DB = "tables";
// Adres portalu klienta (zaproszenia, kod QR) — liczony automatycznie.
window.KLIENT_URL = new URL("klient/", location.href.split("?")[0]).href;
