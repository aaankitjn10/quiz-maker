// ── STATE ──────────────────────────────────────────────
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let questionCount = 0;

// ── SCREEN NAVIGATION ──────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  el.classList.add('active');
  window.scrollTo(0, 0);
}

// ── WEATHER ────────────────────────────────────────────
function showWeather() {
  showScreen('screen-weather');
  loadWeather();
}

function loadWeather() {
  document.getElementById('weather-loading').style.display = 'flex';
  document.getElementById('weather-content').style.display = 'none';
  document.getElementById('weather-error').style.display = 'none';

  if (!navigator.geolocation) {
    showWeatherError('Your browser does not support location access.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
    err => showWeatherError('Location access denied. Please allow location in your browser and try again.')
  );
}

async function fetchWeather(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&wind_speed_unit=kmh`;
    const res = await fetch(url);
    const data = await res.json();

    const geoUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || 'Your location';
    const country = geoData.address?.country_code?.toUpperCase() || '';

    renderWeather(data.current, city, country);
  } catch (e) {
    showWeatherError('Could not fetch weather data. Please check your connection and try again.');
  }
}

function getWeatherInfo(code) {
  const map = {
    0:  { label: 'Clear sky',        icon: '☀️',  grad: ['#FFB347','#FFD700'], bg: 'linear-gradient(160deg, #FFB347 0%, #FFD700 60%, #fff8e1 100%)' },
    1:  { label: 'Mainly clear',     icon: '🌤️', grad: ['#74b3f5','#a8d8f0'], bg: 'linear-gradient(160deg, #74b3f5 0%, #a8d8f0 60%, #e8f7ff 100%)' },
    2:  { label: 'Partly cloudy',    icon: '⛅',  grad: ['#74b3f5','#b0c8e8'], bg: 'linear-gradient(160deg, #6fa8d6 0%, #b0c8e8 60%, #daeaf8 100%)' },
    3:  { label: 'Overcast',         icon: '☁️',  grad: ['#8fa0b8','#b8c8d8'], bg: 'linear-gradient(160deg, #8fa0b8 0%, #b8c8d8 60%, #dde8f0 100%)' },
    45: { label: 'Foggy',            icon: '🌫️', grad: ['#9aa8b8','#c8d0d8'], bg: 'linear-gradient(160deg, #9aa8b8 0%, #c8d0d8 60%, #e0e8ee 100%)' },
    48: { label: 'Icy fog',          icon: '🌫️', grad: ['#9aa8b8','#c8d0d8'], bg: 'linear-gradient(160deg, #9aa8b8 0%, #c8d0d8 60%, #e0e8ee 100%)' },
    51: { label: 'Light drizzle',    icon: '🌦️', grad: ['#5b8fa8','#88b8d0'], bg: 'linear-gradient(160deg, #5b8fa8 0%, #88b8d0 60%, #c8e4f0 100%)' },
    61: { label: 'Light rain',       icon: '🌧️', grad: ['#4a7898','#7aa8c8'], bg: 'linear-gradient(160deg, #4a7898 0%, #7aa8c8 60%, #b8d8ee 100%)' },
    63: { label: 'Moderate rain',    icon: '🌧️', grad: ['#3a6888','#6a98b8'], bg: 'linear-gradient(160deg, #3a6888 0%, #6a98b8 60%, #a8c8e0 100%)' },
    65: { label: 'Heavy rain',       icon: '⛈️',  grad: ['#2a5878','#5a88a8'], bg: 'linear-gradient(160deg, #2a5878 0%, #5a88a8 60%, #98b8d0 100%)' },
    71: { label: 'Light snow',       icon: '🌨️', grad: ['#8ab0d0','#b8d8f0'], bg: 'linear-gradient(160deg, #8ab0d0 0%, #b8d8f0 60%, #e0f0ff 100%)' },
    80: { label: 'Rain showers',     icon: '🌦️', grad: ['#4a7898','#7aa8c8'], bg: 'linear-gradient(160deg, #4a7898 0%, #7aa8c8 60%, #b8d8ee 100%)' },
    95: { label: 'Thunderstorm',     icon: '⛈️',  grad: ['#2a3858','#4a6888'], bg: 'linear-gradient(160deg, #2a3858 0%, #4a6888 60%, #7898b8 100%)' },
    99: { label: 'Heavy thunderstorm', icon: '⛈️', grad: ['#1a2848','#3a5878'], bg: 'linear-gradient(160deg, #1a2848 0%, #3a5878 60%, #6888a8 100%)' },
  };
  // Find closest match
  const codes = Object.keys(map).map(Number).sort((a,b) => a-b);
  let best = codes[0];
  for (const c of codes) { if (c <= code) best = c; }
  return map[best] || map[0];
}

function getFunFact(code, temp) {
  if (code === 0) return `Clear skies like this are perfect for stargazing tonight — no clouds to block the view!`;
  if (code <= 2) return `A mix of sun and clouds actually keeps temperatures more stable than pure sunshine.`;
  if (code <= 3) return `Overcast days are beloved by photographers — soft, even light with no harsh shadows.`;
  if (code <= 48) return `Fog forms when warm, moist air meets a cooler surface — nature's own cloud machine.`;
  if (code <= 67) return `Rain replenishes groundwater and keeps rivers flowing — every drop counts!`;
  if (code <= 77) return `Each snowflake is unique — the intricate patterns form based on humidity and temperature.`;
  if (code >= 95) return `Lightning can reach temperatures 5× hotter than the surface of the sun!`;
  if (temp > 35) return `Stay hydrated — at this temperature your body loses water faster than you notice.`;
  if (temp < 5) return `Cold air holds less moisture, which is why your skin feels drier in winter.`;
  return `Weather is just the atmosphere doing its thing — billions of water droplets in motion!`;
}

function renderWeather(current, city, country) {
  const temp = Math.round(current.temperature_2m);
  const feels = Math.round(current.apparent_temperature);
  const humidity = current.relative_humidity_2m;
  const wind = Math.round(current.wind_speed_10m);
  const code = current.weather_code;

  const info = getWeatherInfo(code);

  document.getElementById('w-location').textContent = `${city}${country ? ', ' + country : ''}`;
  document.getElementById('w-icon').textContent = info.icon;
  document.getElementById('w-temp').textContent = `${temp}°C`;
  document.getElementById('w-condition').textContent = info.label;
  document.getElementById('w-feels').textContent = `${feels}°C`;
  document.getElementById('w-humidity').textContent = `${humidity}%`;
  document.getElementById('w-wind').textContent = `${wind} km/h`;
  document.getElementById('w-funfact').textContent = getFunFact(code, temp);

  document.getElementById('weather-gradient').style.background = info.bg;

  document.getElementById('weather-loading').style.display = 'none';
  document.getElementById('weather-content').style.display = 'flex';
}

function showWeatherError(msg) {
  document.getElementById('weather-loading').style.display = 'none';
  document.getElementById('weather-content').style.display = 'none';
  document.getElementById('weather-error-msg').textContent = msg;
  document.getElementById('weather-error').style.display = 'flex';
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
      <button class="remove-q-btn" onclick="removeQuestion('q-block-${idx}')">✕</button>
    </div>
    <div class="field-group">
      <input type="text" id="q-text-${idx}" placeholder="Type your question here…" maxlength="200"/>
    </div>
    <p class="options-hint">Fill in all 4 options, then pick the correct one.</p>
    <div class="options-list">
      ${['A','B','C','D'].map((letter, i) => `
        <div class="option-row">
          <input type="radio" name="correct-${idx}" value="${i}" id="radio-${idx}-${i}" />
          <input type="text" id="opt-${idx}-${i}" placeholder="Option ${letter}" maxlength="120"/>
          <label class="correct-hint" for="radio-${idx}-${i}">Correct</label>
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
  document.getElementById(blockId)?.remove();
  renumberQuestions();
}

function renumberQuestions() {
  document.querySelectorAll('.question-block').forEach((block, i) => {
    const label = block.querySelector('.q-label');
    if (label) label.textContent = `Question ${i + 1}`;
  });
}

function generateQuiz() {
  const title = document.getElementById('quiz-title').value.trim();
  if (!title) { alert('Please add a quiz title.'); document.getElementById('quiz-title').focus(); return; }

  const blocks = document.querySelectorAll('.question-block');
  if (blocks.length === 0) { alert('Please add at least one question.'); return; }

  const questions = [];
  let valid = true;

  blocks.forEach((block, i) => {
    if (!valid) return;
    const blockId = block.id.replace('q-block-', '');
    const qText = document.getElementById(`q-text-${blockId}`)?.value.trim();
    if (!qText) { alert(`Question ${i + 1} needs question text.`); valid = false; return; }
    const opts = [0,1,2,3].map(j => document.getElementById(`opt-${blockId}-${j}`)?.value.trim() || '');
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
    setTimeout(() => toast.classList.remove('show'), 2200);
  });
}

function previewQuiz() { startQuiz(currentQuiz); }

function resetAll() {
  document.getElementById('quiz-title').value = '';
  document.getElementById('questions-list').innerHTML = '';
  questionCount = 0;
  showScreen('screen-create');
}

// ── TAKE QUIZ ──────────────────────────────────────────
function loadFromLink() {
  const input = document.getElementById('take-link-input').value.trim();
  if (!input) return;
  let quizData = null;
  try {
    let encoded = input.includes('?quiz=') ? input.split('?quiz=')[1] : input;
    quizData = JSON.parse(decodeURIComponent(atob(encoded)));
  } catch (e) {
    alert('That doesn\'t look like a valid quiz link. Paste the full URL.');
    return;
  }
  if (!quizData?.questions?.length) { alert('Invalid quiz data.'); return; }
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

  document.getElementById('progress-fill').style.width = `${(idx / total) * 100}%`;
  document.getElementById('progress-label').textContent = `${idx + 1} / ${total}`;
  document.getElementById('q-number').textContent = `Question ${idx + 1}`;
  document.getElementById('q-text').textContent = q.q;

  const grid = document.getElementById('options-grid');
  grid.innerHTML = '';
  const letters = ['A','B','C','D'];

  q.opts.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<span class="option-letter">${letters[i]}</span>${opt}`;
    btn.onclick = () => selectAnswer(i);
    grid.appendChild(btn);
  });

  document.getElementById('next-btn').style.display = 'none';

  const card = document.getElementById('question-card');
  card.style.animation = 'none';
  requestAnimationFrame(() => { card.style.animation = 'fadeUp 0.3s ease both'; });
}

function selectAnswer(selectedIdx) {
  const q = currentQuiz.questions[currentQuestionIndex];
  const btns = document.querySelectorAll('.option-btn');
  userAnswers.push(selectedIdx);
  btns.forEach(btn => btn.disabled = true);
  btns.forEach((btn, i) => {
    if (i === q.correct) btn.classList.add('correct');
    else if (i === selectedIdx) btn.classList.add('wrong');
  });
  const isLast = currentQuestionIndex === currentQuiz.questions.length - 1;
  const nextBtn = document.getElementById('next-btn');
  nextBtn.textContent = isLast ? 'See results →' : 'Next →';
  nextBtn.style.display = 'block';
}

function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex >= currentQuiz.questions.length) showResults();
  else renderQuestion();
}

