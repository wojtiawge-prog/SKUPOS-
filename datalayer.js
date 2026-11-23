// SkupOS — warstwa danych: aplikacja ↔ tabele Supabase (migracja 0001 + 0002).
// Włączana przełącznikiem window.SKUPOS_DB = "tables" (config.js). Bez przełącznika nic się nie zmienia.
// Aplikacja dalej pracuje na swoich kluczach (sk_mat_v2, sk_tx_v2, sk_disp_v2); ten moduł tłumaczy je na wiersze.

const r2 = (n) => Math.round((+n || 0) * 100) / 100;
const r1 = (n) => Math.round((+n || 0) * 10) / 10;

// ── klucz klienta: firma po NIP, osoba po numerze dowodu (fallback: nazwisko + adres) ──
export const klientKey = (t) => t.firma
  ? ((n) => n.length === 10 ? "F:" + n : "F:" + String(t.firma.nazwa || "").toUpperCase().trim())(String(t.firma.nip || "").replace(/\D/g, ""))
  : "O:" + String((t.osoba && (t.osoba.dowod || (t.osoba.nazwisko + "|" + t.osoba.adres))) || t.plate || "").toUpperCase().replace(/\s/g, "");

// ── aplikacja → wiersze ──
export const matToRow = (m, firma_id) => ({ firma_id, app_id: m.id, kod: m.code || null, nazwa: m.n, grupa: m.g || "FE", cena_skup: r2(m.buy), cena_sprzedaz: r2(m.sell), aktywny: m.active !== false });

export const klientToRow = (t, firma_id) => t.firma
  ? { firma_id, app_id: klientKey(t), typ: "firma", nazwa: t.firma.nazwa || "", nip: t.firma.nip || null, rejestracje: t.plate ? [t.plate] : [] }
  : { firma_id, app_id: klientKey(t), typ: "osoba", imie: (t.osoba || {}).imie || "", nazwisko: (t.osoba || {}).nazwisko || "", adres: (t.osoba || {}).adres || "", dowod_nr: (t.osoba || {}).dowod || null, rejestracje: t.plate ? [t.plate] : [] };

export const txToRows = (t, firma_id, klient_id, matIdByApp) => ({
  tx: { firma_id, app_id: t.id, nr: t.no || null, rodzaj: t.kind === "KPO" ? "KPO" : "FPO", klient_id, rejestracja: t.plate || null, platnosc: ["gotowka", "przelew", "blik"].includes(t.payment) ? t.payment : "gotowka", pochodzenie: t.zrodlo || null, produkt: t.produkt || null, uwagi: t.uwagi || null, oswiadczenie: !!(t.osw || t.kind === "KPO"), suma: r2((t.pos || []).reduce((a, p) => a + p.w * p.price, 0)), masa: r1((t.pos || []).reduce((a, p) => a + (+p.w || 0), 0)), created_at: new Date(t.ts).toISOString() },
  pozycje: (t.pos || []).filter((p) => +p.w > 0).map((p) => ({ firma_id, towar_id: matIdByApp[p.matId] || null, nazwa: p.n, masa: r1(p.w), cena: r2(p.price) })),
});

export const dispToRow = (d, firma_id, matIdByApp) => ({ firma_id, app_id: d.id, towar_id: matIdByApp[d.matId] || null, masa: r1(d.w), cena: d.price != null ? r2(d.price) : null, odbiorca: d.contractor || null, data: d.dateKey || new Date(d.ts).toISOString().slice(0, 10) });

// ── wiersze → aplikacja ──
export const rowToMat = (r) => ({ id: r.app_id || r.id, code: r.kod || undefined, n: r.nazwa, g: r.grupa, buy: +r.cena_skup, sell: +r.cena_sprzedaz, stock: 0, _dbId: r.id });
export const rowsToTx = (txRows, pozRows, klienci, appIdByMatId, grupaByMatId = {}) => {
  const byTx = {}; pozRows.forEach((p) => { (byTx[p.transakcja_id] = byTx[p.transakcja_id] || []).push(p); });
  const kl = {}; klienci.forEach((k) => { kl[k.id] = k; });
  return txRows.filter((t) => !t.anulowana).map((t) => {
    const k = kl[t.klient_id] || {};
    const base = { id: t.app_id || t.id, no: t.nr, ts: Date.parse(t.created_at), kind: t.rodzaj, payment: t.platnosc, plate: t.rejestracja || "", zrodlo: t.pochodzenie || "", _dbId: t.id,
      ...(t.produkt ? { produkt: t.produkt } : {}), ...(t.uwagi ? { uwagi: t.uwagi } : {}),
      pos: (byTx[t.id] || []).map((p) => ({ matId: appIdByMatId[p.towar_id] || p.towar_id, n: p.nazwa, g: grupaByMatId[p.towar_id] || "FE", w: +p.masa, price: +p.cena })) };
    if (t.rodzaj === "KPO") base.firma = { nazwa: k.nazwa || "", nip: k.nip || "" };
    else base.osoba = { imie: k.imie || "", nazwisko: k.nazwisko || "", adres: k.adres || "", dowod: k.dowod_nr || "" };
    return base;
  }).sort((a, b) => b.ts - a.ts);
};
export const rowToDisp = (r, appIdByMatId) => ({ id: r.app_id || r.id, matId: appIdByMatId[r.towar_id] || r.towar_id, w: +r.masa, price: r.cena != null ? +r.cena : undefined, contractor: r.odbiorca || "", dateKey: r.data, ts: Date.parse(r.created_at || r.data), _dbId: r.id });

