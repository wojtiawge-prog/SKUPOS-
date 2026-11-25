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
{ // 333: ważenie brutto / tara — netto liczy się samo i trafia do przyjęcia
  const { ctx, p, errs } = await fresh();
  await p.getByRole("button", { name: "Nowe przyjęcie" }).click(); await p.waitForTimeout(500);
  await p.getByPlaceholder("Imię").fill("Jan"); await p.getByPlaceholder("Nazwisko").fill("Nowak");
  await p.getByPlaceholder("Adres zamieszkania (wymagany)").fill("ul. Leśna 2, 00-001 Wieś");
  await p.getByPlaceholder("Nr dowodu").fill("ABC123456");
  await p.locator("button").filter({ hasText: /Dodaj pozycję z cennika/ }).click(); await p.waitForTimeout(400);
  await p.locator("button").filter({ hasText: /\d zł$/ }).first().click(); await p.waitForTimeout(300);
  await p.getByRole("button", { name: "brutto / tara" }).click(); await p.waitForTimeout(200);
  const ins = p.locator("input[type=number]"); // [cena, brutto, tara]
  await ins.nth(1).fill("3100"); await ins.nth(2).fill("1860"); await p.waitForTimeout(200);
  const netto = await p.getByText(/1\s?240 kg/).first().isVisible().catch(() => false);
  ok("brutto/tara: netto 1240 kg policzone", netto);
  await ins.nth(2).fill("3200"); await p.waitForTimeout(200);
  const warn = await p.getByText(/tara .* nie może być większa/).first().isVisible().catch(() => false);
  ok("brutto/tara: ostrzeżenie gdy tara > brutto", warn);
  await ins.nth(2).fill("1860");
  await p.getByRole("button", { name: "Własne gospodarstwo domowe" }).click();
  await p.evaluate(() => [...document.querySelectorAll("input[type=checkbox]")].forEach((x) => { if (!x.checked) x.click(); }));
  await p.locator("button").filter({ hasText: /Zapisz i wystaw|wypłać/ }).last().click(); await p.waitForTimeout(1200);
  const t = await p.evaluate(() => JSON.parse(localStorage.getItem("sk_tx_v2") || "[]")[0]);
  const q = t && t.pos && t.pos[0];
  ok("brutto/tara: zapis masa=netto + brutto i tara", q && q.w === 1240 && q.brutto === 3100 && q.tara === 1860, JSON.stringify(q || null));
  ok("brutto/tara: zero błędów JS", errs.length === 0, errs.join(" | "));
  await ctx.close();
}
{ // 333+: do odsprzedaży — zdjęcie, cena skupu, sprzedaż, zysk
  const { ctx, p, errs } = await fresh();
  await p.locator("nav button", { hasText: "Magazyn" }).click(); await p.waitForTimeout(400);
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
  await p.locator("input[type=file][aria-label='Zdjęcie przedmiotu']").setInputFiles({ name: "lampa.png", mimeType: "image/png", buffer: png }); await p.waitForTimeout(600);
  ok("odsprzedaż: pozycja dodana ze zdjęcia", await p.getByLabel("Cena skupu").isVisible().catch(() => false));
  await p.getByLabel("Nazwa przedmiotu").fill("Lampa naftowa mosiężna");
  await p.getByLabel("Cena skupu").fill("20");
  await p.getByRole("button", { name: "Sprzedane" }).click(); await p.waitForTimeout(200);
  await p.getByLabel("Cena sprzedaży").fill("150"); await p.waitForTimeout(300);
  const zysk = await p.getByText(/Zysk ze sprzedanych/).isVisible().catch(() => false) && await p.getByText(/130,00 zł/).first().isVisible().catch(() => false);
  ok("odsprzedaż: zysk 130 zł policzony", zysk);
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem("sk_resale_v1") || "[]")[0]);
  ok("odsprzedaż: zapis na urządzeniu", saved && saved.nazwa === "Lampa naftowa mosiężna" && saved.st === "sprzedane", JSON.stringify(saved && { n: saved.nazwa, st: saved.st }));
  ok("odsprzedaż: zero błędów JS", errs.length === 0, errs.join(" | "));
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
