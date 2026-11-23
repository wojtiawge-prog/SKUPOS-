-- SkupOS — 0004: zapisy z aplikacji (upsert po app_id) wymagają pełnego klucza unikalnego.
-- Częściowe indeksy z 0002 (WHERE app_id IS NOT NULL) nie działają z ON CONFLICT (firma_id, app_id).
-- Pełny UNIQUE dopuszcza wiele NULL-i, więc rekordy bez app_id dalej są dozwolone.
drop index if exists public.cennik_app_id;
drop index if exists public.klienci_app_id;
drop index if exists public.transakcje_app_id;
drop index if exists public.wydania_app_id;
alter table public.cennik     add constraint cennik_firma_app_id     unique (firma_id, app_id);
alter table public.klienci    add constraint klienci_firma_app_id    unique (firma_id, app_id);
alter table public.transakcje add constraint transakcje_firma_app_id unique (firma_id, app_id);
alter table public.wydania    add constraint wydania_firma_app_id    unique (firma_id, app_id);
