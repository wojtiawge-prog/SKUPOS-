// SkupOS — testy end-to-end (Playwright). Uruchom: npm run build && npm test
// Lokalnie z własną przeglądarką: PW_CHROME=/ścieżka/do/chrome npm test
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const URL = "file://" + path.join(root, "index.html");
let failed = 0, passed = 0;
const ok = (name, cond, info = "") => { if (cond) { passed++; console.log("  ✓", name); } else { failed++; console.log("  ✗", name, info); } };

const browser = await chromium.launch(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {});
async function fresh(role) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.route(/fonts\.g|supabase\.co|anthropic/, (r) => r.abort());
  await p.goto(URL); await p.waitForTimeout(1500);
  await p.getByText("Załaduj dane pokazowe").click(); await p.waitForTimeout(1200);
  if (role) {
    await p.evaluate((role) => { const u = JSON.parse(localStorage.getItem("sk_users_v2")); u.push({ id: "u_t", login: role, pass: "x", name: "Test " + role, role }); localStorage.setItem("sk_users_v2", JSON.stringify(u)); localStorage.setItem("sk_session_v2", JSON.stringify("u_t")); }, role);
    await p.reload(); await p.waitForTimeout(1500);
  }
  return { ctx, p, errs };
}
const txCount = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("sk_tx_v2") || "[]").length);