// ── odczyt wszystkiego (stronicowany, bo PostgREST zwraca max 1000 wierszy naraz) ──
async function all(q) { const out = []; for (let from = 0; ; from += 1000) { const { data, error } = await q().range(from, from + 999); if (error) throw error; out.push(...data); if (data.length < 1000) return out; } }
export async function loadAll(sb) {
  const [cennik, klienci, tx, poz, wyd] = await Promise.all([
    all(() => sb.from("cennik").select("*").order("nazwa")),
    all(() => sb.from("klienci").select("*")),
    all(() => sb.from("transakcje").select("*").order("created_at", { ascending: false })),
    all(() => sb.from("pozycje").select("*")),
    all(() => sb.from("wydania").select("*")),
  ]);
  const appIdByMatId = {}, grupaByMatId = {}; cennik.forEach((c) => { appIdByMatId[c.id] = c.app_id || c.id; grupaByMatId[c.id] = c.grupa; });
  return { materials: cennik.filter((c) => c.aktywny !== false).map(rowToMat), tx: rowsToTx(tx, poz, klienci, appIdByMatId, grupaByMatId), dispatch: wyd.map((r) => rowToDisp(r, appIdByMatId)) };
}

// ── zdjęcie dowodu → prywatny Storage „dowody/<firma>/<przyjęcie>/…”, wpis w tabeli zdjecia ──
export async function zapiszZdjecie(sb, firma_id, transakcja_id, dataUrl) {
  const m = dataUrl.match(/^data:(image\/[\w.+-]+);base64,(.+)$/); if (!m) return;
  const bin = atob(m[2]); const buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  const ext = m[1] === "image/png" ? "png" : m[1] === "image/webp" ? "webp" : "jpg";
  const sciezka = `${firma_id}/${transakcja_id}/dowod.${ext}`;
  const { error } = await sb.storage.from("dowody").upload(sciezka, new Blob([buf], { type: m[1] }), { contentType: m[1], upsert: false }); if (error) throw error;
  const { error: e2 } = await sb.from("zdjecia").insert({ firma_id, transakcja_id, typ: "dowod", sciezka }); if (e2) throw e2;
}

