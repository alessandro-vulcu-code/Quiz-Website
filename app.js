// ===== Application State =====
let currentCourse = null;
let currentDeck = null;
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = []; // Array to store user's answer for each question {questionIndex, selectedIndex, isCorrect}
let shuffledQuestions = [];
let appData = null; // Will hold all quiz data (hard-coded + imported)
let quizCompleted = false; // Track if quiz is finished

// ===== DOM Elements =====
const views = {
    home: document.getElementById('homeView'),
    deck: document.getElementById('deckView'),
    quiz: document.getElementById('quizView'),
    results: document.getElementById('resultsView')
};

const elements = {
    courseList: document.getElementById('courseList'),
    deckList: document.getElementById('deckList'),
    courseTitle: document.getElementById('courseTitle'),
    progressContainer: document.getElementById('progressContainer'),
    progressText: document.getElementById('progressText'),
    progressFill: document.getElementById('progressFill'),
    quizDeckName: document.getElementById('quizDeckName'),
    scoreDisplay: document.getElementById('scoreDisplay'),
    questionText: document.getElementById('questionText'),
    answersContainer: document.getElementById('answersContainer'),
    feedback: document.getElementById('feedback'),
    feedbackIcon: document.getElementById('feedbackIcon'),
    feedbackText: document.getElementById('feedbackText'),
    confirmButton: document.getElementById('confirmButton'),
    prevButton: document.getElementById('prevButton'),
    nextQuestionButton: document.getElementById('nextQuestionButton'),
    finishButton: document.getElementById('finishButton'),
    finalScore: document.getElementById('finalScore'),
    scorePercentage: document.getElementById('scorePercentage'),
    resultsMessage: document.getElementById('resultsMessage')
};

// ===== Navigation Functions =====
function showView(viewName) {
    Object.values(views).forEach(view => view.classList.remove('active'));
    views[viewName].classList.add('active');
}

// ===== Initialization =====
function init() {
    // Load all data (hard-coded + imported)
    appData = StorageManager.loadAllData();
    renderCourses();
    setupEventListeners();
}

function setupEventListeners() {
    // Back buttons
    document.getElementById('backToCourses').addEventListener('click', () => {
        showView('home');
    });

    document.getElementById('backToDecks').addEventListener('click', () => {
        showView('deck');
        elements.progressContainer.style.display = 'none';
    });

    document.getElementById('backToDecksFromResults').addEventListener('click', () => {
        showView('deck');
        elements.progressContainer.style.display = 'none';
    });

    // Quiz buttons
    elements.confirmButton.addEventListener('click', handleConfirm);
    elements.prevButton.addEventListener('click', goToPreviousQuestion);
    elements.nextQuestionButton.addEventListener('click', goToNextQuestion);
    elements.finishButton.addEventListener('click', finishQuiz);

    // Results buttons
    document.getElementById('restartQuiz').addEventListener('click', restartQuiz);

    // Import modal handlers
    document.getElementById('importButton').addEventListener('click', openImportModal);
    document.getElementById('closeImportModal').addEventListener('click', closeImportModal);
    document.getElementById('cancelImport').addEventListener('click', closeImportModal);
    document.getElementById('importForm').addEventListener('submit', handleImportSubmit);

    // Code generator handlers
    document.getElementById('generateCodeButton').addEventListener('click', generateDataCode);
    document.getElementById('closeCodeModal').addEventListener('click', closeCodeModal);
    document.getElementById('copyCodeButton').addEventListener('click', copyGeneratedCode);
}

// ===== Course & Deck Rendering =====
function renderCourses() {
    elements.courseList.innerHTML = '';

    Object.keys(appData.courses).forEach(courseName => {
        const course = appData.courses[courseName];
        const deckCount = course.decks.length;
        const totalQuestions = course.decks.reduce((sum, deck) => sum + deck.questions.length, 0);

        const courseCard = document.createElement('div');
        courseCard.className = 'card';
        courseCard.innerHTML = `
            <div class="card-icon">📖</div>
            <div class="card-title">${courseName}</div>
            <div class="card-description">${deckCount} deck • ${totalQuestions} domande</div>
        `;

        courseCard.addEventListener('click', () => selectCourse(courseName));
        elements.courseList.appendChild(courseCard);
    });
}

