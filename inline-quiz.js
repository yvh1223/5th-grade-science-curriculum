/**
 * Inline Quiz - Immediate Feedback System
 * Provides instant feedback for practice questions in science curriculum
 */

(function() {
    'use strict';

    // Initialize when DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        initializeInlineQuiz();
    });

    function initializeInlineQuiz() {
        // Find all inline questions
        const questions = document.querySelectorAll('.inline-question');

        if (questions.length === 0) {
            return; // No inline questions on this page
        }

        // Set up each question
        questions.forEach(function(question) {
            setupQuestion(question);
        });
    }

    function setupQuestion(questionElement) {
        const correctAnswer = questionElement.getAttribute('data-correct');
        const radioButtons = questionElement.querySelectorAll('input[type="radio"]');
        const optionContainers = questionElement.querySelectorAll('.option-container');
        const explanationDiv = questionElement.querySelector('.explanation');

        // Add click handler to each radio button
        radioButtons.forEach(function(radio) {
            radio.addEventListener('change', function() {
                handleAnswerSelection(radio, correctAnswer, optionContainers, explanationDiv, radioButtons);
            });
        });

        // Also add click handler to the entire option container for better UX
        optionContainers.forEach(function(container) {
            container.addEventListener('click', function(e) {
                // Don't trigger if clicking the radio button itself (it will handle its own event)
                if (e.target.tagName !== 'INPUT') {
                    const radio = container.querySelector('input[type="radio"]');
                    if (radio && !radio.disabled) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change'));
                    }
                }
            });
        });
    }

    function handleAnswerSelection(selectedRadio, correctAnswer, optionContainers, explanationDiv, allRadios) {
        const selectedValue = selectedRadio.value;
        const isCorrect = selectedValue === correctAnswer;

        // Disable all radio buttons after selection
        allRadios.forEach(function(radio) {
            radio.disabled = true;
        });

        // Remove hover effects and cursor on all containers
        optionContainers.forEach(function(container) {
            container.style.cursor = 'default';
        });

        // Find the selected option container
        const selectedContainer = selectedRadio.closest('.option-container');

        // Apply feedback styling
        if (isCorrect) {
            // Mark as correct
            selectedContainer.classList.add('correct-answer', 'selected-answer');

            // Show success feedback
            showFeedback(selectedContainer, true);
        } else {
            // Mark as incorrect
            selectedContainer.classList.add('incorrect-answer', 'selected-answer');

            // Also highlight the correct answer
            optionContainers.forEach(function(container) {
                const radio = container.querySelector('input[type="radio"]');
                if (radio && radio.value === correctAnswer) {
                    container.classList.add('correct-answer');
                }
            });

            // Show error feedback
            showFeedback(selectedContainer, false);
        }

        // Show explanation
        if (explanationDiv) {
            const explanationText = explanationDiv.getAttribute('data-text');
            explanationDiv.textContent = '';

            // Add header
            const header = document.createElement('strong');
            header.textContent = isCorrect ? '✅ Correct! ' : '❌ Not quite. ';
            header.style.fontSize = '1.1em';
            header.style.display = 'block';
            header.style.marginBottom = '10px';
            explanationDiv.appendChild(header);

            // Add explanation text
            const textNode = document.createTextNode(explanationText);
            explanationDiv.appendChild(textNode);

            // Show with animation
            explanationDiv.style.display = 'block';
            setTimeout(function() {
                explanationDiv.style.opacity = '1';
                explanationDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    }

    function showFeedback(container, isCorrect) {
        // Add a temporary pulse animation
        container.style.transition = 'all 0.3s ease';
        container.style.transform = 'scale(1.02)';

        setTimeout(function() {
            container.style.transform = 'scale(1)';
        }, 300);

        // Add checkmark or X symbol
        const symbol = document.createElement('span');
        symbol.style.marginLeft = '10px';
        symbol.style.fontSize = '1.3em';
        symbol.style.fontWeight = 'bold';
        symbol.textContent = isCorrect ? '✓' : '✗';

        const optionText = container.querySelector('.option-text');
        if (optionText && !optionText.querySelector('span[style]')) {
            optionText.appendChild(symbol);
        }
    }

    // Optional: Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        // Allow Enter/Space to select focused radio button
        if ((e.key === 'Enter' || e.key === ' ') &&
            e.target.tagName === 'INPUT' &&
            e.target.type === 'radio') {
            e.preventDefault();
            e.target.click();
        }
    });

})();
