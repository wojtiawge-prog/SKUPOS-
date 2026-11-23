# Dokumenty prawne SkupOS — PROJEKTY do weryfikacji przez prawnika

Status: **szkic roboczy, NIE publikować** przed przeglądem prawnika (RODO + umowy B2B).
Nawiasy kwadratowe `[...]` = dane do uzupełnienia. Fragmenty oznaczone **⚖ DO SPRAWDZENIA** to miejsca, w których świadomie zostawiamy decyzję prawnikowi.

| Plik | Co to jest | Kto jest stroną |
|---|---|---|
| `regulamin.md` | Regulamin świadczenia usługi SkupOS drogą elektroniczną (art. 8 ustawy o ś.u.d.e.) | Usługodawca ↔ punkt skupu (Klient) |
| `polityka-prywatnosci.md` | Obowiązek informacyjny (art. 13 RODO) dla użytkowników kont i odwiedzających | Usługodawca jako administrator |
| `umowa-powierzenia.md` | Umowa powierzenia przetwarzania danych (art. 28 RODO) — dane osób sprzedających złom (FPO), klientów, pracowników | Punkt skupu (administrator) → Usługodawca (podmiot przetwarzający) |

Pytania do prawnika (lista na spotkanie):
1. Forma działalności usługodawcy (JDG w PL / spółka) i jej wpływ na wzorce umów — usługodawca mieszka w NL.
2. Czy jednoosobowi przedsiębiorcy (punkty skupu) korzystają z ochrony „przedsiębiorcy na prawach konsumenta” (art. 385⁵, 556⁴, 576⁵ k.c., art. 38a u.p.k.) — wpływa na odstąpienie i klauzule abuzywne.
3. Limit odpowiedzialności (proponujemy: kwota opłat z 12 mies.) — czy skuteczny wobec takich klientów.
4. Okresy przechowywania FPO/KPO i ewidencji po rozwiązaniu umowy (proponujemy: eksport + 30 dni, potem usunięcie; obowiązek 5 lat leży po stronie punktu skupu).
5. Transfer danych do podwykonawców spoza EOG (Supabase, Anthropic, Cloudflare) — SCC/DPF, ocena skutków transferu.
6. Czy funkcja AI może otrzymywać dane osobowe sprzedających (proponujemy: NIE — tylko dane zanonimizowane/zbiorcze).
