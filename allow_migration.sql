-- PERMETTI L'INSERIMENTO DEI DATI (MIGRAZIONE)
-- Esegui questo script nell'SQL Editor di Supabase per permettere allo script di migrazione di scrivere nel database.

-- Policy per permettere l'inserimento (INSERT) a chiunque (pubblico)
-- ATTENZIONE: Una volta finita la migrazione, ti consiglio di disabilitare o cancellare queste policy per sicurezza.

CREATE POLICY "Enable Insert for Migration Courses" ON courses FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable Insert for Migration Decks" ON decks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable Insert for Migration Questions" ON questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable Insert for Migration Answers" ON answers FOR INSERT WITH CHECK (true);

-- Se serve anche aggiornare (UPDATE) o cancellare (DELETE) durante i test:
CREATE POLICY "Enable Update for Migration Courses" ON courses FOR UPDATE USING (true);
CREATE POLICY "Enable Delete for Migration Courses" ON courses FOR DELETE USING (true);
-- (Ripeti per le altre tabelle se necessario, ma per la migrazione basta INSERT)
