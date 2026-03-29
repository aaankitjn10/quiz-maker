// ── STATE ──────────────────────────────────────────────
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let questionCount = 0;

// ── SCREEN NAVIGATION ──────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ── CREATE QUIZ ────────────────────────────────────────
function addQuestion() {
  questionCount++;
  const idx = questionCount;
  const list = document.getElementById('questions-list');

  const block = document.createElement('div');
  block.className = 'question-block';
  block.id = `q-block-${idx}`;

  block.innerHTML = `
    <div class="question-block-header">
      <span class="q-label">Question ${list.children.length + 1}</span>
      <button class="remove-q-btn" onclick="removeQuestion('q-block-${idx}')">×</button>
    </div>
    <div class="field-group">
      <input type="text" id="q-text-${idx}" placeholder="Type your question here…" maxlength="200"/>
    </div>
    <p class="options-hint">Fill in 4 options, then select the correct answer with the radio button.</p>
    <div class="options-list">
      ${['A','B','C','D'].map((letter, i) => `
        <div class="option-row">
          <input type="radio" name="correct-${idx}" value="${i}" id="radio-${idx}-${i}" />
          <input type="text" id="opt-${idx}-${i}" placeholder="Option ${letter}" maxlength="120"/>
          <label class="correct-label" for="radio-${idx}-${i}">Correct</label>
        </div>
      `).join('')}
    </div>
  `;

  list.appendChild(block);
  block.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  document.getElementById(`q-text-${idx}`).focus();

  renumberQuestions();
}

function removeQuestion(blockId) {
  const block = document.getElementById(blockId);
  if (block) block.remove();
  renumberQuestions();
}

function renumberQuestions() {
  const blocks = document.querySelectorAll('.question-block');
  blocks.forEach((block, i) => {
    const label = block.querySelector('.q-label');
    if (label) label.textContent = `Question ${i + 1}`;
  });
}

function generateQuiz() {
  const title = document.getElementById('quiz-title').value.trim();
  if (!title) {
    alert('Please add a quiz title.');
    document.getElementById('quiz-title').focus();
    return;
  }

  const blocks = document.querySelectorAll('.question-block');
  if (blocks.length === 0) {
    alert('Please add at least one question.');
    return;
  }

  const questions = [];
  let valid = true;

  blocks.forEach((block, i) => {
    const blockId = block.id.replace('q-block-', '');
    const qText = document.getElementById(`q-text-${blockId}`)?.value.trim();
    if (!qText) { alert(`Question ${i + 1} needs a question text.`); valid = false; return; }

    const opts = ['A','B','C','D'].map((_, j) => document.getElementById(`opt-${blockId}-${j}`)?.value.trim() || '');
    if (opts.some(o => !o)) { alert(`Question ${i + 1} needs all 4 options filled in.`); valid = false; return; }

    const selected = document.querySelector(`input[name="correct-${blockId}"]:checked`);
    if (!selected) { alert(`Question ${i + 1} needs a correct answer selected.`); valid = false; return; }

    questions.push({ q: qText, opts, correct: parseInt(selected.value) });
  });

  if (!valid) return;

  const quiz = { title, questions };
  const encoded = btoa(encodeURIComponent(JSON.stringify(quiz)));
  const url = `${window.location.origin}${window.location.pathname}?quiz=${encoded}`;

  document.getElementById('share-url').textContent = url;
  currentQuiz = quiz;
  showScreen('screen-share');
}

