// ===== Application State =====
let currentCourse = null;
let currentDeck = null;
let currentQuestionIndex = 0;
let userAnswers = []; // Array to store user's answer for each question {questionIndex, selectedIndex, isCorrect}
let shuffledQuestions = [];
let appData = null; // Will hold all quiz data (hard-coded + imported)
let quizCompleted = false; // Track if quiz is finished

// History entries refer to quiz attempts kept in this tab.
let activeRoute = { view: 'home' };
const quizAttempts = new Map();
let deckColorTarget = null;
let fileImportInProgress = false;
let studyChangeInProgress = false;
let renameTarget = null;
let deleteCourseTarget = null;

// Stopwatch state
let stopwatchInterval = null;
let stopwatchStartTime = null;
let stopwatchElapsed = 0; // milliseconds

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
    quizNavJump: document.getElementById('quizNavJump'),
    quizNavSidebar: document.getElementById('quizNavSidebar'),
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
function sameRoute(first, second) {
    const sameCourse = first?.courseId && second.courseId ? first.courseId === second.courseId : first?.course === second.course;
    return first?.view === second.view && sameCourse && first.attempt === second.attempt;
}

function navigateTo(route, { back = false } = {}) {
    if (route.course) route = { ...route, courseId: appData.courses[route.course]?.databaseId };
    if (sameRoute(activeRoute, route)) return;

    if (back && sameRoute(history.state?.studyHub?.previous, route)) {
        history.back();
        return;
    }

    history.pushState({ studyHub: { route, previous: activeRoute } }, '');
    restoreRoute(route);
}

function restoreRoute(route) {
    const activeAttempt = quizAttempts.get(activeRoute.attempt);
    if (activeAttempt) {
        stopStopwatch();
        Object.assign(activeAttempt, {
            questionIndex: currentQuestionIndex,
            answers: userAnswers,
            elapsed: stopwatchElapsed,
            completed: quizCompleted
        });
    }

    if (route.course) {
        const courseName = route.courseId
            ? Object.keys(appData.courses).find(name => appData.courses[name].databaseId === route.courseId)
            : route.course;
        if (courseName === undefined || !Object.hasOwn(appData.courses, courseName)) {
            route = { view: 'home' };
        } else {
            const courseId = appData.courses[courseName].databaseId;
            route = route.attempt && !quizAttempts.has(route.attempt)
                ? { view: 'deck', course: courseName, courseId }
                : { ...route, course: courseName, courseId };
        }
    }

    activeRoute = route;
    currentCourse = route.course ?? null;
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    elements.progressContainer.style.display = route.view === 'quiz' ? 'flex' : 'none';

    if (route.view === 'home') {
        renderCourses();
    } else if (route.view === 'deck') {
        elements.courseTitle.textContent = currentCourse;
        renderDecks();
    } else {
        const attempt = quizAttempts.get(route.attempt);
        currentDeck = attempt.deck;
        shuffledQuestions = attempt.questions;
        currentQuestionIndex = attempt.questionIndex;
        userAnswers = attempt.answers;
        quizCompleted = attempt.completed;
        stopwatchElapsed = attempt.elapsed;
        elements.quizDeckName.textContent = currentDeck.name;
    }

    showView(route.view);
    if (route.view === 'quiz') {
        renderQuizNavGrid();
        loadQuestion();
        document.getElementById('stopwatchDisplay').textContent = formatTime(stopwatchElapsed);
        if (!quizCompleted) resumeStopwatch();
    } else if (route.view === 'results') {
        showResults();
    }
}

function showView(viewName) {
    Object.values(views).forEach(view => view.classList.remove('active'));
    const view = views[viewName];
    view.classList.add('active');
    view.querySelector('h2').focus({ preventScroll: true });
    window.scrollTo(0, 0);
}

// ===== Initialization =====
async function init() {
    // Initialize theme
    initTheme();
    setupEventListeners();

    // Show loading state (optional, but good practice)
    const courseList = document.getElementById('courseList');
    if (courseList) courseList.innerHTML = '<div class="loading">Caricamento corsi...</div>';

    // Load all data (Supabase + imported)
    appData = await StorageManager.loadAllData();
    const entry = history.state?.studyHub ?? { route: { view: 'home' } };
    restoreRoute(entry.route);
    history.replaceState({ studyHub: { ...entry, route: activeRoute } }, '');
    window.addEventListener('popstate', event => {
        restoreRoute(event.state?.studyHub?.route ?? { view: 'home' });
    });
    document.getElementById('importButton').disabled = false;
    document.getElementById('generateCodeButton').disabled = false;
}

