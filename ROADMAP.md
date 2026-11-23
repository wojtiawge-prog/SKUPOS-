# SkupOS — ROADMAP i komendy (źródło prawdy dla każdej sesji Claude)

Plan szczegółowy: dokument „SkupOS — droga do lidera rynku” (claude.ai/artifact/HkwBNiDvEU3VPYJFfJZuhA).
Zasady: jakość ponad prostotę; nic nie idzie do klientów bez „wdrażamy”; sekrety nigdy w repo/czacie;
każda zmiana = build (`npm run build`) + testy + commit + sprawozdanie.

## Stan (23.11.2026)
- [x] 123 — ocena interfejsu, czyszczenie (14 → 4 zakładki + Przyjęcie), jasny motyw, nowy wygląd
- [x] P0 w aplikacji — fałszywa waga, przełącznik ról, AI z tokenem, kolejka zapisu, własny build, eksport Excel, kopia, dziennik
- [x] P0 baza (gotowe, przetestowane, NIEwdrożone) — `supabase/migrations/0001_skupos_core.sql`, `supabase/functions/agent-ai`
- [ ] Ruch właściciela: nowy projekt Supabase (Frankfurt) → „baza gotowa”; klucz AI w Secrets; Cloudflare Pages; repo prywatne

## Komendy
| Komenda | Zakres |
|---|---|
| 1 | Sprawozdanie: zrobione / dalej / pytania |
| 111 | Pakiet bez właściciela: analiza aplikacji (4 role), konkurencja v2, warstwa danych pod tabele (za przełącznikiem), testy Playwright + GitHub Actions, wygląd (rzadkie ekrany, tryb ciemny, puste stany), wydruk FPO wg Dz.U. 2013 poz. 1607, szkice: regulamin / polityka prywatności / umowa powierzenia |
| 222 | Fundament: wdrożenie schematu, przepięcie na tabele, Supabase Auth + zaproszenia, Storage na dowody, anulowanie zamiast kasowania, Sentry, CI, kopie, środowisko testowe |
| 333 | Rdzeń: karta klienta + GUS/Biała lista, przyjęcie 20 s (tara/brutto/netto, zdjęcia), kasa KP/KW, magazyn na żywo + inwentaryzacja + kontenery, offline |
| 444 | Papiery: FPO/KPO PDF + 80 mm, BDO (KPO/KEO, masa od os. fiz., sprawozdanie), KSeF przez Fakturownię, PCC-4 XML, JPK, eksport do programów księgowych |
| 555 | Klient: portal (ceny, kwity, wyceny ze zdjęcia, odbiór), SMS/push o cenach (za zgodą), publiczny cennik + QR |
| 666 | Szef: wynik i marże, ranking dostawców, prognoza gotówki, AI-podpowiedzi (anomalie, ceny LME), wiele punktów |
| 777 | Sprzedaż: skupos.pl, rejestracja + 14 dni testu, kreator, import Excel, Stripe/BLIK, plany, prawo (po prawniku), pomoc, monitoring |
| 888 | Sprzęt: mostek wagi RS-232/Ethernet, kamery + ANPR, drukarki termiczne, skan MRZ |
| 999 | Europa: i18n (DE/CZ/SK/NL), waluty, moduły krajowe (eANV, ISOH, LMA), API |
| wdrażamy | podgląd → produkcja (od etapu 2) |
| stop | zakończ krok, zapisz stan, czekaj |

## Znane problemy (kolejka)
- Ekrany AI / wydruk / portal klienta: pojedyncze stare kolory po zmianie wyglądu
- Telemarketing w PL wymaga zgody (art. 398 PKE) — sprzedaż: wizyty, polecenia, inbound, telefony badawcze