// ── SHARE ──────────────────────────────────────────────
function copyLink() {
  const url = document.getElementById('share-url').textContent;
  navigator.clipboard.writeText(url).then(() => {
    const toast = document.getElementById('copy-toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  });
}

function previewQuiz() {
  startQuiz(currentQuiz);
}

function resetAll() {
  document.getElementById('quiz-title').value = '';
  document.getElementById('questions-list').innerHTML = '';
  questionCount = 0;
  showScreen('screen-create');
}

// ── TAKE QUIZ ──────────────────────────────────────────
function loadFromLink() {
  const input = document.getElementById('take-link-input').value.trim();
  let quizData = null;

  try {
    // Accept a full URL or just the encoded string
    let encoded = input;
    if (input.includes('?quiz=')) {
      encoded = input.split('?quiz=')[1];
    }
    const decoded = decodeURIComponent(atob(encoded));
    quizData = JSON.parse(decoded);
  } catch (e) {
    alert('That doesn\'t look like a valid quiz link. Try pasting the full URL.');
    return;
  }

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    alert('Invalid quiz data.');
    return;
  }

  startQuiz(quizData);
}

function startQuiz(quiz) {
  currentQuiz = quiz;
  currentQuestionIndex = 0;
  userAnswers = [];

  document.getElementById('take-title').textContent = quiz.title;
  showScreen('screen-take');
  renderQuestion();
}

function renderQuestion() {
  const quiz = currentQuiz;
  const idx = currentQuestionIndex;
  const q = quiz.questions[idx];
  const total = quiz.questions.length;

  // Progress
  document.getElementById('progress-fill').style.width = `${((idx) / total) * 100}%`;
  document.getElementById('progress-label').textContent = `${idx + 1} / ${total}`;

  // Question
  document.getElementById('q-number').textContent = `Question ${idx + 1}`;
  document.getElementById('q-text').textContent = q.q;

  // Options
  const grid = document.getElementById('options-grid');
  grid.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];

  q.opts.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<span class="option-letter">${letters[i]}</span> ${opt}`;
    btn.onclick = () => selectAnswer(i);
    grid.appendChild(btn);
  });

  // Hide next button until answer selected
  document.getElementById('next-btn').style.display = 'none';

  // Animate card
  const card = document.getElementById('question-card');
  card.style.animation = 'none';
  requestAnimationFrame(() => {
    card.style.animation = 'fadeUp 0.3s ease both';
  });
}

function selectAnswer(selectedIdx) {
  const q = currentQuiz.questions[currentQuestionIndex];
  const btns = document.querySelectorAll('.option-btn');

  userAnswers.push(selectedIdx);

  // Disable all buttons
  btns.forEach(btn => btn.disabled = true);

  // Show correct / wrong
  btns.forEach((btn, i) => {
    if (i === q.correct) {
      btn.classList.add('correct');
    } else if (i === selectedIdx && selectedIdx !== q.correct) {
      btn.classList.add('wrong');
    }
  });

  // Show next button
  const nextBtn = document.getElementById('next-btn');
  const isLast = currentQuestionIndex === currentQuiz.questions.length - 1;
  nextBtn.textContent = isLast ? 'See results →' : 'Next →';
  nextBtn.style.display = 'block';
}

function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex >= currentQuiz.questions.length) {
    showResults();
  } else {
    renderQuestion();
  }
}

// ── RESULTS ────────────────────────────────────────────
function showResults() {
  const quiz = currentQuiz;
  const total = quiz.questions.length;
  let score = 0;

  quiz.questions.forEach((q, i) => {
    if (userAnswers[i] === q.correct) score++;
  });

  const pct = Math.round((score / total) * 100);

  document.getElementById('score-num').textContent = score;
  document.getElementById('score-denom').textContent = `out of ${total}`;

  // Title & message
  let title, msg;
  if (pct === 100) { title = 'Perfect score!'; msg = 'You aced it. Share this quiz and see if your friends can do the same.'; }
  else if (pct >= 70) { title = 'Great job!'; msg = 'Solid performance. Review the ones you missed below.'; }
  else if (pct >= 40) { title = 'Not bad!'; msg = 'You got some right! Try again and see if you can beat your score.'; }
  else { title = 'Tough quiz!'; msg = 'Don\'t worry — try again and see how much you improve!'; }

  document.getElementById('results-title').textContent = title;
  document.getElementById('results-msg').textContent = msg;

  // Breakdown
  const breakdown = document.getElementById('results-breakdown');
  breakdown.innerHTML = '';
  const letters = ['A','B','C','D'];

  quiz.questions.forEach((q, i) => {
    const correct = userAnswers[i] === q.correct;
    const item = document.createElement('div');
    item.className = 'breakdown-item';
    item.innerHTML = `
      <div class="breakdown-icon">${correct ? '✓' : '✗'}</div>
      <div>
        <div class="breakdown-q">${q.q}</div>
        <div class="breakdown-a">Your answer: ${letters[userAnswers[i]]} — ${q.opts[userAnswers[i]]}</div>
        ${!correct ? `<div class="breakdown-correct">Correct: ${letters[q.correct]} — ${q.opts[q.correct]}</div>` : ''}
      </div>
    `;
    breakdown.appendChild(item);
  });

  // Progress bar to full
  document.getElementById('progress-fill').style.width = '100%';
  document.getElementById('progress-label').textContent = `${total} / ${total}`;

  showScreen('screen-results');
}

function retakeQuiz() {
  startQuiz(currentQuiz);
}

// ── AUTO-LOAD FROM URL ─────────────────────────────────
(function init() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('quiz');

  if (encoded) {
    try {
      const decoded = decodeURIComponent(atob(encoded));
      const quiz = JSON.parse(decoded);
      if (quiz && quiz.questions && quiz.questions.length > 0) {
        startQuiz(quiz);
        return;
      }
    } catch (e) {
      console.warn('Could not parse quiz from URL:', e);
    }
  }

  // If no valid quiz in URL, show home
  showScreen('screen-home');

  // Add a default first question to get started
  // (don't auto-add — let user click Create)
})();