// ===== Theme Toggle =====
function initTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    applyTheme(saved);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeToggle').setAttribute('aria-pressed', String(theme === 'dark'));
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Back buttons return to the named screen, reusing the previous entry when possible.
    document.getElementById('backToCourses').addEventListener('click', () => {
        navigateTo({ view: 'home' }, { back: true });
    });
    document.getElementById('backToDecks').addEventListener('click', () => {
        navigateTo({ view: 'deck', course: currentCourse }, { back: true });
    });
    document.getElementById('backToDecksFromResults').addEventListener('click', () => {
        navigateTo({ view: 'deck', course: currentCourse });
    });
    document.getElementById('backToHome').addEventListener('click', () => {
        navigateTo({ view: 'home' });
    });

    // Quiz buttons
    elements.confirmButton.addEventListener('click', handleConfirm);
    elements.prevButton.addEventListener('click', goToPreviousQuestion);
    elements.nextQuestionButton.addEventListener('click', goToNextQuestion);
    elements.finishButton.addEventListener('click', finishQuiz);
    document.getElementById('navFinishButton').addEventListener('click', finishQuiz);
    elements.quizNavJump.addEventListener('click', () => elements.quizNavSidebar.focus());

    // Results buttons
    document.getElementById('restartQuiz').addEventListener('click', restartQuiz);

    // Import modal handlers
    document.getElementById('importButton').addEventListener('click', () => openImportModal());
    document.getElementById('importCourseQuizButton').addEventListener('click', () => openImportModal(currentCourse));
    document.getElementById('closeImportModal').addEventListener('click', closeImportModal);
    document.getElementById('cancelImport').addEventListener('click', closeImportModal);
    document.getElementById('importForm').addEventListener('submit', handleImportSubmit);
    document.getElementById('quizFile').addEventListener('change', updateImportDeckName);

    // Code generator handlers
    document.getElementById('generateCodeButton').addEventListener('click', generateDataCode);
    document.getElementById('closeCodeModal').addEventListener('click', closeCodeModal);
    document.getElementById('copyCodeButton').addEventListener('click', copyGeneratedCode);

    // Add questions modal handlers
    document.getElementById('addQuestionsButton').addEventListener('click', openAddQuestionsModal);
    document.getElementById('closeAddQuestionsModal').addEventListener('click', closeAddQuestionsModal);
    document.getElementById('cancelManualAdd').addEventListener('click', closeAddQuestionsModal);
    document.getElementById('cancelImportAdd').addEventListener('click', closeAddQuestionsModal);
    document.getElementById('manualQuestionForm').addEventListener('submit', handleManualQuestionSubmit);
    document.getElementById('importQuestionsForm').addEventListener('submit', handleImportQuestionsSubmit);

    // Tab navigation for add questions modal
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabName = e.currentTarget.dataset.tab;
            switchTab(tabName);
        });
    });

    // Exam settings modal handlers
    document.getElementById('examSettingsButton').addEventListener('click', openExamSettingsModal);
    document.getElementById('closeExamSettingsModal').addEventListener('click', closeExamSettingsModal);
    document.getElementById('cancelExamSettings').addEventListener('click', closeExamSettingsModal);
    document.getElementById('saveExamSettings').addEventListener('click', saveExamSettings);
    document.querySelector('#deckColorDialog form').addEventListener('submit', saveDeckColor);
    document.querySelector('#startExamDialog form').addEventListener('submit', submitExamStart);
    document.getElementById('renameCourseButton').addEventListener('click', () => openRenameStudyDialog(currentCourse));
    document.querySelector('#renameStudyDialog form').addEventListener('submit', handleStudyRename);
    document.getElementById('deleteCourseButton').addEventListener('click', openDeleteCourseDialog);
    document.querySelector('#deleteCourseDialog form').addEventListener('submit', handleCourseDeletion);
    document.querySelectorAll('[data-close-dialog]').forEach(button => {
        button.addEventListener('click', () => button.closest('dialog').close());
    });
}

// ===== Course & Deck Rendering =====
function renderCourses() {
    elements.courseList.innerHTML = '';

    const courseNames = Object.keys(appData.courses);
    if (courseNames.length === 0) {
        elements.courseList.innerHTML = '<p class="loading">Nessun corso disponibile. Importa un quiz per iniziare.</p>';
    }

    courseNames.forEach(courseName => {
        const course = appData.courses[courseName];
        const deckCount = course.decks.length;
        const totalQuestions = courseQuestionCount(course);

        const courseCard = createStudyRow(
            courseName,
            `${deckCount} deck · ${questionCount(totalQuestions)}`,
            () => selectCourse(courseName)
        );
        elements.courseList.appendChild(courseCard);
    });
}

function selectCourse(courseName) {
    navigateTo({ view: 'deck', course: courseName });
}

function questionCount(count) {
    return count === 1 ? '1 domanda' : `${count} domande`;
}

function courseQuestionCount(course) {
    return course.decks.reduce((sum, deck) => sum + deck.questions.length, 0);
}

function createStudyRow(title, description, onClick) {
    const button = document.createElement('button');
    button.className = 'study-row';
    button.type = 'button';
    button.innerHTML = `
        <span class="card-title"></span>
        <span class="card-description"></span>
        <span class="row-arrow" aria-hidden="true">→</span>
    `;
    button.querySelector('.card-title').textContent = title;
    button.querySelector('.card-description').textContent = description;
    button.addEventListener('click', onClick);
    return button;
}

function deckColorKey(courseName, deckName) {
    return `studyHub:deckColor:${JSON.stringify([courseName, deckName])}`;
}

function createDeckColorButton(courseName, deckName) {
    const key = deckColorKey(courseName, deckName);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'deck-color-button';
    button.dataset.color = localStorage.getItem(key) ?? 'none';
    button.setAttribute('aria-label', `Colore del deck ${deckName}`);
    button.setAttribute('aria-haspopup', 'dialog');
    button.title = 'Scegli un colore';
    button.addEventListener('click', () => {
        const dialog = document.getElementById('deckColorDialog');
        deckColorTarget = { key, button };
        document.getElementById('deckColorName').textContent = deckName;
        dialog.querySelectorAll('.deck-color-option').forEach(option => {
            option.setAttribute('aria-pressed', String(option.value === button.dataset.color));
        });
        dialog.showModal();
    });
    return button;
}

function saveDeckColor(event) {
    const color = event.submitter?.value;
    if (!color) return;

    const { key, button } = deckColorTarget;
    if (color === 'none') {
        localStorage.removeItem(key);
    } else {
        localStorage.setItem(key, color);
    }
    button.dataset.color = color;
}

