// Test mapowania aplikacja ↔ tabele (bez bazy): dane demo → wiersze → z powrotem = to samo
import assert from "node:assert/strict";
import { matToRow, rowToMat, txToRows, rowsToTx, klientToRow, klientKey, dispToRow, rowToDisp } from "../datalayer.js";
const F = "f1";
const mats = [{ id: "m_cu1", n: "Miedź 1A", g: "CU", buy: 30.5, sell: 33 }, { id: "m_fe1", n: "Stal", g: "FE", buy: 1.2, sell: 1.45 }];
const matRows = mats.map((m, i) => ({ ...matToRow(m, F), id: "db" + i }));
const mm = { m_cu1: "db0", m_fe1: "db1" }, back = { db0: "m_cu1", db1: "m_fe1" };
assert.deepEqual(matRows.map(rowToMat).map(({ id, n, buy, sell }) => ({ id, n, buy, sell })), mats.map(({ id, n, buy, sell }) => ({ id, n, buy, sell })));
const txs = [
  { id: "t1", no: "FPO/2026/11/0001", ts: Date.parse("2026-11-20T10:00:00Z"), kind: "FPO", payment: "gotowka", plate: "SK 12345", osoba: { imie: "Jan", nazwisko: "Kowalski", adres: "ul. Polna 1", dowod: "ABC123456" }, pos: [{ matId: "m_cu1", n: "Miedź 1A", w: 12.5, price: 30.5 }] },
  { id: "t2", no: "KPO/2026/11/0001", ts: Date.parse("2026-11-21T09:00:00Z"), kind: "KPO", payment: "przelew", plate: "WZ 1A", firma: { nazwa: "MetalTech", nip: "954-22-33-444" }, pos: [{ matId: "m_fe1", n: "Stal", w: 1500, price: 1.2 }, { matId: "m_cu1", n: "Miedź 1A", w: 3, price: 30 }] },
];
const kl = txs.map((t, i) => ({ ...klientToRow(t, F), id: "k" + i }));
assert.equal(klientKey(txs[1]), "F:9542233444");
const txRows = [], poz = [];
txs.forEach((t, i) => { const r = txToRows(t, F, "k" + i, mm); txRows.push({ ...r.tx, id: "x" + i }); r.pozycje.forEach((p) => poz.push({ ...p, transakcja_id: "x" + i })); });
assert.equal(txRows[1].suma, 1890); assert.equal(txRows[1].masa, 1503);
const round = rowsToTx(txRows, poz, kl, back);
const strip = (t) => ({ id: t.id, no: t.no, ts: t.ts, kind: t.kind, payment: t.payment, plate: t.plate, osoba: t.osoba, firma: t.firma, pos: t.pos.map(({ matId, n, w, price }) => ({ matId, n, w, price })) });
assert.deepEqual(round.map(strip).sort((a, b) => a.ts - b.ts), txs.map(strip));
// grupa towaru wraca z cennika (bez niej dokument FPO nie zna kodu odpadu); pola FPO produkt/uwagi przechodzą w obie strony
const t3 = { id: "t3", no: "FPO/2026/11/0002", ts: Date.parse("2026-11-22T08:00:00Z"), kind: "FPO", payment: "gotowka", plate: "", produkt: "Rury i rynny", uwagi: "mokre", osoba: { imie: "A", nazwisko: "B", adres: "C", dowod: "D1" }, pos: [{ matId: "m_cu1", n: "Miedź 1A", w: 2, price: 30 }] };
const r3 = txToRows(t3, F, "k9", mm); assert.equal(r3.tx.produkt, "Rury i rynny");
const back3 = rowsToTx([{ ...r3.tx, id: "x9" }], r3.pozycje.map((p) => ({ ...p, transakcja_id: "x9" })), [{ id: "k9", typ: "osoba" }], back, { db0: "CU", db1: "FE" })[0];
assert.equal(back3.pos[0].g, "CU"); assert.equal(back3.produkt, "Rury i rynny"); assert.equal(back3.uwagi, "mokre");
const d = { id: "d1", matId: "m_fe1", w: 900, contractor: "Cognor", dateKey: "2026-11-22", ts: Date.parse("2026-11-22T12:00:00Z") };
const dr = rowToDisp({ ...dispToRow(d, F, mm), id: "w1", created_at: "2026-11-22T12:00:00Z" }, back);
assert.deepEqual({ id: dr.id, matId: dr.matId, w: dr.w, contractor: dr.contractor, dateKey: dr.dateKey }, { id: "d1", matId: "m_fe1", w: 900, contractor: "Cognor", dateKey: "2026-11-22" });
// 333: ważenie brutto/tara — masa = netto, brutto i tara przechodzą w obie strony; pozycja bez brutto nie dostaje kolumn
const t4 = { id: "t4", no: "FPO/2026/11/0003", ts: Date.parse("2026-11-23T08:00:00Z"), kind: "FPO", payment: "gotowka", plate: "", osoba: { imie: "A", nazwisko: "B", adres: "C", dowod: "D1" }, pos: [{ matId: "m_fe1", n: "Stal", w: 1240, price: 1.2, brutto: 3100, tara: 1860 }, { matId: "m_cu1", n: "Miedź 1A", w: 3, price: 30.5 }] };
const r4 = txToRows(t4, F, "k8", mm);
assert.equal(r4.pozycje[0].masa, 1240); assert.equal(r4.pozycje[0].brutto, 3100); assert.equal(r4.pozycje[0].tara, 1860);
assert.equal("brutto" in r4.pozycje[1], false);
const back4 = rowsToTx([{ ...r4.tx, id: "x8" }], r4.pozycje.map((p) => ({ ...p, transakcja_id: "x8" })), [{ id: "k8", typ: "osoba" }], back)[0];
assert.equal(back4.pos[0].brutto, 3100); assert.equal(back4.pos[0].tara, 1860); assert.equal(back4.pos[1].brutto, undefined);
console.log("datalayer: mapowanie w obie strony OK (cennik, klienci, przyjęcia z pozycjami, grupa towaru, produkt/uwagi FPO, wydania, brutto/tara)");
