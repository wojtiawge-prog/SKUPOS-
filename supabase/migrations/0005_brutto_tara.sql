-- 333: ważenie brutto / tara na pozycji przyjęcia.
-- Tylko dodanie kolumn (bez DROP). masa pozostaje NETTO i dalej liczy wartość.
-- UWAGA: wdrożyć na SKUPOS-prod PRZED scaleniem gałęzi etap-333 do main,
-- bo aplikacja z tej gałęzi wysyła kolumny brutto/tara.
alter table public.pozycje
  add column if not exists brutto numeric(12,1) check (brutto is null or brutto > 0),
  add column if not exists tara   numeric(12,1) check (tara is null or tara >= 0);

alter table public.pozycje
  add constraint pozycje_brutto_tara_netto
  check (brutto is null or (tara is not null and brutto > tara and abs((brutto - tara) - masa) < 0.15));
