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
            courses: supabaseData.courses || {}
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

    /**
     * Delete an imported deck
     */
    /**
     * Delete an imported deck from Supabase
     */
    async deleteDeck(courseName, deckName) {
        return await SupabaseService.deleteDeck(courseName, deckName);
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
