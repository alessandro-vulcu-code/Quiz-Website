-- Abilita l'estensione per generare UUID (identificatori unici)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabella Corsi (Courses)
-- Rappresenta le materie (es. "Digital Communication")
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- Il nome del corso deve essere univoco
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabella Decks (Mazzi di domande)
-- Rappresenta i capitoli o gruppi di domande (es. "Chapter 1", "Appendix")
CREATE TABLE decks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE, -- Se elimini il corso, elimini i deck
    name TEXT NOT NULL,
    is_imported BOOLEAN DEFAULT FALSE, -- Per distinguere deck importati da quelli base
    import_date TIMESTAMP WITH TIME ZONE, -- Data di importazione (se applicabile)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, name) -- Non possono esserci due deck con lo stesso nome nello stesso corso
);

-- 3. Tabella Domande (Questions)
-- Contiene il testo della domanda
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deck_id UUID REFERENCES decks(id) ON DELETE CASCADE, -- Se elimini il deck, elimini le domande
    question_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabella Risposte (Answers)
-- Contiene le opzioni di risposta per ogni domanda
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE, -- Se elimini la domanda, elimini le risposte
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE, -- Indica se questa è la risposta corretta
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. (Opzionale) Tabella Risultati (Quiz Results)
-- Utile se vuoi salvare lo storico dei punteggi
CREATE TABLE quiz_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deck_id UUID REFERENCES decks(id) ON DELETE SET NULL,
    -- user_id UUID REFERENCES auth.users(id), -- Decommenta se usi Supabase Auth
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    percentage INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per migliorare le performance delle query
CREATE INDEX idx_decks_course_id ON decks(course_id);
CREATE INDEX idx_questions_deck_id ON questions(deck_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_is_correct ON answers(question_id) WHERE is_correct = TRUE; -- Indice parziale per trovare velocemente la risposta giusta

-- Policy di Sicurezza (Row Level Security - RLS)
-- Abilita RLS su tutte le tabelle (Best Practice Supabase)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Policy Esempio: Accesso pubblico in lettura (modifica se necessario)
CREATE POLICY "Public Read Access Courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Public Read Access Decks" ON decks FOR SELECT USING (true);
CREATE POLICY "Public Read Access Questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Public Read Access Answers" ON answers FOR SELECT USING (true);
-- Nota: Per scrivere/modificare dati dovrai aggiungere policy per INSERT/UPDATE/DELETE
-- basate sul tuo sistema di autenticazione.

-- Esempio di inserimento dati (Commentato)
/*
-- 1. Inserisci un corso
INSERT INTO courses (name) VALUES ('Digital Communication') RETURNING id;

-- 2. Inserisci un deck
INSERT INTO decks (course_id, name) VALUES ('<COURSE_UUID>', 'Chapter 1') RETURNING id;

-- 3. Inserisci una domanda
INSERT INTO questions (deck_id, question_text) VALUES ('<DECK_UUID>', 'What is the PDF of a Gaussian?') RETURNING id;

-- 4. Inserisci le risposte
INSERT INTO answers (question_id, answer_text, is_correct) VALUES 
('<QUESTION_UUID>', 'Formula A...', TRUE),
('<QUESTION_UUID>', 'Formula B...', FALSE);
*/
