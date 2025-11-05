// Enhanced Test Engine with Answer Shuffling and Timer
// This ensures answers are randomized and not always in the same position

class TestEngine {
    constructor(testData, testName, timeLimit) {
        this.testData = testData;
        this.testName = testName;
        this.timeLimit = timeLimit; // in minutes
        this.userAnswers = {};
        this.questionOrder = this.shuffleQuestions ? this.shuffleArray([...Array(testData.questions.length).keys()]) : [...Array(testData.questions.length).keys()];
        this.timer = null;
        this.timeRemaining = timeLimit * 60; // convert to seconds
        this.testStartTime = null;
        this.answerMappings = {}; // Store original answer mappings for each question

        this.init();
    }

    init() {
        this.prepareQuestions();
        this.renderQuestions();
        this.startTimer();
        this.setupEventListeners();
        this.updateProgress();
    }

    // Shuffle array using Fisher-Yates algorithm
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    // Prepare questions by shuffling answer choices
    prepareQuestions() {
        this.testData.questions.forEach((question, qIndex) => {
            // Create array of answer indices
            const indices = [...Array(question.options.length).keys()];

            // Shuffle indices
            const shuffledIndices = this.shuffleArray(indices);

            // Store the mapping: shuffled position -> original position
            this.answerMappings[qIndex] = {};
            shuffledIndices.forEach((originalIndex, newPosition) => {
                this.answerMappings[qIndex][newPosition] = originalIndex;
            });

            // Create shuffled options
            question.shuffledOptions = shuffledIndices.map(i => question.options[i]);

            // Find new position of correct answer
            question.shuffledCorrect = shuffledIndices.indexOf(question.correct);
        });
    }