function renderDecks() {
    elements.deckList.replaceChildren();
    const examSlot = document.getElementById('examSlot');
    examSlot.replaceChildren();
    const course = appData.courses[currentCourse];

    const totalQuestions = courseQuestionCount(course);
    const examSettingsButton = document.getElementById('examSettingsButton');
    examSettingsButton.style.display = totalQuestions > 0 ? 'inline-flex' : 'none';

    const examButton = createStudyRow('Simulazione d’esame', `${questionCount(totalQuestions)} disponibili`, openStartExamDialog);
    examButton.classList.add('exam-deck');
    examButton.setAttribute('aria-haspopup', 'dialog');
    examSlot.appendChild(examButton);

    if (course.decks.length === 0) {
        elements.deckList.innerHTML = '<p class="loading">Nessun deck disponibile.</p>';
    }

    course.decks.forEach((deck, index) => {
        const row = document.createElement('div');
        row.className = 'deck-row';
        row.appendChild(createDeckColorButton(currentCourse, deck.name));

        const deckButton = createStudyRow(deck.name, questionCount(deck.questions.length), () => startQuiz(index));
        deckButton.disabled = deck.questions.length === 0;
        row.appendChild(deckButton);

        const actions = document.createElement('div');
        actions.className = 'deck-actions';
        const renameButton = document.createElement('button');
        renameButton.className = 'rename-btn';
        renameButton.type = 'button';
        renameButton.textContent = 'Rinomina';
        renameButton.setAttribute('aria-label', `Rinomina deck ${deck.name}`);
        renameButton.setAttribute('aria-haspopup', 'dialog');
        renameButton.addEventListener('click', () => openRenameStudyDialog(currentCourse, deck));
        actions.appendChild(renameButton);

        if (deck.imported) {
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn';
            deleteButton.type = 'button';
            deleteButton.textContent = 'Elimina';
            deleteButton.setAttribute('aria-label', `Elimina deck ${deck.name}`);
            deleteButton.addEventListener('click', () => deleteDeck(currentCourse, deck.name));
            actions.appendChild(deleteButton);
        }

        row.appendChild(actions);
        elements.deckList.appendChild(row);
    });
}

// ===== Quiz Logic =====
function startQuiz(deckIndex) {
    const deck = appData.courses[currentCourse].decks[deckIndex];
    startQuizAttempt(deck);
}

function startQuizAttempt(deck) {
    const questions = deck.questions.map(question => ({ ...question }));
    if (questions.length === 0) return;

    // Keep IDs distinct from history entries left over after a page reload.
    const attempt = crypto.getRandomValues(new Uint32Array(2)).join('-');
    quizAttempts.set(attempt, {
        course: currentCourse,
        deck,
        questions,
        questionIndex: 0,
        answers: Array(questions.length).fill(null),
        elapsed: 0,
        completed: false
    });
    navigateTo({ view: 'quiz', course: currentCourse, attempt });
}

// ===== Exam Mode =====
function examCountKey(courseName) {
    return `studyHub:examCount:${JSON.stringify(courseName)}`;
}

function openStartExamDialog() {
    const dialog = document.getElementById('startExamDialog');
    if (dialog.hasAttribute('aria-busy') || fileImportInProgress || studyChangeInProgress) return;

    const input = document.getElementById('examQuestionCount');
    const count = courseQuestionCount(appData.courses[currentCourse]);
    const savedCount = Number(localStorage.getItem(examCountKey(currentCourse)));
    const preferredCount = Number.isInteger(savedCount) && savedCount > 0 ? savedCount : 50;

    input.max = count;
    input.value = count > 0 ? Math.min(preferredCount, count) : '';
    input.disabled = count === 0;
    dialog.querySelector('button[type="submit"]').disabled = count === 0;
    document.getElementById('examQuestionLimit').textContent = count > 0
        ? `${questionCount(count)} disponibili nel corso.`
        : 'Aggiungi almeno una domanda per iniziare la simulazione.';
    dialog.showModal();
}

async function submitExamStart(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = document.getElementById('examQuestionCount');
    if (input.disabled || !input.reportValidity()) return;

    const origin = activeRoute;
    const total = input.valueAsNumber;
    const dialog = form.closest('dialog');
    const unlock = lockDialogControls(dialog);

    try {
        const settings = await SupabaseService.loadExamSettings(origin.course);
        if (activeRoute !== origin || !dialog.open) return;

        const decks = appData.courses[origin.course].decks;
        const questions = selectExamQuestions(decks, settings, total);
        localStorage.setItem(examCountKey(origin.course), String(total));
        dialog.close();
        startQuizAttempt({ name: 'Simulazione d’esame', questions, exam: true });
    } finally {
        unlock();
    }
}

