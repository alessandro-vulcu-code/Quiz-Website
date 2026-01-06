// ===== Code Generator Functions =====
function generateDataCode() {
    console.log('generateDataCode called');

    try {
        // Get all data (hard-coded + imported)
        const allData = StorageManager.loadAllData();
        console.log('Data loaded:', allData);

        // Generate JavaScript code
        const code = `// Question data for Multiple Choice Study App
// This file contains all courses, decks, and questions

const STUDY_DATA = ${JSON.stringify(allData, null, 4)};
`;

        console.log('Code generated, length:', code.length);

        // Show in modal
        const codeTextarea = document.getElementById('generatedCode');
        const codeModal = document.getElementById('codeModal');

        if (!codeTextarea) {
            console.error('generatedCode textarea not found!');
            alert('Errore: elemento generatedCode non trovato');
            return;
        }

        if (!codeModal) {
            console.error('codeModal not found!');
            alert('Errore: elemento codeModal non trovato');
            return;
        }

        codeTextarea.value = code;
        codeModal.classList.add('active');
        console.log('Modal should be visible now');

    } catch (error) {
        console.error('Error in generateDataCode:', error);
        alert('Errore durante la generazione del codice: ' + error.message);
    }
}

function closeCodeModal() {
    document.getElementById('codeModal').classList.remove('active');
}

function copyGeneratedCode() {
    const codeTextarea = document.getElementById('generatedCode');
    codeTextarea.select();
    codeTextarea.setSelectionRange(0, 99999); // For mobile

    try {
        document.execCommand('copy');

        // Change button text temporarily
        const copyBtn = document.getElementById('copyCodeButton');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copiato!';
        copyBtn.style.background = 'var(--success)';

        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
        }, 2000);
    } catch (err) {
        alert('Impossibile copiare automaticamente. Seleziona tutto il testo e copia manualmente (Ctrl+C / Cmd+C)');
    }
}