function selectCourse(courseName) {
    currentCourse = courseName;
    elements.courseTitle.textContent = courseName;
    renderDecks();
    showView('deck');
}

function renderDecks() {
    elements.deckList.innerHTML = '';
    const course = appData.courses[currentCourse];

    // Add "Exam" deck if there are questions available
    const totalQuestions = course.decks.reduce((sum, deck) => sum + deck.questions.length, 0);
    if (totalQuestions >= 20) {
        const examCard = document.createElement('div');
        examCard.className = 'card exam-deck';
        examCard.innerHTML = `
            <div class="card-icon">📝</div>
            <div class="card-title">Exam Mode</div>
            <div class="card-description">20 domande casuali da tutti i deck</div>
        `;
        examCard.addEventListener('click', () => startExamMode());
        elements.deckList.appendChild(examCard);
    }

    // Render regular decks
    course.decks.forEach((deck, index) => {
        const deckCard = document.createElement('div');
        deckCard.className = deck.imported ? 'card imported' : 'card';

        // Add delete button for imported decks
        let deleteButton = '';
        if (deck.imported) {
            deleteButton = `<button class="delete-btn" data-deck-index="${index}" title="Elimina deck">×</button>`;
        }

        deckCard.innerHTML = `
            ${deleteButton}
            <div class="card-icon">🎯</div>
            <div class="card-title">${deck.name}</div>
            <div class="card-description">${deck.questions.length} domande</div>
        `;

        // Click on card to start quiz (but not on delete button)
        deckCard.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-btn')) {
                startQuiz(index);
            }
        });

        // Delete button handler
        if (deck.imported) {
            const deleteBtn = deckCard.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteDeck(currentCourse, deck.name);
            });
        }

        elements.deckList.appendChild(deckCard);
    });
}

// ===== Quiz Logic =====
function startQuiz(deckIndex) {
    currentDeck = appData.courses[currentCourse].decks[deckIndex];
    currentQuestionIndex = 0;
    score = 0;
    quizCompleted = false;

    // Create a copy of questions and shuffle them
    shuffledQuestions = currentDeck.questions.map(q => ({ ...q }));

    // Initialize answers array (null = not answered yet)
    userAnswers = new Array(shuffledQuestions.length).fill(null);

    elements.quizDeckName.textContent = currentDeck.name;
    elements.progressContainer.style.display = 'flex';

    showView('quiz');
    loadQuestion();
}

// ===== Exam Mode =====
function startExamMode() {
    // Collect all questions from all decks in the current course
    const course = appData.courses[currentCourse];
    let allQuestions = [];

    course.decks.forEach(deck => {
        allQuestions = allQuestions.concat(deck.questions.map(q => ({ ...q })));
    });

    // Shuffle all questions
    for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    // Take first 20 questions (or all if less than 20)
    const examQuestions = allQuestions.slice(0, Math.min(20, allQuestions.length));

    // Set up exam
    currentDeck = {
        name: 'Exam Mode',
        questions: examQuestions
    };
    currentQuestionIndex = 0;
    quizCompleted = false;
    shuffledQuestions = examQuestions;
    userAnswers = new Array(examQuestions.length).fill(null);

    elements.quizDeckName.textContent = `Exam Mode (${examQuestions.length} domande)`;
    elements.progressContainer.style.display = 'flex';

    showView('quiz');
    loadQuestion();
}

function restartQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    quizCompleted = false;
    shuffledQuestions = currentDeck.questions.map(q => ({ ...q }));
    userAnswers = new Array(shuffledQuestions.length).fill(null);
    showView('quiz');
    elements.progressContainer.style.display = 'flex';
    loadQuestion();
}