function shuffleQuestions(questions) {
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function selectExamQuestions(decks, settings, total) {
    const pools = decks.map(deck => ({
        questions: deck.questions,
        weight: Object.hasOwn(settings, deck.name) ? settings[deck.name] : 0
    }));

    if (pools.reduce((sum, pool) => sum + pool.weight, 0) !== 100) {
        return shuffleQuestions(decks.flatMap(deck => deck.questions)).slice(0, total);
    }

    const weighted = pools.filter(pool => pool.weight > 0).map(pool => ({
        questions: shuffleQuestions(pool.questions),
        remainingQuota: total * pool.weight / 100
    }));
    const selected = [];
    while (selected.length < total) {
        let nextPool;
        for (const pool of weighted) {
            if (pool.questions.length && (!nextPool || pool.remainingQuota > nextPool.remainingQuota)) {
                nextPool = pool;
            }
        }
        if (!nextPool) break;

        selected.push(nextPool.questions.pop());
        nextPool.remainingQuota--;
    }

    // Esauriti i deck con una quota, completa l'esame con le domande ancora disponibili.
    if (selected.length < total) {
        const remaining = pools.filter(pool => pool.weight === 0).flatMap(pool => pool.questions);
        selected.push(...shuffleQuestions(remaining).slice(0, total - selected.length));
    }
    return shuffleQuestions(selected);
}

// ===== Exam Settings Modal Functions =====
async function openExamSettingsModal() {
    const origin = activeRoute;
    const modal = document.getElementById('examSettingsModal');
    modal.showModal();

    const container = document.getElementById('examSettingsContainer');
    container.innerHTML = '<p class="loading">Caricamento…</p>';
    document.getElementById('examSettingsStatus').style.display = 'none';

    const course = appData.courses[currentCourse];

    // Load saved settings
    let savedSettings = {};
    try {
        savedSettings = await SupabaseService.loadExamSettings(currentCourse);
    } catch (e) {
        console.warn('Could not load exam settings:', e);
    }

    if (activeRoute !== origin || !modal.open) return;

    // Build the UI for each deck
    container.innerHTML = '';
    course.decks.forEach(deck => {
        const savedPct = Object.hasOwn(savedSettings, deck.name) ? savedSettings[deck.name] : 0;

        const item = document.createElement('div');
        item.className = 'exam-settings-item';
        item.innerHTML = `
            <span class="deck-name"></span>
            <span class="deck-questions">${questionCount(deck.questions.length)}</span>
            <div class="percentage-input-wrapper">
                <input type="number" class="exam-pct-input" min="0" max="100" step="1">
                <span class="percentage-symbol" aria-hidden="true">%</span>
            </div>
        `;
        item.querySelector('.deck-name').textContent = deck.name;
        const input = item.querySelector('input');
        input.setAttribute('aria-label', `Percentuale per ${deck.name}`);
        input.dataset.deck = deck.name;
        input.value = savedPct;
        container.appendChild(item);
    });

    // Add event listeners for live total update
    container.querySelectorAll('.exam-pct-input').forEach(input => {
        input.addEventListener('input', updateExamTotal);
    });

    updateExamTotal();
}

function closeExamSettingsModal() {
    const modal = document.getElementById('examSettingsModal');
    modal.close();
}

function updateExamTotal() {
    const inputs = document.querySelectorAll('.exam-pct-input');
    let total = 0;
    inputs.forEach(input => {
        total += parseInt(input.value, 10) || 0;
    });

    const totalEl = document.getElementById('examTotalPercentage');
    const totalContainer = document.getElementById('examSettingsTotal');
    totalEl.textContent = `${total}%`;

    // Update visual state
    totalEl.classList.remove('valid', 'invalid');
    totalContainer.classList.remove('valid', 'invalid');

    if (total === 100) {
        totalEl.classList.add('valid');
        totalContainer.classList.add('valid');
    } else {
        totalEl.classList.add('invalid');
        totalContainer.classList.add('invalid');
    }
}

async function saveExamSettings() {
    const inputs = document.querySelectorAll('.exam-pct-input');
    const settingsMap = Object.create(null);
    let total = 0;

    inputs.forEach(input => {
        const val = parseInt(input.value, 10) || 0;
        settingsMap[input.dataset.deck] = val;
        total += val;
    });

    // Validate total = 100
    if (total !== 100) {
        const statusDiv = document.getElementById('examSettingsStatus');
        statusDiv.textContent = `La somma deve essere 100% (attualmente ${total}%)`;
        statusDiv.className = 'import-status error';
        statusDiv.style.display = 'block';
        return;
    }

    try {
        await SupabaseService.saveExamSettings(currentCourse, settingsMap);

        const statusDiv = document.getElementById('examSettingsStatus');
        statusDiv.textContent = 'Impostazioni salvate con successo!';
        statusDiv.className = 'import-status success';
        statusDiv.style.display = 'block';

        setTimeout(() => {
            closeExamSettingsModal();
        }, 1500);

    } catch (error) {
        console.error('Error saving exam settings:', error);
        const statusDiv = document.getElementById('examSettingsStatus');
        statusDiv.textContent = `Errore: ${error.message}`;
        statusDiv.className = 'import-status error';
        statusDiv.style.display = 'block';
    }
}

// ===== Stopwatch Functions =====
function resumeStopwatch() {
    stopwatchStartTime = Date.now() - stopwatchElapsed;
    const display = document.getElementById('stopwatchDisplay');

    stopwatchInterval = setInterval(() => {
        stopwatchElapsed = Date.now() - stopwatchStartTime;
        display.textContent = formatTime(stopwatchElapsed);
    }, 1000);
}

function stopStopwatch() {
    if (stopwatchStartTime === null) return;
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
    stopwatchElapsed = Date.now() - stopwatchStartTime;
    stopwatchStartTime = null;
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ===== Quiz Navigation Grid =====
function renderQuizNavGrid() {
    const grid = document.getElementById('quizNavGrid');
    grid.innerHTML = '';

    shuffledQuestions.forEach((_, index) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-nav-btn';
        btn.textContent = index + 1;
        btn.title = `Domanda ${index + 1}`;
        btn.addEventListener('click', () => goToQuestion(index));
        grid.appendChild(btn);
    });

    updateQuizNavGrid();
}

function updateQuizNavGrid() {
    const buttons = document.querySelectorAll('.quiz-nav-btn');
    buttons.forEach((btn, index) => {
        btn.classList.remove('current', 'correct', 'incorrect');

        const answer = userAnswers[index];
        if (answer !== null) {
            btn.classList.add(answer.isCorrect ? 'correct' : 'incorrect');
        }
        const isCurrent = index === currentQuestionIndex;
        btn.classList.toggle('current', isCurrent);
        if (isCurrent) {
            btn.setAttribute('aria-current', 'step');
        } else {
            btn.removeAttribute('aria-current');
        }

        const status = answer === null ? 'Da fare' : answer.isCorrect ? 'Corretta' : 'Sbagliata';
        btn.setAttribute('aria-label', `Domanda ${index + 1}, ${status}`);
    });
}

function goToQuestion(index) {
    if (index >= 0 && index < shuffledQuestions.length) {
        currentQuestionIndex = index;
        loadQuestion();
        if (elements.quizNavJump.offsetWidth > 0) {
            elements.questionText.focus({ preventScroll: true });
            elements.questionText.scrollIntoView({ block: 'start' });
        }
    }
}

function restartQuiz() {
    startQuizAttempt(currentDeck);
}

// Convert markdown-style bold (**text**) to HTML
function convertMarkdownToHtml(text) {
    if (!text) return text;
    // Convert **bold** to <strong>bold</strong>
    return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function updateScoreDisplay() {
    const answeredCount = userAnswers.filter(a => a !== null).length;
    const correctCount = userAnswers.filter(a => a && a.isCorrect).length;
    elements.scoreDisplay.textContent = `Punteggio: ${correctCount}/${answeredCount}`;
}

function loadQuestion() {
    const question = shuffledQuestions[currentQuestionIndex];
    const totalQuestions = shuffledQuestions.length;

    // Update progress
    elements.progressText.textContent = `Domanda ${currentQuestionIndex + 1} di ${totalQuestions}`;
    const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    elements.progressFill.style.width = `${progressPercent}%`;

    updateScoreDisplay();

    // Display question with markdown conversion
    elements.questionText.innerHTML = convertMarkdownToHtml(question.question);

    // Keep answers in original order
    const shuffledAnswers = question.answers.map((text, idx) => ({
        text: text,
        isCorrect: idx === question.correctIndex
    }));

    // Render answers
    elements.answersContainer.innerHTML = '';
    shuffledAnswers.forEach((answer, index) => {
        const answerDiv = document.createElement('button');
        answerDiv.type = 'button';
        answerDiv.className = 'answer-option';
        answerDiv.innerHTML = `
            <span class="answer-letter" aria-hidden="true">${String.fromCharCode(65 + index)}</span>
            <span class="answer-content">${convertMarkdownToHtml(answer.text)}</span>
        `;
        answerDiv.dataset.index = index;
        answerDiv.dataset.isCorrect = answer.isCorrect;

        // Check if this question was already answered
        const savedAnswer = userAnswers[currentQuestionIndex];
        answerDiv.setAttribute('aria-pressed', String(savedAnswer?.selectedIndex === index));
        if (savedAnswer) {
            // Disable all answers
            answerDiv.setAttribute('aria-disabled', 'true');
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
        elements.confirmButton.disabled = true;
    }

    // Update navigation buttons
    updateNavigationButtons();

    // Update quiz navigation grid
    updateQuizNavGrid();

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
    allAnswers.forEach((answer, answerIndex) => {
        const selected = answerIndex === index;
        answer.classList.toggle('selected', selected);
        answer.setAttribute('aria-pressed', String(selected));
    });
    elements.confirmButton.disabled = false;
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

    updateScoreDisplay();

    // Show feedback
    showFeedback(isCorrect);

    // Highlight correct/incorrect answers
    const allAnswers = elements.answersContainer.querySelectorAll('.answer-option');
    allAnswers.forEach(answer => {
        answer.classList.add('disabled');
        answer.setAttribute('aria-disabled', 'true');
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

    // Update quiz navigation grid
    updateQuizNavGrid();
    const nextAction = [elements.nextQuestionButton, elements.finishButton, elements.prevButton]
        .find(button => button.style.display !== 'none');
    nextAction?.focus();
}

function showFeedback(isCorrect) {
    elements.feedback.style.display = 'flex';
    elements.feedback.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
        elements.feedbackIcon.textContent = '✓';
        elements.feedbackText.textContent = 'Risposta corretta.';
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

    // Finish button (in quiz actions)
    elements.finishButton.style.display = (isLastQuestion && allAnswered) ? 'inline-block' : 'none';

    // Sidebar finish button
    const navFinish = document.getElementById('navFinishButton');
    navFinish.disabled = !allAnswered;
}

function goToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
        elements.questionText.focus();
    }
}

function goToNextQuestion() {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
        elements.questionText.focus();
    }
}

function finishQuiz() {
    if (userAnswers.some(answer => answer === null)) {
        alert('Per favore, rispondi a tutte le domande prima di terminare il quiz!');
        return;
    }

    quizCompleted = true;
    navigateTo({ ...activeRoute, view: 'results' });
}

function showResults() {
    const totalQuestions = shuffledQuestions.length;
    const score = userAnswers.filter(a => a && a.isCorrect).length;
    const percentage = Math.round((score / totalQuestions) * 100);

    elements.finalScore.textContent = `${score}/${totalQuestions}`;
    elements.scorePercentage.textContent = `${percentage}%`;

    elements.resultsMessage.textContent = `${currentCourse} · ${currentDeck.name}`;

    // Show elapsed time
    const resultsTimeValue = document.getElementById('resultsTimeValue');
    resultsTimeValue.textContent = formatTime(stopwatchElapsed);

    generateReview();
}

function generateReview() {
    const reviewContainer = document.getElementById('reviewContainer');
    if (!reviewContainer) {
        console.error('reviewContainer not found!');
        return;
    }

    reviewContainer.innerHTML = '';

    shuffledQuestions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer && userAnswer.isCorrect;

        const reviewCard = document.createElement('div');
        reviewCard.className = `review-card ${isCorrect ? 'correct' : 'incorrect'}`;

        // Question header
        const questionHeader = document.createElement('div');
        questionHeader.className = 'review-question-header';
        questionHeader.innerHTML = `
            <span class="review-number">Domanda ${index + 1}</span>
            <span class="review-status">${isCorrect ? '✓ Corretta' : '✗ Sbagliata'}</span>
        `;
        reviewCard.appendChild(questionHeader);

        // Question text
        const questionText = document.createElement('div');
        questionText.className = 'review-question-text';
        questionText.innerHTML = convertMarkdownToHtml(question.question);
        reviewCard.appendChild(questionText);

        // Answers
        const answersContainer = document.createElement('div');
        answersContainer.className = 'review-answers';

        question.answers.forEach((answer, answerIndex) => {
            const isUserAnswer = userAnswer && userAnswer.selectedIndex === answerIndex;
            const isCorrectAnswer = answerIndex === question.correctIndex;

            const answerDiv = document.createElement('div');
            answerDiv.className = 'review-answer';

            if (isCorrectAnswer) {
                answerDiv.classList.add('correct-answer');
            }
            if (isUserAnswer && !isCorrectAnswer) {
                answerDiv.classList.add('wrong-answer');
            }
            if (isUserAnswer) {
                answerDiv.classList.add('user-answer');
            }

            let prefix = '';
            if (isCorrectAnswer) {
                prefix = '✓ ';
            } else if (isUserAnswer) {
                prefix = '✗ ';
            }

            answerDiv.innerHTML = prefix + convertMarkdownToHtml(answer);
            answersContainer.appendChild(answerDiv);
        });

        reviewCard.appendChild(answersContainer);
        reviewContainer.appendChild(reviewCard);
    });

    // Trigger MathJax rendering
    if (window.MathJax) {
        MathJax.typesetPromise([reviewContainer]);
    }
}

// ===== Import Modal Functions =====
function openImportModal(courseName = '') {
    if (fileImportInProgress || studyChangeInProgress) return;

    const modal = document.getElementById('importModal');
    document.getElementById('importForm').reset();
    document.getElementById('importStatus').style.display = 'none';
    populateCourseSelect(courseName);
    updateImportDeckName();
    modal.showModal();
}

function closeImportModal() {
    const modal = document.getElementById('importModal');
    modal.close();
}

function updateImportDeckName() {
    const multipleFiles = document.getElementById('quizFile').files.length > 1;
    document.getElementById('deckNameGroup').hidden = multipleFiles;
    document.getElementById('deckName').required = !multipleFiles;
}

async function handleImportSubmit(event) {
    event.preventDefault();
    if (fileImportInProgress || studyChangeInProgress) return;

    const form = event.currentTarget;
    const courseSelect = document.getElementById('courseSelect');
    const isNewCourse = courseSelect.selectedOptions[0]?.hasAttribute('data-new-course');
    const courseName = isNewCourse ? document.getElementById('courseName').value.trim() : courseSelect.value;
    const fileInput = document.getElementById('quizFile');
    const files = Array.from(fileInput.files);
    const deckNameInput = document.getElementById('deckName');

    if (!courseName) {
        showStatus(isNewCourse ? 'Inserisci il nome del nuovo corso' : 'Seleziona un corso', 'error');
        return;
    }
    if (files.length === 0) {
        showStatus('Seleziona almeno un file', 'error');
        return;
    }

    const decks = files.map(file => ({
        file,
        name: files.length === 1 ? deckNameInput.value.trim() : file.name.replace(/\.[^.]+$/, '').trim()
    }));
    const deckNames = new Set((appData.courses[courseName]?.decks ?? []).map(deck => deck.name));
    for (const { file, name } of decks) {
        if (!name) {
            showStatus(`«${file.name}» · Inserisci un nome per il deck.`, 'error');
            return;
        }
        if (deckNames.has(name)) {
            showStatus(`«${file.name}» · Il nome del deck «${name}» è già in uso.`, 'error');
            return;
        }
        deckNames.add(name);
    }

    const unlock = lockFileImport(form);
    showStatus('Importazione in corso…', 'progress');
    let savedDecks = 0;
    let savedQuestions = 0;
    try {
        for (const deck of decks) {
            deck.questions = await readQuizFile(deck.file);
        }
        for (const { file, name, questions } of decks) {
            try {
                await StorageManager.saveQuizData(courseName, name, questions);
            } catch (error) {
                throw new Error(`«${file.name}» · ${error.message}`);
            }
            savedDecks++;
            savedQuestions += questions.length;
        }

        if (form.closest('dialog').open) {
            fileInput.value = '';
            updateImportDeckName();
            showStatus(`✓ Deck importati: ${savedDecks} · ${questionCount(savedQuestions)}`, 'success');
        }
    } catch (error) {
        console.error('Import error:', error);
        if (savedDecks > 0) {
            const remaining = decks.slice(savedDecks);
            const selection = new DataTransfer();
            remaining.forEach(deck => selection.items.add(deck.file));
            fileInput.files = selection.files;
            deckNameInput.value = remaining.length === 1 ? remaining[0].name : '';
            updateImportDeckName();
        }
        showStatus(`Deck importati: ${savedDecks} su ${decks.length}. ${error.message}`, 'error');
    } finally {
        try {
            if (savedDecks > 0) await refreshFileImportData();
            if (savedDecks === decks.length && form.closest('dialog').open) closeAfterFileImport(form);
        } finally {
            unlock();
        }
    }
}

async function readQuizFile(file) {
    try {
        const questions = FileParser.parseFile(await file.text(), file.name);
        const validation = FileParser.validateQuestions(questions);
        if (!validation.valid) throw new Error(validation.error);
        return questions;
    } catch (error) {
        throw new Error(`«${file.name}» · ${error.message}`);
    }
}

function lockFileImport(form) {
    fileImportInProgress = true;
    const unlock = lockDialogControls(form.closest('dialog'));
    return () => {
        unlock();
        fileImportInProgress = false;
    };
}

function lockDialogControls(dialog) {
    const controls = dialog.querySelectorAll('button:enabled, input:enabled, select:enabled, textarea:enabled');
    const preventCancel = event => event.preventDefault();
    dialog.setAttribute('aria-busy', 'true');
    controls.forEach(control => { control.disabled = true; });
    dialog.addEventListener('cancel', preventCancel);

    return () => {
        controls.forEach(control => { control.disabled = false; });
        dialog.removeEventListener('cancel', preventCancel);
        dialog.removeAttribute('aria-busy');
    };
}

async function refreshFileImportData() {
    appData = await StorageManager.loadAllData();
    if (activeRoute.view === 'deck' && appData.courses[currentCourse]) renderDecks();
    if (activeRoute.view === 'home') renderCourses();
}

function closeAfterFileImport(form) {
    const dialog = form.closest('dialog');
    const closeTimer = setTimeout(() => dialog.close(), 2000);
    dialog.addEventListener('close', () => clearTimeout(closeTimer), { once: true });
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('importStatus');
    statusDiv.textContent = message;
    statusDiv.className = `import-status ${type}`;
    statusDiv.style.display = 'block';
}

// ===== Course Select Population =====
function populateCourseSelect(courseName) {
    const courseSelect = document.getElementById('courseSelect');

    // Keep the default options
    courseSelect.innerHTML = `
        <option value="">-- Seleziona un corso esistente --</option>
        <option data-new-course>+ Crea nuovo corso</option>
    `;
    let newCourseValue = '__new__';
    while (Object.hasOwn(appData.courses, newCourseValue)) newCourseValue += '_';
    courseSelect.querySelector('[data-new-course]').value = newCourseValue;

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

        if (this.selectedOptions[0]?.hasAttribute('data-new-course')) {
            newCourseGroup.style.display = 'block';
            courseNameInput.required = true;
        } else {
            newCourseGroup.style.display = 'none';
            courseNameInput.required = false;
        }
    };
    courseSelect.value = courseName;
    courseSelect.onchange();
}

