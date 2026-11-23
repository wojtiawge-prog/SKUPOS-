-- SkupOS — 0003: łącznik aplikacji z nową bazą (etap 222)
-- Aplikacja (cloud.js) potrzebuje: tabeli ustawień (pozostałe „worki”), zgłoszeń klientów,
-- uprawnień ról, loginu w profilu oraz rejestracji przez funkcje (bez bezpośrednich insertów do firm/profili).

-- ── Profil: login (e-mail) do wyświetlania ───────────────────────────
alter table public.profile add column if not exists login text;

-- ── Przyjęcia: pola FPO wg wzoru (Dz.U. 2013 poz. 1607) ──────────────
alter table public.transakcje add column if not exists produkt text;
alter table public.transakcje add column if not exists uwagi text;

-- ── Pracownik wagi może dopisać tablicę rejestracyjną stałemu klientowi ──
drop policy if exists klienci_upd on public.klienci;
create policy klienci_upd on public.klienci for update
  using (firma_id = public.my_firma() and public.my_rola() in ('owner','operator','pracownik'));

-- ── Ustawienia: pozostałe dane aplikacji (zadania, kontrole, koszty, marketing…) ──
create table public.ustawienia (
  firma_id uuid not null references public.firmy(id) on delete cascade,
  klucz text not null,
  wartosc jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid(),
  primary key (firma_id, klucz),
  -- dane osobowe i hasła NIGDY w workach: przyjęcia są w tabelach, konta w Auth
  constraint ustawienia_zakazane check (klucz not in ('sk_tx_v2','sk_users_v2','sk_session_v2','sk_cloud_prof'))
);
alter table public.ustawienia enable row level security;
create policy ust_sel on public.ustawienia for select using (
  firma_id = public.my_firma() and (
    public.is_staff() or (public.my_rola() = 'client' and klucz in ('sk_mat_v2','sk_co_v2'))));
create policy ust_ins on public.ustawienia for insert with check (
  firma_id = public.my_firma() and public.is_staff()
  and (klucz not in ('sk_co_v2','sk_perms_v2') or public.my_rola() = 'owner'));
create policy ust_upd on public.ustawienia for update using (
  firma_id = public.my_firma() and public.is_staff()
  and (klucz not in ('sk_co_v2','sk_perms_v2') or public.my_rola() = 'owner'));

create or replace function public.ustawienia_stempel() returns trigger language plpgsql set search_path = public as
$$ begin new.updated_at := now(); new.updated_by := auth.uid(); return new; end $$;
create trigger trg_ust_stempel before insert or update on public.ustawienia for each row execute function public.ustawienia_stempel();

-- ── Zgłoszenia klientów (wyceny ze zdjęcia, prośby o odbiór) ─────────
create table public.zgloszenia (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmy(id) on delete cascade,
  klient_id uuid default auth.uid() references auth.users(id) on delete set null,
  imie text, telefon text, opis text, material text, rejestracja text,
  foto_url text,
  status text not null default 'nowe' check (status in ('nowe','w_toku','wycenione','zamkniete','odrzucone')),
  utworzono timestamptz not null default now()
);
create index on public.zgloszenia(firma_id, utworzono desc);
alter table public.zgloszenia enable row level security;
create policy zgl_sel on public.zgloszenia for select using (
  firma_id = public.my_firma() and (public.is_staff() or klient_id = auth.uid()));
create policy zgl_ins on public.zgloszenia for insert with check (
  firma_id = public.my_firma() and (public.is_staff() or (public.my_rola() = 'client' and klient_id = auth.uid() and status = 'nowe')));
create policy zgl_upd on public.zgloszenia for update using (firma_id = public.my_firma() and public.is_staff());

-- ── Uprawnienia ról (presety właściciela) ────────────────────────────
create table public.uprawnienia_rol (
  firma_id uuid not null references public.firmy(id) on delete cascade,
  rola text not null,
  perms jsonb not null default '{}',
  primary key (firma_id, rola)
);
alter table public.uprawnienia_rol enable row level security;
create policy upr_sel on public.uprawnienia_rol for select using (firma_id = public.my_firma() and public.is_staff());
create policy upr_ins on public.uprawnienia_rol for insert with check (firma_id = public.my_firma() and public.my_rola() = 'owner');
create policy upr_upd on public.uprawnienia_rol for update using (firma_id = public.my_firma() and public.my_rola() = 'owner');

