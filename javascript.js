const questions = [
  {
    q: "Which method converts a JSON string into a JS object?",
    options: ["JSON.stringify()", "JSON.parse()", "JSON.convert()", "Object.fromJSON()"],
    answer: 1
  },
  {
    q: "Which keyword declares a block-scoped variable?",
    options: ["var", "let", "global", "define"],
    answer: 1
  },
  {
    q: "What does DOM stand for?",
    options: ["Document Object Model", "Data Object Model", "Display Output Module", "Document Order Map"],
    answer: 0
  },
  {
    q: "Which function delays code execution once, after N milliseconds?",
    options: ["setInterval()", "setTimeout()", "delay()", "wait()"],
    answer: 1
  },
  {
    q: "What does 'await' do inside an async function?",
    options: [
      "Pauses execution until the Promise settles",
      "Runs code in a new thread",
      "Cancels the Promise",
      "Converts a callback to a variable"
    ],
    answer: 0
  }
];

let currentIndex = 0;
let score = 0;
let timeLeft = 15;
let timerId = null;
let currentCorrectIndex = 0;
let shuffledQuestions = [];
let currentQuestionAnswered = false;
let lastSelectedIndex = null;
let resumeTimerValue = null;
const PROGRESS_KEY = "quizProgress";

const quizScreen      = document.getElementById("quiz-screen");
const resultScreen    = document.getElementById("result-screen");
const questionText    = document.getElementById("question-text");
const optionsContainer= document.getElementById("options-container");
const progressEl      = document.getElementById("progress");
const timerEl         = document.getElementById("timer");
const scoreEl         = document.getElementById("score");
const nextBtn         = document.getElementById("next-btn");
const restartBtn      = document.getElementById("restart-btn");
const startBtn        = document.getElementById("start-btn");
const resumeBtn       = document.getElementById("resume-btn");
const pauseBtn        = document.getElementById("pause-btn");
const titleRow        = document.getElementById("title-row");
const status          = document.getElementById("status");
const syllabus        = document.getElementById("Instructions");

nextBtn.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    nextBtn.click();
  }
});

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function shuffleQuestions(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function clearTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function getSavedProgress() {
  try {
    return localStorage.getItem(PROGRESS_KEY);
  } catch (error) {
    console.warn("Quiz progress could not be read:", error);
    return null;
  }
}

function saveQuizProgress() {
  try {
    const progress = {
      currentIndex,
      score,
      timeLeft,
      shuffledQuestions,
      currentCorrectIndex,
      currentQuestionAnswered,
      lastSelectedIndex
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.warn("Quiz progress could not be saved:", error);
  }
}

function clearSavedProgress() {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch (error) {
    console.warn("Quiz progress could not be cleared:", error);
  }
}

function hasSavedProgress() {
  const saved = getSavedProgress();
  if (!saved) return false;

  try {
    const parsed = JSON.parse(saved);
    return parsed && parsed.currentIndex < questions.length;
  } catch (error) {
    return false;
  }
}

function showLandingPage() {
  clearTimer();
  quizScreen.style.display = "none";
  resultScreen.style.display = "none";
  startBtn.style.display = "block";
  resumeBtn.style.display = hasSavedProgress() ? "block" : "none";
  pauseBtn.style.display = "none";
  titleRow.style.display = "none";
  syllabus.style.display = "block";
}

function showQuizPage() {
  quizScreen.style.display = "block";
  resultScreen.style.display = "none";
  startBtn.style.display = "none";
  resumeBtn.style.display = "none";
  pauseBtn.style.display = "inline-flex";
  titleRow.style.display = "flex";
  syllabus.style.display = "none";
}

function showResultPage() {
  clearTimer();
  quizScreen.style.display = "none";
  resultScreen.style.display = "block";
  startBtn.style.display = "none";
  pauseBtn.style.display = "none";
  titleRow.style.display = "none";
  resumeBtn.style.display = "none";
  syllabus.style.display = "none";
}

function startQuiz(isResume = false) {
  clearTimer();

  if (!isResume) {
    currentIndex = 0;
    score = 0;
    timeLeft = 15;
    currentQuestionAnswered = false;
    lastSelectedIndex = null;
    resumeTimerValue = null;
    shuffledQuestions = shuffleQuestions(questions);
    clearSavedProgress();
  } else {
    const saved = getSavedProgress();
    if (saved) {
      try {
        const progress = JSON.parse(saved);
        currentIndex = progress.currentIndex ?? 0;
        score = progress.score ?? 0;
        timeLeft = progress.timeLeft ?? 15;
        shuffledQuestions = progress.shuffledQuestions ?? shuffleQuestions(questions);
        currentCorrectIndex = progress.currentCorrectIndex ?? 0;
        currentQuestionAnswered = progress.currentQuestionAnswered ?? false;
        lastSelectedIndex = progress.lastSelectedIndex ?? null;
        resumeTimerValue = progress.timeLeft ?? 15;
      } catch (error) {
        currentIndex = 0;
        score = 0;
        timeLeft = 15;
        currentQuestionAnswered = false;
        lastSelectedIndex = null;
        resumeTimerValue = null;
        shuffledQuestions = shuffleQuestions(questions);
      }
    }
  }

  showQuizPage();
  renderQuestion();
  saveQuizProgress();
}

function resumeQuiz() {
  startQuiz(true);
}

function renderQuestion() {
  const current = shuffledQuestions[currentIndex];
  if (!current) {
    finishQuiz();
    return;
  }

  const shuffledOptions = shuffleArray(current.options);
  const correctOptionText = current.options[current.answer];
  currentCorrectIndex = shuffledOptions.indexOf(correctOptionText);

  progressEl.textContent = `Question ${currentIndex + 1} of ${questions.length}`;
  questionText.textContent = current.q;
  status.textContent = "New question loaded";
  scoreEl.textContent = score;
  nextBtn.disabled = !currentQuestionAnswered;

  optionsContainer.innerHTML = "";

  shuffledOptions.forEach((optionText, i) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = optionText;
    btn.setAttribute("role", "option");
    btn.setAttribute("tabindex", "0");

    btn.addEventListener("click", () => handleAnswer(i, btn));
    btn.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleAnswer(i, btn);
      }
    });

    if (currentQuestionAnswered) {
      btn.disabled = true;
      if (i === currentCorrectIndex) {
        btn.classList.add("correct");
      } else if (i === lastSelectedIndex && i !== currentCorrectIndex) {
        btn.classList.add("wrong");
      }
    }

    optionsContainer.appendChild(btn);
  });

  const optionButtons = Array.from(document.querySelectorAll(".option"));
  let focusedIndex = 0;

  optionButtons.forEach((btn, index) => {
    btn.addEventListener("focus", () => {
      focusedIndex = index;
    });
  });

  optionsContainer.onkeydown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusedIndex = (focusedIndex + 1) % optionButtons.length;
      optionButtons[focusedIndex].focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusedIndex = (focusedIndex - 1 + optionButtons.length) % optionButtons.length;
      optionButtons[focusedIndex].focus();
    }
  };

  if (optionButtons.length > 0) {
    window.requestAnimationFrame(() => optionButtons[0].focus());
  }

  startTimer(resumeTimerValue ?? 15);
  resumeTimerValue = null;
}