// Convert markdown-style bold (**text**) to HTML
function convertMarkdownToHtml(text) {
    if (!text) return text;
    // Convert **bold** to <strong>bold</strong>
    return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function loadQuestion() {
    const question = shuffledQuestions[currentQuestionIndex];
    const totalQuestions = shuffledQuestions.length;

    // Update progress
    elements.progressText.textContent = `Domanda ${currentQuestionIndex + 1} di ${totalQuestions}`;
    const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    elements.progressFill.style.width = `${progressPercent}%`;

    // Update score display
    const answeredCount = userAnswers.filter(a => a !== null).length;
    const correctCount = userAnswers.filter(a => a && a.isCorrect).length;
    elements.scoreDisplay.textContent = `Punteggio: ${correctCount}/${answeredCount}`;

    // Display question with markdown conversion
    elements.questionText.innerHTML = convertMarkdownToHtml(question.question);

    // Shuffle answers while maintaining correctness
    const shuffledAnswers = shuffleAnswers(question.answers, question.correctIndex);

    // Render answers
    elements.answersContainer.innerHTML = '';
    shuffledAnswers.forEach((answer, index) => {
        const answerDiv = document.createElement('div');
        answerDiv.className = 'answer-option';
        answerDiv.innerHTML = convertMarkdownToHtml(answer.text);  // Convert markdown here too
        answerDiv.dataset.index = index;
        answerDiv.dataset.isCorrect = answer.isCorrect;

        // Check if this question was already answered
        const savedAnswer = userAnswers[currentQuestionIndex];
        if (savedAnswer) {
            // Disable all answers if already confirmed
            answerDiv.classList.add('disabled');

            // Show which was selected and which is correct
            if (savedAnswer.selectedIndex === index) {
                answerDiv.classList.add('selected');
                if (answer.isCorrect) {
                    answerDiv.classList.add('correct');
                } else {
                    answerDiv.classList.add('incorrect');
                }
            } else if (answer.isCorrect) {
                answerDiv.classList.add('correct');
            }
        } else {
            // Allow selection for unanswered questions
            answerDiv.addEventListener('click', () => selectAnswer(index));
        }

        elements.answersContainer.appendChild(answerDiv);
    });

    // Show/hide feedback if question was already answered
    const savedAnswer = userAnswers[currentQuestionIndex];
    if (savedAnswer) {
        showFeedback(savedAnswer.isCorrect);
        elements.confirmButton.style.display = 'none';
    } else {
        elements.feedback.style.display = 'none';
        elements.confirmButton.style.display = 'inline-block';
    }

    // Update navigation buttons
    updateNavigationButtons();

    // Trigger MathJax rendering
    if (window.MathJax) {
        MathJax.typesetPromise([elements.questionText, elements.answersContainer]);
    }
}

function shuffleAnswers(answers, correctIndex) {
    // Create answer objects with correctness flag
    const answerObjects = answers.map((text, index) => ({
        text: text,
        isCorrect: index === correctIndex
    }));

    // Fisher-Yates shuffle
    for (let i = answerObjects.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answerObjects[i], answerObjects[j]] = [answerObjects[j], answerObjects[i]];
    }

    return answerObjects;
}

function selectAnswer(index) {
    // Don't allow selection if already answered
    if (userAnswers[currentQuestionIndex] !== null) return;

    // Remove previous selection
    const allAnswers = elements.answersContainer.querySelectorAll('.answer-option');
    allAnswers.forEach(answer => answer.classList.remove('selected'));

    // Select new answer
    allAnswers[index].classList.add('selected');
}

