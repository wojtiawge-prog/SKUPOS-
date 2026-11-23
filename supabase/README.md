# SkupOS — baza danych (P0)

Pakiet gotowy do uruchomienia na **nowym** projekcie Supabase (region Frankfurt, eu-central-1).

1. `migrations/0001_skupos_core.sql` — tabele, numeracja FPO/KPO po stronie bazy, RLS dla każdej roli,
   blokada kasowania przyjęć (tylko anulowanie), dziennik zmian z wyzwalaczy, limit AI,
   rejestracja firmy i zaproszenia pracowników, prywatny bucket `dowody` na zdjęcia.
2. `functions/agent-ai` — AI tylko dla zalogowanego personelu, dzienny limit, klucz Anthropic wyłącznie w sekretach.

Kolejny krok (etap 2): przepięcie aplikacji z „worków” w tabeli `ustawienia` na powyższe tabele + migracja danych.