function startTimer(startValue = 15) {
  clearTimer();
  timeLeft = startValue;
  timerEl.textContent = `⏳ ${timeLeft}`;

  timerId = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `⏳ ${timeLeft}`;
    saveQuizProgress();

    if (timeLeft <= 0) {
      clearTimer();
      lockAnswers();
      nextBtn.disabled = false;
      nextBtn.focus();
      saveQuizProgress();
    }
  }, 1000);
}

function handleAnswer(selectedIndex, btnEl) {
  clearTimer();
  currentQuestionAnswered = true;
  lastSelectedIndex = selectedIndex;

  const buttons = document.querySelectorAll(".option");
  buttons.forEach((b, i) => {
    b.disabled = true;
    if (i === currentCorrectIndex) b.classList.add("correct");
  });

  if (selectedIndex === currentCorrectIndex) {
    score++;
    scoreEl.textContent = score;
  } else {
    btnEl.classList.add("wrong");
  }

  nextBtn.disabled = false;
  nextBtn.focus();
  saveQuizProgress();
}

function lockAnswers() {
  currentQuestionAnswered = true;
  const buttons = document.querySelectorAll(".option");
  buttons.forEach((b, i) => {
    b.disabled = true;
    if (i === currentCorrectIndex) b.classList.add("correct");
  });
  nextBtn.disabled = false;
  saveQuizProgress();
}

nextBtn.addEventListener("click", () => {
  if (!currentQuestionAnswered) return;

  currentIndex++;
  currentQuestionAnswered = false;
  lastSelectedIndex = null;

  if (currentIndex < shuffledQuestions.length) {
    renderQuestion();
  } else {
    finishQuiz();
  }

  saveQuizProgress();
});

function finishQuiz() {
  clearTimer();
  currentQuestionAnswered = false;
  lastSelectedIndex = null;
  clearSavedProgress();
  showResultPage();

  document.getElementById("final-score").textContent = score;
  document.getElementById("total-questions").textContent = questions.length;

  let highScore = 0;
  try {
    const storedHigh = localStorage.getItem("quizHighScore");
    highScore = storedHigh ? parseInt(storedHigh, 10) : 0;
  } catch (error) {
    console.warn("High score could not be read:", error);
  }

  if (score > highScore) {
    try {
      localStorage.setItem("quizHighScore", score);
      document.getElementById("high-score").textContent = score;
    } catch (error) {
      console.warn("High score could not be saved:", error);
      document.getElementById("high-score").textContent = highScore;
    }
  } else {
    document.getElementById("high-score").textContent = highScore;
  }
}

restartBtn.addEventListener("click", () => {
  startQuiz();
});

startBtn.addEventListener("click", () => {
  startQuiz();
});

resumeBtn.addEventListener("click", () => {
  resumeQuiz();
});

pauseBtn.addEventListener("click", () => {
  saveQuizProgress();
  showLandingPage();
});

showLandingPage();