// ===== Add Questions Modal Functions =====
function openAddQuestionsModal() {
    if (fileImportInProgress || studyChangeInProgress) return;

    if (!currentCourse) {
        alert('Seleziona prima un corso!');
        return;
    }

    const modal = document.getElementById('addQuestionsModal');
    modal.showModal();

    // Reset forms
    document.getElementById('manualQuestionForm').reset();
    document.getElementById('importQuestionsForm').reset();
    document.getElementById('manualAddStatus').style.display = 'none';
    document.getElementById('importAddStatus').style.display = 'none';

    // Populate deck select
    populateTargetDeckSelect();

    // Switch to manual tab by default
    switchTab('manual');
}

function closeAddQuestionsModal() {
    const modal = document.getElementById('addQuestionsModal');
    modal.close();
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        const selected = btn.dataset.tab === tabName;
        btn.classList.toggle('active', selected);
        btn.setAttribute('aria-pressed', String(selected));
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    if (tabName === 'manual') {
        document.getElementById('manualTab').classList.add('active');
    } else if (tabName === 'import') {
        document.getElementById('importTab').classList.add('active');
    }
}

async function populateTargetDeckSelect() {
    const origin = activeRoute;
    const deckSelect = document.getElementById('targetDeckSelect');
    deckSelect.innerHTML = '<option value="">-- Seleziona un deck --</option>';

    // Get all decks for current course
    const decks = await StorageManager.getAllDecksForCourse(currentCourse);
    if (activeRoute !== origin) return;

    // Only show imported decks (we can only add to imported decks)
    const importedDecks = decks.filter(deck => deck.imported);

    if (importedDecks.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '(Nessun deck importato disponibile - crea prima un deck)';
        option.disabled = true;
        deckSelect.appendChild(option);
        return;
    }

    importedDecks.forEach(deck => {
        const option = document.createElement('option');
        option.value = deck.name;
        option.textContent = `${deck.name} (${deck.questions.length} domande)`;
        deckSelect.appendChild(option);
    });
}

