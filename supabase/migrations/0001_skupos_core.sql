-- ════════════════════════════════════════════════════════════════════
-- SkupOS — schemat bazy v1 (P0: bezpieczeństwo)
-- Zasady: każda firma widzi tylko swoje dane (RLS po firma_id),
-- uprawnienia sprawdza BAZA (nie przeglądarka), żadnych haseł w danych,
-- zdjęcia dowodów w prywatnym magazynie plików, dziennik zmian z wyzwalaczy,
-- przyjęć się nie kasuje — tylko anuluje (ślad dla kontroli).
-- Uruchomić na NOWYM projekcie Supabase (region eu-central-1 Frankfurt).
-- ════════════════════════════════════════════════════════════════════

-- ── Firmy i ludzie ──────────────────────────────────────────────────
create table public.firmy (
  id uuid primary key default gen_random_uuid(),
  nazwa text not null,
  nip text,
  bdo text,
  adres text,
  plan text not null default 'pro',
  created_at timestamptz not null default now()
);

create type public.rola as enum ('owner','operator','pracownik','kierowca','accountant','client');

create table public.profile (
  id uuid primary key references auth.users(id) on delete cascade,
  firma_id uuid not null references public.firmy(id) on delete cascade,
  rola public.rola not null,
  imie text not null default '',
  aktywny boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.profile(firma_id);

create table public.zaproszenia (
  kod text primary key default upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  firma_id uuid not null references public.firmy(id) on delete cascade,
  rola public.rola not null,
  wazne_do timestamptz not null default now() + interval '7 days',
  uzyte_przez uuid references auth.users(id),
  utworzyl uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ── Funkcje pomocnicze (czytają rolę z bazy, nie z przeglądarki) ───
create or replace function public.my_firma() returns uuid
language sql stable security definer set search_path = public as
$$ select firma_id from profile where id = auth.uid() and aktywny $$;

create or replace function public.my_rola() returns public.rola
language sql stable security definer set search_path = public as
$$ select rola from profile where id = auth.uid() and aktywny $$;

create or replace function public.is_staff() returns boolean
language sql stable as $$ select public.my_rola() in ('owner','operator','pracownik','kierowca','accountant') $$;

create or replace function public.is_manager() returns boolean
language sql stable as $$ select public.my_rola() in ('owner','operator') $$;

-- ── Cennik ──────────────────────────────────────────────────────────
create table public.cennik (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmy(id) on delete cascade,
  kod text,
  nazwa text not null,
  grupa text not null default 'FE',
  cena_skup numeric(10,2) not null default 0,
  cena_sprzedaz numeric(10,2) not null default 0,
  kod_odpadu text,               -- np. 17 04 05
  aktywny boolean not null default true,
  updated_at timestamptz not null default now()
);
create index on public.cennik(firma_id);

-- ── Klienci (dane osobowe — tylko pracownicy skupu) ────────────────
create table public.klienci (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmy(id) on delete cascade,
  typ text not null check (typ in ('osoba','firma')),
  imie text, nazwisko text, nazwa text, nip text,
  adres text, dowod_nr text,
  rejestracje text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index on public.klienci(firma_id);
create index on public.klienci using gin (rejestracje);

-- ── Numeracja dokumentów (ciągła, bez dziur, po stronie bazy) ──────
create table public.numeracja (
  firma_id uuid not null references public.firmy(id) on delete cascade,
  rodzaj text not null, rok int not null, miesiac int not null,
  ostatni int not null default 0,
  primary key (firma_id, rodzaj, rok, miesiac)
);

-- ── Przyjęcia (FPO/KPO) i pozycje ───────────────────────────────────
create table public.transakcje (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmy(id) on delete cascade,
  nr text,
  rodzaj text not null check (rodzaj in ('FPO','KPO')),
  klient_id uuid references public.klienci(id),
  rejestracja text,
  platnosc text not null default 'gotowka' check (platnosc in ('gotowka','przelew','blik')),
  pochodzenie text,
  oswiadczenie boolean not null default false,
  suma numeric(12,2) not null default 0,
  masa numeric(12,1) not null default 0,
  utworzyl uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  anulowana boolean not null default false,
  anulowal uuid references auth.users(id),
  anulowano_at timestamptz,
  powod_anulowania text
);
create index on public.transakcje(firma_id, created_at desc);

create table public.pozycje (
  id uuid primary key default gen_random_uuid(),
  transakcja_id uuid not null references public.transakcje(id) on delete cascade,
  firma_id uuid not null references public.firmy(id) on delete cascade,
  towar_id uuid references public.cennik(id),
  nazwa text not null,
  masa numeric(12,1) not null check (masa > 0),
  cena numeric(10,2) not null check (cena >= 0),
  wartosc numeric(12,2) generated always as (round(masa * cena, 2)) stored
);
create index on public.pozycje(transakcja_id);

create or replace function public.nadaj_numer() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int; y int := extract(year from now()); m int := extract(month from now());
begin
  insert into numeracja(firma_id, rodzaj, rok, miesiac, ostatni) values (new.firma_id, new.rodzaj, y, m, 1)
  on conflict (firma_id, rodzaj, rok, miesiac) do update set ostatni = numeracja.ostatni + 1
  returning ostatni into n;
  new.nr := format('%s/%s/%s/%s', new.rodzaj, y, lpad(m::text,2,'0'), lpad(n::text,4,'0'));
  return new;
end $$;
create trigger trg_nadaj_numer before insert on public.transakcje for each row execute function public.nadaj_numer();

-- przyjęć nie wolno kasować — tylko anulować (z powodem)
create or replace function public.blokuj_kasowanie() returns trigger language plpgsql as
$$ begin raise exception 'Przyjęć nie usuwa się — użyj anulowania z podaniem powodu.'; end $$;
create trigger trg_blokuj_kasowanie before delete on public.transakcje for each row execute function public.blokuj_kasowanie();

-- ── Wydania do huty (sprzedaż) ──────────────────────────────────────
create table public.wydania (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmy(id) on delete cascade,
  towar_id uuid references public.cennik(id),
  masa numeric(12,1) not null check (masa > 0),
  cena numeric(10,2),
  odbiorca text,
  kpo_nr text,
  data date not null default current_date,
  utworzyl uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);
create index on public.wydania(firma_id, data desc);

-- ── Zdjęcia (dowód, towar, pojazd) — pliki w prywatnym Storage ─────
create table public.zdjecia (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmy(id) on delete cascade,
  transakcja_id uuid references public.transakcje(id) on delete cascade,
  typ text not null check (typ in ('dowod','towar','pojazd')),
  sciezka text not null,                 -- dowody/<firma_id>/<transakcja_id>/<plik>.jpg
  usun_po date not null default (current_date + interval '5 years'),
  created_at timestamptz not null default now()
);

-- ── Dziennik zmian (wypełniany wyzwalaczami — nie da się go obejść z aplikacji) ──
create table public.dziennik (
  id bigserial primary key,
  firma_id uuid not null,
  kto uuid,
  akcja text not null,
  tabela text not null,
  rekord_id uuid,
  przed jsonb,
  po jsonb,
  ts timestamptz not null default now()
);
create index on public.dziennik(firma_id, ts desc);

create or replace function public.zapisz_dziennik() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into dziennik(firma_id, kto, akcja, tabela, rekord_id, przed, po)
  values (coalesce(new.firma_id, old.firma_id), auth.uid(), tg_op, tg_table_name,
          coalesce(new.id, old.id),
          case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
          case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;
create trigger trg_dz_transakcje after insert or update on public.transakcje for each row execute function public.zapisz_dziennik();
create trigger trg_dz_cennik after insert or update or delete on public.cennik for each row execute function public.zapisz_dziennik();
create trigger trg_dz_wydania after insert or update or delete on public.wydania for each row execute function public.zapisz_dziennik();
create trigger trg_dz_profile after insert or update or delete on public.profile for each row execute function public.zapisz_dziennik();

-- ── Limit AI (ochrona budżetu) ──────────────────────────────────────
create table public.ai_uzycie (
  user_id uuid not null references auth.users(id) on delete cascade,
  dzien date not null default current_date,
  liczba int not null default 0,
  primary key (user_id, dzien)
);
create or replace function public.ai_zuzyj(p_limit int default 60) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_staff() then return false; end if;
  insert into ai_uzycie(user_id, dzien, liczba) values (auth.uid(), current_date, 1)
  on conflict (user_id, dzien) do update set liczba = ai_uzycie.liczba + 1 returning liczba into n;
  return n <= p_limit;
end $$;

-- ── Rejestracja: firma + właściciel, zaproszenia dla pracowników ───
create or replace function public.zaloz_firme(p_nazwa text, p_nip text, p_imie text) returns uuid
language plpgsql security definer set search_path = public as $$
declare f uuid;
begin
  if auth.uid() is null then raise exception 'Brak logowania'; end if;
  if exists (select 1 from profile where id = auth.uid()) then raise exception 'Konto ma już firmę'; end if;
  insert into firmy(nazwa, nip) values (p_nazwa, p_nip) returning id into f;
  insert into profile(id, firma_id, rola, imie) values (auth.uid(), f, 'owner', p_imie);
  return f;
end $$;

create or replace function public.utworz_zaproszenie(p_rola public.rola) returns text
language plpgsql security definer set search_path = public as $$
declare k text;
begin
  if public.my_rola() <> 'owner' then raise exception 'Tylko właściciel zaprasza'; end if;
  if p_rola = 'owner' then raise exception 'Nie można zaprosić drugiego właściciela'; end if;
  insert into zaproszenia(firma_id, rola, utworzyl) values (public.my_firma(), p_rola, auth.uid()) returning kod into k;
  return k;
end $$;

create or replace function public.przyjmij_zaproszenie(p_kod text, p_imie text) returns uuid
language plpgsql security definer set search_path = public as $$
declare z zaproszenia;
begin
  if auth.uid() is null then raise exception 'Brak logowania'; end if;
  if exists (select 1 from profile where id = auth.uid()) then raise exception 'Konto jest już przypisane'; end if;
  select * into z from zaproszenia where kod = p_kod and uzyte_przez is null and wazne_do > now() for update;
  if not found then raise exception 'Zaproszenie nieważne'; end if;
  insert into profile(id, firma_id, rola, imie) values (auth.uid(), z.firma_id, z.rola, p_imie);
  update zaproszenia set uzyte_przez = auth.uid() where kod = p_kod;
  return z.firma_id;
end $$;

-- ── RLS: włączone wszędzie ──────────────────────────────────────────
alter table public.firmy enable row level security;
alter table public.profile enable row level security;
alter table public.zaproszenia enable row level security;
alter table public.cennik enable row level security;
alter table public.klienci enable row level security;
alter table public.numeracja enable row level security;
alter table public.transakcje enable row level security;
alter table public.pozycje enable row level security;
alter table public.wydania enable row level security;
alter table public.zdjecia enable row level security;
alter table public.dziennik enable row level security;
alter table public.ai_uzycie enable row level security;

create policy firmy_sel on public.firmy for select using (id = public.my_firma());
create policy firmy_upd on public.firmy for update using (id = public.my_firma() and public.my_rola() = 'owner');

create policy profile_sel on public.profile for select using (id = auth.uid() or (firma_id = public.my_firma() and public.is_manager()));
create policy profile_upd on public.profile for update using (firma_id = public.my_firma() and public.my_rola() = 'owner' and id <> auth.uid());
-- brak polityki INSERT: profile powstają tylko przez zaloz_firme / przyjmij_zaproszenie

create policy zapr_sel on public.zaproszenia for select using (firma_id = public.my_firma() and public.my_rola() = 'owner');

-- cennik: wszyscy w firmie (także klient portalu) czytają, zmienia tylko kierownictwo
create policy cennik_sel on public.cennik for select using (firma_id = public.my_firma());
create policy cennik_ins on public.cennik for insert with check (firma_id = public.my_firma() and public.is_manager());
create policy cennik_upd on public.cennik for update using (firma_id = public.my_firma() and public.is_manager());
create policy cennik_del on public.cennik for delete using (firma_id = public.my_firma() and public.my_rola() = 'owner');

-- klienci i przyjęcia: tylko personel skupu (NIGDY klient portalu)
create policy klienci_sel on public.klienci for select using (firma_id = public.my_firma() and public.is_staff() and public.my_rola() <> 'kierowca');
create policy klienci_ins on public.klienci for insert with check (firma_id = public.my_firma() and public.my_rola() in ('owner','operator','pracownik'));
create policy klienci_upd on public.klienci for update using (firma_id = public.my_firma() and public.is_manager());

create policy tx_sel on public.transakcje for select using (firma_id = public.my_firma() and public.my_rola() in ('owner','operator','pracownik','accountant'));
create policy tx_ins on public.transakcje for insert with check (firma_id = public.my_firma() and public.my_rola() in ('owner','operator','pracownik') and utworzyl = auth.uid());
create policy tx_upd on public.transakcje for update using (firma_id = public.my_firma() and public.is_manager());

create policy poz_sel on public.pozycje for select using (firma_id = public.my_firma() and public.my_rola() in ('owner','operator','pracownik','accountant'));
create policy poz_ins on public.pozycje for insert with check (firma_id = public.my_firma() and public.my_rola() in ('owner','operator','pracownik'));

create policy wyd_sel on public.wydania for select using (firma_id = public.my_firma() and public.is_staff());
create policy wyd_ins on public.wydania for insert with check (firma_id = public.my_firma() and public.my_rola() in ('owner','operator','kierowca'));
create policy wyd_upd on public.wydania for update using (firma_id = public.my_firma() and public.is_manager());
create policy wyd_del on public.wydania for delete using (firma_id = public.my_firma() and public.my_rola() = 'owner');

create policy zdj_sel on public.zdjecia for select using (firma_id = public.my_firma() and public.is_manager());
create policy zdj_ins on public.zdjecia for insert with check (firma_id = public.my_firma() and public.my_rola() in ('owner','operator','pracownik'));

create policy dz_sel on public.dziennik for select using (firma_id = public.my_firma() and public.my_rola() = 'owner');
-- numeracja, ai_uzycie: brak polityk = brak dostępu z aplikacji (tylko funkcje security definer)

-- ── Uprawnienia ─────────────────────────────────────────────────────
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke all on public.numeracja, public.ai_uzycie from authenticated;
grant execute on function public.zaloz_firme(text,text,text), public.utworz_zaproszenie(public.rola),
  public.przyjmij_zaproszenie(text,text), public.ai_zuzyj(int) to authenticated;
revoke all on all tables in schema public from anon;

-- ── Storage: prywatny bucket na zdjęcia dowodów/towaru/pojazdu ─────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dowody', 'dowody', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy dowody_ins on storage.objects for insert to authenticated
  with check (bucket_id = 'dowody' and (storage.foldername(name))[1] = public.my_firma()::text
              and public.my_rola() in ('owner','operator','pracownik'));
create policy dowody_sel on storage.objects for select to authenticated
  using (bucket_id = 'dowody' and (storage.foldername(name))[1] = public.my_firma()::text and public.is_manager());
create policy dowody_del on storage.objects for delete to authenticated
  using (bucket_id = 'dowody' and (storage.foldername(name))[1] = public.my_firma()::text and public.my_rola() = 'owner');
