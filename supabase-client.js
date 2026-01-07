
// Configurazione Supabase
// Sostituisci con i tuoi dati reali dalla dashboard di Supabase
const SUPABASE_URL = 'https://lsiclydqcdieochxltvr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzaWNseWRxY2RpZW9jaHhsdHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTQ4NDcsImV4cCI6MjA4MzM3MDg0N30.0lOqDRglKynTrKYk5AgX0AwDAEnuueJYqojGdVicrFM';

// Inizializza il client Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SupabaseService = {
    /**
     * Scarica tutti i dati dal database e li formatta come STUDY_DATA
     */
    async fetchFullStudyData() {
        try {
            // Query annidata per prendere tutto in una volta
            const { data: coursesData, error } = await supabaseClient
                .from('courses')
                .select(`
                    name,
                    decks (
                        name,
                        is_imported,
                        import_date,
                        questions (
                            question_text,
                            answers (
                                answer_text,
                                is_correct
                            )
                        )
                    )
                `);

            if (error) throw error;

            // Trasforma i dati nel formato atteso dall'app (STUDY_DATA)
            const formattedData = {
                courses: {}
            };

            coursesData.forEach(course => {
                formattedData.courses[course.name] = {
                    decks: course.decks.map(deck => {
                        return {
                            name: deck.name,
                            imported: deck.is_imported,
                            importDate: deck.import_date,
                            questions: deck.questions.map(q => {
                                // Trova l'indice della risposta corretta
                                // Mescoliamo le risposte? No, il DB le restituisce in ordine di inserimento o casuale.
                                // L'app si aspetta 'answers' come array di stringhe e 'correctIndex'.

                                // Mappiamo le risposte
                                const answersText = q.answers.map(a => a.answer_text);
                                const correctIndex = q.answers.findIndex(a => a.is_correct);

                                return {
                                    question: q.question_text,
                                    answers: answersText,
                                    correctIndex: correctIndex >= 0 ? correctIndex : 0 // Fallback
                                };
                            })
                        };
                    })
                };
            });

            return formattedData;

        } catch (error) {
            console.error('Errore durante il recupero dei dati da Supabase:', error);
            alert('Errore di connessione al database. Controlla la console per i dettagli.');
            return { courses: {} }; // Ritorna oggetto vuoto in caso di errore
        }
    },
    /**
     * Salva un nuovo deck nel database
     */
    async saveQuizDeck(courseName, deckName, questions) {
        try {
            // 1. Trova o crea il corso
            let { data: courseData, error: courseError } = await supabaseClient
                .from('courses')
                .select('id')
                .eq('name', courseName)
                .single();

            if (courseError && courseError.code !== 'PGRST116') throw courseError;

            if (!courseData) {
                const { data: newCourse, error: insertError } = await supabaseClient
                    .from('courses')
                    .insert([{ name: courseName }])
                    .select()
                    .single();

                if (insertError) throw insertError;
                courseData = newCourse;
            }

            const courseId = courseData.id;

            // 2. Crea il deck
            const { data: deckData, error: deckError } = await supabaseClient
                .from('decks')
                .insert([{
                    course_id: courseId,
                    name: deckName,
                    is_imported: true,
                    import_date: new Date().toISOString()
                }])
                .select()
                .single();

            if (deckError) throw deckError;
            const deckId = deckData.id;

            // 3. Inserisci le domande
            await this.insertQuestions(deckId, questions);

            return true;

        } catch (error) {
            console.error('Errore durante il salvataggio del deck:', error);
            throw error;
        }
    },

    /**
     * Aggiunge domande a un deck esistente
     */
    async addQuestionsToDeck(courseName, deckName, newQuestions) {
        try {
            // 1. Trova il corso
            const { data: courseData, error: courseError } = await supabaseClient
                .from('courses')
                .select('id')
                .eq('name', courseName)
                .single();

            if (courseError) throw new Error(`Corso "${courseName}" non trovato`);

            // 2. Trova il deck
            const { data: deckData, error: deckError } = await supabaseClient
                .from('decks')
                .select('id')
                .eq('course_id', courseData.id)
                .eq('name', deckName)
                .single();

            if (deckError) throw new Error(`Deck "${deckName}" non trovato`);

            // 3. Inserisci le domande
            await this.insertQuestions(deckData.id, newQuestions);

            // Aggiorna data importazione
            await supabaseClient
                .from('decks')
                .update({ import_date: new Date().toISOString() })
                .eq('id', deckData.id);

            return true;

        } catch (error) {
            console.error('Errore durante l\'aggiunta delle domande:', error);
            throw error;
        }
    },

    /**
     * Elimina un deck
     */
    async deleteDeck(courseName, deckName) {
        try {
            // Trova il corso
            const { data: courseData, error: courseError } = await supabaseClient
                .from('courses')
                .select('id')
                .eq('name', courseName)
                .single();

            if (courseError) return false;

            // Elimina il deck (cascade eliminerà domande e risposte)
            const { error: deleteError } = await supabaseClient
                .from('decks')
                .delete()
                .eq('course_id', courseData.id)
                .eq('name', deckName);

            if (deleteError) throw deleteError;

            // Controlla se il corso è vuoto e eliminalo se necessario
            const { count } = await supabaseClient
                .from('decks')
                .select('*', { count: 'exact', head: true })
                .eq('course_id', courseData.id);

            if (count === 0) {
                await supabaseClient
                    .from('courses')
                    .delete()
                    .eq('id', courseData.id);
            }

            return true;

        } catch (error) {
            console.error('Errore durante l\'eliminazione del deck:', error);
            return false;
        }
    },

    /**
     * Helper per inserire domande e risposte
     */
    async insertQuestions(deckId, questions) {
        for (const q of questions) {
            // Inserisci domanda
            const { data: questionData, error: qError } = await supabaseClient
                .from('questions')
                .insert([{
                    deck_id: deckId,
                    question_text: q.question
                }])
                .select()
                .single();

            if (qError) throw qError;
            const questionId = questionData.id;

            // Inserisci risposte
            const answersToInsert = q.answers.map((ansText, index) => ({
                question_id: questionId,
                answer_text: ansText,
                is_correct: index === q.correctIndex
            }));

            const { error: ansError } = await supabaseClient
                .from('answers')
                .insert(answersToInsert);

            if (ansError) throw ansError;
        }
    }
};