async function handleManualQuestionSubmit(event) {
    event.preventDefault();
    const origin = activeRoute;

    const deckName = document.getElementById('targetDeckSelect').value;
    if (!deckName) {
        showAddStatus('Seleziona un deck di destinazione', 'error', 'manual');
        return;
    }

    // Get form data
    const questionText = document.getElementById('manualQuestionText').value.trim();
    const answers = [
        document.getElementById('answer0').value.trim(),
        document.getElementById('answer1').value.trim(),
        document.getElementById('answer2').value.trim(),
        document.getElementById('answer3').value.trim()
    ];
    const correctIndex = parseInt(document.querySelector('input[name="correctAnswer"]:checked').value);

    // Validate
    if (!questionText) {
        showAddStatus('Inserisci il testo della domanda', 'error', 'manual');
        return;
    }

    if (answers.some(a => !a)) {
        showAddStatus('Inserisci tutte e 4 le risposte', 'error', 'manual');
        return;
    }

    // Create question object
    const newQuestion = {
        question: questionText,
        answers: answers,
        correctIndex: correctIndex
    };

    try {
        // Add to storage
        await StorageManager.addQuestionsToDeck(origin.course, deckName, [newQuestion]);

        // Reload app data
        appData = await StorageManager.loadAllData();

        if (activeRoute.view === 'deck') renderDecks();
        if (activeRoute !== origin) return;

        // Get new total count
        const updatedDeck = appData.courses[origin.course].decks.find(d => d.name === deckName);
        const totalQuestions = updatedDeck ? updatedDeck.questions.length : 'N/A';

        // Show success
        showAddStatus(`✓ Domanda aggiunta! Il deck ora ha ${totalQuestions} domande.`, 'success', 'manual');

        // Reset form
        document.getElementById('manualQuestionForm').reset();

        // Close modal after delay
        setTimeout(() => {
            if (activeRoute === origin) closeAddQuestionsModal();
        }, 2000);

    } catch (error) {
        console.error('Error adding question:', error);
        showAddStatus(`Errore: ${error.message}`, 'error', 'manual');
    }
}