console.log("SkupOS e2e");
{ // 1. Start, nawigacja, wszystkie ekrany Szefa bez błędów
  const { ctx, p, errs } = await fresh();
  const nav = await p.evaluate(() => [...document.querySelectorAll("nav button")].map((b) => b.innerText.trim()));
  ok("menu: Dziś, Ceny, Przyjęcie, Magazyn, Szef", JSON.stringify(nav) === JSON.stringify(["Dziś", "Ceny", "Przyjęcie", "Magazyn", "Szef"]), JSON.stringify(nav));
  ok("brak przycisku fałszywej wagi", !(await p.locator('[title="Odczyt z wagi"]').count()));
  ok("karta 'Ten miesiąc — ile zarabiam'", await p.getByText("Ten miesiąc — ile zarabiam").isVisible());
  for (const it of ["Przyjęcia", "Wynik", "Papiery i podatki", "Zadania", "Zgłoszenia", "Eksport, kopia, dziennik", "Podpowiedzi", "Doradca AI"]) {
    await p.locator("nav button", { hasText: "Szef" }).click(); await p.waitForTimeout(300);
    await p.locator("button").filter({ hasText: new RegExp("^" + it + "$") }).last().click(); await p.waitForTimeout(500);
  }
  const W = await p.evaluate(() => document.documentElement.scrollWidth);
  ok("nic nie wychodzi poza ekran (390 px)", W <= 391, "szerokość " + W);
  ok("zero błędów JS na wszystkich ekranach", errs.length === 0, errs.join(" | "));
  await ctx.close();
}
{ // FPO: wydruk wg wzoru Dz.U. 2013 poz. 1607 — A4 (2 egz.) i 80 mm
  const { ctx, p, errs } = await fresh();
  await p.getByRole("button", { name: "Nowe przyjęcie" }).click(); await p.waitForTimeout(500);
  await p.getByPlaceholder("Imię").fill("Jan"); await p.getByPlaceholder("Nazwisko").fill("Kowalski");
  await p.getByPlaceholder("Adres zamieszkania (wymagany)").fill("ul. Polna 1, 00-001 Wieś");
  await p.getByPlaceholder("Nr dowodu").fill("ABC123456");
  await p.locator("button").filter({ hasText: /Dodaj pozycję z cennika/ }).click(); await p.waitForTimeout(400);
  await p.locator("button").filter({ hasText: /\d zł$/ }).first().click(); await p.waitForTimeout(300);
  await p.locator("input[type=number]").first().fill("12.5");
  await p.getByRole("button", { name: "Własne gospodarstwo domowe" }).click();
  await p.getByRole("button", { name: "Rury i rynny" }).click();
  await p.evaluate(() => [...document.querySelectorAll("input[type=checkbox]")].forEach((x) => { if (!x.checked) x.click(); }));
  await p.locator("button").filter({ hasText: /Zapisz i wystaw|wypłać/ }).last().click(); await p.waitForTimeout(1200);
  const a4 = await p.locator(".fpo-a4 .fpo-egz").count(), w80 = await p.locator(".fpo-80 .fpo-egz").count();
  ok("FPO: po 2 egzemplarze A4 i 80 mm", a4 === 2 && w80 === 2, a4 + "/" + w80);
  const txt = await p.locator(".fpo-a4 .fpo-egz").first().textContent();
  ok("FPO: pola wzoru (masa w Mg, produkt, oświadczenie, uwagi, podpisy)", ["Masa odpadów [Mg]", "0,013", "Rury i rynny", "nie pochodzą z kradzieży", "4. Uwagi", "Data i podpis przyjmującego odpady", "ABC123456"].every((t) => txt.includes(t)), txt.slice(0, 200));
  await p.emulateMedia({ media: "print" });
  await p.evaluate(() => document.body.setAttribute("data-druk", "a4"));
  await p.pdf({ path: "/tmp/fpo_a4.pdf", format: "A4" });
  await p.evaluate(() => document.body.setAttribute("data-druk", "80"));
  await p.pdf({ path: "/tmp/fpo_80.pdf", preferCSSPageSize: true });
  ok("FPO: brak błędów JS", errs.length === 0, errs.join(" | "));
  await ctx.close();
}
{ // 2. Przyjęcie od stałego klienta + numer + dziennik
  const { ctx, p, errs } = await fresh();
  const n0 = await txCount(p);
  await p.getByRole("button", { name: "Nowe przyjęcie" }).click(); await p.waitForTimeout(500);
  await p.getByRole("button", { name: "Firma" }).click();
  await p.getByPlaceholder("np. SK 12345").fill("WZ 4521A"); await p.waitForTimeout(300);
  const staly = await p.getByText("Stały klient").isVisible().catch(() => false);
  ok("rozpoznanie stałego klienta po tablicy", staly);
  if (staly) { await p.getByText("Stały klient").click(); await p.waitForTimeout(300); }
  // dane pokazowe są losowe: stały klient może być osobą fizyczną (FPO) — wtedy wymagane źródło pochodzenia
  const zr = p.getByRole("button", { name: "Własne gospodarstwo domowe" });
  if (await zr.count()) await zr.click();
  const ins = p.locator("input[type=number]"); const k = await ins.count();
  for (let i = 0; i < k; i += 2) await ins.nth(i).fill("150");
  await p.evaluate(() => [...document.querySelectorAll("input[type=checkbox]")].forEach((x) => { if (!x.checked) x.click(); }));
  await p.locator("button").filter({ hasText: /Zapisz i wystaw|wypłać/ }).last().click(); await p.waitForTimeout(1500);
  const n1 = await txCount(p);
  ok("przyjęcie zapisane", n1 === n0 + 1, n1 === n0 ? await p.evaluate(() => (document.body.innerText.match(/(Dodaj co najmniej|Uzupełnij|Wskaż|Przekazujący musi)[^\n]*/) || [""])[0]) : "");
  const log = await p.evaluate(() => JSON.parse(localStorage.getItem("sk_audit_v1") || "[]"));
  ok("wpis w dzienniku zmian", log[0] && log[0].a === "Przyjęcie", JSON.stringify(log[0] || null));
  ok("zero błędów JS", errs.length === 0, errs.join(" | "));
  await ctx.close();
}
{ // 3. Eksport CSV i kopia
  const { ctx, p } = await fresh();
  await p.locator("nav button", { hasText: "Szef" }).click(); await p.waitForTimeout(300);
  await p.locator("button").filter({ hasText: /^Eksport, kopia, dziennik$/ }).last().click(); await p.waitForTimeout(500);
  const [d1] = await Promise.all([p.waitForEvent("download"), p.getByText("Przyjęcia (każda pozycja)").click()]);
  const csv = fs.readFileSync(await d1.path(), "utf8");
  ok("CSV: BOM + średniki + polskie znaki", csv.charCodeAt(0) === 0xfeff && csv.includes(";") && /Wartość zł/.test(csv));
  const [d2] = await Promise.all([p.waitForEvent("download"), p.getByText("Pobierz pełną kopię").click()]);
  const j = JSON.parse(fs.readFileSync(await d2.path(), "utf8"));
  ok("kopia zawiera dane i nie zawiera sesji", j.app === "SkupOS" && j.data.sk_tx_v2 && !j.data.sk_session_v2);
  await ctx.close();
}
{ // 4. Role
  const { ctx, p } = await fresh("pracownik");
  const nav = await p.evaluate(() => [...document.querySelectorAll("nav button")].map((b) => b.innerText.trim()));
  ok("pracownik ma przycisk Przyjęcie", nav.includes("Przyjęcie"), JSON.stringify(nav));
  ok("pracownik nie widzi panelu Szef", !nav.includes("Szef"));
  await ctx.close();
  const k = await fresh("kierowca");
  ok("kierowca widzi swoje odbiory", await k.p.getByText("Twoje odbiory").isVisible());
  await k.ctx.close();
}
await browser.close();
console.log(`\n${passed} OK, ${failed} błędów`);
process.exit(failed ? 1 : 0);
