# Umowa powierzenia przetwarzania danych osobowych (PROJEKT — do weryfikacji przez prawnika)

zawarta [elektronicznie, z chwilą akceptacji Regulaminu SkupOS] pomiędzy:
**Administratorem** — Klientem SkupOS (punkt skupu), dane jak w Koncie Klienta,
a **Podmiotem przetwarzającym** — [Usługodawca, adres, NIP],
łącznie „Strony”.

## §1. Przedmiot i czas
1. Administrator powierza Podmiotowi przetwarzającemu przetwarzanie danych osobowych w zakresie i celu określonym w §2, wyłącznie w celu świadczenia usługi SkupOS (art. 28 RODO).
2. Umowa obowiązuje przez czas świadczenia Usługi oraz okres na eksport i usunięcie danych (§9).

## §2. Charakter, cel, rodzaj danych i kategorie osób
| Kategoria osób | Rodzaj danych | Cel |
|---|---|---|
| Osoby fizyczne przekazujące odpady metali (FPO) | imię, nazwisko, adres, seria i nr dokumentu tożsamości, zdjęcie dokumentu (jeśli wykonane), nr rejestracyjny pojazdu, podpis, dane transakcji | wystawienie FPO (art. 102 ustawy o odpadach), ewidencja, rozliczenie |
| Kontrahenci-przedsiębiorcy i ich przedstawiciele | nazwa, NIP, imię i nazwisko osoby kontaktowej, telefon, e-mail, adres odbioru | KPO, odbiory, wyceny, portal klienta |
| Pracownicy i współpracownicy Administratora | imię, nazwisko, login, rola, dziennik działań | konta, uprawnienia, rozliczalność |
| Klienci portalu | telefon/e-mail, zdjęcia przesłane do wyceny | wyceny, powiadomienia |

Charakter: przechowywanie, porządkowanie, udostępnianie Użytkownikom Administratora, generowanie dokumentów, kopie zapasowe, usuwanie. Dane szczególnych kategorii (art. 9 RODO) i dane o wyrokach (art. 10 RODO) nie są przetwarzane.

## §3. Obowiązki Podmiotu przetwarzającego
1. Przetwarza dane wyłącznie na udokumentowane polecenie Administratora — poleceniem jest korzystanie z funkcji Usługi zgodnie z Regulaminem — także w zakresie przekazania poza EOG (§5).
2. Zapewnia, że osoby z dostępem do danych zobowiązały się do zachowania tajemnicy.
3. Stosuje środki z art. 32 RODO, w szczególności: szyfrowanie transmisji (TLS), separację danych Klientów (Row Level Security), uprawnienia oparte na rolach, dziennik zmian, kopie zapasowe, brak fizycznego usuwania dokumentów przez Użytkowników (anulowanie), uwierzytelnianie dostępu administracyjnego, minimalizację dostępu personelu Podmiotu przetwarzającego (wyłącznie na zgłoszenie serwisowe).
4. Nie przekazuje dostawcom modeli AI danych identyfikujących osoby fizyczne przekazujące odpady.
5. Pomaga Administratorowi w realizacji praw osób (art. 15–22 RODO) — m.in. przez funkcje wyszukania, eksportu i sprostowania danych — oraz w obowiązkach z art. 32–36 RODO.
6. Udostępnia informacje niezbędne do wykazania zgodności z art. 28 RODO i umożliwia audyt (§7).

## §4. Dalsze powierzenie (podwykonawcy)
1. Administrator udziela ogólnej zgody na korzystanie z podwykonawców wymienionych w Załączniku 1.
2. O zamiarze dodania lub zmiany podwykonawcy Podmiot przetwarzający informuje z wyprzedzeniem [14] dni (e-mail/aplikacja). Administrator może wyrazić sprzeciw; jeśli Strony nie dojdą do porozumienia, Administrator może wypowiedzieć umowę bez dodatkowych kosztów.
3. Podwykonawcy są związani obowiązkami ochrony danych nie mniejszymi niż w niniejszej umowie; Podmiot przetwarzający odpowiada za ich działania jak za własne.

## §5. Przekazywanie poza EOG
Dane przechowywane są w regionie UE. Przekazanie podwykonawcy z państwa trzeciego następuje wyłącznie na podstawie rozdziału V RODO (decyzja o adekwatności / standardowe klauzule umowne). **⚖ DO SPRAWDZENIA:** ocena skutków transferu dla dostawców z USA.

## §6. Naruszenia ochrony danych
Podmiot przetwarzający zgłasza Administratorowi stwierdzone naruszenie bez zbędnej zwłoki, nie później niż w ciągu **[24] godzin** od jego stwierdzenia, przekazując informacje z art. 33 ust. 3 RODO w zakresie, w jakim je posiada, i współpracuje przy jego obsłudze. Zgłoszenia do UODO i zawiadomienia osób dokonuje Administrator.

## §7. Audyt
1. Administrator może przeprowadzić audyt raz w roku (lub po naruszeniu), z [14]-dniowym uprzedzeniem, w godzinach pracy, w sposób nieutrudniający działania Usługi, z zachowaniem poufności. Audyt może zostać zastąpiony udostępnieniem raportów i dokumentacji bezpieczeństwa.
2. Koszty audytu ponosi Administrator.

## §8. Odpowiedzialność
Strony odpowiadają zgodnie z art. 82 RODO. **⚖ DO SPRAWDZENIA:** relacja do limitu odpowiedzialności z Regulaminu.

## §9. Zakończenie
Po zakończeniu świadczenia Usługi Podmiot przetwarzający udostępnia dane do eksportu przez [30] dni, a następnie je usuwa (kopie zapasowe — w cyklu do [35] dni), chyba że prawo Unii lub państwa członkowskiego nakazuje dalsze przechowywanie. Na żądanie potwierdza usunięcie. **Uwaga dla Administratora:** obowiązek przechowywania FPO/KPO i ewidencji odpadów przez okres wymagany przepisami (co najmniej 5 lat — **⚖ DO SPRAWDZENIA** podstawa i długość) spoczywa na Administratorze — przed rozwiązaniem umowy należy wykonać eksport.

## Załącznik 1 — podwykonawcy
| Podwykonawca | Zakres | Lokalizacja danych | Podstawa transferu |
|---|---|---|---|
| [Supabase Inc.] | baza danych, logowanie, pliki | UE (Frankfurt) | DPA + SCC/DPF |
| [Cloudflare, Inc.] | hosting aplikacji, CDN | globalnie (cache statycznych plików, bez danych osobowych w plikach) | DPA + DPF |
| [Anthropic PBC] | funkcje AI (dane zbiorcze, bez identyfikacji sprzedających) | USA | DPA + SCC/DPF |
| [dostawca e-mail] | wysyłka powiadomień | [..] | [..] |