async function handleImportQuestionsSubmit(event) {
    event.preventDefault();
    if (fileImportInProgress || studyChangeInProgress) return;

    const form = event.currentTarget;
    const origin = activeRoute;

    const deckName = document.getElementById('targetDeckSelect').value;
    if (!deckName) {
        showAddStatus('Seleziona un deck di destinazione', 'error', 'import');
        return;
    }

    const files = Array.from(document.getElementById('questionsFile').files);
    if (files.length === 0) {
        showAddStatus('Seleziona almeno un file', 'error', 'import');
        return;
    }

    const unlock = lockFileImport(form);
    showAddStatus('Importazione in corso…', 'progress', 'import');
    try {
        const questionSets = [];
        for (const file of files) {
            questionSets.push(await readQuizFile(file));
        }
        const questions = questionSets.flat();
        await StorageManager.addQuestionsToDeck(origin.course, deckName, questions);
        form.reset();

        await refreshFileImportData();
        if (!form.closest('dialog').open) return;

        showAddStatus(`✓ Aggiunte ${questionCount(questions.length)} al deck «${deckName}».`, 'success', 'import');
        closeAfterFileImport(form);

    } catch (error) {
        console.error('Import error:', error);
        showAddStatus(`Errore: ${error.message}`, 'error', 'import');
    } finally {
        unlock();
    }
}

function showAddStatus(message, type, tab) {
    const statusDiv = document.getElementById(`${tab}AddStatus`);
    statusDiv.textContent = message;
    statusDiv.className = `import-status ${type}`;
    statusDiv.style.display = 'block';
}

// ===== Course and Deck Management =====
function openRenameStudyDialog(courseName, deck = null) {
    if (fileImportInProgress || studyChangeInProgress) return;

    renameTarget = { courseName, deck };
    const dialog = document.getElementById('renameStudyDialog');
    const input = document.getElementById('studyName');
    document.getElementById('renameStudyTitle').textContent = deck ? 'Rinomina deck' : 'Rinomina corso';
    dialog.querySelector('[role="alert"]').hidden = true;
    input.value = deck ? deck.name : courseName;
    dialog.showModal();
    input.select();
}

