let currentQuestionIndex = 1; // Tracks the current question index
let lastSelectedOption = null; // Tracks the last selected option for undo functionality
let timerInterval; // Interval for the timer
let timeLeft = 80; // Time left in seconds (1:20 minutes)

// Initialize speech recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = false;
recognition.lang = 'en-US';

// Start the quiz: start speech recognition and read out the questions
function startQuiz() {
    currentQuestionIndex = 1; // Reset question index
    lastSelectedOption = null; // Reset the last selected option
    timeLeft = 80; // Reset time left
    startRecognition();
    startTimer();
    readQuestion(currentQuestionIndex);
}

// Start the speech recognition
function startRecognition() {
    recognition.start();
}

// Stop the speech recognition
function stopRecognition() {
    recognition.stop();
}

// Handle the speech recognition results
recognition.onresult = function(event) {
    const result = event.results[event.resultIndex];
    const spokenText = result[0].transcript.trim().toUpperCase();

    console.log(`Recognized text: ${spokenText}`); // Debug log

    if (/REPEAT/.test(spokenText)) {
        readQuestion(currentQuestionIndex); // Repeat the current question
    } else if (/UNDO/.test(spokenText)) {
        undoLastSelection(); // Undo the last selection
    } else if (/NEXT/.test(spokenText)) {
        nextQuestion(); // Move to the next question
    } else if (/SUBMIT/.test(spokenText)) {
        stopRecognition(); // Stop recognition before submitting
        clearInterval(timerInterval); // Stop the timer
        submitQuiz(); // Submit the quiz
    } else if (/CLOCK/.test(spokenText)) {
        announceTimeLeft(); // Announce the time left
    } else if (/A\b|a|Aee|AA/.test(spokenText)) {
        selectOption("A");
    } else if (/B\b|BE/.test(spokenText)) {
        selectOption("B");
    } else if (/C\b|SEE|SEA/.test(spokenText)) {
        selectOption("C");
    } else if (/D\b|DE/.test(spokenText)) {
        selectOption("D");
    }
};

function selectOption(option) {
    const currentQuestion = document.querySelector(`input[name="q${currentQuestionIndex}"][value="${option}"]`);
    if (currentQuestion) {
        currentQuestion.checked = true;
        lastSelectedOption = { questionIndex: currentQuestionIndex, option: option }; // Store the last selected option
        console.log(`Selected option ${option} for question ${currentQuestionIndex}`); // Debug log
        provideFeedback(option); // Provide auditory feedback
    } else {
        console.log(`Option ${option} not found for question ${currentQuestionIndex}`); // Debug log
    }
}

function undoLastSelection() {
    if (lastSelectedOption) {
        const { questionIndex, option } = lastSelectedOption;
        const lastSelectedInput = document.querySelector(`input[name="q${questionIndex}"][value="${option}"]`);
        if (lastSelectedInput) {
            lastSelectedInput.checked = false;
            currentQuestionIndex = questionIndex; // Go back to the last question
            lastSelectedOption = null; // Clear the last selected option
            console.log(`Undid selection of option ${option} for question ${questionIndex}`); // Debug log
            readQuestion(currentQuestionIndex);
        }
    } else {
        console.log("No option to undo"); // Debug log
    }
}

function nextQuestion() {
    if (currentQuestionIndex < document.querySelectorAll('.question').length) {
        currentQuestionIndex++;
        readQuestion(currentQuestionIndex);
    } else {
        console.log("No more questions"); // Debug log
    }
}

// Use speech synthesis to read out the current question
function readQuestion(index) {
    const questionElement = document.getElementById(`question${index}`);
    const questionText = questionElement.querySelector('p').textContent;
    const options = questionElement.querySelectorAll('label');
    let speechText = questionText;
    options.forEach(option => {
        speechText += ' ' + option.textContent;
    });

    const utterance = new SpeechSynthesisUtterance(speechText);
    speechSynthesis.speak(utterance);
}

function provideFeedback(option) {
    const feedbackText = `Option ${option} is selected`;
    const utterance = new SpeechSynthesisUtterance(feedbackText);
    speechSynthesis.speak(utterance);
}

function submitQuiz() {
    let score = 0;

    // Correct answers
    const answers = {
        q1: 'A',
        q2: 'C'
    };

    // Loop through each question and check the answer
    for (const [question, correctAnswer] of Object.entries(answers)) {
        const selectedAnswer = document.querySelector(`input[name="${question}"]:checked`);
        if (selectedAnswer && selectedAnswer.value === correctAnswer) {
            score++;
        }
    }

    // Display the result
    const result = document.getElementById('result');
    result.textContent = `You scored ${score} out of ${Object.keys(answers).length}.`;

    // Provide feedback on submission
    const utterance = new SpeechSynthesisUtterance(result.textContent);
    speechSynthesis.speak(utterance);
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();
        } else {
            clearInterval(timerInterval);
            stopRecognition();
            submitQuiz();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timer').textContent = `Time left: ${formattedTime}`;
}

function announceTimeLeft() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`;
    const utterance = new SpeechSynthesisUtterance(`You have ${formattedTime} remaining`);
    speechSynthesis.speak(utterance);
}
s