// ── RESULTS ────────────────────────────────────────────
function showResults() {
  const quiz = currentQuiz;
  const total = quiz.questions.length;
  let score = 0;
  quiz.questions.forEach((q, i) => { if (userAnswers[i] === q.correct) score++; });
  const pct = Math.round((score / total) * 100);

  document.getElementById('score-num').textContent = score;
  document.getElementById('score-denom').textContent = `out of ${total}`;

  // Animate ring
  const circumference = 264;
  const offset = circumference - (pct / 100) * circumference;
  setTimeout(() => {
    const ring = document.getElementById('ring-fill');
    if (ring) ring.style.strokeDashoffset = offset;
  }, 200);

  // Color ring by score
  const ringEl = document.getElementById('ring-fill');
  if (ringEl) {
    if (pct === 100) ringEl.style.stroke = '#34c27a';
    else if (pct >= 60) ringEl.style.stroke = '#7c5cbf';
    else ringEl.style.stroke = '#ff7043';
  }

  let title, msg;
  if (pct === 100) { title = 'Perfect score! 🎉'; msg = 'You aced it — share this quiz and see if your friends can do the same!'; }
  else if (pct >= 70) { title = 'Great job! 👏'; msg = 'Solid score! Review the ones you missed below.'; }
  else if (pct >= 40) { title = 'Not bad! 🙂'; msg = 'You got some right. Try again and beat your score!'; }
  else { title = 'Tough quiz! 😅'; msg = "Don't worry — give it another shot and see how much you improve!"; }

  document.getElementById('results-title').textContent = title;
  document.getElementById('results-msg').textContent = msg;

  const breakdown = document.getElementById('results-breakdown');
  breakdown.innerHTML = '';
  const letters = ['A','B','C','D'];

  quiz.questions.forEach((q, i) => {
    const correct = userAnswers[i] === q.correct;
    const item = document.createElement('div');
    item.className = `breakdown-item ${correct ? 'correct-item' : 'wrong-item'}`;
    item.innerHTML = `
      <div class="b-icon">${correct ? '✅' : '❌'}</div>
      <div>
        <div class="b-q">${q.q}</div>
        <div class="b-a">Your answer: ${letters[userAnswers[i]]} — ${q.opts[userAnswers[i]]}</div>
        ${!correct ? `<div class="b-correct">Correct: ${letters[q.correct]} — ${q.opts[q.correct]}</div>` : ''}
      </div>
    `;
    breakdown.appendChild(item);
  });

  document.getElementById('progress-fill').style.width = '100%';
  document.getElementById('progress-label').textContent = `${total} / ${total}`;
  showScreen('screen-results');
}

function retakeQuiz() { startQuiz(currentQuiz); }

// ── AUTO-LOAD FROM URL ─────────────────────────────────
(function init() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('quiz');
  if (encoded) {
    try {
      const quiz = JSON.parse(decodeURIComponent(atob(encoded)));
      if (quiz?.questions?.length) { startQuiz(quiz); return; }
    } catch (e) { console.warn('Could not parse quiz from URL'); }
  }
  showScreen('screen-home');
})();