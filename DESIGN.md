# SkupOS — kierunek wyglądu (wzór od Wojciecha, 25.11.2026)

Wzory: aplikacja Claude (lista i ekran startowy), ING (przegląd konta), YouTube.
Hasło: **prosto, nowocześnie, bardzo przejrzyście.**

## Zasady
1. **Ciemne tło jako domyślne.** Prawie czarne tło, karty o ton jaśniejsze. Bez ramek, bez cieni, bez gradientów.
2. **Jeden kolor akcentu.** Miedź SkupOS używana oszczędnie: aktywna zakładka, nagłówki sekcji, kluczowa liczba. Reszta w bieli i szarościach (jak pomarańcz w ING, czerwień w YouTube).
3. **Duże, pewne nagłówki.** Tytuł ekranu 32–34 px, pogrubiony. Nagłówek sekcji 24–28 px w kolorze akcentu.
4. **Listy bez linii.** Wiersz = ikona konturowa + tekst 18 px, wysokość ~56–64 px, odstęp zamiast kresek.
5. **Karty zaokrąglone 20–24 px**, padding 16–20 px, kwota wyrównana do prawej.
6. **Jedna główna akcja na ekranie:** biały przycisk-pigułka z ciemnym tekstem (jak „New session”), np. „Nowe przyjęcie”.
7. **Dolny pasek 4–5 zakładek:** ikona + podpis, aktywna biała (albo w akcencie), nieaktywne szare. Bez tła pod ikoną.
8. **Wyszukiwarka jako szara pigułka** na górze list (klienci, cennik, przyjęcia).
9. **Ikony konturowe** (lucide, grubość 1,75), przyciski ikonowe okrągłe 44 px.
10. **Pusty ekran = jedno zdanie i jedna akcja**, wyśrodkowane (jak „Let’s noodle”).

## Tokeny (propozycja do v1 szablonów)
| Token | Wartość |
|---|---|
| --bg | #121212 |
| --surface | #1f1f1f |
| --surface-2 | #2a2a2a |
| --text | #f5f5f4 |
| --muted | #9b9b98 |
| --faint | #6b6b68 |
| --accent (miedź) | #d97b47 |
| --success | #3fb27f |
| --danger | #e5484d |
| promień karty | 22 px |
| promień pigułki | 999 px |
| font tekstu | system (SF Pro / Roboto), 16–18 px |
| font nagłówków | system, 700–800 |
| liczby | tabular-nums, bez osobnej czcionki mono w UI (mono tylko na wydrukach) |

## Plan szablonów (do zrobienia)
1. Pulpit „Dziś” (karta wyniku dnia + lista ostatnich przyjęć)
2. Nowe przyjęcie (jedna kolumna, duże pola wagi, biała pigułka „Zapisz i wydrukuj”)
3. Cennik (lista bez linii + wyszukiwarka-pigułka)
4. Magazyn (karty materiałów, kwota/masa po prawej)
5. Szef (sekcje z nagłówkami w akcencie jak „Your plan / Your cards”)
6. Portal klienta (ten sam system, jaśniejszy akcent)