function handleConfirm() {
    const selectedAnswer = elements.answersContainer.querySelector('.answer-option.selected');
    if (!selectedAnswer) return;

    // Don't allow confirm if already answered
    if (userAnswers[currentQuestionIndex] !== null) return;

    const selectedIndex = parseInt(selectedAnswer.dataset.index);
    const isCorrect = selectedAnswer.dataset.isCorrect === 'true';

    // Store user answer
    userAnswers[currentQuestionIndex] = {
        selectedIndex: selectedIndex,
        isCorrect: isCorrect
    };

    // Show feedback
    showFeedback(isCorrect);

    // Highlight correct/incorrect answers
    const allAnswers = elements.answersContainer.querySelectorAll('.answer-option');
    allAnswers.forEach(answer => {
        answer.classList.add('disabled');
        const answerIndex = parseInt(answer.dataset.index);
        if (answer.dataset.isCorrect === 'true') {
            answer.classList.add('correct');
        } else if (answerIndex === selectedIndex) {
            answer.classList.add('incorrect');
        }
    });

    // Hide confirm button
    elements.confirmButton.style.display = 'none';

    // Update navigation
    updateNavigationButtons();
}

function showFeedback(isCorrect) {
    elements.feedback.style.display = 'flex';
    elements.feedback.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
        elements.feedbackIcon.textContent = '✓';
        elements.feedbackText.textContent = 'Risposta corretta! Ottimo lavoro!';
    } else {
        elements.feedbackIcon.textContent = '✗';
        elements.feedbackText.textContent = 'Risposta errata. La risposta corretta è evidenziata.';
    }
}

// ===== Navigation Functions =====
function updateNavigationButtons() {
    const totalQuestions = shuffledQuestions.length;
    const isFirstQuestion = currentQuestionIndex === 0;
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
    const allAnswered = userAnswers.every(a => a !== null);

    // Previous button
    elements.prevButton.style.display = isFirstQuestion ? 'none' : 'inline-block';

    // Next button
    elements.nextQuestionButton.style.display = isLastQuestion ? 'none' : 'inline-block';

    // Finish button
    elements.finishButton.style.display = (isLastQuestion && allAnswered) ? 'inline-block' : 'none';
}

function goToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
}

function goToNextQuestion() {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    }
}

function finishQuiz() {
    quizCompleted = true;
    showResults();
}

function showResults() {
    if (!quizCompleted) {
        // Check if all questions are answered
        const allAnswered = userAnswers.every(a => a !== null);
        if (!allAnswered) {
            alert('Per favore, rispondi a tutte le domande prima di terminare il quiz!');
            return;
        }
    }

    const totalQuestions = shuffledQuestions.length;
    const score = userAnswers.filter(a => a && a.isCorrect).length;
    const percentage = Math.round((score / totalQuestions) * 100);

    elements.finalScore.textContent = `${score}/${totalQuestions}`;
    elements.scorePercentage.textContent = `${percentage}%`;

    // Set congratulatory message based on performance
    let message = '';
    let icon = '';

    if (percentage === 100) {
        message = '🌟 Perfetto! Hai risposto correttamente a tutte le domande!';
        icon = '🎉';
    } else if (percentage >= 80) {
        message = '🎊 Ottimo lavoro! Hai una buona padronanza dell\'argomento!';
        icon = '🎊';
    } else if (percentage >= 60) {
        message = '👍 Buon risultato! Continua a studiare per migliorare!';
        icon = '👍';
    } else {
        message = '📚 Continua a studiare! La pratica rende perfetti!';
        icon = '📚';
    }

    elements.resultsMessage.textContent = message;
    document.querySelector('.results-icon').textContent = icon;

    elements.progressContainer.style.display = 'none';
    showView('results');
}

// ===== Import Modal Functions =====
function openImportModal() {
    const modal = document.getElementById('importModal');
    modal.classList.add('active');

    // Reset form
    document.getElementById('importForm').reset();
    document.getElementById('importStatus').style.display = 'none';
    document.getElementById('newCourseGroup').style.display = 'none';

    // Populate course select
    populateCourseSelect();
}

function closeImportModal() {
    const modal = document.getElementById('importModal');
    modal.classList.remove('active');
}

