// Test schematu na PGlite: npm i @electric-sql/pglite && node supabase/test_rls.mjs
import { PGlite } from "@electric-sql/pglite";
import fs from "fs";
const db = new PGlite();
await db.exec(`
create schema auth; create table auth.users(id uuid primary key);
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true),'')::uuid $$;
create schema storage; create table storage.buckets(id text primary key, name text, public bool, file_size_limit int, allowed_mime_types text[]);
create table storage.objects(id uuid default gen_random_uuid(), bucket_id text, name text);
create or replace function storage.foldername(n text) returns text[] language sql as $$ select string_to_array(n,'/') $$;
create role authenticated; create role anon;
`);
const sql = fs.readFileSync("/home/claude/skupos-/supabase/migrations/0001_skupos_core.sql","utf8");
await db.exec(sql);
// scenariusz: właściciel zakłada firmę, dodaje przyjęcie, numer nadany, kasowanie zablokowane, dziennik
const o='11111111-1111-1111-1111-111111111111';
await db.exec(`insert into auth.users values ('${o}'); set test.uid='${o}';`);
const f=(await db.query(`select public.zaloz_firme('Skup Test','1234567890','Zdzisław') as f`)).rows[0].f;
await db.exec(`insert into public.transakcje(firma_id,rodzaj,utworzyl) values ('${f}','FPO','${o}'),('${f}','FPO','${o}'),('${f}','KPO','${o}')`);
console.log((await db.query(`select nr from public.transakcje order by nr`)).rows.map(r=>r.nr).join(', '));
try{ await db.exec(`delete from public.transakcje`); console.log('BŁĄD: kasowanie przeszło'); }catch(e){ console.log('kasowanie zablokowane OK:', e.message.slice(0,60)); }
console.log('dziennik:', (await db.query(`select count(*)::int n from public.dziennik`)).rows[0].n, 'wpisów');
console.log('rola:', (await db.query(`select public.my_rola() r`)).rows[0].r, '| AI limit:', (await db.query(`select public.ai_zuzyj(2) a`)).rows[0].a, (await db.query(`select public.ai_zuzyj(2) a`)).rows[0].a, (await db.query(`select public.ai_zuzyj(2) a`)).rows[0].a);
const k=(await db.query(`select public.utworz_zaproszenie('pracownik') k`)).rows[0].k;
const w='22222222-2222-2222-2222-222222222222';
await db.exec(`insert into auth.users values ('${w}'); set test.uid='${w}';`);
await db.query(`select public.przyjmij_zaproszenie($1,'Janek')`,[k]);
console.log('pracownik rola:', (await db.query(`select public.my_rola() r`)).rows[0].r);
try{ await db.query(`select public.utworz_zaproszenie('owner')`); console.log('BŁĄD'); }catch(e){ console.log('pracownik nie zaprasza OK'); }
console.log('WSZYSTKO OK');
// izolacja firm (RLS) jako zwykły użytkownik
const o2='33333333-3333-3333-3333-333333333333';
await db.exec(`insert into auth.users values ('${o2}'); set test.uid='${o2}';`);
await db.query(`select public.zaloz_firme('Konkurencja','999','Obcy')`);
await db.exec(`grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated; set role authenticated;`);
console.log('obcy właściciel widzi przyjęć:', (await db.query(`select count(*)::int n from public.transakcje`)).rows[0].n, '(ma być 0)');
await db.exec(`set test.uid='${w}';`);
console.log('pracownik widzi przyjęć swojej firmy:', (await db.query(`select count(*)::int n from public.transakcje`)).rows[0].n, '(ma być 3) | dziennik:', (await db.query(`select count(*)::int n from public.dziennik`)).rows[0].n, '(ma być 0 — tylko właściciel)');
try { await db.exec(`update public.profile set rola='owner' where id='${w}'`); const r=(await db.query(`select rola from public.profile where id='${w}'`)).rows[0]; console.log('pracownik próbuje zostać właścicielem →', r ? r.rola : 'brak'); } catch(e){ console.log('zmiana roli zablokowana OK'); }
