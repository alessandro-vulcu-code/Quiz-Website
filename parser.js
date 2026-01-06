// File Parser Module
// Handles parsing of .txt and .csv files into the app's data format

const FileParser = {
    /**
     * Parse a .txt file with semicolon-delimited format
     * Format: Question;Answer1;Answer2;Answer3;Answer4;;ID
     * The first answer is always the correct one (index 0)
     */
    parseTxtFile(fileContent) {
        const lines = fileContent.split('\n').filter(line => line.trim().length > 0);
        const questions = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Split by semicolon, but handle escaped characters
            const parts = line.split(';');

            if (parts.length < 5) {
                console.warn(`Line ${i + 1} has insufficient fields, skipping:`, line);
                continue;
            }

            const question = {
                question: parts[0].trim(),
                answers: [
                    parts[1].trim(),
                    parts[2].trim(),
                    parts[3].trim(),
                    parts[4].trim()
                ],
                correctIndex: 0 // In the .txt format, the first answer is always correct
            };

            // Validate that all required fields are present
            if (question.question && question.answers.every(a => a)) {
                questions.push(question);
            } else {
                console.warn(`Line ${i + 1} has empty fields, skipping:`, line);
            }
        }

        return questions;
    },

    /**
     * Parse a .csv file
     * Expected format: question,answer1,answer2,answer3,answer4,correctIndex
     * Or: question,answer1,answer2,answer3,answer4 (assumes correctIndex = 0)
     */
    parseCsvFile(fileContent) {
        const lines = fileContent.split('\n').filter(line => line.trim().length > 0);
        const questions = [];

        // Check if first line is a header
        let startIndex = 0;
        const firstLine = lines[0].toLowerCase();
        if (firstLine.includes('question') || firstLine.includes('domanda')) {
            startIndex = 1; // Skip header row
        }

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Simple CSV parsing (handles quoted fields)
            const parts = this.parseCSVLine(line);

            if (parts.length < 5) {
                console.warn(`Line ${i + 1} has insufficient fields, skipping:`, line);
                continue;
            }

            const question = {
                question: parts[0].trim(),
                answers: [
                    parts[1].trim(),
                    parts[2].trim(),
                    parts[3].trim(),
                    parts[4].trim()
                ],
                correctIndex: parts[5] ? parseInt(parts[5].trim()) : 0
            };

            // Validate correct index
            if (question.correctIndex < 0 || question.correctIndex > 3) {
                console.warn(`Line ${i + 1} has invalid correctIndex, defaulting to 0`);
                question.correctIndex = 0;
            }

            // Validate that all required fields are present
            if (question.question && question.answers.every(a => a)) {
                questions.push(question);
            } else {
                console.warn(`Line ${i + 1} has empty fields, skipping:`, line);
            }
        }

        return questions;
    },

    /**
     * Parse a single CSV line, handling quoted fields
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current);
        return result;
    },

    /**
     * Auto-detect file format and parse accordingly
     */
    parseFile(fileContent, fileName) {
        const extension = fileName.split('.').pop().toLowerCase();

        if (extension === 'txt') {
            return this.parseTxtFile(fileContent);
        } else if (extension === 'csv') {
            return this.parseCsvFile(fileContent);
        } else {
            throw new Error(`Formato file non supportato: ${extension}. Usa .txt o .csv`);
        }
    },

    /**
     * Validate parsed questions
     */
    validateQuestions(questions) {
        if (!Array.isArray(questions) || questions.length === 0) {
            return { valid: false, error: 'Nessuna domanda valida trovata nel file' };
        }

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];

            if (!q.question || typeof q.question !== 'string') {
                return { valid: false, error: `Domanda ${i + 1}: testo domanda mancante o invalido` };
            }

            if (!Array.isArray(q.answers) || q.answers.length !== 4) {
                return { valid: false, error: `Domanda ${i + 1}: devono esserci esattamente 4 risposte` };
            }

            if (q.answers.some(a => !a || typeof a !== 'string')) {
                return { valid: false, error: `Domanda ${i + 1}: tutte le risposte devono essere presenti` };
            }

            if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3) {
                return { valid: false, error: `Domanda ${i + 1}: indice risposta corretta invalido` };
            }
        }

        return { valid: true, questionCount: questions.length };
    }
};