async function handleImportSubmit(event) {
    event.preventDefault();

    const courseSelect = document.getElementById('courseSelect');
    const courseNameInput = document.getElementById('courseName');
    const deckName = document.getElementById('deckName').value.trim();
    const fileInput = document.getElementById('quizFile');

    // Determine course name
    let courseName;
    if (courseSelect.value === '__new__') {
        courseName = courseNameInput.value.trim();
        if (!courseName) {
            showStatus('Inserisci il nome del nuovo corso', 'error');
            return;
        }
    } else if (courseSelect.value) {
        courseName = courseSelect.value;
    } else {
        showStatus('Seleziona un corso', 'error');
        return;
    }

    if (!fileInput.files || fileInput.files.length === 0) {
        showStatus('Seleziona un file', 'error');
        return;
    }

    const file = fileInput.files[0];

    try {
        // Read file content
        const fileContent = await readFileAsText(file);

        // Parse file
        const questions = FileParser.parseFile(fileContent, file.name);

        // Validate questions
        const validation = FileParser.validateQuestions(questions);
        if (!validation.valid) {
            showStatus(`Errore: ${validation.error}`, 'error');
            return;
        }

        // Save to storage
        StorageManager.saveQuizData(courseName, deckName, questions);

        // Reload app data
        appData = StorageManager.loadAllData();

        // Re-render courses
        renderCourses();

        // Show success message
        showStatus(`✓ Importato con successo! ${validation.questionCount} domande aggiunte.`, 'success');

        // Close modal after delay
        setTimeout(() => {
            closeImportModal();
        }, 2000);

    } catch (error) {
        console.error('Import error:', error);
        showStatus(`Errore: ${error.message}`, 'error');
    }
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Errore durante la lettura del file'));
        reader.readAsText(file);
    });
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('importStatus');
    statusDiv.textContent = message;
    statusDiv.className = `import-status ${type}`;
    statusDiv.style.display = 'block';
}

// ===== Course Select Population =====
function populateCourseSelect() {
    const courseSelect = document.getElementById('courseSelect');

    // Keep the default options
    courseSelect.innerHTML = `
        <option value="">-- Seleziona un corso esistente --</option>
        <option value="__new__">+ Crea nuovo corso</option>
    `;

    // Add existing courses
    const courses = Object.keys(appData.courses).sort();
    courses.forEach(courseName => {
        const option = document.createElement('option');
        option.value = courseName;
        option.textContent = courseName;
        courseSelect.appendChild(option);
    });

    // Add event listener for select change
    courseSelect.onchange = function () {
        const newCourseGroup = document.getElementById('newCourseGroup');
        const courseNameInput = document.getElementById('courseName');

        if (this.value === '__new__') {
            newCourseGroup.style.display = 'block';
            courseNameInput.required = true;
        } else {
            newCourseGroup.style.display = 'none';
            courseNameInput.required = false;
        }
    };
}

// ===== Delete Functions =====
function deleteDeck(courseName, deckName) {
    if (!confirm(`Sei sicuro di voler eliminare il deck "${deckName}"?`)) {
        return;
    }

    // Delete from storage
    const success = StorageManager.deleteDeck(courseName, deckName);

    if (success) {
        // Reload app data
        appData = StorageManager.loadAllData();

        // Re-render decks
        renderDecks();

        // Show notification
        alert(`Deck "${deckName}" eliminato con successo!`);
    } else {
        alert('Errore durante l\'eliminazione del deck.');
    }
}

// ===== Code Generator Functions =====
function generateDataCode() {
    // Get all data (hard-coded + imported)
    const allData = StorageManager.loadAllData();

    // Generate JavaScript code
    const code = `// Question data for Multiple Choice Study App
// This file contains all courses, decks, and questions

const STUDY_DATA = ${JSON.stringify(allData, null, 4)};
`;

    // Show in modal
    document.getElementById('generatedCode').value = code;
    document.getElementById('codeModal').classList.add('active');
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

// ===== Start Application =====
document.addEventListener('DOMContentLoaded', init);
