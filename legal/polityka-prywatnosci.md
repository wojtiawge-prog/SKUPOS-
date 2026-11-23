# Polityka prywatności SkupOS (PROJEKT — do weryfikacji przez prawnika)

Wersja: 0.1 · data: [DD.MM.RRRR]

## 1. Kto jest administratorem
Administratorem danych osób zakładających i używających kont w SkupOS (właściciele, pracownicy punktów skupu) oraz osób kontaktujących się z nami jest [Usługodawca, adres, NIP], e-mail: [privacy@skupos.pl].

**Ważne:** dane osób sprzedających złom (z formularzy FPO), klientów i kontrahentów punktów skupu przetwarza **punkt skupu jako administrator**. My przetwarzamy je wyłącznie w jego imieniu, na podstawie umowy powierzenia. W sprawie tych danych należy kontaktować się z danym punktem skupu.

## 2. Jakie dane, w jakim celu, na jakiej podstawie

| Cel | Dane | Podstawa (RODO) | Jak długo |
|---|---|---|---|
| Założenie i obsługa konta, świadczenie Usługi | imię, nazwisko, e-mail, telefon, rola, firma, logi logowania | art. 6 ust. 1 lit. b (umowa) | przez czas umowy + 30 dni na eksport |
| Rozliczenia, faktury | dane firmy, historia płatności | art. 6 ust. 1 lit. c (obowiązek prawny — przepisy podatkowe) | 5 lat od końca roku podatkowego |
| Bezpieczeństwo, dziennik zmian, zapobieganie nadużyciom | adres IP, identyfikator urządzenia, zdarzenia w aplikacji | art. 6 ust. 1 lit. f (prawnie uzasadniony interes) | do [12] miesięcy |
| Wsparcie i reklamacje | treść zgłoszenia, dane kontaktowe | art. 6 ust. 1 lit. b/f | do [3] lat (przedawnienie roszczeń) |
| Informacje o produkcie (newsletter) | e-mail | art. 6 ust. 1 lit. a (zgoda) + art. 398 Prawa komunikacji elektronicznej | do wycofania zgody |
| Dochodzenie roszczeń | dane niezbędne | art. 6 ust. 1 lit. f | do przedawnienia |

Podanie danych do konta jest dobrowolne, ale niezbędne do korzystania z Usługi.

## 3. Komu przekazujemy dane
Dostawcom, którzy pomagają nam świadczyć Usługę, na podstawie umów powierzenia:
- [Supabase Inc.] — baza danych i logowanie (serwery w regionie UE — Frankfurt);
- [Cloudflare, Inc.] — hosting aplikacji i ochrona przed atakami;
- [Anthropic PBC] — funkcje AI (bez danych identyfikujących osoby sprzedające);
- [dostawca e-mail], [operator płatności], [biuro rachunkowe].

Część dostawców ma siedzibę w USA. Transfer odbywa się na podstawie decyzji o adekwatności (EU-US Data Privacy Framework) lub standardowych klauzul umownych (art. 46 RODO). **⚖ DO SPRAWDZENIA** aktualny status każdego dostawcy.

## 4. Twoje prawa
Dostęp do danych, sprostowanie, usunięcie, ograniczenie przetwarzania, przenoszenie, sprzeciw (wobec przetwarzania na podstawie interesu), cofnięcie zgody w dowolnym momencie (bez wpływu na wcześniejsze przetwarzanie), skarga do Prezesa UODO (ul. Stawki 2, 00-193 Warszawa). Kontakt: [privacy@skupos.pl]. Odpowiadamy w ciągu miesiąca.

## 5. Pamięć urządzenia (cookies i localStorage)
Aplikacja zapisuje na urządzeniu dane niezbędne do działania: sesję logowania, ustawienia (motyw, rozmiar tekstu) i dane robocze do pracy offline (localStorage, Service Worker). Nie używamy plików cookies reklamowych ani śledzących. **⚖ DO SPRAWDZENIA** czy analityka (jeśli zostanie dodana) wymaga zgody (art. 399 PKE).

## 6. Bezpieczeństwo
Szyfrowane połączenie (HTTPS), rozdzielenie danych firm na poziomie bazy (RLS), role i uprawnienia, dziennik zmian, kopie zapasowe, brak usuwania dokumentów (anulowanie zamiast kasowania). Nie podejmujemy decyzji wyłącznie zautomatyzowanych wywołujących skutki prawne (art. 22 RODO).

## 7. Zmiany
O istotnych zmianach informujemy e-mailem lub w aplikacji.
