-- SkupOS — 0002: przejście z „worków” na tabele bez utraty historii
-- app_id = identyfikator rekordu z aplikacji (np. "m_fe1", "kx81a2") → bezpieczny import i synchronizacja
alter table public.cennik     add column app_id text;
alter table public.klienci    add column app_id text;
alter table public.transakcje add column app_id text;
alter table public.wydania    add column app_id text;
create unique index cennik_app_id     on public.cennik(firma_id, app_id)     where app_id is not null;
create unique index klienci_app_id    on public.klienci(firma_id, app_id)    where app_id is not null;
create unique index transakcje_app_id on public.transakcje(firma_id, app_id) where app_id is not null;
create unique index wydania_app_id    on public.wydania(firma_id, app_id)    where app_id is not null;

-- import historii: zachowaj numer z aplikacji; nowe dokumenty dostają numer z bazy
create or replace function public.nadaj_numer() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int; y int := extract(year from now()); m int := extract(month from now());
begin
  if new.nr is not null then return new; end if;
  insert into numeracja(firma_id, rodzaj, rok, miesiac, ostatni) values (new.firma_id, new.rodzaj, y, m, 1)
  on conflict (firma_id, rodzaj, rok, miesiac) do update set ostatni = numeracja.ostatni + 1
  returning ostatni into n;
  new.nr := format('%s/%s/%s/%s', new.rodzaj, y, lpad(m::text,2,'0'), lpad(n::text,4,'0'));
  return new;
end $$;

-- po imporcie: liczniki numeracji = najwyższy zaimportowany numer w każdym miesiącu
create or replace function public.ustaw_numeracje() returns int
language plpgsql security definer set search_path = public as $$
declare k int;
begin
  if public.my_rola() <> 'owner' then raise exception 'Tylko właściciel'; end if;
  insert into numeracja(firma_id, rodzaj, rok, miesiac, ostatni)
  select firma_id, split_part(nr,'/',1), split_part(nr,'/',2)::int, split_part(nr,'/',3)::int, max(split_part(nr,'/',4)::int)
  from transakcje where firma_id = public.my_firma() and nr ~ '^(FPO|KPO)/\d{4}/\d{2}/\d+$'
  group by 1,2,3,4
  on conflict (firma_id, rodzaj, rok, miesiac) do update set ostatni = greatest(numeracja.ostatni, excluded.ostatni);
  get diagnostics k = row_count;
  return k;
end $$;
grant execute on function public.ustaw_numeracje() to authenticated;

-- import zachowuje datę z aplikacji (created_at) — właściciel może ją ustawić tylko przy imporcie
-- (zwykłe przyjęcia dostają now() z domyślnej wartości)
