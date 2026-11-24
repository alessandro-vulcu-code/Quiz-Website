
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
                    id,
                    name,
                    decks (
                        id,
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
                courses: Object.create(null)
            };

            coursesData.forEach(course => {
                formattedData.courses[course.name] = {
                    databaseId: course.id,
                    decks: course.decks.map(deck => {
                        return {
                            databaseId: deck.id,
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

    async changeStudyItem(operation, id, currentName, newName) {
        const parameters = { target_id: id, expected_name: currentName };
        if (newName !== undefined) parameters.new_name = newName;

        const { data: changed, error } = await supabaseClient.rpc(operation, parameters);
        if (error?.code === 'PGRST202') {
            throw new Error('Aggiorna Supabase con allow_study_management.sql per usare questa funzione.');
        }
        if (error?.code === '23505') throw new Error('Questo nome è già in uso.');
        if (error) throw error;
        if (!changed) throw new Error('L’elemento è cambiato. Ricarica la pagina e riprova.');
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
            try {
                await this.insertQuestions(deckId, questions);
            } catch (error) {
                const { error: deleteError } = await supabaseClient.from('decks').delete().eq('id', deckId);
                if (deleteError) {
                    console.error('Errore durante la rimozione del deck incompleto:', deleteError);
                    throw new Error(`${error.message} Verifica il deck «${deckName}» prima di riprovare.`);
                }
                throw error;
            }

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

    async deleteDeck(deckId, deckName) {
        const { data: deleted, error } = await supabaseClient
            .from('decks')
            .delete()
            .eq('id', deckId)
            .eq('name', deckName)
            .eq('is_imported', true)
            .select('id')
            .maybeSingle();

        if (error && error.code !== '42501') throw error;
        if (deleted) return;

        // Supporta anche i progetti che usano solo le funzioni di gestione.
        await this.changeStudyItem('delete_study_deck', deckId, deckName);
    },

    /**
     * Helper per inserire domande e risposte
     */
    async insertQuestions(deckId, questions) {
        const questionRows = questions.map(question => ({
            id: crypto.randomUUID(),
            deck_id: deckId,
            question_text: question.question
        }));
        const answerRows = questions.flatMap((question, questionIndex) =>
            question.answers.map((answer, answerIndex) => ({
                question_id: questionRows[questionIndex].id,
                answer_text: answer,
                is_correct: answerIndex === question.correctIndex
            }))
        );

        const { error: questionError } = await supabaseClient.from('questions').insert(questionRows);
        if (questionError) throw questionError;

        const { error: answerError } = await supabaseClient.from('answers').insert(answerRows);
        if (!answerError) return;

        // Limita la lunghezza dell'URL contenente gli ID da eliminare.
        const deleteBatchSize = 100;
        for (let start = 0; start < questionRows.length; start += deleteBatchSize) {
            const ids = questionRows.slice(start, start + deleteBatchSize).map(row => row.id);
            const { error: deleteError } = await supabaseClient.from('questions').delete().in('id', ids);
            if (deleteError) {
                console.error('Errore durante la rimozione delle domande incomplete:', deleteError);
                throw new Error(`${answerError.message} Verifica le domande del deck prima di riprovare.`);
            }
        }
        throw answerError;
    },

    /**
     * Carica le impostazioni exam mode per un corso
     * Ritorna un oggetto { deckName: percentage, ... }
     */
    async loadExamSettings(courseName) {
        try {
            // Trova il corso
            const { data: courseData, error: courseError } = await supabaseClient
                .from('courses')
                .select('id')
                .eq('name', courseName)
                .single();

            if (courseError) return {};

            // Carica le impostazioni con il nome del deck
            const { data: settings, error: settingsError } = await supabaseClient
                .from('exam_settings')
                .select(`
                    percentage,
                    decks ( name )
                `)
                .eq('course_id', courseData.id);

            if (settingsError) throw settingsError;

            // Trasforma in oggetto { deckName: percentage }
            const result = Object.create(null);
            if (settings) {
                settings.forEach(s => {
                    if (s.decks) {
                        result[s.decks.name] = s.percentage;
                    }
                });
            }
            return result;

        } catch (error) {
            console.error('Errore durante il caricamento delle impostazioni exam:', error);
            return {};
        }
    },

    /**
     * Salva le impostazioni exam mode per un corso
     * settingsMap: { deckName: percentage, ... }
     */
    async saveExamSettings(courseName, settingsMap) {
        try {
            // Trova il corso
            const { data: courseData, error: courseError } = await supabaseClient
                .from('courses')
                .select('id')
                .eq('name', courseName)
                .single();

            if (courseError) throw courseError;
            const courseId = courseData.id;

            // Trova tutti i deck del corso
            const { data: decksData, error: decksError } = await supabaseClient
                .from('decks')
                .select('id, name')
                .eq('course_id', courseId);

            if (decksError) throw decksError;

            // Prepara le righe per upsert
            const rows = [];
            decksData.forEach(deck => {
                const pct = settingsMap[deck.name];
                if (pct !== undefined) {
                    rows.push({
                        course_id: courseId,
                        deck_id: deck.id,
                        percentage: parseInt(pct, 10) || 0,
                        updated_at: new Date().toISOString()
                    });
                }
            });

            if (rows.length > 0) {
                const { error: upsertError } = await supabaseClient
                    .from('exam_settings')
                    .upsert(rows, { onConflict: 'course_id,deck_id' });

                if (upsertError) throw upsertError;
            }

            return true;

        } catch (error) {
            console.error('Errore durante il salvataggio delle impostazioni exam:', error);
            throw error;
        }
    }
};
