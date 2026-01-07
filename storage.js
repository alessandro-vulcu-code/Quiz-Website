// Storage Manager Module
// Handles localStorage persistence and data management

const StorageManager = {
    STORAGE_KEY: 'quizApp_importedData',

    /**
     * Save a new quiz deck to localStorage
     */
    saveQuizData(courseName, deckName, questions) {
        const importedData = this.getImportedData();

        // Initialize course if it doesn't exist
        if (!importedData[courseName]) {
            importedData[courseName] = {
                decks: []
            };
        }

        // Check if deck already exists
        const existingDeckIndex = importedData[courseName].decks.findIndex(
            deck => deck.name === deckName
        );

        const newDeck = {
            name: deckName,
            questions: questions,
            imported: true,
            importDate: new Date().toISOString()
        };

        if (existingDeckIndex >= 0) {
            // Update existing deck
            importedData[courseName].decks[existingDeckIndex] = newDeck;
        } else {
            // Add new deck
            importedData[courseName].decks.push(newDeck);
        }

        this.setImportedData(importedData);
        return true;
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
    loadAllData() {
        // Start with hard-coded data
        const allData = {
            courses: JSON.parse(JSON.stringify(STUDY_DATA.courses)) // Deep clone
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
    deleteDeck(courseName, deckName) {
        const importedData = this.getImportedData();

        if (!importedData[courseName]) {
            return false;
        }

        const deckIndex = importedData[courseName].decks.findIndex(
            deck => deck.name === deckName
        );

        if (deckIndex < 0) {
            return false;
        }

        importedData[courseName].decks.splice(deckIndex, 1);

        // Remove course if it has no more decks
        if (importedData[courseName].decks.length === 0) {
            delete importedData[courseName];
        }

        this.setImportedData(importedData);
        return true;
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
    addQuestionsToDeck(courseName, deckName, newQuestions) {
        const importedData = this.getImportedData();

        // Check if course exists
        if (!importedData[courseName]) {
            throw new Error(`Corso "${courseName}" non trovato`);
        }

        // Find the deck
        const deckIndex = importedData[courseName].decks.findIndex(
            deck => deck.name === deckName
        );

        if (deckIndex < 0) {
            throw new Error(`Deck "${deckName}" non trovato nel corso "${courseName}"`);
        }

        // Add questions to existing deck
        importedData[courseName].decks[deckIndex].questions.push(...newQuestions);
        importedData[courseName].decks[deckIndex].importDate = new Date().toISOString();

        this.setImportedData(importedData);
        return importedData[courseName].decks[deckIndex].questions.length;
    },

    /**
     * Get all decks for a specific course (from both hard-coded and imported data)
     */
    getAllDecksForCourse(courseName) {
        const allData = this.loadAllData();
        if (!allData.courses[courseName]) {
            return [];
        }
        return allData.courses[courseName].decks || [];
    }
};