// ── zapis: różnica między poprzednią a nową wartością klucza → tylko zmienione wiersze ──
async function matMap(sb) { const { data, error } = await sb.from("cennik").select("id,app_id"); if (error) throw error; const m = {}; data.forEach((r) => { if (r.app_id) m[r.app_id] = r.id; }); return m; }
async function klientId(sb, firma_id, t) {
  const row = klientToRow(t, firma_id);
  const { data, error } = await sb.from("klienci").upsert(row, { onConflict: "firma_id,app_id" }).select("id").single();
  if (error) throw error; return data.id;
}
export async function saveKey(sb, firma_id, key, next, prev) {
  next = next || []; prev = prev || [];
  const pIds = new Map(prev.map((x) => [x.id, x])), nIds = new Set(next.map((x) => x.id));
  if (key === "sk_mat_v2") {
    const changed = next.filter((m) => { const o = pIds.get(m.id); return !o || o.buy !== m.buy || o.sell !== m.sell || o.n !== m.n || o.g !== m.g; });
    if (changed.length) { const { error } = await sb.from("cennik").upsert(changed.map((m) => matToRow(m, firma_id)), { onConflict: "firma_id,app_id" }); if (error) throw error; }
    const gone = prev.filter((m) => !nIds.has(m.id));
    if (gone.length) { const { error } = await sb.from("cennik").update({ aktywny: false }).in("app_id", gone.map((m) => m.id)); if (error) throw error; }
    return;
  }
  if (key === "sk_tx_v2") {
    const mm = await matMap(sb);
    for (const t of next.filter((t) => !pIds.has(t.id))) {
      const kid = await klientId(sb, firma_id, t);
      const { tx, pozycje } = txToRows(t, firma_id, kid, mm);
      const { data, error } = await sb.from("transakcje").insert(tx).select("id,nr").single(); if (error) throw error;
      if (pozycje.length) { const { error: e2 } = await sb.from("pozycje").insert(pozycje.map((p) => ({ ...p, transakcja_id: data.id }))); if (e2) throw e2; }
      if (typeof t.photo === "string" && t.photo.startsWith("data:image/")) { try { await zapiszZdjecie(sb, firma_id, data.id, t.photo); } catch (e) { console.error("SkupOS zdjęcie dowodu:", e); } }
    }
    // usunięcie w aplikacji = anulowanie w bazie (przyjęć się nie kasuje)
    for (const t of prev.filter((t) => !nIds.has(t.id))) {
      const { error } = await sb.from("transakcje").update({ anulowana: true, anulowano_at: new Date().toISOString(), powod_anulowania: "Usunięto w aplikacji" }).eq("app_id", t.id); if (error) throw error;
    }
    return;
  }
  if (key === "sk_disp_v2") {
    const mm = await matMap(sb);
    const added = next.filter((d) => !pIds.has(d.id));
    if (added.length) { const { error } = await sb.from("wydania").insert(added.map((d) => dispToRow(d, firma_id, mm))); if (error) throw error; }
    const gone = prev.filter((d) => !nIds.has(d.id));
    if (gone.length) { const { error } = await sb.from("wydania").delete().in("app_id", gone.map((d) => d.id)); if (error) throw error; }
  }
}
export const TABLE_KEYS = ["sk_mat_v2", "sk_tx_v2", "sk_disp_v2"];

// ── import pliku kopii (Szef → Eksport → Pobierz pełną kopię) do nowej bazy ──
export async function importBackup(sb, firma_id, backup, onProgress = () => {}) {
  const get = (k) => { try { return JSON.parse(backup.data[k] || "null") || []; } catch (e) { return []; } };
  const mats = get("sk_mat_v2"), txs = get("sk_tx_v2").slice().sort((a, b) => a.ts - b.ts), disp = get("sk_disp_v2");
  onProgress(`Cennik: ${mats.length}`);
  if (mats.length) { const { error } = await sb.from("cennik").upsert(mats.map((m) => matToRow(m, firma_id)), { onConflict: "firma_id,app_id" }); if (error) throw error; }
  const mm = await matMap(sb);
  const klienci = new Map(); txs.forEach((t) => { const r = klientToRow(t, firma_id); const o = klienci.get(r.app_id); if (o) { if (t.plate && !o.rejestracje.includes(t.plate)) o.rejestracje.push(t.plate); } else klienci.set(r.app_id, r); });
  const kl = [...klienci.values()];
  for (let i = 0; i < kl.length; i += 500) { const { error } = await sb.from("klienci").upsert(kl.slice(i, i + 500), { onConflict: "firma_id,app_id" }); if (error) throw error; }
  const { data: kRows, error: ke } = await sb.from("klienci").select("id,app_id"); if (ke) throw ke;
  const kId = {}; kRows.forEach((r) => { kId[r.app_id] = r.id; });
  for (let i = 0; i < txs.length; i += 200) {
    const part = txs.slice(i, i + 200).map((t) => txToRows(t, firma_id, kId[klientKey(t)], mm));
    const { data, error } = await sb.from("transakcje").upsert(part.map((p) => p.tx), { onConflict: "firma_id,app_id" }).select("id,app_id"); if (error) throw error;
    const idOf = {}; data.forEach((r) => { idOf[r.app_id] = r.id; });
    const poz = []; part.forEach((p) => p.pozycje.forEach((q) => poz.push({ ...q, transakcja_id: idOf[p.tx.app_id] })));
    if (poz.length) { const { error: e2 } = await sb.from("pozycje").insert(poz); if (e2) throw e2; }
    onProgress(`Przyjęcia: ${Math.min(i + 200, txs.length)}/${txs.length}`);
  }
  if (disp.length) { const { error } = await sb.from("wydania").upsert(disp.map((d) => dispToRow(d, firma_id, mm)), { onConflict: "firma_id,app_id" }); if (error) throw error; }
  const { error: ne } = await sb.rpc("ustaw_numeracje"); if (ne) throw ne;
  onProgress(`Gotowe: ${mats.length} towarów, ${kl.length} klientów, ${txs.length} przyjęć, ${disp.length} wydań.`);
  return { cennik: mats.length, klienci: kl.length, przyjecia: txs.length, wydania: disp.length };
}
