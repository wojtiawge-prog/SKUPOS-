import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import App from "./app.js";
import { loadAll, saveKey, TABLE_KEYS, rowToMat } from "./datalayer.js";
// klucze, które nigdy nie idą do chmury (konta lokalne, hasła, sesja) — konta są w Supabase Auth
const NIE_DO_CHMURY = ["sk_users_v2", "sk_session_v2", "sk_cloud_prof", "sk_pending_setup", "sk_req_synced"];
const TRYB_TABEL = () => typeof window !== "undefined" && window.SKUPOS_DB === "tables";
let _tq = Promise.resolve();
/* ════════════════════════════════════════════════════════════════
   CloudGate — nakładka łącząca aplikację z bazą Supabase
   • logowanie / rejestracja firmy (Supabase Auth)
   • synchronizacja danych do bazy (tabela ustawienia, RLS per firma)
   • przekierowanie zapytań AI przez funkcję serwerową (klucz bezpieczny)
   Nie modyfikuje samej aplikacji — owija ją.
   ════════════════════════════════════════════════════════════════ */
let supa = null;
function getSupa() {
    if (!supa && window.SUPA && window.SUPA.url) {
        supa = createClient(window.SUPA.url, window.SUPA.anon, { auth: { persistSession: true, autoRefreshToken: true } });
    }
    return supa;
}
const BASE_PERMS = { transactions: false, cennikView: false, cennikEdit: false, magazyn: false, pickups: false, reports: false, controls: false, requests: false, marketing: false, accounting: false, companyData: false };
const PRESETY = {
    owner: Object.fromEntries(Object.keys(BASE_PERMS).map((k) => [k, true])),
    operator: { ...BASE_PERMS, transactions: true, cennikView: true, magazyn: true, pickups: true, reports: true, controls: true, requests: true },
    pracownik: { ...BASE_PERMS, transactions: true, cennikView: true, magazyn: true, pickups: true },
    controller: { ...BASE_PERMS, transactions: true, cennikView: true, reports: true, controls: true },
    marketing: { ...BASE_PERMS, cennikView: true, marketing: true, requests: true },
    accountant: { ...BASE_PERMS, transactions: true, cennikView: true, reports: true, accounting: true },
};
// ── AI: przekieruj zapytania do api.anthropic.com przez funkcję serwerową ──
function patchFetch() {
    window.__cloudLogout = async () => {
        try { const s = getSupa(); if (s) await s.auth.signOut(); } catch (e) { }
        // wylogowanie czyści dane firmy z tego urządzenia (zostaje tryb i wygląd)
        try { Object.keys(localStorage).forEach((k) => { if (k.indexOf("sk_") === 0 && ["sk_tryb", "sk_theme", "sk_big"].indexOf(k) === -1) localStorage.removeItem(k); }); } catch (e) { }
        try { location.reload(); } catch (e) { }
    };
    if (window.__aiPatched)
        return;
    window.__aiPatched = true;
    const orig = window.fetch.bind(window);
    window.fetch = (url, opts) => {
        try {
            if (typeof url === "string" && url.indexOf("api.anthropic.com") !== -1) {
                let body = {};
                try {
                    body = JSON.parse(opts.body);
                }
                catch (e) { }
                let proxy = "";
                try { proxy = localStorage.getItem("sk_ai_proxy") || ""; } catch (e) { }
                if (proxy) {
                    return orig(proxy, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
                }
                if (window.SUPA && window.SUPA.url) {
                    // AI tylko dla zalogowanego użytkownika: wysyłamy JEGO token, nie publiczny klucz anon
                    return (async () => {
                        let tok = null;
                        try { const s = getSupa(); if (s) { const r = await s.auth.getSession(); tok = r && r.data && r.data.session ? r.data.session.access_token : null; } } catch (e) { }
                        if (!tok) return new Response(JSON.stringify({ error: { message: "Zaloguj się, aby korzystać z AI." } }), { status: 401, headers: { "Content-Type": "application/json" } });
                        return orig(`${window.SUPA.url}/functions/v1/agent-ai`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tok}`, "apikey": window.SUPA.anon },
                            body: JSON.stringify(body),
                        });
                    })();
                }
            }
        }
        catch (e) { }
        return orig(url, opts);
    };
    window.__aiPatched = true;
}
// ── Zapis do bazy z kolejką: błąd = widoczny pasek + ponowienie, zamiast cichej utraty danych ──
const _pending = {};
let _retryT = null;
function syncBanner() {
    try {
        const n = Object.keys(_pending).length;
        let el = document.getElementById("sk-sync-banner");
        if (!n) { if (el) el.remove(); return; }
        if (!el) {
            el = document.createElement("div");
            el.id = "sk-sync-banner";
            el.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:9999;padding:10px 14px;background:#b45309;color:#fff;font:600 14px/1.35 system-ui,sans-serif;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,.25)";
            document.body.appendChild(el);
        }
        el.textContent = (navigator.onLine === false ? "Brak internetu" : "Nie zapisano w chmurze") + " \u2014 " + n + " zmian czeka, pon\u00f3wi\u0119 automatycznie. Nie zamykaj aplikacji.";
    } catch (e) { }
}
let _rola = null; // rola zalogowanego: dane firmy i uprawnienia zapisuje tylko właściciel (RLS)
const TYLKO_WLASCICIEL = ["sk_co_v2", "sk_perms_v2", "sk_buyers_v1"];
function pushKey(s, firmaId, k, val) {
    if (_rola && _rola !== "owner" && TYLKO_WLASCICIEL.indexOf(k) !== -1) { delete _pending[k]; syncBanner(); return; }
    _pending[k] = { firmaId, val };
    try {
        s.from("ustawienia").upsert({ firma_id: firmaId, klucz: k, wartosc: val }, { onConflict: "firma_id,klucz" }).then((r) => {
            if (r && r.error) { scheduleRetry(); syncBanner(); return; }
            if (_pending[k] && _pending[k].val === val) delete _pending[k];
            syncBanner();
        }, () => { scheduleRetry(); syncBanner(); });
    } catch (e) { scheduleRetry(); syncBanner(); }
}
function scheduleRetry() {
    if (_retryT) return;
    _retryT = setTimeout(() => {
        _retryT = null;
        const s = getSupa();
        if (!s) return;
        Object.entries(_pending).forEach(([k, p]) => { if (k.indexOf("tbl:") !== 0) pushKey(s, p.firmaId, k, p.val); });
    }, 20000);
}
try { window.addEventListener("online", () => { const s = getSupa(); if (s) Object.entries(_pending).forEach(([k, p]) => { if (k.indexOf("tbl:") !== 0) pushKey(s, p.firmaId, k, p.val); }); }); } catch (e) { }
try { window.addEventListener("beforeunload", (e) => { if (Object.keys(_pending).length) { e.preventDefault(); e.returnValue = ""; } }); } catch (e) { }
// ── Storage: localStorage (czyta apka) + wypchnięcie do bazy ──
function patchStorage(firmaId) {
    window.storage = {
        get: (k) => { try {
            return { value: localStorage.getItem(k) };
        }
        catch (e) {
            return { value: null };
        } },
        set: (k, v) => {
            let prevRaw = null;
            try { prevRaw = localStorage.getItem(k); } catch (e) { }
            try {
                localStorage.setItem(k, v);
            }
            catch (e) { }
            if (k === "sk_req_v2") return; // zgłoszenia żyją w tabeli zgloszenia, nie w blobie
            if (NIE_DO_CHMURY.indexOf(k) !== -1) return;
            if (TRYB_TABEL() && TABLE_KEYS.indexOf(k) !== -1) {
                // nowa baza: cennik, przyjęcia i wydania idą do tabel (tylko zmienione rekordy, po kolei)
                const s2 = getSupa();
                if (s2 && firmaId) {
                    let nv = [], pv = [];
                    try { nv = JSON.parse(v) || []; } catch (e) { }
                    try { pv = JSON.parse(prevRaw || "[]") || []; } catch (e) { }
                    _tq = _tq.then(() => saveKey(s2, firmaId, k, nv, pv)).then(() => { delete _pending["tbl:" + k]; syncBanner(); }, (err) => { console.error("SkupOS zapis do tabel:", err); _pending["tbl:" + k] = { firmaId, val: null }; syncBanner(); });
                }
                return;
            }
            const s = getSupa();
            if (s && firmaId) {
                let val;
                try {
                    val = JSON.parse(v);
                }
                catch (e) {
                    val = v;
                }
                pushKey(s, firmaId, k, val);
            }
        },
        remove: (k) => { try {
            localStorage.removeItem(k);
        }
        catch (e) { } },
    };
}
// ── Pobierz wszystkie dane firmy z bazy do localStorage ──
async function pull(firmaId) {
    const s = getSupa();
    if (!s)
        return;
    try {
        const { data } = await s.from("ustawienia").select("klucz,wartosc").eq("firma_id", firmaId);
        (data || []).forEach((r) => { if (TRYB_TABEL() && TABLE_KEYS.indexOf(r.klucz) !== -1) return; try {
            localStorage.setItem(r.klucz, JSON.stringify(r.wartosc));
        }
        catch (e) { } });
    }
    catch (e) { }
    if (TRYB_TABEL()) {
        try {
            const d = await loadAll(s);
            // nowa firma bez cennika: zostaw domyślny cennik aplikacji — zapisze się do bazy przy pierwszym zapisie
            if (d.materials.length) localStorage.setItem("sk_mat_v2", JSON.stringify(d.materials));
            else localStorage.removeItem("sk_mat_v2");
            localStorage.setItem("sk_tx_v2", JSON.stringify(d.tx));
            localStorage.setItem("sk_disp_v2", JSON.stringify(d.dispatch));
        }
        catch (e) { console.error("SkupOS odczyt tabel:", e); }
    }
}
// ── Kto zalogowany (sesja + profil) ──
async function sesja() {
    const s = getSupa();
    if (!s)
        return null;
    let user = null;
    try {
        const { data: { session } } = await s.auth.getSession();
        user = session && session.user;
    }
    catch (e) { }
    if (!user)
        return null;
    try {
        const { data: prof } = await s.from("profile").select("*").eq("id", user.id).single();
        if (prof) {
            try { localStorage.setItem("sk_cloud_prof", JSON.stringify(prof)); } catch (e) { }
            return { user, prof };
        }
    }
    catch (e) { }
    try {
        const cached = JSON.parse(localStorage.getItem("sk_cloud_prof") || "null");
        if (cached && cached.id === user.id)
            return { user, prof: cached };
    }
    catch (e) { }
    return null;
}
// ── Rejestracja firmy ──
async function rejestruj({ firma, email, haslo, imie }) {
    const s = getSupa();
    const { data: a, error: e1 } = await s.auth.signUp({ email, password: haslo, options: { data: { imie, firma_setup: firma } } });
    if (e1)
        throw e1;
    if (!a.session) {
        // potwierdzanie e-maila wlaczone: user bez sesji -> RLS nie pozwoli nic zapisac.
        // Zapamietaj dane i dokoncz po pierwszym zalogowaniu (dokonczKonto).
        try { localStorage.setItem("sk_pending_setup", JSON.stringify({ typ: "owner", firma, imie })); } catch (e) { }
        return { pending: true };
    }
    const prof = await utworzKontoOwnera(a.user.id, email, firma, imie);
    return { firmaId: prof.firma_id, prof };
}
// ── Utworzenie firmy + profilu wlasciciela (wymaga aktywnej sesji) ──
async function utworzKontoOwnera(uid, email, firma, imie) {
    const s = getSupa();
    const adres = [firma.adres, firma.miasto].filter((x) => x && String(x).trim()).join(", ");
    const { data: firmaId, error } = await s.rpc("zaloz_firme", { p_nazwa: firma.nazwa, p_nip: firma.nip || "", p_imie: imie, p_adres: adres, p_bdo: firma.bdo || "", p_login: email });
    if (error) throw error;
    const rows = Object.entries(PRESETY).map(([rola, perms]) => ({ firma_id: firmaId, rola, perms }));
    try { await s.from("uprawnienia_rol").upsert(rows, { onConflict: "firma_id,rola" }); } catch (e) { }
    const co = { name: firma.nazwa, nip: firma.nip || "", bdo: firma.bdo || "", addr: adres };
    try { localStorage.setItem("sk_co_v2", JSON.stringify(co)); } catch (e) { }
    try { await s.from("ustawienia").upsert({ firma_id: firmaId, klucz: "sk_co_v2", wartosc: co }, { onConflict: "firma_id,klucz" }); } catch (e) { }
    return { id: uid, firma_id: firmaId, imie, rola: "owner", login: email };
}
// ── Pracownik z kodem zaproszenia od szefa ──
async function dolaczPracownika(uid, email, kod, imie) {
    const s = getSupa();
    const { data: firmaId, error } = await s.rpc("przyjmij_zaproszenie", { p_kod: kod, p_imie: imie, p_login: email });
    if (error) throw error;
    const { data: p } = await s.from("profile").select("*").eq("id", uid).single();
    return p || { id: uid, firma_id: firmaId, imie, rola: "pracownik", login: email };
}
async function rejestrujPracownika({ email, haslo, imie, kod }) {
    const s = getSupa();
    const { data: a, error: e1 } = await s.auth.signUp({ email, password: haslo, options: { data: { imie, invite_code: kod } } });
    if (e1) throw e1;
    if (!a.session) {
        try { localStorage.setItem("sk_pending_setup", JSON.stringify({ typ: "worker", kod, imie })); } catch (e) { }
        return { pending: true };
    }
    return await dolaczPracownika(a.user.id, email, kod, imie);
}
// ── Dokonczenie konta po potwierdzeniu e-maila (naprawia tez stare, martwe konta) ──
async function dokonczKonto(user) {
    try { const s = getSupa(); const { data: p } = await s.from("profile").select("*").eq("id", user.id).single(); if (p) return p; } catch (e) { }
    let pend = null;
    try { pend = JSON.parse(localStorage.getItem("sk_pending_setup") || "null"); } catch (e) { }
    const md = (user && user.user_metadata) || {};
    if (!pend && md.firma_setup) pend = { typ: "owner", firma: md.firma_setup, imie: md.imie || md.name || "" };
    if (!pend && md.client_setup) pend = { typ: "client", imie: md.name || md.imie || "", firmaId: md.client_setup };
    if (!pend && md.invite_code) pend = { typ: "worker", imie: md.imie || md.name || "", kod: md.invite_code };
    if (!pend) return null;
    let prof = null;
    if (pend.typ === "client") {
        if (!pend.firmaId) return null;
        const s = getSupa();
        const { error } = await s.rpc("dolacz_jako_klient", { p_firma: pend.firmaId, p_imie: pend.imie || "Klient", p_login: user.email });
        if (error) throw error;
        prof = { id: user.id, firma_id: pend.firmaId, imie: pend.imie || "Klient", rola: "client", login: user.email };
    } else if (pend.typ === "worker") {
        prof = await dolaczPracownika(user.id, user.email, pend.kod, pend.imie || "");
    } else {
        prof = await utworzKontoOwnera(user.id, user.email, (pend.firma && pend.firma.nazwa ? pend.firma : { nazwa: "Mój skup" }), pend.imie || "Właściciel");
    }
    try { localStorage.removeItem("sk_pending_setup"); } catch (e) { }
    try { localStorage.setItem("sk_cloud_prof", JSON.stringify(prof)); } catch (e) { }
    return prof;
}
// ── Logowanie ──
async function loguj(email, haslo) {
    const s = getSupa();
    const { error } = await s.auth.signInWithPassword({ email, password: haslo });
    if (error)
        throw error;
}
// ── Po zalogowaniu: przygotuj stan lokalny, by apka wstała zalogowana ──
async function przygotuj(prof) {
    _rola = prof.rola || null;
    await pull(prof.firma_id);
    await pullZgloszenia(prof);
    let users = [];
    try {
        users = JSON.parse(localStorage.getItem("sk_users_v2") || "[]");
    }
    catch (e) { }
    if (!Array.isArray(users))
        users = [];
    if (!users.find((u) => u.id === prof.id))
        users.push({ id: prof.id, login: prof.login || "wlasciciel", pass: "", name: prof.imie || "Właściciel", role: prof.rola || "owner" });
    // Zespół z bazy (konta pracowników firmy) → lista użytkowników aplikacji (zadania, przełącznik profili)
    try {
        const { data: team } = await getSupa().from("profile").select("id,imie,login,rola,aktywny").eq("firma_id", prof.firma_id);
        (team || []).forEach((p) => {
            if (p.aktywny === false || p.rola === "client") return;
            const e = { id: p.id, login: p.login || "", name: p.imie || p.login || "Pracownik", role: p.rola };
            const i = users.findIndex((u) => u.id === p.id);
            if (i >= 0) users[i] = { ...users[i], ...e };
            else users.push({ ...e, pass: "" });
        });
    }
    catch (e) { }
    try {
        localStorage.setItem("sk_users_v2", JSON.stringify(users));
    }
    catch (e) { }
    try {
        localStorage.setItem("sk_session_v2", JSON.stringify(prof.id));
    }
    catch (e) { }
    patchStorage(prof.firma_id);
    patchFetch();
}

// ── Link zaproszenia: ?firma=ID ──
function firmaZLinku() {
    try { return new URLSearchParams(location.search).get("firma"); } catch (e) { return null; }
}
// ── Mapowanie zgłoszenie (baza) → format aplikacji (sk_req_v2) ──
function zgloszenieDoApp(z) {
    return { id: z.id, ts: z.utworzono ? new Date(z.utworzono).getTime() : Date.now(), name: z.imie || "", imie: z.imie || "", phone: z.telefon || "", telefon: z.telefon || "", plate: z.rejestracja || "", note: z.opis || "", opis: z.opis || "", material: z.material || "", photo: z.foto_url || "", status: z.status || "nowe", klient_id: z.klient_id || null };
}
function syncedSet() {
    try { return new Set(JSON.parse(localStorage.getItem("sk_req_synced") || "[]")); } catch (e) { return new Set(); }
}
function syncedSave(set) { try { localStorage.setItem("sk_req_synced", JSON.stringify([...set])); } catch (e) { } }
// ── Pobierz zgłoszenia firmy → sk_req_v2 (klient: tylko swoje wg RLS; personel: wszystkie) ──
async function pullZgloszenia(prof) {
    const s = getSupa();
    if (!s || !prof || !prof.firma_id) return;
    try {
        const { data } = await s.from("zgloszenia").select("*").eq("firma_id", prof.firma_id).order("utworzono", { ascending: false });
        const arr = (data || []).map(zgloszenieDoApp);
        localStorage.setItem("sk_req_v2", JSON.stringify(arr));
        const set = syncedSet();
        arr.forEach((z) => set.add(z.id));
        syncedSave(set);
    } catch (e) { }
}
// ── Storage klienta: czyta lokalnie; nowe zgłoszenia → tabela zgloszenia ──
function patchStorageKlient(prof) {
    const s = getSupa();
    window.storage = {
        get: (k) => { try { return { value: localStorage.getItem(k) }; } catch (e) { return { value: null }; } },
        set: (k, v) => {
            try { localStorage.setItem(k, v); } catch (e) { }
            if (k === "sk_req_v2" && s && prof && prof.firma_id) {
                let arr = [];
                try { arr = JSON.parse(v); } catch (e) { }
                if (!Array.isArray(arr)) return;
                const set = syncedSet();
                const nowe = arr.filter((z) => z && z.id && !set.has(z.id));
                if (nowe.length === 0) return;
                nowe.forEach((z) => set.add(z.id));
                syncedSave(set);
                Promise.all(nowe.map((z) => s.from("zgloszenia").insert({
                    firma_id: prof.firma_id, klient_id: prof.id,
                    imie: z.name || z.imie || prof.imie || "",
                    telefon: z.phone || z.telefon || "",
                    opis: z.note || z.opis || "",
                    material: z.material || "", rejestracja: z.plate || "",
                    foto_url: z.photo || "", status: "nowe"
                }))).then(() => pullZgloszenia(prof), () => { });
            }
        },
        remove: (k) => { try { localStorage.removeItem(k); } catch (e) { } },
    };
}
// ── Rejestracja KLIENTA (podpięcie do firmy z linku) ──
async function rejestrujKlienta({ email, haslo, imie, firmaId }) {
    const s = getSupa();
    const { data: a, error: e1 } = await s.auth.signUp({ email, password: haslo, options: { data: { name: imie, client_setup: firmaId } } });
    if (e1) throw e1;
    if (!a.session) {
        try { localStorage.setItem("sk_pending_setup", JSON.stringify({ typ: "client", imie, firmaId })); } catch (e) { }
        return { pending: true };
    }
    const uid = a.user.id;
    const { error: e3 } = await s.rpc("dolacz_jako_klient", { p_firma: firmaId, p_imie: imie, p_login: email });
    if (e3) throw e3;
    return { id: uid, firma_id: firmaId, imie, rola: "client", login: email };
}
// ── Po zalogowaniu KLIENTA: tylko cennik + dane firmy + jego zgłoszenia ──
async function przygotujKlienta(prof) {
    const s = getSupa();
    try {
        const { data } = await s.from("ustawienia").select("klucz,wartosc").eq("firma_id", prof.firma_id).in("klucz", ["sk_mat_v2", "sk_co_v2"]);
        (data || []).forEach((r) => { try { localStorage.setItem(r.klucz, JSON.stringify(r.wartosc)); } catch (e) { } });
    } catch (e) { }
    if (TRYB_TABEL()) {
        // nowa baza: cennik dla klienta prosto z tabeli (RLS: klient widzi tylko cennik swojego skupu)
        try {
            const { data, error } = await s.from("cennik").select("*").eq("firma_id", prof.firma_id).eq("aktywny", true).order("nazwa");
            if (!error && data) localStorage.setItem("sk_mat_v2", JSON.stringify(data.map(rowToMat)));
        } catch (e) { }
    }
    await pullZgloszenia(prof);
    let users = [];
    try { users = JSON.parse(localStorage.getItem("sk_users_v2") || "[]"); } catch (e) { }
    if (!Array.isArray(users)) users = [];
    if (!users.find((u) => u.id === prof.id)) users.push({ id: prof.id, login: prof.login || "klient", pass: "", name: prof.imie || "Klient", role: "client" });
    try { localStorage.setItem("sk_users_v2", JSON.stringify(users)); } catch (e) { }
    try { localStorage.setItem("sk_session_v2", JSON.stringify(prof.id)); } catch (e) { }
    patchStorageKlient(prof);
    patchFetch();
}

/* ════════════════ UI ════════════════ */
const BG = "#111418", SURF = "#1a1f28", SURF2 = "#1f2636", LINE = "#252d3a", LINE2 = "#2a3347";
const TEXT = "#e8ecf0", MUTED = "#7a8797", FAINT = "#4a5568", COPPER = "#c8743f", RED = "#dc2626", GREEN = "#15a34a";
const h = React.createElement;
const FONT = "'Plus Jakarta Sans',system-ui,-apple-system,sans-serif";
const inp = { width: "100%", padding: "13px 14px", borderRadius: 12, border: `1px solid ${LINE2}`, background: SURF2, color: TEXT, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" };
const lbl = { fontSize: 12.5, color: MUTED, fontWeight: 600, display: "block", marginBottom: 7, marginTop: 16 };
const btn = { width: "100%", padding: "15px", borderRadius: 14, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${COPPER},#a85829)`, color: "#fff", fontWeight: 800, fontSize: 15.5, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" };
const btnGhost = { width: "100%", padding: "14px", borderRadius: 14, cursor: "pointer", background: "transparent", border: `1px solid ${LINE2}`, color: MUTED, fontWeight: 600, fontSize: 14, marginTop: 12, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" };
function Shell({ children }) {
    return React.createElement("div", { style: { background: BG, minHeight: "100vh", color: TEXT, fontFamily: "'Plus Jakarta Sans',system-ui,-apple-system,sans-serif", maxWidth: 440, margin: "0 auto", padding: "0 18px 40px" } }, children);
}
function Logo() {
    return React.createElement("img", { src: "icon-192.png", alt: "SkupOS", width: 72, height: 72, style: { display: "block", margin: "0 auto", borderRadius: 20, boxShadow: "0 12px 30px rgba(200,116,63,.4)" } });
}
function AuthScreen({ onDone, onSetup, onPending }) {
    const [tryb, setTryb] = useState("login");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const [email, setEmail] = useState("");
    const [haslo, setHaslo] = useState("");
    const [imie, setImie] = useState("");
    const [firma, setFirma] = useState({ nazwa: "", nip: "", miasto: "", adres: "", bdo: "" });
    const [kod, setKod] = useState(() => { try { return new URLSearchParams(location.search).get("kod") || ""; } catch (e) { return ""; } });
    useEffect(() => { if (kod) setTryb("kod"); }, []);
    const dolacz = async () => {
        setErr("");
        if (kod.trim().length < 6 || !imie.trim() || !email.includes("@") || haslo.length < 6) { setErr("Wpisz kod od szefa, imię, e-mail i hasło (min. 6 znaków)."); return; }
        setBusy(true);
        try {
            const r = await rejestrujPracownika({ email: email.trim(), haslo, imie: imie.trim(), kod: kod.trim().toUpperCase() });
            if (r && r.pending) { setBusy(false); if (onPending) onPending(email.trim()); return; }
            await przygotuj(r);
            onDone();
        } catch (e) { setErr(tlumaczBlad(e)); setBusy(false); }
    };
    const zaloguj = async () => {
        setErr("");
        setBusy(true);
        try {
            await loguj(email.trim(), haslo);
            let sx = await sesja();
            if (!sx) {
                const s2 = getSupa();
                const { data: { session } } = await s2.auth.getSession();
                const prof = session && session.user ? await dokonczKonto(session.user) : null;
                if (!prof) { if (onSetup) { onSetup(); return; } throw new Error("Brak profilu — dokończ konfigurację konta."); }
                sx = { user: session.user, prof };
            }
            if (sx.prof.rola === "client") await przygotujKlienta(sx.prof); else await przygotuj(sx.prof);
            onDone();
        }
        catch (e) {
            setErr(tlumaczBlad(e));
            setBusy(false);
        }
    };
    const zarejestruj = async () => {
        setErr("");
        if (!firma.nazwa.trim() || !email.includes("@") || haslo.length < 6 || !imie.trim()) {
            setErr("Uzupełnij nazwę firmy, imię, e-mail i hasło (min. 6 znaków).");
            return;
        }
        setBusy(true);
        try {
            const r = await rejestruj({ firma: { nazwa: firma.nazwa.trim(), nip: firma.nip.trim(), miasto: firma.miasto.trim(), adres: firma.adres.trim(), bdo: firma.bdo.trim() }, email: email.trim(), haslo, imie: imie.trim() });
            if (r && r.pending) { setBusy(false); if (onPending) onPending(email.trim()); return; }
            await przygotuj(r.prof);
            onDone();
        }
        catch (e) {
            setErr(tlumaczBlad(e));
            setBusy(false);
        }
    };
    return (React.createElement(Shell, null,
        React.createElement("div", { style: { paddingTop: 40, textAlign: "center" } },
            React.createElement(Logo, null),
            React.createElement("h1", { style: { fontSize: 25, fontWeight: 900, margin: "18px 0 4px", letterSpacing: "-.02em" } }, "SkupOS"),
            React.createElement("div", { style: { fontSize: 13.5, color: MUTED } }, tryb === "login" ? "Zaloguj się do swojego skupu" : tryb === "kod" ? "Dołącz do zespołu skupu" : "Załóż konto firmy")),
        tryb === "kod" ? (React.createElement(React.Fragment, null,
            React.createElement("label", { style: lbl }, "Kod zaproszenia od szefa"),
            React.createElement("input", { style: { ...inp, fontFamily: "monospace", letterSpacing: ".12em", textTransform: "uppercase" }, value: kod, autoCapitalize: "characters", onChange: (e) => setKod(e.target.value), placeholder: "A1B2C3D4E5" }),
            React.createElement("label", { style: lbl }, "Imi\u0119 i nazwisko"),
            React.createElement("input", { style: inp, value: imie, onChange: (e) => setImie(e.target.value), placeholder: "Jan Kowalski" }),
            React.createElement("label", { style: lbl }, "E-mail (login)"),
            React.createElement("input", { style: inp, type: "email", value: email, autoCapitalize: "none", onChange: (e) => setEmail(e.target.value), placeholder: "jan@example.com" }),
            React.createElement("label", { style: lbl }, "Has\u0142o ", React.createElement("span", { style: { color: FAINT, fontWeight: 400 } }, "\u00B7 min. 6 znak\u00F3w")),
            React.createElement("input", { style: inp, type: "password", value: haslo, onChange: (e) => setHaslo(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }),
            err && React.createElement("div", { style: { color: RED, fontSize: 12.5, fontWeight: 600, marginTop: 12 } }, err),
            React.createElement("button", { style: { ...btn, marginTop: 22, opacity: busy ? .6 : 1 }, disabled: busy, onClick: dolacz }, busy ? "Do\u0142\u0105czam\u2026" : "Do\u0142\u0105cz do zespo\u0142u"),
            React.createElement("button", { style: btnGhost, onClick: () => { setTryb("login"); setErr(""); } }, "Mam ju\u017C konto \u2014 zaloguj si\u0119"))) : tryb === "login" ? (React.createElement(React.Fragment, null,
            React.createElement("label", { style: lbl }, "E-mail"),
            React.createElement("input", { style: inp, type: "email", value: email, autoCapitalize: "none", onChange: (e) => setEmail(e.target.value), placeholder: "jan@firma.pl" }),
            React.createElement("label", { style: lbl }, "Has\u0142o"),
            React.createElement("input", { style: inp, type: "password", value: haslo, onChange: (e) => setHaslo(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", onKeyDown: (e) => { if (e.key === "Enter")
                    zaloguj(); } }),
            err && React.createElement("div", { style: { color: RED, fontSize: 12.5, fontWeight: 600, marginTop: 12 } }, err),
            React.createElement("button", { style: { ...btn, marginTop: 22, opacity: busy ? .6 : 1 }, disabled: busy, onClick: zaloguj }, busy ? "Logowanie…" : "Zaloguj się"),
            React.createElement("button", { style: btnGhost, onClick: () => { setTryb("rejestr"); setErr(""); } }, "Nie mam konta \u2014 za\u0142\u00F3\u017C firm\u0119"),
            React.createElement("button", { style: { ...btnGhost, marginTop: 8 }, onClick: () => { setTryb("kod"); setErr(""); } }, "Mam kod zaproszenia od szefa"))) : (React.createElement(React.Fragment, null,
            React.createElement("label", { style: lbl }, "Nazwa firmy *"),
            React.createElement("input", { style: inp, value: firma.nazwa, onChange: (e) => setFirma({ ...firma, nazwa: e.target.value }), placeholder: "Skup metali Kowalski" }),
            React.createElement("div", { style: { display: "flex", gap: 10 } },
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("label", { style: lbl }, "NIP"),
                    React.createElement("input", { style: inp, value: firma.nip, onChange: (e) => setFirma({ ...firma, nip: e.target.value }), placeholder: "573\u2026" })),
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("label", { style: lbl }, "Miasto"),
                    React.createElement("input", { style: inp, value: firma.miasto, onChange: (e) => setFirma({ ...firma, miasto: e.target.value }), placeholder: "Cz\u0119stochowa" }))),
            React.createElement("label", { style: lbl }, "Twoje imi\u0119 i nazwisko *"),
            React.createElement("input", { style: inp, value: imie, onChange: (e) => setImie(e.target.value), placeholder: "Jan Kowalski" }),
            React.createElement("label", { style: lbl }, "E-mail (login) *"),
            React.createElement("input", { style: inp, type: "email", value: email, autoCapitalize: "none", onChange: (e) => setEmail(e.target.value), placeholder: "jan@firma.pl" }),
            React.createElement("label", { style: lbl },
                "Has\u0142o * ",
                React.createElement("span", { style: { color: FAINT, fontWeight: 400 } }, "\u00B7 min. 6 znak\u00F3w")),
            React.createElement("input", { style: inp, type: "password", value: haslo, onChange: (e) => setHaslo(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }),
            err && React.createElement("div", { style: { color: RED, fontSize: 12.5, fontWeight: 600, marginTop: 12 } }, err),
            React.createElement("button", { style: { ...btn, marginTop: 22, opacity: busy ? .6 : 1 }, disabled: busy, onClick: zarejestruj }, busy ? "Zakładam konto…" : "Załóż konto firmy"),
            React.createElement("button", { style: btnGhost, onClick: () => { setTryb("login"); setErr(""); } }, "Mam ju\u017C konto \u2014 zaloguj si\u0119"))),
        React.createElement("div", { style: { fontSize: 11, color: FAINT, textAlign: "center", marginTop: 22, lineHeight: 1.6 } }, "Dane szyfrowane i synchronizowane mi\u0119dzy urz\u0105dzeniami.")));
}
function tlumaczBlad(e) {
    const m = String(e && e.message || e || "");
    if (m.includes("Zaproszenie nieważne"))
        return "Kod jest nieważny albo już użyty — poproś szefa o nowy.";
    if (m.includes("Tylko właściciel"))
        return "Tylko właściciel może to zrobić.";
    if (m.includes("Invalid login"))
        return "Błędny e-mail lub hasło.";
    if (m.includes("already registered") || m.includes("already been"))
        return "Ten e-mail jest już zarejestrowany. Zaloguj się.";
    if (m.toLowerCase().includes("confirm"))
        return "Konto istnieje, ale e-mail nie został potwierdzony. Kliknij link z wiadomości aktywacyjnej (sprawdź folder SPAM), potem zaloguj się.";
    if (m.includes("Failed to fetch") || m.includes("NetworkError"))
        return "Brak połączenia z bazą. Sprawdź dane w config.js i internet.";
    return m || "Coś poszło nie tak. Spróbuj ponownie.";
}
function Info({ tytul, opis }) {
    return React.createElement(Shell, null,
        React.createElement("div", { style: { paddingTop: 80, textAlign: "center" } },
            React.createElement(Logo, null),
            React.createElement("h1", { style: { fontSize: 20, fontWeight: 800, margin: "18px 0 8px" } }, tytul),
            React.createElement("div", { style: { fontSize: 13.5, color: MUTED, lineHeight: 1.6, maxWidth: 320, margin: "0 auto" } }, opis)));
}
function ClientAuth({ firmaId, onDone, onSetup, onPending }) {
    const [tryb, setTryb] = useState("rejestr");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const [email, setEmail] = useState("");
    const [haslo, setHaslo] = useState("");
    const [imie, setImie] = useState("");
    const zaloguj = async () => {
        setErr(""); setBusy(true);
        try {
            await loguj(email.trim(), haslo);
            let sx = await sesja();
            if (!sx) {
                const s2 = getSupa();
                const { data: { session } } = await s2.auth.getSession();
                const prof = session && session.user ? await dokonczKonto(session.user) : null;
                if (!prof) { if (onSetup) { onSetup(); return; } throw new Error("Brak profilu — dokończ konfigurację konta."); }
                sx = { user: session.user, prof };
            }
            if (sx.prof.rola === "client") await przygotujKlienta(sx.prof); else await przygotuj(sx.prof);
            onDone();
        } catch (e) { setErr(tlumaczBlad(e)); setBusy(false); }
    };
    const zarejestruj = async () => {
        setErr("");
        if (!imie.trim() || !email.includes("@") || haslo.length < 6) { setErr("Uzupełnij imię, e-mail i hasło (min. 6 znaków)."); return; }
        if (!firmaId) { setErr("Brak ID skupu w linku."); return; }
        setBusy(true);
        try {
            const prof = await rejestrujKlienta({ email: email.trim(), haslo, imie: imie.trim(), firmaId });
            if (prof && prof.pending) { setBusy(false); if (onPending) onPending(email.trim()); return; }
            await przygotujKlienta(prof);
            onDone();
        } catch (e) { setErr(tlumaczBlad(e)); setBusy(false); }
    };
    return h(Shell, null,
        h("div", { style: { paddingTop: 40, textAlign: "center" } }, h(Logo, null),
            h("h1", { style: { fontSize: 23, fontWeight: 900, margin: "18px 0 4px", letterSpacing: "-.02em" } }, "Portal klienta"),
            h("div", { style: { fontSize: 13.5, color: MUTED } }, tryb === "login" ? "Zaloguj si\u0119 do portalu" : "Za\u0142\u00F3\u017C konto, by widzie\u0107 ceny i wysy\u0142a\u0107 wyceny")),
        tryb === "rejestr" ? h(React.Fragment, null,
            h("label", { style: lbl }, "Imi\u0119 i nazwisko"),
            h("input", { style: inp, value: imie, onChange: (e) => setImie(e.target.value), placeholder: "Jan Kowalski" }),
            h("label", { style: lbl }, "E-mail"),
            h("input", { style: inp, type: "email", value: email, autoCapitalize: "none", onChange: (e) => setEmail(e.target.value), placeholder: "jan@example.com" }),
            h("label", { style: lbl }, "Has\u0142o ", h("span", { style: { color: FAINT, fontWeight: 400 } }, "\u00B7 min. 6 znak\u00F3w")),
            h("input", { style: inp, type: "password", value: haslo, onChange: (e) => setHaslo(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }),
            err && h("div", { style: { color: RED, fontSize: 12.5, fontWeight: 600, marginTop: 12 } }, err),
            h("button", { style: { ...btn, marginTop: 22, opacity: busy ? .6 : 1 }, disabled: busy, onClick: zarejestruj }, busy ? "Tworz\u0119 konto\u2026" : "Za\u0142\u00F3\u017C konto i do\u0142\u0105cz"),
            h("button", { style: btnGhost, onClick: () => { setTryb("login"); setErr(""); } }, "Mam ju\u017C konto \u2014 zaloguj si\u0119")
        ) : h(React.Fragment, null,
            h("label", { style: lbl }, "E-mail"),
            h("input", { style: inp, type: "email", value: email, autoCapitalize: "none", onChange: (e) => setEmail(e.target.value), placeholder: "jan@example.com" }),
            h("label", { style: lbl }, "Has\u0142o"),
            h("input", { style: inp, type: "password", value: haslo, onChange: (e) => setHaslo(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", onKeyDown: (e) => { if (e.key === "Enter") zaloguj(); } }),
            err && h("div", { style: { color: RED, fontSize: 12.5, fontWeight: 600, marginTop: 12 } }, err),
            h("button", { style: { ...btn, marginTop: 22, opacity: busy ? .6 : 1 }, disabled: busy, onClick: zaloguj }, busy ? "Logowanie\u2026" : "Zaloguj si\u0119"),
            h("button", { style: btnGhost, onClick: () => { setTryb("rejestr"); setErr(""); } }, "Nie mam konta \u2014 za\u0142\u00F3\u017C")
        ),
        h("div", { style: { fontSize: 11, color: FAINT, textAlign: "center", marginTop: 22, lineHeight: 1.6 } }, "Do\u0142\u0105czasz do skupu, kt\u00F3ry wys\u0142a\u0142 Ci link.")
    );
}
const ROLE_ZAPR = [["pracownik", "Pracownik wagi", "Przyj\u0119cia i kwity"], ["operator", "Kierownik", "Przyj\u0119cia, ceny, magazyn"], ["kierowca", "Kierowca", "Swoje odbiory i trasy"], ["accountant", "Ksi\u0119gowy", "Papiery, BDO, eksport"]];
function InviteButton({ firmaId }) {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState("pracownik");
    const [copied, setCopied] = useState("");
    const [qr, setQr] = useState("");
    const [rola, setRola] = useState("pracownik");
    const [kod, setKod] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    useEffect(() => { window.__cloudInvite = () => setOpen(true); return () => { try { delete window.__cloudInvite; } catch (e) { } }; }, []);
    const base = (window.KLIENT_URL && String(window.KLIENT_URL).trim()) ? String(window.KLIENT_URL).trim() : (location.origin + location.pathname);
    const link = base + (base.indexOf("?") >= 0 ? "&" : "?") + "firma=" + firmaId;
    const appUrl = location.origin + location.pathname;
    const linkKod = kod ? appUrl + "?tryb=chmura&kod=" + kod : "";
    useEffect(() => {
        if (!open || tab !== "klient" || qr) return;
        (async () => {
            try {
                const m = await import("https://esm.sh/qrcode@1.5.3");
                const fn = m.toDataURL || (m.default && m.default.toDataURL);
                setQr(await fn(link, { width: 260, margin: 1, color: { dark: "#0b0e12", light: "#ffffff" } }));
            } catch (e) { }
        })();
    }, [open, tab]);
    const copy = (t, k) => { try { navigator.clipboard.writeText(t); setCopied(k); setTimeout(() => setCopied(""), 1800); } catch (e) { } };
    const nowyKod = async () => {
        setErr(""); setBusy(true); setKod("");
        try { const { data, error } = await getSupa().rpc("utworz_zaproszenie", { p_rola: rola }); if (error) throw error; setKod(data); }
        catch (e) { setErr(tlumaczBlad(e)); }
        setBusy(false);
    };
    if (!open) return null;
    let light = true; try { light = (localStorage.getItem("sk_theme") || "light") === "light"; } catch (e) { }
    const P = light ? { bg: "#ffffff", s2: "#f4f2ee", line: "#e6e2db", text: "#16191d", mut: "#5f6670" } : { bg: SURF, s2: SURF2, line: LINE2, text: TEXT, mut: MUTED };
    const desk = typeof matchMedia === "function" && matchMedia("(min-width: 760px)").matches;
    const tabBtn = (k, l) => h("button", { onClick: () => setTab(k), style: { flex: 1, minHeight: 42, borderRadius: 10, border: "none", cursor: "pointer", fontFamily: FONT, fontWeight: 800, fontSize: 14, background: tab === k ? P.bg : "transparent", color: tab === k ? COPPER : P.mut, boxShadow: tab === k ? "0 1px 3px rgba(0,0,0,.12)" : "none" } }, l);
    const gBtn = Object.assign({}, btn, { fontFamily: FONT, minHeight: 50, padding: "0 16px", borderRadius: 12, fontSize: 15 });
    return h("div", { onClick: () => setOpen(false), style: { position: "fixed", inset: 0, zIndex: 120, background: "rgba(10,13,17,.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: desk ? "center" : "flex-end", justifyContent: "center", padding: desk ? 24 : 0, fontFamily: FONT } },
        h("div", { onClick: (e) => e.stopPropagation(), style: { background: P.bg, color: P.text, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto", borderRadius: desk ? 20 : "22px 22px 0 0", padding: "20px 20px calc(20px + env(safe-area-inset-bottom))", border: "1px solid " + P.line, boxShadow: "0 24px 60px -20px rgba(0,0,0,.45)" } },
            h("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 } },
                h("div", { style: { width: 40, height: 40, borderRadius: 12, display: "grid", placeItems: "center", background: "rgba(200,116,63,.14)", color: COPPER, fontSize: 20, fontWeight: 800 } }, "+"),
                h("div", { style: { flex: 1 } },
                    h("div", { style: { fontSize: 18, fontWeight: 800, letterSpacing: "-.01em" } }, "Zaproś do skupu"),
                    h("div", { style: { fontSize: 13, color: P.mut } }, tab === "pracownik" ? "Konto dla pracownika z wybraną rolą" : "Dostęp do Twojego cennika dla dostawcy")),
                h("button", { onClick: () => setOpen(false), "aria-label": "Zamknij", style: { width: 38, height: 38, borderRadius: 10, border: "1px solid " + P.line, background: P.s2, color: P.mut, cursor: "pointer", fontSize: 18, lineHeight: 1, fontFamily: FONT } }, "×")),
            h("div", { style: { display: "flex", gap: 4, padding: 4, borderRadius: 13, background: P.s2, marginBottom: 16 } }, tabBtn("pracownik", "Pracownik"), tabBtn("klient", "Klient")),
            tab === "pracownik" ? h(React.Fragment, null,
                h("div", { style: { fontSize: 13, fontWeight: 700, color: P.mut, marginBottom: 8 } }, "Rola"),
                h("div", { style: { display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 8, marginBottom: 14 } }, ROLE_ZAPR.map(([k, l, d]) => h("button", { key: k, onClick: () => { setRola(k); setKod(""); }, style: { textAlign: "left", padding: "10px 12px", minHeight: 58, borderRadius: 12, cursor: "pointer", fontFamily: FONT, border: rola === k ? "2px solid " + COPPER : "1px solid " + P.line, background: rola === k ? "rgba(200,116,63,.10)" : P.s2, color: P.text } },
                    h("div", { style: { fontWeight: 800, fontSize: 14, color: rola === k ? COPPER : P.text } }, l),
                    h("div", { style: { fontSize: 12.5, color: P.mut, marginTop: 2 } }, d)))),
                kod ? h(React.Fragment, null,
                    h("div", { style: { textAlign: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 700, letterSpacing: ".14em", padding: "14px 0", borderRadius: 12, background: P.s2, border: "1px dashed " + COPPER, color: P.text } }, kod),
                    h("button", { onClick: () => copy(linkKod, "kod"), style: Object.assign({}, gBtn, { marginTop: 10, background: copied === "kod" ? GREEN : gBtn.background }) }, copied === "kod" ? "Skopiowano ✓" : "Kopiuj link z kodem")) :
                    h("button", { onClick: nowyKod, disabled: busy, style: Object.assign({}, gBtn, { opacity: busy ? .6 : 1 }) }, busy ? "Generuję…" : "Wygeneruj kod"),
                h("div", { style: { fontSize: 12.5, color: P.mut, lineHeight: 1.5, marginTop: 10 } }, "Pracownik otwiera link, zakłada konto i widzi tylko to, na co pozwala rola. Kod działa 7 dni, jeden raz."),
                err && h("div", { style: { color: RED, fontSize: 13, fontWeight: 600, marginTop: 10 } }, err)) :
            h(React.Fragment, null,
                qr ? h("div", { style: { display: "flex", justifyContent: "center", marginBottom: 14 } }, h("img", { src: qr, alt: "Kod QR do cennika", style: { width: 200, height: 200, borderRadius: 14, background: "#fff", padding: 10, border: "1px solid " + P.line } })) : h("div", { style: { textAlign: "center", color: P.mut, fontSize: 13, padding: "30px 0" } }, "Generuję kod QR…"),
                h("button", { onClick: () => copy(link, "kl"), style: Object.assign({}, gBtn, { background: copied === "kl" ? GREEN : gBtn.background }) }, copied === "kl" ? "Skopiowano ✓" : "Kopiuj link dla klienta"),
                h("div", { style: { fontSize: 12.5, color: P.mut, lineHeight: 1.5, marginTop: 10 } }, "Dostawca zobaczy Twój cennik i wyśle zdjęcie złomu do wyceny. Nie zobaczy przyjęć ani innych klientów."))));
}
function ConfirmScreen({ email, onBack }) {
    return h(Shell, null,
        h("div", { style: { paddingTop: 70, textAlign: "center" } },
            h(Logo, null),
            h("h1", { style: { fontSize: 21, fontWeight: 800, margin: "18px 0 8px" } }, "Potwierd\u017A sw\u00F3j e-mail"),
            h("div", { style: { fontSize: 13.5, color: MUTED, lineHeight: 1.65, maxWidth: 330, margin: "0 auto" } },
                "Wys\u0142ali\u015Bmy link aktywacyjny na ", h("b", { style: { color: TEXT } }, email || "Tw\u00F3j adres"), ". Kliknij go (sprawd\u017A te\u017C SPAM), a potem wr\u00F3\u0107 tu i zaloguj si\u0119 \u2014 konto doko\u0144czy si\u0119 automatycznie."),
            h("button", { style: { ...btn, marginTop: 26 }, onClick: onBack }, "Wr\u00F3\u0107 do logowania")));
}
function SetupScreen({ user, clientMode, clientFirmaId, onDone }) {
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const md = (user && user.user_metadata) || {};
    const [imie, setImie] = useState(md.imie || md.name || "");
    const [nazwa, setNazwa] = useState((md.firma_setup && md.firma_setup.nazwa) || "");
    if (clientMode && !clientFirmaId) {
        return h(Shell, null, h("div", { style: { paddingTop: 70, textAlign: "center" } },
            h(Logo, null),
            h("h1", { style: { fontSize: 20, fontWeight: 800, margin: "18px 0 8px" } }, "Brak ID skupu"),
            h("div", { style: { fontSize: 13.5, color: MUTED, lineHeight: 1.6, maxWidth: 320, margin: "0 auto" } }, "Otw\u00F3rz aplikacj\u0119 z linku zaproszenia od Twojego skupu (link zawiera ID) i zaloguj si\u0119 ponownie."),
            h("button", { style: { ...btnGhost, marginTop: 24 }, onClick: () => { try { getSupa().auth.signOut().then(() => location.reload()); } catch (e) { location.reload(); } } }, "Wyloguj")));
    }
    const zapisz = async () => {
        setErr("");
        if (!imie.trim() || (!clientMode && !nazwa.trim())) { setErr(clientMode ? "Podaj imi\u0119 i nazwisko." : "Podaj nazw\u0119 firmy i imi\u0119."); return; }
        setBusy(true);
        try {
            let prof;
            if (clientMode) {
                const s = getSupa();
                const { error } = await s.rpc("dolacz_jako_klient", { p_firma: clientFirmaId, p_imie: imie.trim(), p_login: user.email });
                if (error) throw error;
                prof = { id: user.id, firma_id: clientFirmaId, imie: imie.trim(), rola: "client", login: user.email };
                await przygotujKlienta(prof);
            } else {
                prof = await utworzKontoOwnera(user.id, user.email, { nazwa: nazwa.trim() }, imie.trim());
                await przygotuj(prof);
            }
            try { localStorage.removeItem("sk_pending_setup"); } catch (e) { }
            try { localStorage.setItem("sk_cloud_prof", JSON.stringify(prof)); } catch (e) { }
            onDone();
        } catch (e) { setErr(tlumaczBlad(e)); setBusy(false); }
    };
    return h(Shell, null,
        h("div", { style: { paddingTop: 46, textAlign: "center" } },
            h(Logo, null),
            h("h1", { style: { fontSize: 21, fontWeight: 800, margin: "18px 0 4px" } }, "Doko\u0144cz konfiguracj\u0119"),
            h("div", { style: { fontSize: 13, color: MUTED } }, "E-mail potwierdzony \u2713 \u2014 jeszcze jeden krok")),
        !clientMode && h(React.Fragment, null,
            h("label", { style: lbl }, "Nazwa firmy *"),
            h("input", { style: inp, value: nazwa, onChange: (e) => setNazwa(e.target.value), placeholder: "Skup metali Kowalski" })),
        h("label", { style: lbl }, "Imi\u0119 i nazwisko *"),
        h("input", { style: inp, value: imie, onChange: (e) => setImie(e.target.value), placeholder: "Jan Kowalski" }),
        err && h("div", { style: { color: RED, fontSize: 12.5, fontWeight: 600, marginTop: 12 } }, err),
        h("button", { style: { ...btn, marginTop: 22, opacity: busy ? .6 : 1 }, disabled: busy, onClick: zapisz }, busy ? "Zapisuj\u0119\u2026" : "Zapisz i wejd\u017A"),
        h("button", { style: btnGhost, onClick: () => { try { getSupa().auth.signOut().then(() => location.reload()); } catch (e) { location.reload(); } } }, "Wyloguj"));
}
export default function CloudGate() {
    const [stan, setStan] = useState("loading");
    const [prof, setProf] = useState(null);
    const [pendUser, setPendUser] = useState(null);
    const [confirmEmail, setConfirmEmail] = useState("");
    const trybKlienta = () => window.APP_MODE === "client" || (!window.APP_MODE && !!firmaZLinku());
    const doApp = async () => { const sx = await sesja(); setProf(sx ? sx.prof : null); setStan("app"); };
    const authHome = () => setStan(trybKlienta() ? "klient" : "auth");
    const doSetup = async () => { try { const { data: { session } } = await getSupa().auth.getSession(); setPendUser(session && session.user); } catch (e) { } setStan("setup"); };
    const doPending = (em) => { setConfirmEmail(em); setStan("confirm"); };
    useEffect(() => {
        (async () => {
            if (!window.SUPA || !window.SUPA.url || window.SUPA.url.indexOf("TWOJ") !== -1 || window.SUPA.url.indexOf("twojprojekt") !== -1) { setStan("config"); return; }
            if (!getSupa()) { setStan("config"); return; }
            const sx = await sesja();
            if (!sx) {
                // Zalogowany, ale bez profilu (np. wrocil po potwierdzeniu e-maila) -> dokoncz automatycznie
                try {
                    const { data: { session } } = await getSupa().auth.getSession();
                    if (session && session.user) {
                        const p = await dokonczKonto(session.user);
                        if (p) { setProf(p); if (p.rola === "client") await przygotujKlienta(p); else await przygotuj(p); setStan("app"); return; }
                        setPendUser(session.user); setStan("setup"); return;
                    }
                } catch (e) { }
                setStan(trybKlienta() ? "klient" : "auth"); return;
            }
            setProf(sx.prof);
            if (sx.prof.rola === "client") await przygotujKlienta(sx.prof); else await przygotuj(sx.prof);
            setStan("app");
        })();
    }, []);
    if (window.APP_MODE === "local") return h(App); // tryb podglądu bez logowania
    if (stan === "loading") return h(Info, { tytul: "\u0141adowanie\u2026", opis: "\u0141\u0105cz\u0119 z baz\u0105 i sprawdzam logowanie." });
    if (stan === "config") return h(Info, { tytul: "Skonfiguruj baz\u0119", opis: "Otw\u00F3rz plik config.js i wpisz Project URL oraz anon key ze swojego projektu Supabase (Project Settings \u2192 API)." });
    if (stan === "confirm") return h(ConfirmScreen, { email: confirmEmail, onBack: authHome });
    if (stan === "setup") return h(SetupScreen, { user: pendUser, clientMode: trybKlienta(), clientFirmaId: firmaZLinku() || ((pendUser && pendUser.user_metadata && pendUser.user_metadata.client_setup) || null), onDone: doApp });
    if (stan === "auth") return h(AuthScreen, { onDone: doApp, onSetup: doSetup, onPending: doPending });
    if (stan === "klient") return h(ClientAuth, { firmaId: firmaZLinku(), onDone: doApp, onSetup: doSetup, onPending: doPending });
    if (prof && prof.rola === "owner") return h(React.Fragment, null, h(App, null), h(InviteButton, { firmaId: prof.firma_id }));
    return h(App, null);
}
