// Storage Manager Module
// Handles localStorage persistence and data management

const StorageManager = {
    STORAGE_KEY: 'quizApp_importedData',

    /**
     * Save a new quiz deck to localStorage
     */
    /**
     * Save a new quiz deck to Supabase
     */
    async saveQuizData(courseName, deckName, questions) {
        return await SupabaseService.saveQuizDeck(courseName, deckName, questions);
    },

    /**
     * Get all imported data from localStorage
     */
    getImportedData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error loading imported data:', error);
            return {};
        }
    },

    /**
     * Save imported data to localStorage
     */
    setImportedData(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            throw new Error('Impossibile salvare i dati. Lo storage del browser potrebbe essere pieno.');
        }
    },

    /**
     * Load all data (hard-coded + imported)
     */
    /**
     * Load all data (Supabase + imported)
     */
    async loadAllData() {
        // Fetch base data from Supabase
        const supabaseData = await SupabaseService.fetchFullStudyData();

        const allData = {
            courses: Object.assign(Object.create(null), supabaseData.courses)
        };

        // Merge with imported data
        const importedData = this.getImportedData();

        for (const courseName in importedData) {
            if (!allData.courses[courseName]) {
                // New course from imports
                allData.courses[courseName] = importedData[courseName];
            } else {
                // Merge decks for existing course
                allData.courses[courseName].decks = [
                    ...allData.courses[courseName].decks,
                    ...importedData[courseName].decks
                ];
            }
        }

        return allData;
    },

    async changeCourse(courseName, course, newName = null) {
        const imported = this.getImportedData();
        const localCourse = Object.hasOwn(imported, courseName) ? imported[courseName] : null;
        if (localCourse) {
            if (newName !== null && Object.hasOwn(imported, newName)) throw new Error('Questo nome è già in uso.');

            const updated = Object.assign(Object.create(null), imported);
            delete updated[courseName];
            if (newName !== null) updated[newName] = localCourse;
            this.setImportedData(updated);
        }

        if (!course.databaseId) return;
        try {
            if (newName === null) {
                await SupabaseService.changeStudyItem('delete_study_course', course.databaseId, courseName);
            } else {
                await SupabaseService.changeStudyItem('rename_study_course', course.databaseId, courseName, newName);
            }
        } catch (error) {
            if (localCourse) {
                const latest = Object.assign(Object.create(null), this.getImportedData());
                if (newName !== null && JSON.stringify(latest[newName]) === JSON.stringify(localCourse)) {
                    delete latest[newName];
                }
                if (!Object.hasOwn(latest, courseName)) latest[courseName] = localCourse;
                this.setImportedData(latest);
            }
            throw error;
        }
    },

    async renameDeck(courseName, deck, newName) {
        if (deck.databaseId) {
            await SupabaseService.changeStudyItem('rename_study_deck', deck.databaseId, deck.name, newName);
            return;
        }

        this.changeLocalDeck(courseName, deck.name, newName);
    },

    async deleteDeck(courseName, deck) {
        if (deck.databaseId) {
            await SupabaseService.deleteDeck(deck.databaseId, deck.name);
            return;
        }

        this.changeLocalDeck(courseName, deck.name);
    },

    changeLocalDeck(courseName, deckName, newName = null) {
        const imported = this.getImportedData();
        const localDecks = Object.hasOwn(imported, courseName) ? imported[courseName].decks : [];
        const matches = localDecks.filter(localDeck => localDeck.name === deckName);
        if (matches.length !== 1) throw new Error('Il deck è cambiato. Ricarica la pagina e riprova.');

        if (newName === null) {
            localDecks.splice(localDecks.indexOf(matches[0]), 1);
        } else {
            if (localDecks.some(localDeck => localDeck.name === newName)) throw new Error('Questo nome è già in uso.');
            matches[0].name = newName;
        }
        this.setImportedData(imported);
    },

    /**
     * List all imported decks
     */
    listImportedDecks() {
        const importedData = this.getImportedData();
        const result = [];

        for (const courseName in importedData) {
            for (const deck of importedData[courseName].decks) {
                result.push({
                    courseName,
                    deckName: deck.name,
                    questionCount: deck.questions.length,
                    importDate: deck.importDate
                });
            }
        }

        return result;
    },

    /**
     * Clear all imported data
     */
    clearAllImported() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    /**
     * Export imported data as JSON (for backup)
     */
    exportData() {
        return JSON.stringify(this.getImportedData(), null, 2);
    },

    /**
     * Import data from JSON (for restore)
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.setImportedData(data);
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    },

    /**
     * Add questions to an existing deck
     */
    /**
     * Add questions to an existing deck in Supabase
     */
    async addQuestionsToDeck(courseName, deckName, newQuestions) {
        await SupabaseService.addQuestionsToDeck(courseName, deckName, newQuestions);
        // Return total count (approximate, or fetch again if needed, but for now just return something truthy or fetch)
        // Since the UI reloads data anyway, we can just return true or the new count if we had it.
        // Let's fetch the deck to get the count to be precise, or just return true.
        // The original returned the new length.

        // Let's just return true for now, the UI reloads everything.
        return true;
    },

    /**
     * Get all decks for a specific course (from both hard-coded and imported data)
     */
    /**
     * Get all decks for a specific course (from both hard-coded and imported data)
     */
    async getAllDecksForCourse(courseName) {
        const allData = await this.loadAllData();
        if (!allData.courses[courseName]) {
            return [];
        }
        return allData.courses[courseName].decks || [];
    }
};
