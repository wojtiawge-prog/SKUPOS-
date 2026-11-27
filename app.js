import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Scale, Recycle, Receipt, Banknote, Building2, User, Truck, Warehouse, Factory, Camera, ScanLine, Search, Plus, Coins, TrendingUp, FileText, ChevronRight, ChevronLeft, Check, X, Trash2, ArrowRight, MapPin, Wallet, BadgeCheck, Clock, AlertTriangle, Settings, CreditCard, Printer, Smartphone, Bell, RefreshCw, Sparkles, Calculator, LogOut, Inbox, Send, MessageSquare, ShieldCheck, Megaphone, MoreHorizontal, Users, Download } from "lucide-react";
/* ─────────── storage ─────────── */
const mem = new Map();
const lsGet = (k) => { try {
    if (typeof localStorage !== "undefined") {
        const v = localStorage.getItem(k);
        if (v != null)
            return v;
    }
}
catch (e) { } return mem.has(k) ? mem.get(k) : null; };
const store = {
    async get(k) {
        try {
            if (typeof window !== "undefined" && window.storage) {
                const r = await Promise.race([
                    Promise.resolve(window.storage.get(k)).catch(() => undefined),
                    new Promise((res) => setTimeout(() => res(undefined), 800)),
                ]);
                if (r === undefined || r === null)
                    return lsGet(k);
                return r.value != null ? r.value : null;
            }
        }
        catch (e) { }
        return lsGet(k);
    },
    async set(k, v) {
        try {
            if (typeof window !== "undefined" && window.storage) {
                await window.storage.set(k, v);
                return;
            }
        }
        catch (e) { }
        try {
            if (typeof localStorage !== "undefined") {
                localStorage.setItem(k, v);
                return;
            }
        }
        catch (e) { }
        mem.set(k, v);
    },
};
const load = async (k, fb) => { const r = await store.get(k); if (r == null)
    return fb; try {
    return JSON.parse(r);
}
catch {
    return fb;
} };
const save = (k, v) => store.set(k, JSON.stringify(v));
/* ─────────── helpers ─────────── */
const SK_EXTRA = typeof window !== "undefined" && !!window.SK_EXTRA; // Marketing/Social: zamrożone do czasu modułu „Powiadom dostawców”
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
const pad = (n) => String(n).padStart(2, "0");
const now = () => new Date();
const todayStr = () => { const d = now(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const pln = (n) => (Math.round((n + Number.EPSILON) * 100) / 100).toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";
const plnShort = (n) => Math.round(n).toLocaleString("pl-PL") + " zł";
const kg = (n) => (Math.round(n * 10) / 10).toLocaleString("pl-PL", { maximumFractionDigits: 1 }) + " kg";
const PL_MON = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
const fmtTs = (ts) => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtDate = (ts) => { const d = new Date(ts); return `${d.getDate()} ${PL_MON[d.getMonth()]} ${d.getFullYear()}`; };
const fnorm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
/* ─────────── seed data ─────────── */
const C = {
    FE: { code: "17 04 05", label: "Żelazo i stal", color: "#6b7787" },
    CU: { code: "17 04 01", label: "Miedź, brąz, mosiądz", color: "#c2703d" },
    AL: { code: "17 04 02", label: "Aluminium", color: "#8aa2ad" },
    PB: { code: "17 04 03", label: "Ołów", color: "#5a6470" },
    ZN: { code: "17 04 04", label: "Cynk", color: "#7f8b97" },
    SS: { code: "17 04 07", label: "Mieszaniny metali", color: "#3f7d8a" },
    KAB: { code: "17 04 11", label: "Kable", color: "#b9542f" },
    AKU: { code: "16 06 01", label: "Akumulatory ołowiowe", color: "#566" },
    EL: { code: "16 02 14", label: "Zużyte urządzenia", color: "#7c6f9b" },
};
const seedMaterials = () => [
    { id: "m_fe1", n: "Złom stalowy wsadowy", g: "FE", buy: 1.20, sell: 1.45, stock: 8420 },
    { id: "m_fe2", n: "Złom ciężki (gruby)", g: "FE", buy: 1.35, sell: 1.60, stock: 5100 },
    { id: "m_fe3", n: "Wióry stalowe", g: "FE", buy: 0.80, sell: 1.00, stock: 1240 },
    { id: "m_fe4", n: "Żeliwo", g: "FE", buy: 1.30, sell: 1.55, stock: 980 },
    { id: "m_fe5", n: "Blacha mieszana", g: "FE", buy: 1.00, sell: 1.25, stock: 2200 },
    { id: "m_cu1", n: "Miedź błyszcząca (1A)", g: "CU", buy: 30.50, sell: 33.00, stock: 145 },
    { id: "m_cu2", n: "Miedź mix", g: "CU", buy: 27.00, sell: 30.00, stock: 210 },
    { id: "m_br1", n: "Mosiądz", g: "CU", buy: 18.00, sell: 21.00, stock: 175 },
    { id: "m_br2", n: "Brąz", g: "CU", buy: 19.50, sell: 22.50, stock: 60 },
    { id: "m_kab1", n: "Kable miedziane", g: "KAB", buy: 18.00, sell: 22.00, stock: 320 },
    { id: "m_kab2", n: "Kable aluminiowe", g: "KAB", buy: 5.50, sell: 7.00, stock: 140 },
    { id: "m_al1", n: "Aluminium twarde", g: "AL", buy: 6.00, sell: 7.50, stock: 640 },
    { id: "m_al2", n: "Aluminium miękkie (profile)", g: "AL", buy: 7.00, sell: 8.50, stock: 410 },
    { id: "m_al3", n: "Puszki aluminiowe", g: "AL", buy: 3.50, sell: 5.00, stock: 180 },
    { id: "m_al4", n: "Felgi aluminiowe", g: "AL", buy: 7.50, sell: 9.00, stock: 95 },
    { id: "m_alcu", n: "Chłodnice Al-Cu", g: "CU", buy: 12.00, sell: 14.50, stock: 70 },
    { id: "m_pb1", n: "Ołów", g: "PB", buy: 6.50, sell: 8.00, stock: 130 },
    { id: "m_zn1", n: "Cynk", g: "ZN", buy: 6.00, sell: 7.50, stock: 90 },
    { id: "m_ss1", n: "Nierdzewka 18/8 (304)", g: "SS", buy: 5.50, sell: 7.00, stock: 240 },
    { id: "m_ss2", n: "Nierdzewka magnetyczna", g: "SS", buy: 2.50, sell: 3.50, stock: 160 },
    { id: "m_aku", n: "Akumulatory ołowiowe", g: "AKU", buy: 4.00, sell: 5.00, stock: 380 },
    { id: "m_sil", n: "Silniki elektryczne", g: "EL", buy: 4.50, sell: 6.00, stock: 0 },
].map((m) => ({ ...m, stock: 0 }));
const matMap = (mats) => Object.fromEntries(mats.map((m) => [m.id, m]));
const SEED_COMPANY = { name: "", nip: "", bdo: "", addr: "" };
const seedTx = () => {
    const t = todayStr();
    const at = (h, m) => new Date(`${t}T${pad(h)}:${pad(m)}:00`).getTime();
    return [
        { id: uid(), no: "FPO/2026/06/0007", ts: at(13, 42), kind: "FPO", payment: "gotowka", plate: "SK 12345",
            osoba: { imie: "Marek", nazwisko: "Kowalczyk", adres: "ul. Słoneczna 8, 41-200 Sosnowiec", dowod: "ABC456789" },
            pos: [{ matId: "m_fe1", n: "Złom stalowy wsadowy", g: "FE", w: 340, price: 1.20 }, { matId: "m_al1", n: "Aluminium twarde", g: "AL", w: 22, price: 6.00 }] },
        { id: uid(), no: "KPO/2026/06/0011", ts: at(12, 15), kind: "KPO", payment: "przelew", plate: "WZ 4521A",
            firma: { nazwa: "Instal-Bud Sp. z o.o.", nip: "634-11-22-333" },
            pos: [{ matId: "m_cu2", n: "Miedź mix", g: "CU", w: 64, price: 27.00 }, { matId: "m_kab1", n: "Kable miedziane", g: "KAB", w: 38, price: 18.00 }] },
        { id: uid(), no: "FPO/2026/06/0006", ts: at(10, 58), kind: "FPO", payment: "blik", plate: "SK 12345",
            osoba: { imie: "Anna", nazwisko: "Wiśniewska", adres: "ul. Polna 3, 40-100 Katowice", dowod: "DEF112233" },
            pos: [{ matId: "m_aku", n: "Akumulatory ołowiowe", g: "AKU", w: 48, price: 4.00 }] },
        { id: uid(), no: "FPO/2026/06/0005", ts: at(9, 30), kind: "FPO", payment: "gotowka", plate: "DG 7788X",
            osoba: { imie: "Tomasz", nazwisko: "Lewandowski", adres: "ul. Lipowa 22, 41-300 Dąbrowa Górnicza", dowod: "GHI778899" },
            pos: [{ matId: "m_fe2", n: "Złom ciężki (gruby)", g: "FE", w: 510, price: 1.35 }, { matId: "m_ss1", n: "Nierdzewka 18/8 (304)", g: "SS", w: 12, price: 5.50 }] },
    ];
};
const txTotal = (tx) => tx.pos.reduce((a, p) => a + p.w * p.price, 0);
const txMass = (tx) => tx.pos.reduce((a, p) => a + p.w, 0);
/* ── JEDNO miejsce liczenia wyniku: skup = wydatek, przychód = sprzedaż do huty, marża = sprzedaż − koszt sprzedanego towaru ── */
const calcWynik = (tx, dispatch, materials, keyOk) => {
    const mm = {}; (materials || []).forEach((m) => { mm[m.id] = m; });
    const agg = {};
    (tx || []).forEach((t) => (t.pos || []).forEach((p) => { const a = agg[p.matId] || (agg[p.matId] = { w: 0, v: 0 }); a.w += +p.w || 0; a.v += (+p.w || 0) * (+p.price || 0); }));
    const avgBuy = (id) => { const a = agg[id]; return a && a.w > 0 ? a.v / a.w : ((mm[id] || {}).buy || 0); };
    const day = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
    const txs = (tx || []).filter((t) => keyOk(day(t.ts)));
    const skup = txs.reduce((a, t) => a + txTotal(t), 0), masa = txs.reduce((a, t) => a + txMass(t), 0);
    let sprzedaz = 0, koszt = 0, sprzMasa = 0;
    (dispatch || []).filter((d) => keyOk(d.dateKey || day(d.ts))).forEach((d) => { const w = +d.w || 0; const price = d.price != null ? +d.price : ((mm[d.matId] || {}).sell || 0); sprzedaz += w * price; koszt += w * avgBuy(d.matId); sprzMasa += w; });
    return { skup, masa, sprzedaz, koszt, marza: sprzedaz - koszt, sprzMasa, n: txs.length };
};
const supplierName = (tx) => tx.kind === "FPO" ? `${tx.osoba.imie} ${tx.osoba.nazwisko}` : tx.firma.nazwa;
const PAY = { gotowka: { label: "Gotówka", icon: Banknote }, przelew: { label: "Przelew", icon: CreditCard }, blik: { label: "BLIK", icon: Wallet } };
/* ─────────── DANE POKAZOWE (tryb demo do sprzedaży) ─────────── */
const DEMO_OSOBY = [
    { imie: "Marek", nazwisko: "Kowalczyk", adres: "ul. Słoneczna 8, 41-200 Sosnowiec", dowod: "ABC456789" },
    { imie: "Anna", nazwisko: "Wiśniewska", adres: "ul. Polna 3, 40-100 Katowice", dowod: "DEF112233" },
    { imie: "Tomasz", nazwisko: "Lewandowski", adres: "ul. Lipowa 22, 41-300 Dąbrowa Górnicza", dowod: "GHI778899" },
    { imie: "Piotr", nazwisko: "Nowak", adres: "ul. Krótka 5, 42-500 Będzin", dowod: "JKL334455" },
    { imie: "Krzysztof", nazwisko: "Wójcik", adres: "ul. Długa 14, 41-250 Czeladź", dowod: "MNO556677" },
    { imie: "Andrzej", nazwisko: "Kamiński", adres: "ul. Leśna 9, 41-400 Mysłowice", dowod: "PQR889900" },
    { imie: "Stanisław", nazwisko: "Szymański", adres: "ul. Ogrodowa 2, 43-100 Tychy", dowod: "STU223344" },
    { imie: "Grzegorz", nazwisko: "Woźniak", adres: "ul. Akacjowa 17, 44-100 Gliwice", dowod: "VWX445566" },
    { imie: "Jan", nazwisko: "Dąbrowski", adres: "ul. Brzozowa 6, 41-800 Zabrze", dowod: "YZA667788" },
    { imie: "Ryszard", nazwisko: "Kozłowski", adres: "ul. Klonowa 11, 41-902 Bytom", dowod: "BCD990011" },
    { imie: "Henryk", nazwisko: "Jankowski", adres: "ul. Wiśniowa 4, 41-500 Chorzów", dowod: "EFG112200" },
    { imie: "Józef", nazwisko: "Zieliński", adres: "ul. Sosnowa 19, 41-700 Ruda Śląska", dowod: "HIJ334411" },
];
const DEMO_FIRMY = [
    { nazwa: "Instal-Bud Sp. z o.o.", nip: "634-11-22-333" },
    { nazwa: "MetalTech S.A.", nip: "954-22-33-444" },
    { nazwa: "Bud-Rem Sp. z o.o.", nip: "631-33-44-555" },
    { nazwa: "Elektro-Mont Sp. j.", nip: "644-44-55-666" },
    { nazwa: "Demontaż-Pro", nip: "627-55-66-777" },
    { nazwa: "Hydro-Instal Sp. z o.o.", nip: "648-66-77-888" },
    { nazwa: "Stal-Serwis", nip: "634-77-88-999" },
    { nazwa: "ZłomPol Sp. z o.o.", nip: "954-88-99-000" },
];
const DEMO_PLATES = ["SK 12345", "WZ 4521A", "DG 7788X", "KA 9921B", "BE 3344C", "SO 1122D", "TY 5566E", "GL 7788F", "ZA 9900G", "BY 2233H"];
const DEMO_MATS = [
    { matId: "m_fe1", n: "Złom stalowy wsadowy", g: "FE", price: 1.20, wmin: 400, wmax: 3000 },
    { matId: "m_fe2", n: "Złom ciężki (gruby)", g: "FE", price: 1.35, wmin: 500, wmax: 3500 },
    { matId: "m_fe5", n: "Blacha mieszana", g: "FE", price: 1.00, wmin: 200, wmax: 1500 },
    { matId: "m_cu1", n: "Miedź błyszcząca (1A)", g: "CU", price: 30.50, wmin: 30, wmax: 250 },
    { matId: "m_cu2", n: "Miedź mix", g: "CU", price: 27.00, wmin: 40, wmax: 350 },
    { matId: "m_br1", n: "Mosiądz", g: "CU", price: 18.00, wmin: 30, wmax: 300 },
    { matId: "m_kab1", n: "Kable miedziane", g: "KAB", price: 18.00, wmin: 50, wmax: 500 },
    { matId: "m_al1", n: "Aluminium twarde", g: "AL", price: 6.00, wmin: 80, wmax: 900 },
    { matId: "m_al2", n: "Aluminium miękkie (profile)", g: "AL", price: 7.00, wmin: 100, wmax: 700 },
    { matId: "m_ss1", n: "Nierdzewka 18/8 (304)", g: "SS", price: 5.50, wmin: 30, wmax: 250 },
    { matId: "m_pb1", n: "Ołów", g: "PB", price: 6.50, wmin: 40, wmax: 300 },
    { matId: "m_aku", n: "Akumulatory ołowiowe", g: "AKU", price: 4.00, wmin: 100, wmax: 600 },
];
const demoTransactions = () => {
    const rnd = (a, b) => a + Math.random() * (b - a);
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const pays = ["gotowka", "gotowka", "przelew", "przelew", "blik"];
    const out = [];
    const seq = {};
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1); // 1. dzień poprzedniego miesiąca → pełny miesiąc w danych
    const totalDays = Math.floor((now - start) / 86400000); // floor: bez transakcji z jutrzejszą datą
    for (let i = 0; i <= totalDays; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        const isToday = i === totalDays;
        const dow = day.getDay();
        let count;
        if (isToday)
            count = Math.floor(rnd(9, 15)); // dziś — zawsze pełny ruch (dzień pokazu)
        else if (dow === 0)
            count = Math.floor(rnd(0, 3)); // niedziela
        else if (dow === 6)
            count = Math.floor(rnd(3, 7)); // sobota
        else
            count = Math.floor(rnd(8, 14)); // dni robocze
        for (let k = 0; k < count; k++) {
            const kind = Math.random() < 0.55 ? "FPO" : "KPO";
            const ts = new Date(day);
            ts.setHours(Math.floor(rnd(7, 18)), Math.floor(rnd(0, 59)), 0, 0);
            if (ts.getTime() > Date.now()) ts.setTime(Date.now() - Math.floor(rnd(5, 300)) * 60000); // dziś: tylko godziny, które już minęły
            const npos = Math.random() < 0.5 ? 1 : (Math.random() < 0.82 ? 2 : 3);
            const used = {};
            const pos = [];
            for (let p = 0; p < npos; p++) {
                let m = pick(DEMO_MATS);
                let guard = 0;
                while (used[m.matId] && guard++ < 6)
                    m = pick(DEMO_MATS);
                used[m.matId] = 1;
                pos.push({ matId: m.matId, n: m.n, g: m.g, w: Math.round(rnd(m.wmin, m.wmax)), price: +(m.price * rnd(0.96, 1.05)).toFixed(2) });
            }
            const mk = `${kind}/${ts.getFullYear()}/${pad(ts.getMonth() + 1)}`;
            seq[mk] = (seq[mk] || 0) + 1;
            const rec = { id: uid(), no: `${mk}/${String(seq[mk]).padStart(4, "0")}`, ts: ts.getTime(), kind, payment: pick(pays), plate: pick(DEMO_PLATES), pos };
            if (kind === "FPO")
                rec.osoba = pick(DEMO_OSOBY);
            else
                rec.firma = pick(DEMO_FIRMY);
            out.push(rec);
        }
    }
    return out.sort((a, b) => b.ts - a.ts);
};
const demoDispatch = (txs) => {
    const WEEK = 7 * 86400000, cut = Date.now() - 6 * 86400000, by = {};
    txs.forEach((t) => { if (t.ts >= cut) return; const wk = Math.floor(t.ts / WEEK); t.pos.forEach((p) => { const k = wk + "|" + p.matId; by[k] = (by[k] || 0) + p.w; }); });
    const odb = ["Cognor S.A.", "Huta \u0141ab\u0119dy", "Recykling-Metal Sp. z o.o.", "Metalco Hurt"];
    return Object.entries(by).map(([k, w], i) => { const [wk, matId] = k.split("|"); const ts = Math.min((+wk + 1) * WEEK - 2 * 86400000, cut); const d = new Date(ts); return { id: uid(), matId, w: Math.round(w * 0.97), contractor: odb[i % odb.length], dateKey: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, ts }; });
};
const demoPickups = () => {
    const t = todayStr();
    const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
    return [
        { id: uid(), contractor: "MetalTech S.A.", address: "ul. Przemysłowa 12, 41-200 Sosnowiec", phone: "601234567", material: "Złom stalowy + blacha", qtyKg: "1800", priority: "high", note: "Brama od strony magazynu, pytać o Pana Marka", created: t, due: t, status: "planned" },
        { id: uid(), contractor: "Instal-Bud Sp. z o.o.", address: "ul. Budowlana 5, 40-100 Katowice", phone: "602345678", material: "Kable miedziane, miedź", qtyKg: "240", priority: "medium", note: "", created: t, due: day(1), status: "planned" },
        { id: uid(), contractor: "Demontaż-Pro", address: "ul. Fabryczna 88, 41-300 Dąbrowa Górnicza", phone: "603456789", material: "Aluminium, nierdzewka", qtyKg: "520", priority: "medium", note: "Załadunek HDS-em", created: t, due: day(2), status: "planned" },
        { id: uid(), contractor: "Bud-Rem Sp. z o.o.", address: "ul. Robotnicza 3, 41-500 Chorzów", phone: "604567890", material: "Złom mieszany", qtyKg: "900", priority: "low", note: "", created: t, due: day(4), status: "planned" },
    ];
};
const demoTasks = (users) => {
    const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
    const find = (r) => { const u = (users || []).find((x) => x.role === r); return u ? u.id : ""; };
    return [
        { id: uid(), createdAt: Date.now(), title: "Posegregować miedź z wczorajszej dostawy", note: "Oddzielić 1A od mixu", assignee: find("pracownik"), prio: "high", due: todayStr(), status: "todo" },
        { id: uid(), createdAt: Date.now(), title: "Zamówić wywóz kontenera stali do huty", note: "Pełny kontener, ~12 ton", assignee: find("operator"), prio: "medium", due: day(1), status: "todo" },
        { id: uid(), createdAt: Date.now(), title: "Odbiór złomu — MetalTech (HDS)", note: "Adres w zakładce Wywozy", assignee: find("kierowca"), prio: "high", due: todayStr(), status: "todo" },
        { id: uid(), createdAt: Date.now(), title: "Sprawdzić termin legalizacji wagi", note: "Legalizacja kończy się za miesiąc", assignee: find("operator"), prio: "low", due: day(6), status: "todo" },
        { id: uid(), createdAt: Date.now() - 86400000, title: "Wystawić KPO za zeszły tydzień", note: "", assignee: find("operator"), prio: "medium", due: day(-1), status: "done", doneAt: Date.now() - 3600000 },
    ];
};
const seedControls = () => {
    const d = (days) => { const x = new Date(); x.setDate(x.getDate() + days); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
    return [
        { id: uid(), name: "Legalizacja wagi", date: d(24), type: "Metrologia" },
        { id: uid(), name: "Przegląd monitoringu", date: d(8), type: "Bezpieczeństwo" },
        { id: uid(), name: "Sprawozdanie roczne BDO", date: d(74), type: "BDO" },
    ];
};
const seedUsers = () => [
    { id: "u_owner", login: "wlasciciel", pass: "1234", name: "Właściciel", role: "owner" },
    { id: "u_klient", login: "klient", pass: "1234", name: "Portal klienta", role: "client" },
];
const ROLE_LABEL = { owner: "Właściciel", operator: "Kierownik", kierowca: "Kierowca", pracownik: "Pracownik", controller: "Kontroler", marketing: "Marketing", accountant: "Księgowy", client: "Klient" };
// Uprawnienia konfigurowalne przez właściciela (per rola)
const PERM_KEYS = [
    ["intake", "Przyjęcia na wadze (wystawianie FPO/KPO)"],
    ["transactions", "Transakcje (lista FPO/KPO)"],
    ["cennikView", "Cennik — podgląd"],
    ["cennikEdit", "Cennik — zmiana cen"],
    ["magazyn", "Magazyn i wydania"],
    ["reports", "Raporty dzienne"],
    ["controls", "Kontrole i terminy"],
    ["pickups", "Wywozy i odbiory"],
    ["requests", "Zgłoszenia klientów (wyceny)"],
    ["marketing", "Marketing"],
    ["accounting", "Księgowość"],
    ["companyData", "Dane punktu (edycja)"],
];
const BASE_PERMS = { transactions: false, cennikView: false, cennikEdit: false, magazyn: false, reports: false, controls: false, requests: false, marketing: false, accounting: false, pickups: false, companyData: false };
const DEFAULT_PERMS = {
    operator: { ...BASE_PERMS, intake: true, transactions: true, cennikView: true, magazyn: true, reports: true, controls: true, pickups: true, requests: true },
    pracownik: { ...BASE_PERMS, intake: true, transactions: true, cennikView: true, magazyn: true, pickups: true },
    kierowca: { ...BASE_PERMS, pickups: true },
    controller: { ...BASE_PERMS, transactions: true, cennikView: true, reports: true, controls: true },
    marketing: { ...BASE_PERMS, cennikView: true, marketing: true },
    accountant: { ...BASE_PERMS, transactions: true, cennikView: true, reports: true, accounting: true },
};
const daysTo = (dateStr) => { const t = new Date(dateStr + "T00:00:00"); const n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((t - n) / 86400000); };
const downloadText = (filename, text) => {
    try {
        const blob = new Blob(["\ufeff" + text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
    catch (e) { }
};
const padR = (s, n) => (String(s) + " ".repeat(n)).slice(0, n);
const padL = (s, n) => (" ".repeat(n) + String(s)).slice(-n);
// Powiadomienia przeglądarki
function fireNotif(title, body) {
    try {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(title, { body, icon: "icon-192.png" });
        }
    }
    catch (e) { }
}
async function askNotifPermission() {
    try {
        if (typeof Notification === "undefined")
            return "denied";
        if (Notification.permission === "default")
            return await Notification.requestPermission();
        return Notification.permission;
    }
    catch (e) {
        return "denied";
    }
}
// Wczytaj zdjęcie z pliku i zmniejsz (mniejszy rozmiar w pamięci/transferze)
function resizeImage(file, maxDim = 900, quality = 0.6) {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    let { width: w, height: h } = img;
                    if (w > h && w > maxDim) {
                        h = Math.round(h * maxDim / w);
                        w = maxDim;
                    }
                    else if (h >= w && h > maxDim) {
                        w = Math.round(w * maxDim / h);
                        h = maxDim;
                    }
                    const cv = document.createElement("canvas");
                    cv.width = w;
                    cv.height = h;
                    cv.getContext("2d").drawImage(img, 0, 0, w, h);
                    resolve(cv.toDataURL("image/jpeg", quality));
                };
                img.onerror = reject;
                img.src = reader.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        }
        catch (e) {
            reject(e);
        }
    });
}
/* ─────────── UI atoms ─────────── */
const Card = ({ children, style, onClick, pad = 16 }) => (React.createElement("div", { onClick: onClick, className: "sk-card", style: { background: "var(--surface)", border: "var(--cardBorder)", borderRadius: 22, padding: pad, boxShadow: "var(--cardShadow)", ...style } }, children));
const Bar = ({ pct, color = "var(--copper)", h = 8, bg = "var(--track)" }) => (React.createElement("div", { style: { width: "100%", height: h, borderRadius: 99, background: bg, overflow: "hidden" } },
    React.createElement("div", { style: { width: `${Math.min(100, Math.max(0, pct))}%`, height: "100%", borderRadius: 99, background: color, transition: "width .7s cubic-bezier(.2,.8,.2,1)" } })));
const codeChip = (g) => (React.createElement("span", { style: { fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: C[g].color, background: C[g].color + "1a", borderRadius: 6, padding: "2px 6px", whiteSpace: "nowrap" } }, C[g].code));
const iconBtn = { width: 44, height: 44, borderRadius: 15, border: "var(--cardBorder)", background: "var(--surface)", color: "var(--text)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0, boxShadow: "var(--cardShadow)" };
const inputStyle = { width: "100%", padding: "15px 16px", borderRadius: 15, border: "1.5px solid transparent", background: "var(--field)", color: "var(--text)", fontSize: 16, fontWeight: 500, fontFamily: "var(--body)", outline: "none", boxSizing: "border-box" };
const label = { fontSize: 14, color: "var(--muted)", fontWeight: 600, margin: "12px 0 6px", display: "block" };
const btnCopper = { width: "100%", padding: "17px", borderRadius: 17, border: "none", cursor: "pointer", background: "var(--grad)", color: "#fff", fontWeight: 800, fontSize: 16.5, fontFamily: "var(--display)", letterSpacing: "-.01em", boxShadow: "0 14px 28px -12px rgba(180,80,27,.7), inset 0 1px 0 rgba(255,255,255,.25)", display: "flex", alignItems: "center", justifyContent: "center", gap: 9 };
const btnGhost = { width: "100%", padding: "16px", borderRadius: 17, border: "1.5px solid var(--line2)", cursor: "pointer", background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 15.5, fontFamily: "var(--display)" };
const sectionTitle = { fontFamily: "var(--display)", fontSize: 18, fontWeight: 800, color: "var(--text)", letterSpacing: "-.02em", margin: "30px 4px 12px" };
function Sheet({ open, onClose, title, children }) {
    useEffect(() => { if (!open) return; const k = (e) => { if (e.key === "Escape") onClose && onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [open, onClose]);
    if (!open)
        return null;
    return (React.createElement("div", { onClick: onClose, className: "sk-sheet-ov", style: { position: "fixed", inset: 0, zIndex: 80, background: "rgba(20,24,28,.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "fade .2s ease" } },
        React.createElement("div", { onClick: (e) => e.stopPropagation(), className: "sk-sheet", style: { width: "100%", maxWidth: 480, background: "var(--bg)", borderTopLeftRadius: 30, borderTopRightRadius: 30, borderTop: "1px solid var(--line)", padding: "10px 18px 28px", boxShadow: "0 -20px 50px -20px rgba(0,0,0,.35)", animation: "slideUp .28s cubic-bezier(.2,.9,.2,1)", maxHeight: "86vh", overflowY: "auto" } },
            React.createElement("div", { style: { width: 40, height: 4, borderRadius: 99, background: "var(--line2)", margin: "6px auto 14px" } }),
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
                React.createElement("h3", { style: { margin: 0, fontFamily: "var(--display)", fontSize: 19, fontWeight: 800 } }, title),
                React.createElement("button", { onClick: onClose, style: iconBtn },
                    React.createElement(X, { size: 18 }))),
            children)));
}
function Toast({ msg, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 8000); return () => clearTimeout(t); }, [onClose]);
    return (React.createElement("div", { onClick: onClose, className: "no-print", style: { position: "fixed", top: "max(12px, env(safe-area-inset-top))", left: "50%", transform: "translateX(-50%)", zIndex: 95, width: "calc(100% - 24px)", maxWidth: 432, cursor: "pointer", background: "#2b3440", color: "#fff", borderRadius: 14, padding: "13px 15px", display: "flex", gap: 11, alignItems: "center", boxShadow: "0 18px 40px -12px rgba(0,0,0,.5)", animation: "dropIn .3s cubic-bezier(.2,1,.3,1)" } },
        React.createElement("div", { style: { width: 32, height: 32, borderRadius: 9, background: "rgba(224,146,90,.25)", display: "grid", placeItems: "center", flexShrink: 0 } },
            React.createElement(FileText, { size: 17, color: "#e0925a" })),
        React.createElement("div", { style: { flex: 1, fontSize: 15, fontWeight: 600, lineHeight: 1.35 } }, msg),
        React.createElement(X, { size: 16, color: "rgba(255,255,255,.6)" })));
}
function NotifList({ items, notifOn, onEnable, onItem }) {
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 2px 12px" } },
            React.createElement("div", null,
                React.createElement("div", { style: { fontSize: 14, fontWeight: 600 } }, "Powiadomienia w przegl\u0105darce"),
                React.createElement("div", { style: { fontSize: 13, color: "var(--muted)" } }, "Alert nawet przy zamkni\u0119tej karcie")),
            React.createElement("button", { onClick: onEnable, style: { width: 46, height: 27, borderRadius: 99, border: "none", cursor: "pointer", padding: 3, background: notifOn ? "var(--green)" : "var(--line2)", flexShrink: 0 } },
                React.createElement("span", { style: { display: "block", width: 21, height: 21, borderRadius: 99, background: "#fff", transform: notifOn ? "translateX(19px)" : "translateX(0)", transition: "transform .2s" } }))),
        items.length === 0 ? React.createElement("div", { style: { textAlign: "center", color: "var(--muted)", fontSize: 15, padding: "18px 8px" } }, "Brak nowych powiadomie\u0144.") :
            items.map((n) => (React.createElement("div", { key: n.id, onClick: () => onItem && onItem(n), style: { display: "flex", gap: 11, alignItems: "center", padding: "12px 10px", borderTop: "1px solid var(--line)", cursor: onItem ? "pointer" : "default" } },
                React.createElement("div", { style: { width: 36, height: 36, borderRadius: 10, background: "rgba(200,116,63,.12)", display: "grid", placeItems: "center", flexShrink: 0 } },
                    React.createElement(Bell, { size: 17, color: "var(--copper)" })),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    React.createElement("div", { style: { fontSize: 15, fontWeight: 600 } }, n.title),
                    React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)" } }, n.body)),
                React.createElement("span", { style: { fontSize: 12.5, color: "var(--faint)", fontFamily: "var(--mono)", whiteSpace: "nowrap" } }, fmtTs(n.ts)))))));
}
/* ─────────── App ─────────── */
export default function App() {
    const [ready, setReady] = useState(false);
    const [tab, setTab] = useState("home");
    const [materials, setMaterials] = useState(seedMaterials);
    const [txAll, setTx] = useState([]);
    const [company, setCompany] = useState(SEED_COMPANY);
    const [intakeOpen, setIntakeOpen] = useState(false);
    const [viewDoc, setViewDoc] = useState(null);
    const [dispatchAll, setDispatch] = useState([]);
    const [controls, setControls] = useState([]);
    const [reports, setReports] = useState([]);
    const [settings, setSettings] = useState({ reportHour: "20:00", reportOn: true, notif: false });
    const [toast, setToast] = useState(null);
    const [notifSeen, setNotifSeen] = useState({});
    const [mode, setMode] = useState("operator");
    const [clientProfile, setClientProfile] = useState({ plates: [], snapshot: {}, seen: 0 });
    const [users, setUsers] = useState(seedUsers);
    const [session, setSession] = useState(null);
    const [usersOpen, setUsersOpen] = useState(false);
    const [requests, setRequests] = useState([]);
    const [perms, setPerms] = useState(DEFAULT_PERMS);
    const [permsOpen, setPermsOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [switcherOpen, setSwitcherOpen] = useState(false);
    const [backHint, setBackHint] = useState(false);
    const navRef = useRef({});
    navRef.current = { tab, intakeOpen, usersOpen, permsOpen, moreOpen, switcherOpen };
    const closeAllRef = useRef(() => { });
    closeAllRef.current = () => { setIntakeOpen(false); setUsersOpen(false); setPermsOpen(false); setMoreOpen(false); setSwitcherOpen(false); };
    const [campaigns, setCampaigns] = useState([]);
    const [pickups, setPickups] = useState([]);
    const [zadania, setZadania] = useState([]);
    // ── Punkty skupu: właściciel wybiera punkt (puste = wszystkie); pracownik widzi swój z bazy ──
    const [punkty, setPunkty] = useState(() => { try { return JSON.parse(localStorage.getItem("sk_punkty") || "[]") || []; } catch (e) { return []; } });
    const [punktSel, setPunktSelS] = useState(() => { try { return localStorage.getItem("sk_punkt_sel") || ""; } catch (e) { return ""; } });
    const setPunktSel = (v) => { setPunktSelS(v); try { localStorage.setItem("sk_punkt_sel", v || ""); } catch (e) { } };
    const savePunkty = (list) => { setPunkty(list); try { localStorage.setItem("sk_punkty", JSON.stringify(list)); } catch (e) { } };
    const punktOk = punktSel && punkty.some((x) => x.id === punktSel) ? punktSel : "";
    const tx = useMemo(() => punktOk ? txAll.filter((t) => t.punkt === punktOk) : txAll, [txAll, punktOk]);
    const dispatch = useMemo(() => punktOk ? dispatchAll.filter((d) => d.punkt === punktOk) : dispatchAll, [dispatchAll, punktOk]);
    const [buyers, setBuyers] = useState([]); // odbiorcy (huty, pośrednicy) z własnymi cennikami
    const buyersLoaded = useRef(false);
    const ownerRef = useRef(false);
    useEffect(() => { let off = false; load("sk_buyers_v1", null).then((b) => { if (off) return; if (Array.isArray(b)) setBuyers(b); buyersLoaded.current = true; }, () => { buyersLoaded.current = true; }); return () => { off = true; }; }, []);
    // ── Przycisk wstecz: cofanie w apce + podwójny wstecz na pulpicie, by wyjść ──
    useEffect(() => {
        try {
            window.history.pushState({ zm: 1 }, "");
        }
        catch (e) { }
        let lastBack = 0;
        const onPop = () => {
            const s = navRef.current;
            if (s.intakeOpen || s.usersOpen || s.permsOpen || s.moreOpen || s.switcherOpen) {
                closeAllRef.current();
                try {
                    window.history.pushState({ zm: 1 }, "");
                }
                catch (e) { }
                return;
            }
            if (s.tab !== "home") {
                setTab("home");
                try {
                    window.history.pushState({ zm: 1 }, "");
                }
                catch (e) { }
                return;
            }
            const now = Date.now();
            if (now - lastBack < 2000)
                return; // drugi wstecz w 2s → wyjście
            lastBack = now;
            try {
                window.history.pushState({ zm: 1 }, "");
            }
            catch (e) { }
            setBackHint(true);
            setTimeout(() => setBackHint(false), 2000);
        };
        window.addEventListener("popstate", onPop);
        return () => window.removeEventListener("popstate", onPop);
    }, []);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [m, t, c, dp, ct, rp, st, cl, us, ses, rq, pm, nf, mk, pk, tk] = await Promise.all([
                    load("sk_mat_v2", null), load("sk_tx_v2", null), load("sk_co_v2", null),
                    load("sk_disp_v2", null), load("sk_ctrl_v2", null), load("sk_rep_v2", null), load("sk_set_v2", null),
                    load("sk_client_v2", null), load("sk_users_v2", null), load("sk_session_v2", null),
                    load("sk_req_v2", null), load("sk_perms_v2", null), load("sk_notif_v2", null), load("sk_mkt_v2", null),
                    load("sk_pick_v2", null), load("sk_tasks_v2", null),
                ]);
                if (cancelled)
                    return;
                if (m)
                    setMaterials(m);
                if (t)
                    setTx(t);
                else
                    setTx([]);
                if (c)
                    setCompany(c);
                if (dp)
                    setDispatch(dp);
                if (ct)
                    setControls(ct);
                if (rp)
                    setReports(rp);
                if (st)
                    setSettings((s) => ({ ...s, ...st }));
                if (cl)
                    setClientProfile((p) => ({ ...p, ...cl }));
                if (us && us.length)
                    setUsers(us);
                if (ses)
                    setSession(ses);
                if (rq)
                    setRequests(rq);
                if (pm)
                    setPerms((p) => ({ operator: { ...p.operator, ...(pm.operator || {}) }, kierowca: { ...p.kierowca, ...(pm.kierowca || {}) }, pracownik: { ...p.pracownik, ...(pm.pracownik || {}) }, controller: { ...p.controller, ...(pm.controller || {}) }, marketing: { ...p.marketing, ...(pm.marketing || {}) }, accountant: { ...p.accountant, ...(pm.accountant || {}) } }));
                if (nf)
                    setNotifSeen(nf);
                if (mk)
                    setCampaigns(mk);
                if (pk)
                    setPickups(pk);
                if (tk)
                    setZadania(tk);
            }
            catch (e) { }
            finally {
                if (!cancelled)
                    setReady(true);
            }
        })();
        const safety = setTimeout(() => { if (!cancelled)
            setReady(true); }, 1500);
        return () => { cancelled = true; clearTimeout(safety); };
    }, []);
    useEffect(() => { if (ready)
        save("sk_mat_v2", materials); }, [materials, ready]);
    useEffect(() => { if (ready)
        save("sk_tx_v2", txAll); }, [txAll, ready]);
    useEffect(() => { if (ready)
        save("sk_co_v2", company); }, [company, ready]);
    useEffect(() => { if (ready)
        save("sk_disp_v2", dispatchAll); }, [dispatchAll, ready]);
    useEffect(() => { if (ready)
        save("sk_ctrl_v2", controls); }, [controls, ready]);
    useEffect(() => { if (ready)
        save("sk_rep_v2", reports); }, [reports, ready]);
    useEffect(() => { if (ready)
        save("sk_set_v2", settings); }, [settings, ready]);
    useEffect(() => { if (ready)
        save("sk_client_v2", clientProfile); }, [clientProfile, ready]);
    useEffect(() => { if (ready)
        save("sk_users_v2", users); }, [users, ready]);
    useEffect(() => { if (ready)
        save("sk_tasks_v2", zadania); }, [zadania, ready]);
    useEffect(() => { if (ready)
        save("sk_session_v2", session); }, [session, ready]);
    // ── P0: Dziennik zmian (kto, co, kiedy) — przyjęcia, usunięcia, ceny, konta, wydania ──
    const auditPrev = useRef(null);
    useEffect(() => {
        if (!ready) return;
        const prev = auditPrev.current;
        auditPrev.current = { tx, materials, users, dispatch };
        if (!prev) return;
        const who = (users.find((u) => u.id === session) || {}).name || "\u2014";
        const ev = [];
        const ids = (a) => new Set((a || []).map((x) => x.id));
        const matN = (id) => ((materials || []).find((m) => m.id === id) || {}).n || id;
        if (prev.tx !== tx) { const pi = ids(prev.tx), ni = ids(tx); tx.forEach((t) => { if (!pi.has(t.id)) ev.push(["Przyj\u0119cie", `${t.no || ""} · ${pln(txTotal(t))} · ${kg(txMass(t))}`]); }); (prev.tx || []).forEach((t) => { if (!ni.has(t.id)) ev.push(["USUNI\u0118TO przyj\u0119cie", `${t.no || ""} · ${pln(txTotal(t))}`]); }); }
        if (prev.materials !== materials) { const pm = {}; (prev.materials || []).forEach((m) => { pm[m.id] = m; }); materials.forEach((m) => { const o = pm[m.id]; if (!o) ev.push(["Nowy towar w cenniku", m.n]); else if (o.buy !== m.buy || o.sell !== m.sell) ev.push(["Zmiana ceny", `${m.n}: skup ${o.buy} \u2192 ${m.buy} zł/kg, sprzedaż ${o.sell} \u2192 ${m.sell} zł/kg`]); }); const ni = ids(materials); (prev.materials || []).forEach((m) => { if (!ni.has(m.id)) ev.push(["USUNI\u0118TO towar", m.n]); }); }
        if (prev.users !== users) { const pu = {}; (prev.users || []).forEach((u) => { pu[u.id] = u; }); users.forEach((u) => { const o = pu[u.id]; if (!o) ev.push(["Nowe konto", `${u.name} (${ROLE_LABEL[u.role] || u.role})`]); else if (o.role !== u.role) ev.push(["Zmiana roli", `${u.name}: ${ROLE_LABEL[o.role] || o.role} \u2192 ${ROLE_LABEL[u.role] || u.role}`]); }); const ni = ids(users); (prev.users || []).forEach((u) => { if (!ni.has(u.id)) ev.push(["USUNI\u0118TO konto", u.name]); }); }
        if (prev.dispatch !== dispatch) { const pi = ids(prev.dispatch), ni = ids(dispatch); dispatch.forEach((d) => { if (!pi.has(d.id)) ev.push(["Wydanie z magazynu", `${matN(d.matId)}: ${kg(d.w)} \u2192 ${d.contractor || ""}`]); }); (prev.dispatch || []).forEach((d) => { if (!ni.has(d.id)) ev.push(["USUNI\u0118TO wydanie", `${matN(d.matId)}: ${kg(d.w)}`]); }); }
        if (!ev.length || ev.length > 300) return; // masowe operacje (dane pokazowe, import kopii) nie zaśmiecają dziennika
        let log = [];
        try { log = JSON.parse(localStorage.getItem("sk_audit_v1") || "[]"); } catch (e) { }
        const now = Date.now();
        save("sk_audit_v1", [...ev.map(([a, d]) => ({ ts: now, who, a, d })), ...log].slice(0, 3000));
    }, [tx, materials, users, dispatch, ready]);
    // TRYB LOKALNY (bez konta): przy pierwszym uruchomieniu wejdz automatycznie jako wlasciciel.
    // Po recznym wylogowaniu pokazuje juz normalny wybor uzytkownika (flaga sk_local_boot).
    useEffect(() => {
        if (!ready)
            return;
        if (typeof window === "undefined" || window.APP_MODE !== "local")
            return;
        if (session)
            return;
        let booted = null;
        try {
            booted = localStorage.getItem("sk_local_boot");
        }
        catch (e) { }
        if (booted)
            return;
        const own = (users || []).find((u) => u.role === "owner") || (users || [])[0];
        if (own) {
            setSession(own.id);
            try {
                localStorage.setItem("sk_local_boot", "1");
            }
            catch (e) { }
        }
    }, [ready, session, users]);
    useEffect(() => { if (ready)
        save("sk_req_v2", requests); }, [requests, ready]);
    useEffect(() => { if (ready)
        save("sk_perms_v2", perms); }, [perms, ready]);
    useEffect(() => { if (ready)
        save("sk_notif_v2", notifSeen); }, [notifSeen, ready]);
    useEffect(() => { if (ready)
        save("sk_mkt_v2", campaigns); }, [campaigns, ready]);
    useEffect(() => { if (ready)
        save("sk_pick_v2", pickups); }, [pickups, ready]);
    useEffect(() => { if (ready && buyersLoaded.current && ownerRef.current)
        save("sk_buyers_v1", buyers); }, [buyers, ready]);
    const mm = useMemo(() => matMap(materials), [materials]);
    const stock = useMemo(() => {
        const s = {};
        materials.forEach((m) => { s[m.id] = m.stock; });
        tx.forEach((t) => t.pos.forEach((p) => { s[p.matId] = (s[p.matId] || 0) + p.w; }));
        dispatch.forEach((d) => { s[d.matId] = (s[d.matId] || 0) - d.w; });
        return s;
    }, [materials, tx, dispatch]);
    const buildReport = (dayKey) => {
        const list = tx.filter((x) => fmtDateKey(x.ts) === dayKey);
        const disp = dispatch.filter((d) => d.dateKey === dayKey);
        const byMat = {};
        let totMass = 0, totVal = 0;
        list.forEach((x) => x.pos.forEach((p) => { if (!byMat[p.n])
            byMat[p.n] = { w: 0, v: 0, g: p.g }; byMat[p.n].w += p.w; byMat[p.n].v += p.w * p.price; totMass += p.w; totVal += p.w * p.price; }));
        const sumPay = (k) => list.filter((x) => x.payment === k).reduce((a, x) => a + txTotal(x), 0);
        const r1 = (x) => Math.round(x * 10) / 10;
        let t = "";
        t += "========================================\n";
        t += "  RAPORT DZIENNY\n";
        t += "  " + company.name + "\n";
        t += "  Data: " + dayKey + "\n";
        t += "========================================\n\n";
        t += "PODSUMOWANIE\n";
        t += "  Liczba przyjec:     " + list.length + "\n";
        t += "  Masa skupiona:      " + r1(totMass) + " kg\n";
        t += "  Wyplacono lacznie:  " + totVal.toFixed(2) + " zl\n";
        t += "    - gotowka:        " + sumPay("gotowka").toFixed(2) + " zl\n";
        t += "    - przelew:        " + sumPay("przelew").toFixed(2) + " zl\n";
        t += "    - BLIK:           " + sumPay("blik").toFixed(2) + " zl\n\n";
        t += "SKUP WG SUROWCA\n";
        if (!Object.keys(byMat).length)
            t += "  (brak)\n";
        Object.entries(byMat).forEach(([n, o]) => { t += "  " + (C[o.g] ? C[o.g].code : "      ") + "  " + padR(n, 30) + padL(r1(o.w), 8) + " kg " + padL(o.v.toFixed(2), 11) + " zl\n"; });
        t += "\n";
        if (disp.length) {
            t += "WYDANIA DO KONTRAHENTA\n";
            disp.forEach((d) => { t += "  " + padR((mm[d.matId] ? mm[d.matId].n : d.matId), 30) + padL(r1(d.w), 8) + " kg  -> " + d.contractor + "\n"; });
            t += "\n";
        }
        t += "DOKUMENTY\n";
        if (!list.length)
            t += "  (brak)\n";
        list.slice().reverse().forEach((x) => { t += "  " + padR(x.no, 20) + " " + padR(supplierName(x), 24) + padL(r1(txMass(x)), 7) + " kg " + padL(txTotal(x).toFixed(2), 10) + " zl  (" + PAY[x.payment].label + ")\n"; });
        t += "\n----------------------------------------\n";
        t += "Wygenerowano: " + new Date().toLocaleString("pl-PL") + "\n";
        return t;
    };
    const generateReport = (dayKey) => {
        const text = buildReport(dayKey);
        setReports((prev) => [{ id: uid(), dayKey, text, ts: Date.now() }, ...prev.filter((r) => r.dayKey !== dayKey)].slice(0, 60));
        return text;
    };
    // auto daily report at the set hour (while app is open)
    useEffect(() => {
        if (!ready || !settings.reportOn)
            return;
        const check = () => {
            const n = new Date();
            const hhmm = pad(n.getHours()) + ":" + pad(n.getMinutes());
            const dk = fmtDateKey(Date.now());
            if (settings.reportHour && hhmm >= settings.reportHour && !reports.some((r) => r.dayKey === dk)) {
                generateReport(dk);
                setToast({ msg: "Raport dnia (" + dk + ") zapisany. Pobierz w sekcji Raport." });
            }
        };
        check();
        const iv = setInterval(check, 20000);
        return () => clearInterval(iv);
    }, [ready, settings, reports, tx, dispatch]);
    // powiadomienia personelu o zgłoszeniach klientów
    const notifInit = useRef(false);
    const reqIdsRef = useRef(null);
    useEffect(() => {
        if (!ready)
            return;
        const cu = users.find((u) => u.id === session) || null;
        if (!cu || cu.role === "client") {
            notifInit.current = false;
            reqIdsRef.current = null;
            return;
        }
        const relevant = cu.role === "owner" || (perms[cu.role] && perms[cu.role].requests);
        if (!relevant) {
            reqIdsRef.current = new Set(requests.map((r) => r.id));
            return;
        }
        const cur = new Set(requests.map((r) => r.id));
        if (!notifInit.current) {
            notifInit.current = true;
            reqIdsRef.current = cur;
            const lastSeen = notifSeen[cu.id] || 0;
            const unread = requests.filter((r) => r.ts > lastSeen).length;
            if (settings.notif && unread > 0)
                fireNotif("SkupOS — skup", `Masz ${unread} ${unread === 1 ? "nowe zgłoszenie" : "nowych zgłoszeń"} klientów`);
            return;
        }
        const fresh = requests.filter((r) => !reqIdsRef.current.has(r.id));
        reqIdsRef.current = cur;
        if (fresh.length) {
            if (settings.notif)
                fireNotif("Nowe zgłoszenie klienta", fresh[0].clientName + (fresh.length > 1 ? ` (+${fresh.length - 1})` : ""));
            setToast({ msg: "Nowe zgłoszenie: " + fresh[0].clientName });
        }
    }, [requests, ready, session, users, perms, settings.notif, notifSeen]);
    const nextNo = (kind) => {
        const d = now();
        const pre = `${kind}/${d.getFullYear()}/${pad(d.getMonth() + 1)}/`;
        const n = txAll.filter((t) => t.kind === kind).length + (kind === "FPO" ? 8 : 12);
        return pre + pad(n).padStart(4, "0");
    };
    const commitIntake = (data) => {
        const t = { id: uid(), no: nextNo(data.kind), ts: Date.now(), ...(punktOk ? { punkt: punktOk } : {}), ...data };
        setTx((p) => [t, ...p]);
        return t;
    };
    const [theme, setThemeS] = useState(() => { try { return localStorage.getItem("sk_theme") || "light"; } catch (e) { return "light"; } });
    const [big, setBigS] = useState(() => { try { return localStorage.getItem("sk_big") === "1"; } catch (e) { return false; } });
    const setTheme = (t) => { setThemeS(t); try { localStorage.setItem("sk_theme", t); } catch (e) { } };
    const setBig = (b) => { setBigS(b); try { localStorage.setItem("sk_big", b ? "1" : "0"); } catch (e) { } };
    const loadDemo = () => { setMaterials(seedMaterials()); const _dt = demoTransactions(); setTx(_dt); setDispatch(demoDispatch(_dt)); setPickups(demoPickups()); setZadania(demoTasks(users)); setTab("home"); };
    const clearDemo = () => { setTx([]); setPickups([]); setZadania([]); setMaterials((prev) => prev.map((m) => ({ ...m, stock: 0 }))); };
    if (!ready) {
        return (React.createElement("div", { style: rootBase },
            React.createElement("style", null, CSS),
            React.createElement("div", { className: "sk-root", style: { minHeight: "100vh", display: "grid", placeItems: "center" } },
                React.createElement("div", { style: { textAlign: "center" } },
                    React.createElement("div", { style: { fontFamily: "var(--display)", fontWeight: 800, fontSize: 22, letterSpacing: "-.02em" } }, "SkupOS"),
                    React.createElement("div", { style: { color: "var(--muted)", fontSize: 14.5, marginTop: 6 } }, "Wczytywanie\u2026")))));
    }
    const currentUser = users.find((u) => u.id === session) || null;
    const logout = () => { if (typeof window !== "undefined" && window.__cloudLogout) {
        window.__cloudLogout();
        return;
    } setSession(null); setMode("operator"); setTab("home"); };
    const enableNotif = async () => { const p = await askNotifPermission(); setSettings((s) => ({ ...s, notif: p === "granted" })); };
    if (!currentUser) {
        // Tryb chmury: lokalny ekran logowania (login/hasło z pamięci telefonu) nie ma tu sensu —
        // sesja się rozjechała, więc wracamy do prawdziwego logowania e-mailem.
        if (typeof window !== "undefined" && window.__cloudLogout)
            return (React.createElement("div", { style: rootBase },
                React.createElement("style", null, CSS),
                React.createElement(CloudRelogin, null)));
        return (React.createElement("div", { style: rootBase },
            React.createElement("style", null, CSS),
            React.createElement(Login, { users: users, onLogin: (id) => setSession(id) })));
    }
    // konto klienta → panel klienta
    if (currentUser.role === "client") {
        return (React.createElement("div", { style: rootBase },
            React.createElement("style", null, CSS),
            React.createElement(ClientApp, { materials: materials, tx: tx, clientProfile: clientProfile, setClientProfile: setClientProfile, requests: requests, setRequests: setRequests, account: currentUser, onLogout: logout, notifSeen: notifSeen, setNotifSeen: setNotifSeen, notifOn: settings.notif, onEnableNotif: enableNotif })));
    }
    // podgląd panelu klienta (tylko właściciel)
    if (mode === "client") {
        return (React.createElement("div", { style: rootBase },
            React.createElement("style", null, CSS),
            React.createElement(ClientApp, { materials: materials, tx: tx, clientProfile: clientProfile, setClientProfile: setClientProfile, requests: requests, setRequests: setRequests, preview: true, onExit: () => setMode("operator"), notifSeen: notifSeen, setNotifSeen: setNotifSeen, notifOn: settings.notif, onEnableNotif: enableNotif })));
    }
    const isOwner = currentUser.role === "owner";
    ownerRef.current = isOwner;
    const rolePerms = perms[currentUser.role] || {};
    const can = (k) => isOwner ? true : !!rolePerms[k];
    const newReqCount = requests.filter((r) => r.status === "new").length;
    const myLastSeen = notifSeen[currentUser.id] || 0;
    const notifItems = (isOwner || can("requests"))
        ? requests.filter((r) => r.ts > myLastSeen).slice().sort((a, b) => b.ts - a.ts).map((r) => ({ id: r.id, ts: r.ts, title: "Nowe zgłoszenie / wycena", body: (r.clientName || "Klient") + (r.plate ? " · " + r.plate : "") }))
        : [];
    const markNotifsRead = () => setNotifSeen((s) => ({ ...s, [currentUser.id]: Date.now() }));
    const NAV = [
        { id: "home", label: "Dzi\u015B", icon: Scale },
        ...(can("cennikView") ? [{ id: "cennik", label: "Ceny", icon: Coins }] : []),
        ...(can("magazyn") ? [{ id: "mag", label: "Magazyn", icon: Warehouse }] : []),
        ...(can("transactions") ? [{ id: "tx", label: "Przyj\u0119cia", icon: Receipt }] : []),
        ...(isOwner ? [{ id: "intel", label: "Wynik", icon: TrendingUp }] : []),
        ...(can("accounting") ? [{ id: "ksieg", label: "Papiery i podatki", icon: Calculator }] : []),
        { id: "zadania", label: "Zadania", icon: BadgeCheck },
        ...(can("requests") ? [{ id: "req", label: "Zg\u0142oszenia", icon: Inbox }] : []),
        ...(isOwner ? [{ id: "kopia", label: "Eksport, kopia, dziennik", icon: ShieldCheck }] : []),
        ...(isOwner && typeof window !== "undefined" && window.__cloudPunkty ? [{ id: "punkty", label: "Punkty skupu", icon: MapPin }] : []),
        ...((can("marketing") || can("accounting")) ? [{ id: "nadzorca", label: "Podpowiedzi", icon: AlertTriangle }] : []),
        ...((can("marketing") || can("accounting")) ? [{ id: "ai", label: "Doradca AI", icon: Sparkles }] : []),
        ...(can("pickups") ? [{ id: "wyw", label: "Wywozy", icon: Truck }] : []),
        ...(can("cennikView") ? [{ id: "konkur", label: "Konkurencja", icon: MapPin }] : []),
        ...(SK_EXTRA && can("marketing") ? [{ id: "social", label: "Social / ceny", icon: Megaphone }] : []),
        ...(SK_EXTRA && can("marketing") ? [{ id: "mkt", label: "Marketing", icon: Megaphone }] : []),
    ];
    const activeTab = NAV.some((n) => n.id === tab) ? tab : "home";
    const hasMag = NAV.some((n) => n.id === "mag");
    const PRIMARY = ["home", "cennik", "mag", ...(hasMag ? [] : ["wyw"])];
    const MERGED = [...(hasMag ? ["wyw"] : []), "konkur"]; // wywozy → w Magazynie, konkurencja → w Cenach
    const primaryTabs = NAV.filter((n) => PRIMARY.includes(n.id));
    const moreTabs = NAV.filter((n) => !PRIMARY.includes(n.id) && !MERGED.includes(n.id));
    const tabOn = (id) => activeTab === id || (id === "mag" && activeTab === "wyw" && hasMag) || (id === "cennik" && activeTab === "konkur");
    const moreActive = moreTabs.some((n) => n.id === activeTab);
    const segBar = (items) => React.createElement(SegBar, { items: items.filter(([id]) => NAV.some((n) => n.id === id)), active: activeTab, onPick: setTab });
    return (React.createElement("div", { style: { ...rootBase, background: theme === "light" ? "#f4f2ee" : rootBase.background } },
        React.createElement("style", null, CSS),
        React.createElement("div", { className: "sk-root" + (theme === "light" ? " sk-light" : "") + (big ? " sk-big" : ""), style: { minHeight: "100vh", maxWidth: 480, margin: "0 auto", position: "relative", paddingBottom: 150 } },
            toast && React.createElement(Toast, { msg: toast.msg, onClose: () => setToast(null) }),
            usersOpen && React.createElement(UsersManager, { users: users, setUsers: setUsers, currentUser: currentUser, onClose: () => setUsersOpen(false) }),
            permsOpen && React.createElement(PermsManager, { perms: perms, setPerms: setPerms, onClose: () => setPermsOpen(false) }),
            React.createElement("div", { key: activeTab, className: "sk-main", style: { animation: "slideFade .34s cubic-bezier(.22,1,.36,1)" } },
                hasMag && (activeTab === "mag" || activeTab === "wyw") && segBar([["mag", "Stan magazynu"], ["wyw", "Wywozy"]]),
                (activeTab === "cennik" || activeTab === "konkur") && segBar([["cennik", "M\u00F3j cennik"], ["konkur", "Ceny u konkurencji"]]),
                isOwner && punkty.length > 0 && React.createElement(PunktSwitch, { punkty, value: punktOk, onChange: setPunktSel }),
                activeTab === "punkty" && isOwner && React.createElement(PunktyPanel, { punkty, savePunkty, users, setUsers, punktSel: punktOk, setPunktSel }),
                activeTab === "home" && currentUser?.role === "kierowca" && React.createElement(KierowcaHome, { pickups: pickups, setPickups: setPickups, currentUser: currentUser }),
                activeTab === "home" && currentUser?.role !== "kierowca" && React.createElement(Pulpit, { tx, dispatch, mm, materials, stock, company, setCompany, openIntake: () => setIntakeOpen(true), setViewDoc, setTab, controls, setControls, settings, setSettings, reports, generateReport, currentUser, isOwner, can, onLogout: logout, openUsers: () => setUsersOpen(true), openPerms: () => setPermsOpen(true), openClient: () => setMode("client"), newReqCount, notifItems, notifCount: notifItems.length, markNotifsRead, notifOn: settings.notif, onEnableNotif: enableNotif, loadDemo, clearDemo }),
                activeTab === "tx" && can("transactions") && React.createElement(Transakcje, { tx, setViewDoc }),
                activeTab === "cennik" && can("cennikView") && React.createElement(Cennik, { materials, setMaterials, canEdit: can("cennikEdit"), company, showMargin: isOwner }),
                activeTab === "intel" && can("cennikView") && React.createElement(InteligencjaCen, { materials, setMaterials, stock }),
                activeTab === "mag" && can("magazyn") && React.createElement(Magazyn, { materials, stock, mm, dispatch, setDispatch, buyers, setBuyers, isOwner, punkt: punktOk }),
                activeTab === "mkt" && can("marketing") && React.createElement(Marketing, { requests, materials, campaigns, setCampaigns, tx, company }),
                activeTab === "wyw" && can("pickups") && React.createElement(Wywozy, { pickups, setPickups }),
                activeTab === "ksieg" && can("accounting") && React.createElement(Ksiegowosc, { tx, dispatch, materials, stock, company }),
                activeTab === "ai" && (can("marketing") || can("accounting")) && React.createElement(DoradcaBiznesowy, { materials, company, tx }),
                activeTab === "nadzorca" && (can("marketing") || can("accounting")) && React.createElement(NadzorcaAI, { tx: tx, materials: materials }),
                activeTab === "social" && can("marketing") && React.createElement(SocialAuto, { materials: materials, company: company }),
                activeTab === "konkur" && can("cennikView") && React.createElement(KonkurencjaView, { materials: materials }),
                activeTab === "kopia" && isOwner && React.createElement(KopiaDziennik, { tx: txAll, materials, stock, dispatch: dispatchAll }),
                activeTab === "zadania" && React.createElement(Zadania, { zadania, setZadania, users, currentUser, isOwner }),
                activeTab === "req" && can("requests") && React.createElement(RequestsInbox, { requests, setRequests, mm })),
            (() => {
                const canIn = isOwner || can("intake") || currentUser.role === "operator";
                const btn = (key, on, Ic, lbl, onClick) => React.createElement("button", { key, onClick, style: { position: "relative", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, minHeight: 58, padding: 0, color: on ? "var(--copper)" : "var(--muted)" } },
                    React.createElement("span", { style: { display: "grid", placeItems: "center", width: 50, height: 30, borderRadius: 99, background: on ? "var(--copperSoft)" : "transparent", transition: "background .25s ease" } },
                        React.createElement(Ic, { size: 21, strokeWidth: on ? 2.5 : 2 })),
                    React.createElement("span", { style: { fontSize: 12, fontWeight: on ? 800 : 600, letterSpacing: "-.01em" } }, lbl));
                const items = primaryTabs.map((n) => btn(n.id, tabOn(n.id), n.icon, n.label, () => setTab(n.id)));
                if (moreTabs.length) items.push(btn("more", moreActive, MoreHorizontal, isOwner ? "Szef" : "Wi\u0119cej", () => setMoreOpen(true)));
                if (canIn) items.splice(Math.min(2, items.length), 0, React.createElement("button", { key: "intake", onClick: () => setIntakeOpen(true), "aria-label": "Nowe przyj\u0119cie", className: "sk-fab", style: { background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: 0, color: "var(--copper)", marginTop: -28 } },
                    React.createElement("span", { style: { width: 64, height: 64, borderRadius: 22, display: "grid", placeItems: "center", background: "var(--grad)", color: "#fff", boxShadow: "0 14px 26px -8px rgba(180,80,27,.6), 0 0 0 5px var(--bg)", transition: "transform .15s ease" } },
                        React.createElement(Plus, { size: 30, strokeWidth: 3 })),
                    React.createElement("span", { style: { fontSize: 12, fontWeight: 800 } }, "Przyj\u0119cie")));
                return React.createElement("nav", { className: "sk-nav", style: { position: "fixed", bottom: "calc(10px + env(safe-area-inset-bottom))", left: 12, right: 12, zIndex: 40, maxWidth: 456, margin: "0 auto", background: "var(--navbg)", backdropFilter: "blur(22px) saturate(1.6)", WebkitBackdropFilter: "blur(22px) saturate(1.6)", border: "1px solid var(--line)", borderRadius: 26, boxShadow: "0 16px 36px -14px rgba(16,24,40,.35)", display: "grid", gridTemplateColumns: `repeat(${items.length},1fr)`, alignItems: "end", padding: "6px 4px" } }, items);
            })(),
            (typeof window !== "undefined" && window.APP_MODE === "local") && React.createElement("button", { onClick: () => setSwitcherOpen(true), className: "sk-switcher", style: { position: "fixed", bottom: 104, left: 12, zIndex: 46, display: "flex", alignItems: "center", gap: 7, padding: "9px 13px", borderRadius: 99, border: "1px solid rgba(124,111,155,.5)", background: "rgba(124,111,155,.18)", backdropFilter: "blur(8px)", color: "#9b8fc0", fontSize: 13.5, fontWeight: 800, cursor: "pointer" } },
                React.createElement(RefreshCw, { size: 14 }),
                " ",
                currentUser ? ROLE_LABEL[currentUser.role] : "Role"),
            React.createElement(Sheet, { open: switcherOpen, onClose: () => setSwitcherOpen(false), title: "Prze\u0142\u0105cz profil (test)" },
                React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", lineHeight: 1.5, marginBottom: 14, padding: "10px 12px", background: "rgba(124,111,155,.1)", borderRadius: 10, border: "1px solid rgba(124,111,155,.3)" } }, "\uD83E\uDDEA Narz\u0119dzie testowe \u2014 wskocz w dowoln\u0105 rol\u0119, by sprawdzi\u0107, co widzi. W wersji produkcyjnej to zniknie (ka\u017Cdy loguje si\u0119 w\u0142asnym kontem)."),
                users.filter((u) => u.role !== "client").map((u) => {
                    const on = u.id === session;
                    return (React.createElement("button", { key: u.id, onClick: () => { setSession(u.id); setMode("operator"); setTab("home"); setSwitcherOpen(false); }, style: { width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 13, marginBottom: 9, cursor: "pointer", border: on ? "1.5px solid var(--copper)" : "1px solid var(--line2)", background: on ? "rgba(200,116,63,.1)" : "var(--surface)", textAlign: "left" } },
                        React.createElement("div", { style: { width: 38, height: 38, borderRadius: 10, background: "rgba(200,116,63,.12)", display: "grid", placeItems: "center", flexShrink: 0 } },
                            React.createElement(Users, { size: 18, color: "var(--copper)" })),
                        React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                            React.createElement("div", { style: { fontSize: 14, fontWeight: 700 } }, u.name),
                            React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)" } },
                                ROLE_LABEL[u.role],
                                " \u00B7 @",
                                u.login)),
                        on && React.createElement(Check, { size: 18, color: "var(--copper)" })));
                }),
                React.createElement("button", { onClick: () => { setMode("client"); setSwitcherOpen(false); }, style: { width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 13, marginTop: 4, cursor: "pointer", border: "1px solid rgba(63,125,138,.35)", background: "rgba(63,125,138,.08)", textAlign: "left" } },
                    React.createElement("div", { style: { width: 38, height: 38, borderRadius: 10, background: "rgba(63,125,138,.13)", display: "grid", placeItems: "center", flexShrink: 0 } },
                        React.createElement(Smartphone, { size: 18, color: "#3f7d8a" })),
                    React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                        React.createElement("div", { style: { fontSize: 14, fontWeight: 700 } }, "Panel klienta"),
                        React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)" } }, "Aplikacja dla klienta skupu (demo)")))),
            backHint && (React.createElement("div", { style: { position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", zIndex: 100, background: "rgba(20,24,30,.96)", color: "#fff", padding: "11px 18px", borderRadius: 99, fontSize: 14.5, fontWeight: 600, border: "1px solid var(--line2)", boxShadow: "0 8px 24px rgba(0,0,0,.45)" } }, "Naci\u015Bnij wstecz ponownie, aby wyj\u015B\u0107")),
            moreOpen && React.createElement(KategoriePanel, { nav: moreTabs, activeTab: activeTab, onPick: setTab, onClose: () => setMoreOpen(false), isOwner, theme, setTheme, big, setBig, onLogout: logout }),
            intakeOpen && React.createElement(Intake, { materials, mm, company, tx, onClose: () => setIntakeOpen(false), commitIntake }),
            viewDoc && React.createElement(DocOverlay, { tx: viewDoc, company: company, onClose: () => setViewDoc(null), onDelete: (id) => { setTx((p) => p.filter((t) => t.id !== id)); setViewDoc(null); } }))));
}
/* ─────────── Panel kategorii (szybki, artystyczny przełącznik sekcji) ─────────── */
const CAT_COLORS = {
    home: "#d08249", tx: "#22c55e", cennik: "#e0a13f", intel: "#a78bfa",
    kopia: "#0ea5e9", mag: "#38bdf8", wyw: "#2dd4bf", zadania: "#f472b6", mkt: "#fb923c",
    ksieg: "#818cf8", ai: "#facc15", req: "#34d399", nadzorca: "#f87171", social: "#60a5fa", konkur: "#2dd4bf",
};
const CAT_DESC = { tx: "Lista kwitów FPO i KPO", intel: "Marże, ceny, opłacalność", ksieg: "BDO, KPO, eksport dla księgowej", zadania: "Co do zrobienia w zespole", req: "Prośby klientów o wycenę i odbiór", kopia: "Excel, kopia danych, historia zmian", nadzorca: "Anomalie i rzeczy do sprawdzenia", ai: "Zapytaj o ceny, marże, strategię", mag: "Stan i wartość towaru", cennik: "Ceny skupu", wyw: "Odbiory i transport", mkt: "Kampanie i klienci", social: "Posty i media", konkur: "Ceny konkurencji" };
function KategoriePanel({ nav, activeTab, onPick, onClose, isOwner, theme, setTheme, big, setBig, onLogout }) {
    useEffect(() => { const k = (e) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
    return (React.createElement("div", { onClick: onClose, className: "sk-kat-ov", style: { position: "fixed", inset: 0, zIndex: 90, background: "rgba(8,11,15,.62)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "fade .22s ease" } },
        React.createElement("div", { onClick: (e) => e.stopPropagation(), className: "sk-kat", style: { width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto", overscrollBehavior: "contain", background: "var(--surface)", borderRadius: "28px 28px 0 0", border: "1px solid var(--line)", borderBottom: "none", padding: "10px 18px calc(26px + env(safe-area-inset-bottom))", boxShadow: "0 -22px 64px -22px rgba(0,0,0,.65)", animation: "sheetUp .44s cubic-bezier(.22,1,.36,1)" } },
            React.createElement("div", { style: { width: 42, height: 5, borderRadius: 99, background: "var(--line2)", margin: "0 auto 16px" } }),
            React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, padding: "0 2px" } },
                React.createElement("div", null,
                    React.createElement("div", { style: { fontFamily: "var(--display)", fontSize: 21, fontWeight: 800, letterSpacing: "-.01em" } }, isOwner ? "Szef" : "Wi\u0119cej"),
                    React.createElement("div", { style: { fontSize: 14.5, color: "var(--muted)", marginTop: 1 } }, isOwner ? "Wyniki, papiery, zesp\u00F3\u0142 i ustawienia" : "Pozosta\u0142e sekcje")),
                React.createElement("button", { onClick: onClose, style: iconBtn },
                    React.createElement(X, { size: 18 }))),
            React.createElement("div", { className: "sk-kat-grid", style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 8 } }, nav.map((n, i) => {
                const Ic = n.icon;
                const on = activeTab === n.id;
                const col = CAT_COLORS[n.id] || "var(--copper)";
                return (React.createElement("button", { key: n.id, onClick: () => { onPick(n.id); onClose(); }, className: "sk-kat-item", style: { display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", minHeight: 60, textAlign: "left", borderRadius: 14, cursor: "pointer", background: on ? (col + "14") : "var(--surface2)", border: on ? ("1.5px solid " + col) : "1px solid var(--line)", animation: "rise .32s both", animationDelay: (i * 0.025) + "s" } },
                    React.createElement("div", { style: { width: 40, height: 40, flex: "0 0 40px", borderRadius: 12, display: "grid", placeItems: "center", background: col + "1f" } },
                        React.createElement(Ic, { size: 20, color: col, strokeWidth: 2.2 })),
                    React.createElement("div", { style: { minWidth: 0, flex: 1 } },
                        React.createElement("div", { style: { fontSize: 15, fontWeight: 800, color: "var(--text)", lineHeight: 1.2 } }, n.label),
                        CAT_DESC[n.id] && React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)", marginTop: 2, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, CAT_DESC[n.id])),
                    React.createElement(ChevronRight, { size: 16, color: "var(--faint)" })));
            })),
            isOwner && typeof window !== "undefined" && window.__cloudInvite && React.createElement("button", { onClick: () => { onClose(); window.__cloudInvite(); }, style: { marginTop: 18, width: "100%", minHeight: 52, borderRadius: 14, cursor: "pointer", fontSize: 15, fontWeight: 800, border: "1.5px solid var(--copper)", background: "var(--copperSoft)", color: "var(--copper)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 } }, React.createElement(Users, { size: 18 }), "Zaproś pracownika lub klienta"),
            onLogout && React.createElement("button", { onClick: () => { onClose(); onLogout(); }, style: { marginTop: 18, width: "100%", minHeight: 52, borderRadius: 14, cursor: "pointer", fontSize: 15, fontWeight: 800, border: "1px solid rgba(220,38,38,.35)", background: "transparent", color: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 } }, React.createElement(LogOut, { size: 17 }), " Wyloguj"),
            setTheme && (React.createElement("div", { style: { marginTop: 22, paddingTop: 16, borderTop: "1px solid var(--line)", display: "grid", gap: 10 } },
                React.createElement("div", { style: { fontSize: 13.5, fontWeight: 700, color: "var(--muted)", letterSpacing: ".06em", textTransform: "uppercase" } }, "Wygl\u0105d"),
                React.createElement("div", { style: { display: "flex", gap: 8 } }, [["light", "Jasny (plac, s\u0142o\u0144ce)"], ["dark", "Ciemny"]].map(([k, l]) => React.createElement("button", { key: k, onClick: () => setTheme(k), style: { flex: 1, minHeight: 48, borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 700, border: theme === k ? "2px solid var(--copper)" : "1px solid var(--line2)", background: theme === k ? "rgba(200,116,63,.12)" : "var(--surface2)", color: theme === k ? "var(--copper)" : "var(--text)" } }, l))),
                React.createElement("button", { onClick: () => setBig(!big), style: { minHeight: 48, borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 700, border: big ? "2px solid var(--copper)" : "1px solid var(--line2)", background: big ? "rgba(200,116,63,.12)" : "var(--surface2)", color: big ? "var(--copper)" : "var(--text)" } }, big ? "Du\u017Cy tekst: w\u0142\u0105czony" : "Du\u017Cy tekst: wy\u0142\u0105czony"))))));
}
/* ─────────── P0: Eksport do Excela, kopia zapasowa, dziennik zmian ─────────── */
const csvDownload = (name, header, rows) => {
    const esc = (v) => { const x = v == null ? "" : String(v); return /[;"\n\r]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; };
    const txt = "\uFEFF" + [header, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([txt], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
};
const numPL = (n, d = 2) => (Math.round((+n || 0) * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d).replace(".", ",");
const BACKUP_SKIP = ["sk_session_v2", "sk_cloud_prof", "sk_pending_setup", "sk_local_boot"];
function KopiaDziennik({ tx, materials, stock, dispatch }) {
    const [msg, setMsg] = useState("");
    const [filter, setFilter] = useState("");
    const [restore, setRestore] = useState(null);
    const today = new Date().toISOString().slice(0, 10);
    const log = (() => { try { return JSON.parse(localStorage.getItem("sk_audit_v1") || "[]"); } catch (e) { return []; } })();
    const shown = log.filter((e) => !filter || (e.a + " " + e.d + " " + e.who).toLowerCase().includes(filter.toLowerCase())).slice(0, 300);
    const matN = (id) => ((materials || []).find((m) => m.id === id) || {}).n || id;
    const expTx = () => { const rows = []; (tx || []).slice().sort((a, b) => a.ts - b.ts).forEach((t) => (t.pos || []).forEach((p) => rows.push([t.no, new Date(t.ts).toLocaleString("pl-PL"), t.kind, t.osoba ? `${t.osoba.imie || ""} ${t.osoba.nazwisko || ""}`.trim() : (t.firma ? t.firma.nazwa : ""), t.firma ? t.firma.nip : "", t.plate || "", p.n, numPL(p.w, 1), numPL(p.price), numPL(p.w * p.price), t.payment || ""]))); csvDownload(`SkupOS_przyjecia_${today}.csv`, ["Nr dokumentu", "Data", "Rodzaj", "Klient", "NIP", "Rejestracja", "Towar", "Masa kg", "Cena zł/kg", "Wartość zł", "Płatność"], rows); setMsg(`Pobrano ${rows.length} pozycji przyjęć.`); };
    const expKlienci = () => { const by = {}; (tx || []).forEach((t) => { const k = t.firma ? "F:" + (t.firma.nip || t.firma.nazwa) : "O:" + ((t.osoba && t.osoba.dowod) || (t.osoba && t.osoba.nazwisko) || t.plate); const r = by[k] || (by[k] = { n: t.firma ? t.firma.nazwa : `${(t.osoba || {}).imie || ""} ${(t.osoba || {}).nazwisko || ""}`.trim(), typ: t.firma ? "Firma" : "Osoba", nip: t.firma ? t.firma.nip : "", plate: t.plate || "", wiz: 0, kg: 0, zl: 0, last: 0 }); r.wiz++; r.kg += txMass(t); r.zl += txTotal(t); r.last = Math.max(r.last, t.ts); }); const rows = Object.values(by).sort((a, b) => b.zl - a.zl).map((r) => [r.n, r.typ, r.nip, r.plate, r.wiz, numPL(r.kg, 1), numPL(r.zl), new Date(r.last).toLocaleDateString("pl-PL")]); csvDownload(`SkupOS_klienci_${today}.csv`, ["Klient", "Typ", "NIP", "Ostatnia rejestracja", "Wizyty", "Masa kg", "Wartość zł", "Ostatnia wizyta"], rows); setMsg(`Pobrano ${rows.length} klientów.`); };
    const expMag = () => { const rows = (materials || []).map((m) => [m.n, m.g, numPL(stock[m.id] || 0, 1), numPL(m.buy), numPL(m.sell), numPL((stock[m.id] || 0) * m.buy), numPL((stock[m.id] || 0) * (m.sell || 0))]); csvDownload(`SkupOS_magazyn_${today}.csv`, ["Towar", "Grupa", "Stan kg", "Cena skupu", "Cena sprzedaży", "Wartość (skup)", "Wartość (sprzedaż)"], rows); setMsg(`Pobrano stan ${rows.length} towarów.`); };
    const expWyd = () => { const rows = (dispatch || []).slice().sort((a, b) => a.ts - b.ts).map((d) => [d.dateKey, matN(d.matId), numPL(d.w, 1), d.contractor || ""]); csvDownload(`SkupOS_wydania_${today}.csv`, ["Data", "Towar", "Masa kg", "Odbiorca"], rows); setMsg(`Pobrano ${rows.length} wydań.`); };
    const expLog = () => { csvDownload(`SkupOS_dziennik_zmian_${today}.csv`, ["Data i godzina", "Kto", "Zdarzenie", "Szczegóły"], log.map((e) => [new Date(e.ts).toLocaleString("pl-PL"), e.who, e.a, e.d])); setMsg(`Pobrano ${log.length} wpisów dziennika.`); };
    const backup = () => {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf("sk_") === 0 && BACKUP_SKIP.indexOf(k) === -1) data[k] = localStorage.getItem(k); }
        const blob = new Blob([JSON.stringify({ app: "SkupOS", v: 1, created: new Date().toISOString(), data }, null, 1)], { type: "application/json" });
        const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `SkupOS_kopia_${today}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
        try { localStorage.setItem("sk_last_backup", String(Date.now())); } catch (e) { }
        setMsg(`Kopia zapisana: ${Object.keys(data).length} zbiorów danych. Trzymaj plik w bezpiecznym miejscu (dysk, e-mail do siebie).`);
    };
    const pickFile = (e) => {
        const f = e.target.files && e.target.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = () => { try { const j = JSON.parse(r.result); if (j.app !== "SkupOS" || !j.data) throw new Error("x"); setRestore(j); } catch (err) { setMsg("To nie jest plik kopii SkupOS."); } };
        r.readAsText(f); e.target.value = "";
    };
    const doRestore = () => {
        const st = (typeof window !== "undefined" && window.storage) || null;
        Object.entries(restore.data).forEach(([k, v]) => { if (BACKUP_SKIP.indexOf(k) !== -1) return; try { if (st && st.set) st.set(k, v); else localStorage.setItem(k, v); } catch (e) { } });
        setRestore(null); setMsg("Przywrócono kopię. Odświeżam aplikację\u2026"); setTimeout(() => { try { location.reload(); } catch (e) { } }, 900);
    };
    const lastB = (() => { try { return +localStorage.getItem("sk_last_backup") || 0; } catch (e) { return 0; } })();
    const days = lastB ? Math.floor((Date.now() - lastB) / 86400000) : null;
    const row = (Ic, title, sub, onClick) => React.createElement("button", { onClick, style: { width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "14px 4px", background: "none", border: "none", borderTop: "1px solid var(--line)", cursor: "pointer", color: "var(--text)", textAlign: "left" } },
        React.createElement("span", { style: { width: 42, height: 42, borderRadius: 13, background: "var(--copperSoft)", display: "grid", placeItems: "center", flexShrink: 0 } }, React.createElement(Ic, { size: 20, color: "var(--copper)" })),
        React.createElement("span", { style: { flex: 1 } }, React.createElement("div", { style: { fontWeight: 700, fontSize: 16 } }, title), React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 2 } }, sub)),
        React.createElement(ChevronRight, { size: 19, color: "var(--faint)" }));
    return (React.createElement("div", { style: { padding: "0 16px" } },
        React.createElement("header", { style: { paddingTop: 24 } },
            React.createElement("h1", { style: { margin: 0, fontFamily: "var(--display)", fontSize: 26, fontWeight: 800 } }, "Eksport, kopia, dziennik"),
            React.createElement("div", { style: { color: "var(--muted)", fontSize: 15, marginTop: 2 } }, "Twoje dane zawsze w Twoich r\u0119kach")),
        msg && React.createElement("div", { style: { marginTop: 14, padding: "12px 14px", borderRadius: 14, background: "rgba(34,197,94,.12)", color: "var(--text)", fontSize: 14.5, fontWeight: 600 } }, msg),
        React.createElement("div", { style: sectionTitle }, "Eksport do Excela"),
        React.createElement(Card, { pad: 12 },
            React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", padding: "2px 4px 10px" } }, "Pliki CSV otwieraj\u0105 si\u0119 w Excelu z polskimi znakami i przecinkami. Dla ksi\u0119gowej, kontroli i do przeniesienia danych."),
            row(Receipt, "Przyj\u0119cia (ka\u017Cda pozycja)", `${(tx || []).length} dokumentów`, expTx),
            row(Users, "Klienci i ich obroty", "Wizyty, masa, warto\u015B\u0107, ostatnia wizyta", expKlienci),
            row(Warehouse, "Stan magazynu", "Ilo\u015B\u0107 i warto\u015B\u0107 ka\u017Cdego towaru", expMag),
            row(Truck, "Wydania do huty", `${(dispatch || []).length} wyda\u0144`, expWyd)),
        React.createElement("div", { style: sectionTitle }, "Kopia zapasowa"),
        React.createElement(Card, null,
            React.createElement("div", { style: { fontSize: 14.5, color: days == null || days > 7 ? "var(--red)" : "var(--muted)", fontWeight: 600, marginBottom: 12 } }, days == null ? "Nie masz jeszcze \u017Cadnej kopii. Zr\u00F3b j\u0105 teraz." : days === 0 ? "Ostatnia kopia: dzi\u015B." : `Ostatnia kopia: ${days} dni temu.`),
            React.createElement("button", { onClick: backup, style: btnCopper }, React.createElement(Download, { size: 18 }), " Pobierz pe\u0142n\u0105 kopi\u0119"),
            React.createElement("label", { style: { ...btnGhost, marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxSizing: "border-box" } }, React.createElement(RefreshCw, { size: 17 }), " Przywr\u00F3\u0107 z pliku kopii", React.createElement("input", { type: "file", accept: "application/json,.json", onChange: pickFile, style: { display: "none" } })),
            restore && React.createElement("div", { style: { marginTop: 12, padding: 14, borderRadius: 14, border: "1.5px solid var(--red)", background: "rgba(220,38,38,.07)" } },
                React.createElement("div", { style: { fontWeight: 800, fontSize: 15 } }, "Przywr\u00F3ci\u0107 kopi\u0119 z ", new Date(restore.created).toLocaleString("pl-PL"), "?"),
                React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", margin: "6px 0 12px" } }, "Obecne dane zostan\u0105 zast\u0105pione danymi z kopii. Tej operacji nie da si\u0119 cofn\u0105\u0107 \u2014 najpierw pobierz aktualn\u0105 kopi\u0119."),
                React.createElement("div", { style: { display: "flex", gap: 8 } },
                    React.createElement("button", { onClick: () => setRestore(null), style: { ...btnGhost, flex: 1 } }, "Anuluj"),
                    React.createElement("button", { onClick: doRestore, style: { ...btnCopper, flex: 1, background: "var(--red)", boxShadow: "none" } }, "Przywr\u00F3\u0107")))),
        React.createElement("div", { style: { ...sectionTitle, display: "flex", justifyContent: "space-between", alignItems: "center" } }, "Dziennik zmian", log.length > 0 && React.createElement("button", { onClick: expLog, style: { background: "none", border: "none", color: "var(--copper)", fontWeight: 800, fontSize: 14.5, cursor: "pointer" } }, "Pobierz CSV")),
        React.createElement("input", { value: filter, onChange: (e) => setFilter(e.target.value), placeholder: "Szukaj: osoba, towar, \u201Eusuni\u0119to\u201D\u2026", style: { ...inputStyle, marginBottom: 10 } }),
        React.createElement(Card, { pad: 6 }, shown.length === 0 ? React.createElement("div", { style: { padding: 14, color: "var(--muted)", fontSize: 14.5 } }, log.length ? "Brak wpis\u00F3w dla tego wyszukiwania." : "Tu zobaczysz ka\u017Cde przyj\u0119cie, usuni\u0119cie, zmian\u0119 ceny i konta \u2014 kto i kiedy.") : shown.map((e, i) => React.createElement("div", { key: i, style: { padding: "11px 10px", borderTop: i ? "1px solid var(--line)" : "none" } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 8 } },
                React.createElement("span", { style: { fontWeight: 800, fontSize: 14.5, color: /USUNI/.test(e.a) ? "var(--red)" : "var(--text)" } }, e.a),
                React.createElement("span", { style: { fontSize: 13, color: "var(--faint)", whiteSpace: "nowrap" } }, new Date(e.ts).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }))),
            React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", marginTop: 2 } }, e.d),
            React.createElement("div", { style: { fontSize: 13, color: "var(--faint)", marginTop: 2 } }, "\u{1F464} ", e.who))))));
}
/* ─────────── Pasek segmentów (scalone sekcje) ─────────── */
function SegBar({ items, active, onPick }) {
    if (!items || items.length < 2) return null;
    return (React.createElement("div", { style: { display: "flex", gap: 6, padding: 5, margin: "14px 16px 0", borderRadius: 14, background: "var(--surface2)", border: "1px solid var(--line)" } }, items.map(([id, label]) => React.createElement("button", { key: id, onClick: () => onPick(id), style: { flex: 1, minHeight: 44, borderRadius: 10, border: "none", cursor: "pointer", fontSize: 14.5, fontWeight: 700, background: active === id ? "var(--surface)" : "transparent", color: active === id ? "var(--copper)" : "var(--muted)", boxShadow: active === id ? "0 1px 4px rgba(0,0,0,.15)" : "none" } }, label))));
}
/* ─────────── Pulpit ─────────── */
function Pulpit({ tx, dispatch, mm, materials, stock, company, setCompany, openIntake, setViewDoc, setTab, controls, setControls, settings, setSettings, reports, generateReport, openClient, currentUser, isOwner, can, onLogout, openUsers, openPerms, newReqCount, notifItems, notifCount, markNotifsRead, notifOn, onEnableNotif, loadDemo, clearDemo }) {
    can = can || (() => true);
    notifItems = notifItems || [];
    const [notifOpen, setNotifOpen] = useState(false);
    const [setOpen, setSetOpen] = useState(false);
    const [repOpen, setRepOpen] = useState(false);
    const [ctrlOpen, setCtrlOpen] = useState(false);
    const [editCtrl, setEditCtrl] = useState(null);
    const [repDoc, setRepDoc] = useState(null);
    const t = todayStr();
    const todayList = tx.filter((x) => fmtDateKey(x.ts) === t);
    const paid = todayList.reduce((a, x) => a + txTotal(x), 0);
    const mass = todayList.reduce((a, x) => a + txMass(x), 0);
    const cashOut = todayList.filter((x) => x.payment === "gotowka").reduce((a, x) => a + txTotal(x), 0);
    const sortedCtrl = (controls || []).slice().sort((a, b) => daysTo(a.date) - daysTo(b.date));
    const dlReport = () => { const txt = generateReport(t); downloadText("raport_" + t + ".txt", txt); };
    const openReportPdf = () => { const txt = generateReport(t); setRepDoc({ text: txt, day: t }); };
    const ctrlColor = (d) => d < 0 ? "var(--red)" : d <= 7 ? "var(--amber)" : "var(--green)";
    // struktura skupu dziś wg grupy materiału (wartość)
    const byGroup = {};
    todayList.forEach((x) => x.pos.forEach((p) => { byGroup[p.g] = (byGroup[p.g] || 0) + p.w * p.price; }));
    const groups = Object.entries(byGroup).sort((a, b) => b[1] - a[1]);
    const maxG = groups.length ? groups[0][1] : 1;
    const magValue = materials.reduce((a, m) => a + (stock[m.id] || 0) * m.buy, 0);
    return (React.createElement("div", { style: { padding: "0 16px" } },
        React.createElement("header", { style: { paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" } },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 11 } },
                React.createElement("div", { style: { width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#c8743f,#a85829)", display: "grid", placeItems: "center", boxShadow: "0 6px 16px -8px rgba(168,88,41,.8)" } },
                    React.createElement(Recycle, { size: 22, color: "#fff" })),
                React.createElement("div", null,
                    React.createElement("div", { style: { fontFamily: "var(--display)", fontSize: 18, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1 } }, company.name || "SkupOS"),
                    React.createElement("div", { style: { fontSize: 13, color: "var(--muted)", marginTop: 3 } },
                        company.bdo ? `BDO ${company.bdo} · ` : "Uzupełnij dane punktu · ",
                        "dzi\u015B, ",
                        now().getDate(),
                        " ",
                        PL_MON[now().getMonth()]))),
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
                currentUser && React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 5, background: isOwner ? "rgba(200,116,63,.12)" : "rgba(63,125,138,.12)", color: isOwner ? "var(--copper)" : "#3f7d8a", borderRadius: 99, padding: "5px 10px", fontSize: 12.5, fontWeight: 700 } }, ROLE_LABEL[currentUser.role]),
                (isOwner || can("requests")) && (React.createElement("button", { onClick: () => setNotifOpen(true), style: { ...iconBtn, position: "relative" } },
                    React.createElement(Bell, { size: 18 }),
                    notifCount > 0 && React.createElement("span", { style: { position: "absolute", top: -3, right: -3, minWidth: 17, height: 17, padding: "0 4px", borderRadius: 99, background: "var(--red)", color: "#fff", fontSize: 11.5, fontWeight: 800, display: "grid", placeItems: "center" } }, notifCount))),
                React.createElement("button", { onClick: () => setSetOpen(true), style: iconBtn },
                    React.createElement(Settings, { size: 18 })))),
        isOwner && tx.length < 5 && (React.createElement(Card, { style: { marginTop: 18, background: "linear-gradient(135deg, rgba(208,130,73,.18), rgba(208,130,73,.05))", border: "1px solid rgba(208,130,73,.4)" } },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 7 } },
                React.createElement(Sparkles, { size: 19, color: "var(--copper)" }),
                React.createElement("span", { style: { fontFamily: "var(--display)", fontWeight: 800, fontSize: 16 } }, "Poka\u017C apk\u0119 w akcji")),
            React.createElement("div", { style: { fontSize: 14.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 14 } }, "Apka jest prawie pusta. Za\u0142aduj przyk\u0142adowy skup \u2014 transakcje z ostatnich tygodni, pe\u0142ny magazyn, wywozy i zadania \u2014 aby zobaczy\u0107 j\u0105 jak dzia\u0142aj\u0105cy biznes. Idealne do pokazania klientowi."),
            React.createElement("button", { onClick: () => loadDemo && loadDemo(), style: btnCopper },
                React.createElement(Sparkles, { size: 17 }),
                " Za\u0142aduj dane pokazowe"),
            React.createElement("div", { style: { fontSize: 12.5, color: "var(--faint)", marginTop: 9, textAlign: "center" } }, "Wyczy\u015Bcisz je p\u00F3\u017Aniej w Ustawieniach (z\u0119batka u g\u00F3ry)."))),
        React.createElement(Card, { style: { marginTop: 18, background: "radial-gradient(420px 220px at 100% 0%, rgba(255,255,255,.22), transparent 60%), var(--grad)", border: "none", color: "#fff", boxShadow: "0 22px 44px -22px rgba(156,69,24,.75)", padding: 20 } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" } },
                React.createElement("div", null,
                    React.createElement("div", { style: { fontSize: 14, color: "rgba(255,255,255,.82)", fontWeight: 600 } }, "Wyp\u0142acono dzi\u015B (skup)"),
                    React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 38, letterSpacing: "-.03em", marginTop: 4 } }, plnShort(paid))),
                React.createElement("div", { style: { textAlign: "right" } },
                    React.createElement("div", { style: { fontSize: 13, color: "rgba(255,255,255,.82)" } }, "Got\u00F3wka dzi\u015B"),
                    React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 17, color: "#fff", marginTop: 4 } }, plnShort(cashOut)))),
            React.createElement("div", { style: { display: "flex", gap: 22, marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.25)" } },
                React.createElement("div", null,
                    React.createElement("div", { style: { fontSize: 13, color: "rgba(255,255,255,.82)" } }, "Przyj\u0119\u0107"),
                    React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 18 } }, todayList.length)),
                React.createElement("div", null,
                    React.createElement("div", { style: { fontSize: 13, color: "rgba(255,255,255,.82)" } }, "Masa skupiona"),
                    React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 18 } }, kg(mass))),
                React.createElement("div", null,
                    React.createElement("div", { style: { fontSize: 13, color: "rgba(255,255,255,.82)" } }, "Warto\u015B\u0107 magazynu"),
                    React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 18, color: "#FFE6CF" } }, plnShort(magValue))))),
        isOwner && (() => {
            const mk = new Date().toISOString().slice(0, 7);
            const W = calcWynik(tx, dispatch, materials, (k) => k.slice(0, 7) === mk);
            const cell = (l, v, col) => React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { fontSize: 13, color: "var(--muted)", fontWeight: 600 } }, l),
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 17, marginTop: 3, color: col || "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, plnShort(v)));
            return React.createElement(React.Fragment, null,
                React.createElement("div", { style: sectionTitle }, "Ten miesi\u0105c \u2014 ile zarabiam"),
                React.createElement(Card, { onClick: () => setTab("ksieg"), style: { cursor: "pointer" } },
                    React.createElement("div", { style: { display: "flex", gap: 10 } },
                        cell("Skup", W.skup),
                        cell("Sprzeda\u017C", W.sprzedaz),
                        cell("Mar\u017Ca", W.marza, W.marza >= 0 ? "var(--green)" : "var(--red)")),
                    React.createElement("div", { style: { fontSize: 13, color: "var(--muted)", marginTop: 10 } }, W.sprzMasa > 0 ? `Sprzedane ${kg(W.sprzMasa)} do huty · szczegóły w „Papiery i podatki” →` : "Brak sprzedaży do huty w tym miesiącu — dodaj wydanie w Magazynie")));
        })(),
        React.createElement("div", { style: sectionTitle }, "Struktura skupu \u2014 dzi\u015B"),
        React.createElement(Card, null, groups.length === 0 ? React.createElement("div", { style: { color: "var(--muted)", fontSize: 15, padding: "8px 2px" } }, "Brak przyj\u0119\u0107 dzisiaj. Dodaj pierwsze \u2193") :
            groups.map(([g, val]) => (React.createElement("div", { key: g, style: { marginBottom: 12 } },
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 } },
                    React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 600 } },
                        React.createElement("span", { style: { width: 9, height: 9, borderRadius: 3, background: C[g].color } }),
                        C[g].label),
                    React.createElement("span", { style: { fontFamily: "var(--mono)", fontSize: 14.5, fontWeight: 700 } }, plnShort(val))),
                React.createElement(Bar, { pct: (val / maxG) * 100, color: C[g].color, h: 7 }))))),
        isOwner && (React.createElement(React.Fragment, null,
            React.createElement("div", { style: sectionTitle }, "Zesp\u00F3\u0142"),
            React.createElement(Card, { onClick: openUsers, style: { cursor: "pointer", display: "flex", alignItems: "center", gap: 13 } },
                React.createElement("div", { style: { width: 42, height: 42, borderRadius: 11, background: "rgba(200,116,63,.12)", display: "grid", placeItems: "center", flexShrink: 0 } },
                    React.createElement(Users, { size: 21, color: "var(--copper)" })),
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("div", { style: { fontFamily: "var(--display)", fontWeight: 700, fontSize: 15 } }, "Pracownicy i konta"),
                    React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", marginTop: 2 } }, "Dodaj pracownika, nadaj rol\u0119 i uprawnienia")),
                React.createElement(ChevronRight, { size: 20, color: "var(--faint)" })))),
        can("reports") && (React.createElement(React.Fragment, null,
            React.createElement("div", { style: sectionTitle }, "Raport dnia"),
            React.createElement(Card, null,
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                    React.createElement("div", null,
                        React.createElement("div", { style: { fontFamily: "var(--display)", fontWeight: 700, fontSize: 15 } },
                            "Podsumowanie ",
                            t),
                        React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 2 } },
                            reports.some((r) => r.dayKey === t) ? "Raport zapisany dzisiaj ✓" : settings.reportOn ? `Auto o ${settings.reportHour}` : "Auto wyłączone",
                            " \u00B7 zapisanych: ",
                            reports.length)),
                    React.createElement("button", { onClick: () => setRepOpen(true), style: iconBtn },
                        React.createElement(Settings, { size: 17 }))),
                React.createElement("div", { style: { display: "flex", gap: 9, marginTop: 13 } },
                    React.createElement("button", { onClick: openReportPdf, style: { ...btnCopper, flex: 1.3 } },
                        React.createElement(FileText, { size: 18 }),
                        " Podgl\u0105d / PDF"),
                    React.createElement("button", { onClick: dlReport, style: { ...btnGhost, flex: 1 } }, ".txt"))))),
        can("controls") && (React.createElement(React.Fragment, null,
            React.createElement("div", { style: { ...sectionTitle, display: "flex", justifyContent: "space-between", alignItems: "center" } },
                React.createElement("span", null, "Kontrole i terminy"),
                React.createElement("span", { onClick: () => { setEditCtrl({ id: null, name: "", date: t, type: "" }); setCtrlOpen(true); }, style: { color: "var(--copper)", textTransform: "none", letterSpacing: 0, cursor: "pointer", fontSize: 14 } }, "+ Dodaj")),
            React.createElement(Card, { pad: 6 }, sortedCtrl.length === 0 ? React.createElement("div", { style: { color: "var(--muted)", fontSize: 15, padding: "10px" } }, "Brak zaplanowanych kontroli. Dodaj termin \u2191") :
                sortedCtrl.map((c, i) => {
                    const d = daysTo(c.date);
                    const col = ctrlColor(d);
                    return (React.createElement("div", { key: c.id, onClick: () => { setEditCtrl(c); setCtrlOpen(true); }, style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 10px", cursor: "pointer", borderBottom: i < sortedCtrl.length - 1 ? "1px solid var(--line)" : "none" } },
                        React.createElement("div", { style: { width: 34, height: 34, borderRadius: 9, background: col + "18", display: "grid", placeItems: "center", flexShrink: 0 } },
                            React.createElement(Clock, { size: 17, color: col })),
                        React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                            React.createElement("div", { style: { fontSize: 14, fontWeight: 600 } }, c.name),
                            React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)" } },
                                c.type ? c.type + " · " : "",
                                c.date)),
                        React.createElement("span", { style: { fontFamily: "var(--mono)", fontSize: 14, fontWeight: 700, color: col, whiteSpace: "nowrap" } }, d < 0 ? `${-d} dni po` : d === 0 ? "dziś" : `za ${d} dni`)));
                })))),
        React.createElement("div", { style: { ...sectionTitle, display: "flex", justifyContent: "space-between" } },
            React.createElement("span", null, "Ostatnie przyj\u0119cia"),
            React.createElement("span", { onClick: () => setTab("tx"), style: { color: "var(--copper)", textTransform: "none", letterSpacing: 0, cursor: "pointer", fontSize: 14 } }, "Wszystkie \u2192")),
        tx.slice(0, 3).map((x) => React.createElement(TxRow, { key: x.id, x: x, onClick: () => setViewDoc(x) })),
        React.createElement("div", { style: { height: 6 } }),
        React.createElement(Sheet, { open: setOpen, onClose: () => setSetOpen(false), title: "Ustawienia" },
            currentUser && (React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 11, padding: "12px 13px", borderRadius: 12, background: "var(--surface2)", marginBottom: 14 } },
                React.createElement("div", { style: { width: 40, height: 40, borderRadius: 11, background: isOwner ? "rgba(200,116,63,.14)" : "rgba(63,125,138,.14)", display: "grid", placeItems: "center", flexShrink: 0 } },
                    React.createElement(User, { size: 19, color: isOwner ? "var(--copper)" : "#3f7d8a" })),
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 14.5 } }, currentUser.name),
                    React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)" } },
                        ROLE_LABEL[currentUser.role],
                        " \u00B7 @",
                        currentUser.login)))),
            React.createElement("div", { style: { ...sectionTitle, margin: "4px 2px 8px" } },
                "Dane punktu skupu ",
                !can("companyData") && React.createElement("span", { style: { textTransform: "none", letterSpacing: 0, color: "var(--faint)", fontWeight: 500 } }, "\u00B7 tylko podgl\u0105d")),
            can("companyData") ? (React.createElement(React.Fragment, null,
                React.createElement("label", { style: label }, "Nazwa"),
                React.createElement("input", { style: inputStyle, value: company.name, onChange: (e) => setCompany({ ...company, name: e.target.value }) }),
                React.createElement("label", { style: label }, "NIP"),
                React.createElement("input", { style: inputStyle, value: company.nip, onChange: (e) => setCompany({ ...company, nip: e.target.value }) }),
                React.createElement("label", { style: label }, "Numer BDO"),
                React.createElement("input", { style: inputStyle, value: company.bdo, onChange: (e) => setCompany({ ...company, bdo: e.target.value }) }),
                React.createElement("label", { style: label }, "Adres"),
                React.createElement("input", { style: inputStyle, value: company.addr, onChange: (e) => setCompany({ ...company, addr: e.target.value }) }))) : (React.createElement(Card, { pad: 13 },
                React.createElement("div", { style: { fontSize: 14, fontWeight: 700 } }, company.name),
                React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", marginTop: 4 } },
                    "NIP ",
                    company.nip,
                    " \u00B7 BDO ",
                    company.bdo),
                React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", marginTop: 2 } }, company.addr))),
            isOwner && (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { height: 1, background: "var(--line)", margin: "18px 0" } }),
                React.createElement("button", { style: { ...btnGhost, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }, onClick: () => { setSetOpen(false); openUsers && openUsers(); } },
                    React.createElement(BadgeCheck, { size: 17 }),
                    " U\u017Cytkownicy i konta"),
                React.createElement("button", { style: { ...btnGhost, marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }, onClick: () => { setSetOpen(false); openPerms && openPerms(); } },
                    React.createElement(ShieldCheck, { size: 17 }),
                    " Uprawnienia r\u00F3l"),
                React.createElement("div", { style: { height: 1, background: "var(--line)", margin: "18px 0" } }),
                React.createElement("div", { style: { ...sectionTitle, margin: "4px 2px 9px" } }, "Dane pokazowe (demo)"),
                React.createElement("button", { style: { ...btnCopper }, onClick: () => { loadDemo && loadDemo(); setSetOpen(false); } },
                    React.createElement(Sparkles, { size: 17 }),
                    " Za\u0142aduj dane pokazowe"),
                React.createElement("button", { style: { ...btnGhost, marginTop: 10, color: "var(--red)", borderColor: "rgba(239,68,68,.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }, onClick: () => { if (window.confirm("Usunąć wszystkie transakcje, wywozy i zadania oraz wyzerować magazyn? Tej operacji nie cofniesz.")) {
                        clearDemo && clearDemo();
                        setSetOpen(false);
                    } } },
                    React.createElement(Trash2, { size: 16 }),
                    " Wyczy\u015B\u0107 wszystkie dane"),
                React.createElement("div", { style: { fontSize: 13, color: "var(--muted)", marginTop: 9, lineHeight: 1.55 } }, "\u201EZa\u0142aduj\" wype\u0142nia apk\u0119 przyk\u0142adowym skupem (transakcje z ostatnich tygodni, magazyn, wywozy, zadania) \u2014 idealne do pokazania klientowi. \u201EWyczy\u015B\u0107\" przygotowuje apk\u0119 do pracy na czysto."),
                React.createElement("div", { style: { height: 1, background: "var(--line)", margin: "18px 0" } }),
                React.createElement("div", { style: { ...sectionTitle, margin: "4px 2px 9px" } }, "Serwer AI (w\u0142\u0105cza funkcje AI)"),
                React.createElement("input", { style: inputStyle, placeholder: "https://twoj-worker.workers.dev", defaultValue: (() => { try {
                        return localStorage.getItem("sk_ai_proxy") || "";
                    }
                    catch (e) {
                        return "";
                    } })(), onChange: (e) => { try {
                        localStorage.setItem("sk_ai_proxy", e.target.value.trim());
                    }
                    catch (er) { } } }),
                React.createElement("div", { style: { fontSize: 13, color: "var(--muted)", marginTop: 9, lineHeight: 1.55 } },
                    "Wklej adres swojego serwera (Cloudflare Worker), aby w\u0142\u0105czy\u0107 AI: Doradc\u0119-czat, wycen\u0119 ze zdj\u0119cia, prognozy cen. Klucz API jest bezpiecznie ukryty na serwerze. Instrukcja krok po kroku: plik ",
                    React.createElement("b", { style: { color: "var(--text)" } }, "PORADNIK-AI-WORKER"),
                    ". Bez tego AI dzia\u0142a tylko w podgl\u0105dzie; ",
                    React.createElement("b", { style: { color: "var(--text)" } }, "Analiza biznesu"),
                    " w Doradcy dzia\u0142a zawsze."),
                React.createElement("button", { style: { ...btnGhost, marginTop: 10, color: "#3f7d8a", borderColor: "rgba(63,125,138,.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }, onClick: () => { setSetOpen(false); openClient && openClient(); } },
                    React.createElement(Smartphone, { size: 17 }),
                    " Otw\u00F3rz panel klienta (demo)"))),
            React.createElement("div", { style: { height: 1, background: "var(--line)", margin: "18px 0" } }),
            React.createElement("button", { style: { ...btnGhost, color: "var(--red)", borderColor: "rgba(220,38,38,.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }, onClick: () => { setSetOpen(false); onLogout && onLogout(); } },
                React.createElement(LogOut, { size: 17 }),
                " Wyloguj")),
        React.createElement(Sheet, { open: repOpen, onClose: () => setRepOpen(false), title: "Raport dnia" },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" } },
                React.createElement("div", null,
                    React.createElement("div", { style: { fontSize: 14.5, fontWeight: 600 } }, "Automatyczny raport"),
                    React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)" } }, "Generuje podsumowanie dnia o ustalonej porze")),
                React.createElement("button", { onClick: () => setSettings({ ...settings, reportOn: !settings.reportOn }), style: { width: 46, height: 27, borderRadius: 99, border: "none", cursor: "pointer", padding: 3, background: settings.reportOn ? "var(--green)" : "var(--line2)", flexShrink: 0 } },
                    React.createElement("span", { style: { display: "block", width: 21, height: 21, borderRadius: 99, background: "#fff", transform: settings.reportOn ? "translateX(19px)" : "translateX(0)", transition: "transform .2s" } }))),
            settings.reportOn && (React.createElement(React.Fragment, null,
                React.createElement("label", { style: label }, "Godzina generowania"),
                React.createElement("input", { type: "time", value: settings.reportHour, onChange: (e) => setSettings({ ...settings, reportHour: e.target.value }), style: { ...inputStyle, colorScheme: "light" } }))),
            React.createElement("div", { style: { display: "flex", gap: 9, marginTop: 16 } },
                React.createElement("button", { onClick: () => { setRepOpen(false); openReportPdf(); }, style: { ...btnCopper, flex: 1.3 } },
                    React.createElement(FileText, { size: 18 }),
                    " Podgl\u0105d / PDF"),
                React.createElement("button", { onClick: dlReport, style: { ...btnGhost, flex: 1 } }, ".txt")),
            reports.length > 0 && React.createElement("div", { style: { ...sectionTitle, margin: "20px 2px 8px" } }, "Zapisane raporty"),
            reports.slice(0, 14).map((r) => (React.createElement("div", { key: r.id, onClick: () => { setRepOpen(false); setRepDoc({ text: r.text, day: r.dayKey }); }, style: { display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", marginBottom: 7, borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer" } },
                React.createElement(FileText, { size: 16, color: "var(--muted)" }),
                React.createElement("span", { style: { flex: 1, fontSize: 15, fontFamily: "var(--mono)" } }, r.dayKey),
                React.createElement("button", { onClick: (e) => { e.stopPropagation(); downloadText("raport_" + r.dayKey + ".txt", r.text); }, style: { ...iconBtn, width: 44, height: 44 }, title: "Pobierz .txt" },
                    React.createElement(FileText, { size: 15 })),
                React.createElement(ArrowRight, { size: 15, color: "var(--faint)" }))))),
        React.createElement(Sheet, { open: ctrlOpen, onClose: () => setCtrlOpen(false), title: editCtrl && editCtrl.id ? "Edytuj kontrolę" : "Nowa kontrola" }, editCtrl && (React.createElement(React.Fragment, null,
            React.createElement("label", { style: label }, "Nazwa"),
            React.createElement("input", { style: inputStyle, placeholder: "np. Legalizacja wagi", value: editCtrl.name, onChange: (e) => setEditCtrl({ ...editCtrl, name: e.target.value }) }),
            React.createElement("label", { style: label }, "Kategoria"),
            React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, ["Metrologia", "BDO", "Bezpieczeństwo", "Podatki", "Inne"].map((k) => (React.createElement("button", { key: k, onClick: () => setEditCtrl({ ...editCtrl, type: k }), style: { padding: "8px 13px", borderRadius: 99, cursor: "pointer", fontSize: 14, fontWeight: 700, border: editCtrl.type === k ? "1.5px solid var(--copper)" : "1px solid var(--line2)", background: editCtrl.type === k ? "rgba(200,116,63,.1)" : "var(--surface)", color: editCtrl.type === k ? "var(--copper)" : "var(--muted)" } }, k)))),
            React.createElement("label", { style: label }, "Termin"),
            React.createElement("input", { type: "date", style: { ...inputStyle, colorScheme: "light" }, value: editCtrl.date, onChange: (e) => setEditCtrl({ ...editCtrl, date: e.target.value }) }),
            React.createElement("button", { style: { ...btnCopper, marginTop: 16 }, onClick: () => {
                    if (!editCtrl.name.trim())
                        return;
                    if (editCtrl.id)
                        setControls(controls.map((c) => c.id === editCtrl.id ? editCtrl : c));
                    else
                        setControls([...controls, { ...editCtrl, id: uid() }]);
                    setCtrlOpen(false);
                } }, "Zapisz"),
            editCtrl.id && React.createElement("button", { style: { ...btnGhost, marginTop: 10, color: "var(--red)", borderColor: "rgba(220,38,38,.3)" }, onClick: () => { setControls(controls.filter((c) => c.id !== editCtrl.id)); setCtrlOpen(false); } }, "Usu\u0144")))),
        repDoc && React.createElement(ReportDoc, { data: repDoc, company: company, onClose: () => setRepDoc(null) }),
        React.createElement(Sheet, { open: notifOpen, onClose: () => { setNotifOpen(false); markNotifsRead && markNotifsRead(); }, title: "Powiadomienia" },
            React.createElement(NotifList, { items: notifItems, notifOn: notifOn, onEnable: onEnableNotif, onItem: (n) => { setNotifOpen(false); markNotifsRead && markNotifsRead(); setTab("req"); } }))));
}
const fmtDateKey = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
function TxRow({ x, onClick }) {
    const Pi = PAY[x.payment].icon;
    return (React.createElement(Card, { pad: 13, style: { marginBottom: 9, cursor: "pointer" }, onClick: onClick },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
            React.createElement("div", { style: { width: 40, height: 40, borderRadius: 10, background: x.kind === "FPO" ? "rgba(200,116,63,.12)" : "rgba(63,125,138,.12)", display: "grid", placeItems: "center", flexShrink: 0 } }, x.kind === "FPO" ? React.createElement(User, { size: 18, color: "var(--copper)" }) : React.createElement(Building2, { size: 18, color: "#3f7d8a" })),
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { fontSize: 14.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, supplierName(x)),
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 7, marginTop: 2 } },
                    React.createElement("span", { style: { fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--muted)" } }, x.no),
                    React.createElement("span", { style: { fontSize: 12.5, color: "var(--faint)" } },
                        "\u00B7 ",
                        fmtTs(x.ts),
                        " \u00B7 ",
                        kg(txMass(x))))),
            React.createElement("div", { style: { textAlign: "right" } },
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 15 } }, plnShort(txTotal(x))),
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginTop: 2, color: "var(--faint)" } },
                    React.createElement(Pi, { size: 12 }),
                    React.createElement("span", { style: { fontSize: 12 } }, PAY[x.payment].label))))));
}
/* ─────────── Transakcje ─────────── */
function Transakcje({ tx, setViewDoc }) {
    const [f, setF] = useState("all");
    const [q, setQ] = useState("");
    const list = tx.filter((x) => (f === "all" || x.kind === f) && (!q.trim() || fnorm(supplierName(x)).includes(fnorm(q)) || fnorm(x.no).includes(fnorm(q)) || fnorm(x.plate || "").includes(fnorm(q))));
    const [lim, setLim] = useState(40);
    const sum = list.reduce((a, x) => a + txTotal(x), 0);
    return (React.createElement("div", { style: { padding: "0 16px" } },
        React.createElement("header", { style: { paddingTop: 24 } },
            React.createElement("h1", { style: { margin: 0, fontFamily: "var(--display)", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" } }, "Przyj\u0119cia"),
            React.createElement("div", { style: { color: "var(--muted)", fontSize: 14.5, marginTop: 2 } },
                list.length,
                " dokument\u00F3w \u00B7 ",
                plnShort(sum),
                " \u00B7 ewidencja BDO")),
        React.createElement("div", { style: { position: "relative", marginTop: 16 } },
            React.createElement(Search, { size: 17, color: "var(--faint)", style: { position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" } }),
            React.createElement("input", { style: { ...inputStyle, paddingLeft: 40 }, placeholder: "Szukaj po nazwisku / numerze", value: q, onChange: (e) => setQ(e.target.value) })),
        React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } }, [["all", "Wszystko"], ["FPO", "FPO (osoby)"], ["KPO", "KPO (firmy)"]].map(([k, l]) => (React.createElement("button", { key: k, onClick: () => setF(k), style: { padding: "8px 14px", borderRadius: 99, cursor: "pointer", fontSize: 14.5, fontWeight: 700, border: f === k ? "1.5px solid var(--copper)" : "1px solid var(--line2)", background: f === k ? "rgba(200,116,63,.1)" : "var(--surface)", color: f === k ? "var(--copper)" : "var(--muted)" } }, l)))),
        React.createElement("div", { style: { marginTop: 14 } }, list.length === 0 ? React.createElement(Card, { style: { textAlign: "center", padding: 30, color: "var(--muted)" } },
            React.createElement(Receipt, { size: 26, color: "var(--faint)", style: { marginBottom: 8 } }),
            React.createElement("div", { style: { fontSize: 16, fontWeight: 800, color: "var(--text)" } }, q || f !== "all" ? "Nic nie pasuje" : "Jeszcze nic tu nie ma"),
            React.createElement("div", { style: { fontSize: 14.5, marginTop: 4, lineHeight: 1.5 } }, q || f !== "all" ? "Zmień wyszukiwanie lub filtr." : "Każde przyjęcie (FPO lub KPO) trafi tutaj automatycznie, z numerem i godziną. Zacznij od przycisku „+ Przyjęcie” na dole.")) :
            React.createElement(React.Fragment, null,
                list.slice(0, lim).map((x, i) => {
                    const d = fmtDateKey(x.ts), prev = i > 0 ? fmtDateKey(list[i - 1].ts) : null;
                    const dayTot = d !== prev ? list.filter((y) => fmtDateKey(y.ts) === d).reduce((a, y) => a + txTotal(y), 0) : 0;
                    return React.createElement(React.Fragment, { key: x.id },
                        d !== prev && React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "18px 4px 8px", fontWeight: 800, fontSize: 15 } },
                            React.createElement("span", null, new Date(x.ts).toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" })),
                            React.createElement("span", { style: { color: "var(--muted)", fontSize: 14 } }, plnShort(dayTot))),
                        React.createElement(TxRow, { x: x, onClick: () => setViewDoc(x) }));
                }),
                list.length > lim && React.createElement("button", { onClick: () => setLim(lim + 60), style: { ...btnGhost, marginTop: 12 } }, `Poka\u017C kolejne (zosta\u0142o ${list.length - lim})`)))));
}
/* ─────────── Cennik ─────────── */
/* ─────────── Inteligencja Cenowa (alarm marży + notowania) ─────────── */
/* ─────────── Mapa konkurencji ─────────── */
function KonkurencjaView({ materials }) {
    const [open, setOpen] = useState(false);
    const [edit, setEdit] = useState(null);
    // Konkurenci (edytowalni, zapis lokalny) — właściciel uzupełnia z FB/Google/wizyt
    const [konkurenci, setKonkurenci] = useState(() => {
        try {
            const s = localStorage.getItem("sk_konk_v1");
            if (s)
                return JSON.parse(s);
        }
        catch { }
        return [];
    });
    const save = (k) => { setKonkurenci(k); try {
        localStorage.setItem("sk_konk_v1", JSON.stringify(k));
    }
    catch { } };
    const [aiBusy, setAiBusy] = useState(false);
    const [analizaAI, setAnalizaAI] = useState(null);
    // Nasze ceny per grupa (średnia z grupy)
    const naszeCeny = {};
    ["CU", "AL", "FE", "SS", "PB"].forEach(g => {
        const mats = (materials || []).filter(m => m.g === g && m.buy > 0);
        if (mats.length)
            naszeCeny[g] = mats.reduce((a, m) => a + m.buy, 0) / mats.length;
    });
    const METAL_LBL = { CU: "Miedź", AL: "Aluminium", FE: "Stal", SS: "Nierdz.", PB: "Ołów" };
    const METAL_KOL = { CU: "#c2703d", AL: "#8aa2ad", FE: "#6b7787", SS: "#3f7d8a", PB: "#566" };
    const runAnalizaAI = async () => {
        setAiBusy(true);
        setAnalizaAI(null);
        try {
            const naszeTxt = Object.entries(naszeCeny).map(([g, c]) => `${(METAL_LBL[g] || g)}: ${c.toFixed(2)} zł/kg`).join(", ");
            const konkTxt = konkurenci.map(k => `${k.nazwa} (${k.odleglosc} km): ${Object.entries(k.ceny || {}).map(([g, c]) => `${(METAL_LBL[g] || g)} ${c} zł`).join(", ")}${k.notatka ? " — " + k.notatka : ""}`).join("\n");
            const sys = `Jesteś doradcą strategicznym skupu złomu w Polsce. Przeanalizuj moje ceny vs konkurencja i daj konkretną strategię: gdzie podnieść ceny, by przyciągnąć dostawców; gdzie mogę je obniżyć bez utraty klientów; jak wykorzystać słabości konkurencji (np. ktoś daje mało za miedź). Konkretnie, po polsku, z kwotami w zł. Możesz użyć nagłówków (###), pogrubień (**) i list (-).`;
            const res = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1100, system: sys, messages: [{ role: "user", content: `MOJE CENY: ${naszeTxt}\n\nKONKURENCJA:\n${konkTxt}\n\nDaj mi strategię cenową.` }] }),
            });
            const data = await res.json();
            const txt = (data.content && data.content.map((b) => b.text || "").join("")) || "";
            setAnalizaAI(txt || "Brak odpowiedzi.");
        }
        catch (err) {
            setAnalizaAI("__error__");
        }
        finally {
            setAiBusy(false);
        }
    };
    // Analiza pozycji: dla każdego metalu czy jesteśmy najwyżej/średnio/najniżej
    const metale = ["CU", "AL", "FE", "SS", "PB"].filter(g => naszeCeny[g] != null);
    const pozycja = metale.map(g => {
        const nasza = naszeCeny[g];
        const ceny = konkurenci.map(k => k.ceny[g]).filter(c => c != null && c > 0);
        const maxKonk = ceny.length ? Math.max(...ceny) : 0;
        const minKonk = ceny.length ? Math.min(...ceny) : 0;
        const sredniaKonk = ceny.length ? ceny.reduce((a, c) => a + c, 0) / ceny.length : 0;
        let status = "rynek";
        if (nasza >= maxKonk && maxKonk > 0)
            status = "najwyzej";
        else if (nasza <= minKonk && minKonk > 0)
            status = "najnizej";
        else if (nasza > sredniaKonk)
            status = "powyzej";
        else if (nasza < sredniaKonk)
            status = "ponizej";
        return { g, nasza, maxKonk, minKonk, sredniaKonk, status };
    });
    const STATUS_INFO = {
        najwyzej: { lbl: "Najwyższa cena", kol: "var(--green)", ic: "🏆", opis: "Przyciągasz najwięcej dostawców tego metalu" },
        powyzej: { lbl: "Powyżej średniej", kol: "#84cc16", ic: "▲", opis: "Konkurencyjna cena" },
        rynek: { lbl: "Cena rynkowa", kol: "var(--muted)", ic: "●", opis: "Średnia dla okolicy" },
        ponizej: { lbl: "Poniżej średniej", kol: "var(--amber)", ic: "▼", opis: "Klienci mogą iść do konkurencji" },
        najnizej: { lbl: "Najniższa cena", kol: "var(--red)", ic: "⚠️", opis: "Tracisz dostawców — rozważ podwyżkę" },
    };
    const fmt = v => v.toFixed(2) + " zł";
    return (React.createElement("div", { style: { marginTop: 14 } },
        React.createElement(Card, { style: { background: "rgba(63,125,138,.08)", border: "1px solid rgba(63,125,138,.25)", marginBottom: 14 } },
            React.createElement("div", { style: { fontSize: 14, lineHeight: 1.6, color: "var(--muted)" } }, "\uD83D\uDDFA\uFE0F Dodaj okoliczne skupy i ich ceny (z profili Facebook, Google Maps lub wizyt). Apka poka\u017Ce, gdzie jeste\u015B konkurencyjny, a gdzie tracisz dostawc\u00F3w.")),
        (() => {
            const syg = [];
            pozycja.forEach(p => {
                if (p.status === "najnizej")
                    syg.push({ sev: "red", txt: `Tracisz dostawców **${METAL_LBL[p.g]}** — masz najniższą cenę w okolicy (${p.nasza.toFixed(2)} vs max ${p.maxKonk.toFixed(2)} zł). Podnieś, by ich odzyskać.` });
                else if (p.status === "ponizej")
                    syg.push({ sev: "amber", txt: `**${METAL_LBL[p.g]}** poniżej średniej (${p.nasza.toFixed(2)} vs śr. ${p.sredniaKonk.toFixed(2)} zł) — część dostawców może iść do konkurencji.` });
                else if (p.status === "najwyzej")
                    syg.push({ sev: "green", txt: `Wygrywasz **${METAL_LBL[p.g]}** — najwyższa cena w okolicy. Przyciągasz dostawców; pilnuj marży.` });
            });
            if (syg.length === 0)
                return null;
            const kol = { red: "var(--red)", amber: "var(--amber)", green: "var(--green)" };
            const order = { red: 0, amber: 1, green: 2 };
            syg.sort((a, b) => order[a.sev] - order[b.sev]);
            return (React.createElement(Card, { style: { marginBottom: 14, border: "1px solid rgba(45,212,191,.3)", background: "linear-gradient(145deg, rgba(45,212,191,.08), var(--surface))" } },
                React.createElement("div", { style: { fontSize: 12.5, fontWeight: 800, color: "#2dd4bf", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 11 } }, "Sygna\u0142y rynkowe \u2014 co robi\u0107"),
                syg.map((s, i) => (React.createElement("div", { key: i, style: { display: "flex", gap: 9, marginBottom: i < syg.length - 1 ? 10 : 0 } },
                    React.createElement("span", { style: { width: 8, height: 8, borderRadius: 99, background: kol[s.sev], marginTop: 5, flexShrink: 0 } }),
                    React.createElement("span", { style: { fontSize: 14.5, color: "var(--muted)", lineHeight: 1.5 } }, s.txt.split(/(\*\*[^*]+\*\*)/g).map((part, j) => part.startsWith("**") ? React.createElement("b", { key: j, style: { color: "var(--text)" } }, part.slice(2, -2)) : part)))))));
        })(),
        React.createElement("div", { style: sectionTitle }, "Twoja pozycja na rynku"),
        pozycja.length === 0 ? (React.createElement(Card, null,
            React.createElement("div", { style: { color: "var(--muted)", fontSize: 15, textAlign: "center", padding: "10px 0" } }, "Dodaj konkurent\u00F3w, by zobaczy\u0107 por\u00F3wnanie."))) : pozycja.map(p => {
            const info = STATUS_INFO[p.status];
            return (React.createElement(Card, { key: p.g, pad: 14, style: { marginBottom: 9, borderLeft: `4px solid ${info.kol}` } },
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
                    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
                        React.createElement("div", { style: { width: 10, height: 10, borderRadius: 99, background: METAL_KOL[p.g] } }),
                        React.createElement("span", { style: { fontWeight: 700, fontSize: 15 } }, METAL_LBL[p.g])),
                    React.createElement("span", { style: { fontSize: 13, fontWeight: 800, color: info.kol, background: info.kol.includes("var") ? info.kol.replace(")", ",.12)").replace("var(--", "rgba(") : info.kol + "22", padding: "4px 10px", borderRadius: 99 } },
                        info.ic,
                        " ",
                        info.lbl)),
                React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginBottom: 10 } }, info.opis),
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 } },
                    React.createElement("span", { style: { fontSize: 12.5, color: "var(--muted)", width: 60 } }, "Ty"),
                    React.createElement("div", { style: { flex: 1, height: 22, background: "var(--surface2)", borderRadius: 6, position: "relative", overflow: "hidden" } },
                        React.createElement("div", { style: { height: "100%", width: `${Math.min(100, (p.nasza / Math.max(p.maxKonk, p.nasza)) * 100)}%`, background: `linear-gradient(90deg,${info.kol},${info.kol}aa)`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8 } },
                            React.createElement("span", { style: { fontSize: 12.5, fontWeight: 800, color: "#fff", fontFamily: "var(--mono)" } }, fmt(p.nasza))))),
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--faint)", paddingLeft: 68 } },
                    React.createElement("span", null,
                        "min konk: ",
                        fmt(p.minKonk)),
                    React.createElement("span", null,
                        "\u015Br: ",
                        fmt(p.sredniaKonk)),
                    React.createElement("span", null,
                        "max konk: ",
                        fmt(p.maxKonk)))));
        }),
        konkurenci.length > 0 && (React.createElement(React.Fragment, null,
            React.createElement("button", { onClick: runAnalizaAI, disabled: aiBusy, style: { ...btnCopper, marginTop: 8, marginBottom: 4, opacity: aiBusy ? .7 : 1 } }, aiBusy ? React.createElement(React.Fragment, null,
                React.createElement(RefreshCw, { size: 17, className: "spin" }),
                " Analizuj\u0119 rynek\u2026") : React.createElement(React.Fragment, null,
                React.createElement(Sparkles, { size: 17 }),
                " Strategia cenowa (AI)")),
            analizaAI === "__error__" && React.createElement(Card, { style: { background: "rgba(217,119,6,.08)", border: "1px solid rgba(217,119,6,.3)", marginTop: 10 } },
                React.createElement("div", { style: { fontSize: 14, color: "var(--muted)" } }, "Nie uda\u0142o si\u0119 pobra\u0107 analizy. Spr\u00F3buj ponownie.")),
            analizaAI && analizaAI !== "__error__" && (React.createElement(Card, { style: { marginTop: 10, background: "rgba(124,111,155,.06)", border: "1px solid rgba(124,111,155,.25)" } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 } },
                    React.createElement(Sparkles, { size: 16, color: "#9b8fc0" }),
                    React.createElement("span", { style: { fontWeight: 700, fontSize: 14 } }, "Strategia od AI")),
                React.createElement("div", { style: { fontSize: 14.5, lineHeight: 1.6, color: "var(--text)", whiteSpace: "pre-wrap" } }, dorStripMd(analizaAI)))))),
        React.createElement("div", { style: { ...sectionTitle, display: "flex", justifyContent: "space-between", alignItems: "center" } },
            React.createElement("span", null,
                "Okoliczne skupy (",
                konkurenci.length,
                ")"),
            React.createElement("button", { onClick: () => { setEdit({ id: null, nazwa: "", odleglosc: "", ceny: {}, notatka: "" }); setOpen(true); }, style: { padding: "5px 11px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "1px solid var(--line2)", background: "var(--surface2)", color: "var(--copper)", textTransform: "none", letterSpacing: 0 } }, "+ Dodaj skup")),
        konkurenci.slice().sort((a, b) => a.odleglosc - b.odleglosc).map(k => (React.createElement(Card, { key: k.id, pad: 14, style: { marginBottom: 9, cursor: "pointer" }, onClick: () => { setEdit(k); setOpen(true); } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 } },
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, k.nazwa),
                    React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 5 } },
                        "\uD83D\uDCCD ",
                        k.odleglosc,
                        " km od Ciebie"))),
            React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 8, borderTop: "1px solid var(--line)" } }, ["CU", "AL", "FE", "SS", "PB"].map(g => {
                const ich = k.ceny[g];
                if (ich == null || ich === 0)
                    return null;
                const nasza = naszeCeny[g];
                const lepszy = nasza != null && nasza >= ich;
                return (React.createElement("div", { key: g, style: { flex: "1 1 30%", minWidth: 90, background: "var(--surface2)", borderRadius: 9, padding: "8px 10px" } },
                    React.createElement("div", { style: { fontSize: 12, color: "var(--muted)", marginBottom: 3 } }, METAL_LBL[g]),
                    React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 14.5 } }, ich.toFixed(2)),
                    nasza != null && (React.createElement("div", { style: { fontSize: 11.5, fontWeight: 700, color: lepszy ? "var(--green)" : "var(--amber)", marginTop: 2 } },
                        lepszy ? "▲" : "▼",
                        " Ty: ",
                        nasza.toFixed(2)))));
            })),
            k.notatka && React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 8, fontStyle: "italic" } },
                "\uD83D\uDCAC ",
                k.notatka)))),
        React.createElement(Card, { style: { marginTop: 6, background: "var(--surface2)" } },
            React.createElement("div", { style: { fontSize: 14, lineHeight: 1.6, color: "var(--muted)" } },
                React.createElement("b", { style: { color: "var(--text)" } }, "\uD83D\uDCA1 Strategia cenowa:"),
                React.createElement("br", null),
                "Nie musisz by\u0107 najta\u0144szy we wszystkim. B\u0105d\u017A ",
                React.createElement("b", { style: { color: "var(--text)" } }, "najwy\u017Cszy w 1-2 metalach"),
                " (np. miedzi), by przyci\u0105gn\u0105\u0107 dostawc\u00F3w, a na reszcie trzymaj cen\u0119 rynkow\u0105. Klient z miedzi\u0105 przywiezie te\u017C inny z\u0142om.")),
        React.createElement("div", { style: { fontSize: 12.5, color: "var(--faint)", marginTop: 10, lineHeight: 1.5, textAlign: "center" } }, "Ceny konkurencji uzupe\u0142nij r\u0119cznie \u2014 dane zapisuj\u0105 si\u0119 lokalnie."),
        React.createElement(Sheet, { open: open, onClose: () => setOpen(false), title: edit && edit.id ? "Edytuj skup" : "Nowy konkurent" }, edit && (React.createElement(React.Fragment, null,
            React.createElement("label", { style: label }, "Nazwa skupu"),
            React.createElement("input", { style: inputStyle, value: edit.nazwa, onChange: e => setEdit({ ...edit, nazwa: e.target.value }), placeholder: "np. Z\u0142om-Stal Cz\u0119stochowa" }),
            React.createElement("label", { style: label }, "Odleg\u0142o\u015B\u0107 od Ciebie (km)"),
            React.createElement("input", { type: "number", step: "0.1", style: { ...inputStyle, fontFamily: "var(--mono)", fontWeight: 700 }, value: edit.odleglosc, onChange: e => setEdit({ ...edit, odleglosc: e.target.value }), placeholder: "np. 3.5" }),
            React.createElement("label", { style: label }, "Ceny skupu konkurenta (z\u0142/kg)"),
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 } }, ["CU", "AL", "FE", "SS", "PB"].map(g => (React.createElement("div", { key: g },
                React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)", marginBottom: 4 } }, METAL_LBL[g]),
                React.createElement("input", { type: "number", step: "0.01", value: edit.ceny[g] || "", onChange: e => setEdit({ ...edit, ceny: { ...edit.ceny, [g]: parseFloat(e.target.value) || 0 } }), placeholder: "0", style: { width: "100%", padding: "9px 10px", borderRadius: 9, border: "1px solid var(--line2)", background: "var(--surface2)", color: "var(--text)", fontSize: 14, fontFamily: "var(--mono)", fontWeight: 700, outline: "none", boxSizing: "border-box" } }))))),
            React.createElement("label", { style: label }, "Notatka (opcjonalnie)"),
            React.createElement("input", { style: inputStyle, value: edit.notatka, onChange: e => setEdit({ ...edit, notatka: e.target.value }), placeholder: "np. wy\u017Csze ceny miedzi" }),
            React.createElement("button", { style: { ...btnCopper, marginTop: 14 }, onClick: () => {
                    if (!edit.nazwa.trim())
                        return;
                    const item = { ...edit, odleglosc: parseFloat(edit.odleglosc) || 0, id: edit.id || uid() };
                    if (edit.id)
                        save(konkurenci.map(k => k.id === edit.id ? item : k));
                    else
                        save([...konkurenci, item]);
                    setOpen(false);
                } }, "Zapisz skup"),
            edit.id && React.createElement("button", { style: { ...btnGhost, marginTop: 8, color: "var(--red)", borderColor: "rgba(220,38,38,.3)" }, onClick: () => { save(konkurenci.filter(k => k.id !== edit.id)); setOpen(false); } }, "Usu\u0144"))))));
}
function InteligencjaCen({ materials, setMaterials, stock }) {
    const [view, setView] = useState("alarmy");
    // Progi marży (edytowalne, zapis lokalny)
    const [progi, setProgi] = useState(() => { try {
        const s = localStorage.getItem("sk_intel_progi");
        return s ? JSON.parse(s) : { min: 8, ostrzezenie: 15, dobry: 25 };
    }
    catch {
        return { min: 8, ostrzezenie: 15, dobry: 25 };
    } });
    // Notowania LME (ręczne wpisy + trend) — w PWA bez sieci wpisuje właściciel z telefonu
    const [notowania, setNotowania] = useState(() => {
        try {
            const s = localStorage.getItem("sk_lme_v1");
            if (s)
                return JSON.parse(s);
        }
        catch { }
        return {
            CU: { now: 31.20, prev: 30.10, hist: [28.5, 29.2, 29.8, 30.1, 30.6, 31.2] },
            AL: { now: 6.40, prev: 6.55, hist: [6.8, 6.7, 6.6, 6.55, 6.5, 6.4] },
            FE: { now: 1.28, prev: 1.22, hist: [1.15, 1.18, 1.20, 1.22, 1.25, 1.28] },
            PB: { now: 6.90, prev: 6.70, hist: [6.4, 6.5, 6.6, 6.7, 6.8, 6.9] },
            SS: { now: 5.80, prev: 5.85, hist: [6.0, 5.95, 5.9, 5.85, 5.82, 5.8] },
        };
    });
    const saveProgi = (p) => { setProgi(p); try {
        localStorage.setItem("sk_intel_progi", JSON.stringify(p));
    }
    catch { } };
    const [progiOpen, setProgiOpen] = useState(false);
    const saveNot = (n) => { setNotowania(n); try {
        localStorage.setItem("sk_lme_v1", JSON.stringify(n));
    }
    catch { } };
    const [predBusy, setPredBusy] = useState(false);
    const [predykcje, setPredykcje] = useState(null);
    const [dodajMetalOpen, setDodajMetalOpen] = useState(false);
    const runPredykcje = async () => {
        setPredBusy(true);
        setPredykcje(null);
        try {
            const dane = Object.entries(notowania).map(([m, d]) => `${(METAL_LBL[m] || m)}: teraz ${d.now} zł/kg, ostatnie notowania: ${(d.hist || []).join(", ")}`).join("\n");
            const sys = `Jesteś analitykiem rynku metali i złomu w Polsce. Na podstawie historii notowań przewidź kierunek ceny każdego metalu w najbliższych 2-4 tygodniach i daj radę właścicielowi skupu. Bądź ostrożny — to prognoza oparta na trendzie, nie pewnik.
Odpowiedz WYŁĄCZNIE czystym JSON (tablica, bez markdown): [{"metal":"nazwa","kierunek":"wzrost|spadek|stabilnie","pewnosc":"wysoka|średnia|niska","rada":"skupuj|sprzedaj zapas|czekaj","uzasadnienie":"1-2 zdania po polsku"}]`;
            const res = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 900, system: sys, messages: [{ role: "user", content: `Notowania:\n${dane}\n\nDaj prognozę jako JSON.` }] }),
            });
            const data = await res.json();
            const txt = (data.content && data.content.map((b) => b.text || "").join("")) || "";
            setPredykcje(JSON.parse(txt.replace(/```json|```/g, "").trim()));
        }
        catch (err) {
            setPredykcje([{ error: true }]);
        }
        finally {
            setPredBusy(false);
        }
    };
    const dodajMetal = (g) => {
        const mats = (materials || []).filter(m => m.g === g && m.buy > 0);
        const cena = mats.length ? mats.reduce((a, m) => a + m.buy, 0) / mats.length : 0;
        const v = Math.round(cena * 100) / 100;
        saveNot({ ...notowania, [g]: { now: v, prev: v, hist: [v] } });
        setDodajMetalOpen(false);
    };
    const [sellBusy, setSellBusy] = useState(false);
    const [sellAI, setSellAI] = useState(null);
    const runSellAI = async () => {
        setSellBusy(true);
        setSellAI(null);
        try {
            const wStanie = sygnalySprzedazy.filter(s => s.zapasMetal > 0);
            if (wStanie.length === 0) {
                setSellAI([{ error: "Brak zapasu do analizy — najpierw przyjmij towar na magazyn." }]);
                setSellBusy(false);
                return;
            }
            const dane = wStanie.map(s => `${(METAL_LBL[s.metal] || s.metal)}: cena teraz ${s.now} zł/kg, ostatnie notowania ${(s.hist || []).join(", ")}, wartość zapasu ${Math.round(s.zapasMetal)} zł`).join("\n");
            const sys = `Jesteś analitykiem rynku metali i złomu w Polsce. Dla każdego metalu, który właściciel skupu MA NA STANIE, oceń czy cena ma większe szanse pójść w górę czy w dół w najbliższych 2-4 tygodniach i poradź: sprzedać teraz do huty czy poczekać. Bądź ostrożny — to prognoza z trendu, nie pewnik.
Odpowiedz WYŁĄCZNIE czystym JSON (tablica): [{"metal":"nazwa","kierunek":"w górę|w dół|stabilnie","decyzja":"sprzedaj teraz|poczekaj|obserwuj","uzasadnienie":"1-2 zdania po polsku"}]`;
            const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 800, system: sys, messages: [{ role: "user", content: `Mój zapas i notowania:\n${dane}\n\nDaj analizę jako JSON.` }] }) });
            const data = await res.json();
            const txt = (data.content && data.content.map(b => b.text || "").join("")) || "";
            setSellAI(JSON.parse(txt.replace(/```json|```/g, "").trim()));
        }
        catch (e) {
            setSellAI([{ error: "Nie udało się pobrać analizy. Spróbuj ponownie." }]);
        }
        finally {
            setSellBusy(false);
        }
    };
    // Analiza marży każdego materiału
    const analiza = (materials || []).map(m => {
        const marza = m.buy > 0 ? ((m.sell - m.buy) / m.buy) * 100 : 0;
        const marzaKg = m.sell - m.buy;
        let poziom = "dobry";
        if (marza < progi.min)
            poziom = "krytyczny";
        else if (marza < progi.ostrzezenie)
            poziom = "ostrzezenie";
        else if (marza < progi.dobry)
            poziom = "ok";
        return { ...m, marza, marzaKg, poziom, stockVal: (stock?.[m.id] || m.stock || 0) * m.buy };
    });
    const krytyczne = analiza.filter(a => a.poziom === "krytyczny").sort((a, b) => a.marza - b.marza);
    const ostrzezenia = analiza.filter(a => a.poziom === "ostrzezenie").sort((a, b) => a.marza - b.marza);
    const POZIOM_KOL = { krytyczny: "var(--red)", ostrzezenie: "var(--amber)", ok: "#84cc16", dobry: "var(--green)" };
    const POZIOM_LBL = { krytyczny: "KRYTYCZNA", ostrzezenie: "Niska", ok: "OK", dobry: "Dobra" };
    // Mapowanie grup materiałów na metale notowane
    const GRUPA_METAL = { CU: "CU", AL: "AL", FE: "FE", PB: "PB", ZN: "AL", SS: "SS", KAB: "CU" };
    const METAL_LBL = { CU: "Miedź", AL: "Aluminium", FE: "Stal/Żelazo", PB: "Ołów", SS: "Nierdzewka" };
    // Sygnały sprzedaży: jeśli cena rośnie i mamy zapas → sprzedaj
    const sygnalySprzedazy = Object.entries(notowania).map(([metal, d]) => {
        const zmiana = d.prev > 0 ? ((d.now - d.prev) / d.prev) * 100 : 0;
        const trend = zmiana > 1 ? "wzrost" : zmiana < -1 ? "spadek" : "stabilnie";
        // wartość zapasu tej grupy
        const zapasMetal = analiza.filter(a => GRUPA_METAL[a.g] === metal).reduce((s, a) => s + a.stockVal, 0);
        return { metal, ...d, zmiana, trend, zapasMetal };
    }).filter(s => s.zapasMetal > 0);
    const fmt = v => v.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";
    // Mini wykres trendu (sparkline)
    const Spark = ({ data, color }) => {
        const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
        const w = 80, h = 28;
        const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
        return React.createElement("svg", { width: w, height: h, style: { display: "block" } },
            React.createElement("polyline", { points: pts, fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }));
    };
    return (React.createElement("div", { style: { padding: "0 16px" } },
        React.createElement("header", { style: { paddingTop: 24 } },
            React.createElement("h1", { style: { margin: 0, fontFamily: "var(--display)", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" } }, "Wynik i mar\u017Ce"),
            React.createElement("div", { style: { color: "var(--muted)", fontSize: 14.5, marginTop: 2 } }, "Alarm mar\u017Cy \u00B7 notowania \u00B7 sygna\u0142y sprzeda\u017Cy")),
        React.createElement("div", { style: { display: "flex", gap: 5, marginTop: 16, overflowX: "auto", paddingBottom: 2 } }, [["alarmy", "🚨 Alarm marży"], ["notowania", "📈 Notowania"], ["predykcje", "🔮 Prognozy AI"], ["sygnaly", "💰 Kiedy sprzedać"]].map(([id, lbl]) => (React.createElement("button", { key: id, onClick: () => setView(id), style: { flexShrink: 0, padding: "8px 13px", borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: "pointer", border: view === id ? "1.5px solid var(--copper)" : "1px solid var(--line2)", background: view === id ? "rgba(200,116,63,.1)" : "var(--surface)", color: view === id ? "var(--copper)" : "var(--muted)" } }, lbl)))),
        view === "alarmy" && (React.createElement("div", { style: { marginTop: 14 } },
            krytyczne.length === 0 && ostrzezenia.length === 0 ? (React.createElement(Card, { style: { background: "rgba(21,163,74,.08)", border: "1px solid rgba(21,163,74,.3)" } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
                    React.createElement("span", { style: { fontSize: 30 } }, "\u2705"),
                    React.createElement("div", null,
                        React.createElement("div", { style: { fontWeight: 700, fontSize: 15 } }, "Wszystkie mar\u017Ce zdrowe"),
                        React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", marginTop: 2 } },
                            "\u017Baden materia\u0142 nie ma mar\u017Cy poni\u017Cej ",
                            progi.ostrzezenie,
                            "%."))))) : (React.createElement(React.Fragment, null,
                krytyczne.length > 0 && (React.createElement(Card, { style: { background: "rgba(220,38,38,.1)", border: "1px solid rgba(220,38,38,.35)", marginBottom: 12 } },
                    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 } },
                        React.createElement("span", { style: { fontSize: 24 } }, "\uD83D\uDEA8"),
                        React.createElement("div", null,
                            React.createElement("div", { style: { fontWeight: 800, fontSize: 15, color: "var(--red)" } },
                                "KRYTYCZNA MAR\u017BA \u2014 ",
                                krytyczne.length),
                            React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)" } }, "Kupujesz za drogo! Podnie\u015B sprzeda\u017C lub obni\u017C skup."))),
                    krytyczne.map(a => (React.createElement("div", { key: a.id, style: { padding: "10px 0", borderTop: "1px solid rgba(220,38,38,.2)" } },
                        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                            React.createElement("span", { style: { fontWeight: 700, fontSize: 15 } }, a.n),
                            React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 15, color: "var(--red)" } },
                                a.marza.toFixed(1),
                                "%")),
                        React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 3 } },
                            "skup ",
                            a.buy.toFixed(2),
                            " \u2192 sprzeda\u017C ",
                            a.sell.toFixed(2),
                            " \u00B7 zysk ",
                            fmt(a.marzaKg),
                            "/kg"),
                        React.createElement("div", { style: { fontSize: 13.5, marginTop: 5, color: "var(--amber)" } },
                            "\uD83D\uDCA1 Sugestia: podnie\u015B sprzeda\u017C do ",
                            (a.buy * (1 + progi.dobry / 100)).toFixed(2),
                            " z\u0142/kg (mar\u017Ca ",
                            progi.dobry,
                            "%)")))))),
                ostrzezenia.length > 0 && (React.createElement(Card, { style: { background: "rgba(217,119,6,.08)", border: "1px solid rgba(217,119,6,.3)" } },
                    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 } },
                        React.createElement("span", { style: { fontSize: 22 } }, "\u26A0\uFE0F"),
                        React.createElement("div", null,
                            React.createElement("div", { style: { fontWeight: 700, fontSize: 14.5, color: "var(--amber)" } },
                                "Niska mar\u017Ca \u2014 ",
                                ostrzezenia.length),
                            React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)" } },
                                "Mar\u017Ca poni\u017Cej ",
                                progi.ostrzezenie,
                                "% \u2014 warto przyjrze\u0107 si\u0119 cenom."))),
                    ostrzezenia.map(a => (React.createElement("div", { key: a.id, style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid rgba(217,119,6,.15)" } },
                        React.createElement("div", null,
                            React.createElement("span", { style: { fontWeight: 600, fontSize: 15 } }, a.n),
                            React.createElement("div", { style: { fontSize: 13, color: "var(--muted)" } },
                                a.buy.toFixed(2),
                                " \u2192 ",
                                a.sell.toFixed(2),
                                " \u00B7 ",
                                fmt(a.marzaKg),
                                "/kg")),
                        React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 14, color: "var(--amber)" } },
                            a.marza.toFixed(1),
                            "%")))))))),
            React.createElement("div", { style: sectionTitle }, "Zdrowie mar\u017Cy \u2014 wszystkie materia\u0142y"),
            React.createElement(Card, { pad: 4 }, analiza.sort((a, b) => a.marza - b.marza).map((a, i) => (React.createElement("div", { key: a.id, style: { display: "flex", alignItems: "center", gap: 10, padding: "10px", borderBottom: i < analiza.length - 1 ? "1px solid var(--line)" : "none" } },
                React.createElement("div", { style: { width: 6, height: 28, borderRadius: 3, background: POZIOM_KOL[a.poziom], flexShrink: 0 } }),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    React.createElement("div", { style: { fontSize: 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, a.n),
                    React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)" } },
                        a.buy.toFixed(2),
                        " \u2192 ",
                        a.sell.toFixed(2),
                        " z\u0142/kg")),
                React.createElement("div", { style: { textAlign: "right" } },
                    React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 14, color: POZIOM_KOL[a.poziom] } },
                        a.marza.toFixed(0),
                        "%"),
                    React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: POZIOM_KOL[a.poziom], textTransform: "uppercase" } }, POZIOM_LBL[a.poziom])))))),
            React.createElement(Card, { style: { marginTop: 14 } },
                React.createElement("div", { onClick: () => setProgiOpen(!progiOpen), style: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" } },
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, "\u2699\uFE0F Progi alarmu mar\u017Cy"),
                    React.createElement("span", { style: { fontSize: 13.5, color: "var(--muted)", fontWeight: 600 } }, progiOpen ? "ukryj ▲" : "ustaw ▼")),
                progiOpen && (React.createElement("div", { style: { marginTop: 14 } },
                    [["min", "Marża krytyczna — alarm czerwony", "var(--red)"], ["ostrzezenie", "Marża niska — ostrzeżenie", "var(--amber)"], ["dobry", "Marża docelowa — cel rentowności", "var(--green)"]].map(([key, opis, kol]) => (React.createElement("div", { key: key, style: { marginBottom: 16 } },
                        React.createElement("label", { style: { fontSize: 14, color: "var(--muted)", display: "block", marginBottom: 6, lineHeight: 1.4 } }, opis),
                        React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center" } },
                            React.createElement("input", { type: "number", value: progi[key], onChange: e => saveProgi({ ...progi, [key]: parseFloat(e.target.value) || 0 }), style: { flex: 1, padding: "11px 13px", borderRadius: 11, border: `1.5px solid ${kol}`, background: "var(--surface2)", color: kol, fontSize: 18, fontFamily: "var(--mono)", fontWeight: 800, outline: "none", boxSizing: "border-box" } }),
                            React.createElement("span", { style: { fontSize: 16, color: "var(--muted)", fontWeight: 700 } }, "%"))))),
                    React.createElement("div", { style: { fontSize: 13.5, lineHeight: 1.6, color: "var(--muted)", padding: "10px 12px", background: "var(--surface2)", borderRadius: 10 } },
                        "Metale kolorowe (mied\u017A, aluminium): mar\u017Ca 8-15% to norma. Stal: 15-25%. Ustaw ",
                        React.createElement("b", { style: { color: "var(--text)" } }, "krytyczn\u0105"),
                        " tam, gdzie zaczynasz traci\u0107 po kosztach transportu i ci\u0119cia.")))))),
        view === "notowania" && (React.createElement("div", { style: { marginTop: 14 } },
            React.createElement(Card, { style: { background: "rgba(63,125,138,.08)", border: "1px solid rgba(63,125,138,.25)", marginBottom: 14 } },
                React.createElement("div", { style: { fontSize: 14, lineHeight: 1.6, color: "var(--muted)" } }, "\uD83D\uDCCA Wpisuj aktualne ceny metali z gie\u0142dy (LME / lokalna huta). Apka pokazuje trend i podpowiada, czy podnie\u015B\u0107 ceny skupu, by przyci\u0105gn\u0105\u0107 dostawc\u00F3w.")),
            Object.entries(notowania).map(([metal, d]) => {
                const zmiana = d.prev > 0 ? ((d.now - d.prev) / d.prev) * 100 : 0;
                const up = zmiana >= 0;
                return (React.createElement(Card, { key: metal, style: { marginBottom: 10 } },
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                        React.createElement("div", null,
                            React.createElement("div", { style: { fontWeight: 700, fontSize: 15 } }, METAL_LBL[metal] || metal),
                            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 4 } },
                                React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 20 } }, d.now.toFixed(2)),
                                React.createElement("span", { style: { fontSize: 13.5, fontWeight: 700, color: up ? "var(--green)" : "var(--red)" } },
                                    up ? "▲" : "▼",
                                    " ",
                                    Math.abs(zmiana).toFixed(1),
                                    "%"))),
                        React.createElement(Spark, { data: d.hist, color: up ? "var(--green)" : "var(--red)" })),
                    React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
                        React.createElement("div", { style: { flex: 1 } },
                            React.createElement("label", { style: { fontSize: 12.5, color: "var(--muted)", marginBottom: 4, display: "block" } }, "Cena teraz (z\u0142/kg)"),
                            React.createElement("input", { type: "number", step: "0.01", value: d.now, onChange: e => { const v = parseFloat(e.target.value) || 0; saveNot({ ...notowania, [metal]: { ...d, prev: d.now, now: v, hist: [...d.hist.slice(-5), v] } }); }, style: { width: "100%", padding: "9px 11px", borderRadius: 9, border: "1px solid var(--line2)", background: "var(--surface2)", color: "var(--text)", fontSize: 15, fontFamily: "var(--mono)", fontWeight: 700, outline: "none", boxSizing: "border-box" } }))),
                    Math.abs(zmiana) > 2 && (React.createElement("div", { style: { marginTop: 10, padding: "9px 11px", background: up ? "rgba(21,163,74,.08)" : "rgba(220,38,38,.08)", borderRadius: 9, fontSize: 13.5, color: up ? "var(--green)" : "var(--red)", lineHeight: 1.5 } }, up ? `💡 Cena rośnie — rozważ podniesienie skupu, by przyciągnąć dostawców, lub sprzedaj zapas zanim spadnie.` : `⚠️ Cena spada — rozważ szybką sprzedaż zapasu i ostrożność przy skupie po wysokiej cenie.`))));
            }),
            !dodajMetalOpen ? (React.createElement("button", { onClick: () => setDodajMetalOpen(true), style: { ...btnGhost, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 } },
                React.createElement(Plus, { size: 17 }),
                " Dodaj metal do \u015Bledzenia")) : (React.createElement(Card, { style: { marginTop: 4 } },
                React.createElement("div", { style: { fontSize: 14.5, fontWeight: 700, marginBottom: 10 } }, "Wybierz metal z cennika"),
                React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } },
                    Object.keys(C).filter(g => !notowania[g]).map(g => (React.createElement("button", { key: g, onClick: () => dodajMetal(g), style: { display: "flex", alignItems: "center", gap: 7, padding: "9px 13px", borderRadius: 10, cursor: "pointer", border: "1px solid var(--line2)", background: "var(--surface)", color: "var(--text)", fontSize: 14.5, fontWeight: 700 } },
                        React.createElement("span", { style: { width: 9, height: 9, borderRadius: 3, background: C[g].color } }),
                        C[g].label))),
                    Object.keys(C).filter(g => !notowania[g]).length === 0 && React.createElement("div", { style: { fontSize: 14, color: "var(--muted)" } }, "Wszystkie metale z cennika s\u0105 ju\u017C \u015Bledzone.")),
                React.createElement("button", { onClick: () => setDodajMetalOpen(false), style: { ...btnGhost, marginTop: 12 } }, "Anuluj"))))),
        view === "predykcje" && (React.createElement("div", { style: { marginTop: 14 } },
            React.createElement(Card, { style: { background: "rgba(124,111,155,.08)", border: "1px solid rgba(124,111,155,.25)", marginBottom: 14 } },
                React.createElement("div", { style: { fontSize: 14, lineHeight: 1.6, color: "var(--muted)" } }, "\uD83D\uDD2E AI analizuje trend Twoich notowa\u0144 i prognozuje kierunek cen + radzi: skupowa\u0107, sprzeda\u0107 zapas czy czeka\u0107. Im wi\u0119cej notowa\u0144 wpiszesz w zak\u0142adce \u201ENotowania\", tym celniejsza prognoza.")),
            React.createElement("button", { onClick: runPredykcje, disabled: predBusy, style: { ...btnCopper, marginBottom: 14, opacity: predBusy ? .7 : 1 } }, predBusy ? React.createElement(React.Fragment, null,
                React.createElement(RefreshCw, { size: 17, className: "spin" }),
                " Analizuj\u0119 trend\u2026") : React.createElement(React.Fragment, null,
                React.createElement(Sparkles, { size: 17 }),
                " Prognozuj ceny (AI)")),
            predykcje && predykcje[0] && predykcje[0].error && (React.createElement(Card, { style: { background: "rgba(217,119,6,.08)", border: "1px solid rgba(217,119,6,.3)" } },
                React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", lineHeight: 1.5 } }, "Nie uda\u0142o si\u0119 pobra\u0107 prognozy. Spr\u00F3buj ponownie za chwil\u0119."))),
            predykcje && !predykcje[0]?.error && predykcje.map((p, i) => {
                const kol = p.kierunek === "wzrost" ? "var(--green)" : p.kierunek === "spadek" ? "var(--red)" : "var(--muted)";
                const ic = p.kierunek === "wzrost" ? "▲" : p.kierunek === "spadek" ? "▼" : "●";
                const radaKol = String(p.rada).includes("skupuj") ? "var(--green)" : String(p.rada).includes("sprzedaj") ? "var(--amber)" : "var(--muted)";
                return (React.createElement(Card, { key: i, style: { marginBottom: 10 } },
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
                        React.createElement("span", { style: { fontWeight: 700, fontSize: 15 } }, p.metal),
                        React.createElement("span", { style: { fontSize: 14.5, fontWeight: 800, color: kol } },
                            ic,
                            " ",
                            p.kierunek)),
                    React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 9 } },
                        React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700, padding: "4px 10px", borderRadius: 99, background: "var(--surface2)", color: "var(--muted)" } },
                            "pewno\u015B\u0107: ",
                            p.pewnosc),
                        React.createElement("span", { style: { fontSize: 12.5, fontWeight: 800, padding: "4px 10px", borderRadius: 99, background: radaKol + "1e", color: radaKol } },
                            "\u279C ",
                            p.rada)),
                    React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", lineHeight: 1.5 } }, p.uzasadnienie)));
            }),
            predykcje && !predykcje[0]?.error && React.createElement("div", { style: { fontSize: 12.5, color: "var(--faint)", marginTop: 6, lineHeight: 1.5, textAlign: "center" } }, "Prognoza orientacyjna na podstawie trendu notowa\u0144 \u2014 nie jest gwarancj\u0105. Decyzje podejmuj z rozwag\u0105."))),
        view === "sygnaly" && (React.createElement("div", { style: { marginTop: 14 } },
            React.createElement(Card, { style: { background: "rgba(200,116,63,.07)", border: "1px solid rgba(200,116,63,.25)", marginBottom: 14 } },
                React.createElement("div", { style: { fontSize: 14, lineHeight: 1.6, color: "var(--muted)" } }, "\uD83D\uDCB0 Pokazuje tylko metale, kt\u00F3re masz na stanie. Podpowiada, kiedy sprzeda\u0107 do huty, by nie trzyma\u0107 zamro\u017Conej got\u00F3wki ani nie sprzeda\u0107 w do\u0142ku cenowym.")),
            React.createElement("button", { onClick: runSellAI, disabled: sellBusy, style: { ...btnCopper, marginBottom: 14, opacity: sellBusy ? .7 : 1 } }, sellBusy ? React.createElement(React.Fragment, null,
                React.createElement(RefreshCw, { size: 17, className: "spin" }),
                " Analizuj\u0119 rynek\u2026") : React.createElement(React.Fragment, null,
                React.createElement(Sparkles, { size: 17 }),
                " Sprzeda\u0107 czy czeka\u0107? (AI)")),
            sellAI && sellAI[0] && sellAI[0].error && React.createElement(Card, { style: { marginBottom: 12, background: "rgba(217,119,6,.08)", border: "1px solid rgba(217,119,6,.3)" } },
                React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", lineHeight: 1.5 } }, sellAI[0].error)),
            sellAI && !sellAI[0]?.error && sellAI.map((p, i) => {
                const kol = p.kierunek === "w górę" ? "var(--green)" : p.kierunek === "w dół" ? "var(--red)" : "var(--muted)";
                const dkol = String(p.decyzja).includes("sprzedaj") ? "var(--green)" : String(p.decyzja).includes("poczekaj") ? "var(--amber)" : "var(--muted)";
                return (React.createElement(Card, { key: "sai" + i, style: { marginBottom: 10, border: "1px solid rgba(124,111,155,.25)" } },
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
                        React.createElement("span", { style: { fontWeight: 700, fontSize: 14.5 } }, p.metal),
                        React.createElement("span", { style: { fontSize: 14, fontWeight: 800, color: kol } },
                            p.kierunek === "w górę" ? "▲" : p.kierunek === "w dół" ? "▼" : "●",
                            " ",
                            p.kierunek)),
                    React.createElement("span", { style: { fontSize: 12.5, fontWeight: 800, padding: "4px 11px", borderRadius: 99, background: dkol + "1e", color: dkol } },
                        "\u279C ",
                        p.decyzja),
                    React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", lineHeight: 1.5, marginTop: 9 } }, p.uzasadnienie)));
            }),
            sellAI && !sellAI[0]?.error && React.createElement("div", { style: { fontSize: 12.5, color: "var(--faint)", marginBottom: 10, textAlign: "center", lineHeight: 1.5 } }, "Prognoza orientacyjna z trendu \u2014 nie gwarancja. Decyzje podejmuj z rozwag\u0105."),
            sygnalySprzedazy.length === 0 ? (React.createElement(Card, null,
                React.createElement("div", { style: { color: "var(--muted)", fontSize: 15, textAlign: "center", padding: "10px 0" } }, "Brak sygna\u0142\u00F3w \u2014 uzupe\u0142nij notowania i stany magazynu."))) : sygnalySprzedazy.sort((a, b) => b.zapasMetal - a.zapasMetal).map(s => {
                const sygnal = s.trend === "wzrost" && s.zapasMetal > 0 ? "SPRZEDAJ" : s.trend === "spadek" ? "TRZYMAJ/SKUPUJ" : "OBSERWUJ";
                const kol = sygnal === "SPRZEDAJ" ? "var(--green)" : sygnal === "TRZYMAJ/SKUPUJ" ? "var(--amber)" : "var(--muted)";
                return (React.createElement(Card, { key: s.metal, style: { marginBottom: 10 } },
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 } },
                        React.createElement("div", null,
                            React.createElement("div", { style: { fontWeight: 700, fontSize: 15 } }, METAL_LBL[s.metal] || s.metal),
                            React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 2 } },
                                "cena ",
                                s.now.toFixed(2),
                                " z\u0142/kg \u00B7 ",
                                s.trend === "wzrost" ? "▲" : s.trend === "spadek" ? "▼" : "●",
                                " ",
                                Math.abs(s.zmiana).toFixed(1),
                                "%")),
                        React.createElement("span", { style: { fontSize: 13, fontWeight: 800, color: kol, background: kol.replace("var(--", "rgba(").replace(")", ",.12)").includes("rgba") ? kol + "22" : kol + "22", padding: "5px 11px", borderRadius: 99, border: `1px solid ${kol}` } }, sygnal)),
                    React.createElement("div", { style: { paddingTop: 8, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", fontSize: 14 } },
                        React.createElement("span", { style: { color: "var(--muted)" } }, "Warto\u015B\u0107 Twojego zapasu:"),
                        React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 700 } }, fmt(s.zapasMetal))),
                    sygnal === "SPRZEDAJ" && s.zapasMetal > 0 && React.createElement("div", { style: { marginTop: 8, fontSize: 13.5, color: "var(--green)", lineHeight: 1.5 } },
                        "\uD83D\uDCA1 Cena ro\u015Bnie i masz zapas wart ",
                        fmt(s.zapasMetal),
                        " \u2014 dobry moment na sprzeda\u017C do huty.")));
            })))));
}
/* ─────────── Generator grafiki cennika (Canvas → PNG) ─────────── */
function CennikGrafika({ materials, company, onClose }) {
    const canvasRef = React.useRef(null);
    const [motyw, setMotyw] = React.useState("dark");
    const draw = React.useCallback((theme) => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const mats = (materials || []).filter((m) => m.buy > 0);
        const byG = {};
        mats.forEach((m) => { (byG[m.g] = byG[m.g] || []).push(m); });
        const groups = Object.keys(byG);
        const W = 1080, pad = 72, headerH = 360, rowH = 70, ghH = 60, footerH = 250;
        let bodyH = 0;
        groups.forEach((g) => { bodyH += ghH + byG[g].length * rowH + 18; });
        const H = Math.max(900, headerH + bodyH + footerH);
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        const dark = theme === "dark";
        const bg1 = dark ? "#1b2129" : "#fbfaf8", bg2 = dark ? "#0f1318" : "#efe9e1";
        const txt = dark ? "#e8ecf0" : "#1c1c1c", muted = dark ? "#8a97a7" : "#7a7268", copper = "#c8743f";
        const line = dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.07)";
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, bg1);
        grad.addColorStop(1, bg2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = copper;
        ctx.fillRect(0, 0, W, 14);
        ctx.textAlign = "center";
        ctx.fillStyle = muted;
        ctx.font = "600 28px system-ui, sans-serif";
        ctx.fillText((company && company.name ? company.name : "SKUP ZŁOMU").toUpperCase(), W / 2, 92);
        ctx.fillStyle = copper;
        ctx.font = "800 78px system-ui, sans-serif";
        ctx.fillText("CENNIK SKUPU", W / 2, 182);
        const dt = new Date().toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
        ctx.fillStyle = muted;
        ctx.font = "500 30px system-ui, sans-serif";
        ctx.fillText("Aktualne ceny • " + dt, W / 2, 236);
        ctx.strokeStyle = copper;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pad, 288);
        ctx.lineTo(W - pad, 288);
        ctx.stroke();
        ctx.fillStyle = muted;
        ctx.font = "700 23px system-ui";
        ctx.textAlign = "left";
        ctx.fillText("MATERIAŁ", pad, 332);
        ctx.textAlign = "right";
        ctx.fillText("CENA SKUPU", W - pad, 332);
        let y = headerH + 16;
        ctx.textBaseline = "middle";
        groups.forEach((g) => {
            ctx.textAlign = "left";
            ctx.fillStyle = C[g].color;
            ctx.font = "800 30px system-ui";
            ctx.fillText(C[g].label.toUpperCase(), pad, y);
            y += ghH;
            byG[g].forEach((m) => {
                ctx.beginPath();
                ctx.arc(pad + 9, y, 9, 0, Math.PI * 2);
                ctx.fillStyle = C[g].color;
                ctx.fill();
                ctx.textAlign = "left";
                ctx.fillStyle = txt;
                ctx.font = "600 33px system-ui";
                ctx.fillText(m.n, pad + 36, y);
                ctx.textAlign = "right";
                ctx.fillStyle = copper;
                ctx.font = "800 37px ui-monospace, monospace";
                ctx.fillText(m.buy.toFixed(2).replace(".", ",") + " zł/kg", W - pad, y);
                ctx.strokeStyle = line;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(pad, y + rowH / 2 - 3);
                ctx.lineTo(W - pad, y + rowH / 2 - 3);
                ctx.stroke();
                y += rowH;
            });
            y += 18;
        });
        ctx.textBaseline = "alphabetic";
        const fy = H - footerH + 60;
        ctx.strokeStyle = copper;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pad, fy - 40);
        ctx.lineTo(W - pad, fy - 40);
        ctx.stroke();
        ctx.textAlign = "center";
        if (company && company.phone) {
            ctx.fillStyle = txt;
            ctx.font = "700 36px system-ui";
            ctx.fillText("Tel. " + company.phone, W / 2, fy + 16);
        }
        if (company && company.addr) {
            ctx.fillStyle = muted;
            ctx.font = "500 28px system-ui";
            ctx.fillText(company.addr, W / 2, fy + 62);
        }
        ctx.fillStyle = muted;
        ctx.font = "italic 25px system-ui";
        ctx.fillText("Ceny orientacyjne — ostateczna wycena po zważeniu w punkcie", W / 2, fy + 118);
    }, [materials, company]);
    React.useEffect(() => { draw(motyw); }, [motyw, draw]);
    const pobierz = () => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        canvas.toBlob((blob) => {
            if (!blob)
                return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "cennik-" + todayStr() + ".png";
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1500);
        }, "image/png");
    };
    const maAktywne = (materials || []).some((m) => m.buy > 0);
    return (React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 80, background: "var(--bg)", display: "flex", flexDirection: "column" } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "calc(12px + env(safe-area-inset-top)) 16px 12px", borderBottom: "1px solid var(--line)", background: "var(--surface)" } },
            React.createElement("button", { onClick: onClose, style: iconBtn },
                React.createElement(ChevronLeft, { size: 20 })),
            React.createElement("div", { style: { flex: 1, fontFamily: "var(--display)", fontSize: 18, fontWeight: 800 } }, "Cennik \u2014 grafika")),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "16px 16px 40px" } }, !maAktywne ? (React.createElement(Card, { style: { textAlign: "center", padding: 40, color: "var(--muted)" } },
            React.createElement("div", { style: { fontSize: 15, fontWeight: 700 } }, "Brak cen do pokazania"),
            React.createElement("div", { style: { fontSize: 14.5, marginTop: 4 } }, "Ustaw ceny skupu w cenniku, potem wygeneruj grafik\u0119."))) : (React.createElement(React.Fragment, null,
            React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 14 } }, [["dark", "Ciemny"], ["light", "Jasny"]].map(([k, l]) => (React.createElement("button", { key: k, onClick: () => setMotyw(k), style: { flex: 1, padding: "11px", borderRadius: 11, cursor: "pointer", fontSize: 15, fontWeight: 700, border: motyw === k ? "1.5px solid var(--copper)" : "1px solid var(--line2)", background: motyw === k ? "rgba(200,116,63,.1)" : "var(--surface)", color: motyw === k ? "var(--copper)" : "var(--muted)" } }, l)))),
            React.createElement("div", { style: { borderRadius: 14, overflow: "hidden", border: "1px solid var(--line)", boxShadow: "0 14px 34px -12px rgba(0,0,0,.5)" } },
                React.createElement("canvas", { ref: canvasRef, style: { width: "100%", display: "block" } })),
            React.createElement("button", { onClick: pobierz, style: { ...btnCopper, marginTop: 16 } },
                React.createElement(Download, { size: 18 }),
                " Pobierz grafik\u0119 (PNG)"),
            React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.5, textAlign: "center" } }, "Gotowe do druku, wywieszenia w punkcie lub wrzucenia na Facebooka / Google Moja Firma."))))));
}
function Cennik({ materials, setMaterials, canEdit = true, company, showMargin = true }) {
    const [q, setQ] = useState("");
    const [gfxOpen, setGfxOpen] = useState(false);
    const [edit, setEdit] = useState(null);
    const [b, setB] = useState("");
    const [s, setS] = useState("");
    const groups = Object.keys(C);
    const open = (m) => { if (!canEdit)
        return; setEdit(m); setB(String(m.buy)); setS(String(m.sell)); };
    const saveEdit = () => { setMaterials((p) => p.map((m) => m.id === edit.id ? { ...m, buy: parseFloat(b) || 0, sell: parseFloat(s) || 0 } : m)); setEdit(null); };
    const matches = (m) => !q.trim() || fnorm(m.n).includes(fnorm(q)) || C[m.g].code.includes(q.trim());
    return (React.createElement("div", { style: { padding: "0 16px" } },
        gfxOpen && React.createElement(CennikGrafika, { materials: materials, company: company, onClose: () => setGfxOpen(false) }),
        React.createElement("header", { style: { paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" } },
            React.createElement("div", null,
                React.createElement("h1", { style: { margin: 0, fontFamily: "var(--display)", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" } }, "Cennik"),
                React.createElement("div", { style: { color: "var(--muted)", fontSize: 14.5, marginTop: 2 } }, canEdit ? "Ceny skupu i sprzedaży · zł/kg" : "Podgląd cen · tylko właściciel edytuje")),
            React.createElement("div", { style: { textAlign: "right", display: "flex", alignItems: "center", gap: 6, color: "var(--green)", fontSize: 13, fontWeight: 600, marginTop: 6 } },
                React.createElement("span", { style: { width: 7, height: 7, borderRadius: 99, background: "var(--green)" } }),
                "notowania: dzi\u015B 8:00")),
        React.createElement("div", { style: { position: "relative", marginTop: 16 } },
            React.createElement(Search, { size: 17, color: "var(--faint)", style: { position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" } }),
            React.createElement("input", { style: { ...inputStyle, paddingLeft: 40 }, placeholder: "Szukaj materia\u0142u lub kodu (17 04\u2026)", value: q, onChange: (e) => setQ(e.target.value) })),
        React.createElement("button", { onClick: () => setGfxOpen(true), style: { ...btnGhost, marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--copper)", borderColor: "rgba(200,116,63,.4)" } },
            React.createElement(Printer, { size: 17 }),
            " Generuj cennik jako grafik\u0119"),
        React.createElement("div", { style: { display: "flex", padding: "16px 12px 4px", fontSize: 12.5, color: "var(--faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" } },
            React.createElement("span", { style: { flex: 1 } }, "Materia\u0142"),
            React.createElement("span", { style: { width: 74, textAlign: "right" } }, "Skup"),
            showMargin && React.createElement("span", { style: { width: 74, textAlign: "right" } }, "Sprzeda\u017C"),
            showMargin && React.createElement("span", { style: { width: 52, textAlign: "right" } }, "Mar\u017Ca")),
        groups.map((g) => {
            const items = materials.filter((m) => m.g === g && matches(m));
            if (!items.length)
                return null;
            return (React.createElement("div", { key: g, style: { marginBottom: 8 } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, margin: "12px 4px 8px" } },
                    codeChip(g),
                    React.createElement("span", { style: { fontFamily: "var(--display)", fontSize: 14.5, fontWeight: 700, color: "var(--muted)" } }, C[g].label)),
                React.createElement(Card, { pad: 4 }, items.map((m, i) => {
                    const marza = m.buy ? ((m.sell - m.buy) / m.buy) * 100 : 0;
                    return (React.createElement("div", { key: m.id, onClick: () => open(m), style: { display: "flex", alignItems: "center", padding: "12px 10px", cursor: canEdit ? "pointer" : "default", borderBottom: i < items.length - 1 ? "1px solid var(--line)" : "none" } },
                        React.createElement("span", { style: { flex: 1, fontSize: 14, fontWeight: 600, paddingRight: 8 } }, m.n),
                        React.createElement("span", { style: { width: 74, textAlign: "right", fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700 } }, m.buy.toFixed(2)),
                        showMargin && React.createElement("span", { style: { width: 74, textAlign: "right", fontFamily: "var(--mono)", fontSize: 15, color: "var(--muted)" } }, m.sell.toFixed(2)),
                        showMargin && React.createElement("span", { style: { width: 52, textAlign: "right", fontFamily: "var(--mono)", fontSize: 14, fontWeight: 700, color: marza >= 20 ? "var(--green)" : "var(--amber)" } },
                            Math.round(marza),
                            "%")));
                }))));
        }),
        React.createElement(Sheet, { open: !!edit, onClose: () => setEdit(null), title: edit ? edit.n : "" },
            edit && React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 } },
                codeChip(edit.g),
                React.createElement("span", { style: { fontSize: 14, color: "var(--muted)" } }, C[edit.g].label)),
            React.createElement("div", { style: { display: "flex", gap: 10 } },
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("label", { style: label }, "Cena skupu (z\u0142/kg)"),
                    React.createElement("input", { style: { ...inputStyle, fontFamily: "var(--mono)", fontWeight: 700, fontSize: 18 }, type: "number", inputMode: "decimal", value: b, onChange: (e) => setB(e.target.value) })),
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("label", { style: label }, "Cena sprzeda\u017Cy"),
                    React.createElement("input", { style: { ...inputStyle, fontFamily: "var(--mono)", fontWeight: 700, fontSize: 18 }, type: "number", inputMode: "decimal", value: s, onChange: (e) => setS(e.target.value) }))),
            React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", margin: "12px 2px 0" } },
                "Mar\u017Ca: ",
                React.createElement("b", { style: { color: "var(--text)" } },
                    b && s ? Math.round(((parseFloat(s) - parseFloat(b)) / parseFloat(b)) * 100) : 0,
                    "%"),
                " \u00B7 ",
                b && s ? pln(parseFloat(s) - parseFloat(b)) : "—",
                " / kg"),
            React.createElement("button", { style: { ...btnCopper, marginTop: 16 }, onClick: saveEdit }, "Zapisz ceny"))));
}
/* ─────────── Magazyn ─────────── */
/* ─────────── Konsolidacja transportu do huty ─────────── */
function KonsolidacjaTransportu({ materials, stock }) {
    const [open, setOpen] = useState(false);
    // Parametry transportu (edytowalne, zapis lokalny)
    const [param, setParam] = useState(() => {
        try {
            const s = localStorage.getItem("sk_transport_v1");
            if (s)
                return JSON.parse(s);
        }
        catch { }
        return {
            ladownosc: 24000, // ładowność auta w kg (np. 24t ciężarówka)
            dystans: 45, // km w jedną stronę do huty
            spalanie: 35, // litry/100km
            paliwo: 6.20, // zł/litr (diesel)
            kierowca: 150, // koszt kierowcy/dzień
            oplaty: 50, // autostrada, inne
        };
    });
    const save = (p) => { setParam(p); try {
        localStorage.setItem("sk_transport_v1", JSON.stringify(p));
    }
    catch { } };
    const upd = (k, v) => save({ ...param, [k]: v });
    const num = (x) => { const n = parseFloat(x); return isNaN(n) ? 0 : n; };
    // Co mamy na stanie (do sprzedaży hucie)
    const dostepne = (materials || []).map(m => ({ ...m, st: stock?.[m.id] || 0 })).filter(m => m.st > 0);
    const totMass = dostepne.reduce((a, m) => a + m.st, 0);
    const totValue = dostepne.reduce((a, m) => a + m.st * m.sell, 0);
    // Podział: stal (FE) osobno, metale kolorowe osobno — jadą do różnych odbiorców
    const stalMats = dostepne.filter(m => m.g === "FE");
    const kolorMats = dostepne.filter(m => m.g !== "FE");
    const stalMass = stalMats.reduce((a, m) => a + m.st, 0);
    const kolorMass = kolorMats.reduce((a, m) => a + m.st, 0);
    const stalVal = stalMats.reduce((a, m) => a + m.st * m.sell, 0);
    const kolorVal = kolorMats.reduce((a, m) => a + m.st * m.sell, 0);
    const celStal = num(param.celStal) || num(param.ladownosc) || 24000; // pełny ładunek stali
    const celKolor = num(param.celKolor) || 3000; // partia kolorowych warta kursu
    const fillStal = celStal > 0 ? Math.min(100, stalMass / celStal * 100) : 0;
    const fillKolor = celKolor > 0 ? Math.min(100, kolorMass / celKolor * 100) : 0;
    // Koszt jednego kursu
    const kmTotal = num(param.dystans) * 2; // tam i z powrotem
    const kosztPaliwa = (kmTotal * num(param.spalanie) / 100) * num(param.paliwo);
    const kosztKursu = kosztPaliwa + num(param.kierowca) + num(param.oplaty);
    // Ile kursów potrzeba przy obecnym stanie
    const L = num(param.ladownosc);
    const kursy = L > 0 ? Math.ceil(totMass / L) : 0;
    const wypelnienie = L > 0 ? Math.min(100, (totMass / L) * 100) : 0;
    // Koszt transportu na kg
    const kosztNaKg = totMass > 0 ? (kosztKursu * kursy) / totMass : 0;
    // Koszt transportu jako % wartości
    const kosztProcent = totValue > 0 ? (kosztKursu * kursy) / totValue * 100 : 0;
    // Analiza: czy warto czekać na pełny ładunek?
    const brakDoPelnego = L - (totMass % L || L);
    const kosztNaKgTeraz = kosztNaKg;
    // Gdyby dopełnić ładunek (mniej kursów na kg)
    const masaPelna = kursy * L;
    const kosztNaKgPelny = masaPelna > 0 ? (kosztKursu * kursy) / masaPelna : 0;
    const oszczednoscNaKg = kosztNaKgTeraz - kosztNaKgPelny;
    const fmt = v => v.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";
    const fmt0 = v => Math.round(v).toLocaleString("pl-PL") + " zł";
    // Rekomendacja
    const rekomendacja = (() => {
        if (totMass === 0)
            return { txt: "Brak materiału na stanie.", kol: "var(--muted)", ic: "📦" };
        if (wypelnienie < 60)
            return { txt: `Auto wypełnione w ${Math.round(wypelnienie)}%. Poczekaj na więcej materiału — jeden kurs z pełnym ładunkiem jest znacznie tańszy na kg.`, kol: "var(--amber)", ic: "⏳" };
        if (wypelnienie >= 90)
            return { txt: `Auto prawie pełne (${Math.round(wypelnienie)}%). Dobry moment na wywóz do huty!`, kol: "var(--green)", ic: "🚛" };
        return { txt: `Auto wypełnione w ${Math.round(wypelnienie)}%. Możesz jechać lub poczekać na dopełnienie.`, kol: "#84cc16", ic: "✅" };
    })();
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { style: sectionTitle }, "Konsolidacja transportu do huty"),
        (() => {
            const karta = (nazwa, mass, val, fill, cel, ikona) => {
                const st = fill >= 90 ? { lbl: "Można wywozić", kol: "var(--green)", ic: "🚛", bg: "rgba(21,163,74,.1)", br: "rgba(21,163,74,.3)" }
                    : fill < 60 ? { lbl: "Poczekaj", kol: "var(--amber)", ic: "⏳", bg: "rgba(217,119,6,.1)", br: "rgba(217,119,6,.3)" }
                        : { lbl: "Możesz wywozić", kol: "#84cc16", ic: "✅", bg: "rgba(132,204,22,.08)", br: "rgba(132,204,22,.3)" };
                return (React.createElement(Card, { style: { background: st.bg, border: `1px solid ${st.br}`, marginBottom: 10 } },
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
                        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 9 } },
                            React.createElement("span", { style: { fontSize: 22 } }, ikona),
                            React.createElement("div", null,
                                React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, nazwa),
                                React.createElement("div", { style: { fontSize: 13, color: "var(--muted)" } }, mass > 0 ? fmt0(val) : "brak na stanie"))),
                        React.createElement("span", { style: { fontSize: 12.5, fontWeight: 800, color: st.kol, background: "var(--surface2)", padding: "5px 11px", borderRadius: 99 } },
                            st.ic,
                            " ",
                            st.lbl)),
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--muted)", marginBottom: 5 } },
                        React.createElement("span", null,
                            "Zebrane: ",
                            kg(mass)),
                        React.createElement("span", null,
                            Math.round(fill),
                            "% z ",
                            kg(cel))),
                    React.createElement("div", { style: { height: 7, background: "var(--surface2)", borderRadius: 9, overflow: "hidden" } },
                        React.createElement("div", { style: { height: "100%", width: Math.min(100, fill) + "%", background: fill >= 90 ? "linear-gradient(90deg,var(--green),#10b981)" : fill >= 60 ? "#84cc16" : "var(--amber)", borderRadius: 9, transition: "width .4s" } }))));
            };
            return (React.createElement(React.Fragment, null,
                karta("Stal", stalMass, stalVal, fillStal, celStal, "🔩"),
                karta("Metale kolorowe", kolorMass, kolorVal, fillKolor, celKolor, "🔶")));
        })(),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 } },
            React.createElement(Card, { pad: 13 },
                React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)" } }, "Koszt 1 kursu"),
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 18, marginTop: 4, color: "var(--copper)" } }, fmt0(kosztKursu)),
                React.createElement("div", { style: { fontSize: 12, color: "var(--faint)", marginTop: 2 } },
                    kmTotal,
                    " km tam i z powrotem")),
            React.createElement(Card, { pad: 13 },
                React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)" } }, "Koszt transportu / kg"),
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 18, marginTop: 4 } },
                    kosztNaKg.toFixed(3),
                    " z\u0142"),
                React.createElement("div", { style: { fontSize: 12, color: "var(--faint)", marginTop: 2 } },
                    kosztProcent.toFixed(1),
                    "% warto\u015Bci \u0142adunku"))),
        totMass > 0 && wypelnienie < 90 && oszczednoscNaKg > 0.001 && (React.createElement(Card, { style: { background: "rgba(21,163,74,.07)", border: "1px solid rgba(21,163,74,.25)", marginBottom: 10 } },
            React.createElement("div", { style: { fontSize: 14.5, lineHeight: 1.6 } },
                React.createElement("b", { style: { color: "var(--green)" } }, "\uD83D\uDCB0 Oszcz\u0119dno\u015B\u0107 z dope\u0142nienia \u0142adunku:"),
                React.createElement("br", null),
                React.createElement("span", { style: { color: "var(--muted)" } },
                    "Dowie\u017A jeszcze ",
                    React.createElement("b", { style: { color: "var(--text)" } }, kg(brakDoPelnego)),
                    ", a koszt transportu spadnie z ",
                    kosztNaKgTeraz.toFixed(3),
                    " do ",
                    kosztNaKgPelny.toFixed(3),
                    " z\u0142/kg. Przy pe\u0142nym aucie oszcz\u0119dzasz ",
                    React.createElement("b", { style: { color: "var(--green)" } },
                        (oszczednoscNaKg * masaPelna).toFixed(0),
                        " z\u0142"),
                    " na transporcie.")))),
        React.createElement(Card, { style: { marginBottom: 10 } },
            React.createElement("div", { style: { fontWeight: 700, fontSize: 15, marginBottom: 10 } }, "\uD83D\uDCE6 Tw\u00F3j stan do wywozu"),
            [
                ["Masa łącznie", kg(totMass)],
                ["Wartość (ceny sprzedaży)", fmt(totValue)],
                ["Potrzebnych kursów", kursy + (kursy === 1 ? " kurs" : " kursy")],
                ["Łączny koszt transportu", fmt0(kosztKursu * kursy)],
                ["Zysk po transporcie", fmt0(totValue - kosztKursu * kursy)],
            ].map(([l, v], i, arr) => (React.createElement("div", { key: l, style: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none", fontSize: 14.5 } },
                React.createElement("span", { style: { color: "var(--muted)" } }, l),
                React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 700, color: i === arr.length - 1 ? "var(--green)" : "var(--text)" } }, v))))),
        React.createElement("button", { onClick: () => setOpen(!open), style: { width: "100%", padding: "11px", borderRadius: 12, border: "1px solid var(--line2)", background: "var(--surface)", color: "var(--muted)", fontWeight: 600, fontSize: 14.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 } },
            "\u2699\uFE0F ",
            open ? "Ukryj" : "Ustaw",
            " parametry transportu"),
        open && (React.createElement(Card, { style: { marginTop: 10 } },
            [
                ["ladownosc", "Ładowność auta (kg)", "np. 24000 dla ciężarówki 24t"],
                ["dystans", "Dystans do huty (km, w jedną stronę)", ""],
                ["spalanie", "Spalanie (litry / 100 km)", ""],
                ["paliwo", "Cena paliwa (zł / litr)", ""],
                ["kierowca", "Koszt kierowcy (zł / dzień)", ""],
                ["oplaty", "Opłaty drogowe (zł / kurs)", "autostrada, parkingi"],
            ].map(([k, l, hint]) => (React.createElement("div", { key: k, style: { marginBottom: 12 } },
                React.createElement("label", { style: { fontSize: 13.5, color: "var(--muted)", fontWeight: 600, display: "block", marginBottom: 5 } },
                    l,
                    hint && React.createElement("span", { style: { color: "var(--faint)", fontWeight: 400 } },
                        " \u00B7 ",
                        hint)),
                React.createElement("input", { type: "number", value: param[k], onChange: e => upd(k, e.target.value), style: { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line2)", background: "var(--surface2)", color: "var(--text)", fontSize: 15, fontFamily: "var(--mono)", fontWeight: 700, outline: "none", boxSizing: "border-box" } })))),
            React.createElement("div", { style: { fontSize: 13, color: "var(--faint)", lineHeight: 1.5, marginTop: 4 } }, "Parametry zapisuj\u0105 si\u0119 lokalnie. Ustaw raz pod swoje auto i tras\u0119 do huty.")))));
}
function Magazyn({ materials, stock, mm, dispatch, setDispatch, buyers = [], setBuyers, isOwner = true, punkt = "" }) {
    const [wyd, setWyd] = useState(false);
    const [wMat, setWMat] = useState("");
    const [wW, setWW] = useState("");
    const [wKontr, setWKontr] = useState("");
    const [wPrice, setWPrice] = useState("");
    const [buyersOpen, setBuyersOpen] = useState(false);
    const buyerByName = (n) => (buyers || []).find((b) => b.name.trim().toLowerCase() === String(n || "").trim().toLowerCase());
    const suggestPrice = (matId, kontr) => { const b = buyerByName(kontr); const p = b && b.prices ? b.prices[matId] : undefined; return p != null && p !== "" ? +p : ((mm[matId] || {}).sell || 0); };
    useEffect(() => { if (wyd && wMat) setWPrice(String(suggestPrice(wMat, wKontr) || "")); }, [wMat, wKontr, wyd]);
    const rows = materials.map((m) => ({ ...m, st: stock[m.id] || 0 })).filter((m) => m.st > 0).sort((a, b) => b.st * b.buy - a.st * a.buy);
    const totMass = rows.reduce((a, m) => a + m.st, 0);
    const totCost = rows.reduce((a, m) => a + m.st * m.buy, 0);
    const totSell = rows.reduce((a, m) => a + m.st * m.sell, 0);
    const profit = totSell - totCost;
    const maxV = rows.length ? rows[0].st * rows[0].buy : 1;
    const recentDisp = (dispatch || []).slice(0, 6);
    const addDispatch = () => {
        const w = parseFloat(wW);
        if (!wMat || isNaN(w) || w <= 0 || !wKontr.trim())
            return;
        const pr = isOwner ? parseFloat(String(wPrice).replace(",", ".")) : suggestPrice(wMat, wKontr);
        setDispatch((p) => [{ id: uid(), matId: wMat, w, contractor: wKontr.trim(), ...(punkt ? { punkt } : {}), ...(pr > 0 ? { price: Math.round(pr * 100) / 100 } : {}), dateKey: todayStr(), ts: Date.now() }, ...p]);
        setWMat("");
        setWW("");
        setWKontr("");
        setWPrice("");
        setWyd(false);
    };
    return (React.createElement("div", { style: { padding: "0 16px" } },
        React.createElement("header", { style: { paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" } },
            React.createElement("div", null,
                React.createElement("h1", { style: { margin: 0, fontFamily: "var(--display)", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" } }, "Magazyn"),
                React.createElement("div", { style: { color: "var(--muted)", fontSize: 14.5, marginTop: 2 } },
                    kg(totMass),
                    " na stanie")),
            React.createElement("button", { onClick: () => { setWMat(rows[0] ? rows[0].id : (materials[0] && materials[0].id)); setWW(""); setWKontr(""); setWyd(true); }, style: { ...iconBtn, width: "auto", padding: "0 14px", gap: 7, fontSize: 14.5, fontWeight: 700, color: "var(--copper)" } },
                React.createElement(Truck, { size: 16 }),
                " Wydaj")),
        isOwner && React.createElement("button", { onClick: () => setBuyersOpen(true), style: { ...btnGhost, marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 } }, React.createElement(Factory, { size: 17 }), " Odbiorcy i ich ceny (", (buyers || []).length, ")"),
        isOwner && buyersOpen && React.createElement(OdbiorcyPanel, { buyers, setBuyers, materials, onClose: () => setBuyersOpen(false) }),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginTop: 16 } },
            React.createElement(Card, { pad: 14 },
                React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)" } }, "Warto\u015B\u0107 (koszt skupu)"),
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 21, marginTop: 4 } }, plnShort(totCost))),
            isOwner && React.createElement(Card, { pad: 14 },
                React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)" } }, "Potencjalny przych\u00F3d"),
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 21, marginTop: 4, color: "#3f7d8a" } }, plnShort(totSell)))),
        isOwner && React.createElement(Card, { style: { marginTop: 11, background: "linear-gradient(135deg,rgba(21,163,74,.1),rgba(21,163,74,.02))", border: "1px solid rgba(21,163,74,.25)" } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 9 } },
                    React.createElement("div", { style: { width: 36, height: 36, borderRadius: 10, background: "rgba(21,163,74,.15)", display: "grid", placeItems: "center" } },
                        React.createElement(TrendingUp, { size: 18, color: "var(--green)" })),
                    React.createElement("span", { style: { fontFamily: "var(--display)", fontWeight: 700, fontSize: 15 } }, "Potencjalny zysk")),
                React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 22, color: "var(--green)" } }, plnShort(profit)))),
        React.createElement(KonsolidacjaTransportu, { materials: materials, stock: stock }),
        React.createElement("div", { style: sectionTitle }, "Stany wg materia\u0142u"),
        rows.map((m) => (React.createElement(Card, { key: m.id, pad: 13, style: { marginBottom: 9 } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, minWidth: 0 } },
                    React.createElement("span", { style: { width: 9, height: 9, borderRadius: 3, background: C[m.g].color, flexShrink: 0 } }),
                    React.createElement("span", { style: { fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, m.n)),
                React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 14.5, whiteSpace: "nowrap" } }, kg(m.st))),
            React.createElement(Bar, { pct: (m.st * m.buy / maxV) * 100, color: C[m.g].color, h: 6 }),
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 7, fontSize: 13, color: "var(--muted)" } },
                React.createElement("span", { style: { fontFamily: "var(--mono)" } },
                    "koszt ",
                    plnShort(m.st * m.buy)),
                isOwner && React.createElement("span", { style: { fontFamily: "var(--mono)" } },
                    "sprzeda\u017C ",
                    plnShort(m.st * m.sell)))))),
        recentDisp.length > 0 && (React.createElement(React.Fragment, null,
            React.createElement("div", { style: sectionTitle }, "Ostatnie wydania"),
            React.createElement(Card, { pad: 6 }, recentDisp.map((d, i) => (React.createElement("div", { key: d.id, style: { display: "flex", alignItems: "center", gap: 11, padding: "11px 10px", borderBottom: i < recentDisp.length - 1 ? "1px solid var(--line)" : "none" } },
                React.createElement("div", { style: { width: 32, height: 32, borderRadius: 9, background: "rgba(63,125,138,.12)", display: "grid", placeItems: "center", flexShrink: 0 } },
                    React.createElement(Truck, { size: 16, color: "#3f7d8a" })),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    React.createElement("div", { style: { fontSize: 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, mm[d.matId] ? mm[d.matId].n : d.matId),
                    React.createElement("div", { style: { fontSize: 13, color: "var(--muted)" } },
                        d.contractor,
                        " \u00B7 ",
                        d.dateKey)),
                React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 15, color: "#3f7d8a", whiteSpace: "nowrap" } },
                    "\u2212",
                    kg(d.w)),
                React.createElement("button", { onClick: () => setDispatch(dispatch.filter((x) => x.id !== d.id)), style: { ...iconBtn, width: 44, height: 44, border: "none", background: "transparent", boxShadow: "none", color: "var(--faint)" }, title: "Usuń", "aria-label": "Usuń" },
                    React.createElement(X, { size: 15 })))))))),
        React.createElement(Sheet, { open: wyd, onClose: () => setWyd(false), title: "Wydanie do kontrahenta" },
            React.createElement("label", { style: label }, "Surowiec"),
            React.createElement("select", { value: wMat, onChange: (e) => setWMat(e.target.value), style: { ...inputStyle, colorScheme: "light" } }, materials.map((m) => React.createElement("option", { key: m.id, value: m.id },
                m.n,
                " (",
                C[m.g].code,
                ") \u2014 stan ",
                Math.round((stock[m.id] || 0) * 10) / 10,
                " kg"))),
            React.createElement("div", { style: { display: "flex", gap: 10 } },
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("label", { style: label }, "Masa (kg)"),
                    React.createElement("input", { style: { ...inputStyle, fontFamily: "var(--mono)", fontWeight: 700, fontSize: 18 }, type: "number", inputMode: "decimal", value: wW, onChange: (e) => setWW(e.target.value), placeholder: "0" })),
                React.createElement("div", { style: { flex: 1.4 } },
                    React.createElement("label", { style: label }, "Odbiorca"),
                    React.createElement("input", { style: inputStyle, list: "sk-buyers-list", value: wKontr, onChange: (e) => setWKontr(e.target.value), placeholder: "np. Huta Stali" }),
                    React.createElement("datalist", { id: "sk-buyers-list" }, (buyers || []).map((b) => React.createElement("option", { key: b.id, value: b.name }))))),
            (buyers || []).length > 0 && React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 } }, buyers.map((b) => React.createElement("button", { key: b.id, onClick: () => setWKontr(b.name), style: { padding: "7px 12px", borderRadius: 99, cursor: "pointer", fontSize: 13.5, fontWeight: 700, border: buyerByName(wKontr) === b ? "2px solid var(--copper)" : "1px solid var(--line2)", background: buyerByName(wKontr) === b ? "rgba(200,116,63,.12)" : "transparent", color: "var(--text)" } }, b.name))),
            isOwner && React.createElement("div", { style: { marginTop: 12 } },
                React.createElement("label", { style: label }, "Cena sprzeda\u017Cy (z\u0142/kg)", buyerByName(wKontr) && buyerByName(wKontr).prices && buyerByName(wKontr).prices[wMat] != null ? React.createElement("span", { style: { color: "var(--faint)", fontWeight: 400 } }, " \u00B7 z cennika odbiorcy, mo\u017Cesz zmieni\u0107") : React.createElement("span", { style: { color: "var(--faint)", fontWeight: 400 } }, " \u00B7 z Twojego cennika, mo\u017Cesz zmieni\u0107")),
                React.createElement("input", { style: { ...inputStyle, fontFamily: "var(--mono)", fontWeight: 700, fontSize: 18 }, type: "number", inputMode: "decimal", value: wPrice, onChange: (e) => setWPrice(e.target.value), placeholder: "0.00" }),
                parseFloat(wW) > 0 && parseFloat(wPrice) > 0 && React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 6 } }, "Przych\u00F3d z wydania: ", React.createElement("b", { style: { color: "var(--text)" } }, plnShort(parseFloat(wW) * parseFloat(wPrice))))),
            wMat && parseFloat(wW) > 0 && (stock[wMat] || 0) - parseFloat(wW) < 0 && React.createElement("div", { style: { fontSize: 13.5, color: "var(--amber)", marginTop: 10, fontWeight: 600 } }, "Uwaga: wydanie wi\u0119ksze ni\u017C stan \u2014 magazyn zejdzie poni\u017Cej zera."),
            React.createElement("button", { style: { ...btnCopper, marginTop: 16 }, onClick: addDispatch },
                React.createElement(Truck, { size: 18 }),
                " Zatwierd\u017A wydanie"))));
}
function CloudRelogin() {
    useEffect(() => { const t = setTimeout(() => { try { window.__cloudLogout(); } catch (e) { location.reload(); } }, 400); return () => clearTimeout(t); }, []);
    return React.createElement("div", { style: { minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 15 } }, "Od\u015Bwie\u017Cam logowanie\u2026");
}
/* ─────────── Punkty skupu ─────────── */
function PunktSwitch({ punkty, value, onChange }) {
    return React.createElement("div", { style: { padding: "12px 16px 0", display: "flex", gap: 7, overflowX: "auto", WebkitOverflowScrolling: "touch" } },
        [["", "Wszystkie punkty"], ...punkty.map((p) => [p.id, p.nazwa])].map(([id, n]) => React.createElement("button", { key: id || "all", onClick: () => onChange(id), style: { flex: "0 0 auto", padding: "8px 14px", borderRadius: 99, cursor: "pointer", fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", border: value === id ? "2px solid var(--copper)" : "1px solid var(--line2)", background: value === id ? "rgba(200,116,63,.14)" : "var(--surface)", color: "var(--text)" } }, id ? "\uD83D\uDCCD " + n : n)));
}
function PunktyPanel({ punkty, savePunkty, users, setUsers, punktSel, setPunktSel }) {
    const [nazwa, setNazwa] = useState("");
    const [adres, setAdres] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const api = typeof window !== "undefined" ? window.__cloudPunkty : null;
    const staff = (users || []).filter((u) => u.role !== "owner" && u.role !== "client");
    const run = async (fn) => { setErr(""); setBusy(true); try { await fn(); } catch (e) { setErr("Nie uda\u0142o si\u0119 zapisa\u0107: " + (e && e.message || e)); } setBusy(false); };
    const add = () => { const n = nazwa.trim(); if (!n || !api) return; run(async () => { const p = await api.add(n, adres.trim()); savePunkty([...punkty, p]); setNazwa(""); setAdres(""); }); };
    const rename = (id, n) => savePunkty(punkty.map((p) => p.id === id ? { ...p, nazwa: n } : p));
    const persistName = (id) => { const p = punkty.find((x) => x.id === id); if (p && api) run(() => api.update(id, { nazwa: p.nazwa.trim() || "Punkt" })); };
    const archive = (id) => { if (!api) return; run(async () => { await api.update(id, { aktywny: false }); savePunkty(punkty.filter((p) => p.id !== id)); if (punktSel === id) setPunktSel(""); }); };
    const assign = (u, pid) => { if (!api) return; run(async () => { await api.assign(u.id, pid); setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, punkt: pid || null } : x)); }); };
    return React.createElement("div", { style: { padding: "0 16px 40px" } },
        React.createElement("header", { style: { paddingTop: 24 } },
            React.createElement("h1", { style: { margin: 0, fontFamily: "var(--display)", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" } }, "Punkty skupu"),
            React.createElement("div", { style: { color: "var(--muted)", fontSize: 14.5, marginTop: 4, lineHeight: 1.5 } }, "Ka\u017Cdy punkt ma swoje przyj\u0119cia, wydania i magazyn. Ty widzisz wszystkie razem albo ka\u017Cdy osobno. Pracownik przypisany do punktu widzi tylko sw\u00F3j.")),
        err && React.createElement("div", { style: { marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(220,38,38,.1)", color: "var(--red)", fontSize: 14, fontWeight: 600 } }, err),
        React.createElement("div", { style: sectionTitle }, "Twoje punkty"),
        punkty.length === 0 && React.createElement("div", { style: { fontSize: 14, color: "var(--muted)" } }, "Brak punkt\u00F3w \u2014 dodaj pierwszy poni\u017Cej. Dop\u00F3ki ich nie ma, aplikacja dzia\u0142a jak jeden skup."),
        punkty.map((p) => React.createElement(Card, { key: p.id, pad: 12, style: { marginBottom: 9 } },
            React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } },
                React.createElement(MapPin, { size: 18, color: "var(--copper)" }),
                React.createElement("input", { style: { ...inputStyle, marginTop: 0, flex: 1, fontWeight: 700 }, value: p.nazwa, onChange: (e) => rename(p.id, e.target.value), onBlur: () => persistName(p.id) })),
            p.adres && React.createElement("div", { style: { fontSize: 13, color: "var(--muted)", marginTop: 6, paddingLeft: 26 } }, p.adres),
            React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 10 } },
                React.createElement("button", { onClick: () => setPunktSel(p.id), style: { ...btnGhost, flex: 1, marginTop: 0 } }, punktSel === p.id ? "\u2713 Wybrany" : "Poka\u017C ten punkt"),
                React.createElement("button", { disabled: busy, onClick: () => { if (window.confirm("Ukry\u0107 punkt \u201E" + p.nazwa + "\u201D? Dane zostaj\u0105 w bazie.")) archive(p.id); }, style: { ...btnGhost, width: "auto", marginTop: 0, padding: "0 14px", color: "var(--red)", borderColor: "rgba(220,38,38,.3)" } }, "Ukryj")))),
        React.createElement("div", { style: sectionTitle }, "Dodaj punkt"),
        React.createElement("input", { style: inputStyle, value: nazwa, onChange: (e) => setNazwa(e.target.value), placeholder: "Nazwa, np. Punkt Kartuzy" }),
        React.createElement("input", { style: { ...inputStyle, marginTop: 8 }, value: adres, onChange: (e) => setAdres(e.target.value), placeholder: "Adres (opcjonalnie)" }),
        React.createElement("button", { disabled: busy || !nazwa.trim(), onClick: add, style: { ...btnCopper, marginTop: 10, opacity: busy || !nazwa.trim() ? .6 : 1 } }, React.createElement(Plus, { size: 18 }), " Dodaj punkt"),
        punkty.length > 0 && React.createElement(React.Fragment, null,
            React.createElement("div", { style: sectionTitle }, "Kto gdzie pracuje"),
            staff.length === 0 && React.createElement("div", { style: { fontSize: 14, color: "var(--muted)" } }, "Brak pracownik\u00F3w."),
            staff.map((u) => React.createElement("div", { key: u.id, style: { display: "flex", alignItems: "center", gap: 10, padding: "10px 2px", borderBottom: "1px solid var(--line)" } },
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    React.createElement("div", { style: { fontSize: 14.5, fontWeight: 700 } }, u.name),
                    React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)" } }, ROLE_LABEL[u.role] || u.role)),
                React.createElement("select", { disabled: busy, value: u.punkt || "", onChange: (e) => assign(u, e.target.value), style: { ...inputStyle, width: 170, marginTop: 0 } },
                    React.createElement("option", { value: "" }, "Wszystkie punkty"),
                    punkty.map((p) => React.createElement("option", { key: p.id, value: p.id }, p.nazwa))))),
            React.createElement("div", { style: { fontSize: 13, color: "var(--faint)", marginTop: 10, lineHeight: 1.5 } }, "Zmiana obowi\u0105zuje po ponownym zalogowaniu pracownika.")));
}
/* ─────────── Odbiorcy: huty / pośrednicy z własnymi cenami ─────────── */
function OdbiorcyPanel({ buyers, setBuyers, materials, onClose }) {
    const [sel, setSel] = useState(null);
    const [name, setName] = useState("");
    const b = (buyers || []).find((x) => x.id === sel);
    const add = () => { const n = name.trim(); if (!n) return; const nb = { id: uid(), name: n, prices: {}, updated: Date.now() }; setBuyers((p) => [...(p || []), nb]); setName(""); setSel(nb.id); };
    const setPrice = (matId, v) => setBuyers((p) => p.map((x) => x.id === sel ? { ...x, prices: { ...(x.prices || {}), [matId]: v === "" ? undefined : +String(v).replace(",", ".") }, updated: Date.now() } : x));
    const rename = (v) => setBuyers((p) => p.map((x) => x.id === sel ? { ...x, name: v } : x));
    const remove = () => { setBuyers((p) => p.filter((x) => x.id !== sel)); setSel(null); };
    return React.createElement(Sheet, { open: true, onClose, title: b ? b.name || "Odbiorca" : "Odbiorcy" },
        !b && React.createElement(React.Fragment, null,
            React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 } }, "Huty i po\u015Brednicy, kt\u00F3rym sprzedajesz. Ka\u017Cdy ma w\u0142asne ceny \u2014 przy wydaniu cena podpowie si\u0119 sama, a zysk policzy si\u0119 z faktycznej ceny sprzeda\u017Cy. Widzisz to tylko Ty."),
            (buyers || []).map((x) => React.createElement("button", { key: x.id, onClick: () => setSel(x.id), style: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 12px", marginBottom: 8, borderRadius: 12, border: "1px solid var(--line2)", background: "var(--surface2)", color: "var(--text)", cursor: "pointer", fontSize: 15, fontWeight: 700 } }, x.name, React.createElement("span", { style: { fontSize: 13, color: "var(--muted)", fontWeight: 500 } }, Object.values(x.prices || {}).filter((v) => v != null).length, " cen ", React.createElement(ChevronRight, { size: 14 })))),
            React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 6 } },
                React.createElement("input", { style: { ...inputStyle, flex: 1 }, value: name, onChange: (e) => setName(e.target.value), placeholder: "Nowy odbiorca, np. Huta Gda\u0144sk" }),
                React.createElement("button", { onClick: add, style: { ...btnCopper, width: "auto", padding: "0 18px", marginTop: 0 } }, React.createElement(Plus, { size: 18 })))),
        b && React.createElement(React.Fragment, null,
            React.createElement("button", { onClick: () => setSel(null), style: { ...btnGhost, marginBottom: 12 } }, "\u2190 Wszyscy odbiorcy"),
            React.createElement("label", { style: label }, "Nazwa"),
            React.createElement("input", { style: inputStyle, value: b.name, onChange: (e) => rename(e.target.value) }),
            React.createElement("div", { style: { ...sectionTitle, margin: "18px 2px 8px" } }, "Ceny tego odbiorcy (z\u0142/kg)"),
            React.createElement("div", { style: { fontSize: 13, color: "var(--faint)", marginBottom: 8 } }, "Puste = podpowie Twoj\u0105 og\u00F3ln\u0105 cen\u0119 sprzeda\u017Cy z cennika."),
            (materials || []).map((m) => React.createElement("div", { key: m.id, style: { display: "flex", alignItems: "center", gap: 10, padding: "8px 2px", borderBottom: "1px solid var(--line)" } },
                React.createElement("span", { style: { flex: 1, fontSize: 14, fontWeight: 600 } }, m.n),
                React.createElement("input", { style: { ...inputStyle, width: 100, marginTop: 0, fontFamily: "var(--mono)", fontWeight: 700, textAlign: "right" }, type: "number", inputMode: "decimal", value: b.prices && b.prices[m.id] != null ? b.prices[m.id] : "", placeholder: (m.sell || 0).toFixed(2), onChange: (e) => setPrice(m.id, e.target.value) }))),
            React.createElement("button", { onClick: remove, style: { ...btnGhost, marginTop: 18, color: "var(--red)", borderColor: "rgba(220,38,38,.3)" } }, "Usu\u0144 odbiorc\u0119")));
}
/* ─────────── Intake (full screen) ─────────── */
function Intake({ materials, mm, company, onClose, commitIntake, tx }) {
    const [kind, setKind] = useState("FPO");
    const [osoba, setOsoba] = useState({ imie: "", nazwisko: "", adres: "", dowod: "", scanned: false });
    const [firma, setFirma] = useState({ nazwa: "", nip: "" });
    const [plate, setPlate] = useState("");
    const [pos, setPos] = useState([]);
    const [payment, setPayment] = useState("gotowka");
    const [photo, setPhoto] = useState(false);
    const [zrodlo, setZrodlo] = useState("");
    const [oswOk, setOswOk] = useState(false);
    const [produkt, setProdukt] = useState("");
    const [uwagi, setUwagi] = useState("");
    const [warnOpen, setWarnOpen] = useState(true);
    const [picker, setPicker] = useState(false);
    const [weighing, setWeighing] = useState(null);
    const [result, setResult] = useState(null);
    const [err, setErr] = useState("");
    const numI = (x) => { const n = parseFloat(x); return isNaN(n) ? 0 : n; };
    const total = pos.reduce((a, p) => a + numI(p.w) * numI(p.price), 0);
    const mass = pos.reduce((a, p) => a + numI(p.w), 0);
    // ── Stały klient: rozpoznanie po tablicy rejestracyjnej ──
    const [prevUsed, setPrevUsed] = useState("");
    const plateKey = (plate || "").replace(/\s/g, "").toUpperCase();
    const prevTx = plateKey.length >= 4 ? (tx || []).find((t) => (t.plate || "").replace(/\s/g, "").toUpperCase() === plateKey) : null;
    const prevName = prevTx ? (prevTx.osoba ? `${prevTx.osoba.imie || ""} ${prevTx.osoba.nazwisko || ""}`.trim() : (prevTx.firma ? prevTx.firma.nazwa : "")) : "";
    const prevVisits = prevTx ? (tx || []).filter((t) => (t.plate || "").replace(/\s/g, "").toUpperCase() === plateKey).length : 0;
    const fillPrev = () => {
        if (!prevTx) return;
        if (prevTx.osoba) { setKind("FPO"); setOsoba({ imie: prevTx.osoba.imie || "", nazwisko: prevTx.osoba.nazwisko || "", adres: prevTx.osoba.adres || "", dowod: prevTx.osoba.dowod || "", scanned: false }); }
        else if (prevTx.firma) { setKind("KPO"); setFirma({ nazwa: prevTx.firma.nazwa || "", nip: prevTx.firma.nip || "" }); }
        if (!pos.length) {
            const add = [];
            (prevTx.pos || []).forEach((q) => { const m = materials.find((x) => x.id === q.matId); if (m) add.push({ rid: uid(), matId: m.id, n: m.n, g: m.g, w: 0, price: m.buy }); });
            if (add.length) setPos(add);
        }
        setPrevUsed(plateKey);
    };
    // ── Wykrywanie błędnych / nietypowych danych (ostrzeżenia) ──
    const nipValid = (nip) => {
        const d = (nip || "").replace(/[^0-9]/g, "");
        if (d.length !== 10)
            return false;
        const w = [6, 5, 7, 2, 3, 4, 5, 6, 7];
        const s = w.reduce((a, x, i) => a + x * (+d[i]), 0) % 11;
        return s !== 10 && s === (+d[9]);
    };
    const dowodOk = (s) => /^[A-Za-z]{3}\s?\d{6}$/.test((s || "").trim());
    const ostrzezenia = (() => {
        const o = [];
        pos.forEach((p) => {
            const m = materials.find(x => x.id === p.matId);
            const cena = numI(p.price), waga = numI(p.w);
            if (m && m.buy > 0 && cena > 0) {
                const od = Math.abs(cena - m.buy) / m.buy;
                if (od > 0.4)
                    o.push(`${p.n}: cena ${cena.toFixed(2)} zł/kg mocno odbiega od cennika (${m.buy.toFixed(2)} zł/kg) — sprawdź literówkę.`);
            }
            if (waga > 30000)
                o.push(`${p.n}: masa ${kg(waga)} nietypowo duża dla jednej pozycji — upewnij się, że to nie błąd.`);
        });
        if (kind === "KPO" && firma.nip.trim() && !nipValid(firma.nip))
            o.push(`NIP ${firma.nip} ma błędną sumę kontrolną — sprawdź numer.`);
        if (kind === "FPO" && osoba.dowod.trim() && !dowodOk(osoba.dowod))
            o.push(`Numer dowodu „${osoba.dowod}" ma nietypowy format (np. ABC 123456).`);
        return o;
    })();
    const topMats = (() => {
        const since = Date.now() - 30 * 86400000, cnt = {};
        (tx || []).forEach((t) => { if (t.ts >= since) (t.pos || []).forEach((p) => { cnt[p.matId] = (cnt[p.matId] || 0) + 1; }); });
        const inPos = new Set(pos.map((p) => p.matId));
        return Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([id]) => materials.find((m) => m.id === id)).filter((m) => m && !inPos.has(m.id)).slice(0, 6);
    })();
    const addPos = (m) => { setPos((p) => [...p, { rid: uid(), matId: m.id, n: m.n, g: m.g, w: 0, price: m.buy }]); setPicker(false); };
    const upd = (rid, patch) => setPos((p) => p.map((x) => x.rid === rid ? { ...x, ...patch } : x));
    const del = (rid) => setPos((p) => p.filter((x) => x.rid !== rid));
    const submit = () => {
        if (!pos.length || mass <= 0) {
            setErr("Dodaj co najmniej jedną pozycję z masą.");
            return;
        }
        if (kind === "FPO" && (!osoba.imie.trim() || !osoba.nazwisko.trim() || !osoba.adres.trim())) {
            setErr("Uzupełnij dane przekazującego — bez adresu nie wolno przyjąć (wymóg FPO).");
            return;
        }
        if (kind === "FPO" && (!zrodlo.trim() || zrodlo.trim() === "Inne:")) {
            setErr("Wskaż źródło pochodzenia odpadów (wymóg ustawowy FPO).");
            return;
        }
        if (kind === "FPO" && !oswOk) {
            setErr("Przekazujący musi potwierdzić oświadczenie o pochodzeniu odpadów.");
            return;
        }
        if (kind === "KPO" && (!firma.nazwa.trim() || !firma.nip.trim())) {
            setErr("Uzupełnij nazwę firmy i NIP.");
            return;
        }
        const data = { kind, payment, plate: plate.trim().toUpperCase(), pos: pos.map(({ rid, ...r }) => ({ ...r, w: numI(r.w), price: numI(r.price) })), ...(photo ? { photo } : {}), ...(kind === "FPO" ? { osoba, zrodlo: zrodlo.trim(), osw: true, ...(produkt.trim() ? { produkt: produkt.trim() } : {}), ...(uwagi.trim() ? { uwagi: uwagi.trim() } : {}) } : { firma }) };
        const t = commitIntake(data);
        setResult(t);
    };
    if (result)
        return React.createElement(DocOverlay, { tx: result, company: company, onClose: onClose, onNew: () => { setResult(null); setOsoba({ imie: "", nazwisko: "", adres: "", dowod: "", scanned: false }); setFirma({ nazwa: "", nip: "" }); setPlate(""); setPos([]); setPhoto(false); setZrodlo(""); setProdukt(""); setUwagi(""); setOswOk(false); setErr(""); }, created: true });
    return (React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 70, background: "var(--bg)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "calc(12px + env(safe-area-inset-top)) 16px 12px", borderBottom: "1px solid var(--line)", background: "var(--surface)" } },
            React.createElement("button", { onClick: onClose, style: iconBtn },
                React.createElement(ChevronLeft, { size: 20 })),
            React.createElement("div", { style: { flex: 1 } },
                React.createElement("div", { style: { fontFamily: "var(--display)", fontSize: 18, fontWeight: 800 } }, "Nowe przyj\u0119cie"),
                React.createElement("div", { style: { fontSize: 13, color: "var(--muted)" } }, kind === "FPO" ? "Formularz Przyjęcia Odpadów Metali" : "Karta Przekazania Odpadu")),
            React.createElement("div", { style: { width: 38, height: 38, borderRadius: 10, background: "rgba(200,116,63,.12)", display: "grid", placeItems: "center" } },
                React.createElement(Scale, { size: 19, color: "var(--copper)" }))),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "16px 16px 180px" } },
            ostrzezenia.length > 0 && (React.createElement("div", { style: { position: "sticky", top: 0, zIndex: 12, marginBottom: 14, padding: "11px 13px", borderRadius: 12, background: "#39290f", border: "1px solid rgba(217,119,6,.55)", boxShadow: "0 12px 30px -10px rgba(0,0,0,.55)" } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, color: "var(--amber)", fontSize: 14, fontWeight: 800 } },
                    React.createElement(AlertTriangle, { size: 16 }),
                    " Sprawd\u017A dane (",
                    ostrzezenia.length,
                    ")",
                    React.createElement("span", { onClick: () => setWarnOpen(!warnOpen), style: { marginLeft: "auto", fontSize: 12.5, color: "rgba(255,255,255,.5)", fontWeight: 600, cursor: "pointer" } }, warnOpen ? "ukryj ▲" : "pokaż ▼")),
                warnOpen && ostrzezenia.map((w, i) => (React.createElement("div", { key: i, style: { fontSize: 13.5, color: "rgba(255,255,255,.85)", lineHeight: 1.5, paddingLeft: 24, marginTop: i ? 6 : 8 } },
                    "\u2022 ",
                    w))))),
            React.createElement("div", { style: { display: "flex", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 13, padding: 4 } }, [["FPO", "Osoba fizyczna", User], ["KPO", "Firma", Building2]].map(([k, l, Ic]) => (React.createElement("button", { key: k, onClick: () => setKind(k), style: { flex: 1, padding: "11px", borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 700, border: "none", background: kind === k ? (k === "FPO" ? "rgba(200,116,63,.13)" : "rgba(63,125,138,.13)") : "transparent", color: kind === k ? (k === "FPO" ? "var(--copper)" : "#3f7d8a") : "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 } },
                React.createElement(Ic, { size: 16 }),
                l)))),
            React.createElement(Card, { style: { marginTop: 12, display: "flex", alignItems: "center", gap: 11 }, pad: 12 },
                React.createElement("div", { style: { width: 36, height: 36, borderRadius: 9, background: "rgba(63,125,138,.12)", display: "grid", placeItems: "center", flexShrink: 0 } },
                    React.createElement(Truck, { size: 18, color: "#3f7d8a" })),
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("div", { style: { fontSize: 13, color: "var(--muted)", fontWeight: 600 } }, "Nr rejestracyjny pojazdu"),
                    React.createElement("input", { value: plate, onChange: (e) => setPlate(e.target.value.toUpperCase()), placeholder: "np. SK 12345", style: { width: "100%", border: "none", outline: "none", background: "transparent", fontFamily: "var(--code)", fontWeight: 700, fontSize: 18, letterSpacing: ".06em", color: "var(--text)", padding: 0, marginTop: 2 } })),
                React.createElement("span", { style: { fontSize: 12, color: "var(--faint)", textAlign: "right", maxWidth: 90 } }, "\u0142\u0105czy klienta z wa\u017Ceniem")),
            prevTx && prevUsed !== plateKey && (React.createElement("button", { onClick: fillPrev, style: { width: "100%", marginTop: 8, display: "flex", alignItems: "center", gap: 11, padding: "13px 14px", borderRadius: 14, cursor: "pointer", border: "1.5px solid var(--green)", background: "rgba(34,197,94,.10)", color: "var(--text)", textAlign: "left" } },
                React.createElement(BadgeCheck, { size: 22, color: "var(--green)" }),
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("div", { style: { fontWeight: 800, fontSize: 15 } }, "Sta\u0142y klient: ", prevName || plate),
                    React.createElement("div", { style: { fontSize: 14.5, color: "var(--muted)", marginTop: 2 } }, `Wizyt: ${prevVisits} · dotknij, aby uzupełnić dane i ostatnie towary`)),
                React.createElement(ChevronRight, { size: 20, color: "var(--green)" }))),
            kind === "FPO" ? (React.createElement(Card, { style: { marginTop: 14 } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 } },
                    React.createElement(ScanLine, { size: 16, color: "var(--copper)" }),
                    React.createElement("span", { style: { fontFamily: "var(--display)", fontWeight: 700, fontSize: 14.5 } }, "Dane przekazuj\u0105cego")),
                React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 8 } },
                    React.createElement("input", { style: inputStyle, placeholder: "Imi\u0119", value: osoba.imie, onChange: (e) => setOsoba({ ...osoba, imie: e.target.value }) }),
                    React.createElement("input", { style: inputStyle, placeholder: "Nazwisko", value: osoba.nazwisko, onChange: (e) => setOsoba({ ...osoba, nazwisko: e.target.value }) })),
                React.createElement("input", { style: { ...inputStyle, marginTop: 10 }, placeholder: "Adres zamieszkania (wymagany)", value: osoba.adres, onChange: (e) => setOsoba({ ...osoba, adres: e.target.value }) }),
                React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 10 } },
                    React.createElement("input", { style: { ...inputStyle, flex: 1 }, placeholder: "Nr dowodu", value: osoba.dowod, onChange: (e) => setOsoba({ ...osoba, dowod: e.target.value }) }),
                    React.createElement("input", { id: "dowod-foto", type: "file", accept: "image/*", style: { display: "none" }, onChange: async (e) => { const f = e.target.files && e.target.files[0]; if (!f)
                            return; try {
                            const url = await resizeImage(f);
                            setOsoba({ ...osoba, scanned: true, dowodFoto: url });
                        }
                        catch (er) { } e.target.value = ""; } }),
                    React.createElement("button", { onClick: () => { if (osoba.scanned)
                            setOsoba({ ...osoba, scanned: false, dowodFoto: null });
                        else
                            document.getElementById("dowod-foto").click(); }, style: { ...btnGhost, width: "auto", padding: "0 16px", display: "flex", alignItems: "center", gap: 7, color: osoba.scanned ? "var(--green)" : "var(--text)", borderColor: osoba.scanned ? "var(--green)" : "var(--line2)" } }, osoba.scanned ? React.createElement(React.Fragment, null,
                        React.createElement(Check, { size: 16 }),
                        " Zdj\u0119cie dowodu") : React.createElement(React.Fragment, null,
                        React.createElement(Camera, { size: 16 }),
                        " Zr\u00F3b zdj\u0119cie dowodu"))))) : (React.createElement(Card, { style: { marginTop: 14 } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 } },
                    React.createElement(Building2, { size: 16, color: "#3f7d8a" }),
                    React.createElement("span", { style: { fontFamily: "var(--display)", fontWeight: 700, fontSize: 14.5 } }, "Dane firmy (KPO z BDO)")),
                React.createElement("input", { style: { ...inputStyle, marginTop: 8 }, placeholder: "Nazwa firmy", value: firma.nazwa, onChange: (e) => setFirma({ ...firma, nazwa: e.target.value }) }),
                React.createElement("input", { style: { ...inputStyle, marginTop: 10 }, placeholder: "NIP", value: firma.nip, onChange: (e) => setFirma({ ...firma, nip: e.target.value }) }))),
            React.createElement("div", { style: { ...sectionTitle, display: "flex", justifyContent: "space-between", alignItems: "center" } },
                React.createElement("span", null, "Towar"),
                React.createElement("span", { style: { textTransform: "none", letterSpacing: 0, color: "var(--muted)", fontWeight: 600 } },
                    pos.length,
                    " poz. \u00B7 ",
                    kg(mass))),
            pos.map((p) => {
                const m = mm[p.matId];
                return (React.createElement(Card, { key: p.rid, pad: 13, style: { marginBottom: 10 } },
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 } },
                        React.createElement("div", { style: { minWidth: 0, paddingRight: 8 } },
                            React.createElement("div", { style: { fontSize: 14.5, fontWeight: 700 } }, p.n),
                            React.createElement("div", { style: { marginTop: 3 } }, codeChip(p.g))),
                        React.createElement("button", { onClick: () => del(p.rid), style: { ...iconBtn, width: 44, height: 44, border: "none", background: "transparent", boxShadow: "none", color: "var(--faint)" }, title: "Usuń pozycję", "aria-label": "Usuń pozycję" },
                            React.createElement(Trash2, { size: 16 }))),
                    React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "flex-end" } },
                        React.createElement("div", { style: { flex: 1.3 } },
                            React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)", marginBottom: 4 } }, "Masa (kg)"),
                            React.createElement("div", { style: { display: "flex", gap: 6 } },
                                React.createElement("input", { style: { ...inputStyle, fontFamily: "var(--mono)", fontWeight: 700, fontSize: 17, padding: "11px 12px" }, type: "number", inputMode: "decimal", value: p.w || "", placeholder: "0", autoFocus: true, onChange: (e) => upd(p.rid, { w: e.target.value }) }))),
                        React.createElement("div", { style: { flex: 1 } },
                            React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)", marginBottom: 4 } }, "Cena z\u0142/kg"),
                            React.createElement("input", { style: { ...inputStyle, fontFamily: "var(--mono)", fontWeight: 700, fontSize: 17, padding: "11px 12px" }, type: "number", inputMode: "decimal", value: p.price, placeholder: "0", onChange: (e) => upd(p.rid, { price: e.target.value }) }))),
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 11, paddingTop: 10, borderTop: "1px solid var(--line)" } },
                        React.createElement("span", { style: { fontSize: 13.5, color: "var(--muted)" } }, "Warto\u015B\u0107 pozycji"),
                        React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 16, color: "var(--copper)" } }, pln(p.w * p.price)))));
            }),
            topMats.length > 0 && (React.createElement("div", { style: { marginBottom: 10 } },
                React.createElement("div", { style: { fontSize: 13, color: "var(--muted)", fontWeight: 700, marginBottom: 7 } }, "Najcz\u0119\u015Bciej skupowane \u2014 dotknij, aby doda\u0107"),
                React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 } }, topMats.map((m) => React.createElement("button", { key: m.id, onClick: () => addPos(m), style: { minWidth: 0, minHeight: 52, padding: "8px 12px", borderRadius: 14, border: "1px solid var(--line2)", background: "var(--surface)", cursor: "pointer", textAlign: "left", color: "var(--text)" } },
                    React.createElement("div", { style: { fontSize: 14.5, fontWeight: 700, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, m.n),
                    React.createElement("div", { style: { fontSize: 13, color: "var(--copper)", fontFamily: "var(--mono)", fontWeight: 700, marginTop: 2 } }, (+m.buy).toFixed(2), " z\u0142/kg")))))),
            React.createElement("button", { onClick: () => setPicker(true), style: { ...btnGhost, borderStyle: "dashed", color: "var(--copper)", borderColor: "rgba(200,116,63,.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 } },
                React.createElement(Plus, { size: 17 }),
                " Dodaj pozycj\u0119 z cennika"),
            kind === "FPO" && (React.createElement(React.Fragment, null,
                React.createElement("div", { style: sectionTitle }, "Pochodzenie odpad\u00F3w"),
                React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 } }, ["Własne gospodarstwo domowe", "Własna działalność / demontaż", "Inne"].map((z) => {
                    const act = zrodlo === z || (z === "Inne" && zrodlo.startsWith("Inne"));
                    return (React.createElement("button", { key: z, onClick: () => setZrodlo(z === "Inne" ? "Inne: " : z), style: { padding: "9px 13px", borderRadius: 99, cursor: "pointer", fontSize: 14, fontWeight: 700, border: act ? "1.5px solid var(--copper)" : "1px solid var(--line2)", background: act ? "rgba(200,116,63,.1)" : "var(--surface)", color: act ? "var(--copper)" : "var(--muted)" } }, z));
                })),
                zrodlo.startsWith("Inne") && React.createElement("input", { style: { ...inputStyle, marginBottom: 10 }, placeholder: "Wpisz \u017Ar\u00F3d\u0142o pochodzenia (np. rozbi\u00F3rka altany na w\u0142asnej dzia\u0142ce)", value: zrodlo.replace(/^Inne: ?/, ""), onChange: (e) => setZrodlo("Inne: " + e.target.value) }),
                React.createElement("div", { style: { fontSize: 13, color: "var(--muted)", fontWeight: 700, margin: "2px 0 7px" } }, "Z czego powsta\u0142y odpady (rodzaj produktu)"),
                React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 8 } }, ["Rury i rynny", "Felgi", "Kable z remontu", "Sprzęt AGD", "Części maszyn", "Konstrukcja stalowa", "Akumulator samochodowy"].map((z) => React.createElement("button", { key: z, onClick: () => setProdukt(z), style: { padding: "8px 12px", borderRadius: 99, cursor: "pointer", fontSize: 13.5, fontWeight: 700, border: produkt === z ? "1.5px solid var(--copper)" : "1px solid var(--line2)", background: produkt === z ? "var(--copperSoft)" : "var(--surface)", color: produkt === z ? "var(--copper)" : "var(--text)" } }, z))),
                React.createElement("input", { style: { ...inputStyle, marginBottom: 10 }, placeholder: "Albo wpisz (np. stare grzejniki \u017Celiwne)", value: produkt, onChange: (e) => setProdukt(e.target.value) }),
                React.createElement("input", { style: { ...inputStyle, marginBottom: 10 }, placeholder: "Uwagi (opcjonalnie)", value: uwagi, onChange: (e) => setUwagi(e.target.value) }),
                React.createElement("label", { style: { display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 13px", borderRadius: 12, border: oswOk ? "1.5px solid var(--green)" : "1px solid var(--line2)", background: oswOk ? "rgba(21,163,74,.08)" : "var(--surface)", cursor: "pointer", marginBottom: 14 } },
                    React.createElement("input", { type: "checkbox", checked: oswOk, onChange: (e) => setOswOk(e.target.checked), style: { width: 18, height: 18, marginTop: 1, accentColor: "#15a34a", flexShrink: 0 } }),
                    React.createElement("span", { style: { fontSize: 13, lineHeight: 1.55 } },
                        React.createElement("b", null, "O\u015Bwiadczenie przekazuj\u0105cego:"),
                        " odpady stanowi\u0105 moj\u0105 w\u0142asno\u015B\u0107, pochodz\u0105 z legalnego \u017Ar\u00F3d\u0142a wskazanego powy\u017Cej, s\u0105 wolne od praw i roszcze\u0144 os\u00F3b trzecich i nie pochodz\u0105 z czynu zabronionego. \u015Awiadomy(-a) odpowiedzialno\u015Bci karnej (art. 291\u2013292 k.k.).")))),
            React.createElement("div", { style: sectionTitle }, "Forma p\u0142atno\u015Bci"),
            React.createElement("div", { style: { display: "flex", gap: 8 } }, Object.entries(PAY).map(([k, v]) => {
                const Ic = v.icon;
                return (React.createElement("button", { key: k, onClick: () => setPayment(k), style: { flex: 1, padding: "12px 6px", borderRadius: 12, cursor: "pointer", border: payment === k ? "1.5px solid var(--copper)" : "1px solid var(--line2)", background: payment === k ? "rgba(200,116,63,.1)" : "var(--surface)", color: payment === k ? "var(--copper)" : "var(--muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, fontSize: 14, fontWeight: 700 } },
                    React.createElement(Ic, { size: 18 }),
                    v.label));
            })),
            React.createElement("input", { id: "tw-foto", type: "file", accept: "image/*", style: { display: "none" }, onChange: async (e) => { const f = e.target.files && e.target.files[0]; if (!f)
                    return; try {
                    const url = await resizeImage(f);
                    setPhoto(url);
                }
                catch (er) { } e.target.value = ""; } }),
            React.createElement("button", { onClick: () => { if (photo)
                    setPhoto(false);
                else
                    document.getElementById("tw-foto").click(); }, style: { ...btnGhost, marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: photo ? "var(--green)" : "var(--text)", borderColor: photo ? "var(--green)" : "var(--line2)" } }, photo ? React.createElement(React.Fragment, null,
                React.createElement(Check, { size: 17 }),
                " Zdj\u0119cie dodane \u2014 kliknij, by usun\u0105\u0107") : React.createElement(React.Fragment, null,
                React.createElement(Camera, { size: 17 }),
                " Dodaj zdj\u0119cie towaru")),
            err && React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", marginTop: 14, padding: "11px 13px", borderRadius: 12, background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.3)", color: "var(--red)", fontSize: 14, fontWeight: 600 } },
                React.createElement(AlertTriangle, { size: 16, style: { flexShrink: 0 } }),
                err)),
        React.createElement("div", { style: { position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 16px calc(14px + env(safe-area-inset-bottom))", background: "var(--surface)", borderTop: "1px solid var(--line)", boxShadow: "0 -8px 24px -16px rgba(0,0,0,.3)" } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 11 } },
                React.createElement("span", { style: { fontSize: 14.5, color: "var(--muted)", fontWeight: 600 } }, "Do wyp\u0142aty"),
                React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 26, letterSpacing: "-.02em" } }, pln(total))),
            React.createElement("button", { onClick: submit, style: btnCopper },
                React.createElement(FileText, { size: 19 }),
                " ",
                kind === "FPO" ? "Wystaw FPO i wypłać" : "Zapisz i wystaw KPO")),
        React.createElement(MaterialPicker, { open: picker, onClose: () => setPicker(false), materials: materials, onPick: addPos })));
}
function MaterialPicker({ open, onClose, materials, onPick }) {
    const [q, setQ] = useState("");
    const groups = Object.keys(C);
    const matches = (m) => !q.trim() || fnorm(m.n).includes(fnorm(q)) || C[m.g].code.includes(q.trim());
    return (React.createElement(Sheet, { open: open, onClose: onClose, title: "Wybierz materia\u0142" },
        React.createElement("div", { style: { position: "relative", marginBottom: 4 } },
            React.createElement(Search, { size: 17, color: "var(--faint)", style: { position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" } }),
            React.createElement("input", { style: { ...inputStyle, paddingLeft: 40 }, placeholder: "Szukaj (np. mied\u017A, 17 04\u2026)", value: q, autoFocus: true, onChange: (e) => setQ(e.target.value) })),
        React.createElement("div", { style: { maxHeight: "58vh", overflowY: "auto", margin: "8px -2px 0", padding: "0 2px" } }, groups.map((g) => {
            const items = materials.filter((m) => m.g === g && matches(m));
            if (!items.length)
                return null;
            return (React.createElement("div", { key: g },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, margin: "12px 2px 7px" } },
                    codeChip(g),
                    React.createElement("span", { style: { fontSize: 13.5, fontWeight: 700, color: "var(--muted)" } }, C[g].label)),
                items.map((m) => (React.createElement("button", { key: m.id, onClick: () => onPick(m), style: { width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 12px", marginBottom: 7, cursor: "pointer", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", textAlign: "left" } },
                    React.createElement("span", { style: { width: 9, height: 9, borderRadius: 3, background: C[m.g].color, flexShrink: 0 } }),
                    React.createElement("span", { style: { flex: 1, fontSize: 14, fontWeight: 600 } }, m.n),
                    React.createElement("span", { style: { fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, color: "var(--copper)" } },
                        m.buy.toFixed(2),
                        " z\u0142"),
                    React.createElement(Plus, { size: 16, color: "var(--faint)" }))))));
        }))));
}
/* ─────────── Wydruk FPO wg wzoru (Dz.U. 2013 poz. 1607) ─────────── */
const mgFmt = (kgv) => { const v = (+kgv || 0) / 1000; return v.toFixed(kgv < 1 ? 4 : 3).replace(".", ","); };
const zlFmt = (v) => (Math.round((+v || 0) * 100) / 100).toFixed(2).replace(".", ",");
function drukuj(tryb) {
    document.body.setAttribute("data-druk", tryb);
    const po = () => { document.body.removeAttribute("data-druk"); window.removeEventListener("afterprint", po); };
    window.addEventListener("afterprint", po);
    try { window.print(); } catch (e) { }
    setTimeout(po, 60000);
}
function FpoEgzemplarz({ tx, company, dla, waska }) {
    const fs = waska ? 10.5 : 11.5;
    const cell = { border: "1px solid #000", padding: waska ? "3px 4px" : "5px 6px", fontSize: fs, verticalAlign: "top", textAlign: "left" };
    const lab = { fontSize: waska ? 9 : 9.5, color: "#333", display: "block", marginBottom: 1 };
    const sumKg = tx.pos.reduce((a, p) => a + (+p.w || 0), 0);
    const sumZl = tx.pos.reduce((a, p) => a + (+p.w || 0) * (+p.price || 0), 0);
    const prod = (p) => p.produkt || tx.produkt || "—";
    const sekcja = (t) => React.createElement("div", { style: { fontWeight: 800, fontSize: fs, margin: waska ? "7px 0 3px" : "10px 0 4px" } }, t);
    return React.createElement("div", { className: "fpo-egz", style: { color: "#000", background: "#fff", fontFamily: "Arial, Helvetica, sans-serif", width: waska ? "76mm" : "auto" } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" } },
            React.createElement("div", { style: { fontWeight: 900, fontSize: waska ? 12 : 15 } }, "FORMULARZ PRZYJĘCIA ODPADÓW METALI"),
            React.createElement("div", { style: { fontSize: fs, textAlign: "right", whiteSpace: "nowrap" } }, "Nr formularza: ", React.createElement("b", null, tx.no))),
        React.createElement("div", { style: { fontSize: waska ? 9 : 10, marginTop: 2 } }, "Egzemplarz dla: ", React.createElement("b", null, dla)),
        sekcja("1. Osoba przekazująca odpady"),
        React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, React.createElement("tbody", null,
            React.createElement("tr", null, React.createElement("td", { style: cell }, React.createElement("span", { style: lab }, "Imię i nazwisko"), ((tx.osoba && tx.osoba.imie) || "") + " " + ((tx.osoba && tx.osoba.nazwisko) || ""))),
            React.createElement("tr", null, React.createElement("td", { style: cell }, React.createElement("span", { style: lab }, "Adres"), (tx.osoba && tx.osoba.adres) || "")),
            React.createElement("tr", null, React.createElement("td", { style: cell }, React.createElement("span", { style: lab }, "Numer dowodu osobistego lub innego dokumentu stwierdzającego tożsamość"), (tx.osoba && tx.osoba.dowod) || "")))),
        sekcja("2. Przekazanie odpadów"),
        React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, React.createElement("tbody", null,
            React.createElement("tr", null,
                React.createElement("td", { style: cell }, React.createElement("span", { style: lab }, "Data przyjęcia odpadów"), fmtDate(tx.ts)),
                React.createElement("td", { style: cell }, React.createElement("span", { style: lab }, "Źródło pochodzenia odpadów"), tx.zrodlo || "")))),
        waska
            ? React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", marginTop: 4 } }, React.createElement("tbody", null,
                tx.pos.map((p, i) => React.createElement("tr", { key: i }, React.createElement("td", { style: cell },
                    React.createElement("div", null, React.createElement("b", null, C[p.g].code), " · ", C[p.g].label),
                    React.createElement("div", null, "Produkt: ", prod(p)),
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, React.createElement("span", null, "Masa: ", mgFmt(p.w), " Mg"), React.createElement("span", null, "Wartość: ", zlFmt(p.w * p.price), " zł"))))),
                React.createElement("tr", null, React.createElement("td", { style: { ...cell, fontWeight: 800 } }, React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, React.createElement("span", null, "Suma: ", mgFmt(sumKg), " Mg"), React.createElement("span", null, zlFmt(sumZl), " zł"))))))
            : React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", marginTop: 6 } },
                React.createElement("thead", null, React.createElement("tr", null, ["Kod odpadów", "Rodzaj odpadów", "Rodzaj produktu, z którego powstały odpady", "Masa odpadów [Mg]", "Wartość odpadów [zł]"].map((h) => React.createElement("th", { key: h, style: { ...cell, fontSize: 9.5, fontWeight: 700, background: "#f2f2f2" } }, h)))),
                React.createElement("tbody", null,
                    tx.pos.map((p, i) => React.createElement("tr", { key: i },
                        React.createElement("td", { style: { ...cell, whiteSpace: "nowrap" } }, C[p.g].code),
                        React.createElement("td", { style: cell }, C[p.g].label + (p.n && p.n !== C[p.g].label ? " (" + p.n + ")" : "")),
                        React.createElement("td", { style: cell }, prod(p)),
                        React.createElement("td", { style: { ...cell, textAlign: "right", whiteSpace: "nowrap" } }, mgFmt(p.w)),
                        React.createElement("td", { style: { ...cell, textAlign: "right", whiteSpace: "nowrap" } }, zlFmt(p.w * p.price)))),
                    React.createElement("tr", null,
                        React.createElement("td", { style: { ...cell, fontWeight: 800, textAlign: "right" }, colSpan: 3 }, "Suma"),
                        React.createElement("td", { style: { ...cell, fontWeight: 800, textAlign: "right" } }, mgFmt(sumKg)),
                        React.createElement("td", { style: { ...cell, fontWeight: 800, textAlign: "right" } }, zlFmt(sumZl))))),
        sekcja("3. Oświadczenie przekazującego odpady"),
        React.createElement("div", { style: { ...cell, lineHeight: 1.45 } }, "Oświadczam, że przekazywane odpady stanowią moją własność, nie są obciążone prawami osób trzecich oraz nie pochodzą z kradzieży."),
        sekcja("4. Uwagi"),
        React.createElement("div", { style: { ...cell, minHeight: waska ? 14 : 26 } }, [tx.uwagi, tx.plate ? "Pojazd: " + tx.plate : "", "Płatność: " + ((PAY[tx.payment] && PAY[tx.payment].label) || "")].filter(Boolean).join(" · ")),
        sekcja("5. Posiadacz odpadów przyjmujący odpady"),
        React.createElement("div", { style: cell }, React.createElement("span", { style: lab }, "Imię i nazwisko lub nazwa"), company.name, company.addr ? ", " + company.addr : "", company.nip ? " · NIP " + company.nip : "", company.bdo ? " · BDO " + company.bdo : ""),
        React.createElement("div", { style: { display: "flex", gap: 14, marginTop: waska ? 22 : 38 } },
            React.createElement("div", { style: { flex: 1, borderTop: "1px solid #000", paddingTop: 3, fontSize: waska ? 9 : 10, textAlign: "center" } }, "Data i podpis przyjmującego odpady"),
            React.createElement("div", { style: { flex: 1, borderTop: "1px solid #000", paddingTop: 3, fontSize: waska ? 9 : 10, textAlign: "center" } }, "Podpis osoby przekazującej odpady")),
        React.createElement("div", { style: { fontSize: waska ? 8 : 8.5, color: "#333", marginTop: waska ? 8 : 14, lineHeight: 1.4 } }, "Wzór wg rozporządzenia Ministra Środowiska z 9.12.2013 r. (Dz.U. 2013 poz. 1607), art. 102 ustawy o odpadach. Masa w Mg z dokładnością do trzech miejsc po przecinku (poniżej 1 kg — czterech). Oświadczenie nie zwalnia przyjmującego z odpowiedzialności wynikającej z Kodeksu karnego i Kodeksu wykroczeń."));
}
function FpoWydruk({ tx, company }) {
    if (tx.kind !== "FPO" || typeof document === "undefined") return null;
    return createPortal(React.createElement("div", { className: "fpo-wydruk" },
        React.createElement("div", { className: "fpo-a4" },
            React.createElement(FpoEgzemplarz, { tx, company, dla: "przekazującego" }),
            React.createElement("div", { style: { breakBefore: "page", pageBreakBefore: "always" } }),
            React.createElement(FpoEgzemplarz, { tx, company, dla: "przyjmującego" })),
        React.createElement("div", { className: "fpo-80" },
            React.createElement(FpoEgzemplarz, { tx, company, dla: "przekazującego", waska: true }),
            React.createElement("div", { style: { borderTop: "1px dashed #000", margin: "10px 0", textAlign: "center", fontSize: 9 } }, "✂ odetnij"),
            React.createElement(FpoEgzemplarz, { tx, company, dla: "przyjmującego", waska: true }))), document.body);
}
/* ─────────── Document (FPO/KPO) ─────────── */
function DocOverlay({ tx, company, onClose, onNew, created, onDelete }) {
    const total = txTotal(tx);
    const mass = txMass(tx);
    const [confirmDel, setConfirmDel] = useState(false);
    return (React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 90, background: "var(--bg)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" } },
        React.createElement("div", { className: "no-print", style: { display: "flex", alignItems: "center", gap: 12, padding: "calc(12px + env(safe-area-inset-top)) 16px 12px", borderBottom: "1px solid var(--line)", background: "var(--surface)" } },
            React.createElement("button", { onClick: onClose, style: iconBtn },
                React.createElement(X, { size: 19 })),
            React.createElement("div", { style: { flex: 1, fontFamily: "var(--display)", fontSize: 17, fontWeight: 800 } }, tx.kind === "FPO" ? "Formularz FPO" : "Karta KPO"),
            tx.kind === "FPO" ? React.createElement(React.Fragment, null,
                React.createElement("button", { onClick: () => drukuj("a4"), title: "A4 — dwa egzemplarze (wzór urzędowy) / zapis do PDF", style: { ...iconBtn, width: "auto", padding: "0 11px", gap: 6, fontSize: 14, fontWeight: 700, color: "var(--copper)" } },
                    React.createElement(Printer, { size: 16 }), " A4 / PDF"),
                React.createElement("button", { onClick: () => drukuj("80"), title: "Drukarka paragonowa 80 mm — dwa egzemplarze", style: { ...iconBtn, width: "auto", padding: "0 11px", gap: 6, fontSize: 14, fontWeight: 700 } },
                    React.createElement(Printer, { size: 16 }), " 80 mm")) : React.createElement("button", { onClick: () => { try {
                    window.print();
                }
                catch (e) { } }, style: { ...iconBtn, width: "auto", padding: "0 13px", gap: 7, fontSize: 14.5, fontWeight: 700, color: "var(--copper)" } },
                React.createElement(Printer, { size: 16 }),
                " Drukuj / PDF"),
            onDelete && React.createElement("button", { onClick: () => { if (confirmDel) {
                    onDelete(tx.id);
                }
                else {
                    setConfirmDel(true);
                    setTimeout(() => setConfirmDel(false), 3000);
                } }, style: { ...iconBtn, width: "auto", padding: "0 13px", gap: 7, fontSize: 14.5, fontWeight: 700, color: confirmDel ? "#fff" : "var(--red)", background: confirmDel ? "var(--red)" : "transparent" } },
                React.createElement(Trash2, { size: 16 }),
                " ",
                confirmDel ? "Na pewno?" : "Usuń")),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: 16 } },
            created && (React.createElement("div", { className: "no-print", style: { display: "flex", alignItems: "center", gap: 11, padding: "13px 14px", borderRadius: 14, background: "rgba(21,163,74,.1)", border: "1px solid rgba(21,163,74,.3)", marginBottom: 14 } },
                React.createElement("div", { style: { width: 38, height: 38, borderRadius: 99, background: "var(--green)", display: "grid", placeItems: "center", flexShrink: 0 } },
                    React.createElement(Check, { size: 20, color: "#fff", strokeWidth: 3 })),
                React.createElement("div", null,
                    React.createElement("div", { style: { fontFamily: "var(--display)", fontWeight: 800, fontSize: 15 } }, "Przyj\u0119cie zapisane"),
                    React.createElement("div", { style: { fontSize: 14, color: "var(--muted)" } }, "Dodano do ewidencji \u00B7 wpis do BDO")))),
            React.createElement("div", { id: "fpo-doc", className: tx.kind === "FPO" ? "fpo-podglad" : "print-target", style: { "--text": "#111827", "--muted": "#4b5563", "--faint": "#6b7280", "--line": "#e5e7eb", "--line2": "#d1d5db", "--surface2": "#f3f4f6", color: "#111827", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 18, boxShadow: "0 10px 30px -18px rgba(0,0,0,.4)" } },
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid var(--text)", paddingBottom: 12 } },
                    React.createElement("div", null,
                        React.createElement("div", { style: { fontFamily: "var(--display)", fontWeight: 800, fontSize: 15, lineHeight: 1.15 } }, tx.kind === "FPO" ? "FORMULARZ PRZYJĘCIA ODPADÓW METALI" : "KARTA PRZEKAZANIA ODPADU"),
                        React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 13.5, color: "var(--muted)", marginTop: 5 } }, tx.no)),
                    React.createElement("div", { style: { width: 38, height: 38, borderRadius: 9, background: "linear-gradient(135deg,#c8743f,#a85829)", display: "grid", placeItems: "center", flexShrink: 0 } },
                        React.createElement(Recycle, { size: 20, color: "#fff" }))),
                React.createElement("div", { style: { display: "flex", gap: 16, marginTop: 12 } },
                    React.createElement("div", { style: { flex: 1 } },
                        React.createElement("div", { style: docLabel }, "Przyjmuj\u0105cy"),
                        React.createElement("div", { style: { fontSize: 14, fontWeight: 700 } }, company.name),
                        React.createElement("div", { style: { fontSize: 13, color: "var(--muted)", lineHeight: 1.5 } },
                            company.addr,
                            React.createElement("br", null),
                            "NIP ",
                            company.nip,
                            " \u00B7 BDO ",
                            company.bdo)),
                    React.createElement("div", { style: { flex: 1 } },
                        React.createElement("div", { style: docLabel }, tx.kind === "FPO" ? "Przekazujący (os. fizyczna)" : "Przekazujący (firma)"),
                        tx.kind === "FPO" ? (React.createElement(React.Fragment, null,
                            React.createElement("div", { style: { fontSize: 14, fontWeight: 700 } },
                                tx.osoba.imie,
                                " ",
                                tx.osoba.nazwisko),
                            React.createElement("div", { style: { fontSize: 13, color: "var(--muted)", lineHeight: 1.5 } },
                                tx.osoba.adres,
                                React.createElement("br", null),
                                "Dow\u00F3d: ",
                                tx.osoba.dowod || "—"))) : (React.createElement(React.Fragment, null,
                            React.createElement("div", { style: { fontSize: 14, fontWeight: 700 } }, tx.firma.nazwa),
                            React.createElement("div", { style: { fontSize: 13, color: "var(--muted)" } },
                                "NIP ",
                                tx.firma.nip))))),
                React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)", marginTop: 8 } },
                    "Data: ",
                    fmtDate(tx.ts),
                    ", godz. ",
                    fmtTs(tx.ts),
                    tx.plate ? ` · Pojazd: ${tx.plate}` : ""),
                React.createElement("div", { style: { marginTop: 14, border: "1px solid var(--line2)", borderRadius: 8, overflow: "hidden" } },
                    React.createElement("div", { style: { display: "flex", background: "var(--surface2)", padding: "8px 10px", fontSize: 11.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".03em" } },
                        React.createElement("span", { style: { width: 58 } }, "Kod"),
                        React.createElement("span", { style: { flex: 1 } }, "Rodzaj"),
                        React.createElement("span", { style: { width: 52, textAlign: "right" } }, "Masa"),
                        React.createElement("span", { style: { width: 50, textAlign: "right" } }, "Cena"),
                        React.createElement("span", { style: { width: 62, textAlign: "right" } }, "Warto\u015B\u0107")),
                    tx.pos.map((p, i) => (React.createElement("div", { key: i, style: { display: "flex", padding: "9px 10px", fontSize: 13, borderTop: "1px solid var(--line)", alignItems: "center" } },
                        React.createElement("span", { style: { width: 58, fontFamily: "var(--mono)", fontSize: 11.5, color: C[p.g].color, fontWeight: 700 } }, C[p.g].code),
                        React.createElement("span", { style: { flex: 1, fontWeight: 600 } }, p.n),
                        React.createElement("span", { style: { width: 52, textAlign: "right", fontFamily: "var(--mono)" } }, p.w),
                        React.createElement("span", { style: { width: 50, textAlign: "right", fontFamily: "var(--mono)", color: "var(--muted)" } }, p.price.toFixed(2)),
                        React.createElement("span", { style: { width: 62, textAlign: "right", fontFamily: "var(--mono)", fontWeight: 700 } }, Math.round(p.w * p.price)))))),
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 10, borderTop: "2px solid var(--text)" } },
                    React.createElement("div", null,
                        React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)" } }, "Razem masa \u00B7 p\u0142atno\u015B\u0107"),
                        React.createElement("div", { style: { fontSize: 14, fontWeight: 700 } },
                            kg(mass),
                            " \u00B7 ",
                            PAY[tx.payment].label)),
                    React.createElement("div", { style: { textAlign: "right" } },
                        React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)" } }, "Wyp\u0142acono"),
                        React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 20 } }, pln(total)))),
                tx.kind === "FPO" && (React.createElement("div", { style: { marginTop: 14, padding: "10px 12px", border: "1px solid var(--line2)", borderRadius: 8 } },
                    React.createElement("div", { style: docLabel }, "\u0179r\u00F3d\u0142o pochodzenia odpad\u00F3w"),
                    React.createElement("div", { style: { fontSize: 13, fontWeight: 700 } }, tx.zrodlo || "— (nie podano)"),
                    React.createElement("div", { style: { ...docLabel, marginTop: 8 } }, "O\u015Bwiadczenie przekazuj\u0105cego"),
                    React.createElement("div", { style: { fontSize: 11, lineHeight: 1.55 } }, "O\u015Bwiadczam, \u017Ce przekazane odpady metali stanowi\u0105 moj\u0105 w\u0142asno\u015B\u0107, pochodz\u0105 z legalnego \u017Ar\u00F3d\u0142a wskazanego powy\u017Cej, s\u0105 wolne od praw i roszcze\u0144 os\u00F3b trzecich oraz nie pochodz\u0105 z czynu zabronionego. Jestem \u015Bwiadomy(-a) odpowiedzialno\u015Bci karnej zwi\u0105zanej z obrotem rzeczami uzyskanymi za pomoc\u0105 czynu zabronionego (art. 291\u2013292 Kodeksu karnego)."))),
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 22 } },
                    React.createElement("div", { style: { textAlign: "center", width: "45%" } },
                        React.createElement("div", { style: { borderTop: "1px solid var(--text)", paddingTop: 5, fontSize: 11.5, color: "var(--muted)" } }, "Podpis przekazuj\u0105cego")),
                    React.createElement("div", { style: { textAlign: "center", width: "45%" } },
                        React.createElement("div", { style: { borderTop: "1px solid var(--text)", paddingTop: 5, fontSize: 11.5, color: "var(--muted)" } }, "Podpis przyjmuj\u0105cego"))),
                tx.kind === "FPO" && React.createElement("div", { style: { fontSize: 11, color: "var(--faint)", marginTop: 12, lineHeight: 1.5 } }, "Formularz przyj\u0119cia odpad\u00F3w metali prowadzony zgodnie z art. 102 ustawy o odpadach. Stanowi umow\u0119 kupna-sprzeda\u017Cy (PCC 2% po stronie przyjmuj\u0105cego). Dane przekazuj\u0105cego oraz \u017Ar\u00F3d\u0142o pochodzenia trafiaj\u0105 do ewidencji odpad\u00F3w i BDO."))),
        React.createElement(FpoWydruk, { tx: tx, company: company }),
        React.createElement("div", { className: "no-print", style: { padding: "12px 16px calc(12px + env(safe-area-inset-bottom))", background: "var(--surface)", borderTop: "1px solid var(--line)", display: "flex", gap: 10 } },
            onNew && React.createElement("button", { onClick: onNew, style: { ...btnGhost, flex: 1 } }, "Nowe przyj\u0119cie"),
            React.createElement("button", { onClick: onClose, style: { ...btnCopper, flex: 1 } }, "Gotowe"))));
}
const docLabel = { fontSize: 11, color: "var(--faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 };
/* ─────────── Raport (podgląd / PDF) ─────────── */
function ReportDoc({ data, company, onClose }) {
    if (!data)
        return null;
    return (React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 92, background: "var(--bg)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" } },
        React.createElement("div", { className: "no-print", style: { display: "flex", alignItems: "center", gap: 10, padding: "calc(12px + env(safe-area-inset-top)) 16px 12px", borderBottom: "1px solid var(--line)", background: "var(--surface)" } },
            React.createElement("button", { onClick: onClose, style: iconBtn },
                React.createElement(X, { size: 19 })),
            React.createElement("div", { style: { flex: 1, fontFamily: "var(--display)", fontSize: 17, fontWeight: 800 } }, "Raport dnia"),
            React.createElement("button", { onClick: () => downloadText("raport_" + data.day + ".txt", data.text), style: { ...iconBtn, width: "auto", padding: "0 11px", gap: 6, fontSize: 14, fontWeight: 700 } },
                React.createElement(FileText, { size: 15 }),
                " .txt"),
            React.createElement("button", { onClick: () => { try {
                    window.print();
                }
                catch (e) { } }, style: { ...iconBtn, width: "auto", padding: "0 11px", gap: 6, fontSize: 14, fontWeight: 700, color: "var(--copper)" } },
                React.createElement(Printer, { size: 15 }),
                " PDF")),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: 16 } },
            React.createElement("div", { className: "print-target", style: { background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: "20px 18px", boxShadow: "0 10px 30px -18px rgba(0,0,0,.4)" } },
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid var(--text)", paddingBottom: 12, marginBottom: 12 } },
                    React.createElement("div", null,
                        React.createElement("div", { style: { fontFamily: "var(--display)", fontWeight: 800, fontSize: 15 } }, "RAPORT DZIENNY"),
                        React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 4 } },
                            company.name,
                            " \u00B7 ",
                            data.day)),
                    React.createElement("div", { style: { width: 38, height: 38, borderRadius: 9, background: "linear-gradient(135deg,#c8743f,#a85829)", display: "grid", placeItems: "center", flexShrink: 0 } },
                        React.createElement(FileText, { size: 19, color: "#fff" }))),
                React.createElement("pre", { style: { margin: 0, fontFamily: "var(--mono)", fontSize: 12.5, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word", color: "var(--text)" } }, data.text)),
            React.createElement("div", { className: "no-print", style: { fontSize: 13, color: "var(--faint)", textAlign: "center", marginTop: 14, lineHeight: 1.5 } }, "PDF: w oknie wydruku wybierz \u201EZapisz jako PDF\". Na telefonie mo\u017Cesz go potem udost\u0119pni\u0107 (e-mail, WhatsApp)."))));
}
/* ─────────── Logowanie ─────────── */
function Login({ users, onLogin }) {
    const [login, setLogin] = useState("");
    const [pass, setPass] = useState("");
    const [err, setErr] = useState("");
    const tryLogin = (l, p) => {
        const u = users.find((x) => x.login.toLowerCase() === String(l).trim().toLowerCase() && x.pass === p);
        if (!u) {
            setErr("Błędny login lub hasło.");
            return;
        }
        setErr("");
        onLogin(u.id);
    };
    const appMode = (() => { try {
        return localStorage.getItem("sk_app_mode");
    }
    catch (e) {
        return null;
    } })();
    const cloudMode = (() => { try {
        return !!(window.SUPA && window.SUPA.url);
    }
    catch (e) {
        return false;
    } })();
    const demos = cloudMode ? [] : (appMode === "client" ? [["klient", "Klient", Smartphone]] : [["wlasciciel", "Właściciel", Factory]]);
    return (React.createElement("div", { className: "sk-root", style: { minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "24px", maxWidth: 480, margin: "0 auto" } },
        React.createElement("div", { style: { textAlign: "center", marginBottom: 26 } },
            React.createElement("div", { style: { width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#c8743f,#a85829)", display: "grid", placeItems: "center", margin: "0 auto 16px", boxShadow: "0 10px 26px -10px rgba(168,88,41,.8)" } },
                React.createElement(Recycle, { size: 34, color: "#fff" })),
            React.createElement("div", { style: { fontFamily: "var(--display)", fontWeight: 800, fontSize: 26, letterSpacing: "-.02em" } }, "SkupOS"),
            React.createElement("div", { style: { color: "var(--muted)", fontSize: 14.5, marginTop: 4 } }, appMode === "client" ? "Portal klienta — sprawdź ceny i swoje rozliczenia" : "Logowanie do systemu skupu")),
        React.createElement(Card, null,
            React.createElement("label", { style: label }, "Login"),
            React.createElement("input", { style: inputStyle, value: login, autoCapitalize: "none", onChange: (e) => setLogin(e.target.value), placeholder: "np. kierownik" }),
            React.createElement("label", { style: label }, "Has\u0142o"),
            React.createElement("input", { style: inputStyle, type: "password", value: pass, onChange: (e) => setPass(e.target.value), placeholder: "\u2022\u2022\u2022\u2022", onKeyDown: (e) => { if (e.key === "Enter")
                    tryLogin(login, pass); } }),
            err && React.createElement("div", { style: { color: "var(--red)", fontSize: 14, fontWeight: 600, marginTop: 10 } }, err),
            React.createElement("button", { style: { ...btnCopper, marginTop: 16 }, onClick: () => tryLogin(login, pass) }, "Zaloguj")),
        React.createElement("div", { style: { ...sectionTitle, textAlign: "center", margin: "22px 0 10px" } }, "Szybkie logowanie \u00B7 has\u0142o: 1234"),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 9 } }, demos.map(([l, lbl, Ic]) => (React.createElement("button", { key: l, onClick: () => tryLogin(l, "1234"), style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 6px", borderRadius: 13, cursor: "pointer", border: "1px solid var(--line2)", background: "var(--surface)", color: "var(--text)" } },
            React.createElement(Ic, { size: 18, color: "var(--copper)" }),
            React.createElement("span", { style: { fontSize: 14, fontWeight: 700 } }, lbl))))),
        React.createElement("div", { style: { fontSize: 12.5, color: "var(--faint)", textAlign: "center", marginTop: 18, lineHeight: 1.5 } }, "Prototyp \u2014 konta zapisane lokalnie na urz\u0105dzeniu, bez prawdziwego serwera. Realne logowanie i szyfrowanie dochodz\u0105 przy wdro\u017Ceniu backendu.")));
}
/* ─────────── Użytkownicy (właściciel) ─────────── */
function UsersManager({ users, setUsers, currentUser, onClose }) {
    const [adding, setAdding] = useState(false);
    const [f, setF] = useState({ name: "", login: "", pass: "", role: "operator" });
    const [err, setErr] = useState("");
    const roleIcon = (r) => r === "owner" ? Factory : r === "client" ? Smartphone : r === "controller" ? ShieldCheck : r === "marketing" ? Megaphone : r === "accountant" ? Calculator : r === "pracownik" ? Users : r === "kierowca" ? Truck : Scale;
    const addUser = () => {
        const login = f.login.trim().toLowerCase();
        if (!f.name.trim() || !login || !f.pass.trim()) {
            setErr("Uzupełnij imię, login i hasło.");
            return;
        }
        if (users.some((u) => u.login.toLowerCase() === login)) {
            setErr("Taki login już istnieje.");
            return;
        }
        setUsers([...users, { id: uid(), name: f.name.trim(), login, pass: f.pass.trim(), role: f.role }]);
        setF({ name: "", login: "", pass: "", role: "operator" });
        setErr("");
        setAdding(false);
    };
    const removeUser = (id) => setUsers(users.filter((u) => u.id !== id));
    return (React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 80, background: "var(--bg)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "calc(12px + env(safe-area-inset-top)) 16px 12px", borderBottom: "1px solid var(--line)", background: "var(--surface)" } },
            React.createElement("button", { onClick: onClose, style: iconBtn },
                React.createElement(X, { size: 19 })),
            React.createElement("div", { style: { flex: 1, fontFamily: "var(--display)", fontSize: 17, fontWeight: 800 } }, "U\u017Cytkownicy i konta"),
            React.createElement("button", { onClick: () => { setAdding((v) => !v); setErr(""); }, style: { ...iconBtn, width: "auto", padding: "0 13px", gap: 7, fontSize: 14.5, fontWeight: 700, color: "var(--copper)" } },
                React.createElement(Plus, { size: 16 }),
                " Dodaj")),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "16px 16px 40px" } },
            adding && (React.createElement(Card, { style: { marginBottom: 16 } },
                React.createElement("div", { style: { fontFamily: "var(--display)", fontWeight: 700, fontSize: 15, marginBottom: 6 } }, "Nowe konto"),
                React.createElement("label", { style: label }, "Imi\u0119 / nazwa"),
                React.createElement("input", { style: inputStyle, value: f.name, onChange: (e) => setF({ ...f, name: e.target.value }), placeholder: "np. Adam Nowak" }),
                React.createElement("div", { style: { display: "flex", gap: 10 } },
                    React.createElement("div", { style: { flex: 1 } },
                        React.createElement("label", { style: label }, "Login"),
                        React.createElement("input", { style: inputStyle, value: f.login, autoCapitalize: "none", onChange: (e) => setF({ ...f, login: e.target.value }), placeholder: "adam" })),
                    React.createElement("div", { style: { flex: 1 } },
                        React.createElement("label", { style: label }, "Has\u0142o"),
                        React.createElement("input", { style: inputStyle, value: f.pass, onChange: (e) => setF({ ...f, pass: e.target.value }), placeholder: "\u2022\u2022\u2022\u2022" }))),
                React.createElement("label", { style: label }, "Rola"),
                React.createElement("div", { style: { display: "flex", gap: 8 } }, [["operator", "Kierownik"], ["kierowca", "Kierowca"], ["pracownik", "Pracownik"], ["controller", "Kontroler"], ["marketing", "Marketing"], ["accountant", "Księgowy"], ["owner", "Właściciel"], ["client", "Klient"]].map(([r, lbl]) => (React.createElement("button", { key: r, onClick: () => setF({ ...f, role: r }), style: { flex: "1 1 40%", padding: "10px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700, border: f.role === r ? "1.5px solid var(--copper)" : "1px solid var(--line2)", background: f.role === r ? "rgba(200,116,63,.1)" : "var(--surface)", color: f.role === r ? "var(--copper)" : "var(--muted)" } }, lbl)))),
                err && React.createElement("div", { style: { color: "var(--red)", fontSize: 14, fontWeight: 600, marginTop: 10 } }, err),
                React.createElement("button", { style: { ...btnCopper, marginTop: 14 }, onClick: addUser }, "Utw\u00F3rz konto"))),
            users.map((u) => {
                const Ic = roleIcon(u.role);
                const self = u.id === currentUser.id;
                return (React.createElement(Card, { key: u.id, pad: 13, style: { marginBottom: 9 } },
                    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
                        React.createElement("div", { style: { width: 40, height: 40, borderRadius: 11, background: u.role === "owner" ? "rgba(200,116,63,.13)" : u.role === "client" ? "rgba(63,125,138,.13)" : "rgba(43,52,64,.1)", display: "grid", placeItems: "center", flexShrink: 0 } },
                            React.createElement(Ic, { size: 19, color: u.role === "client" ? "#3f7d8a" : "var(--copper)" })),
                        React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                            React.createElement("div", { style: { fontSize: 14.5, fontWeight: 700 } },
                                u.name,
                                " ",
                                self && React.createElement("span", { style: { fontSize: 12.5, color: "var(--faint)", fontWeight: 500 } }, "(Ty)")),
                            React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)" } },
                                ROLE_LABEL[u.role],
                                " \u00B7 @",
                                u.login)),
                        !self && React.createElement("button", { onClick: () => removeUser(u.id), style: { ...iconBtn, width: 44, height: 44, color: "var(--red)", border: "none", boxShadow: "none", background: "rgba(220,38,38,.08)" }, title: "Usuń konto", "aria-label": "Usuń konto" },
                            React.createElement(Trash2, { size: 15 })))));
            }),
            React.createElement("div", { style: { fontSize: 13, color: "var(--faint)", marginTop: 14, lineHeight: 1.5, textAlign: "center" } }, "Konta i role dzia\u0142aj\u0105 w prototypie lokalnie. Przy wdro\u017Ceniu zast\u0105pi je prawdziwe logowanie (e-mail + has\u0142o, role po stronie serwera, reset has\u0142a)."))));
}
/* ─────────── Zgłoszenia klientów (panel właściciela) ─────────── */
function RequestsInbox({ requests, setRequests, mm }) {
    const [replyFor, setReplyFor] = useState(null);
    const [rPrice, setRPrice] = useState("");
    const [rMsg, setRMsg] = useState("");
    const [zoom, setZoom] = useState(null);
    const list = (requests || []).slice().sort((a, b) => b.ts - a.ts);
    const openReply = (r) => { setReplyFor(r); setRPrice(r.reply ? String(r.reply.price || "") : ""); setRMsg(r.reply ? (r.reply.message || "") : ""); };
    const sendReply = () => {
        setRequests((p) => p.map((x) => x.id === replyFor.id ? { ...x, status: "answered", reply: { price: rPrice ? parseFloat(rPrice) : null, message: rMsg.trim(), ts: Date.now() } } : x));
        setReplyFor(null);
        setRPrice("");
        setRMsg("");
    };
    return (React.createElement("div", { style: { padding: "0 16px" } },
        React.createElement("header", { style: { paddingTop: 24 } },
            React.createElement("h1", { style: { margin: 0, fontFamily: "var(--display)", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" } }, "Zg\u0142oszenia"),
            React.createElement("div", { style: { color: "var(--muted)", fontSize: 14.5, marginTop: 2 } }, "Wyceny i wiadomo\u015Bci od klient\u00F3w")),
        list.length === 0 && React.createElement(Card, { style: { marginTop: 18 } },
            React.createElement("div", { style: { textAlign: "center", color: "var(--muted)", fontSize: 15, padding: "16px 8px" } }, "Brak zg\u0142osze\u0144. Gdy klient wy\u015Ble zdj\u0119cie z pro\u015Bb\u0105 o wycen\u0119, pojawi si\u0119 tutaj.")),
        React.createElement("div", { style: { marginTop: 16 } }, list.map((r) => (React.createElement(Card, { key: r.id, style: { marginBottom: 11 } },
            React.createElement("div", { style: { display: "flex", gap: 12 } },
                r.photo
                    ? React.createElement("img", { src: r.photo, alt: "", onClick: () => setZoom(r.photo), style: { width: 64, height: 64, borderRadius: 11, objectFit: "cover", cursor: "zoom-in", flexShrink: 0, border: "1px solid var(--line)" } })
                    : React.createElement("div", { style: { width: 64, height: 64, borderRadius: 11, background: "var(--surface2)", display: "grid", placeItems: "center", flexShrink: 0 } },
                        React.createElement(MessageSquare, { size: 22, color: "var(--faint)" })),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 } },
                        React.createElement("span", { style: { fontWeight: 700, fontSize: 14.5 } }, r.clientName || "Klient"),
                        React.createElement("span", { style: { fontSize: 12, fontWeight: 800, padding: "3px 8px", borderRadius: 99, background: r.status === "new" ? "rgba(220,38,38,.12)" : "rgba(21,163,74,.12)", color: r.status === "new" ? "var(--red)" : "var(--green)" } }, r.status === "new" ? "NOWE" : "ODPOWIEDZIANO")),
                    React.createElement("div", { style: { fontSize: 13, color: "var(--muted)", fontFamily: "var(--mono)", marginTop: 2 } },
                        r.plate ? r.plate + " · " : "",
                        fmtDate(r.ts),
                        " ",
                        fmtTs(r.ts)),
                    r.material && React.createElement("div", { style: { fontSize: 14, marginTop: 6 } },
                        "Sugestia AI: ",
                        React.createElement("b", null, r.material),
                        r.est ? ` · ~${r.est}` : ""),
                    r.note && React.createElement("div", { style: { fontSize: 14.5, marginTop: 6, color: "var(--text)" } },
                        "\u201E",
                        r.note,
                        "\""))),
            r.reply && (React.createElement("div", { style: { marginTop: 11, padding: "10px 12px", borderRadius: 11, background: "rgba(200,116,63,.08)", border: "1px solid rgba(200,116,63,.2)" } },
                React.createElement("div", { style: { fontSize: 12.5, fontWeight: 700, color: "var(--copper)", marginBottom: 3 } }, "Twoja wycena"),
                r.reply.price != null && React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 17 } }, pln(r.reply.price)),
                r.reply.message && React.createElement("div", { style: { fontSize: 14.5, marginTop: 2 } }, r.reply.message))),
            React.createElement("div", { style: { display: "flex", gap: 9, marginTop: 12 } },
                React.createElement("button", { onClick: () => openReply(r), style: { ...btnCopper, flex: 1 } },
                    React.createElement(Send, { size: 16 }),
                    " ",
                    r.status === "new" ? "Wyceń / odpowiedz" : "Edytuj odpowiedź"),
                React.createElement("button", { onClick: () => setRequests((p) => p.filter((x) => x.id !== r.id)), style: { ...iconBtn, color: "var(--red)", border: "none", background: "rgba(220,38,38,.08)" } },
                    React.createElement(Trash2, { size: 16 }))))))),
        React.createElement(Sheet, { open: !!replyFor, onClose: () => setReplyFor(null), title: "Wycena dla klienta" }, replyFor && (React.createElement(React.Fragment, null,
            replyFor.photo && React.createElement("img", { src: replyFor.photo, alt: "", style: { width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 12, marginBottom: 12, border: "1px solid var(--line)" } }),
            React.createElement("label", { style: label }, "Proponowana cena / wyp\u0142ata (z\u0142)"),
            React.createElement("input", { type: "number", inputMode: "decimal", value: rPrice, onChange: (e) => setRPrice(e.target.value), placeholder: "np. 140", style: { ...inputStyle, fontFamily: "var(--mono)", fontWeight: 700, fontSize: 18 } }),
            React.createElement("label", { style: label }, "Wiadomo\u015B\u0107"),
            React.createElement("textarea", { value: rMsg, onChange: (e) => setRMsg(e.target.value), placeholder: "np. Mied\u017A mix ~5 kg, zapraszamy do punktu \u2014 cena wa\u017Cna 3 dni.", rows: 3, style: { ...inputStyle, resize: "vertical", lineHeight: 1.4 } }),
            React.createElement("button", { onClick: sendReply, style: { ...btnCopper, marginTop: 16 } },
                React.createElement(Send, { size: 18 }),
                " Wy\u015Blij do klienta")))),
        zoom && (React.createElement("div", { onClick: () => setZoom(null), style: { position: "fixed", inset: 0, zIndex: 96, background: "rgba(0,0,0,.85)", display: "grid", placeItems: "center", padding: 20, cursor: "zoom-out" } },
            React.createElement("img", { src: zoom, alt: "", style: { maxWidth: "100%", maxHeight: "100%", borderRadius: 12 } })))));
}
/* ─────────── Uprawnienia ról (panel właściciela) ─────────── */
function PermsManager({ perms, setPerms, onClose }) {
    const roles = [["operator", "Kierownik"], ["kierowca", "Kierowca"], ["pracownik", "Pracownik"], ["controller", "Kontroler"], ["marketing", "Marketing"], ["accountant", "Księgowy"]];
    const toggle = (role, key) => setPerms((p) => ({ ...p, [role]: { ...p[role], [key]: !p[role][key] } }));
    return (React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 80, background: "var(--bg)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "calc(12px + env(safe-area-inset-top)) 16px 12px", borderBottom: "1px solid var(--line)", background: "var(--surface)" } },
            React.createElement("button", { onClick: onClose, style: iconBtn },
                React.createElement(X, { size: 19 })),
            React.createElement("div", { style: { flex: 1, fontFamily: "var(--display)", fontSize: 17, fontWeight: 800 } }, "Uprawnienia r\u00F3l"),
            React.createElement(ShieldCheck, { size: 18, color: "var(--copper)" })),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "16px 16px 40px" } },
            React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", marginBottom: 8, lineHeight: 1.5 } },
                "Decydujesz, co widzi ka\u017Cda rola. ",
                React.createElement("b", null, "W\u0142a\u015Bciciel"),
                " ma zawsze pe\u0142ny dost\u0119p, a ",
                React.createElement("b", null, "Klient"),
                " korzysta z osobnej aplikacji."),
            roles.map(([role, lbl]) => (React.createElement("div", { key: role, style: { marginBottom: 18 } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, margin: "10px 2px 8px" } },
                    role === "controller" ? React.createElement(ShieldCheck, { size: 17, color: "var(--copper)" }) : role === "marketing" ? React.createElement(Megaphone, { size: 17, color: "var(--copper)" }) : role === "accountant" ? React.createElement(Calculator, { size: 17, color: "var(--copper)" }) : React.createElement(Scale, { size: 17, color: "var(--copper)" }),
                    React.createElement("span", { style: { fontFamily: "var(--display)", fontSize: 15, fontWeight: 800 } }, lbl)),
                React.createElement(Card, { pad: 4 }, PERM_KEYS.map(([key, klbl], i) => {
                    const on = !!(perms[role] && perms[role][key]);
                    return (React.createElement("div", { key: key, style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 10px", borderBottom: i < PERM_KEYS.length - 1 ? "1px solid var(--line)" : "none" } },
                        React.createElement("span", { style: { fontSize: 15, fontWeight: 600, paddingRight: 10 } }, klbl),
                        React.createElement("button", { onClick: () => toggle(role, key), style: { width: 46, height: 27, borderRadius: 99, border: "none", cursor: "pointer", padding: 3, background: on ? "var(--green)" : "var(--line2)", flexShrink: 0 } },
                            React.createElement("span", { style: { display: "block", width: 21, height: 21, borderRadius: 99, background: "#fff", transform: on ? "translateX(19px)" : "translateX(0)", transition: "transform .2s" } }))));
                }))))),
            React.createElement("div", { style: { fontSize: 13, color: "var(--faint)", lineHeight: 1.5, textAlign: "center" } }, "Zmiany zapisuj\u0105 si\u0119 automatycznie i dzia\u0142aj\u0105 od razu po przelogowaniu danej roli. W wersji z backendem te uprawnienia egzekwuje serwer (RLS)."))));
}
/* ─────────── Powiadom klientów (broadcast push) ─────────── */
function PowiadomKlientow({ materials, company }) {
    const [typ, setTyp] = useState("promocja");
    const [tytul, setTytul] = useState("");
    const [tresc, setTresc] = useState("");
    const [wyslane, setWyslane] = useState(false);
    const [historia, setHistoria] = useState(() => { try {
        const s = localStorage.getItem("sk_broadcast_v1");
        return s ? JSON.parse(s) : [];
    }
    catch {
        return [];
    } });
    // Symulowana liczba subskrybentów
    const subskrybenci = 47;
    const SZABLONY = {
        promocja: { ic: "🔥", tytul: "Promocja tygodnia!", tresc: `W tym tygodniu wyższe ceny skupu miedzi w ${company?.name || "naszym skupie"}! Przyjedź i zgarnij najlepszą stawkę. 📞 ${company?.phone || ""}` },
        wzrost: { ic: "📈", tytul: "Ceny w górę!", tresc: "Podnieśliśmy ceny skupu metali kolorowych. Sprawdź aktualny cennik w aplikacji i przyjedź dziś!" },
        info: { ic: "ℹ️", tytul: "Ważna informacja", tresc: "" },
        godziny: { ic: "🕐", tytul: "Zmiana godzin otwarcia", tresc: "Informujemy o zmianie godzin pracy skupu. Sprawdź szczegóły w aplikacji." },
    };
    const uzyjSzablon = (k) => { setTyp(k); setTytul(SZABLONY[k].tytul); setTresc(SZABLONY[k].tresc); };
    const wyslij = () => {
        if (!tytul.trim() || !tresc.trim())
            return;
        const broadcast = { typ: "promocja", tytul: (SZABLONY[typ]?.ic || "🔔") + " " + tytul, tresc, ts: Date.now(), odbiorcy: subskrybenci };
        const nowa = [broadcast, ...historia].slice(0, 20);
        setHistoria(nowa);
        try {
            localStorage.setItem("sk_broadcast_v1", JSON.stringify(nowa));
        }
        catch { }
        // W wersji produkcyjnej (Supabase) tutaj nastąpiłby realny push do urządzeń klientów
        setWyslane(true);
        setTimeout(() => setWyslane(false), 3000);
        setTytul("");
        setTresc("");
    };
    const fmtCzas = (ts) => { const h = Math.round((Date.now() - ts) / 3600000); if (h < 1)
        return "przed chwilą"; if (h < 24)
        return `${h}h temu`; return `${Math.round(h / 24)}d temu`; };
    return (React.createElement("div", { style: { marginTop: 14 } },
        React.createElement("div", { style: { background: "linear-gradient(135deg,rgba(200,116,63,.1),rgba(200,116,63,.02))", border: "1px solid rgba(200,116,63,.3)", borderRadius: 18, padding: "16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 14 } },
            React.createElement("span", { style: { fontSize: 32 } }, "\uD83D\uDCF2"),
            React.createElement("div", null,
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 900, fontSize: 26, color: "var(--copper)" } }, subskrybenci),
                React.createElement("div", { style: { fontSize: 14, color: "var(--muted)" } }, "klient\u00F3w z w\u0142\u0105czonymi powiadomieniami"))),
        React.createElement("div", { style: sectionTitle }, "Szybkie szablony"),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 14 } }, Object.entries(SZABLONY).map(([k, s]) => (React.createElement("button", { key: k, onClick: () => uzyjSzablon(k), style: { padding: "13px 12px", borderRadius: 13, cursor: "pointer", textAlign: "left", border: typ === k ? "1.5px solid var(--copper)" : "1px solid var(--line2)", background: typ === k ? "rgba(200,116,63,.1)" : "var(--surface)", color: "var(--text)" } },
            React.createElement("div", { style: { fontSize: 22, marginBottom: 4 } }, s.ic),
            React.createElement("div", { style: { fontSize: 14, fontWeight: 700 } }, s.tytul))))),
        React.createElement(Card, null,
            React.createElement("label", { style: label }, "Tytu\u0142 powiadomienia"),
            React.createElement("input", { style: inputStyle, value: tytul, onChange: e => setTytul(e.target.value), placeholder: "np. Promocja tygodnia!", maxLength: 50 }),
            React.createElement("label", { style: label }, "Tre\u015B\u0107 wiadomo\u015Bci"),
            React.createElement("textarea", { rows: 3, style: { ...inputStyle, resize: "vertical" }, value: tresc, onChange: e => setTresc(e.target.value), placeholder: "Co chcesz przekaza\u0107 klientom?", maxLength: 200 }),
            React.createElement("div", { style: { fontSize: 12.5, color: "var(--faint)", textAlign: "right", marginTop: 4 } },
                tresc.length,
                "/200"),
            (tytul || tresc) && (React.createElement("div", { style: { marginTop: 12 } },
                React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)", marginBottom: 6, fontWeight: 600 } }, "Podgl\u0105d na telefonie klienta:"),
                React.createElement("div", { style: { background: "var(--surface2)", borderRadius: 14, padding: "12px 14px", display: "flex", gap: 11, alignItems: "flex-start", border: "1px solid var(--line)" } },
                    React.createElement("div", { style: { width: 36, height: 36, borderRadius: 9, background: "var(--copper)", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 18 } }, SZABLONY[typ]?.ic || "🔔"),
                    React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                        React.createElement("div", { style: { fontSize: 14, fontWeight: 700 } }, company?.name || "SkupOS"),
                        React.createElement("div", { style: { fontSize: 14.5, fontWeight: 600, marginTop: 2 } }, tytul || "Tytuł powiadomienia"),
                        React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 } }, tresc || "Treść wiadomości…"))))),
            React.createElement("button", { onClick: wyslij, disabled: !tytul.trim() || !tresc.trim(), style: { ...btnCopper, marginTop: 14, opacity: (tytul.trim() && tresc.trim()) ? 1 : .5, cursor: (tytul.trim() && tresc.trim()) ? "pointer" : "not-allowed" } }, wyslane ? "✓ Wysłano do " + subskrybenci + " klientów!" : "📲 Wyślij powiadomienie")),
        historia.length > 0 && (React.createElement(React.Fragment, null,
            React.createElement("div", { style: sectionTitle }, "Wys\u0142ane powiadomienia"),
            historia.map((h, i) => (React.createElement(Card, { key: i, pad: 13, style: { marginBottom: 8 } },
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" } },
                    React.createElement("div", { style: { flex: 1 } },
                        React.createElement("div", { style: { fontWeight: 700, fontSize: 15 } }, h.tytul),
                        React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 3, lineHeight: 1.5 } }, h.tresc))),
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--line)" } },
                    React.createElement("span", { style: { fontSize: 12.5, color: "var(--faint)" } }, fmtCzas(h.ts)),
                    React.createElement("span", { style: { fontSize: 12.5, color: "var(--green)", fontWeight: 700 } },
                        "\uD83D\uDCF2 ",
                        h.odbiorcy,
                        " odbiorc\u00F3w"))))))),
        React.createElement(Card, { style: { marginTop: 6, background: "var(--surface2)" } },
            React.createElement("div", { style: { fontSize: 14, lineHeight: 1.6, color: "var(--muted)" } },
                React.createElement("b", { style: { color: "var(--text)" } }, "\uD83D\uDCA1 Jak to dzia\u0142a:"),
                " Klienci, kt\u00F3rzy zainstalowali aplikacj\u0119 i w\u0142\u0105czyli powiadomienia, dostaj\u0105 Twoj\u0105 wiadomo\u015B\u0107 prosto na ekran blokady telefonu. To najta\u0144szy spos\u00F3b, by \u015Bci\u0105gn\u0105\u0107 ich do skupu, gdy ceny rosn\u0105.")),
        React.createElement("div", { style: { fontSize: 12.5, color: "var(--faint)", marginTop: 10, lineHeight: 1.5, textAlign: "center" } }, "W wersji produkcyjnej powiadomienia trafiaj\u0105 na urz\u0105dzenia klient\u00F3w przez serwer push.")));
}
/* ─────────── Zadania pracowników ─────────── */
function Zadania({ zadania, setZadania, users, currentUser, isOwner }) {
    const [open, setOpen] = useState(false);
    const [edit, setEdit] = useState(null);
    const moze = isOwner || (currentUser && currentUser.role === "operator"); // kto przypisuje
    const [filtr, setFiltr] = useState(moze ? "wszystkie" : "moje");
    const pracownicy = (users || []).filter(u => u.role !== "client");
    const PRIO = { high: ["Pilne", "var(--red)"], medium: ["Normalne", "var(--amber)"], low: ["Później", "var(--green)"] };
    const userName = (id) => { const u = (users || []).find(x => x.id === id); return u ? u.name : "—"; };
    const termKol = (due, status) => { if (!due || status === "done")
        return "var(--muted)"; const d = Math.ceil((new Date(due) - Date.now()) / 86400000); return d < 0 ? "var(--red)" : d <= 1 ? "var(--amber)" : "var(--green)"; };
    const termTxt = (due) => { const d = Math.ceil((new Date(due) - Date.now()) / 86400000); return d < 0 ? `${-d} dni po terminie` : d === 0 ? "dziś" : d === 1 ? "jutro" : `za ${d} dni`; };
    const widoczne = (zadania || []).filter(z => filtr === "moje" ? z.assignee === (currentUser && currentUser.id) : true);
    const aktywne = widoczne.filter(z => z.status !== "done").sort((a, b) => (a.due || "9").localeCompare(b.due || "9"));
    const zrobione = widoczne.filter(z => z.status === "done").sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
    const mojeAktywne = (zadania || []).filter(z => z.assignee === (currentUser && currentUser.id) && z.status !== "done").length;
    const nowe = () => { setEdit({ id: null, title: "", note: "", assignee: pracownicy[0] ? pracownicy[0].id : "", prio: "medium", due: "", status: "todo" }); setOpen(true); };
    const zapisz = () => {
        if (!edit.title.trim())
            return;
        if (edit.id)
            setZadania(zadania.map(z => z.id === edit.id ? edit : z));
        else
            setZadania([{ ...edit, id: uid(), createdAt: Date.now() }, ...zadania]);
        setOpen(false);
    };
    const toggle = (z) => setZadania(zadania.map(x => x.id === z.id ? { ...x, status: x.status === "done" ? "todo" : "done", doneAt: x.status === "done" ? null : Date.now() } : x));
    const Karta = (z) => (React.createElement(Card, { key: z.id, pad: 13, style: { marginBottom: 9, opacity: z.status === "done" ? 0.55 : 1 } },
        React.createElement("div", { style: { display: "flex", gap: 11, alignItems: "flex-start" } },
            React.createElement("button", { onClick: () => toggle(z), style: { width: 24, height: 24, borderRadius: 7, border: z.status === "done" ? "none" : "2px solid var(--line2)", background: z.status === "done" ? "var(--green)" : "transparent", cursor: "pointer", flexShrink: 0, marginTop: 1, display: "grid", placeItems: "center", color: "#fff" } }, z.status === "done" && React.createElement(Check, { size: 15 })),
            React.createElement("div", { style: { flex: 1, minWidth: 0, cursor: moze ? "pointer" : "default" }, onClick: () => { if (moze) {
                    setEdit(z);
                    setOpen(true);
                } } },
                React.createElement("div", { style: { fontWeight: 700, fontSize: 14, textDecoration: z.status === "done" ? "line-through" : "none" } }, z.title),
                z.note && React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 2, lineHeight: 1.45 } }, z.note),
                React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", marginTop: 7, flexWrap: "wrap" } },
                    React.createElement("span", { style: { fontSize: 12.5, color: "var(--muted)", fontWeight: 600 } },
                        "\uD83D\uDC64 ",
                        z.assignee ? userName(z.assignee) : "Nieprzypisane"),
                    z.due && React.createElement("span", { style: { fontSize: 12.5, color: termKol(z.due, z.status), fontWeight: 600 } },
                        "\uD83D\uDCC5 ",
                        z.status === "done" ? z.due : termTxt(z.due)),
                    z.status !== "done" && React.createElement("span", { style: { fontSize: 11.5, fontWeight: 800, color: PRIO[z.prio][1], background: PRIO[z.prio][1] + "22", padding: "2px 8px", borderRadius: 99 } }, PRIO[z.prio][0]))))));
    return (React.createElement("div", { style: { padding: "0 16px" } },
        React.createElement("header", { style: { paddingTop: 24 } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" } },
                React.createElement("div", null,
                    React.createElement("h1", { style: { margin: 0, fontFamily: "var(--display)", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" } }, "Zadania"),
                    React.createElement("div", { style: { color: "var(--muted)", fontSize: 14.5, marginTop: 2 } }, mojeAktywne > 0 ? `Masz ${mojeAktywne} ${mojeAktywne === 1 ? "zadanie" : "zadań"} do zrobienia` : "Brak zadań do zrobienia")),
                moze && React.createElement("button", { onClick: nowe, style: { ...btnCopper, width: "auto", padding: "10px 15px", fontSize: 15 } },
                    React.createElement(Plus, { size: 17 }),
                    " Nowe"))),
        moze && (React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 16 } }, [["wszystkie", "Wszystkie"], ["moje", "Moje"]].map(([k, l]) => (React.createElement("button", { key: k, onClick: () => setFiltr(k), style: { padding: "8px 16px", borderRadius: 99, cursor: "pointer", fontSize: 14.5, fontWeight: 700, border: filtr === k ? "1.5px solid var(--copper)" : "1px solid var(--line2)", background: filtr === k ? "rgba(200,116,63,.1)" : "var(--surface)", color: filtr === k ? "var(--copper)" : "var(--muted)" } }, l))))),
        React.createElement("div", { style: { marginTop: 16 } }, aktywne.length === 0 && zrobione.length === 0 ? (moze ? (React.createElement(Card, { onClick: nowe, style: { textAlign: "center", padding: 30, cursor: "pointer", border: "1.5px dashed var(--line2)" } },
            React.createElement("div", { style: { width: 48, height: 48, borderRadius: 14, background: "rgba(200,116,63,.12)", display: "grid", placeItems: "center", margin: "0 auto 12px" } },
                React.createElement(Plus, { size: 24, color: "var(--copper)" })),
            React.createElement("div", { style: { fontSize: 14.5, fontWeight: 700 } }, "Przydziel pierwsze zadanie"),
            React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", marginTop: 3 } }, "Wybierz pracownika, ustaw termin i priorytet"))) : (React.createElement(Card, { style: { textAlign: "center", padding: 30, color: "var(--muted)" } },
            React.createElement(BadgeCheck, { size: 26, color: "var(--faint)", style: { marginBottom: 8 } }),
            React.createElement("div", { style: { fontSize: 14 } }, "Nie masz przypisanych zada\u0144.")))) : (React.createElement(React.Fragment, null,
            aktywne.map(Karta),
            zrobione.length > 0 && (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { ...sectionTitle, marginTop: 18 } },
                    "Zrobione (",
                    zrobione.length,
                    ")"),
                zrobione.map(Karta)))))),
        React.createElement(Sheet, { open: open, onClose: () => setOpen(false), title: edit && edit.id ? "Edytuj zadanie" : "Nowe zadanie" }, edit && (React.createElement(React.Fragment, null,
            React.createElement("label", { style: label }, "Co trzeba zrobi\u0107"),
            React.createElement("input", { style: inputStyle, value: edit.title, onChange: e => setEdit({ ...edit, title: e.target.value }), placeholder: "np. Posegregowa\u0107 mied\u017A z poniedzia\u0142ku" }),
            React.createElement("label", { style: label }, "Szczeg\u00F3\u0142y (opcjonalnie)"),
            React.createElement("input", { style: inputStyle, value: edit.note, onChange: e => setEdit({ ...edit, note: e.target.value }), placeholder: "dodatkowe informacje" }),
            React.createElement("label", { style: label }, "Przypisz do"),
            React.createElement("select", { value: edit.assignee, onChange: e => setEdit({ ...edit, assignee: e.target.value }), style: { ...inputStyle, fontWeight: 700 } }, pracownicy.map(u => React.createElement("option", { key: u.id, value: u.id },
                u.name,
                " (",
                ROLE_LABEL[u.role] || u.role,
                ")"))),
            React.createElement("div", { style: { display: "flex", gap: 10 } },
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("label", { style: label }, "Priorytet"),
                    React.createElement("select", { value: edit.prio, onChange: e => setEdit({ ...edit, prio: e.target.value }), style: { ...inputStyle, fontWeight: 700 } },
                        React.createElement("option", { value: "high" }, "Pilne"),
                        React.createElement("option", { value: "medium" }, "Normalne"),
                        React.createElement("option", { value: "low" }, "P\u00F3\u017Aniej"))),
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("label", { style: label }, "Termin"),
                    React.createElement("input", { type: "date", style: inputStyle, value: edit.due, onChange: e => setEdit({ ...edit, due: e.target.value }) }))),
            React.createElement("button", { style: { ...btnCopper, marginTop: 18 }, onClick: zapisz }, edit.id ? "Zapisz zmiany" : "Dodaj zadanie"),
            edit.id && React.createElement("button", { style: { ...btnGhost, marginTop: 10, color: "var(--red)", borderColor: "rgba(220,38,38,.3)" }, onClick: () => { setZadania(zadania.filter(z => z.id !== edit.id)); setOpen(false); } }, "Usu\u0144 zadanie"))))));
}
/* ─────────── Doradca Biznesowy AI (3 specjalistów) ─────────── */
/* ─────────── #6 Nadzorca AI (skan regułowy zawsze + głęboki skan AI) ─────────── */
function NadzorcaAI({ tx, materials }) {
    const txx = tx || [];
    const mats = materials || [];
    const matById = {};
    mats.forEach((m) => { matById[m.id] = m; });
    const z = (n) => Math.round(n).toLocaleString("pl-PL") + " zł";
    const [aiBusy, setAiBusy] = useState(false);
    const [aiOut, setAiOut] = useState(null);
    const alerts = useMemo(() => {
        const a = [];
        txx.forEach((t) => {
            const total = (t.pos || []).reduce((s, p) => s + p.w * p.price, 0);
            const sup = t.firma ? t.firma.nazwa : (t.osoba ? `${t.osoba.imie} ${t.osoba.nazwisko}` : "—");
            const when = new Date(t.ts).toLocaleDateString("pl-PL");
            (t.pos || []).forEach((p) => {
                const m = matById[p.matId];
                if (m && m.buy > 0) {
                    const dev = (p.price - m.buy) / m.buy;
                    if (dev > 0.4)
                        a.push({ sev: "red", kat: "Cena", txt: `Zapłacono ${p.price.toFixed(2)} zł/kg za „${p.n}" — ${Math.round(dev * 100)}% powyżej cennika (${m.buy.toFixed(2)}). Możliwa pomyłka lub zawyżenie.`, meta: `${sup} · ${when}` });
                    else if (dev > 0.22)
                        a.push({ sev: "amber", kat: "Cena", txt: `„${p.n}" kupione ${Math.round(dev * 100)}% powyżej cennika (${p.price.toFixed(2)} zł/kg).`, meta: `${sup} · ${when}` });
                    if (m.sell && p.price > m.sell)
                        a.push({ sev: "red", kat: "Strata", txt: `„${p.n}" kupione po ${p.price.toFixed(2)} zł/kg — drożej niż cena sprzedaży (${m.sell.toFixed(2)}). Transakcja ze stratą.`, meta: `${sup} · ${when}` });
                }
                if (p.w > 3000)
                    a.push({ sev: "amber", kat: "Waga", txt: `Duży pojedynczy ładunek: ${Math.round(p.w).toLocaleString("pl-PL")} kg „${p.n}". Zweryfikuj wagę i dokumentację.`, meta: `${sup} · ${when}` });
            });
            if (t.payment === "gotowka" && total > 10000)
                a.push({ sev: "amber", kat: "Gotówka", txt: `Płatność gotówką ${z(total)} — przy wysokich kwotach pamiętaj o limicie i dokumentacji.`, meta: `${sup} · ${when}` });
        });
        return a;
    }, [txx, mats]);
    const red = alerts.filter((a) => a.sev === "red");
    const amber = alerts.filter((a) => a.sev === "amber");
    const skanAI = async () => {
        setAiBusy(true);
        setAiOut(null);
        try {
            const sample = txx.slice(0, 60).map((t) => { const tot = (t.pos || []).reduce((s, p) => s + p.w * p.price, 0); return `${new Date(t.ts).toLocaleDateString("pl-PL")} ${t.kind} ${Math.round(tot)}zł: ` + (t.pos || []).map((p) => `${p.n} ${p.w}kg@${p.price}`).join("; "); }).join("\n");
            const cennik = mats.slice(0, 14).map((m) => `${m.n}: skup ${m.buy} / sprzedaż ${m.sell || "-"}`).join("; ");
            const sys = "Jesteś doświadczonym audytorem i nadzorcą skupu złomu. Przeanalizuj transakcje pod kątem nieprawidłowości: zawyżone/zaniżone ceny vs cennik, transakcje ze stratą, podejrzanie duże ładunki, wzorce mogące świadczyć o błędach lub nadużyciach pracowników, ryzyka podatkowe (duża gotówka). Zwróć zwięzły raport po polsku: 3-6 najważniejszych obserwacji i konkretne zalecenia dla właściciela. Rzeczowo.";
            const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1200, system: sys, messages: [{ role: "user", content: `CENNIK: ${cennik}\n\nTRANSAKCJE:\n${sample}\n\nDaj raport nadzorczy.` }] }) });
            const data = await res.json();
            setAiOut((data.content && data.content.map((b) => b.text || "").join("")) || "Brak odpowiedzi.");
        }
        catch (e) {
            setAiOut("__ERR__");
        }
        finally {
            setAiBusy(false);
        }
    };
    const AlertCard = (a, i) => (React.createElement(Card, { key: i, pad: 13, style: { marginBottom: 10, borderLeft: `3px solid ${a.sev === "red" ? "var(--red)" : "var(--amber)"}` } },
        React.createElement("span", { style: { fontSize: 11.5, fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: a.sev === "red" ? "rgba(239,68,68,.16)" : "rgba(224,161,63,.16)", color: a.sev === "red" ? "var(--red)" : "var(--amber)" } }, a.kat),
        React.createElement("div", { style: { fontSize: 14.5, color: "var(--text)", lineHeight: 1.5, marginTop: 7 } }, a.txt),
        React.createElement("div", { style: { fontSize: 12.5, color: "var(--faint)", marginTop: 6 } }, a.meta)));
    return (React.createElement("div", { style: { padding: "0 16px 40px" } },
        React.createElement("header", { style: { paddingTop: 26 } },
            React.createElement("h1", { style: { margin: 0, fontFamily: "var(--display)", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" } }, "Podpowiedzi"),
            React.createElement("div", { style: { fontSize: 14.5, color: "var(--muted)", marginTop: 3 } }, "Pilnuje Twojego skupu \u2014 wy\u0142apuje nieprawid\u0142owo\u015Bci i ryzyka.")),
        React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 18 } },
            React.createElement(Card, { pad: 14, style: { flex: 1, textAlign: "center" } },
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 24, color: "var(--red)" } }, red.length),
                React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)" } }, "pilne")),
            React.createElement(Card, { pad: 14, style: { flex: 1, textAlign: "center" } },
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 24, color: "var(--amber)" } }, amber.length),
                React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)" } }, "do sprawdzenia")),
            React.createElement(Card, { pad: 14, style: { flex: 1, textAlign: "center" } },
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 24, color: "var(--green)" } }, txx.length),
                React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)" } }, "transakcji"))),
        React.createElement("button", { onClick: skanAI, disabled: aiBusy, style: { ...btnCopper, marginTop: 16, opacity: aiBusy ? .7 : 1 } }, aiBusy ? React.createElement(React.Fragment, null,
            React.createElement(RefreshCw, { size: 17, className: "spin" }),
            " Analizuj\u0119\u2026") : React.createElement(React.Fragment, null,
            React.createElement(Sparkles, { size: 17 }),
            " G\u0142\u0119boki skan AI")),
        aiOut === "__ERR__" && React.createElement(Card, { style: { marginTop: 12, background: "rgba(224,161,63,.08)", border: "1px solid rgba(224,161,63,.3)" } },
            React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", lineHeight: 1.5 } }, "G\u0142\u0119boki skan AI wymaga serwera AI (Ustawienia \u2192 Serwer AI). Skan podstawowy poni\u017Cej dzia\u0142a zawsze.")),
        aiOut && aiOut !== "__ERR__" && React.createElement(Card, { style: { marginTop: 12, border: "1px solid rgba(208,130,73,.3)" } },
            React.createElement("div", { style: { fontSize: 12.5, fontWeight: 800, color: "var(--copper)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 } }, "Raport nadzorczy AI"),
            React.createElement("div", { style: { fontSize: 15, color: "var(--text)", lineHeight: 1.6, whiteSpace: "pre-wrap" } }, aiOut)),
        alerts.length === 0 ? (React.createElement(Card, { style: { textAlign: "center", padding: 40, marginTop: 16, color: "var(--muted)" } },
            React.createElement("div", { style: { fontSize: 40, marginBottom: 8 } }, "\u2713"),
            React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: "var(--text)" } }, "Brak sygna\u0142\u00F3w"),
            React.createElement("div", { style: { fontSize: 14.5, marginTop: 3 } }, "Nie wykryto nieprawid\u0142owo\u015Bci. Za\u0142aduj dane pokazowe, by zobaczy\u0107 dzia\u0142anie."))) : (React.createElement(React.Fragment, null,
            red.length > 0 && (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { ...sectionTitle, marginTop: 22 } }, "\uD83D\uDD34 Pilne"),
                red.map(AlertCard))),
            amber.length > 0 && (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { ...sectionTitle, marginTop: 18 } }, "\uD83D\uDFE1 Do sprawdzenia"),
                amber.map(AlertCard)))))));
}
/* ─────────── #3 Social i auto-ceny (panel + generator AI) ─────────── */
function SocialAuto({ materials, company }) {
    const [autoOn, setAutoOn] = useState(() => { try {
        return localStorage.getItem("sk_social_auto") === "1";
    }
    catch (e) {
        return false;
    } });
    const [busy, setBusy] = useState(false);
    const [post, setPost] = useState("");
    const [copied, setCopied] = useState(false);
    const toggle = () => { const v = !autoOn; setAutoOn(v); try {
        localStorage.setItem("sk_social_auto", v ? "1" : "0");
    }
    catch (e) { } };
    const platformy = [["Facebook", "#1877f2"], ["Google Moja Firma", "#34a853"], ["Instagram", "#e1306c"]];
    const genPost = async () => {
        setBusy(true);
        setPost("");
        try {
            const ceny = (materials || []).filter((m) => m.buy > 0).slice(0, 8).map((m) => `${m.n} ${m.buy.toFixed(2)} zł/kg`).join(", ");
            const sys = "Jesteś specjalistą social media dla skupu złomu. Napisz krótki, angażujący post na Facebooka/Google ogłaszający aktualne ceny skupu i zachęcający do przyjazdu. Dodaj 3-4 trafne hashtagi. Konkretnie, po polsku, bez przesady.";
            const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 600, system: sys, messages: [{ role: "user", content: `Firma: ${(company && company.name) || "Skup złomu"}. Aktualne ceny: ${ceny}. Napisz post.` }] }) });
            const data = await res.json();
            setPost((data.content && data.content.map((b) => b.text || "").join("")) || "");
        }
        catch (e) {
            setPost("__ERR__");
        }
        finally {
            setBusy(false);
        }
    };
    const copy = () => { try {
        navigator.clipboard.writeText(post);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    }
    catch (e) { } };
    return (React.createElement("div", { style: { padding: "0 16px 40px" } },
        React.createElement("header", { style: { paddingTop: 26 } },
            React.createElement("h1", { style: { margin: 0, fontFamily: "var(--display)", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" } }, "Social i auto-ceny"),
            React.createElement("div", { style: { fontSize: 14.5, color: "var(--muted)", marginTop: 3 } }, "Publikuj ceny i promocje na Facebooku, Google i Instagramie.")),
        React.createElement("div", { style: { ...sectionTitle, marginTop: 22 } }, "Po\u0142\u0105czone konta"),
        platformy.map(([n, c]) => (React.createElement(Card, { key: n, pad: 14, style: { marginBottom: 10, display: "flex", alignItems: "center", gap: 12 } },
            React.createElement("div", { style: { width: 40, height: 40, borderRadius: 11, background: c + "22", display: "grid", placeItems: "center", color: c, fontWeight: 800, fontSize: 18 } }, n[0]),
            React.createElement("div", { style: { flex: 1 } },
                React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, n),
                React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)" } }, "Niepo\u0142\u0105czone")),
            React.createElement("button", { style: { ...btnGhost, width: "auto", padding: "8px 14px", fontSize: 14.5 }, onClick: () => alert("Łączenie kont wymaga konfiguracji API platformy — w przygotowaniu. Szczegóły w planie A-Z.") }, "Po\u0142\u0105cz")))),
        React.createElement("div", { style: { ...sectionTitle, marginTop: 18 } }, "Automatyzacja"),
        React.createElement(Card, { pad: 15, style: { display: "flex", alignItems: "center", gap: 12 } },
            React.createElement("div", { style: { flex: 1 } },
                React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, "Auto-publikacja cennika"),
                React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 } }, "Po zmianie cen automatycznie opublikuj aktualizacj\u0119 (po po\u0142\u0105czeniu konta).")),
            React.createElement("div", { onClick: toggle, style: { width: 48, height: 28, borderRadius: 99, background: autoOn ? "var(--copper)" : "var(--surface2)", border: "1px solid var(--line2)", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background .2s" } },
                React.createElement("div", { style: { width: 22, height: 22, borderRadius: 99, background: "#fff", position: "absolute", top: 2, left: autoOn ? 23 : 2, transition: "left .2s" } }))),
        React.createElement("div", { style: { ...sectionTitle, marginTop: 18 } }, "Generator posta (AI)"),
        React.createElement("button", { onClick: genPost, disabled: busy, style: { ...btnCopper, opacity: busy ? .7 : 1 } }, busy ? React.createElement(React.Fragment, null,
            React.createElement(RefreshCw, { size: 17, className: "spin" }),
            " Tworz\u0119\u2026") : React.createElement(React.Fragment, null,
            React.createElement(Sparkles, { size: 17 }),
            " Wygeneruj post z aktualnych cen")),
        post === "__ERR__" && React.createElement(Card, { style: { marginTop: 12, background: "rgba(224,161,63,.08)", border: "1px solid rgba(224,161,63,.3)" } },
            React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", lineHeight: 1.5 } }, "Generator AI wymaga serwera AI (Ustawienia \u2192 Serwer AI).")),
        post && post !== "__ERR__" && (React.createElement(Card, { style: { marginTop: 12 } },
            React.createElement("div", { style: { fontSize: 15, color: "var(--text)", lineHeight: 1.6, whiteSpace: "pre-wrap" } }, post),
            React.createElement("button", { onClick: copy, style: { ...btnGhost, marginTop: 12, color: copied ? "var(--green)" : "var(--text)", borderColor: copied ? "var(--green)" : "var(--line2)" } }, copied ? React.createElement(React.Fragment, null,
                React.createElement(Check, { size: 16 }),
                " Skopiowano") : React.createElement(React.Fragment, null,
                React.createElement(FileText, { size: 16 }),
                " Kopiuj post")))),
        React.createElement("div", { style: { fontSize: 13, color: "var(--faint)", marginTop: 12, lineHeight: 1.5, textAlign: "center" } }, "Na razie post generujesz i kopiujesz r\u0119cznie. Pe\u0142na automatyczna publikacja \u2014 patrz plan A-Z.")));
}
// Doradca AI korzysta z motywu aplikacji (jasny/ciemny), a nie z własnej ciemnej palety
const DOR_INK = "var(--bg)", DOR_PANEL = "var(--surface)", DOR_PANEL2 = "var(--surface2)", DOR_HAIR = "var(--line)", DOR_HAIR2 = "var(--line2)";
const DOR_STEEL = "var(--muted)", DOR_STEELD = "var(--faint)", DOR_PAPER = "var(--text)", DOR_BRASS = "#b5741f";
/* ─────────── Doradca: Analiza biznesu (z realnych danych, bez API) ─────────── */
function DorAnaliza({ tx, materials, akcent }) {
    const txx = tx || [];
    const mats = materials || [];
    const z = (n) => Math.round(n).toLocaleString("pl-PL") + " zł";
    const txVal = (t) => (t.pos || []).reduce((a, p) => a + p.w * p.price, 0);
    const total = txx.reduce((a, t) => a + txVal(t), 0);
    const now = new Date();
    const ym = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const sumM = (m) => txx.filter((t) => ym(new Date(t.ts)) === m).reduce((a, t) => a + txVal(t), 0);
    const cur = sumM(ym(now)), prv = sumM(ym(prev));
    const byMat = {};
    txx.forEach((t) => (t.pos || []).forEach((p) => { byMat[p.n] = byMat[p.n] || { val: 0, w: 0 }; byMat[p.n].val += p.w * p.price; byMat[p.n].w += p.w; }));
    const topMat = Object.entries(byMat).sort((a, b) => b[1].val - a[1].val).slice(0, 5);
    const cash = txx.filter((t) => t.payment === "gotowka").reduce((a, t) => a + txVal(t), 0);
    const cashPct = total > 0 ? Math.round(cash / total * 100) : 0;
    const stockVal = mats.reduce((a, m) => a + (m.stock || 0) * m.buy, 0);
    const topStock = mats.filter((m) => m.stock > 0).map((m) => ({ n: m.n, val: (m.stock || 0) * m.buy, kg: m.stock })).sort((a, b) => b.val - a.val);
    const bySup = {};
    txx.forEach((t) => { const name = t.firma ? t.firma.nazwa : (t.osoba ? `${t.osoba.imie} ${t.osoba.nazwisko}` : "—"); bySup[name] = (bySup[name] || 0) + txVal(t); });
    const topSup = Object.entries(bySup).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const recs = [];
    if (topMat[0] && total > 0)
        recs.push(`„${topMat[0][0]}" to Twój główny towar (${Math.round(topMat[0][1].val / total * 100)}% obrotu) — zadbaj o stałych dostawców tego materiału.`);
    if (cashPct > 65)
        recs.push(`${cashPct}% obrotu to gotówka — pilnuj dokumentacji i limitów płatności gotówkowych przy większych transakcjach.`);
    if (topStock[0] && stockVal > 0 && topStock[0].val > stockVal * 0.4)
        recs.push(`Dużo kapitału zamrożone w „${topStock[0].n}" (${z(topStock[0].val)}) — rozważ wywóz do huty, by uwolnić gotówkę.`);
    if (prv > 0 && cur > prv * 1.05)
        recs.push(`Bieżący miesiąc idzie lepiej niż poprzedni (+${Math.round((cur / prv - 1) * 100)}%) — utrzymaj tempo i zapasy.`);
    if (prv > 0 && cur < prv * 0.6 && now.getDate() > 15)
        recs.push(`Bieżący miesiąc słabszy od poprzedniego — sprawdź aktywność dostawców i ceny względem konkurencji.`);
    if (recs.length === 0)
        recs.push(`Dodaj transakcje lub załaduj dane pokazowe (Pulpit → „Załaduj dane pokazowe"), aby zobaczyć analizę swojego biznesu.`);
    const card = { background: DOR_PANEL, border: `1px solid ${DOR_HAIR}`, borderRadius: 14, padding: 15, marginBottom: 12 };
    const lab = { fontSize: 12, fontWeight: 700, color: DOR_STEELD, textTransform: "uppercase", letterSpacing: ".08em" };
    const Bar = ({ frac, color }) => (React.createElement("div", { style: { height: 7, borderRadius: 99, background: DOR_HAIR, overflow: "hidden", marginTop: 6 } },
        React.createElement("div", { style: { width: Math.max(3, frac * 100) + "%", height: "100%", background: color, borderRadius: 99 } })));
    const maxMat = topMat[0] ? topMat[0][1].val : 1;
    const maxSup = topSup[0] ? topSup[0][1] : 1;
    return (React.createElement("div", { className: "dorMin", style: { paddingBottom: 6 } },
        React.createElement("div", { style: card },
            React.createElement("div", { style: { ...lab, marginBottom: 12 } }, "Wydatki na skup"),
            React.createElement("div", { style: { display: "flex", gap: 12 } },
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("div", { style: { fontSize: 13, color: DOR_STEEL } }, "Bie\u017C\u0105cy miesi\u0105c"),
                    React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 21, color: DOR_PAPER, marginTop: 3 } }, z(cur))),
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("div", { style: { fontSize: 13, color: DOR_STEEL } }, "Poprzedni miesi\u0105c"),
                    React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 21, color: akcent, marginTop: 3 } }, z(prv))))),
        topMat.length > 0 && (React.createElement("div", { style: card },
            React.createElement("div", { style: { ...lab, marginBottom: 12 } }, "Co nap\u0119dza Tw\u00F3j biznes"),
            topMat.map(([n, d], i) => (React.createElement("div", { key: i, style: { marginBottom: i < topMat.length - 1 ? 12 : 0 } },
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 14.5, gap: 8 } },
                    React.createElement("span", { style: { color: DOR_PAPER, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, n),
                    React.createElement("span", { style: { fontFamily: "var(--mono)", color: DOR_STEEL, flexShrink: 0 } }, z(d.val))),
                React.createElement(Bar, { frac: d.val / maxMat, color: akcent })))))),
        React.createElement("div", { style: { display: "flex", gap: 12 } },
            React.createElement("div", { style: { ...card, flex: 1 } },
                React.createElement("div", { style: lab }, "Warto\u015B\u0107 magazynu"),
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 19, color: DOR_PAPER, marginTop: 8 } }, z(stockVal))),
            React.createElement("div", { style: { ...card, flex: 1 } },
                React.createElement("div", { style: lab }, "Got\u00F3wka w obrocie"),
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 19, color: DOR_PAPER, marginTop: 8 } },
                    cashPct,
                    "%"))),
        topSup.length > 0 && topSup[0][0] !== "—" && (React.createElement("div", { style: card },
            React.createElement("div", { style: { ...lab, marginBottom: 12 } }, "Najlepsi dostawcy"),
            topSup.map(([n, v], i) => (React.createElement("div", { key: i, style: { marginBottom: i < topSup.length - 1 ? 12 : 0 } },
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 14.5, gap: 8 } },
                    React.createElement("span", { style: { color: DOR_PAPER, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, n),
                    React.createElement("span", { style: { fontFamily: "var(--mono)", color: DOR_STEEL, flexShrink: 0 } }, z(v))),
                React.createElement(Bar, { frac: v / maxSup, color: DOR_BRASS })))))),
        React.createElement("div", { style: { ...card, background: `linear-gradient(145deg, ${akcent}14, ${DOR_PANEL})`, border: `1px solid ${akcent}40` } },
            React.createElement("div", { style: { ...lab, color: akcent, marginBottom: 11 } }, "Rekomendacje"),
            recs.map((r, i) => (React.createElement("div", { key: i, style: { display: "flex", gap: 9, marginBottom: i < recs.length - 1 ? 11 : 0 } },
                React.createElement("span", { style: { color: akcent, fontWeight: 800, flexShrink: 0 } }, "\u2192"),
                React.createElement("span", { style: { fontSize: 14.5, color: DOR_PAPER, lineHeight: 1.55 } }, r))))),
        React.createElement("div", { style: { textAlign: "center", fontSize: 12, color: DOR_STEELD, marginTop: 4 } }, "Analiza liczona na \u017Cywo z Twoich danych \u2014 dzia\u0142a bez po\u0142\u0105czenia.")));
}
function dorSpecjalisci() {
    return [
        { id: "analiza", glyf: "📊", ikona: "❖", rola: "Analiza biznesu", tagline: "Twoje liczby na żywo", akcent: "#d8a24a", powitanie: "", quick: [] },
        { id: "prezes", glyf: "👔", ikona: "★", rola: "Prezes (CEO)", tagline: "Strategia · wzrost · pełny obraz", akcent: "#d4a23c",
            powitanie: "Jestem Twoim prezesem. Patrzę na liczby Twojego skupu i mówię wprost, co zrobić, żeby zarabiał więcej — gdzie tracisz, gdzie rośniesz i co zrobić w pierwszej kolejności. Bez owijania w bawełnę.",
            quick: ["Co zrobić NAJPIERW, żeby zwiększyć zysk?", "Gdzie tracę pieniądze w tym skupie?", "Plan rozwoju skupu na najbliższy kwartał", "Jak podnieść marżę nie tracąc dostawców"] },
        { id: "mkt", glyf: "📈", ikona: "◆", rola: "Marketing i wzrost", tagline: "Strategia · kampanie · marka skupu", akcent: "#7c6ff0",
            powitanie: "Zbudujmy Ci przewagę na rynku. Zwiększę rozpoznawalność skupu i przyciągnę więcej dostawców — od kampanii lokalnych po markę, którą klienci zapamiętają.",
            quick: ["Plan marketingowy na najbliższy miesiąc", "Jak wykorzystać martwy sezon zimowy", "Tani sposób na lokalny rozgłos", "Jak zbudować markę mojego skupu"] },
        { id: "sales", glyf: "🎯", ikona: "▲", rola: "Pozyskiwanie klientów", tagline: "Nowi dostawcy · B2B · lojalność", akcent: "#d4814a",
            powitanie: "Zdobądźmy Ci dostawców i zatrzymajmy obecnych. Pokażę, jak wejść w B2B (warsztaty, firmy, demontaże), jak odbić klientów konkurencji i jak zbudować lojalność.",
            quick: ["Jak pozyskać klientów B2B (warsztaty, firmy)", "Jak odbić klientów konkurencji", "Program lojalnościowy dla stałych dostawców", "Skrypt pierwszej rozmowy z klientem"] },
        { id: "ksieg", glyf: "🧮", ikona: "●", rola: "Księgowość i podatki", tagline: "PCC · VAT · ZUS · koszty", akcent: "#2bb39a",
            powitanie: "Uporządkujmy Ci podatki i legalnie obniżmy obciążenia. Wyjaśnię PCC, VAT, ZUS i koszty uzyskania przychodu. Przy decyzjach wiążących zawsze potwierdź z księgowym.",
            quick: ["Jak legalnie obniżyć podatki", "PCC-4 — kiedy i jak rozliczać", "Czy opłaca mi się być VAT-owcem", "Jakie koszty mogę odliczyć (KUP)"] },
    ];
}
function dorKontekst(tx, materials, firma) {
    const txx = tx || [];
    const mats = materials || [];
    const fz = (n) => Math.round(n).toLocaleString("pl-PL");
    const txVal = (t) => (t.pos || []).reduce((a, p) => a + p.w * p.price, 0);
    const cenyLista = mats.filter((m) => m.buy > 0).slice(0, 12).map((m) => `${m.n} ${m.buy.toFixed(2)}`).join(", ");
    if (txx.length === 0) {
        return `CENNIK SKUPU (zł/kg): ${cenyLista || "brak"}.\nUWAGA: brak transakcji w systemie — doradzaj na podstawie cennika i ogólnej wiedzy o branży, zachęć do rozpoczęcia ewidencji.`;
    }
    const total = txx.reduce((a, t) => a + txVal(t), 0);
    const now = new Date();
    const ym = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const sumM = (m) => txx.filter((t) => ym(new Date(t.ts)) === m).reduce((a, t) => a + txVal(t), 0);
    const cur = sumM(ym(now)), prv = sumM(ym(prev));
    const trend = prv > 0 ? Math.round((cur / prv - 1) * 100) : null;
    const ds = txx.map((t) => t.ts).sort((a, b) => a - b);
    const dni = Math.max(1, Math.round((ds[ds.length - 1] - ds[0]) / 86400000));
    const naDzien = total / dni;
    const byMat = {};
    txx.forEach((t) => (t.pos || []).forEach((p) => { byMat[p.n] = byMat[p.n] || { val: 0, w: 0 }; byMat[p.n].val += p.w * p.price; byMat[p.n].w += p.w; }));
    const topMat = Object.entries(byMat).sort((a, b) => b[1].val - a[1].val).slice(0, 5);
    const matTxt = topMat.map(([n, d]) => `${n} ${fz(d.val)} zł (${Math.round(d.val / total * 100)}%)`).join(", ");
    const matByName = {};
    mats.forEach((m) => { matByName[m.n] = m; });
    let margSum = 0, margBase = 0;
    topMat.forEach(([n, d]) => { const m = matByName[n]; if (m && m.sell && m.buy) {
        margSum += (m.sell - m.buy) / m.sell * d.val;
        margBase += d.val;
    } });
    const margPct = margBase > 0 ? Math.round(margSum / margBase * 100) : null;
    const cash = txx.filter((t) => t.payment === "gotowka").reduce((a, t) => a + txVal(t), 0);
    const cashPct = total > 0 ? Math.round(cash / total * 100) : 0;
    const stockVal = mats.reduce((a, m) => a + (m.stock || 0) * m.buy, 0);
    const topStock = mats.filter((m) => m.stock > 0).map((m) => ({ n: m.n, val: (m.stock || 0) * m.buy })).sort((a, b) => b.val - a.val).slice(0, 3);
    const stockTxt = topStock.map((s) => `${s.n} ${fz(s.val)} zł`).join(", ");
    const bySup = {};
    txx.forEach((t) => { const name = t.firma ? t.firma.nazwa : (t.osoba ? `${t.osoba.imie} ${t.osoba.nazwisko}` : "—"); bySup[name] = (bySup[name] || 0) + txVal(t); });
    const sups = Object.entries(bySup).sort((a, b) => b[1] - a[1]);
    const topSupPct = sups[0] && total > 0 ? Math.round(sups[0][1] / total * 100) : 0;
    return [
        `KONTEKST BIZNESU — realne dane skupu „${firma}" (odnoś się do tych liczb wprost):`,
        `- Obrót łączny w systemie: ${fz(total)} zł z ${txx.length} transakcji, ok. ${fz(naDzien)} zł/dzień.`,
        `- Bieżący miesiąc: ${fz(cur)} zł. Poprzedni miesiąc: ${fz(prv)} zł.` + (trend !== null ? ` Trend m/m: ${trend >= 0 ? "+" : ""}${trend}%.` : ""),
        `- Główne materiały wg obrotu: ${matTxt}.`,
        margPct !== null ? `- Szacowana marża handlowa (z cennika): ~${margPct}%.` : "",
        `- Udział gotówki w obrocie: ${cashPct}%.`,
        `- Wartość magazynu: ${fz(stockVal)} zł; najwięcej kapitału zamrożone w: ${stockTxt || "—"}.`,
        `- Liczba dostawców: ${sups.length}; największy odpowiada za ${topSupPct}% obrotu.`,
        `- Cennik skupu (zł/kg): ${cenyLista}.`,
    ].filter(Boolean).join("\n");
}
function dorPrompt(id, firma, ceny, staty) {
    const wspolne = `Firma: ${firma}.\n${ceny}\n${staty}\nMów po polsku, konkretnie, jak doświadczony doradca do właściciela skupu. Możesz używać nagłówków (###), pogrubień (**tekst**) i list (-).`;
    if (id === "prezes")
        return `Jesteś ZAWODOWYM PREZESEM (CEO) tego skupu złomu — doświadczonym, wymagającym menedżerem, który traktuje ten biznes jak własny i bezwzględnie walczy o jego rozwój.
${wspolne}
Twoja postawa i zasady:
- Odnoś się do KONKRETNYCH LICZB z kontekstu powyżej (kwoty w zł, %, materiały, dostawcy, marża) — nigdy ogólnikowo, gdy masz dane.
- Bądź detaliczny i nie odpuszczaj — wychwytuj, GDZIE właściciel zostawia pieniądze na stole.
- Myśl zawsze o WZROŚCIE: większy obrót, wyższa marża, więcej dostawców, niższe koszty, mniejsze ryzyko.
- Dawaj PRIORYTETYZOWANY plan: co zrobić NAJPIERW, krok po kroku, z oczekiwanym efektem w zł lub %.
- Kwestionuj status quo, ale bądź praktyczny — realia polskiego skupu złomu (sezonowość, konkurencja, BDO, gotówka).
- Wytykaj słabe miejsca wprost: niska marża, uzależnienie od jednego dostawcy, dużo zamrożonej gotówki w magazynie, spadek obrotu — i mów, co z tym zrobić.
- Mów wprost, bez lania wody, jak prezes do właściciela. Możesz przycisnąć — zależy Ci na wyniku, nie na komplementach.`;
    if (id === "mkt")
        return `Jesteś dyrektorem marketingu z doświadczeniem w marketingu lokalnym dla skupów złomu w Polsce.\n${wspolne}\nEkspertyza: marketing lokalny offline i online (Facebook, OLX, Google Moja Firma), sezonowość (wiosna/jesień szczyt, zima spadek), budowanie marki, pozycjonowanie cenowe. Dawaj gotowe do wdrożenia plany z budżetami w zł i uzasadnieniem, dlaczego zadziała w branży złomowej.`;
    if (id === "sales")
        return `Jesteś szefem sprzedaży i ekspertem od pozyskiwania klientów dla skupów złomu w Polsce.\n${wspolne}\nEkspertyza: pozyskiwanie B2B (warsztaty, firmy budowlane, ekipy rozbiórkowe, hydraulicy, elektrycy), B2C, programy lojalnościowe, odbijanie klientów konkurencji, skrypty rozmów, retencja. Dawaj konkretne taktyki, gotowe skrypty i kwoty bonusów w zł z psychologią: dlaczego dostawca wybierze ten skup.`;
    return `Jesteś doświadczonym doradcą podatkowym specjalizującym się w rozliczeniach skupów złomu w Polsce.\n${wspolne}\nWiedza: PCC 2% od zakupu od osób fizycznych powyżej 1000 zł (poniżej zwolnione, płaci skup), PCC-4 zbiorcza (min. 3 czynności, 3. w ciągu 14 dni od 1., termin do 7. dnia następnego miesiąca, zapłacony PCC to koszt), VAT i odwrotne obciążenie dla złomu, ZUS (ulga na start, mały ZUS), KUP (paliwo, transport, sprzęt, samochód N1, amortyzacja), legalna optymalizacja. ZAWSZE zaznacz, że to informacja ogólna, a decyzje wiążące warto potwierdzić z licencjonowanym księgowym. Nie podawaj porad jako pewników — tłumacz zasady i opcje.`;
}
function DorAvatar({ akcent, glyf }) {
    return React.createElement("div", { style: { width: 30, height: 30, borderRadius: 9, background: `linear-gradient(145deg, ${akcent}, ${akcent}88)`, display: "grid", placeItems: "center", fontSize: 15, flexShrink: 0, boxShadow: "inset 0 1px 0 rgba(255,255,255,.2)" } }, glyf);
}
function dorStripMd(t) { return t.replace(/^#{1,6}\s+/gm, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/^[-•]\s+/gm, "• "); }
function DorRich({ text, akcent, plain }) {
    if (plain)
        return React.createElement("div", { style: { whiteSpace: "pre-wrap" } }, text);
    const linie = text.split("\n");
    const bloki = [];
    let lista = [];
    const flush = () => { if (lista.length) {
        bloki.push({ t: "ul", items: lista });
        lista = [];
    } };
    linie.forEach((ln) => {
        const h = ln.match(/^(#{1,6})\s+(.*)$/);
        const li = ln.match(/^[-•]\s+(.*)$/);
        const oli = ln.match(/^(\d+)\.\s+(.*)$/);
        if (h) {
            flush();
            bloki.push({ t: "h", txt: h[2] });
        }
        else if (li) {
            lista.push(li[1]);
        }
        else if (oli) {
            flush();
            bloki.push({ t: "oli", n: oli[1], txt: oli[2] });
        }
        else if (ln.trim() === "") {
            flush();
            bloki.push({ t: "sp" });
        }
        else {
            flush();
            bloki.push({ t: "p", txt: ln });
        }
    });
    flush();
    const inline = (s, k) => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => p.startsWith("**") && p.endsWith("**")
        ? React.createElement("b", { key: k + "-" + i, style: { fontWeight: 700, color: "#fff" } }, p.slice(2, -2)) : React.createElement("span", { key: k + "-" + i }, p));
    return React.createElement("div", null, bloki.map((b, i) => {
        if (b.t === "h")
            return React.createElement("div", { key: i, style: { fontFamily: "var(--display)", fontWeight: 800, fontSize: 15.5, color: akcent, margin: i === 0 ? "0 0 7px" : "13px 0 7px" } }, b.txt);
        if (b.t === "p")
            return React.createElement("div", { key: i, style: { margin: "0 0 7px" } }, inline(b.txt, i));
        if (b.t === "oli")
            return React.createElement("div", { key: i, style: { display: "flex", gap: 9, margin: "0 0 6px" } },
                React.createElement("span", { style: { color: akcent, fontWeight: 700, flexShrink: 0 } },
                    b.n,
                    "."),
                React.createElement("span", null, inline(b.txt, i)));
        if (b.t === "ul")
            return React.createElement("div", { key: i, style: { margin: "2px 0 8px", display: "flex", flexDirection: "column", gap: 6 } }, b.items.map((it, j) => React.createElement("div", { key: j, style: { display: "flex", gap: 9 } },
                React.createElement("span", { style: { color: akcent, flexShrink: 0, marginTop: 1 } }, "\u25AA"),
                React.createElement("span", null, inline(it, i + "-" + j)))));
        if (b.t === "sp")
            return React.createElement("div", { key: i, style: { height: 4 } });
        return null;
    }));
}
function DoradcaBiznesowy({ materials, company, tx }) {
    const SPECJALISCI = dorSpecjalisci();
    const [aktywny, setAktywny] = useState("analiza");
    const [watki, setWatki] = useState({ analiza: [], prezes: [], mkt: [], sales: [], ksieg: [] });
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const [stream, setStream] = useState("");
    const [followups, setFollowups] = useState({ analiza: [], prezes: [], mkt: [], sales: [], ksieg: [] });
    const scrollRef = useRef(null);
    const taRef = useRef(null);
    const spec = SPECJALISCI.find(s => s.id === aktywny);
    const akcent = spec.akcent;
    const msgs = watki[aktywny];
    const firma = (company && company.nazwa) || "SkupOS";
    const inicjal = (firma.trim()[0] || "Z").toUpperCase();
    useEffect(() => {
        const l = document.createElement("link");
        l.rel = "stylesheet";
        l.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap";
        document.head.appendChild(l);
        return () => { try {
            document.head.removeChild(l);
        }
        catch (e) { } };
    }, []);
    const DISP = "var(--display)";
    const scrollDown = () => setTimeout(() => { if (scrollRef.current)
        scrollRef.current.scrollTo({ top: 9e6, behavior: "smooth" }); }, 40);
    const typeOut = (full, done) => {
        let i = 0;
        setStream("");
        const tick = setInterval(() => { i += 4; setStream(full.slice(0, i)); scrollDown(); if (i >= full.length) {
            clearInterval(tick);
            setStream("");
            done(full);
        } }, 11);
    };
    const kontekstTxt = dorKontekst(tx, materials, firma);
    const propozycje = (id) => ({
        mkt: ["Rozpisz to na konkretne dni", "Jaki budżet przeznaczyć?", "Pokaż przykładowy post"],
        sales: ["Napisz gotowy skrypt rozmowy", "Ile bonusu, by się opłacało?", "Jak znaleźć takie firmy?"],
        ksieg: ["Pokaż to na liczbach", "Jakie są terminy?", "O co dopytać księgowego?"],
    }[id] || []);
    const wyslij = async (text) => {
        if (!text.trim() || busy)
            return;
        const id = aktywny;
        const hist = [...watki[id], { role: "user", content: text, ts: Date.now() }];
        setWatki(w => ({ ...w, [id]: hist }));
        setInput("");
        setFollowups(f => ({ ...f, [id]: [] }));
        setBusy(true);
        if (taRef.current)
            taRef.current.style.height = "auto";
        try {
            const res = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1400, system: dorPrompt(id, firma, kontekstTxt, ""), messages: hist.map(m => ({ role: m.role, content: m.content })) }),
            });
            const data = await res.json();
            const reply = (data.content && data.content.map(b => b.text || "").join("")) || "Chwilowo nie mogę odpowiedzieć — spróbuj ponownie.";
            setBusy(false);
            typeOut(reply, (full) => { setWatki(w => ({ ...w, [id]: [...w[id], { role: "assistant", content: full, ts: Date.now() }] })); setFollowups(f => ({ ...f, [id]: propozycje(id) })); scrollDown(); });
        }
        catch (e) {
            setBusy(false);
            setWatki(w => ({ ...w, [id]: [...w[id], { role: "assistant", content: "Rozmowa z doradcą wymaga połączenia z serwerem AI (wersja z backendem). Zakładka Analiza biznesu (pierwsza) działa zawsze — bez połączenia.", ts: Date.now() }] }));
        }
        scrollDown();
    };
    const czas = (ts) => new Date(ts).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
    const autosize = (e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(120, e.target.scrollHeight) + "px"; };
    return (React.createElement("div", { style: { background: DOR_INK, borderRadius: 18, overflow: "hidden", border: `1px solid ${DOR_HAIR}`, marginTop: 4 } },
        React.createElement("style", null, `
        @keyframes dorMsgIn { from { opacity:0; transform: translateY(10px);} to {opacity:1; transform:none;} }
        @keyframes dorDot { 0%,60%,100%{ transform: translateY(0); opacity:.35 } 30%{ transform: translateY(-5px); opacity:1 } }
        @keyframes dorCaret { 0%,100%{opacity:1} 50%{opacity:0} }
        .dorMin { animation: dorMsgIn .3s cubic-bezier(.2,.7,.3,1); }
        .dorAx { transition: background-color .4s, border-color .4s, color .4s; }
      `),
        React.createElement("div", { style: { background: DOR_INK, borderBottom: `1px solid ${DOR_HAIR}` } },
            React.createElement("div", { style: { height: 3, background: `linear-gradient(90deg, ${DOR_BRASS}00, ${DOR_BRASS}, ${DOR_BRASS}88, ${DOR_BRASS})` } }),
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "13px 14px 12px" } },
                React.createElement("div", { style: { width: 40, height: 40, borderRadius: 11, background: `linear-gradient(145deg, ${DOR_BRASS}, ${DOR_BRASS}aa 55%, ${DOR_BRASS}66)`, display: "grid", placeItems: "center", fontFamily: DISP, fontWeight: 700, fontSize: 19, color: "#1a1407", flexShrink: 0, boxShadow: `0 4px 14px ${DOR_BRASS}30, inset 0 1px 0 rgba(255,255,255,.4)` } }, inicjal),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
                        React.createElement("span", { style: { fontFamily: DISP, fontWeight: 600, fontSize: 18, color: DOR_PAPER } }, "Doradca"),
                        React.createElement("span", { style: { fontSize: 11, fontWeight: 700, letterSpacing: ".09em", color: DOR_BRASS, border: `1px solid ${DOR_BRASS}55`, padding: "2px 6px", borderRadius: 5 } }, "AI")),
                    React.createElement("div", { style: { fontSize: 13, color: DOR_STEEL, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } },
                        firma,
                        " \u00B7 panel w\u0142a\u015Bciciela"))),
            React.createElement("div", { style: { display: "flex", gap: 7, padding: "0 12px 12px", overflowX: "auto" } }, SPECJALISCI.map(s => {
                const on = s.id === aktywny;
                return React.createElement("button", { key: s.id, onClick: () => { setAktywny(s.id); setStream(""); scrollDown(); }, className: "dorAx", style: { flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "9px 13px", borderRadius: 12, cursor: "pointer", border: on ? `1.5px solid ${s.akcent}` : `1px solid ${DOR_HAIR2}`, background: on ? `${s.akcent}1a` : DOR_PANEL, color: on ? s.akcent : DOR_STEEL } },
                    React.createElement("span", { style: { fontSize: 15 } }, s.glyf),
                    React.createElement("span", { style: { fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" } }, s.rola));
            }))),
        React.createElement("div", { ref: scrollRef, style: { height: aktywny === "analiza" ? "auto" : "calc(100dvh - 330px)", minHeight: 360, overflowY: aktywny === "analiza" ? "visible" : "auto", padding: "18px 14px 8px", display: "flex", flexDirection: "column", gap: 15 } }, aktywny === "analiza" ? React.createElement(DorAnaliza, { tx: tx, materials: materials, akcent: akcent }) : (React.createElement(React.Fragment, null,
            msgs.length === 0 && !busy && !stream && (React.createElement("div", { className: "dorMin", key: aktywny },
                React.createElement("div", { style: { padding: "4px 2px 18px", borderBottom: `1px solid ${DOR_HAIR}`, marginBottom: 16 } },
                    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 } },
                        React.createElement("div", { className: "dorAx", style: { width: 48, height: 48, borderRadius: 13, background: `linear-gradient(145deg, ${akcent}, ${akcent}88)`, display: "grid", placeItems: "center", fontSize: 23, flexShrink: 0, boxShadow: `0 6px 18px ${akcent}35` } }, spec.glyf),
                        React.createElement("div", null,
                            React.createElement("div", { style: { fontFamily: DISP, fontWeight: 600, fontSize: 18, color: DOR_PAPER } }, spec.rola),
                            React.createElement("div", { className: "dorAx", style: { fontSize: 13.5, color: akcent, fontWeight: 600, marginTop: 2 } }, spec.tagline))),
                    React.createElement("div", { style: { fontSize: 14.5, color: DOR_STEEL, lineHeight: 1.6 } }, spec.powitanie)),
                React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: DOR_STEELD, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 } }, "Od czego zacz\u0105\u0107"),
                React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 9 } }, spec.quick.map((q, i) => (React.createElement("button", { key: i, onClick: () => wyslij(q), className: "dorAx", style: { textAlign: "left", padding: "13px 14px", borderRadius: 13, border: `1px solid ${DOR_HAIR2}`, background: DOR_PANEL, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, color: DOR_PAPER, fontSize: 14.5, fontWeight: 500 } },
                    React.createElement("span", { className: "dorAx", style: { width: 26, height: 26, borderRadius: 8, background: `${akcent}1e`, color: akcent, display: "grid", placeItems: "center", fontSize: 13.5, flexShrink: 0 } }, spec.ikona),
                    q,
                    React.createElement("span", { style: { marginLeft: "auto", color: DOR_STEELD, fontSize: 16 } }, "\u2192"))))))),
            msgs.map((m, i) => {
                const user = m.role === "user";
                return (React.createElement("div", { key: i, className: "dorMin", style: { display: "flex", gap: 11, flexDirection: user ? "row-reverse" : "row", alignItems: "flex-end" } },
                    !user && React.createElement(DorAvatar, { akcent: akcent, glyf: spec.glyf }),
                    React.createElement("div", { style: { maxWidth: user ? "82%" : "85%", display: "flex", flexDirection: "column", alignItems: user ? "flex-end" : "flex-start", gap: 4 } },
                        React.createElement("div", { style: { padding: user ? "12px 15px" : "13px 16px", fontSize: 14, lineHeight: 1.6, borderRadius: user ? "16px 16px 5px 16px" : "16px 16px 16px 5px", background: user ? `linear-gradient(145deg, ${akcent}, ${akcent}d8)` : DOR_PANEL, color: user ? "#fff" : DOR_PAPER, border: user ? "none" : `1px solid ${DOR_HAIR}`, whiteSpace: user ? "pre-wrap" : "normal" } }, user ? m.content : React.createElement(DorRich, { text: m.content, akcent: akcent })),
                        React.createElement("span", { style: { fontSize: 11.5, color: DOR_STEELD, fontFamily: "var(--mono)", padding: "0 4px" } }, czas(m.ts)))));
            }),
            busy && (React.createElement("div", { className: "dorMin", style: { display: "flex", gap: 11, alignItems: "flex-end" } },
                React.createElement(DorAvatar, { akcent: akcent, glyf: spec.glyf }),
                React.createElement("div", { style: { background: DOR_PANEL, border: `1px solid ${DOR_HAIR}`, borderRadius: "16px 16px 16px 5px", padding: "14px 16px", display: "flex", gap: 5 } }, [0, 1, 2].map(d => React.createElement("span", { key: d, style: { width: 7, height: 7, borderRadius: 99, background: akcent, animation: `dorDot 1.2s ${d * 0.15}s infinite ease-in-out` } }))))),
            stream && (React.createElement("div", { style: { display: "flex", gap: 11, alignItems: "flex-end" } },
                React.createElement(DorAvatar, { akcent: akcent, glyf: spec.glyf }),
                React.createElement("div", { style: { maxWidth: "85%", background: DOR_PANEL, border: `1px solid ${DOR_HAIR}`, borderRadius: "16px 16px 16px 5px", padding: "13px 16px", fontSize: 14, lineHeight: 1.6, color: DOR_PAPER } },
                    React.createElement(DorRich, { text: dorStripMd(stream), akcent: akcent, plain: true }),
                    React.createElement("span", { style: { display: "inline-block", width: 7, height: 15, background: akcent, marginLeft: 2, verticalAlign: "text-bottom", animation: "dorCaret 1s steps(1) infinite", borderRadius: 1 } })))),
            (followups[aktywny] || []).length > 0 && !busy && !stream && (React.createElement("div", { className: "dorMin", style: { display: "flex", flexWrap: "wrap", gap: 8, paddingLeft: 42 } }, followups[aktywny].map((f, i) => React.createElement("button", { key: i, onClick: () => wyslij(f), className: "dorAx", style: { padding: "8px 13px", borderRadius: 99, fontSize: 14, fontWeight: 500, cursor: "pointer", border: `1px solid ${akcent}44`, background: `${akcent}12`, color: akcent } }, f))))))),
        aktywny !== "analiza" && React.createElement("div", { style: { background: DOR_INK, borderTop: `1px solid ${DOR_HAIR}`, padding: "12px 14px" } },
            React.createElement("div", { className: "dorAx", style: { display: "flex", gap: 10, alignItems: "flex-end", background: DOR_PANEL, border: `1px solid ${DOR_HAIR2}`, borderRadius: 16, padding: "8px 8px 8px 16px" } },
                React.createElement("textarea", { ref: taRef, rows: 1, value: input, onChange: e => { setInput(e.target.value); autosize(e); }, onKeyDown: e => { if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        wyslij(input);
                    } }, placeholder: `Zapytaj: ${spec.rola.toLowerCase()}…`, style: { flex: 1, background: "transparent", border: "none", color: DOR_PAPER, fontSize: 14.5, fontFamily: "system-ui", resize: "none", lineHeight: 1.5, padding: "9px 0", maxHeight: 120, outline: "none" } }),
                React.createElement("button", { onClick: () => wyslij(input), disabled: busy || !input.trim(), className: "dorAx", style: { width: 42, height: 42, borderRadius: 12, border: "none", background: input.trim() && !busy ? `linear-gradient(145deg, ${akcent}, ${akcent}cc)` : DOR_PANEL2, color: input.trim() && !busy ? "#fff" : DOR_STEELD, cursor: input.trim() && !busy ? "pointer" : "default", fontSize: 19, display: "grid", placeItems: "center", flexShrink: 0 } }, "\u2191")),
            React.createElement("div", { style: { textAlign: "center", fontSize: 12, color: DOR_STEELD, marginTop: 9 } },
                "Doradca AI \u00B7 ",
                aktywny === "ksieg" ? "informacje ogólne — decyzje potwierdź z księgowym" : "porady strategiczne dla Twojego skupu"))));
}
/* ─────────── Marketing ─────────── */
function Marketing({ requests, materials, campaigns, setCampaigns, tx, company }) {
    const [open, setOpen] = useState(false);
    const [edit, setEdit] = useState(null);
    const [activeTab, setActiveTab] = useState("posty");
    const [copied, setCopied] = useState(null);
    const list = (campaigns || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    const reqWeek = (requests || []).filter((r) => r.ts > Date.now() - 7 * 86400000).length;
    const STATUS = { plan: { label: "Planowana", c: "var(--muted)", bg: "rgba(43,52,64,.08)" }, active: { label: "Aktywna", c: "var(--green)", bg: "rgba(21,163,74,.12)" }, done: { label: "Zakończona", c: "var(--faint)", bg: "var(--surface2)" } };
    const copyText = (txt, key) => { try {
        navigator.clipboard.writeText(txt);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    }
    catch { } };
    // ── Generatory postów ──
    const postCennik = () => {
        const d = new Date().toLocaleDateString("pl-PL");
        let t = `🏭 ${company?.name || "SKUP ZŁOMU"} — AKTUALNE CENY\n📅 ${d}\n${"─".repeat(30)}\n`;
        Object.keys(C).forEach((g) => {
            const items = materials.filter((m) => m.g === g && m.buy > 0);
            if (!items.length)
                return;
            t += `\n🔩 ${C[g].label.toUpperCase()}:\n`;
            items.forEach((m) => { t += `  ✅ ${m.n.padEnd(18)} ${m.buy.toFixed(2)} zł/kg\n`; });
        });
        t += `\n${"─".repeat(30)}\n📍 ${company?.addr || "Adres punktu"}\n📞 ${company?.phone || "Numer telefonu"}\n💬 Wycena bezpłatna — przyjedź lub zadzwoń!`;
        return t;
    };
    const postPromocja = (mat, bonus) => {
        const m = materials.find(x => x.id === mat);
        if (!m)
            return "";
        return `📈 WZROST CEN — ${m.n.toUpperCase()}\n\nW tym tygodniu skupujemy ${m.n} za:\n\n💰 ${(m.buy + (parseFloat(bonus) || 0)).toFixed(2)} zł/kg\n(normalnie: ${m.buy.toFixed(2)} zł/kg)\n\n⏰ Tylko do ${new Date(Date.now() + 7 * 86400000).toLocaleDateString("pl-PL")}\n📞 Zadzwoń i przyjedź: ${company?.phone || "XXX XXX XXX"}\n📍 ${company?.addr || "Adres"}`;
    };
    const postNoweCeny = () => {
        const d = new Date().toLocaleDateString("pl-PL");
        return `📢 AKTUALIZACJA CENNIKA — ${d}\n\nSzanowni Klienci,\ninformujemy o aktualizacji cen skupu.\n\nZapraszamy do kontaktu — płacimy uczciwie i na miejscu!\n\n🏭 ${company?.name || "SKUP ZŁOMU"}\n📞 ${company?.phone || ""}\n📍 ${company?.addr || ""}\n\n#skupzlomu #metalekolorowe #zlom`;
    };
    const postReferral = () => `👥 POLECAJ ZNAJOMYCH — PREMIA DLA CIEBIE!\n\nMasz znajomego, który ma złom do oddania?\nPoleć mu nasz skup, a gdy przyjedzie i sprzeda u nas złom —\notrzymasz ${parseFloat(refBonus) || 0} zł premii za każdego nowego dostawcę!\n\n🤝 Wystarczy, że poda Twoje imię przy przyjeździe\n📞 ${company?.phone || "XXX XXX XXX"}\n📍 ${company?.addr || "Adres skupu"}\n\n${company?.name || "SKUP ZŁOMU"}`;
    const POSTS = [
        { id: "cennik", label: "📋 Pełny cennik", desc: "Do wklejenia na FB / Instagram / OLX", gen: postCennik },
        { id: "noweceny", label: "📢 Aktualizacja cen", desc: "Krótki post informacyjny", gen: postNoweCeny },
        { id: "referral", label: "👥 Program poleceń", desc: "Przyciągnij nowych klientów przez aktualnych", gen: postReferral },
    ];
    const [promoMat, setPromoMat] = useState(materials[0]?.id || "");
    const [promoBonus, setPromoBonus] = useState("0.20");
    const [refBonus, setRefBonus] = useState("50");
    // ── KPIs z transakcji ──
    const txMonth = (tx || []).filter(x => x.ts > Date.now() - 30 * 86400000);
    const uniqueClients = new Set(txMonth.map(x => x.sellerName || x.sellerId)).size;
    const avgTx = txMonth.length ? txMonth.reduce((a, x) => a + txTotal(x), 0) / txMonth.length : 0;
    const TABS = [["posty", "📝 Posty"], ["promocje", "📈 Wzrost cen"], ["powiadom", "🔔 Powiadom"], ["kampanie", "📊 Kampanie"], ["sms", "💬 SMS"]];
    return (React.createElement("div", { style: { padding: "0 16px" } },
        React.createElement("header", { style: { paddingTop: 24 } },
            React.createElement("h1", { style: { margin: 0, fontFamily: "var(--display)", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" } }, "Marketing"),
            React.createElement("div", { style: { color: "var(--muted)", fontSize: 14.5, marginTop: 2 } }, "Promocja, posty, kampanie")),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, marginTop: 16 } }, [["Zgłoszenia (7d)", reqWeek, TrendingUp, "var(--green)"], ["Klientów (30d)", uniqueClients, Users, "var(--copper)"], ["Śr. transakcja", pln(avgTx), Coins, "var(--amber)"]].map(([l, v, Ic, col]) => (React.createElement(Card, { key: l, pad: 13 },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: 12.5 } },
                React.createElement(Ic, { size: 13, color: col }),
                l),
            React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 18, marginTop: 5 } }, v))))),
        React.createElement("div", { style: { display: "flex", gap: 5, marginTop: 16, overflowX: "auto", paddingBottom: 2 } }, TABS.map(([id, lbl]) => React.createElement("button", { key: id, onClick: () => setActiveTab(id), style: { flexShrink: 0, padding: "8px 13px", borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: "pointer", border: activeTab === id ? "1.5px solid var(--copper)" : "1px solid var(--line2)", background: activeTab === id ? "rgba(200,116,63,.1)" : "var(--surface)", color: activeTab === id ? "var(--copper)" : "var(--muted)" } }, lbl))),
        activeTab === "posty" && (React.createElement("div", { style: { marginTop: 14 } }, POSTS.map(({ id, label, desc, gen }) => {
            const txt = gen();
            return (React.createElement(Card, { key: id, style: { marginBottom: 10 } },
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
                    React.createElement("div", null,
                        React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, label),
                        React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)" } }, desc)),
                    React.createElement("div", { style: { display: "flex", gap: 7 } },
                        React.createElement("button", { onClick: () => copyText(txt, id), style: { padding: "7px 11px", borderRadius: 9, fontSize: 13.5, fontWeight: 700, cursor: "pointer", border: copied === id ? "1.5px solid var(--green)" : "1px solid var(--line2)", background: copied === id ? "rgba(21,163,74,.12)" : "var(--surface2)", color: copied === id ? "var(--green)" : "var(--muted)" } }, copied === id ? "✓ Skopiowano" : "Kopiuj"),
                        React.createElement("button", { onClick: () => downloadText(id + ".txt", txt), style: { padding: "7px 11px", borderRadius: 9, fontSize: 13.5, fontWeight: 700, cursor: "pointer", border: "1px solid var(--line2)", background: "var(--surface2)", color: "var(--muted)" } }, "\u2193 .txt"))),
                id === "referral" && (React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 9, marginBottom: 10, padding: "9px 11px", background: "var(--surface2)", borderRadius: 9 } },
                    React.createElement("span", { style: { fontSize: 14, color: "var(--muted)", fontWeight: 600 } }, "Premia za polecenie:"),
                    React.createElement("input", { type: "number", inputMode: "decimal", value: refBonus, onChange: (e) => setRefBonus(e.target.value), placeholder: "0", style: { width: 74, padding: "7px 9px", borderRadius: 8, border: "1px solid var(--line2)", background: "var(--surface)", color: "var(--copper)", fontSize: 14, fontFamily: "var(--mono)", fontWeight: 700, outline: "none", textAlign: "right" } }),
                    React.createElement("span", { style: { fontSize: 14.5, color: "var(--muted)", fontWeight: 600 } }, "z\u0142"))),
                React.createElement("pre", { style: { fontSize: 13, lineHeight: 1.5, color: "var(--text)", background: "var(--surface2)", padding: "10px 12px", borderRadius: 9, overflowX: "auto", whiteSpace: "pre-wrap", margin: 0, fontFamily: "var(--mono)" } }, txt)));
        }))),
        activeTab === "promocje" && (React.createElement("div", { style: { marginTop: 14 } },
            React.createElement(Card, null,
                React.createElement("div", { style: { fontWeight: 700, fontSize: 14, marginBottom: 12 } }, "\uD83D\uDCC8 Generator og\u0142osze\u0144 o wzro\u015Bcie cen"),
                React.createElement("label", { style: label }, "Materia\u0142"),
                React.createElement("select", { value: promoMat, onChange: e => setPromoMat(e.target.value), style: { ...inputStyle, fontWeight: 700 } }, materials.map(m => React.createElement("option", { key: m.id, value: m.id },
                    m.n,
                    " \u2014 ",
                    m.buy.toFixed(2),
                    " z\u0142/kg"))),
                React.createElement("label", { style: label }, "Bonus ponad cen\u0119 (z\u0142/kg)"),
                React.createElement("input", { type: "number", step: "0.05", value: promoBonus, onChange: e => setPromoBonus(e.target.value), style: { ...inputStyle, fontFamily: "var(--mono)", fontWeight: 700, fontSize: 18 } }),
                React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
                    React.createElement("button", { onClick: () => copyText(postPromocja(promoMat, promoBonus), "promo"), style: { ...btnCopper, flex: 1 } }, copied === "promo" ? "✓ Skopiowano!" : "📋 Kopiuj post"),
                    React.createElement("button", { onClick: () => downloadText("wzrost-cen.txt", postPromocja(promoMat, promoBonus)), style: { ...btnGhost, width: 44 } }, "\u2193"))),
            promoMat && React.createElement("pre", { style: { fontSize: 13, lineHeight: 1.55, color: "var(--text)", background: "var(--surface2)", padding: "12px 14px", borderRadius: 12, overflowX: "auto", whiteSpace: "pre-wrap", marginTop: 10, fontFamily: "var(--mono)" } }, postPromocja(promoMat, promoBonus)),
            React.createElement(Card, { style: { marginTop: 14, background: "rgba(200,116,63,.06)", border: "1px solid rgba(200,116,63,.2)" } },
                React.createElement("div", { style: { fontWeight: 700, fontSize: 14.5, marginBottom: 8 } }, "\uD83D\uDCC5 Kiedy og\u0142asza\u0107 wzrost cen?"),
                [["Poniedziałek", "Wzrost cen metali w weekend → pokaż aktualny cennik"], ["Piątek", "Wpłata wypłat w firmach → klienci mają gotówkę i czas"], ["Przed świętami", "Sprzątanie garaży/warsztatów — duże ilości złomu"], ["Wiosna/jesień", "Porządki — idealny czas na kampanię door-to-door"], ["Po deszczu", "Złomiarz wie: mokry złom = klienci spieszą się sprzedać"],].map(([k, v]) => (React.createElement("div", { key: k, style: { display: "flex", gap: 10, padding: "8px 0", borderTop: "1px solid var(--line)" } },
                    React.createElement("span", { style: { fontWeight: 700, fontSize: 13.5, color: "var(--copper)", minWidth: 80 } }, k),
                    React.createElement("span", { style: { fontSize: 14, color: "var(--muted)", lineHeight: 1.45 } }, v))))))),
        activeTab === "kampanie" && (React.createElement("div", { style: { marginTop: 14 } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } },
                React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, "Kampanie i dzia\u0142ania"),
                React.createElement("button", { onClick: () => { setEdit({ id: null, name: "", date: todayStr(), status: "plan", channel: "facebook", budget: "", roi: "", note: "" }); setOpen(true); }, style: { ...btnCopper, width: "auto", padding: "9px 14px", fontSize: 14.5 } }, "+ Dodaj")),
            list.length === 0 ? React.createElement(Card, null,
                React.createElement("div", { style: { color: "var(--muted)", fontSize: 15, textAlign: "center", padding: "10px 0" } }, "Brak kampanii. Dodaj pierwsz\u0105 \u2191")) :
                list.map((c) => {
                    const s = STATUS[c.status] || STATUS.plan;
                    return (React.createElement(Card, { key: c.id, pad: 13, style: { marginBottom: 9, cursor: "pointer" }, onClick: () => { setEdit(c); setOpen(true); } },
                        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" } },
                            React.createElement("div", null,
                                React.createElement("div", { style: { fontSize: 14, fontWeight: 700 } }, c.name),
                                React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 2 } },
                                    c.channel,
                                    " \u00B7 ",
                                    c.date,
                                    c.budget ? ` · budżet: ${c.budget} zł` : ""),
                                c.roi && React.createElement("div", { style: { fontSize: 13.5, color: "var(--green)", marginTop: 2 } },
                                    "ROI: ",
                                    c.roi,
                                    "%")),
                            React.createElement("span", { style: { fontSize: 12, fontWeight: 800, padding: "4px 9px", borderRadius: 99, background: s.bg, color: s.c, whiteSpace: "nowrap" } }, s.label))));
                }))),
        activeTab === "sms" && (React.createElement("div", { style: { marginTop: 14 } },
            [
                { t: "📢 Aktualizacja cen", txt: `Hej! W ${company?.name || "skupie"} mamy nowe ceny od ${new Date().toLocaleDateString("pl-PL")}. Przyjedź dziś — płacimy gotówką na miejscu! ${company?.phone || ""}` },
                { t: "🔥 Promocja tygodnia", txt: `OKAZJA! W tym tygodniu skupujemy MIEDŹ za wyższą cenę. Ograniczona oferta! Zadzwoń: ${company?.phone || "XXX XXX XXX"}` },
                { t: "👥 Program poleceń", txt: `Polecaj nasz skup i zarabiaj! Za każdego poleconego klienta — BONUS dla Ciebie. Szczegóły: ${company?.phone || ""}` },
                { t: "📅 Zaproszenie do skupu", txt: `Sprzątasz garaż/warsztat? Skupujemy złom i metale! Odbiór na terenie: ${company?.area || "Twojej okolicy"}. Tel: ${company?.phone || ""}` },
            ].map((x, i) => (React.createElement(Card, { key: i, style: { marginBottom: 10 } },
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 15 } }, x.t),
                    React.createElement("button", { onClick: () => copyText(x.txt, "sms" + i), style: { padding: "6px 11px", borderRadius: 9, fontSize: 13.5, fontWeight: 700, cursor: "pointer", border: copied === "sms" + i ? "1.5px solid var(--green)" : "1px solid var(--line2)", background: copied === "sms" + i ? "rgba(21,163,74,.12)" : "var(--surface2)", color: copied === "sms" + i ? "var(--green)" : "var(--muted)" } }, copied === "sms" + i ? "✓" : "Kopiuj")),
                React.createElement("div", { style: { fontSize: 14.5, color: "var(--muted)", lineHeight: 1.55, background: "var(--surface2)", padding: "10px 12px", borderRadius: 9 } }, x.txt)))),
            React.createElement(Card, { style: { background: "rgba(200,116,63,.06)", border: "1px solid rgba(200,116,63,.2)", marginTop: 6 } },
                React.createElement("div", { style: { fontWeight: 700, fontSize: 14.5, marginBottom: 6 } }, "\uD83D\uDCCD Kana\u0142y promocji \u2014 od najta\u0144szego"),
                [["1", "Facebook Marketplace", "Bezpłatny, zasięg lokalny. Post z cennikiem + zdjęcia materiałów."], ["2", "OLX Ogłoszenia", "Darmowe i płatne. Ogłoszenie skupu + promocja w kategorii Złom."], ["3", "Google Moja Firma", "Bezpłatny profil w Google Maps — bardzo ważny dla lokalnych klientów!"], ["4", "Ulotki A5", "Druk 500 szt. ≈ 50-100 zł. Roznoś w targowiskach, warsztatach, OC"], ["5", "WhatsApp/SMS", "Do bazy stałych klientów — najtańsza rekonwersja."], ["6", "Instagram", "Zdjęcia skupionego materiału + ceny. Młodsi klienci."]].map(([n, k, v]) => (React.createElement("div", { key: n, style: { display: "flex", gap: 10, padding: "8px 0", borderTop: n !== "1" ? "1px solid var(--line)" : "none" } },
                    React.createElement("span", { style: { fontWeight: 800, fontSize: 13.5, color: "var(--copper)", minWidth: 16 } }, n),
                    React.createElement("div", null,
                        React.createElement("div", { style: { fontWeight: 700, fontSize: 14.5 } }, k),
                        React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)" } }, v)))))))),
        activeTab === "powiadom" && React.createElement(PowiadomKlientow, { materials: materials, company: company }),
        React.createElement(Sheet, { open: open, onClose: () => setOpen(false), title: edit && edit.id ? "Kampania" : "Nowa kampania" }, edit && (React.createElement(React.Fragment, null,
            React.createElement("label", { style: label }, "Nazwa kampanii"),
            React.createElement("input", { style: inputStyle, value: edit.name, onChange: (e) => setEdit({ ...edit, name: e.target.value }), placeholder: "np. Promocja na mied\u017A \u2014 lipiec" }),
            React.createElement("label", { style: label }, "Kana\u0142"),
            React.createElement("select", { value: edit.channel || "facebook", onChange: e => setEdit({ ...edit, channel: e.target.value }), style: { ...inputStyle, fontWeight: 600 } }, [["facebook", "Facebook/Marketplace"], ["olx", "OLX"], ["google", "Google My Business"], ["ulotki", "Ulotki"], ["sms", "SMS/WhatsApp"], ["instagram", "Instagram"], ["inne", "Inne"]].map(([v, l]) => React.createElement("option", { key: v, value: v }, l))),
            React.createElement("label", { style: label }, "Data"),
            React.createElement("input", { type: "date", style: { ...inputStyle, colorScheme: "light" }, value: edit.date, onChange: (e) => setEdit({ ...edit, date: e.target.value }) }),
            React.createElement("label", { style: label }, "Bud\u017Cet (z\u0142)"),
            React.createElement("input", { type: "number", style: { ...inputStyle, fontFamily: "var(--mono)", fontWeight: 700 }, value: edit.budget || "", onChange: e => setEdit({ ...edit, budget: e.target.value }), placeholder: "0" }),
            React.createElement("label", { style: label }, "ROI (%)"),
            React.createElement("input", { type: "number", style: { ...inputStyle, fontFamily: "var(--mono)", fontWeight: 700 }, value: edit.roi || "", onChange: e => setEdit({ ...edit, roi: e.target.value }), placeholder: "np. 250" }),
            React.createElement("label", { style: label }, "Status"),
            React.createElement("div", { style: { display: "flex", gap: 8 } }, [["plan", "Planowana"], ["active", "Aktywna"], ["done", "Zakończona"]].map(([k, l]) => (React.createElement("button", { key: k, onClick: () => setEdit({ ...edit, status: k }), style: { flex: 1, padding: "9px", borderRadius: 9, cursor: "pointer", fontSize: 13.5, fontWeight: 700, border: edit.status === k ? "1.5px solid var(--copper)" : "1px solid var(--line2)", background: edit.status === k ? "rgba(200,116,63,.1)" : "var(--surface)", color: edit.status === k ? "var(--copper)" : "var(--muted)" } }, l)))),
            React.createElement("label", { style: label }, "Notatka"),
            React.createElement("textarea", { rows: 2, style: { ...inputStyle, resize: "vertical" }, value: edit.note || "", onChange: (e) => setEdit({ ...edit, note: e.target.value }), placeholder: "Wyniki, uwagi\u2026" }),
            React.createElement("button", { style: { ...btnCopper, marginTop: 14 }, onClick: () => {
                    if (!edit.name.trim())
                        return;
                    if (edit.id)
                        setCampaigns(campaigns.map((c) => c.id === edit.id ? edit : c));
                    else
                        setCampaigns([...campaigns, { ...edit, id: uid() }]);
                    setOpen(false);
                } }, "Zapisz"),
            edit.id && React.createElement("button", { style: { ...btnGhost, marginTop: 10, color: "var(--red)", borderColor: "rgba(220,38,38,.3)" }, onClick: () => { setCampaigns(campaigns.filter((c) => c.id !== edit.id)); setOpen(false); } }, "Usu\u0144"))))));
}
/* ─────────── Kalkulator zysku ─────────── */
function KalkulatorZysku({ materials, stock, tx, kupMonth, kupTot, month }) {
    // Domyślne marże/ceny sprzedaży z cennika lub edytowalne
    const [rows, setRows] = useState(() => {
        try {
            const s = localStorage.getItem("sk_profit_v1");
            if (s)
                return JSON.parse(s);
        }
        catch { }
        return (materials || []).filter(m => (stock?.[m.id] || 0) > 0 || m.stock > 0).map(m => ({
            id: m.id, n: m.n, g: m.g,
            qty: String(Math.round(stock?.[m.id] ?? m.stock ?? 0)),
            buy: m.buy,
            sell: String(m.sell || (m.buy * 1.2).toFixed(2)),
        }));
    });
    const [extraCost, setExtraCost] = useState(() => { try {
        return localStorage.getItem("sk_profit_cost") || "0";
    }
    catch {
        return "0";
    } });
    const [vatMode, setVatMode] = useState(false);
    const save = (r, c) => { try {
        localStorage.setItem("sk_profit_v1", JSON.stringify(r));
        if (c !== undefined)
            localStorage.setItem("sk_profit_cost", c);
    }
    catch { } };
    const upd = (id, field, val) => { const r = rows.map(x => x.id === id ? { ...x, [field]: val } : x); setRows(r); save(r); };
    // Obliczenia
    const calc = rows.map(r => {
        const qty = parseFloat(r.qty) || 0;
        const buy = parseFloat(r.buy) || 0;
        const sell = parseFloat(r.sell) || 0;
        const revenue = qty * sell; // przychód ze sprzedaży
        const cost = qty * buy; // koszt zakupu
        const grossMargin = revenue - cost; // marża brutto
        const marginPct = sell > 0 ? ((sell - buy) / sell * 100) : 0;
        return { ...r, qty, buy, sell, revenue, cost, grossMargin, marginPct };
    });
    const totRevenue = calc.reduce((a, r) => a + r.revenue, 0);
    const totCost = calc.reduce((a, r) => a + r.cost, 0);
    const totGross = totRevenue - totCost;
    const extra = parseFloat(extraCost) || 0;
    const kupReal = (kupTot || 0) + extra;
    const netProfit = totGross - kupReal; // zysk netto po kosztach
    const vat = vatMode ? Math.max(0, totGross * 0.23) : 0; // VAT od marży (wartości dodanej), nie od całego przychodu
    const netAfterVat = netProfit - vat;
    const avgMargin = totRevenue > 0 ? (totGross / totRevenue * 100) : 0;
    const fmt = v => v.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";
    return (React.createElement("div", { style: { marginTop: 14 } },
        React.createElement("div", { style: { background: netProfit >= 0 ? "linear-gradient(135deg,rgba(21,163,74,.12),rgba(21,163,74,.02))" : "linear-gradient(135deg,rgba(220,38,38,.12),rgba(220,38,38,.02))", border: `1px solid ${netProfit >= 0 ? "rgba(21,163,74,.3)" : "rgba(220,38,38,.3)"}`, borderRadius: 18, padding: "18px 16px", marginBottom: 14 } },
            React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", fontWeight: 600 } }, "Szacunkowy zysk netto"),
            React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 900, fontSize: 32, marginTop: 4, color: netProfit >= 0 ? "var(--green)" : "var(--red)" } }, fmt(netProfit)),
            React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 4 } },
                "\u015Brednia mar\u017Ca: ",
                avgMargin.toFixed(1),
                "% \u00B7 ",
                calc.length,
                " materia\u0142\u00F3w"),
            vatMode && React.createElement("div", { style: { fontSize: 14, marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between" } },
                React.createElement("span", { style: { color: "var(--muted)" } }, "Po VAT od mar\u017Cy (szac.):"),
                React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 700 } }, fmt(netAfterVat))),
            vatMode && React.createElement("div", { style: { fontSize: 12, color: "var(--faint)", marginTop: 8, lineHeight: 1.5 } }, "Szacunek: VAT 23% liczony od mar\u017Cy (sprzeda\u017C \u2212 zakup), nie od ca\u0142ego obrotu. Uwaga: skup z\u0142omu cz\u0119sto podlega odwrotnemu obci\u0105\u017Ceniu \u2014 rozliczenie potwierd\u017A z ksi\u0119gowym.")),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 } },
            React.createElement(Card, { pad: 13 },
                React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)" } }, "Przych\u00F3d (sprzeda\u017C)"),
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 17, marginTop: 4, color: "var(--green)" } }, fmt(totRevenue))),
            React.createElement(Card, { pad: 13 },
                React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)" } }, "Koszt zakupu"),
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 17, marginTop: 4, color: "var(--copper)" } }, fmt(totCost))),
            React.createElement(Card, { pad: 13 },
                React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)" } }, "Mar\u017Ca brutto"),
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 17, marginTop: 4 } }, fmt(totGross))),
            React.createElement(Card, { pad: 13 },
                React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)" } }, "Koszty firmy (KUP)"),
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 17, marginTop: 4, color: "var(--red)" } }, fmt(kupReal)))),
        React.createElement("div", { style: { ...sectionTitle, display: "flex", justifyContent: "space-between", alignItems: "center" } },
            React.createElement("span", null, "Materia\u0142y \u2014 mar\u017Ca i sprzeda\u017C"),
            React.createElement("button", { onClick: () => setVatMode(!vatMode), style: { padding: "5px 10px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer", border: vatMode ? "1.5px solid var(--copper)" : "1px solid var(--line2)", background: vatMode ? "rgba(200,116,63,.1)" : "var(--surface2)", color: vatMode ? "var(--copper)" : "var(--muted)", textTransform: "none", letterSpacing: 0 } }, vatMode ? "VAT ✓" : "VAT")),
        calc.map(r => (React.createElement(Card, { key: r.id, pad: 13, style: { marginBottom: 9 } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
                    React.createElement("div", { style: { width: 8, height: 8, borderRadius: 99, background: C[r.g]?.color || "var(--copper)" } }),
                    React.createElement("span", { style: { fontWeight: 700, fontSize: 15 } }, r.n)),
                React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 14, color: r.grossMargin >= 0 ? "var(--green)" : "var(--red)" } },
                    r.grossMargin >= 0 ? "+" : "",
                    fmt(r.grossMargin))),
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 } },
                React.createElement("div", null,
                    React.createElement("div", { style: { fontSize: 12, color: "var(--muted)", marginBottom: 3 } }, "Ilo\u015B\u0107 (kg)"),
                    React.createElement("input", { type: "number", value: r.qty, onChange: e => upd(r.id, "qty", e.target.value), style: { width: "100%", padding: "8px 9px", borderRadius: 9, border: "1px solid var(--line2)", background: "var(--surface2)", color: "var(--text)", fontSize: 14, fontFamily: "var(--mono)", fontWeight: 700, outline: "none", boxSizing: "border-box" } })),
                React.createElement("div", null,
                    React.createElement("div", { style: { fontSize: 12, color: "var(--muted)", marginBottom: 3 } }, "Skup (z\u0142/kg)"),
                    React.createElement("input", { type: "number", step: "0.01", value: r.buy, onChange: e => upd(r.id, "buy", e.target.value), style: { width: "100%", padding: "8px 9px", borderRadius: 9, border: "1px solid var(--line2)", background: "var(--surface2)", color: "var(--copper)", fontSize: 14, fontFamily: "var(--mono)", fontWeight: 700, outline: "none", boxSizing: "border-box" } })),
                React.createElement("div", null,
                    React.createElement("div", { style: { fontSize: 12, color: "var(--muted)", marginBottom: 3 } }, "Sprzeda\u017C (z\u0142/kg)"),
                    React.createElement("input", { type: "number", step: "0.01", value: r.sell, onChange: e => upd(r.id, "sell", e.target.value), style: { width: "100%", padding: "8px 9px", borderRadius: 9, border: "1px solid var(--line2)", background: "var(--surface2)", color: "var(--green)", fontSize: 14, fontFamily: "var(--mono)", fontWeight: 700, outline: "none", boxSizing: "border-box" } }))),
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 13, color: "var(--muted)" } },
                React.createElement("span", null,
                    "mar\u017Ca: ",
                    React.createElement("b", { style: { color: r.marginPct >= 0 ? "var(--green)" : "var(--red)" } },
                        r.marginPct.toFixed(1),
                        "%")),
                React.createElement("span", null,
                    "przych\u00F3d: ",
                    React.createElement("b", { style: { color: "var(--text)" } }, fmt(r.revenue))))))),
        React.createElement("div", { style: sectionTitle }, "Koszty dodatkowe (poza KUP)"),
        React.createElement(Card, { pad: 14 },
            React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", marginBottom: 8, lineHeight: 1.5 } }, "Transport do huty, ci\u0119cie, robocizna, paliwo \u2014 wszystko co pomniejsza zysk z tej partii."),
            React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } },
                React.createElement("input", { type: "number", value: extraCost, onChange: e => { setExtraCost(e.target.value); save(rows, e.target.value); }, placeholder: "0", style: { flex: 1, padding: "12px 14px", borderRadius: 11, border: "1px solid var(--line2)", background: "var(--surface2)", color: "var(--red)", fontSize: 18, fontFamily: "var(--mono)", fontWeight: 800, outline: "none", boxSizing: "border-box" } }),
                React.createElement("span", { style: { fontSize: 14, color: "var(--muted)", fontWeight: 600 } }, "z\u0142"))),
        React.createElement(Card, { style: { marginTop: 14, background: "var(--surface2)" } },
            React.createElement("div", { style: { fontWeight: 700, fontSize: 15, marginBottom: 12 } }, "\uD83D\uDCCA Kalkulacja ko\u0144cowa"),
            [
                ["Przychód ze sprzedaży", fmt(totRevenue), "var(--green)"],
                ["− Koszt zakupu złomu", "−" + fmt(totCost), "var(--copper)"],
                ["= Marża brutto", fmt(totGross), "var(--text)"],
                ["− Koszty firmy (KUP)", "−" + fmt(kupTot || 0), "var(--red)"],
                ["− Koszty dodatkowe", "−" + fmt(extra), "var(--red)"],
                ...(vatMode ? [["− VAT od marży (szac. 23%)", "−" + fmt(vat), "var(--red)"]] : []),
            ].map(([l, v, c], i) => (React.createElement("div", { key: i, style: { display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--line)", fontSize: 14.5 } },
                React.createElement("span", { style: { color: "var(--muted)" } }, l),
                React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 700, color: c } }, v)))),
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", paddingTop: 12, marginTop: 4 } },
                React.createElement("span", { style: { fontWeight: 800, fontSize: 15 } }, "= ZYSK NETTO"),
                React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 900, fontSize: 18, color: (vatMode ? netAfterVat : netProfit) >= 0 ? "var(--green)" : "var(--red)" } }, fmt(vatMode ? netAfterVat : netProfit)))),
        React.createElement("div", { style: { fontSize: 12.5, color: "var(--faint)", marginTop: 10, lineHeight: 1.5, textAlign: "center" } }, "Edytuj ilo\u015Bci, ceny skupu i sprzeda\u017Cy \u2014 zysk przelicza si\u0119 automatycznie. Dane zapisuj\u0105 si\u0119 lokalnie.")));
}
/* ─────────── Rentowność materiałów ─────────── */
function RentownoscMaterialow({ tx, materials, stock, month }) {
    const [sortBy, setSortBy] = useState("zysk");
    // Gęstość nasypowa (kg/m³) per grupa — do oszacowania miejsca na placu
    const GESTOSC = { FE: 1200, CU: 2000, AL: 400, KAB: 600, SS: 1500, PB: 3000, ZN: 1800, AKU: 1500, EL: 300 };
    // Obrót z transakcji w tym miesiącu per materiał
    const txMonth = (tx || []).filter(x => fmtDateKey(x.ts).slice(0, 7) === month);
    const obrotMat = {};
    txMonth.forEach(x => (x.pos || []).forEach(p => {
        if (!obrotMat[p.matId])
            obrotMat[p.matId] = { masa: 0, wartosc: 0 };
        obrotMat[p.matId].masa += p.w;
        obrotMat[p.matId].wartosc += p.w * p.price;
    }));
    // Analiza per materiał
    const analiza = (materials || []).map(m => {
        const st = stock?.[m.id] || 0;
        const marzaKg = m.sell - m.buy;
        const marzaPct = m.buy > 0 ? (marzaKg / m.buy * 100) : 0;
        const obrot = obrotMat[m.id] || { masa: 0, wartosc: 0 };
        // Zysk z obrotu miesięcznego (marża × masa skupiona)
        const zyskObrot = obrot.masa * marzaKg;
        // Zamrożony kapitał (wartość zapasu po cenie skupu)
        const kapital = st * m.buy;
        // Miejsce na placu (m³) — masa / gęstość
        const gest = GESTOSC[m.g] || 1000;
        const miejsce = st / gest;
        // Rentowność powierzchni: potencjalny zysk z zapasu / zajmowane miejsce
        const zyskZapas = st * marzaKg;
        const zlNaM3 = miejsce > 0 ? zyskZapas / miejsce : 0;
        // Efektywność kapitału: zysk z obrotu / średni kapitał (proxy: marża%)
        const efektKapital = marzaPct;
        return { ...m, st, marzaKg, marzaPct, obrot, zyskObrot, kapital, miejsce, zyskZapas, zlNaM3, efektKapital };
    });
    const totZyskObrot = analiza.reduce((a, m) => a + m.zyskObrot, 0);
    const totKapital = analiza.reduce((a, m) => a + m.kapital, 0);
    const totMiejsce = analiza.reduce((a, m) => a + m.miejsce, 0);
    // Sortowanie
    const SORT_FN = {
        zysk: (a, b) => b.zyskObrot - a.zyskObrot,
        marza: (a, b) => b.marzaPct - a.marzaPct,
        miejsce: (a, b) => b.zlNaM3 - a.zlNaM3,
        kapital: (a, b) => b.kapital - a.kapital,
    };
    const sorted = analiza.slice().sort(SORT_FN[sortBy]);
    const maxVal = {
        zysk: Math.max(...analiza.map(m => m.zyskObrot), 1),
        marza: Math.max(...analiza.map(m => m.marzaPct), 1),
        miejsce: Math.max(...analiza.map(m => m.zlNaM3), 1),
        kapital: Math.max(...analiza.map(m => m.kapital), 1),
    }[sortBy];
    const fmt0 = v => Math.round(v).toLocaleString("pl-PL") + " zł";
    const fmt = v => v.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";
    // Najlepszy i najgorszy wg zysku z obrotu
    const best = sorted[0];
    const najwiekszyKapital = analiza.slice().sort((a, b) => b.kapital - a.kapital)[0];
    const najslabszaRotacja = analiza.filter(m => m.kapital > 0 && m.zyskObrot < m.kapital * 0.05).sort((a, b) => b.kapital - a.kapital)[0];
    const SORT_LBL = { zysk: "Zysk z obrotu", marza: "Marża %", miejsce: "Zł / m³ placu", kapital: "Zamrożony kapitał" };
    const SORT_UNIT = (m) => {
        if (sortBy === "zysk")
            return fmt0(m.zyskObrot);
        if (sortBy === "marza")
            return m.marzaPct.toFixed(1) + "%";
        if (sortBy === "miejsce")
            return fmt0(m.zlNaM3) + "/m³";
        return fmt0(m.kapital);
    };
    const SORT_VAL = (m) => {
        if (sortBy === "zysk")
            return m.zyskObrot;
        if (sortBy === "marza")
            return m.marzaPct;
        if (sortBy === "miejsce")
            return m.zlNaM3;
        return m.kapital;
    };
    return (React.createElement("div", { style: { marginTop: 14 } },
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 } },
            React.createElement(Card, { pad: 13 },
                React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)" } }, "Zysk z obrotu (mies.)"),
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 18, marginTop: 4, color: "var(--green)" } }, fmt0(totZyskObrot))),
            React.createElement(Card, { pad: 13 },
                React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)" } }, "Zamro\u017Cony kapita\u0142"),
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 18, marginTop: 4, color: "var(--copper)" } }, fmt0(totKapital)))),
        best && best.zyskObrot > 0 && (React.createElement(Card, { style: { background: "rgba(21,163,74,.07)", border: "1px solid rgba(21,163,74,.25)", marginBottom: 10 } },
            React.createElement("div", { style: { fontSize: 14.5, lineHeight: 1.6 } },
                React.createElement("b", { style: { color: "var(--green)" } },
                    "\uD83C\uDFC6 Tw\u00F3j ko\u0144 poci\u0105gowy: ",
                    best.n),
                React.createElement("br", null),
                React.createElement("span", { style: { color: "var(--muted)" } },
                    "Daje ",
                    fmt0(best.zyskObrot),
                    " zysku z obrotu tego miesi\u0105ca \u2014 ",
                    totZyskObrot > 0 ? Math.round(best.zyskObrot / totZyskObrot * 100) : 0,
                    "% ca\u0142o\u015Bci. Mar\u017Ca ",
                    best.marzaPct.toFixed(0),
                    "%.")))),
        najslabszaRotacja && (React.createElement(Card, { style: { background: "rgba(217,119,6,.07)", border: "1px solid rgba(217,119,6,.25)", marginBottom: 10 } },
            React.createElement("div", { style: { fontSize: 14.5, lineHeight: 1.6 } },
                React.createElement("b", { style: { color: "var(--amber)" } },
                    "\u23F3 Martwy kapita\u0142: ",
                    najslabszaRotacja.n),
                React.createElement("br", null),
                React.createElement("span", { style: { color: "var(--muted)" } },
                    "Zamra\u017Ca ",
                    fmt0(najslabszaRotacja.kapital),
                    " przy s\u0142abym obrocie. Rozwa\u017C obni\u017Ck\u0119 ceny sprzeda\u017Cy, by szybciej go up\u0142ynni\u0107 i odzyska\u0107 got\u00F3wk\u0119.")))),
        React.createElement("div", { style: sectionTitle }, "Ranking materia\u0142\u00F3w"),
        React.createElement("div", { style: { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 4 } }, [["zysk", "💰 Zysk"], ["marza", "📊 Marża"], ["miejsce", "📦 Zł/m³ placu"], ["kapital", "🔒 Kapitał"]].map(([id, lbl]) => (React.createElement("button", { key: id, onClick: () => setSortBy(id), style: { flexShrink: 0, padding: "7px 12px", borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: "pointer", border: sortBy === id ? "1.5px solid var(--copper)" : "1px solid var(--line2)", background: sortBy === id ? "rgba(200,116,63,.1)" : "var(--surface2)", color: sortBy === id ? "var(--copper)" : "var(--muted)" } }, lbl)))),
        sorted.map((m, i) => {
            const val = SORT_VAL(m);
            const pct = maxVal > 0 ? Math.max(2, (val / maxVal) * 100) : 0;
            return (React.createElement(Card, { key: m.id, pad: 13, style: { marginBottom: 8 } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 } },
                    React.createElement("span", { style: { fontFamily: "var(--mono)", fontSize: 13.5, fontWeight: 800, color: i === 0 ? "var(--copper)" : "var(--faint)", width: 20 } },
                        "#",
                        i + 1),
                    React.createElement("div", { style: { width: 8, height: 8, borderRadius: 99, background: (C[m.g] || {}).color || "var(--copper)", flexShrink: 0 } }),
                    React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                        React.createElement("div", { style: { fontSize: 15, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, m.n)),
                    React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 14, color: val >= 0 ? "var(--text)" : "var(--red)" } }, SORT_UNIT(m))),
                React.createElement("div", { style: { height: 6, background: "var(--surface2)", borderRadius: 9, overflow: "hidden", marginBottom: 8 } },
                    React.createElement("div", { style: { height: "100%", width: pct + "%", background: i === 0 ? "linear-gradient(90deg,var(--copper),#a85829)" : "linear-gradient(90deg,var(--green),#0d7a37)", borderRadius: 9 } })),
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--muted)" } },
                    React.createElement("span", null,
                        "obr\u00F3t: ",
                        kg(m.obrot.masa)),
                    React.createElement("span", null,
                        "mar\u017Ca: ",
                        m.marzaKg.toFixed(2),
                        " z\u0142/kg"),
                    React.createElement("span", null,
                        "zapas: ",
                        fmt0(m.kapital)))));
        }),
        React.createElement(Card, { style: { marginTop: 6, background: "var(--surface2)" } },
            React.createElement("div", { style: { fontWeight: 700, fontSize: 14.5, marginBottom: 8 } }, "\uD83C\uDFAF Jak czyta\u0107 rentowno\u015B\u0107"),
            React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", lineHeight: 1.7 } },
                React.createElement("b", { style: { color: "var(--text)" } }, "\uD83D\uDCB0 Zysk z obrotu"),
                " \u2014 ile realnie zarobi\u0142e\u015B na materiale w tym miesi\u0105cu.",
                React.createElement("br", null),
                React.createElement("b", { style: { color: "var(--text)" } }, "\uD83D\uDCCA Mar\u017Ca"),
                " \u2014 procentowy zarobek na kg (wysoki = op\u0142acalny na jednostk\u0119).",
                React.createElement("br", null),
                React.createElement("b", { style: { color: "var(--text)" } }, "\uD83D\uDCE6 Z\u0142/m\u00B3 placu"),
                " \u2014 ile zysku daje materia\u0142 na zajmowane miejsce. Stal jest ci\u0119\u017Cka ale zajmuje du\u017Co \u2014 mied\u017A odwrotnie.",
                React.createElement("br", null),
                React.createElement("b", { style: { color: "var(--text)" } }, "\uD83D\uDD12 Kapita\u0142"),
                " \u2014 ile got\u00F3wki masz zamro\u017Cone w zapasie. Wysoki kapita\u0142 + niski obr\u00F3t = pieni\u0105dze stoj\u0105.")),
        React.createElement("div", { style: { fontSize: 12.5, color: "var(--faint)", marginTop: 10, lineHeight: 1.5, textAlign: "center" } }, "Miejsce na placu szacowane z g\u0119sto\u015Bci nasypowej. Zysk liczony z transakcji miesi\u0105ca.")));
}
/* ─────────── Historia zysków (trend miesiąc do miesiąca) ─────────── */
function HistoriaZyskow({ tx, materials, kupTot, month, dispatch }) {
    // Realny zysk z bieżącego miesiąca z transakcji
    const matSell = {};
    (materials || []).forEach(m => { matSell[m.id] = m.sell; });
    const txMonth = (tx || []).filter(x => fmtDateKey(x.ts).slice(0, 7) === month);
    const Wb = calcWynik(tx, dispatch, materials, (k) => k.slice(0, 7) === month); // ten sam kalkulator co „Papiery”
    const przychodBiez = Wb.sprzedaz;
    const kosztBiez = Wb.koszt;
    const zyskBiez = Wb.marza - (kupTot || 0);
    // Dane historyczne (edytowalne, zapis lokalny) — właściciel uzupełnia minione miesiące
    const [hist, setHist] = useState(() => {
        try {
            const s = localStorage.getItem("sk_history_v1");
            if (s)
                return JSON.parse(s);
        }
        catch { }
        // Przykładowe dane demonstracyjne — 6 minionych miesięcy
        return {
            "2026-01": { przychod: 42000, koszt: 33500, kup: 3100 },
            "2026-02": { przychod: 38000, koszt: 30200, kup: 2950 },
            "2026-03": { przychod: 51000, koszt: 40100, kup: 3300 },
            "2026-04": { przychod: 58000, koszt: 45200, kup: 3450 },
            "2026-05": { przychod: 54000, koszt: 42800, kup: 3200 },
        };
    });
    const save = (h) => { setHist(h); try {
        localStorage.setItem("sk_history_v1", JSON.stringify(h));
    }
    catch { } };
    const [edytuj, setEdytuj] = useState(false);
    const [edMonth, setEdMonth] = useState("");
    const [edP, setEdP] = useState("");
    const [edK, setEdK] = useState("");
    const [edKup, setEdKup] = useState("");
    // Połącz historię + bieżący miesiąc (bieżący nadpisuje, bo liczony z transakcji)
    const wszystkie = { ...hist };
    if (txMonth.length > 0)
        wszystkie[month] = { przychod: przychodBiez, koszt: kosztBiez, kup: kupTot || 0, biez: true };
    // Posortowane miesiące
    const miesiace = Object.keys(wszystkie).sort();
    const dane = miesiace.map(mk => {
        const d = wszystkie[mk];
        const zysk = d.przychod - d.koszt - (d.kup || 0);
        const marza = d.przychod > 0 ? (zysk / d.przychod * 100) : 0;
        return { mk, ...d, zysk, marza };
    });
    // Statystyki
    const zyski = dane.map(d => d.zysk);
    const sredniZysk = zyski.length ? zyski.reduce((a, z) => a + z, 0) / zyski.length : 0;
    const najlepszy = dane.length ? dane.reduce((a, b) => b.zysk > a.zysk ? b : a) : null;
    const najgorszy = dane.length ? dane.reduce((a, b) => b.zysk < a.zysk ? b : a) : null;
    const sumaRoczna = zyski.reduce((a, z) => a + z, 0);
    // Trend (ostatnie 2 miesiące)
    const trend = dane.length >= 2 ? dane[dane.length - 1].zysk - dane[dane.length - 2].zysk : 0;
    const trendPct = dane.length >= 2 && dane[dane.length - 2].zysk > 0 ? (trend / dane[dane.length - 2].zysk * 100) : 0;
    // Nazwy miesięcy
    const mcName = (mk) => { const [y, m] = mk.split("-"); const n = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"]; return n[parseInt(m) - 1]; };
    const mcFull = (mk) => { const [y, m] = mk.split("-"); const n = ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"]; return `${n[parseInt(m) - 1]} ${y}`; };
    const fmt0 = v => Math.round(v).toLocaleString("pl-PL") + " zł";
    // Wykres słupkowy
    const maxZysk = Math.max(...dane.map(d => Math.abs(d.zysk)), 1);
    const ChartBars = () => (React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 6, height: 160, padding: "0 2px" } }, dane.map(d => {
        const h = Math.max(4, (Math.abs(d.zysk) / maxZysk) * 130);
        const isNeg = d.zysk < 0;
        return (React.createElement("div", { key: d.mk, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 } },
            React.createElement("div", { style: { fontSize: 11, fontFamily: "var(--mono)", fontWeight: 700, color: d.biez ? "var(--copper)" : "var(--muted)", whiteSpace: "nowrap" } },
                Math.round(d.zysk / 1000),
                "k"),
            React.createElement("div", { style: { width: "100%", maxWidth: 38, height: h, background: d.biez ? "linear-gradient(180deg,var(--copper),#a85829)" : isNeg ? "linear-gradient(180deg,#dc2626,#991b1b)" : "linear-gradient(180deg,var(--green),#0d7a37)", borderRadius: "6px 6px 0 0", position: "relative" } }, d.biez && React.createElement("div", { style: { position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)", width: 6, height: 6, borderRadius: 99, background: "var(--copper)" } })),
            React.createElement("div", { style: { fontSize: 11.5, color: d.biez ? "var(--copper)" : "var(--muted)", fontWeight: d.biez ? 700 : 500 } }, mcName(d.mk))));
    })));
    return (React.createElement("div", { style: { marginTop: 14 } },
        React.createElement("div", { style: { background: "linear-gradient(135deg,rgba(21,163,74,.1),rgba(21,163,74,.01))", border: "1px solid rgba(21,163,74,.3)", borderRadius: 18, padding: "18px 16px", marginBottom: 14 } },
            React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", fontWeight: 600 } },
                "Zysk \u0142\u0105cznie (",
                dane.length,
                " mies.)"),
            React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 900, fontSize: 30, marginTop: 4, color: "var(--green)" } }, fmt0(sumaRoczna)),
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--line)", fontSize: 14 } },
                React.createElement("span", { style: { color: "var(--muted)" } }, "\u015Arednio / miesi\u0105c:"),
                React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 700 } }, fmt0(sredniZysk)))),
        React.createElement(Card, null,
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 } },
                React.createElement("span", { style: { fontWeight: 700, fontSize: 14 } }, "Zysk miesi\u0119czny"),
                dane.length >= 2 && (React.createElement("span", { style: { fontSize: 13.5, fontWeight: 700, color: trend >= 0 ? "var(--green)" : "var(--red)" } },
                    trend >= 0 ? "▲" : "▼",
                    " ",
                    Math.abs(trendPct).toFixed(0),
                    "% m/m"))),
            React.createElement(ChartBars, null),
            React.createElement("div", { style: { display: "flex", gap: 14, marginTop: 14, justifyContent: "center", fontSize: 12.5, color: "var(--muted)" } },
                React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 5 } },
                    React.createElement("span", { style: { width: 9, height: 9, borderRadius: 2, background: "var(--green)" } }),
                    "miniony"),
                React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 5 } },
                    React.createElement("span", { style: { width: 9, height: 9, borderRadius: 2, background: "var(--copper)" } }),
                    "bie\u017C\u0105cy (z transakcji)"))),
        najlepszy && najgorszy && (React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 } },
            React.createElement(Card, { pad: 13, style: { background: "rgba(21,163,74,.06)", border: "1px solid rgba(21,163,74,.2)" } },
                React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)" } }, "\uD83C\uDFC6 Najlepszy miesi\u0105c"),
                React.createElement("div", { style: { fontWeight: 700, fontSize: 14, marginTop: 3 } }, mcFull(najlepszy.mk)),
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 16, color: "var(--green)", marginTop: 2 } }, fmt0(najlepszy.zysk))),
            React.createElement(Card, { pad: 13, style: { background: "rgba(217,119,6,.06)", border: "1px solid rgba(217,119,6,.2)" } },
                React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)" } }, "\uD83D\uDCC9 Najs\u0142abszy miesi\u0105c"),
                React.createElement("div", { style: { fontWeight: 700, fontSize: 14, marginTop: 3 } }, mcFull(najgorszy.mk)),
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 16, color: "var(--amber)", marginTop: 2 } }, fmt0(najgorszy.zysk))))),
        React.createElement("div", { style: { ...sectionTitle, display: "flex", justifyContent: "space-between", alignItems: "center" } },
            React.createElement("span", null, "Szczeg\u00F3\u0142y miesi\u0119czne"),
            React.createElement("button", { onClick: () => { setEdytuj(!edytuj); setEdMonth(""); }, style: { padding: "5px 11px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "1px solid var(--line2)", background: "var(--surface2)", color: "var(--copper)", textTransform: "none", letterSpacing: 0 } }, edytuj ? "Gotowe" : "+ Dodaj miesiąc")),
        edytuj && (React.createElement(Card, { style: { marginBottom: 10, background: "var(--surface2)" } },
            React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", marginBottom: 10, lineHeight: 1.5 } }, "Uzupe\u0142nij miniony miesi\u0105c (bie\u017C\u0105cy liczy si\u0119 automatycznie z transakcji):"),
            React.createElement("label", { style: { fontSize: 13, color: "var(--muted)", fontWeight: 600, display: "block", marginBottom: 5 } }, "Miesi\u0105c"),
            React.createElement("input", { type: "month", value: edMonth, onChange: e => setEdMonth(e.target.value), style: { ...inputStyle, colorScheme: "light", fontFamily: "var(--mono)", fontWeight: 700, marginBottom: 10 } }),
            React.createElement("div", { style: { display: "flex", gap: 8 } },
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("label", { style: { fontSize: 12, color: "var(--muted)", marginBottom: 4, display: "block" } }, "Przych\u00F3d"),
                    React.createElement("input", { type: "number", value: edP, onChange: e => setEdP(e.target.value), placeholder: "0", style: { width: "100%", padding: "9px 10px", borderRadius: 9, border: "1px solid var(--line2)", background: "var(--surface)", color: "var(--green)", fontSize: 14, fontFamily: "var(--mono)", fontWeight: 700, outline: "none", boxSizing: "border-box" } })),
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("label", { style: { fontSize: 12, color: "var(--muted)", marginBottom: 4, display: "block" } }, "Koszt skupu"),
                    React.createElement("input", { type: "number", value: edK, onChange: e => setEdK(e.target.value), placeholder: "0", style: { width: "100%", padding: "9px 10px", borderRadius: 9, border: "1px solid var(--line2)", background: "var(--surface)", color: "var(--copper)", fontSize: 14, fontFamily: "var(--mono)", fontWeight: 700, outline: "none", boxSizing: "border-box" } })),
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("label", { style: { fontSize: 12, color: "var(--muted)", marginBottom: 4, display: "block" } }, "KUP"),
                    React.createElement("input", { type: "number", value: edKup, onChange: e => setEdKup(e.target.value), placeholder: "0", style: { width: "100%", padding: "9px 10px", borderRadius: 9, border: "1px solid var(--line2)", background: "var(--surface)", color: "var(--red)", fontSize: 14, fontFamily: "var(--mono)", fontWeight: 700, outline: "none", boxSizing: "border-box" } }))),
            React.createElement("button", { onClick: () => { if (!edMonth || !(parseFloat(edP) > 0))
                    return; save({ ...hist, [edMonth]: { przychod: parseFloat(edP) || 0, koszt: parseFloat(edK) || 0, kup: parseFloat(edKup) || 0 } }); setEdMonth(""); setEdP(""); setEdK(""); setEdKup(""); }, style: { ...btnCopper, marginTop: 12, fontSize: 15 } }, "Zapisz miesi\u0105c"))),
        React.createElement(Card, { pad: 4 }, dane.slice().reverse().map((d, i) => (React.createElement("div", { key: d.mk, style: { display: "flex", alignItems: "center", gap: 10, padding: "11px 10px", borderBottom: i < dane.length - 1 ? "1px solid var(--line)" : "none" } },
            React.createElement("div", { style: { flex: 1 } },
                React.createElement("div", { style: { fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 7 } },
                    mcFull(d.mk),
                    d.biez && React.createElement("span", { style: { fontSize: 11, fontWeight: 800, color: "var(--copper)", background: "rgba(200,116,63,.12)", padding: "1px 6px", borderRadius: 5 } }, "TERAZ")),
                React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)", marginTop: 2 } },
                    "przych\u00F3d ",
                    fmt0(d.przychod),
                    " \u00B7 mar\u017Ca ",
                    d.marza.toFixed(0),
                    "%")),
            React.createElement("div", { style: { textAlign: "right" } },
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 15, color: d.zysk >= 0 ? "var(--green)" : "var(--red)" } }, fmt0(d.zysk)),
                React.createElement("div", { style: { fontSize: 11.5, color: "var(--faint)" } }, "zysk netto")),
            !d.biez && (React.createElement("button", { onClick: () => { const h = { ...hist }; delete h[d.mk]; save(h); }, style: { width: 28, height: 28, borderRadius: 8, border: "none", background: "transparent", color: "var(--faint)", cursor: "pointer", fontSize: 15, flexShrink: 0 } }, "\u00D7")))))),
        React.createElement("div", { style: sectionTitle }, "Sezonowo\u015B\u0107 bran\u017Cy z\u0142omowej"),
        React.createElement(Card, { style: { background: "rgba(63,125,138,.06)", border: "1px solid rgba(63,125,138,.2)" } },
            React.createElement("div", { style: { fontSize: 14, lineHeight: 1.7, color: "var(--muted)" } },
                React.createElement("b", { style: { color: "var(--text)" } }, "\uD83D\uDCC8 Wiosna (mar\u2013maj):"),
                " szczyt \u2014 porz\u0105dki, remonty, demonta\u017Ce. Najwi\u0119cej dostaw.",
                React.createElement("br", null),
                React.createElement("b", { style: { color: "var(--text)" } }, "\u2600\uFE0F Lato (cze\u2013sie):"),
                " stabilnie wysoko, du\u017Co prac budowlanych.",
                React.createElement("br", null),
                React.createElement("b", { style: { color: "var(--text)" } }, "\uD83C\uDF42 Jesie\u0144 (wrz\u2013lis):"),
                " drugi szczyt \u2014 porz\u0105dki przed zim\u0105.",
                React.createElement("br", null),
                React.createElement("b", { style: { color: "var(--text)" } }, "\u2744\uFE0F Zima (gru\u2013lut):"),
                " spadek \u2014 mr\u00F3z ogranicza zbi\u00F3rk\u0119. Czas na remonty sprz\u0119tu i planowanie.",
                React.createElement("br", null),
                React.createElement("br", null),
                React.createElement("span", { style: { color: "var(--text)" } }, "\uD83D\uDCA1 Wykorzystaj martwy sezon zimowy na inwestycje (jednorazowa amortyzacja!) i kampanie marketingowe przed wiosennym szczytem."))),
        React.createElement("div", { style: { fontSize: 12.5, color: "var(--faint)", marginTop: 10, lineHeight: 1.5, textAlign: "center" } }, "Bie\u017C\u0105cy miesi\u0105c liczony z transakcji. Minione uzupe\u0142nij r\u0119cznie \u2014 dane zapisuj\u0105 si\u0119 lokalnie.")));
}
/* ─────────── Eksport PCC-4 (deklaracja zbiorcza) ─────────── */
function PCC4Export({ tx, company, month, setMonth }) {
    const [stawka] = useState(2); // PCC 2%
    const [prog] = useState(1000); // zwolnienie poniżej 1000 zł
    // Tylko FPO (zakup od osób fizycznych) w danym miesiącu
    const fpoMonth = (tx || []).filter(x => x.kind === "FPO" && fmtDateKey(x.ts).slice(0, 7) === month);
    // Tylko transakcje > 1000 zł podlegają PCC (poniżej = zwolnienie ustawowe)
    const podlegajace = fpoMonth.map(x => ({ ...x, wartosc: txTotal(x) })).filter(x => x.wartosc > prog).sort((a, b) => a.ts - b.ts);
    const zwolnione = fpoMonth.filter(x => txTotal(x) <= prog);
    const podstawa = podlegajace.reduce((a, x) => a + x.wartosc, 0);
    const podatek = podstawa * (stawka / 100);
    // Warunek PCC-4: min 3 czynności, ostatnia z pierwszych 3 w ciągu 14 dni od pierwszej
    const moznaPCC4 = (() => {
        if (podlegajace.length < 3)
            return { ok: false, powod: `Tylko ${podlegajace.length} transakcji > ${prog} zł. PCC-4 wymaga minimum 3.` };
        const pierwsza = podlegajace[0].ts;
        const trzecia = podlegajace[2].ts;
        const dni = Math.floor((trzecia - pierwsza) / 86400000);
        if (dni > 14)
            return { ok: false, powod: `Między 1. a 3. transakcją minęło ${dni} dni (limit 14). Złóż PCC-3 osobno.` };
        return { ok: true, powod: `${podlegajace.length} transakcji, 3. czynność ${dni} dni po pierwszej — warunki spełnione.` };
    })();
    const mcLabel = (() => { const [y, m] = month.split("-"); const names = ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"]; return `${names[parseInt(m) - 1]} ${y}`; })();
    const termin = (() => { const [y, m] = month.split("-").map(Number); const next = m === 12 ? `${y + 1}-01-07` : `${y}-${pad(m + 1)}-07`; return next; })();
    // Generowanie pliku tekstowego PCC-4
    const buildPCC4 = () => {
        let t = "";
        t += "═══════════════════════════════════════════════════════\n";
        t += "  DEKLARACJA PCC-4 — ZBIORCZA (do przepisania do e-Deklaracji)\n";
        t += "  Podatek od czynności cywilnoprawnych\n";
        t += "═══════════════════════════════════════════════════════\n\n";
        t += "PODATNIK (nabywca):\n";
        t += "  Nazwa:  " + (company?.name || "—") + "\n";
        t += "  NIP:    " + (company?.nip || "—") + "\n";
        t += "  Adres:  " + (company?.addr || "—") + "\n\n";
        t += "OKRES: " + mcLabel + "\n";
        t += "TERMIN ZŁOŻENIA I ZAPŁATY: do " + termin + "\n\n";
        t += "───────────────────────────────────────────────────────\n";
        t += "WYKAZ CZYNNOŚCI (umowy sprzedaży > " + prog + " zł):\n";
        t += "───────────────────────────────────────────────────────\n";
        podlegajace.forEach((x, i) => {
            const d = new Date(x.ts);
            t += "\n" + (i + 1) + ". " + x.osoba.imie + " " + x.osoba.nazwisko + "\n";
            t += "   Data umowy:  " + fmtDateKey(x.ts) + "\n";
            t += "   Adres zbyw.: " + (x.osoba.adres || "—") + "\n";
            t += "   Dok. tożsam.: " + (x.osoba.dowod || "—") + "\n";
            t += "   Dokument:    " + x.no + "\n";
            t += "   Wartość:     " + x.wartosc.toFixed(2) + " zł\n";
            t += "   PCC 2%:      " + (x.wartosc * 0.02).toFixed(2) + " zł\n";
        });
        t += "\n───────────────────────────────────────────────────────\n";
        t += "PODSUMOWANIE:\n";
        t += "  Liczba czynności:      " + podlegajace.length + "\n";
        t += "  Podstawa opodatkow.:   " + podstawa.toFixed(2) + " zł\n";
        t += "  Stawka:                " + stawka + "%\n";
        t += "  PODATEK DO ZAPŁATY:    " + podatek.toFixed(2) + " zł\n";
        t += "───────────────────────────────────────────────────────\n\n";
        if (zwolnione.length) {
            t += "TRANSAKCJE ZWOLNIONE (≤ " + prog + " zł, nie wchodzą do PCC):\n";
            zwolnione.forEach(x => { t += "  · " + x.osoba.imie + " " + x.osoba.nazwisko + " — " + txTotal(x).toFixed(2) + " zł (" + x.no + ")\n"; });
            t += "\n";
        }
        t += "Wygenerowano: " + new Date().toLocaleString("pl-PL") + "\n";
        t += "UWAGA: Dokument pomocniczy. Dane przepisz do formularza\n";
        t += "PCC-4 w systemie e-Deklaracje (podatki.gov.pl) lub przekaż\n";
        t += "księgowemu. Zweryfikuj poprawność przed wysłaniem.\n";
        return t;
    };
    // Generowanie CSV dla księgowego / importu
    const buildCSV = () => {
        let c = "Lp;Data;Imie;Nazwisko;Adres;Dokument tozsamosci;Nr dokumentu;Wartosc zl;PCC 2% zl\n";
        podlegajace.forEach((x, i) => {
            c += [i + 1, fmtDateKey(x.ts), x.osoba.imie, x.osoba.nazwisko, (x.osoba.adres || "").replace(/;/g, ","), x.osoba.dowod || "", x.no, x.wartosc.toFixed(2), (x.wartosc * 0.02).toFixed(2)].join(";") + "\n";
        });
        c += ";;;;;;;RAZEM:;" + podatek.toFixed(2) + "\n";
        return c;
    };
    const fmt = v => v.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";
    return (React.createElement("div", { style: { marginTop: 14 } },
        React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", marginBottom: 14 } },
            React.createElement("label", { style: { fontSize: 14, color: "var(--muted)", fontWeight: 600 } }, "Miesi\u0105c:"),
            React.createElement("input", { type: "month", value: month, onChange: e => setMonth(e.target.value), style: { ...inputStyle, flex: 1, colorScheme: "light", fontFamily: "var(--mono)", fontWeight: 700 } })),
        React.createElement("div", { style: { background: "linear-gradient(135deg,rgba(200,116,63,.12),rgba(200,116,63,.02))", border: "1px solid rgba(200,116,63,.3)", borderRadius: 18, padding: "18px 16px", marginBottom: 14 } },
            React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", fontWeight: 600 } },
                "PCC do zap\u0142aty za ",
                mcLabel),
            React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 900, fontSize: 30, marginTop: 4, color: "var(--copper)" } }, fmt(podatek)),
            React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", marginTop: 6, display: "flex", justifyContent: "space-between" } },
                React.createElement("span", null,
                    podlegajace.length,
                    " czynno\u015Bci \u00B7 podstawa ",
                    fmt(podstawa))),
            React.createElement("div", { style: { marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" } },
                React.createElement("span", { style: { fontSize: 14, color: "var(--muted)" } }, "Termin: do"),
                React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 14, color: "var(--text)" } }, termin))),
        React.createElement(Card, { style: { background: moznaPCC4.ok ? "rgba(21,163,74,.08)" : "rgba(217,119,6,.08)", border: `1px solid ${moznaPCC4.ok ? "rgba(21,163,74,.3)" : "rgba(217,119,6,.3)"}` } },
            React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 10 } },
                React.createElement("span", { style: { fontSize: 22 } }, moznaPCC4.ok ? "✅" : "⚠️"),
                React.createElement("div", null,
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: moznaPCC4.ok ? "var(--green)" : "var(--amber)" } }, moznaPCC4.ok ? "Możesz złożyć PCC-4 zbiorczo" : "PCC-4 niedostępne w tym miesiącu"),
                    React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", marginTop: 3, lineHeight: 1.5 } }, moznaPCC4.powod)))),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 } },
            React.createElement("button", { onClick: () => downloadText("PCC-4_" + month + ".txt", buildPCC4()), disabled: !podlegajace.length, style: { ...btnCopper, opacity: podlegajace.length ? 1 : .5, cursor: podlegajace.length ? "pointer" : "not-allowed", fontSize: 15 } },
                React.createElement(FileText, { size: 16 }),
                " Eksport TXT"),
            React.createElement("button", { onClick: () => downloadText("PCC-4_" + month + ".csv", buildCSV()), disabled: !podlegajace.length, style: { ...btnGhost, opacity: podlegajace.length ? 1 : .5, cursor: podlegajace.length ? "pointer" : "not-allowed", borderColor: "var(--copper)", color: "var(--copper)" } }, "\uD83D\uDCCA Eksport CSV")),
        React.createElement("div", { style: sectionTitle },
            "Czynno\u015Bci podlegaj\u0105ce PCC (",
            podlegajace.length,
            ")"),
        podlegajace.length === 0 ? (React.createElement(Card, null,
            React.createElement("div", { style: { color: "var(--muted)", fontSize: 15, textAlign: "center", padding: "10px 0", lineHeight: 1.5 } },
                "Brak transakcji powy\u017Cej ",
                prog,
                " z\u0142 od os\u00F3b fizycznych w tym miesi\u0105cu."))) : podlegajace.map((x, i) => (React.createElement(Card, { key: x.id, pad: 13, style: { marginBottom: 8 } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" } },
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 7 } },
                        React.createElement("span", { style: { fontFamily: "var(--mono)", fontSize: 12.5, fontWeight: 700, color: "var(--copper)", background: "rgba(200,116,63,.12)", padding: "2px 7px", borderRadius: 6 } },
                            "#",
                            i + 1),
                        React.createElement("span", { style: { fontWeight: 700, fontSize: 14 } },
                            x.osoba.imie,
                            " ",
                            x.osoba.nazwisko)),
                    React.createElement("div", { style: { fontSize: 13, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 } }, x.osoba.adres),
                    React.createElement("div", { style: { fontSize: 13, color: "var(--muted)", marginTop: 1 } },
                        fmtDateKey(x.ts),
                        " \u00B7 ",
                        x.no,
                        " \u00B7 dow. ",
                        x.osoba.dowod)),
                React.createElement("div", { style: { textAlign: "right", flexShrink: 0, marginLeft: 8 } },
                    React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 15 } }, fmt(x.wartosc)),
                    React.createElement("div", { style: { fontSize: 13, color: "var(--copper)", fontWeight: 700, marginTop: 2 } },
                        "PCC: ",
                        (x.wartosc * 0.02).toFixed(2),
                        " z\u0142")))))),
        zwolnione.length > 0 && (React.createElement(React.Fragment, null,
            React.createElement("div", { style: sectionTitle },
                "Zwolnione z PCC (\u2264 ",
                prog,
                " z\u0142) \u2014 ",
                zwolnione.length),
            React.createElement(Card, { pad: 4 }, zwolnione.map((x, i) => (React.createElement("div", { key: x.id, style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", borderBottom: i < zwolnione.length - 1 ? "1px solid var(--line)" : "none" } },
                React.createElement("div", null,
                    React.createElement("span", { style: { fontSize: 14.5, fontWeight: 600 } },
                        x.osoba.imie,
                        " ",
                        x.osoba.nazwisko),
                    React.createElement("div", { style: { fontSize: 12.5, color: "var(--faint)" } }, x.no)),
                React.createElement("span", { style: { fontFamily: "var(--mono)", fontSize: 14.5, color: "var(--muted)" } }, fmt(txTotal(x))))))))),
        React.createElement(Card, { style: { marginTop: 14, background: "var(--surface2)" } },
            React.createElement("div", { style: { fontWeight: 700, fontSize: 14.5, marginBottom: 8 } }, "\uD83D\uDCCB Zasady PCC-4 dla skupu"),
            React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 } },
                "\u2022 PCC ",
                React.createElement("b", { style: { color: "var(--text)" } }, "2%"),
                " p\u0142aci ",
                React.createElement("b", { style: { color: "var(--text)" } }, "nabywca"),
                " (skup) od zakupu od os\u00F3b fizycznych.",
                React.createElement("br", null),
                "\u2022 Transakcje ",
                React.createElement("b", { style: { color: "var(--text)" } }, "do 1000 z\u0142 s\u0105 zwolnione"),
                " ustawowo.",
                React.createElement("br", null),
                "\u2022 Zakup od ",
                React.createElement("b", { style: { color: "var(--text)" } }, "firm (VAT) \u2014 zwolniony"),
                " niezale\u017Cnie od kwoty (nie wchodzi tu).",
                React.createElement("br", null),
                "\u2022 PCC-4 zbiorczo: ",
                React.createElement("b", { style: { color: "var(--text)" } }, "min. 3 czynno\u015Bci"),
                ", 3. w ci\u0105gu 14 dni od 1.",
                React.createElement("br", null),
                "\u2022 Termin: ",
                React.createElement("b", { style: { color: "var(--text)" } }, "do 7 dnia"),
                " nast\u0119pnego miesi\u0105ca.",
                React.createElement("br", null),
                "\u2022 Formularz w ",
                React.createElement("b", { style: { color: "var(--text)" } }, "e-Deklaracje"),
                " (podatki.gov.pl).")),
        React.createElement("div", { style: { fontSize: 12.5, color: "var(--faint)", marginTop: 10, lineHeight: 1.5, textAlign: "center" } }, "Dokument pomocniczy \u2014 zweryfikuj z ksi\u0119gowym przed wys\u0142aniem do US.")));
}
/* ─────────── Księgowość ─────────── */
function Ksiegowosc({ tx, materials, stock, company, dispatch }) {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [activeTab, setActiveTab] = useState("rozliczenie");
    const [grupa, setGrupa] = useState("finanse");
    const GROUPS = [
        ["finanse", "💰 Finanse", [["rozliczenie", "Rozliczenie"], ["zysk", "Kalkulator zysku"], ["rentownosc", "Rentowność"], ["historia", "Historia"]]],
        ["podatki", "🧾 Podatki", [["pcc4", "PCC-4"], ["kup", "Koszty KUP"]]],
        ["wiecej", "💡 Więcej", [["optym", "Optymalizacja"], ["checklist", "Obowiązki"]]],
    ];
    const [kupItems, setKupItems] = useState(() => { try {
        const s = localStorage.getItem("sk_kup_v1");
        return s ? JSON.parse(s) : [];
    }
    catch {
        return [];
    } });
    const [kupOpen, setKupOpen] = useState(false);
    const [kupEdit, setKupEdit] = useState(null);
    const saveKup = (items) => { setKupItems(items); try {
        localStorage.setItem("sk_kup_v1", JSON.stringify(items));
    }
    catch { } };
    const inM = (tx || []).filter((x) => fmtDateKey(x.ts).slice(0, 7) === month);
    const tot = inM.reduce((a, x) => a + txTotal(x), 0);
    const pay = (k) => inM.filter((x) => x.payment === k).reduce((a, x) => a + txTotal(x), 0);
    const fpo = inM.filter((x) => x.kind === "FPO");
    const kpo = inM.filter((x) => x.kind === "KPO");
    const fpoTot = fpo.reduce((a, x) => a + txTotal(x), 0);
    const pcc = fpoTot * 0.02;
    const magVal = materials.reduce((a, m) => a + (stock[m.id] || 0) * m.buy, 0);
    const mass = inM.reduce((a, x) => a + txMass(x), 0);
    const kupMonth = kupItems.filter(k => (k.date || "").slice(0, 7) === month);
    const kupTot = kupMonth.reduce((a, k) => a + (parseFloat(k.netto) || 0), 0);
    const W = calcWynik(tx, dispatch, materials, (k) => k.slice(0, 7) === month);
    const dochod = W.marza - kupTot;
    const KUP_CATS = ["Paliwo / transport", "Najem placu / hali", "Media (prąd, woda, gaz)", "Telefon / internet", "Pracownicy (wynagrodzenia)", "ZUS własny", "Obsługa księgowa", "Leasing samochodu", "Waga / sprzęt (amortyzacja)", "Materiały biurowe", "Opłaty BDO", "PCC zapłacone", "Inne koszty firmowe"];
    const buildStatement = () => {
        let t = "ZESTAWIENIE KSIEGOWE — " + month + "\n" + (company?.name || "(punkt skupu)") + "\n";
        t += "=".repeat(42) + "\n\n";
        t += "PRZYCHODY:\n";
        t += "  Liczba transakcji: " + inM.length + "  (FPO " + fpo.length + ", KPO " + kpo.length + ")\n";
        t += "  Masa skupiona:     " + (Math.round(mass * 10) / 10) + " kg\n";
        t += "  Wartość skupu:     " + tot.toFixed(2) + " zl\n";
        t += "    gotowka:         " + pay("gotowka").toFixed(2) + " zl\n";
        t += "    przelew:         " + pay("przelew").toFixed(2) + " zl\n";
        t += "    BLIK:            " + pay("blik").toFixed(2) + " zl\n\n";
        t += "KOSZTY UZYSKANIA PRZYCHODU (KUP):\n";
        kupMonth.forEach(k => { t += "  " + (k.cat || "Inne").padEnd(28) + k.netto?.toFixed(2) + " zl\n"; });
        t += "  RAZEM KUP:         " + kupTot.toFixed(2) + " zl\n\n";
        t += "SPRZEDAŻ DO HUTY (szac. wg cennika sprzedaży): " + W.sprzedaz.toFixed(2) + " zl\n";
        t += "MARŻA NA SPRZEDANYM TOWARZE: " + W.marza.toFixed(2) + " zl\n";
        t += "ZYSK SZACUNKOWY (marża − KUP, przed podatkiem): " + dochod.toFixed(2) + " zl\n\n";
        t += "PODATKI:\n";
        t += "  PCC 2% (od FPO):   " + pcc.toFixed(2) + " zl\n";
        t += "  FPO wartość:       " + fpoTot.toFixed(2) + " zl\n\n";
        t += "MAGAZYN:\n";
        t += "  Wartość (ceny skup): " + magVal.toFixed(2) + " zl\n\n";
        t += "Wygenerowano: " + new Date().toLocaleString("pl-PL") + "\n";
        t += "UWAGA: Zestawienie pomocnicze. Weryfikuj z ksiegowym.\n";
        return t;
    };
    const CHECKLIST = [
        { id: "pcc", label: "PCC-4 złożony (do 7 dnia nast. miesiąca)", help: "Deklaracja zbiorcza PCC za wszystkie transakcje FPO w miesiącu. Stawka 2% od wartości FPO." },
        { id: "jpk", label: "JPK_V7 wysłany (do 25 dnia nast. miesiąca)", help: "Plik JPK z ewidencją VAT — wysyłasz online przez e-Deklaracje lub program księgowy." },
        { id: "kpir", label: "KPiR uzupełniona na bieżąco", help: "Każda transakcja zakupu złomu i kosztu musi być wpisana do Książki Przychodów i Rozchodów." },
        { id: "pit", label: "Zaliczka PIT zapłacona (do 20 dnia)", help: "Miesięczna lub kwartalna zaliczka na podatek dochodowy. Kalkulator: dochód × stawka (12%/19%)." },
        { id: "zus", label: "ZUS zapłacony (do 15 lub 20 dnia)", help: "ZUS społeczny (do 10 dnia), ZUS zdrowotny (do 20 dnia) — dla JDG. Preferencyjne przez 24 mies. dla nowych." },
        { id: "bdo", label: "Ewidencja BDO/KEO zaktualizowana", help: "Każdy skup odpadów musi być wpisany do rejestru BDO (Baza Danych Odpadowych). Raport roczny do końca lutego." },
        { id: "ksef", label: "Faktury sprzedaży w KSeF (od 2026)", help: "Od 2026 obowiązkowy Krajowy System e-Faktur dla VAT-owców. Faktury wystawiasz elektronicznie." },
        { id: "fpo", label: "FPO/KPO skompletowane i podpisane", help: "Formularz Potwierdzenia Obrotu (dla os. fiz.) i Karta Przekazania Odpadów (dla firm) — dokumentacja każdej transakcji." },
    ];
    const [checked, setChecked] = useState(() => { try {
        const s = localStorage.getItem("sk_chk_" + month);
        return s ? JSON.parse(s) : {};
    }
    catch {
        return {};
    } });
    const toggleCheck = (id) => {
        const n = { ...checked, [id]: !checked[id] };
        setChecked(n);
        try {
            localStorage.setItem("sk_chk_" + month, JSON.stringify(n));
        }
        catch { }
    };
    const OPTYMALIZACJE = [
        { t: "PCC-4 zamiast PCC-3", sav: "⭐⭐⭐⭐⭐", desc: "Zamiast składać PCC-3 po każdej transakcji (14 dni), złóż JEDNĄ deklarację PCC-4 do 7 dnia następnego miesiąca. Ten sam efekt, 100× mniej papierkowej roboty. To Twój największy time-saver.", tag: "Obowiązki" },
        { t: "Samochód ciężarowy / VAN (N1)", sav: "⭐⭐⭐⭐", desc: "Jeśli pojazd ma homologację N1 (ciężarowy do 3,5t, 2 miejsca) → 100% VAT odliczasz i 100% kosztów (paliwo, ubezpieczenie, naprawy) wpisujesz w KUP. Brak limitu 150 tys. zł i brak proporcji 75/100.", tag: "Pojazd" },
        { t: "Leasing operacyjny zamiast zakupu", sav: "⭐⭐⭐⭐", desc: "Każda rata leasingu operacyjnego = 100% koszt (dla N1). Dla samochodu osobowego rata w 100% jako koszt (bez limitu amortyzacji). Dodatkowo: nie mrożysz gotówki, masz nowy sprzęt co 2-3 lata.", tag: "Pojazd" },
        { t: "Jednorazowa amortyzacja (waga, sprzęt)", sav: "⭐⭐⭐", desc: "Środki trwałe do 50 000 EUR rocznie możesz zamortyzować jednorazowo (nie przez 5 lat). Waga przemysłowa, wózek widłowy, kontener — zapisujesz CAŁY koszt w roku zakupu, obniżasz podatek od razu.", tag: "Majątek" },
        { t: "Mały podatnik = kwartalny VAT", sav: "⭐⭐⭐", desc: "Jeśli obrót < 9,218 mln PLN → jesteś małym podatnikiem i możesz płacić VAT kwartalnie + stosować metodę kasową (VAT płacisz dopiero gdy dostaniesz zapłatę). Lepszy cash flow.", tag: "VAT" },
        { t: "Odliczenie PCC jako KUP", sav: "⭐⭐⭐", desc: "Zapłacone PCC (2% od FPO) jest Twoim kosztem uzyskania przychodu — wpisujesz je do KPiR jako koszt. Wiele skupów o tym nie wie i przepłaca podatek dochodowy.", tag: "PIT" },
        { t: "ZUS preferencyjny (nowy przedsiębiorca)", sav: "⭐⭐⭐⭐", desc: "Przez pierwsze 6 miesięcy: ulga na start (0 zł ZUS społeczny). Kolejne 24 miesiące: mały ZUS (~400 zł/mc zamiast ~1800 zł). Łącznie oszczędność 30-40 tys. zł. Tylko dla nowych firm.", tag: "ZUS" },
        { t: "Małe ZUS (mały ZUS plus)", sav: "⭐⭐⭐", desc: "Po 2 latach preferencji: Mały ZUS Plus = podstawa wymiaru od przychodu. Dla przychodów < 120 tys. zł/rok składki znacznie niższe niż pełny ZUS. Zgłoś do ZUS do 31 stycznia.", tag: "ZUS" },
        { t: "Podatek liniowy (19%) zamiast skali", sav: "⭐⭐⭐", desc: "Przy dochodzie powyżej ~120 tys. zł/rok podatek liniowy 19% = niższy niż 32% skali podatkowej. Plus: tylko jedna stawka, przewidywalne koszty. Wniosek do 20 dnia kolejnego roku.", tag: "PIT" },
        { t: "Sp. z o.o. + Estoński CIT", sav: "⭐⭐⭐⭐", desc: "Przy dochodzie > 300-400 tys. zł/rok: spółka z o.o. płaci CIT 9% (mały podatnik). Estoński CIT = 0% dopóki zysk zostaje w firmie, 10% gdy wypłacasz. Najlepsza opcja do reinwestowania w sprzęt.", tag: "Spółka" },
        { t: "Faktura za oprogramowanie (SkupOS)", sav: "⭐⭐", desc: "Abonament za system do zarządzania skupem = 100% koszt firmowy (KUP). Wpisz w KPiR jako usługi informatyczne. Obniżasz dochód do opodatkowania.", tag: "Oprogramowanie" },
    ];
    return (React.createElement("div", { style: { padding: "0 16px" } },
        React.createElement("header", { style: { paddingTop: 24 } },
            React.createElement("h1", { style: { margin: 0, fontFamily: "var(--display)", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" } }, "Papiery i podatki"),
            React.createElement("div", { style: { color: "var(--muted)", fontSize: 14.5, marginTop: 2 } }, "Zestawienia \u00B7 Podatki \u00B7 Optymalizacja")),
        React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 14 } }, GROUPS.map(([gid, glbl, views]) => (React.createElement("button", { key: gid, onClick: () => { setGrupa(gid); setActiveTab(views[0][0]); }, style: { flex: 1, padding: "9px 8px", borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: "pointer", border: grupa === gid ? "1.5px solid var(--copper)" : "1px solid var(--line2)", background: grupa === gid ? "rgba(200,116,63,.12)" : "var(--surface)", color: grupa === gid ? "var(--copper)" : "var(--muted)" } }, glbl)))),
        React.createElement("div", { style: { display: "flex", gap: 5, marginTop: 8, overflowX: "auto", paddingBottom: 2 } }, (GROUPS.find(g => g[0] === grupa) || GROUPS[0])[2].map(([id, lbl]) => (React.createElement("button", { key: id, onClick: () => setActiveTab(id), style: { flexShrink: 0, padding: "7px 12px", borderRadius: 9, fontSize: 13.5, fontWeight: 700, cursor: "pointer", border: "none", background: activeTab === id ? "var(--copper)" : "var(--surface2)", color: activeTab === id ? "#fff" : "var(--muted)" } }, lbl)))),
        activeTab === "rozliczenie" && (React.createElement("div", { style: { marginTop: 14 } },
            React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", marginBottom: 12 } },
                React.createElement("label", { style: { fontSize: 14, color: "var(--muted)", fontWeight: 600 } }, "Miesi\u0105c:"),
                React.createElement("input", { type: "month", value: month, onChange: (e) => setMonth(e.target.value), style: { ...inputStyle, flex: 1, colorScheme: "light", fontFamily: "var(--mono)", fontWeight: 700 } })),
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 } }, [["Wydano na skup", pln(tot), null], ["Sprzeda\u017C do huty (szac.)", pln(W.sprzedaz), null], ["Mar\u017Ca na sprzedanym", pln(W.marza), W.marza >= 0 ? "var(--green)" : "var(--red)"], ["Zysk po kosztach KUP", pln(dochod), dochod >= 0 ? "var(--green)" : "var(--red)"]].map(([l, v, col]) => (React.createElement(Card, { key: l, pad: 13 },
                React.createElement("div", { style: { fontSize: 13, color: "var(--muted)" } }, l),
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 19, marginTop: 4, color: col || "var(--text)" } }, v))))),
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, marginBottom: 12 } }, [["Dokumenty", inM.length + " szt."], ["FPO/KPO", fpo.length + "/" + kpo.length], ["Wartość mag.", pln(magVal)]].map(([l, v]) => (React.createElement(Card, { key: l, pad: 11 },
                React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)" } }, l),
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 15, marginTop: 3 } }, v))))),
            React.createElement(Card, { style: { background: "linear-gradient(135deg,rgba(200,116,63,.08),rgba(200,116,63,.01))", border: "1px solid rgba(200,116,63,.25)" } },
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                    React.createElement("div", null,
                        React.createElement("div", { style: { fontFamily: "var(--display)", fontWeight: 700, fontSize: 14 } }, "PCC 2% do zap\u0142aty"),
                        React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 2 } }, "Od FPO (zakup od os. fiz.) \u2014 p\u0142acisz Ty jako nabywca")),
                    React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 20, color: "var(--copper)" } }, pln(pcc))),
                React.createElement("div", { style: { marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between" } },
                    React.createElement("span", { style: { fontSize: 14 } }, "Termin: do 7 dnia nast. miesi\u0105ca"),
                    React.createElement("span", { style: { fontSize: 13.5, color: "var(--muted)" } }, "PCC-4 (zbiorcza)"))),
            React.createElement(Card, { style: { marginTop: 10 } },
                React.createElement("div", { style: { fontSize: 14.5, fontWeight: 700, marginBottom: 8 } }, "Formy p\u0142atno\u015Bci"),
                [["Gotówka", pay("gotowka")], ["Przelew", pay("przelew")], ["BLIK", pay("blik")]].map(([l, v], i) => (React.createElement("div", { key: l, style: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: i ? "1px solid var(--line)" : "none" } },
                    React.createElement("span", { style: { fontWeight: 600, fontSize: 15 } }, l),
                    React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 700 } }, pln(v)))))),
            React.createElement("button", { onClick: () => downloadText("zestawienie_" + month + ".txt", buildStatement()), style: { ...btnCopper, marginTop: 14 } },
                React.createElement(FileText, { size: 18 }),
                " Pobierz zestawienie (.txt)"),
            React.createElement("div", { style: { fontSize: 12.5, color: "var(--faint)", marginTop: 8, lineHeight: 1.5, textAlign: "center" } }, "Warto\u015Bci pomocnicze \u2014 nie zast\u0119puj\u0105 profesjonalnej ksi\u0119gowo\u015Bci."))),
        activeTab === "zysk" && React.createElement(KalkulatorZysku, { materials: materials, stock: stock, tx: tx, kupMonth: kupMonth, kupTot: kupTot, month: month }),
        activeTab === "pcc4" && React.createElement(PCC4Export, { tx: tx, company: company, month: month, setMonth: setMonth }),
        activeTab === "historia" && React.createElement(HistoriaZyskow, { tx: tx, dispatch: dispatch, materials: materials, kupTot: kupTot, month: month }),
        activeTab === "rentownosc" && React.createElement(RentownoscMaterialow, { tx: tx, materials: materials, stock: stock, month: month }),
        activeTab === "checklist" && (React.createElement("div", { style: { marginTop: 14 } },
            React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", marginBottom: 12 } },
                React.createElement("label", { style: { fontSize: 14, color: "var(--muted)", fontWeight: 600 } }, "Miesi\u0105c:"),
                React.createElement("input", { type: "month", value: month, onChange: (e) => setMonth(e.target.value), style: { ...inputStyle, flex: 1, colorScheme: "light", fontFamily: "var(--mono)", fontWeight: 700 } })),
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 } },
                React.createElement("div", { style: { flex: 1, height: 6, background: "var(--surface2)", borderRadius: 9, overflow: "hidden" } },
                    React.createElement("div", { style: { height: "100%", width: (Object.values(checked).filter(Boolean).length / CHECKLIST.length * 100) + "%", background: "linear-gradient(90deg,var(--green),#10b981)", borderRadius: 9 } })),
                React.createElement("span", { style: { fontSize: 13.5, fontWeight: 700, color: "var(--green)" } },
                    Object.values(checked).filter(Boolean).length,
                    "/",
                    CHECKLIST.length)),
            CHECKLIST.map((item, i) => (React.createElement("button", { key: item.id, onClick: () => toggleCheck(item.id), style: { width: "100%", display: "flex", alignItems: "flex-start", gap: 12, background: checked[item.id] ? "rgba(21,163,74,.05)" : "var(--surface)", border: `1px solid ${checked[item.id] ? "rgba(21,163,74,.3)" : "var(--line)"}`, borderRadius: 12, padding: "13px 14px", marginBottom: 8, cursor: "pointer", color: "var(--text)", textAlign: "left" } },
                React.createElement("span", { style: { width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1, border: checked[item.id] ? "none" : "2px solid var(--copper)", background: checked[item.id] ? "var(--green)" : "transparent", display: "grid", placeItems: "center", color: "#04130a", fontSize: 14.5, fontWeight: 800 } }, checked[item.id] ? "✓" : ""),
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("div", { style: { fontSize: 15, fontWeight: 700, textDecoration: checked[item.id] ? "line-through" : "none", opacity: checked[item.id] ? .6 : 1 } }, item.label),
                    React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 3, lineHeight: 1.45 } }, item.help))))),
            React.createElement("div", { style: { marginTop: 10, padding: "12px 14px", background: "rgba(200,116,63,.07)", borderRadius: 13, border: "1px solid rgba(200,116,63,.2)" } },
                React.createElement("div", { style: { fontWeight: 700, fontSize: 14.5, marginBottom: 6 } }, "\uD83D\uDCCB Co musi by\u0107 rozliczone ka\u017Cdego miesi\u0105ca"),
                [["1-7", "PCC-4 złożony za poprzedni miesiąc"], ["do 15", "ZUS społeczny zapłacony"], ["do 20", "ZUS zdrowotny + zaliczka PIT"], ["do 25", "JPK_V7 wysłany + VAT zapłacony"], ["cały miesiąc", "KPiR uzupełniana na bieżąco, FPO/KPO skompletowane"]].map(([k, v]) => (React.createElement("div", { key: k, style: { display: "flex", gap: 10, padding: "6px 0", borderTop: "1px solid var(--line)" } },
                    React.createElement("span", { style: { fontWeight: 800, fontSize: 12.5, color: "var(--copper)", minWidth: 70, flexShrink: 0 } },
                        "Do ",
                        k),
                    React.createElement("span", { style: { fontSize: 14, color: "var(--muted)" } }, v))))))),
        activeTab === "kup" && (React.createElement("div", { style: { marginTop: 14 } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
                React.createElement("div", null,
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } },
                        "Koszty KUP \u2014 ",
                        month),
                    React.createElement("div", { style: { fontSize: 14, color: "var(--muted)" } },
                        "\u0141\u0105cznie: ",
                        pln(kupTot))),
                React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } },
                    React.createElement("input", { type: "month", value: month, onChange: (e) => setMonth(e.target.value), style: { ...inputStyle, width: 130, colorScheme: "light", fontFamily: "var(--mono)", fontWeight: 700, padding: "8px 10px" } }),
                    React.createElement("button", { onClick: () => { setKupEdit({ id: null, cat: KUP_CATS[0], date: todayStr(), netto: "", vat: "0", desc: "" }); setKupOpen(true); }, style: { ...btnCopper, width: "auto", padding: "9px 14px", fontSize: 14.5 } }, "+ Dodaj"))),
            kupMonth.length === 0 ? React.createElement(Card, null,
                React.createElement("div", { style: { color: "var(--muted)", fontSize: 15, textAlign: "center", padding: "10px 0" } }, "Brak koszt\u00F3w w tym miesi\u0105cu. Dodaj \u2191")) :
                kupMonth.map((k, i) => (React.createElement(Card, { key: k.id || i, pad: 12, style: { marginBottom: 8, cursor: "pointer" }, onClick: () => { setKupEdit(k); setKupOpen(true); } },
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                        React.createElement("div", null,
                            React.createElement("div", { style: { fontSize: 15, fontWeight: 700 } }, k.cat),
                            React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 2 } },
                                k.date,
                                k.desc ? " · " + k.desc : "")),
                        React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 16, color: "var(--red)" } },
                            "\u2212",
                            pln(parseFloat(k.netto) || 0)))))),
            React.createElement("div", { style: { marginTop: 14, padding: "12px 14px", background: "rgba(200,116,63,.07)", borderRadius: 13, border: "1px solid rgba(200,116,63,.2)" } },
                React.createElement("div", { style: { fontWeight: 700, fontSize: 14.5, marginBottom: 8 } }, "\uD83D\uDCCB Co mo\u017Cna wliczy\u0107 w KUP (koszty uzysk. przychodu)"),
                [["✅", "Zakup złomu/metali", "Cena zakupu surowca — główny koszt"], ["✅", "Paliwo / transport", "Rachunki za paliwo, autostrady (50-100% zal. od pojazdu)"], ["✅", "Najem placu / hali", "Czynsz za teren skupu, magazyn"], ["✅", "ZUS społeczny własny", "Składki ZUS (nie zdrowotna od 2022)"], ["✅", "Leasing samochodu", "Raty leasingu: 100% dla N1, ograniczone dla osobowego"], ["✅", "Waga / sprzęt", "Amortyzacja lub jednorazowa (do 50 tys. EUR/rok)"], ["✅", "PCC zapłacone", "2% PCC od FPO = koszt podatkowy! Wiele skupów nie wie"], ["✅", "Księgowość / SkupOS", "Opłaty za programy i usługi ksiegowe = 100% KUP"], ["✅", "Telefon / internet", "Część służbowa (50-100%)"], ["❌", "Kary i mandaty", "Nigdy nie są kosztem"], ["❌", "Wydatki prywatne", "Zakupy niezwiązane z działalnością"],].map(([ic, k, v]) => (React.createElement("div", { key: k, style: { display: "flex", gap: 10, padding: "6px 0", borderTop: "1px solid var(--line)" } },
                    React.createElement("span", { style: { fontSize: 14, flexShrink: 0, width: 20 } }, ic),
                    React.createElement("div", null,
                        React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, k),
                        React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)" } }, v)))))),
            React.createElement(Sheet, { open: kupOpen, onClose: () => setKupOpen(false), title: kupEdit?.id ? "Edytuj koszt" : "Nowy koszt KUP" }, kupEdit && (React.createElement(React.Fragment, null,
                React.createElement("label", { style: label }, "Kategoria"),
                React.createElement("select", { value: kupEdit.cat, onChange: e => setKupEdit({ ...kupEdit, cat: e.target.value }), style: { ...inputStyle, fontWeight: 600 } }, KUP_CATS.map(c => React.createElement("option", { key: c, value: c }, c))),
                React.createElement("label", { style: label }, "Data"),
                React.createElement("input", { type: "date", style: { ...inputStyle, colorScheme: "light" }, value: kupEdit.date, onChange: e => setKupEdit({ ...kupEdit, date: e.target.value }) }),
                React.createElement("label", { style: label }, "Kwota netto (z\u0142)"),
                React.createElement("input", { type: "number", step: "0.01", style: { ...inputStyle, fontFamily: "var(--mono)", fontWeight: 700, fontSize: 20 }, value: kupEdit.netto, onChange: e => setKupEdit({ ...kupEdit, netto: e.target.value }), placeholder: "0.00" }),
                React.createElement("label", { style: label }, "VAT (%)"),
                React.createElement("div", { style: { display: "flex", gap: 7 } }, [["0", "0%"], ["8", "8%"], ["23", "23%"]].map(([v, l]) => React.createElement("button", { key: v, onClick: () => setKupEdit({ ...kupEdit, vat: v }), style: { flex: 1, padding: "9px", borderRadius: 9, cursor: "pointer", fontSize: 14.5, fontWeight: 700, border: kupEdit.vat === v ? "1.5px solid var(--copper)" : "1px solid var(--line2)", background: kupEdit.vat === v ? "rgba(200,116,63,.1)" : "var(--surface)", color: kupEdit.vat === v ? "var(--copper)" : "var(--muted)" } }, l))),
                React.createElement("label", { style: label }, "Opis (opcjonalnie)"),
                React.createElement("input", { style: inputStyle, value: kupEdit.desc, onChange: e => setKupEdit({ ...kupEdit, desc: e.target.value }), placeholder: "np. Faktura BP 2025-06-10" }),
                React.createElement("button", { style: { ...btnCopper, marginTop: 14 }, onClick: () => {
                        if (!(parseFloat(kupEdit.netto) > 0))
                            return;
                        const item = { ...kupEdit, id: kupEdit.id || uid() };
                        if (kupEdit.id)
                            saveKup(kupItems.map(k => k.id === kupEdit.id ? item : k));
                        else
                            saveKup([...kupItems, item]);
                        setKupOpen(false);
                    } }, "Zapisz koszt"),
                kupEdit.id && React.createElement("button", { style: { ...btnGhost, marginTop: 8, color: "var(--red)", borderColor: "rgba(220,38,38,.3)" }, onClick: () => { saveKup(kupItems.filter(k => k.id !== kupEdit.id)); setKupOpen(false); } }, "Usu\u0144")))))),
        activeTab === "optym" && (React.createElement("div", { style: { marginTop: 14 } },
            React.createElement(Card, { style: { background: "rgba(200,116,63,.08)", border: "1px solid rgba(200,116,63,.3)", marginBottom: 14 } },
                React.createElement("div", { style: { fontSize: 14.5, lineHeight: 1.6 } },
                    "Poni\u017Csze metody s\u0105 ",
                    React.createElement("b", null, "w 100% legalne"),
                    ". To nie jest unikanie podatk\u00F3w \u2014 to ",
                    React.createElement("b", null, "korzystanie z prawa podatkowego"),
                    ", kt\u00F3re zosta\u0142o stworzone w\u0142a\u015Bnie po to, by przedsi\u0119biorcy mogli je stosowa\u0107. Skonsultuj ka\u017Cd\u0105 z biurem rachunkowym zanim wdro\u017Cysz.")),
            OPTYMALIZACJE.map((o, i) => (React.createElement(Card, { key: i, style: { marginBottom: 10 } },
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 } },
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, o.t),
                    React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center", flexShrink: 0, marginLeft: 8 } },
                        React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700, color: "var(--copper)", background: "rgba(200,116,63,.12)", padding: "2px 8px", borderRadius: 7 } }, o.tag))),
                React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", lineHeight: 1.55, marginBottom: 6 } }, o.desc),
                React.createElement("div", { style: { fontSize: 14 } },
                    "Potencja\u0142 oszcz\u0119dno\u015Bci: ",
                    o.sav)))),
            React.createElement(Card, { style: { marginTop: 6, background: "rgba(21,163,74,.07)", border: "1px solid rgba(21,163,74,.25)" } },
                React.createElement("div", { style: { fontWeight: 700, fontSize: 14, marginBottom: 8 } }, "\uD83D\uDCB8 Ile mo\u017Cna zaoszcz\u0119dzi\u0107 realnie?"),
                [["PCC-4 (oszczędność czasu)", "~5-10 h/miesiąc mniej administracji"], ["Samochód N1 vs osobowy", "2 000-6 000 zł/rok więcej w KUP"], ["Jednorazowa amortyzacja sprzętu", "15-30% ceny sprzętu od razu jako koszt"], ["ZUS preferencyjny (nowy przedsięb.)", "~30 000-40 000 zł przez 2,5 roku"], ["Podatek liniowy vs skala (>120k)", "Do 40 000 zł/rok przy dużych dochodach"], ["Estoński CIT (spółka)", "Nawet 30-50% niższe podatki przy reinwestowaniu"],].map(([k, v]) => (React.createElement("div", { key: k, style: { display: "flex", gap: 10, padding: "8px 0", borderTop: "1px solid var(--line)" } },
                    React.createElement("div", { style: { flex: 1 } },
                        React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, k),
                        React.createElement("div", { style: { fontSize: 13.5, color: "var(--green)" } }, v))))))))));
}
/* ─────────── Panel kierowcy (prosty ekran odbiorów) ─────────── */
function KierowcaHome({ pickups, setPickups, currentUser }) {
    const today = todayStr();
    const aktywne = (pickups || []).filter((p) => p.status !== "done").sort((a, b) => (a.due || "9").localeCompare(b.due || "9"));
    const dzis = aktywne.filter((p) => p.due === today);
    const pozniej = aktywne.filter((p) => p.due !== today);
    const zrobioneDzis = (pickups || []).filter((p) => p.status === "done" && p.doneAt && new Date(p.doneAt).toISOString().slice(0, 10) === today);
    const oznacz = (p) => setPickups(pickups.map((x) => x.id === p.id ? { ...x, status: "done", doneAt: Date.now() } : x));
    const cofnij = (p) => setPickups(pickups.map((x) => x.id === p.id ? { ...x, status: "planned", doneAt: null } : x));
    const nawiguj = (addr) => { if (addr)
        window.open("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(addr), "_blank"); };
    const Karta = (p) => (React.createElement(Card, { key: p.id, style: { marginBottom: 12, padding: 0, overflow: "hidden" } },
        p.priority === "high" && React.createElement("div", { style: { background: "var(--red)", color: "#fff", fontSize: 12.5, fontWeight: 800, padding: "5px 15px", letterSpacing: ".05em" } }, "\uD83D\uDEA8 PILNY ODBI\u00D3R"),
        React.createElement("div", { style: { padding: 15 } },
            React.createElement("div", { style: { fontWeight: 800, fontSize: 17 } }, p.contractor || "Odbiór"),
            p.address && React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", marginTop: 4, lineHeight: 1.4 } },
                "\uD83D\uDCCD ",
                p.address),
            React.createElement("div", { style: { display: "flex", gap: 16, marginTop: 11, flexWrap: "wrap" } },
                p.material && React.createElement("span", { style: { fontSize: 15, fontWeight: 600 } },
                    "\uD83D\uDD29 ",
                    p.material),
                p.qtyKg && React.createElement("span", { style: { fontSize: 15, fontWeight: 600 } },
                    "\u2696\uFE0F ~",
                    p.qtyKg,
                    " kg")),
            p.note && React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", marginTop: 9, padding: "9px 11px", background: "var(--surface2)", borderRadius: 9, lineHeight: 1.45 } },
                "\uD83D\uDCDD ",
                p.note),
            React.createElement("div", { style: { display: "flex", gap: 9, marginTop: 14 } },
                p.address && React.createElement("button", { onClick: () => nawiguj(p.address), style: { flex: 1, padding: "14px", borderRadius: 12, border: "none", background: "var(--copper)", color: "#fff", fontWeight: 800, fontSize: 14.5, cursor: "pointer" } }, "\uD83E\uDDED Nawiguj"),
                p.phone && React.createElement("a", { href: "tel:" + p.phone, style: { flex: 1, padding: "14px", borderRadius: 12, background: "var(--surface2)", color: "var(--text)", fontWeight: 800, fontSize: 14.5, textDecoration: "none", textAlign: "center" } }, "\uD83D\uDCDE Zadzwo\u0144")),
            React.createElement("button", { onClick: () => oznacz(p), style: { width: "100%", marginTop: 9, padding: "14px", borderRadius: 12, border: "1.5px solid var(--green)", background: "rgba(21,163,74,.12)", color: "var(--green)", fontWeight: 800, fontSize: 14.5, cursor: "pointer" } }, "\u2713 Odebrane"))));
    return (React.createElement("div", { style: { padding: "0 16px 40px" } },
        React.createElement("header", { style: { paddingTop: 26 } },
            React.createElement("div", { style: { fontSize: 14.5, color: "var(--muted)" } },
                "Cze\u015B\u0107, ",
                (currentUser && currentUser.name ? currentUser.name.split(" ")[0] : "Kierowco"),
                " \uD83D\uDC4B"),
            React.createElement("h1", { style: { margin: "3px 0 0", fontFamily: "var(--display)", fontSize: 27, fontWeight: 800, letterSpacing: "-.02em" } }, "Twoje odbiory")),
        React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 18 } },
            React.createElement(Card, { pad: 15, style: { flex: 1, textAlign: "center" } },
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 28, color: "var(--copper)" } }, dzis.length),
                React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 2 } }, "na dzi\u015B")),
            React.createElement(Card, { pad: 15, style: { flex: 1, textAlign: "center" } },
                React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 28, color: "var(--green)" } }, zrobioneDzis.length),
                React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 2 } }, "odebrane dzi\u015B"))),
        dzis.length > 0 && (React.createElement(React.Fragment, null,
            React.createElement("div", { style: { ...sectionTitle, marginTop: 22 } }, "\uD83D\uDCC5 Na dzi\u015B"),
            dzis.map(Karta))),
        pozniej.length > 0 && (React.createElement(React.Fragment, null,
            React.createElement("div", { style: { ...sectionTitle, marginTop: 18 } }, "Kolejne odbiory"),
            pozniej.map(Karta))),
        aktywne.length === 0 && (React.createElement(Card, { style: { textAlign: "center", padding: 44, marginTop: 18, color: "var(--muted)" } },
            React.createElement("div", { style: { fontSize: 42, marginBottom: 10 } }, "\u2705"),
            React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: "var(--text)" } }, "Brak odbior\u00F3w"),
            React.createElement("div", { style: { fontSize: 15, marginTop: 4 } }, "Nie masz teraz nic do odebrania. Odpocznij!"))),
        zrobioneDzis.length > 0 && (React.createElement(React.Fragment, null,
            React.createElement("div", { style: { ...sectionTitle, marginTop: 22 } },
                "\u2713 Odebrane dzi\u015B (",
                zrobioneDzis.length,
                ")"),
            zrobioneDzis.map((p) => (React.createElement(Card, { key: p.id, pad: 13, style: { marginBottom: 9, opacity: 0.65 } },
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                    React.createElement("div", null,
                        React.createElement("div", { style: { fontWeight: 700, fontSize: 14, textDecoration: "line-through" } }, p.contractor || "Odbiór"),
                        p.address && React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 2 } }, p.address)),
                    React.createElement("button", { onClick: () => cofnij(p), style: { fontSize: 13.5, color: "var(--muted)", background: "none", border: "1px solid var(--line2)", borderRadius: 8, padding: "6px 11px", fontWeight: 600, cursor: "pointer", flexShrink: 0 } }, "Cofnij")))))))));
}
/* ─────────── Wywozy i odbiory (planer) ─────────── */
const PRIO = {
    high: { label: "Wysoki", c: "#dc2626", bg: "rgba(220,38,38,.12)", days: 1 },
    medium: { label: "Średni", c: "#d97706", bg: "rgba(217,119,6,.12)", days: 3 },
    low: { label: "Niski", c: "#15a34a", bg: "rgba(21,163,74,.12)", days: 7 },
};
const addDaysKey = (dateKey, n) => { const d = new Date((dateKey || todayStr()) + "T00:00:00"); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
// automatyczne, "średnie" wyliczenie ile dni powinno zająć zlecenie
const estDays = (pri, qty) => { const base = (PRIO[pri] || PRIO.medium).days; const q = parseFloat(qty) || 0; const extra = q > 1000 ? Math.ceil((q - 1000) / 2000) : 0; return base + extra; };
function Wywozy({ pickups, setPickups }) {
    const [open, setOpen] = useState(false);
    const [edit, setEdit] = useState(null);
    const [needDate, setNeedDate] = useState(false);
    const col = (d) => d < 0 ? "var(--red)" : d <= 2 ? "var(--amber)" : "var(--green)";
    const [calRef, setCalRef] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
    const [dayFilter, setDayFilter] = useState(null);
    const keyOf = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
    const openOrders = (pickups || []).filter((p) => p.status !== "done");
    const overdue = openOrders.filter((p) => daysTo(p.due) < 0).length;
    const doneOnes = (pickups || []).filter((p) => p.status === "done" && p.doneAt && p.created);
    const avgDays = doneOnes.length ? Math.round(doneOnes.reduce((a, p) => a + Math.max(0, (p.doneAt - new Date(p.created + "T00:00:00").getTime()) / 86400000), 0) / doneOnes.length * 10) / 10 : null;
    const PW = { high: 0, medium: 1, low: 2 };
    const list = (pickups || []).slice().sort((a, b) => {
        if ((a.status === "done") !== (b.status === "done"))
            return a.status === "done" ? 1 : -1;
        if (PW[a.priority] !== PW[b.priority])
            return (PW[a.priority] ?? 1) - (PW[b.priority] ?? 1);
        return a.due < b.due ? -1 : a.due > b.due ? 1 : 0;
    });
    const shown = dayFilter ? list.filter((p) => p.due === dayFilter) : list;
    const byDay = {};
    (pickups || []).forEach((p) => { if (p.due)
        (byDay[p.due] = byDay[p.due] || []).push(p); });
    const cy = calRef.getFullYear(), cmo = calRef.getMonth();
    let startW = new Date(cy, cmo, 1).getDay();
    startW = (startW + 6) % 7;
    const daysIn = new Date(cy, cmo + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startW; i++)
        cells.push(null);
    for (let dd = 1; dd <= daysIn; dd++)
        cells.push(new Date(cy, cmo, dd));
    const monthLabel = calRef.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
    const todayKey = todayStr();
    const openNew = () => { setNeedDate(false); setEdit({ id: null, contractor: "", address: "", phone: "", material: "", qtyKg: "", priority: "medium", note: "", created: todayStr(), due: dayFilter || "", manual: !!dayFilter, status: "planned" }); setOpen(true); };
    const suggested = edit ? addDaysKey(edit.created, estDays(edit.priority, edit.qtyKg)) : "";
    const saveOrder = () => {
        if (!edit.contractor.trim() && !edit.address.trim())
            return;
        if (!edit.due) {
            setNeedDate(true);
            return;
        }
        const rec = { ...edit, due: edit.due };
        delete rec.manual;
        if (edit.id)
            setPickups(pickups.map((p) => p.id === edit.id ? rec : p));
        else
            setPickups([...pickups, { ...rec, id: uid() }]);
        setOpen(false);
    };
    const toggleDone = (p) => setPickups(pickups.map((x) => x.id === p.id ? { ...x, status: x.status === "done" ? "planned" : "done", doneAt: x.status === "done" ? null : Date.now() } : x));
    const KPI = ({ v, l, c }) => (React.createElement(Card, { pad: 13 },
        React.createElement("div", { style: { fontSize: 13, color: "var(--muted)", fontWeight: 600 } }, l),
        React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 21, marginTop: 5, color: c || "var(--text)" } }, v)));
    return (React.createElement("div", { style: { padding: "0 16px" } },
        React.createElement("header", { style: { paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" } },
            React.createElement("div", null,
                React.createElement("h1", { style: { margin: 0, fontFamily: "var(--display)", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" } }, "Wywozy"),
                React.createElement("div", { style: { color: "var(--muted)", fontSize: 14.5, marginTop: 2 } }, "Planer odbior\u00F3w i wywoz\u00F3w z\u0142omu")),
            React.createElement(Truck, { size: 26, color: "var(--copper)" })),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, marginTop: 16 } },
            React.createElement(KPI, { v: openOrders.length, l: "Zaplanowane" }),
            React.createElement(KPI, { v: overdue, l: "Po terminie", c: overdue ? "var(--red)" : undefined }),
            React.createElement(KPI, { v: avgDays != null ? avgDays + " dni" : "—", l: "\u015Ar. czas" })),
        React.createElement(Card, { pad: 12, style: { marginTop: 14 } },
            React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 } },
                React.createElement("button", { onClick: () => setCalRef(new Date(cy, cmo - 1, 1)), style: iconBtn },
                    React.createElement(ChevronLeft, { size: 18 })),
                React.createElement("span", { style: { fontFamily: "var(--display)", fontWeight: 700, fontSize: 15, textTransform: "capitalize" } }, monthLabel),
                React.createElement("button", { onClick: () => setCalRef(new Date(cy, cmo + 1, 1)), style: iconBtn },
                    React.createElement(ChevronRight, { size: 18 }))),
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 } }, ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"].map((w) => React.createElement("div", { key: w, style: { textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--faint)" } }, w))),
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 } }, cells.map((dt, i) => {
                if (!dt)
                    return React.createElement("div", { key: "e" + i });
                const k = keyOf(dt);
                const orders = (byDay[k] || []).slice().sort((a, b) => (PW[a.priority] ?? 1) - (PW[b.priority] ?? 1));
                const isToday = k === todayKey;
                const sel = dayFilter === k;
                const has = orders.length > 0;
                return (React.createElement("button", { key: k, onClick: () => setDayFilter(sel ? null : (has ? k : null)), style: { aspectRatio: "1 / 1", borderRadius: 9, cursor: has ? "pointer" : "default", border: sel ? "1.5px solid var(--copper)" : "1px solid transparent", background: sel ? "rgba(200,116,63,.1)" : isToday ? "rgba(43,52,64,.06)" : "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: 0, color: "var(--text)" } },
                    React.createElement("span", { style: { fontSize: 14, fontWeight: isToday ? 800 : 500, fontFamily: "var(--mono)" } }, dt.getDate()),
                    React.createElement("span", { style: { display: "flex", gap: 2, height: 5, alignItems: "center" } }, orders.slice(0, 3).map((o, j) => React.createElement("span", { key: j, style: { width: 5, height: 5, borderRadius: 99, background: (PRIO[o.priority] || PRIO.medium).c } })))));
            }))),
        React.createElement("div", { style: { ...sectionTitle, display: "flex", justifyContent: "space-between", alignItems: "center" } },
            React.createElement("span", null, dayFilter ? "Zlecenia: " + dayFilter : "Zlecenia (wg priorytetu)"),
            React.createElement("span", { style: { display: "flex", gap: 12, alignItems: "center", textTransform: "none", letterSpacing: 0 } },
                dayFilter && React.createElement("span", { onClick: () => setDayFilter(null), style: { color: "var(--muted)", cursor: "pointer", fontSize: 13.5 } }, "poka\u017C wszystkie"),
                React.createElement("span", { onClick: openNew, style: { color: "var(--copper)", cursor: "pointer", fontSize: 14 } }, "+ Dodaj"))),
        shown.length === 0 ? React.createElement(Card, null,
            React.createElement("div", { style: { color: "var(--muted)", fontSize: 15, textAlign: "center", padding: "12px 0" } }, dayFilter ? "Brak zleceń w tym dniu. Dodaj ↑" : "Brak zleceń. Dodaj pierwszy wywóz lub odbiór ↑")) :
            shown.map((p) => {
                const pr = PRIO[p.priority] || PRIO.medium;
                const d = daysTo(p.due);
                const isDone = p.status === "done";
                return (React.createElement(Card, { key: p.id, pad: 13, style: { marginBottom: 9, opacity: isDone ? .62 : 1 } },
                    React.createElement("div", { style: { display: "flex", gap: 11 } },
                        React.createElement("button", { onClick: () => toggleDone(p), title: "Zrealizowano", style: { width: 26, height: 26, borderRadius: 8, flexShrink: 0, marginTop: 1, cursor: "pointer", border: isDone ? "none" : "2px solid var(--line2)", background: isDone ? "var(--green)" : "transparent", display: "grid", placeItems: "center", padding: 0 } }, isDone && React.createElement(Check, { size: 16, color: "#fff", strokeWidth: 3 })),
                        React.createElement("div", { style: { flex: 1, minWidth: 0, cursor: "pointer" }, onClick: () => { setEdit({ ...p, manual: true }); setOpen(true); } },
                            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 } },
                                React.createElement("span", { style: { fontSize: 14.5, fontWeight: 700, textDecoration: isDone ? "line-through" : "none" } }, p.contractor || p.address || "Zlecenie"),
                                React.createElement("span", { style: { fontSize: 11.5, fontWeight: 800, padding: "3px 8px", borderRadius: 99, background: pr.bg, color: pr.c, whiteSpace: "nowrap" } }, pr.label.toUpperCase())),
                            p.address && React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", marginTop: 3, display: "flex", alignItems: "center", gap: 5 } },
                                React.createElement(MapPin, { size: 12 }),
                                " ",
                                p.address),
                            (p.material || parseFloat(p.qtyKg) > 0 || p.phone) && React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 4, display: "flex", flexWrap: "wrap", gap: "2px 10px" } },
                                p.material && React.createElement("span", null, p.material),
                                parseFloat(p.qtyKg) > 0 && React.createElement("span", null,
                                    "~",
                                    kg(parseFloat(p.qtyKg))),
                                p.phone && React.createElement("span", null, p.phone)),
                            !isDone
                                ? React.createElement("div", { style: { fontSize: 14, marginTop: 6, display: "flex", alignItems: "center", gap: 6 } },
                                    React.createElement(Clock, { size: 13, color: col(d) }),
                                    React.createElement("span", { style: { color: "var(--muted)" } },
                                        "Termin ",
                                        p.due),
                                    React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 700, color: col(d) } }, d < 0 ? `${-d} dni po` : d === 0 ? "dziś" : `za ${d} dni`))
                                : React.createElement("div", { style: { fontSize: 13.5, marginTop: 6, color: "var(--green)", fontWeight: 600 } }, "Zrealizowano \u2713")))));
            }),
        React.createElement(Sheet, { open: open, onClose: () => setOpen(false), title: edit && edit.id ? "Zlecenie wywozu" : "Nowe zlecenie" }, edit && (React.createElement(React.Fragment, null,
            React.createElement("label", { style: label }, "Kontrahent / klient"),
            React.createElement("input", { style: inputStyle, value: edit.contractor, onChange: (e) => setEdit({ ...edit, contractor: e.target.value }), placeholder: "np. Firma Kowalski / Jan Nowak" }),
            React.createElement("label", { style: label }, "Adres odbioru"),
            React.createElement("input", { style: inputStyle, value: edit.address, onChange: (e) => setEdit({ ...edit, address: e.target.value }), placeholder: "ul., miejscowo\u015B\u0107" }),
            React.createElement("div", { style: { display: "flex", gap: 10 } },
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("label", { style: label }, "Telefon"),
                    React.createElement("input", { style: inputStyle, value: edit.phone, onChange: (e) => setEdit({ ...edit, phone: e.target.value }), placeholder: "\u2014" })),
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("label", { style: label }, "Szac. masa (kg)"),
                    React.createElement("input", { type: "number", inputMode: "decimal", style: { ...inputStyle, fontFamily: "var(--mono)" }, value: edit.qtyKg, onChange: (e) => setEdit({ ...edit, qtyKg: e.target.value }), placeholder: "0" }))),
            React.createElement("label", { style: label }, "Rodzaj z\u0142omu"),
            React.createElement("input", { style: inputStyle, value: edit.material, onChange: (e) => setEdit({ ...edit, material: e.target.value }), placeholder: "np. stal, mied\u017A, mix" }),
            React.createElement("label", { style: label }, "Priorytet zlecenia"),
            React.createElement("div", { style: { display: "flex", gap: 8 } }, ["high", "medium", "low"].map((k) => {
                const pr = PRIO[k];
                const on = edit.priority === k;
                return (React.createElement("button", { key: k, onClick: () => setEdit({ ...edit, priority: k }), style: { flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700, border: on ? `1.5px solid ${pr.c}` : "1px solid var(--line2)", background: on ? pr.bg : "var(--surface)", color: on ? pr.c : "var(--muted)" } }, pr.label));
            })),
            React.createElement("div", { style: { marginTop: 14, padding: "12px 13px", borderRadius: 12, background: "rgba(200,116,63,.07)", border: "1px solid rgba(200,116,63,.2)" } },
                React.createElement("div", { style: { fontSize: 13, color: "var(--copper)", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 } },
                    React.createElement(Sparkles, { size: 14 }),
                    " Podpowied\u017A terminu"),
                React.createElement("div", { style: { fontSize: 14.5, marginTop: 5, lineHeight: 1.45 } },
                    "Na podstawie priorytetu ",
                    (PRIO[edit.priority] || PRIO.medium).label.toLowerCase(),
                    parseFloat(edit.qtyKg) > 1000 ? " i dużego ładunku" : "",
                    " proponujemy ok. ",
                    React.createElement("b", null,
                        estDays(edit.priority, edit.qtyKg),
                        " dni"),
                    " \u2192 ",
                    React.createElement("b", null, suggested),
                    "."),
                React.createElement("button", { onClick: () => { setEdit({ ...edit, due: suggested, manual: true }); setNeedDate(false); }, style: { marginTop: 9, padding: "8px 13px", borderRadius: 9, border: "1px solid var(--copper)", background: "rgba(200,116,63,.12)", color: "var(--copper)", fontSize: 14, fontWeight: 700, cursor: "pointer" } }, "U\u017Cyj tego terminu")),
            React.createElement("label", { style: label }, "Termin odbioru"),
            React.createElement("input", { type: "date", style: { ...inputStyle, colorScheme: "light", borderColor: needDate ? "var(--red)" : undefined }, value: edit.due || "", onChange: (e) => { setEdit({ ...edit, due: e.target.value, manual: true }); setNeedDate(false); } }),
            needDate && React.createElement("div", { style: { color: "var(--red)", fontSize: 13.5, fontWeight: 600, marginTop: 6 } }, "Wybierz termin odbioru lub kliknij \u201EU\u017Cyj tego terminu\"."),
            React.createElement("label", { style: label }, "Notatka"),
            React.createElement("textarea", { rows: 2, style: { ...inputStyle, resize: "vertical", lineHeight: 1.4 }, value: edit.note, onChange: (e) => setEdit({ ...edit, note: e.target.value }), placeholder: "Szczeg\u00F3\u0142y, dojazd, kontener\u2026" }),
            React.createElement("button", { style: { ...btnCopper, marginTop: 16 }, onClick: saveOrder }, "Zapisz zlecenie"),
            edit.id && React.createElement("button", { style: { ...btnGhost, marginTop: 10, color: "var(--red)", borderColor: "rgba(220,38,38,.3)" }, onClick: () => { setPickups(pickups.filter((p) => p.id !== edit.id)); setOpen(false); } }, "Usu\u0144 zlecenie"))))));
}
/* ─────────── Podaplikacja KLIENTA ─────────── */
const TEAL = "#3f7d8a";
const btnTeal = { width: "100%", padding: "14px", borderRadius: 13, border: "none", cursor: "pointer", background: TEAL, color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: "var(--body)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 };
const cnorm = (s) => fnorm(String(s || "")).replace(/\s+/g, "");
function ClientApp({ materials, tx, clientProfile, setClientProfile, onExit, account, onLogout, preview, requests, setRequests, notifSeen, setNotifSeen, notifOn, onEnableNotif }) {
    const [tab, setTab] = useState("wagi");
    const [plateInput, setPlateInput] = useState("");
    const plates = clientProfile.plates || [];
    const snapshot = clientProfile.snapshot || {};
    const haveSnapshot = Object.keys(snapshot).length > 0;
    const clientId = (account && account.id) || "preview";
    const clientName = (account && account.name) || "Klient (podgląd)";
    const allReq = requests || [];
    const myReq = allReq.filter((r) => r.clientId === clientId).slice().sort((a, b) => b.ts - a.ts);
    useEffect(() => {
        if (!Object.keys(clientProfile.snapshot || {}).length && materials.length) {
            const snap = {};
            materials.forEach((m) => { snap[m.id] = m.buy; });
            setClientProfile((c) => ({ ...c, snapshot: snap }));
        }
    }, []);
    const plateSet = plates.map(cnorm);
    const mine = tx.filter((x) => x.plate && plateSet.includes(cnorm(x.plate))).slice().sort((a, b) => b.ts - a.ts);
    const latest = mine[0] || null;
    const isToday = latest && fmtDateKey(latest.ts) === todayStr();
    const rises = materials.map((m) => ({ m, prev: snapshot[m.id] })).filter((o) => o.prev != null && o.m.buy > o.prev + 0.001).map((o) => ({ m: o.m, diff: o.m.buy - o.prev }));
    const addPlate = () => { const p = plateInput.trim().toUpperCase(); if (!p || plates.includes(p)) {
        setPlateInput("");
        return;
    } setClientProfile({ ...clientProfile, plates: [...plates, p] }); setPlateInput(""); };
    const removePlate = (p) => setClientProfile({ ...clientProfile, plates: plates.filter((x) => x !== p) });
    const refreshPrices = () => { const snap = {}; materials.forEach((m) => { snap[m.id] = m.buy; }); setClientProfile({ ...clientProfile, snapshot: snap, seen: Date.now() }); };
    // wycena (kalkulator)
    const [cMat, setCMat] = useState(materials[0] ? materials[0].id : "");
    const [cW, setCW] = useState("");
    const cm = materials.find((m) => m.id === cMat);
    const cEst = cm && parseFloat(cW) > 0 ? parseFloat(cW) * cm.buy : 0;
    // wycena ze zdjęcia (symulacja AI) + wysyłka do skupu
    const [aiLoading, setAiLoading] = useState(false);
    const [ai, setAi] = useState(null);
    const [photo, setPhoto] = useState(null);
    const [photoBusy, setPhotoBusy] = useState(false);
    const [note, setNote] = useState("");
    const [sent, setSent] = useState(false);
    const runAi = async () => {
        if (!photo)
            return;
        setAi(null);
        setAiLoading(true);
        try {
            const mt = photo.match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
            if (!mt)
                throw new Error("bad image");
            const mediaType = mt[1], b64 = mt[2];
            const lista = materials.map((x) => `${x.n} (${C[x.g].label})`).join(", ");
            const sys = `Jesteś ekspertem skupu złomu. Rozpoznaj na zdjęciu rodzaj metalu/złomu i dopasuj do JEDNEJ z kategorii cennika tego skupu: ${lista}.
WAŻNE: wagi NIE oceniaj dokładnie ze zdjęcia — podaj tylko zgrubną wielkość partii: "mała", "średnia" albo "duża".
Odpowiedz WYŁĄCZNIE czystym JSON (bez markdown): {"material":"dokładna nazwa z listy","pewnosc":"wysoka|średnia|niska","wielkosc":"mała|średnia|duża","uwaga":"krótka rada co sprawdzić na miejscu"}.
Jeśli nie masz pewności, ustaw pewnosc "niska" i wybierz najbardziej prawdopodobną kategorię.`;
            const res = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "claude-sonnet-4-6", max_tokens: 400, system: sys,
                    messages: [{ role: "user", content: [
                                { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
                                { type: "text", text: "Rozpoznaj ten złom. Odpowiedz samym JSON." },
                            ] }],
                }),
            });
            const data = await res.json();
            const txt = (data.content && data.content.map((b) => b.text || "").join("")) || "";
            const parsed = JSON.parse(txt.replace(/```json|```/g, "").trim());
            const mat = materials.find((x) => x.n.toLowerCase() === String(parsed.material || "").toLowerCase())
                || materials.find((x) => String(parsed.material || "").toLowerCase().includes(x.n.toLowerCase()))
                || materials.find((x) => x.n.toLowerCase().includes(String(parsed.material || "").toLowerCase()))
                || materials[0];
            const zakres = { "mała": [2, 15], "średnia": [15, 60], "duża": [60, 200] }[parsed.wielkosc] || [5, 40];
            setAi({ name: mat.n, g: mat.g, buy: mat.buy, pewnosc: parsed.pewnosc || "średnia", wielkosc: parsed.wielkosc || "średnia", uwaga: parsed.uwaga || "", lo: zakres[0] * mat.buy, hi: zakres[1] * mat.buy });
        }
        catch (err) {
            setAi({ error: true });
        }
        finally {
            setAiLoading(false);
        }
    };
    const onPhoto = async (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f)
            return;
        setPhotoBusy(true);
        try {
            const url = await resizeImage(f);
            setPhoto(url);
        }
        catch (err) { }
        finally {
            setPhotoBusy(false);
        }
    };
    const sendRequest = () => {
        if (!photo && !note.trim() && !ai)
            return;
        const est = ai ? `${plnShort(ai.lo)}–${plnShort(ai.hi)}` : null;
        setRequests((p) => [{ id: uid(), clientId, clientName, plate: plates[0] || "", note: note.trim(), material: ai ? ai.name : null, est, photo: photo || null, ts: Date.now(), status: "new", reply: null }, ...(p || [])]);
        setPhoto(null);
        setNote("");
        setAi(null);
        setSent(true);
        setTimeout(() => setSent(false), 4000);
    };
    // powiadomienia klienta o odpowiedziach skupu
    const cLastSeen = notifSeen ? (notifSeen[clientId] || 0) : 0;
    const myNotifs = myReq.filter((r) => r.reply && r.reply.ts > cLastSeen).map((r) => ({ id: r.id, ts: r.reply.ts, title: "Wycena ze skupu", body: (r.reply.price != null ? pln(r.reply.price) : "") + (r.reply.message ? " · " + r.reply.message : "") }));
    const [notifOpen, setNotifOpen] = useState(false);
    const [cToast, setCToast] = useState(null);
    const cNotifInit = useRef(false);
    const repliedRef = useRef(null);
    const markRead = () => setNotifSeen && setNotifSeen((s) => ({ ...s, [clientId]: Date.now() }));
    useEffect(() => {
        const answered = new Set(myReq.filter((r) => r.reply).map((r) => r.id));
        if (!cNotifInit.current) {
            cNotifInit.current = true;
            repliedRef.current = answered;
            if (notifOn && myNotifs.length)
                fireNotif("SkupOS", `Masz ${myNotifs.length} ${myNotifs.length === 1 ? "nową wycenę" : "nowe wyceny"} ze skupu`);
            return;
        }
        const fresh = myReq.filter((r) => r.reply && !repliedRef.current.has(r.id));
        repliedRef.current = answered;
        if (fresh.length) {
            if (notifOn)
                fireNotif("Wycena ze skupu", fresh[0].reply.price != null ? pln(fresh[0].reply.price) : "Sprawdź wycenę");
            setCToast({ msg: "Skup odpowiedział na Twoje zgłoszenie." });
        }
    }, [requests]);
    // powiadomienia klienta o zmianie cen w skupie
    const priceSeenRef = useRef(null);
    useEffect(() => {
        const sig = (materials || []).map((m) => m.id + ":" + m.buy).join("|");
        const key = "sk_cli_prices_" + clientId;
        let prev = null;
        try {
            prev = localStorage.getItem(key);
        }
        catch (e) { }
        if (priceSeenRef.current === null) {
            priceSeenRef.current = sig;
            if (prev === null) {
                try {
                    localStorage.setItem(key, sig);
                }
                catch (e) { }
            }
            else if (prev !== sig) {
                try {
                    localStorage.setItem(key, sig);
                }
                catch (e) { }
                setCToast({ msg: "Ceny w skupie zostały zaktualizowane — sprawdź cennik!" });
                if (notifOn)
                    fireNotif("SkupOS", "Ceny skupu zostały zaktualizowane");
            }
            return;
        }
        if (sig !== priceSeenRef.current) {
            priceSeenRef.current = sig;
            try {
                localStorage.setItem(key, sig);
            }
            catch (e) { }
            setCToast({ msg: "Ceny w skupie zostały właśnie zaktualizowane!" });
            if (notifOn)
                fireNotif("SkupOS", "Ceny skupu zostały zaktualizowane");
        }
    }, [materials]);
    const NAVC = [["wagi", "Wagi", Scale], ["cennik", "Cennik", Coins], ["wycena", "Wycena", Calculator], ["alerty", "Alerty", Bell], ["zgloszenia", "Zgłoszenia", Inbox]];
    return (React.createElement("div", { className: "sk-root", style: { minHeight: "100vh", maxWidth: 480, margin: "0 auto", position: "relative", paddingBottom: 120 } },
        cToast && React.createElement(Toast, { msg: cToast.msg, onClose: () => setCToast(null) }),
        React.createElement("div", { style: { background: `linear-gradient(135deg, ${TEAL}, #2f5f6b)`, padding: "calc(16px + env(safe-area-inset-top)) 16px 18px", color: "#fff" } },
            React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
                    React.createElement("div", { style: { width: 38, height: 38, borderRadius: 11, background: "rgba(255,255,255,.16)", display: "grid", placeItems: "center" } },
                        React.createElement(Smartphone, { size: 20 })),
                    React.createElement("div", null,
                        React.createElement("div", { style: { fontFamily: "var(--display)", fontWeight: 800, fontSize: 18 } }, "Panel klienta"),
                        React.createElement("div", { style: { fontSize: 13, opacity: .8 } }, account ? account.name : "Twoje ważenia i ceny skupu"))),
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
                    React.createElement("button", { onClick: () => setNotifOpen(true), style: { position: "relative", background: "rgba(255,255,255,.16)", border: "none", color: "#fff", cursor: "pointer", borderRadius: 10, padding: "8px 10px", display: "flex", alignItems: "center" } },
                        React.createElement(Bell, { size: 17 }),
                        myNotifs.length > 0 && React.createElement("span", { style: { position: "absolute", top: -4, right: -4, minWidth: 17, height: 17, padding: "0 4px", borderRadius: 99, background: "var(--red)", color: "#fff", fontSize: 11.5, fontWeight: 800, display: "grid", placeItems: "center" } }, myNotifs.length)),
                    preview
                        ? React.createElement("button", { onClick: onExit, style: { background: "rgba(255,255,255,.16)", border: "none", color: "#fff", cursor: "pointer", borderRadius: 10, padding: "8px 12px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 } },
                            React.createElement(ChevronLeft, { size: 15 }),
                            " Skup")
                        : React.createElement("button", { onClick: onLogout, style: { background: "rgba(255,255,255,.16)", border: "none", color: "#fff", cursor: "pointer", borderRadius: 10, padding: "8px 12px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 } },
                            React.createElement(LogOut, { size: 15 }),
                            " Wyloguj"))),
            preview && React.createElement("div", { style: { marginTop: 12, fontSize: 13, background: "rgba(255,255,255,.14)", borderRadius: 9, padding: "8px 11px", display: "inline-flex", alignItems: "center", gap: 7 } },
                React.createElement(AlertTriangle, { size: 14 }),
                " Podgl\u0105d w\u0142a\u015Bciciela \u2014 tak ekran widzi klient")),
        React.createElement("div", { key: tab, style: { animation: "slideFade .34s cubic-bezier(.22,1,.36,1)", padding: "0 16px" } },
            tab === "wagi" && (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { ...sectionTitle, marginTop: 18 } }, "Twoje tablice rejestracyjne"),
                React.createElement(Card, null,
                    React.createElement("div", { style: { display: "flex", gap: 8 } },
                        React.createElement("input", { value: plateInput, onChange: (e) => setPlateInput(e.target.value.toUpperCase()), placeholder: "np. SK 12345", style: { ...inputStyle, fontFamily: "var(--mono)", fontWeight: 700, letterSpacing: ".05em" } }),
                        React.createElement("button", { onClick: addPlate, style: { ...btnTeal, width: "auto", padding: "0 18px" } },
                            React.createElement(Plus, { size: 18 }))),
                    plates.length > 0 ? (React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 } }, plates.map((p) => (React.createElement("span", { key: p, style: { display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(63,125,138,.1)", border: "1px solid rgba(63,125,138,.3)", color: TEAL, borderRadius: 99, padding: "7px 8px 7px 13px", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 14.5 } },
                        p,
                        React.createElement("button", { onClick: () => removePlate(p), style: { border: "none", background: "rgba(63,125,138,.18)", cursor: "pointer", borderRadius: 99, width: 20, height: 20, display: "grid", placeItems: "center", color: TEAL } },
                            React.createElement(X, { size: 12 }))))))) : React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", marginTop: 10 } },
                        "Dodaj tablic\u0119 u\u017Cyt\u0105 przy wa\u017Ceniu \u2014 system poka\u017Ce Twoje wagi (w demie: ",
                        React.createElement("b", null, "SK 12345"),
                        ").")),
                latest && (React.createElement(React.Fragment, null,
                    React.createElement("div", { style: sectionTitle }, "Ostatnie wa\u017Cenie"),
                    React.createElement(Card, { style: { border: `1.5px solid ${TEAL}`, background: "linear-gradient(135deg,rgba(63,125,138,.08),rgba(63,125,138,.01))" } },
                        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } },
                            React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 700, color: isToday ? "var(--green)" : "var(--muted)" } },
                                isToday && React.createElement("span", { style: { width: 8, height: 8, borderRadius: 99, background: "var(--green)", boxShadow: "0 0 0 0 rgba(21,163,74,.5)", animation: "pulse 1.6s infinite" } }),
                                isToday ? "NA ŻYWO · dziś" : fmtDate(latest.ts),
                                " \u00B7 ",
                                fmtTs(latest.ts)),
                            React.createElement("span", { style: { fontFamily: "var(--mono)", fontSize: 13.5, fontWeight: 700, color: TEAL } }, latest.plate)),
                        latest.pos.map((p, i) => (React.createElement("div", { key: i, style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: i ? "1px solid var(--line)" : "none" } },
                            React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 600 } },
                                React.createElement("span", { style: { width: 9, height: 9, borderRadius: 3, background: C[p.g].color } }),
                                p.n),
                            React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 15 } }, kg(p.w))))),
                        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "2px solid var(--line2)" } },
                            React.createElement("span", { style: { fontSize: 14.5, color: "var(--muted)", fontWeight: 600 } }, "Wyp\u0142ata"),
                            React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 24, color: TEAL } }, pln(txTotal(latest))))))),
                mine.length > 1 && (React.createElement(React.Fragment, null,
                    React.createElement("div", { style: sectionTitle }, "Historia wa\u017Ce\u0144"),
                    mine.slice(1).map((x) => (React.createElement(Card, { key: x.id, pad: 13, style: { marginBottom: 9 } },
                        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                            React.createElement("div", null,
                                React.createElement("div", { style: { fontSize: 15, fontWeight: 600 } },
                                    kg(txMass(x)),
                                    " \u00B7 ",
                                    x.pos.length,
                                    " ",
                                    x.pos.length === 1 ? "pozycja" : "pozycje"),
                                React.createElement("div", { style: { fontSize: 13, color: "var(--muted)", fontFamily: "var(--mono)" } },
                                    fmtDate(x.ts),
                                    " \u00B7 ",
                                    x.plate)),
                            React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 15 } }, plnShort(txTotal(x))))))))),
                plates.length > 0 && mine.length === 0 && React.createElement(Card, { style: { marginTop: 4 } },
                    React.createElement("div", { style: { fontSize: 14.5, color: "var(--muted)", textAlign: "center", padding: "8px 0" } }, "Brak wa\u017Ce\u0144 dla zapisanych tablic. Gdy oddasz z\u0142om, wa\u017Cenie pojawi si\u0119 tu automatycznie.")))),
            tab === "cennik" && (React.createElement(React.Fragment, null,
                rises.length > 0 && (React.createElement("div", { style: { marginTop: 18, borderRadius: 14, background: "rgba(21,163,74,.1)", border: "1px solid rgba(21,163,74,.3)", padding: 14 } },
                    React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 } },
                        React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14, color: "var(--green)" } },
                            React.createElement(Bell, { size: 16 }),
                            " ",
                            rises.length,
                            " ",
                            rises.length === 1 ? "cena wzrosła" : "ceny wzrosły"),
                        React.createElement("button", { onClick: refreshPrices, style: { background: "rgba(21,163,74,.15)", border: "none", color: "var(--green)", cursor: "pointer", borderRadius: 9, padding: "6px 10px", fontSize: 13.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 } },
                            React.createElement(RefreshCw, { size: 13 }),
                            " Od\u015Bwie\u017C")),
                    rises.slice(0, 5).map(({ m, diff }) => (React.createElement("div", { key: m.id, style: { display: "flex", justifyContent: "space-between", fontSize: 14.5, padding: "4px 0" } },
                        React.createElement("span", { style: { fontWeight: 600 } }, m.n),
                        React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 700, color: "var(--green)" } },
                            "+",
                            diff.toFixed(2),
                            " z\u0142 \u2192 ",
                            m.buy.toFixed(2))))))),
                React.createElement("div", { style: sectionTitle }, "Cennik skupu"),
                React.createElement(ClientCennik, { materials: materials, rises: rises }))),
            tab === "wycena" && (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { ...sectionTitle, marginTop: 18 } }, "Kalkulator wyceny"),
                React.createElement(Card, null,
                    React.createElement("label", { style: label }, "Materia\u0142"),
                    React.createElement("select", { value: cMat, onChange: (e) => setCMat(e.target.value), style: { ...inputStyle, colorScheme: "light" } }, materials.map((m) => React.createElement("option", { key: m.id, value: m.id },
                        m.n,
                        " (",
                        C[m.g].code,
                        ")"))),
                    React.createElement("label", { style: label }, "Masa (kg)"),
                    React.createElement("input", { type: "number", inputMode: "decimal", value: cW, onChange: (e) => setCW(e.target.value), placeholder: "0", style: { ...inputStyle, fontFamily: "var(--mono)", fontWeight: 700, fontSize: 18 } }),
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, padding: "14px 16px", borderRadius: 13, background: "rgba(63,125,138,.08)" } },
                        React.createElement("span", { style: { fontSize: 14.5, color: "var(--muted)", fontWeight: 600 } }, "Szacowana wyp\u0142ata"),
                        React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 24, color: TEAL } }, pln(cEst))),
                    cm && React.createElement("div", { style: { fontSize: 13, color: "var(--faint)", marginTop: 8 } },
                        "Cena skupu: ",
                        cm.buy.toFixed(2),
                        " z\u0142/kg \u00B7 wycena orientacyjna, ostateczna na wadze w punkcie.")),
                React.createElement("div", { style: sectionTitle }, "Wyce\u0144 ze zdj\u0119cia (AI) i wy\u015Blij do skupu"),
                React.createElement(Card, null,
                    sent && React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 9, padding: "11px 12px", borderRadius: 11, background: "rgba(21,163,74,.1)", border: "1px solid rgba(21,163,74,.3)", marginBottom: 12 } },
                        React.createElement(Check, { size: 18, color: "var(--green)", strokeWidth: 3 }),
                        React.createElement("span", { style: { fontSize: 14.5, fontWeight: 600 } }, "Wys\u0142ano do skupu. Odpowied\u017A zobaczysz w \u201EZg\u0142oszenia\".")),
                    React.createElement("label", { style: { ...btnTeal, opacity: photoBusy ? .7 : 1, cursor: "pointer" } },
                        photoBusy ? React.createElement(React.Fragment, null,
                            React.createElement(RefreshCw, { size: 18, className: "spin" }),
                            " Wczytuj\u0119\u2026") : React.createElement(React.Fragment, null,
                            React.createElement(Camera, { size: 18 }),
                            " ",
                            photo ? "Zmień zdjęcie" : "Zrób / wgraj zdjęcie złomu"),
                        React.createElement("input", { type: "file", accept: "image/*", onChange: onPhoto, style: { display: "none" } })),
                    photo && React.createElement("img", { src: photo, alt: "", style: { width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 12, marginTop: 12, border: "1px solid var(--line)" } }),
                    photo && (React.createElement("button", { onClick: runAi, disabled: aiLoading, style: { ...btnGhost, marginTop: 10, opacity: aiLoading ? .7 : 1 } }, aiLoading ? React.createElement(React.Fragment, null,
                        React.createElement(RefreshCw, { size: 16, className: "spin" }),
                        " Analizuj\u0119\u2026") : React.createElement(React.Fragment, null,
                        React.createElement(Sparkles, { size: 16 }),
                        " Wst\u0119pna wycena AI"))),
                    ai && ai.error && (React.createElement("div", { style: { marginTop: 12, padding: 13, borderRadius: 12, background: "rgba(217,119,6,.08)", border: "1px solid rgba(217,119,6,.3)", fontSize: 14, color: "var(--muted)", lineHeight: 1.5 } }, "Nie uda\u0142o si\u0119 przeanalizowa\u0107 zdj\u0119cia. Spr\u00F3buj jeszcze raz (lepsze \u015Bwiat\u0142o, z bliska) albo opisz z\u0142om w wiadomo\u015Bci poni\u017Cej.")),
                    ai && !ai.error && (React.createElement("div", { style: { marginTop: 12, padding: 14, borderRadius: 13, border: "1px solid var(--line)", background: "var(--surface)" } },
                        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 } },
                            React.createElement(Sparkles, { size: 16, color: TEAL }),
                            React.createElement("span", { style: { fontWeight: 700, fontSize: 14 } }, "Wst\u0119pne rozpoznanie AI")),
                        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, marginBottom: 9 } },
                            React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 8, fontWeight: 700 } },
                                React.createElement("span", { style: { width: 10, height: 10, borderRadius: 3, background: C[ai.g].color } }),
                                ai.name),
                            React.createElement("span", { style: { fontSize: 12, fontWeight: 800, padding: "3px 9px", borderRadius: 99, color: ai.pewnosc === "wysoka" ? "var(--green)" : ai.pewnosc === "niska" ? "var(--red)" : "var(--amber)", background: (ai.pewnosc === "wysoka" ? "rgba(21,163,74," : ai.pewnosc === "niska" ? "rgba(220,38,38," : "rgba(217,119,6,") + ".14)" } },
                                "pewno\u015B\u0107: ",
                                ai.pewnosc)),
                        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--muted)", padding: "4px 0" } },
                            React.createElement("span", null, "Cena skupu"),
                            React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 700, color: "var(--text)" } },
                                ai.buy.toFixed(2),
                                " z\u0142/kg")),
                        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--muted)", padding: "4px 0" } },
                            React.createElement("span", null, "Wielko\u015B\u0107 partii"),
                            React.createElement("span", { style: { fontWeight: 700, color: "var(--text)" } },
                                ai.wielkosc,
                                " (orientacyjnie)")),
                        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" } },
                            React.createElement("span", { style: { fontSize: 14.5, color: "var(--muted)", fontWeight: 600 } }, "Orientacyjnie"),
                            React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 18, color: TEAL } },
                                plnShort(ai.lo),
                                "\u2013",
                                plnShort(ai.hi))),
                        ai.uwaga && React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 10, padding: "8px 10px", background: "rgba(63,125,138,.06)", borderRadius: 9, lineHeight: 1.45 } },
                            "\uD83D\uDCA1 ",
                            ai.uwaga),
                        React.createElement("div", { style: { fontSize: 12.5, color: "var(--faint)", marginTop: 10, lineHeight: 1.5 } },
                            "\u2696\uFE0F Wagi nie da si\u0119 dok\u0142adnie oceni\u0107 ze zdj\u0119cia \u2014 to zgrubny szacunek. ",
                            React.createElement("b", { style: { color: "var(--muted)" } }, "Ostateczna cena po zwa\u017Ceniu w punkcie.")))),
                    React.createElement("label", { style: { ...label, marginTop: 14 } }, "Wiadomo\u015B\u0107 do skupu (opcjonalnie)"),
                    React.createElement("textarea", { value: note, onChange: (e) => setNote(e.target.value), rows: 2, placeholder: "np. Mam ok. 5 kg miedzi, kiedy mog\u0119 przyjecha\u0107?", style: { ...inputStyle, resize: "vertical", lineHeight: 1.4 } }),
                    React.createElement("button", { onClick: sendRequest, disabled: !photo && !note.trim() && !ai, style: { ...btnTeal, marginTop: 12, opacity: (!photo && !note.trim() && !ai) ? .5 : 1 } },
                        React.createElement(Send, { size: 18 }),
                        " Wy\u015Blij do skupu o wycen\u0119")))),
            tab === "alerty" && React.createElement(ClientAlerty, { materials: materials, snapshot: snapshot, rises: rises, notifOn: notifOn, onEnableNotif: onEnableNotif, clientProfile: clientProfile, setClientProfile: setClientProfile, refreshPrices: refreshPrices }),
            tab === "zgloszenia" && (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { ...sectionTitle, marginTop: 18 } }, "Twoje zg\u0142oszenia"),
                myReq.length === 0 ? (React.createElement(Card, null,
                    React.createElement("div", { style: { textAlign: "center", color: "var(--muted)", fontSize: 15, padding: "16px 8px" } }, "Nie wys\u0142ano jeszcze zg\u0142osze\u0144. Wy\u015Blij zdj\u0119cie w zak\u0142adce \u201EWycena\"."))) : myReq.map((r) => (React.createElement(Card, { key: r.id, style: { marginBottom: 11 } },
                    React.createElement("div", { style: { display: "flex", gap: 12 } },
                        r.photo
                            ? React.createElement("img", { src: r.photo, alt: "", style: { width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "1px solid var(--line)" } })
                            : React.createElement("div", { style: { width: 56, height: 56, borderRadius: 10, background: "var(--surface2)", display: "grid", placeItems: "center", flexShrink: 0 } },
                                React.createElement(MessageSquare, { size: 20, color: "var(--faint)" })),
                        React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                                React.createElement("span", { style: { fontSize: 13.5, fontFamily: "var(--mono)", color: "var(--muted)" } },
                                    fmtDate(r.ts),
                                    " ",
                                    fmtTs(r.ts)),
                                React.createElement("span", { style: { fontSize: 12, fontWeight: 800, padding: "3px 8px", borderRadius: 99, background: r.status === "new" ? "rgba(245,181,61,.15)" : "rgba(21,163,74,.12)", color: r.status === "new" ? "var(--amber)" : "var(--green)" } }, r.status === "new" ? "OCZEKUJE" : "WYCENIONO")),
                            r.material && React.createElement("div", { style: { fontSize: 14, marginTop: 5 } },
                                "AI: ",
                                React.createElement("b", null, r.material),
                                r.est ? ` · ~${r.est}` : ""),
                            r.note && React.createElement("div", { style: { fontSize: 14.5, marginTop: 4 } },
                                "\u201E",
                                r.note,
                                "\""))),
                    r.reply && (React.createElement("div", { style: { marginTop: 11, padding: "11px 13px", borderRadius: 11, background: "rgba(63,125,138,.08)", border: "1px solid rgba(63,125,138,.25)" } },
                        React.createElement("div", { style: { fontSize: 12.5, fontWeight: 700, color: TEAL, marginBottom: 3 } }, "Odpowied\u017A skupu"),
                        r.reply.price != null && React.createElement("div", { style: { fontFamily: "var(--mono)", fontWeight: 800, fontSize: 19, color: TEAL } }, pln(r.reply.price)),
                        r.reply.message && React.createElement("div", { style: { fontSize: 14.5, marginTop: 2 } }, r.reply.message))))))))),
        React.createElement("nav", { style: { position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, maxWidth: 480, margin: "0 auto", background: "var(--navbg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderTop: "1px solid var(--line)", display: "grid", gridTemplateColumns: `repeat(${NAVC.length},1fr)`, padding: "8px 4px calc(8px + env(safe-area-inset-bottom))" } }, NAVC.map(([id, lbl, Ic]) => {
            const on = tab === id;
            const badge = id === "zgloszenia" && myReq.some((r) => r.status === "answered");
            return (React.createElement("button", { key: id, onClick: () => setTab(id), style: { position: "relative", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 0", color: on ? TEAL : "var(--faint)" } },
                React.createElement(Ic, { size: 21, strokeWidth: on ? 2.6 : 2 }),
                React.createElement("span", { style: { fontSize: 12, fontWeight: on ? 700 : 500 } }, lbl)));
        })),
        React.createElement(Sheet, { open: notifOpen, onClose: () => { setNotifOpen(false); markRead(); }, title: "Powiadomienia" },
            React.createElement(NotifList, { items: myNotifs, notifOn: notifOn, onEnable: onEnableNotif, onItem: () => { setNotifOpen(false); markRead(); setTab("zgloszenia"); } }))));
}
/* ─────────── Powiadomienia klienta (alerty cenowe) ─────────── */
function ClientAlerty({ materials, snapshot, rises, notifOn, onEnableNotif, clientProfile, setClientProfile, refreshPrices }) {
    // Preferencje powiadomień (zapis w profilu klienta)
    const prefs = clientProfile.notifPrefs || { wzrosty: true, promocje: true, progi: {} };
    const setPrefs = (p) => setClientProfile({ ...clientProfile, notifPrefs: p });
    // Historia alertów (broadcastów od skupu + wykryte wzrosty)
    const broadcasts = clientProfile.broadcasts || [];
    const allAlerts = [
        ...rises.map(r => ({ typ: "wzrost", material: r.m.n, diff: r.diff, cena: r.m.buy, ts: Date.now() })),
        ...broadcasts,
    ].sort((a, b) => b.ts - a.ts);
    // Materiały, które klient śledzi (z progiem ceny)
    const sledzone = materials.filter(m => prefs.progi[m.id] != null);
    const fmtCzas = (ts) => { const h = Math.round((Date.now() - ts) / 3600000); if (h < 1)
        return "przed chwilą"; if (h < 24)
        return `${h}h temu`; return `${Math.round(h / 24)}d temu`; };
    return (React.createElement("div", { style: { marginTop: 18 } },
        React.createElement(Card, { style: { background: notifOn ? "rgba(21,163,74,.08)" : "rgba(245,181,61,.1)", border: notifOn ? "1px solid rgba(21,163,74,.3)" : "1px solid rgba(245,181,61,.35)" } },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
                React.createElement("span", { style: { fontSize: 28 } }, notifOn ? "🔔" : "🔕"),
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, notifOn ? "Powiadomienia włączone" : "Włącz powiadomienia"),
                    React.createElement("div", { style: { fontSize: 13.5, color: "var(--muted)", marginTop: 2, lineHeight: 1.45 } }, notifOn ? "Dostajesz alerty o wzrostach cen i promocjach na ekran blokady." : "Bądź pierwszy, gdy ceny wzrosną — zgarnij najlepszą stawkę.")),
                !notifOn && React.createElement("button", { onClick: onEnableNotif, style: { ...btnCopper, width: "auto", padding: "10px 16px", fontSize: 14.5 } }, "W\u0142\u0105cz"))),
        React.createElement("div", { style: sectionTitle }, "Co chcesz dostawa\u0107"),
        React.createElement(Card, { pad: 4 }, [["wzrosty", "📈 Wzrosty cen", "Gdy skup podnosi cenę materiału"], ["promocje", "🔥 Promocje", "Specjalne oferty i bonusy"]].map(([k, l, d], i) => (React.createElement("div", { key: k, style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 12px", borderBottom: i === 0 ? "1px solid var(--line)" : "none" } },
            React.createElement("div", { style: { flex: 1 } },
                React.createElement("div", { style: { fontWeight: 700, fontSize: 15 } }, l),
                React.createElement("div", { style: { fontSize: 13, color: "var(--muted)", marginTop: 2 } }, d)),
            React.createElement("button", { onClick: () => setPrefs({ ...prefs, [k]: !prefs[k] }), style: { width: 46, height: 27, borderRadius: 99, border: "none", cursor: "pointer", background: prefs[k] ? "var(--green)" : "var(--line2)", position: "relative", transition: "background .2s", flexShrink: 0 } },
                React.createElement("span", { style: { position: "absolute", top: 3, left: prefs[k] ? 22 : 3, width: 21, height: 21, borderRadius: 99, background: "#fff", transition: "left .2s" } })))))),
        React.createElement("div", { style: sectionTitle }, "Powiadom mnie, gdy cena przekroczy"),
        React.createElement(Card, null,
            React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 } }, "Ustaw pr\u00F3g dla materia\u0142u \u2014 dostaniesz alert, gdy skup zap\u0142aci tyle lub wi\u0119cej."),
            materials.slice(0, 6).map(m => {
                const prog = prefs.progi[m.id];
                const aktywny = prog != null;
                const osiagniety = aktywny && m.buy >= prog;
                return (React.createElement("div", { key: m.id, style: { display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: "1px solid var(--line)" } },
                    React.createElement("div", { style: { width: 8, height: 8, borderRadius: 99, background: (C[m.g] || {}).color || "var(--copper)", flexShrink: 0 } }),
                    React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                        React.createElement("div", { style: { fontSize: 14.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, m.n),
                        React.createElement("div", { style: { fontSize: 12.5, color: "var(--muted)" } },
                            "teraz: ",
                            m.buy.toFixed(2),
                            " z\u0142/kg")),
                    aktywny ? (React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
                        React.createElement("input", { type: "number", step: "0.5", value: prog, onChange: e => setPrefs({ ...prefs, progi: { ...prefs.progi, [m.id]: parseFloat(e.target.value) || 0 } }), style: { width: 70, padding: "7px 8px", borderRadius: 8, border: `1.5px solid ${osiagniety ? "var(--green)" : "var(--line2)"}`, background: "var(--surface2)", color: osiagniety ? "var(--green)" : "var(--text)", fontSize: 14.5, fontFamily: "var(--mono)", fontWeight: 700, outline: "none", boxSizing: "border-box" } }),
                        React.createElement("button", { onClick: () => { const p = { ...prefs.progi }; delete p[m.id]; setPrefs({ ...prefs, progi: p }); }, style: { width: 26, height: 26, borderRadius: 7, border: "none", background: "transparent", color: "var(--faint)", cursor: "pointer", fontSize: 15 } }, "\u00D7"))) : (React.createElement("button", { onClick: () => setPrefs({ ...prefs, progi: { ...prefs.progi, [m.id]: Math.ceil(m.buy * 1.05 * 2) / 2 } }), style: { padding: "6px 11px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "1px solid var(--line2)", background: "var(--surface2)", color: "var(--copper)" } }, "+ Pr\u00F3g"))));
            })),
        React.createElement("div", { style: { ...sectionTitle, display: "flex", justifyContent: "space-between", alignItems: "center" } },
            React.createElement("span", null, "Twoje alerty"),
            React.createElement("button", { onClick: refreshPrices, style: { padding: "5px 11px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "1px solid var(--line2)", background: "var(--surface2)", color: "var(--muted)", textTransform: "none", letterSpacing: 0 } }, "Od\u015Bwie\u017C")),
        allAlerts.length === 0 ? (React.createElement(Card, null,
            React.createElement("div", { style: { color: "var(--muted)", fontSize: 15, textAlign: "center", padding: "14px 0", lineHeight: 1.5 } }, "Brak alert\u00F3w. Gdy skup podniesie ceny lub og\u0142osi promocj\u0119, zobaczysz to tutaj."))) : allAlerts.map((a, i) => (React.createElement(Card, { key: i, pad: 13, style: { marginBottom: 8, borderLeft: `4px solid ${a.typ === "wzrost" ? "var(--green)" : a.typ === "promocja" ? "var(--copper)" : "var(--blue)"}` } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" } },
                React.createElement("div", { style: { flex: 1 } }, a.typ === "wzrost" ? (React.createElement(React.Fragment, null,
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 15 } },
                        "\uD83D\uDCC8 Wzrost ceny \u2014 ",
                        a.material),
                    React.createElement("div", { style: { fontSize: 14, color: "var(--green)", marginTop: 3 } },
                        "+",
                        a.diff.toFixed(2),
                        " z\u0142/kg \u2192 teraz ",
                        a.cena.toFixed(2),
                        " z\u0142/kg"))) : (React.createElement(React.Fragment, null,
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 15 } }, a.tytul || "🔥 Wiadomość od skupu"),
                    React.createElement("div", { style: { fontSize: 14, color: "var(--muted)", marginTop: 3, lineHeight: 1.5 } }, a.tresc)))),
                React.createElement("span", { style: { fontSize: 12.5, color: "var(--faint)", flexShrink: 0, marginLeft: 8 } }, fmtCzas(a.ts)))))),
        React.createElement("div", { style: { fontSize: 12.5, color: "var(--faint)", marginTop: 10, lineHeight: 1.5, textAlign: "center" } }, "Powiadomienia dzia\u0142aj\u0105 na zainstalowanej apce (ekran g\u0142\u00F3wny / PWA).")));
}
function ClientCennik({ materials, rises }) {
    const [q, setQ] = useState("");
    const riseIds = (rises || []).map((r) => r.m.id);
    const matches = (m) => !q.trim() || fnorm(m.n).includes(fnorm(q)) || C[m.g].code.includes(q.trim());
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { style: { position: "relative", marginBottom: 4 } },
            React.createElement(Search, { size: 17, color: "var(--faint)", style: { position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" } }),
            React.createElement("input", { style: { ...inputStyle, paddingLeft: 40 }, placeholder: "Szukaj (mied\u017A, 17 04\u2026)", value: q, onChange: (e) => setQ(e.target.value) })),
        Object.keys(C).map((g) => {
            const items = materials.filter((m) => m.g === g && matches(m));
            if (!items.length)
                return null;
            return (React.createElement("div", { key: g, style: { marginBottom: 8 } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, margin: "12px 4px 8px" } },
                    codeChip(g),
                    React.createElement("span", { style: { fontFamily: "var(--display)", fontSize: 14.5, fontWeight: 700, color: "var(--muted)" } }, C[g].label)),
                React.createElement(Card, { pad: 4 }, items.map((m, i) => (React.createElement("div", { key: m.id, style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 10px", borderBottom: i < items.length - 1 ? "1px solid var(--line)" : "none" } },
                    React.createElement("span", { style: { fontSize: 14, fontWeight: 600, paddingRight: 8 } }, m.n),
                    React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" } },
                        riseIds.includes(m.id) && React.createElement("span", { style: { fontSize: 12, fontWeight: 800, color: "var(--green)" } }, "\u25B2"),
                        React.createElement("span", { style: { fontFamily: "var(--mono)", fontSize: 14.5, fontWeight: 700 } }, m.buy.toFixed(2)),
                        React.createElement("span", { style: { fontSize: 12.5, color: "var(--faint)" } }, "z\u0142/kg"))))))));
        })));
}
const rootBase = { background: "#0f1318", minHeight: "100vh" };
/* ─────────── styles ─────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600;700&display=swap');
.sk-root{
  --bg:#0f1318; --surface:#181d26; --surface2:#202732;
  --line:rgba(255,255,255,.08); --line2:rgba(255,255,255,.15); --track:rgba(255,255,255,.08);
  --text:#e9edf1; --muted:#8b97a6; --faint:#59636f;
  --copper:#d08249; --green:#22c55e; --amber:#e0a13f; --red:#ef4444;
  --display:'Plus Jakarta Sans',system-ui,sans-serif; --body:'Plus Jakarta Sans',system-ui,sans-serif; --mono:'Plus Jakarta Sans',system-ui,sans-serif; --code:'JetBrains Mono',monospace;
  --grad:linear-gradient(135deg,#E8894A 0%,#C25E26 55%,#9C4518 100%); --copperSoft:rgba(208,130,73,.16);
  --field:#202732; --cardBorder:1px solid rgba(255,255,255,.07); --cardShadow:0 1px 2px rgba(0,0,0,.25), 0 14px 34px -20px rgba(0,0,0,.6);
  font-variant-numeric: tabular-nums;
  font-family:var(--body); color:var(--text);
  background:
    radial-gradient(820px 420px at 100% -6%, rgba(208,130,73,.12), transparent 70%),
    radial-gradient(700px 380px at 0% 4%, rgba(63,125,138,.10), transparent 70%),
    var(--bg);
  -webkit-font-smoothing:antialiased;
}
.sk-root{ --navbg:rgba(15,19,24,.82); }
.sk-root.sk-light{
  --bg:#F5F4F1; --surface:#FFFFFF; --surface2:#EFEDE8; --field:#F2F0EC;
  --line:rgba(20,22,26,.07); --line2:rgba(20,22,26,.14); --track:rgba(20,22,26,.07);
  --text:#121418; --muted:#575E66; --faint:#7D848C;
  --copper:#B4561F; --green:#15803D; --amber:#A16207; --red:#DC2626;
  --copperSoft:rgba(194,94,38,.11);
  --navbg:rgba(255,255,255,.88);
  --cardBorder:1px solid rgba(20,22,26,.05); --cardShadow:0 1px 2px rgba(16,24,40,.04), 0 8px 24px -10px rgba(16,24,40,.12);
  background: radial-gradient(900px 480px at 110% -10%, rgba(232,137,74,.16), transparent 65%), radial-gradient(700px 400px at -10% 0%, rgba(63,125,138,.08), transparent 65%), var(--bg);
}
.sk-root.sk-light input:focus, .sk-root.sk-light select:focus, .sk-root.sk-light textarea:focus{ background:#fff; }
.sk-root h1{ letter-spacing:-.03em !important; }
.sk-root .sk-plate{ font-family:var(--code); }
.sk-nav button:active{ transform:scale(.92); }
.sk-fab:active span{ transform:scale(.94); }
@keyframes skFloat{ 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-2px);} }
.sk-root.sk-big{ zoom:1.12; }
/* dokumenty FPO/KPO = biały papier z ciemnym tekstem (lokalne nadpisanie tokenów) */
.print-target{ --text:#16181c; --muted:#555c63; --faint:#8a9099; --line:rgba(0,0,0,.12); --line2:rgba(0,0,0,.18); --surface:#ffffff; --surface2:#f4f4f2; --track:rgba(0,0,0,.08); color:#16181c; }
*{box-sizing:border-box;}
.sk-root button{font-family:var(--body);}
@keyframes fade{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);}}
@keyframes slideUp{from{opacity:0;transform:translateY(40px);}to{opacity:1;transform:translateY(0);}}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes dropIn{from{opacity:0;transform:translate(-50%,-14px);}to{opacity:1;transform:translate(-50%,0);}}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(21,163,74,.5);}70%{box-shadow:0 0 0 7px rgba(21,163,74,0);}100%{box-shadow:0 0 0 0 rgba(21,163,74,0);}}
.spin{animation:spin .7s linear infinite;}
/* ── nowoczesne mikrointerakcje (tactile feel) ── */
.sk-root button{ transition: transform .14s cubic-bezier(.2,.8,.2,1), background .18s ease, border-color .18s ease, color .18s ease, box-shadow .2s ease, opacity .15s ease; -webkit-tap-highlight-color:transparent; }
.sk-root button:active{ transform: scale(.95); }
.sk-root a{ -webkit-tap-highlight-color:transparent; transition: transform .14s cubic-bezier(.2,.8,.2,1), opacity .15s ease; }
.sk-root a:active{ transform: scale(.96); }
.sk-card{ transition: transform .22s cubic-bezier(.2,.8,.2,1), box-shadow .26s ease, border-color .2s ease; }
.sk-card:active{ transform: scale(.992); }
.sk-root input, .sk-root textarea, .sk-root select{ transition: border-color .18s ease, background .18s ease, box-shadow .2s ease; }
.sk-root input:focus, .sk-root textarea:focus, .sk-root select:focus{ border-color: var(--copper); box-shadow: 0 0 0 3px rgba(208,130,73,.16); }
@keyframes popIn{ from{ opacity:0; transform: scale(.92);} to{ opacity:1; transform: scale(1);} }
@keyframes rise{ from{ opacity:0; transform: translateY(14px);} to{ opacity:1; transform: translateY(0);} }
@keyframes sheetUp{ from{ transform: translateY(100%);} to{ transform: translateY(0);} }
@media (prefers-reduced-motion: reduce){ .sk-root *{ animation-duration:.01ms !important; transition-duration:.01ms !important; } }
input::placeholder{color:var(--faint);}
input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}
/* ── nowoczesne mikrointerakcje i animacje ── */
.sk-root button{ transition:transform .16s cubic-bezier(.34,1.56,.64,1), box-shadow .22s ease, background .22s ease, border-color .2s ease, opacity .2s ease; -webkit-tap-highlight-color:transparent; }
.sk-root button:active{ transform:scale(.955); }
.sk-root input,.sk-root textarea,.sk-root select{ transition:border-color .2s ease, box-shadow .2s ease, background .2s ease; }
.sk-root input:focus,.sk-root textarea:focus,.sk-root select:focus{ border-color:var(--copper)!important; box-shadow:0 0 0 3px rgba(208,130,73,.16); }
.sk-card{ transition:transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease, border-color .2s ease; }
.sk-card:active{ transform:scale(.992); }
.sk-root nav button{ transition:color .2s ease, transform .15s ease; }
.sk-root nav button:active{ transform:scale(.88); }
.sk-root a{ -webkit-tap-highlight-color:transparent; }
@keyframes slideFade{ from{ opacity:0; transform:translateY(10px) scale(.995);} to{ opacity:1; transform:translateY(0) scale(1);} }
@keyframes popIn{ 0%{ opacity:0; transform:scale(.92);} 60%{ opacity:1; transform:scale(1.015);} 100%{ transform:scale(1);} }
@keyframes glowPulse{ 0%,100%{ box-shadow:0 0 0 0 rgba(208,130,73,.0);} 50%{ box-shadow:0 0 22px 0 rgba(208,130,73,.28);} }
@keyframes floatY{ 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-3px);} }
@keyframes shimmer{ 0%{ background-position:-180% 0;} 100%{ background-position:180% 0;} }
.sk-root ::-webkit-scrollbar{ width:0; height:0; }
.sk-root{ scrollbar-width:none; }
.pop{ animation:popIn .3s cubic-bezier(.34,1.56,.64,1); }
@media (prefers-reduced-motion: reduce){ .sk-root *{ animation:none!important; transition:none!important; } }

@media print {
  html, body { background:#fff !important; }
  body * { visibility:hidden !important; }
  .print-target, .print-target * { visibility:visible !important; }
  .print-target { position:absolute !important; left:0 !important; top:0 !important; width:100% !important; box-shadow:none !important; border:none !important; border-radius:0 !important; margin:0 !important; }
  .no-print { display:none !important; }
}
@page { size:A4; margin:14mm; }
.fpo-wydruk { display:none; }
@page tasma80 { size:80mm 297mm; margin:2mm; }
.fpo-80 { page:tasma80; }
@media print {
  body[data-druk] > *:not(.fpo-wydruk) { display:none !important; }
  body[data-druk] .fpo-wydruk { display:block !important; position:static !important; width:100%; }
  body[data-druk] .fpo-wydruk, body[data-druk] .fpo-wydruk * { visibility:visible !important; }
  body[data-druk="a4"] .fpo-80, body[data-druk="80"] .fpo-a4 { display:none !important; }
  body[data-druk] .fpo-podglad { display:none !important; }
  body[data-druk] .fpo-egz { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
}

/* ═══════════ TRYB DESKTOP (>=1024px) — mobile bez zmian ═══════════ */
@media (min-width: 1024px) {
  /* treść: szeroka kolumna na prawo od sidebara */
  .sk-root { max-width: 1040px !important; margin-left: 264px !important; margin-right: auto !important; padding: 8px 28px 56px !important; }
  /* gęstszy układ na komputerze: mniej przewijania */
  .sk-main { zoom: .9; }
  .sk-main [style*="position: fixed"] { zoom: 1.1111; }
  .sk-main [style*="position: fixed"] [style*="position: fixed"] { zoom: 1; }

  /* nawigacja: dolny pasek -> lewy sidebar */
  .sk-root nav { position: fixed !important; top: 0 !important; bottom: 0 !important; left: 0 !important; right: auto !important; width: 236px !important; max-width: 236px !important; display: flex !important; flex-direction: column !important; align-items: stretch !important; gap: 4px !important; padding: 22px 12px !important; border-top: none !important; border-right: 1px solid var(--line); background: rgba(13,16,20,.92) !important; overflow-y: auto; }
  .sk-root nav::before { content: "SkupOS"; display: block; font-family: var(--display); font-weight: 900; font-size: 21px; letter-spacing: .4px; color: var(--copper); padding: 2px 12px 18px; }
  .sk-root nav button { flex-direction: row !important; justify-content: flex-start !important; gap: 13px !important; padding: 12px 14px !important; border-radius: 12px !important; }
  .sk-root nav button:hover { background: rgba(255,255,255,.05) !important; color: #e6e8eb !important; }
  .sk-root nav button span { font-size: 13.5px !important; }

  /* sidebar v2: główny przycisk pod logo, równe pozycje, aktywna = pasek z lewej */
  .sk-root nav::before { order: -2; }
  .sk-root nav { border-radius: 0 !important; box-shadow: none !important; border-left: none !important; border-top: none !important; border-bottom: none !important; margin: 0 !important; }
  .sk-root nav button { min-height: 44px !important; color: #9aa1ab !important; position: relative; }
  .sk-root nav button > span:first-child { width: 24px !important; height: 24px !important; background: transparent !important; border-radius: 0 !important; }
  .sk-root nav button > span:last-child { font-size: 14px !important; font-weight: 600 !important; }
  .sk-root nav button[style*="var(--copper)"]:not(.sk-fab) { color: #fff !important; background: rgba(255,255,255,.07) !important; box-shadow: inset 3px 0 0 var(--copper); border-radius: 4px 12px 12px 4px !important; }
  .sk-root nav button[style*="var(--copper)"]:not(.sk-fab) > span:first-child { color: var(--copper) !important; }
  .sk-root nav .sk-fab { order: -1; margin: 0 0 16px !important; padding: 12px 14px !important; background: var(--grad) !important; color: #fff !important; box-shadow: 0 6px 16px -8px rgba(180,80,27,.6) !important; animation: none !important; }
  .sk-root nav .sk-fab > span:first-child { width: 24px !important; height: 24px !important; border-radius: 0 !important; background: transparent !important; box-shadow: none !important; }
  .sk-root nav .sk-fab > span:first-child svg { width: 20px; height: 20px; }
  .sk-root nav .sk-fab > span:last-child { font-size: 0 !important; }
  .sk-root nav .sk-fab > span:last-child::after { content: "Nowe przyjęcie"; font-size: 14px; font-weight: 800; }
  .sk-root nav .sk-fab:hover { filter: brightness(1.08); background: var(--grad) !important; }
  .sk-switcher { left: 260px !important; bottom: 28px !important; }

  /* panel Szef: modal na środku, siatka 2 kolumny */
  .sk-kat-ov { align-items: center !important; padding: 32px; }
  .sk-kat { max-width: 760px !important; border-radius: 22px !important; border-bottom: 1px solid var(--line) !important; animation: fade .18s ease !important; padding: 18px 22px 22px !important; }
  .sk-kat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  .sk-kat > div:first-child { display: none; }
  .sk-kat-item:hover { border-color: var(--line2) !important; filter: none !important; transform: translateY(-1px); }

  /* arkusze: wycentrowany modal zamiast bottom-sheet */
  .sk-sheet-ov { align-items: center !important; padding: 32px; }
  .sk-sheet { max-width: 640px !important; border-radius: 22px !important; border: 1px solid var(--line) !important; max-height: 88vh !important; animation: fade .18s ease !important; }

  /* ergonomia myszy i duzego ekranu */
  .sk-root button:hover { filter: brightness(1.07); }
  .sk-card { transition: border-color .15s ease; }
  .sk-root ::-webkit-scrollbar { width: 10px; height: 10px; }
  .sk-root ::-webkit-scrollbar-thumb { background: var(--line2); border-radius: 99px; }
  .sk-root input, .sk-root textarea, .sk-root select { font-size: 14.5px; }
}
`;