    renderQuestions() {
        const container = document.getElementById('test-questions');
        if (!container) return;

        container.innerHTML = '';

        this.testData.questions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-container';
            questionDiv.id = `question-${index}`;

            const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

            let optionsHTML = '';
            question.shuffledOptions.forEach((option, optIndex) => {
                optionsHTML += `
                    <label class="answer-option">
                        <input type="radio" name="q${index}" value="${optIndex}" data-question="${index}">
                        <span class="option-label">${optionLabels[optIndex]}.</span> ${option}
                    </label>
                `;
            });

            questionDiv.innerHTML = `
                <div class="question-header">
                    <div class="question-number">Question ${index + 1}</div>
                    <div class="question-type">${question.topic || 'Science'}</div>
                </div>
                <div class="question-text">${question.question}</div>
                ${question.visual ? `<div class="visual-question">${question.visual}</div>` : ''}
                ${question.data_table ? `<div class="data-container">${question.data_table}</div>` : ''}
                <div class="answer-options">
                    ${optionsHTML}
                </div>
                <div class="answer-reveal" id="reveal-${index}" style="display: none;">
                    <div class="reveal-spacer"></div>
                    <div class="reveal-content">
                        <h4>✅ Correct Answer: ${optionLabels[question.shuffledCorrect]}</h4>
                        <p><strong>Explanation:</strong> ${question.explanation}</p>
                    </div>
                </div>
            `;

            container.appendChild(questionDiv);
        });
    }

    setupEventListeners() {
        // Handle answer selection
        document.addEventListener('change', (e) => {
            if (e.target.type === 'radio' && e.target.name.startsWith('q')) {
                const questionIndex = parseInt(e.target.dataset.question);
                const selectedOption = parseInt(e.target.value);
                this.userAnswers[questionIndex] = selectedOption;

                // Update progress
                this.updateProgress();

                // Highlight selected answer
                const answerOptions = document.querySelectorAll(`input[name="q${questionIndex}"]`);
                answerOptions.forEach(option => {
                    option.parentElement.classList.remove('selected');
                });
                e.target.parentElement.classList.add('selected');
            }
        });

        // Submit button
        const submitBtn = document.getElementById('submit-test');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitTest());
        }

        // Review button
        const reviewBtn = document.getElementById('review-answers');
        if (reviewBtn) {
            reviewBtn.addEventListener('click', () => this.reviewAnswers());
        }

        // Restart button
        const restartBtn = document.getElementById('restart-test');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartTest());
        }

        // Show answers button
        const showAnswersBtn = document.getElementById('show-answers');
        if (showAnswersBtn) {
            showAnswersBtn.addEventListener('click', () => this.showAllAnswers());
        }
    }

    startTimer() {
        if (this.timeLimit === 0) return; // No timer for untimed tests

        this.testStartTime = Date.now();
        const timerDisplay = document.getElementById('time-display');

        this.timer = setInterval(() => {
            this.timeRemaining--;

            if (this.timeRemaining <= 0) {
                clearInterval(this.timer);
                this.autoSubmit();
                return;
            }

            // Update display
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            // Update timer color based on time remaining
            const timerContainer = document.getElementById('timer');
            if (this.timeRemaining <= 60) {
                timerContainer.className = 'timer-container timer-danger';
            } else if (this.timeRemaining <= 300) {
                timerContainer.className = 'timer-container timer-warning';
            } else {
                timerContainer.className = 'timer-container timer-running';
            }
        }, 1000);
    }

    updateProgress() {
        const answered = Object.keys(this.userAnswers).length;
        const total = this.testData.questions.length;
        const percentage = (answered / total) * 100;

        const progressFill = document.getElementById('progress');
        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }

        const progressText = document.getElementById('progress-text');
        if (progressText) {
            progressText.textContent = `${answered} / ${total} answered`;
        }
    }

    reviewAnswers() {
        // Scroll through unanswered questions
        const unanswered = [];
        for (let i = 0; i < this.testData.questions.length; i++) {
            if (this.userAnswers[i] === undefined) {
                unanswered.push(i + 1);
            }
        }

        if (unanswered.length > 0) {
            alert(`You have ${unanswered.length} unanswered question(s): ${unanswered.join(', ')}`);
            // Scroll to first unanswered question
            const firstUnanswered = document.getElementById(`question-${unanswered[0] - 1}`);
            if (firstUnanswered) {
                firstUnanswered.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstUnanswered.style.border = '3px solid #ff9800';
                setTimeout(() => {
                    firstUnanswered.style.border = '';
                }, 2000);
            }
        } else {
            alert('All questions answered! Ready to submit?');
        }
    }

    submitTest() {
        // Check if all questions are answered
        const answered = Object.keys(this.userAnswers).length;
        const total = this.testData.questions.length;

        if (answered < total) {
            const confirm = window.confirm(
                `You have only answered ${answered} out of ${total} questions. Do you want to submit anyway?`
            );
            if (!confirm) return;
        }

        // Stop timer
        if (this.timer) {
            clearInterval(this.timer);
        }

        // Calculate score
        const results = this.calculateScore();

        // Save results
        this.saveTestResults(results);

        // Show results
        this.displayResults(results);
    }

    autoSubmit() {
        alert('Time is up! Your test will be submitted automatically.');
        this.submitTest();
    }

    calculateScore() {
        let correctCount = 0;
        let incorrectCount = 0;
        const questionResults = [];

        this.testData.questions.forEach((question, index) => {
            const userAnswer = this.userAnswers[index];
            const isCorrect = userAnswer === question.shuffledCorrect;

            if (isCorrect) {
                correctCount++;
            } else if (userAnswer !== undefined) {
                incorrectCount++;
            }

            questionResults.push({
                questionNumber: index + 1,
                question: question.question,
                userAnswer: userAnswer !== undefined ? question.shuffledOptions[userAnswer] : 'Not answered',
                correctAnswer: question.shuffledOptions[question.shuffledCorrect],
                isCorrect: isCorrect,
                explanation: question.explanation,
                wasAnswered: userAnswer !== undefined
            });
        });

        const scorePercentage = Math.round((correctCount / this.testData.questions.length) * 100);

        return {
            correct: correctCount,
            incorrect: incorrectCount,
            unanswered: this.testData.questions.length - correctCount - incorrectCount,
            total: this.testData.questions.length,
            percentage: scorePercentage,
            questionResults: questionResults,
            timeSpent: this.timeLimit > 0 ? this.timeLimit * 60 - this.timeRemaining : 0
        };
    }

    displayResults(results) {
        // Hide test questions and controls
        document.getElementById('test-questions').style.display = 'none';
        document.getElementById('test-controls').style.display = 'none';

        // Show results container
        const resultsContainer = document.getElementById('results');
        resultsContainer.style.display = 'block';

        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth' });

        // Display score
        const scoreCircle = document.getElementById('score-circle');
        const scoreText = document.getElementById('score-text');
        const scoreMessage = document.getElementById('score-message');

        scoreText.textContent = `${results.correct}/${results.total}`;

        // Determine score class and message
        let scoreClass, message, emoji;
        if (results.percentage >= 90) {
            scoreClass = 'score-excellent';
            emoji = '🏆';
            message = 'Outstanding! You\'re ready for the real test!';
        } else if (results.percentage >= 80) {
            scoreClass = 'score-good';
            emoji = '🎯';
            message = 'Great job! You have a solid understanding!';
        } else if (results.percentage >= 70) {
            scoreClass = 'score-good';
            emoji = '👍';
            message = 'Good work! Review the missed questions to improve.';
        } else if (results.percentage >= 60) {
            scoreClass = 'score-needs-work';
            emoji = '📚';
            message = 'You\'re making progress! Keep studying and practicing.';
        } else {
            scoreClass = 'score-poor';
            emoji = '💪';
            message = 'Don\'t give up! Review the material and try again.';
        }

        scoreCircle.className = `score-circle ${scoreClass}`;
        scoreCircle.innerHTML = `
            <div style="font-size: 3em;">${emoji}</div>
            <div style="font-size: 2em; font-weight: bold;">${results.percentage}%</div>
        `;

        scoreMessage.innerHTML = `
            <h3>${message}</h3>
            <p style="margin-top: 15px;">
                ✅ Correct: ${results.correct} |
                ❌ Incorrect: ${results.incorrect} |
                ⚠️ Unanswered: ${results.unanswered}
            </p>
            ${this.timeLimit > 0 ? `<p>⏱️ Time spent: ${Math.floor(results.timeSpent / 60)} minutes ${results.timeSpent % 60} seconds</p>` : ''}
        `;

        // Display detailed review
        const reviewContainer = document.getElementById('answers-review');
        let reviewHTML = '<h3 style="margin: 30px 0 20px 0;">📋 Detailed Answer Review</h3>';

        results.questionResults.forEach((result, index) => {
            const icon = result.isCorrect ? '✅' : (result.wasAnswered ? '❌' : '⚠️');
            const bgColor = result.isCorrect ? '#e8f5e8' : (result.wasAnswered ? '#ffebee' : '#fff3e0');

            reviewHTML += `
                <div style="background: ${bgColor}; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 5px solid ${result.isCorrect ? '#4CAF50' : '#f44336'};">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <h4 style="margin-bottom: 10px;">${icon} Question ${result.questionNumber}</h4>
                        <span style="background: ${result.isCorrect ? '#4CAF50' : '#f44336'}; color: white; padding: 5px 15px; border-radius: 15px; font-size: 0.85em;">
                            ${result.isCorrect ? 'Correct' : (result.wasAnswered ? 'Incorrect' : 'Not Answered')}
                        </span>
                    </div>
                    <p style="margin: 10px 0;"><strong>Question:</strong> ${result.question}</p>
                    <p style="margin: 10px 0;"><strong>Your Answer:</strong> ${result.userAnswer}</p>
                    ${!result.isCorrect ? `<p style="margin: 10px 0; color: #2e7d32;"><strong>Correct Answer:</strong> ${result.correctAnswer}</p>` : ''}
                    <p style="margin: 15px 0 0 0; padding: 15px; background: rgba(255,255,255,0.7); border-radius: 8px;">
                        <strong>💡 Explanation:</strong> ${result.explanation}
                    </p>
                </div>
            `;
        });

        reviewContainer.innerHTML = reviewHTML;
    }

    showAllAnswers() {
        // Show all answer reveals
        this.testData.questions.forEach((question, index) => {
            const reveal = document.getElementById(`reveal-${index}`);
            if (reveal) {
                reveal.style.display = 'block';
            }
        });

        // Hide the show answers button
        const showAnswersBtn = document.getElementById('show-answers');
        if (showAnswersBtn) {
            showAnswersBtn.style.display = 'none';
        }
    }

    saveTestResults(results) {
        // Save to localStorage
        const testScores = JSON.parse(localStorage.getItem('testScores') || '{}');
        testScores[this.testName] = results.percentage;
        localStorage.setItem('testScores', JSON.stringify(testScores));

        // Update total questions answered
        const totalQuestions = parseInt(localStorage.getItem('totalQuestionsAnswered') || '0');
        localStorage.setItem('totalQuestionsAnswered', totalQuestions + results.total);

        // Save detailed results
        const testHistory = JSON.parse(localStorage.getItem('testHistory') || '[]');
        testHistory.push({
            testName: this.testName,
            date: new Date().toISOString(),
            score: results.percentage,
            correct: results.correct,
            total: results.total,
            timeSpent: results.timeSpent
        });
        localStorage.setItem('testHistory', JSON.stringify(testHistory));
    }

    restartTest() {
        if (confirm('Are you sure you want to restart the test? All your answers will be lost.')) {
            location.reload();
        }
    }
}

// Utility function to create test data structure
function createQuestion(question, options, correct, explanation, topic = '') {
    return {
        question,
        options,
        correct,
        explanation,
        topic
    };
}
