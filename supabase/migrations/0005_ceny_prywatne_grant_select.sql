-- aplikacja czyta ceny sprzedaży z ceny_prywatne; RLS (cp_sel/cp_all) nadal ogranicza do właściciela/księgowej tej firmy
grant select, insert, update, delete on public.ceny_prywatne to authenticated;
revoke all on public.ceny_prywatne from anon;
