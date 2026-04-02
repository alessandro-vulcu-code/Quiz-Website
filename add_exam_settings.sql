-- Migrazione: Aggiunta tabella exam_settings
-- Eseguire nella dashboard Supabase -> SQL Editor

-- 1. Crea la tabella exam_settings
CREATE TABLE IF NOT EXISTS exam_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
    percentage INTEGER NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, deck_id)
);

-- 2. Indice per performance
CREATE INDEX IF NOT EXISTS idx_exam_settings_course ON exam_settings(course_id);

-- 3. Abilita RLS
ALTER TABLE exam_settings ENABLE ROW LEVEL SECURITY;

-- 4. Policies per accesso pubblico (lettura + scrittura)
CREATE POLICY "Public Read Access Exam Settings" ON exam_settings FOR SELECT USING (true);
CREATE POLICY "Public Write Access Exam Settings" ON exam_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access Exam Settings" ON exam_settings FOR UPDATE USING (true);
CREATE POLICY "Public Delete Access Exam Settings" ON exam_settings FOR DELETE USING (true);
