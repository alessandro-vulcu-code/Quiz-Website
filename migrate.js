const logDiv = document.getElementById('log');
const startBtn = document.getElementById('startBtn');

function log(msg, type = 'info') {
    const div = document.createElement('div');
    div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    if (type === 'error') div.style.color = 'red';
    if (type === 'success') div.style.color = 'green';
    logDiv.appendChild(div);
    logDiv.scrollTop = logDiv.scrollHeight;
}

startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    log('Inizio migrazione...', 'info');

    try {
        if (typeof STUDY_DATA === 'undefined') {
            throw new Error('STUDY_DATA non trovato. Assicurati che data.js sia caricato correttamente.');
        }

        const courses = STUDY_DATA.courses;

        for (const courseName in courses) {
            log(`Elaborazione corso: ${courseName}...`);

            // 1. Crea o trova il corso
            let { data: courseData, error: courseError } = await supabaseClient
                .from('courses')
                .select('id')
                .eq('name', courseName)
                .single();

            if (courseError && courseError.code !== 'PGRST116') { // PGRST116 = Not found
                throw courseError;
            }

            if (!courseData) {
                const { data: newCourse, error: insertError } = await supabaseClient
                    .from('courses')
                    .insert([{ name: courseName }])
                    .select()
                    .single();

                if (insertError) throw insertError;
                courseData = newCourse;
                log(`  -> Creato corso: ${courseName}`, 'success');
            } else {
                log(`  -> Corso esistente: ${courseName}`);
            }

            const courseId = courseData.id;
            const decks = courses[courseName].decks;

            for (const deck of decks) {
                log(`  Elaborazione deck: ${deck.name}...`);

                // 2. Crea o trova il deck
                let { data: deckData, error: deckError } = await supabaseClient
                    .from('decks')
                    .select('id')
                    .eq('course_id', courseId)
                    .eq('name', deck.name)
                    .single();

                if (deckError && deckError.code !== 'PGRST116') throw deckError;

                if (!deckData) {
                    const { data: newDeck, error: insertDeckError } = await supabaseClient
                        .from('decks')
                        .insert([{
                            course_id: courseId,
                            name: deck.name,
                            is_imported: deck.imported || false,
                            import_date: deck.importDate || null
                        }])
                        .select()
                        .single();

                    if (insertDeckError) throw insertDeckError;
                    deckData = newDeck;
                    log(`    -> Creato deck: ${deck.name}`, 'success');
                } else {
                    log(`    -> Deck esistente: ${deck.name}`);
                }

                const deckId = deckData.id;
                const questions = deck.questions;

                log(`    Caricamento ${questions.length} domande...`);

                for (const q of questions) {
                    // 3. Inserisci domanda
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

                    // 4. Inserisci risposte
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
                log(`    -> Completato deck: ${deck.name}`, 'success');
            }
        }

        log('Migrazione completata con successo!', 'success');
        alert('Migrazione completata! Ora puoi aprire index.html');

    } catch (error) {
        console.error(error);
        log(`ERRORE: ${error.message}`, 'error');
        alert('Si è verificato un errore. Controlla il log.');
    } finally {
        startBtn.disabled = false;
    }
});