grant select, insert, update on public.ustawienia, public.zgloszenia, public.uprawnienia_rol to authenticated;
revoke all on public.ustawienia, public.zgloszenia, public.uprawnienia_rol from anon;

-- ── Rejestracja właściciela: pełne dane firmy w jednej funkcji ──────
drop function if exists public.zaloz_firme(text, text, text);
create or replace function public.zaloz_firme(p_nazwa text, p_nip text, p_imie text,
  p_adres text default null, p_bdo text default null, p_login text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare f uuid;
begin
  if auth.uid() is null then raise exception 'Brak logowania'; end if;
  if exists (select 1 from profile where id = auth.uid()) then raise exception 'Konto ma już firmę'; end if;
  if coalesce(trim(p_nazwa), '') = '' then raise exception 'Podaj nazwę firmy'; end if;
  insert into firmy(nazwa, nip, adres, bdo) values (trim(p_nazwa), nullif(trim(p_nip), ''), nullif(trim(p_adres), ''), nullif(trim(p_bdo), ''))
    returning id into f;
  insert into profile(id, firma_id, rola, imie, login) values (auth.uid(), f, 'owner', coalesce(p_imie, ''), p_login);
  return f;
end $$;

-- ── Klient portalu podpina się do skupu z linku/QR (widzi tylko cennik i swoje zgłoszenia) ──
create or replace function public.dolacz_jako_klient(p_firma uuid, p_imie text, p_login text default null) returns uuid
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Brak logowania'; end if;
  if exists (select 1 from profile where id = auth.uid()) then raise exception 'Konto jest już przypisane'; end if;
  if not exists (select 1 from firmy where id = p_firma) then raise exception 'Nie ma takiego skupu'; end if;
  insert into profile(id, firma_id, rola, imie, login) values (auth.uid(), p_firma, 'client', coalesce(nullif(trim(p_imie), ''), 'Klient'), p_login);
  return p_firma;
end $$;

-- ── Przyjęcie zaproszenia z loginem ──────────────────────────────────
drop function if exists public.przyjmij_zaproszenie(text, text);
create or replace function public.przyjmij_zaproszenie(p_kod text, p_imie text, p_login text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare z zaproszenia;
begin
  if auth.uid() is null then raise exception 'Brak logowania'; end if;
  if exists (select 1 from profile where id = auth.uid()) then raise exception 'Konto jest już przypisane'; end if;
  select * into z from zaproszenia where kod = upper(trim(p_kod)) and uzyte_przez is null and wazne_do > now() for update;
  if not found then raise exception 'Zaproszenie nieważne'; end if;
  insert into profile(id, firma_id, rola, imie, login) values (auth.uid(), z.firma_id, z.rola, coalesce(p_imie, ''), p_login);
  update zaproszenia set uzyte_przez = auth.uid() where kod = z.kod;
  return z.firma_id;
end $$;

-- ── Twardsze funkcje: stała ścieżka schematu ─────────────────────────
create or replace function public.is_staff() returns boolean
language sql stable set search_path = public as $$ select public.my_rola() in ('owner','operator','pracownik','kierowca','accountant') $$;
create or replace function public.is_manager() returns boolean
language sql stable set search_path = public as $$ select public.my_rola() in ('owner','operator') $$;
create or replace function public.blokuj_kasowanie() returns trigger language plpgsql set search_path = public as
$$ begin raise exception 'Przyjęć nie usuwa się — użyj anulowania z podaniem powodu.'; end $$;

-- ── Funkcje tylko dla zalogowanych (domyślnie Postgres daje EXECUTE wszystkim) ──
revoke execute on all functions in schema public from public, anon;
grant execute on function public.my_firma(), public.my_rola(), public.is_staff(), public.is_manager(),
  public.zaloz_firme(text,text,text,text,text,text), public.dolacz_jako_klient(uuid,text,text),
  public.utworz_zaproszenie(public.rola), public.przyjmij_zaproszenie(text,text,text),
  public.ai_zuzyj(int), public.ustaw_numeracje() to authenticated;
