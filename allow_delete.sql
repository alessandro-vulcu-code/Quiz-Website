-- PERMETTI L'ELIMINAZIONE DEI DATI
-- Esegui questo script nell'SQL Editor di Supabase per permettere l'eliminazione dei deck.

-- Policy per permettere l'eliminazione (DELETE) a chiunque (pubblico)
-- ATTENZIONE: Questo permette a chiunque di cancellare i tuoi quiz.
-- In produzione dovresti limitare questo (es. tramite autenticazione), ma per ora va bene per testare.

CREATE POLICY "Enable Delete for Decks" ON decks FOR DELETE USING (true);
CREATE POLICY "Enable Delete for Courses" ON courses FOR DELETE USING (true);
-- Le domande e risposte vengono eliminate in cascata (CASCADE), quindi non serve policy esplicita se elimini il deck,
-- MA Supabase controlla comunque i permessi, quindi meglio aggiungerle per sicurezza.
CREATE POLICY "Enable Delete for Questions" ON questions FOR DELETE USING (true);
CREATE POLICY "Enable Delete for Answers" ON answers FOR DELETE USING (true);
