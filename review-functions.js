function showResults() {
    if (!quizCompleted) {
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

    // Set congratulatory message
    let message = '', icon = '';
    if (percentage === 100) {
        message = '🌟 Perfetto! Hai risposto correct

tamente a tutte le domande!';
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

    // Generate detailed review
    generateReview();

    elements.progressContainer.style.display = 'none';
    showView('results');
}

function generateReview() {
    const reviewContainer = document.getElementById('reviewContainer');
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