async function handleStudyRename(event) {
    event.preventDefault();
    if (studyChangeInProgress) return;

    const dialog = event.currentTarget.closest('dialog');
    const { courseName, deck } = renameTarget;
    const oldName = deck ? deck.name : courseName;
    const newName = document.getElementById('studyName').value.trim();
    const course = appData.courses[courseName];

    if (!newName) {
        showStudyChangeError(dialog, 'Inserisci un nome.');
        return;
    }
    if (newName === oldName) {
        dialog.close();
        return;
    }
    const nameInUse = deck
        ? course.decks.some(otherDeck => otherDeck.name === newName)
        : Object.hasOwn(appData.courses, newName);
    if (nameInUse) {
        showStudyChangeError(dialog, 'Questo nome è già in uso.');
        return;
    }

    await runStudyChange(dialog, async () => {
        if (deck) {
            await StorageManager.renameDeck(courseName, deck, newName);
            moveStudyPreference(deckColorKey(courseName, oldName), deckColorKey(courseName, newName));
            deck.name = newName;
            for (const attempt of quizAttempts.values()) {
                if (attempt.course === courseName && !attempt.deck.exam && attempt.deck.name === oldName &&
                    attempt.deck.databaseId === deck.databaseId) {
                    attempt.deck.name = newName;
                }
            }
            if (currentCourse === courseName) restoreRoute(activeRoute);
        } else {
            await StorageManager.changeCourse(courseName, course, newName);
            moveStudyPreference(examCountKey(courseName), examCountKey(newName));
            course.decks.forEach(item => moveStudyPreference(deckColorKey(courseName, item.name), deckColorKey(newName, item.name)));
            appData.courses[newName] = course;
            delete appData.courses[courseName];
            for (const attempt of quizAttempts.values()) {
                if (attempt.course === courseName) attempt.course = newName;
            }

            const renameRoute = route => route?.course === courseName ? { ...route, course: newName } : route;
            const entry = history.state?.studyHub;
            if (entry) {
                history.replaceState({ studyHub: { route: renameRoute(entry.route), previous: renameRoute(entry.previous) } }, '');
            }
            if (currentCourse === courseName) restoreRoute(renameRoute(activeRoute));
            if (activeRoute.view === 'home') renderCourses();
        }
    });
}

function openDeleteCourseDialog() {
    if (fileImportInProgress || studyChangeInProgress) return;

    deleteCourseTarget = currentCourse;
    const course = appData.courses[currentCourse];
    const count = courseQuestionCount(course);
    const dialog = document.getElementById('deleteCourseDialog');
    dialog.querySelector('[role="alert"]').hidden = true;
    document.getElementById('deleteCourseMessage').textContent =
        `Il corso «${currentCourse}» verrà eliminato insieme a ${course.decks.length} deck e ${questionCount(count)}. L’operazione è irreversibile.`;
    dialog.showModal();
}

async function handleCourseDeletion(event) {
    event.preventDefault();
    if (studyChangeInProgress) return;

    const dialog = event.currentTarget.closest('dialog');
    const courseName = deleteCourseTarget;
    const course = appData.courses[courseName];

    await runStudyChange(dialog, async () => {
        await StorageManager.changeCourse(courseName, course);
        localStorage.removeItem(examCountKey(courseName));
        course.decks.forEach(deck => localStorage.removeItem(deckColorKey(courseName, deck.name)));
        delete appData.courses[courseName];

        if (currentCourse === courseName) {
            const route = { view: 'home' };
            history.replaceState({ studyHub: { route } }, '');
            restoreRoute(route);
        } else if (activeRoute.view === 'home') {
            renderCourses();
        }
        for (const [id, attempt] of quizAttempts) {
            if (attempt.course === courseName) quizAttempts.delete(id);
        }
    });
}

async function runStudyChange(dialog, change) {
    studyChangeInProgress = true;
    dialog.querySelector('[role="alert"]').hidden = true;
    const unlock = lockDialogControls(dialog);
    try {
        await change();
        dialog.close();
    } catch (error) {
        console.error('Errore durante la modifica della raccolta:', error);
        showStudyChangeError(dialog, error.message);
    } finally {
        unlock();
        studyChangeInProgress = false;
    }
}

function showStudyChangeError(dialog, message) {
    const status = dialog.querySelector('[role="alert"]');
    status.textContent = message;
    status.hidden = false;
}

function moveStudyPreference(oldKey, newKey) {
    const value = localStorage.getItem(oldKey);
    if (value === null) return;

    localStorage.setItem(newKey, value);
    localStorage.removeItem(oldKey);
}

async function deleteDeck(courseName, deckName) {
    if (fileImportInProgress || studyChangeInProgress) return;
    if (!confirm(`Sei sicuro di voler eliminare il deck "${deckName}"?`)) {
        return;
    }

    // Delete from storage
    const success = await StorageManager.deleteDeck(courseName, deckName);

    if (success) {
        localStorage.removeItem(deckColorKey(courseName, deckName));
        // Reload app data
        appData = await StorageManager.loadAllData();

        if (activeRoute.view === 'deck' && appData.courses[currentCourse]) renderDecks();
        if (activeRoute.view === 'deck' && !appData.courses[currentCourse]) navigateTo({ view: 'home' });

        // Show notification
        alert(`Deck "${deckName}" eliminato con successo!`);
    } else {
        alert('Errore durante l\'eliminazione del deck.');
    }
}

// ===== Code Generator Functions =====
async function generateDataCode() {
    const origin = activeRoute;
    console.log('generateDataCode called');

    try {
        // Get all data (hard-coded + imported)
        const allData = await StorageManager.loadAllData();
        if (activeRoute !== origin) return;
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
        codeModal.showModal();
        console.log('Modal should be visible now');

    } catch (error) {
        console.error('Error in generateDataCode:', error);
        alert('Errore durante la generazione del codice: ' + error.message);
    }
}

function closeCodeModal() {
    document.getElementById('codeModal').close();
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
        copyBtn.textContent = 'Copiato!';

        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    } catch (err) {
        alert('Impossibile copiare automaticamente. Seleziona tutto il testo e copia manualmente (Ctrl+C / Cmd+C)');
    }
}

// ===== Start Application =====
document.addEventListener('DOMContentLoaded', init);
