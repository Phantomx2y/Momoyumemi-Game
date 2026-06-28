// ─────────────────────────────────────────────────────────────────────────────
// ui.js  –  Login screen, character/theme pickers, screen transitions,
//           event wiring, mute toggle, and game-over display.
// Depends on: game.js, leaderboard.js, supabase.js, audio.js
// ─────────────────────────────────────────────────────────────────────────────

// ── Screen management ─────────────────────────────────────────────────────────
// Use a flag to prevent the brief flash when switching screens.
let _screenLocked = false;

function showSc(id) {
  document.getElementById('login-wrap').style.display = id === 'login' ? 'flex'  : 'none';
  document.getElementById('os').style.display         = id === 'os'    ? 'flex'  : 'none';
  document.getElementById('ls').style.display         = id === 'ls'    ? 'flex'  : 'none';
  document.getElementById('ui').style.display         = id === 'game'  ? 'block' : 'none';
}

// ── Name validation → enable / disable Play button ───────────────────────────
function _validateName() {
  const val  = document.getElementById('ni').value.trim();
  const btn  = document.getElementById('pb');
  const valid = val.length >= 1;
  btn.disabled = !valid;
  btn.style.opacity  = valid ? '1'    : '0.45';
  btn.style.cursor   = valid ? 'pointer' : 'not-allowed';
}

// ── Character grid ────────────────────────────────────────────────────────────
function buildCGrid() {
  const g = document.getElementById('cgrid');
  g.innerHTML = '';
  CNAMES.forEach((name, i) => {
    const card = document.createElement('div');
    card.className = 'ccard' + (i === selChar ? ' sel' : '');

    const img = document.createElement('img');
    img.src       = IMG_DATA[i];
    img.className = 'ctimg';
    img.draggable = false;

    const nm = document.createElement('div');
    nm.className   = 'cnm';
    nm.textContent = name;

    card.appendChild(img);
    card.appendChild(nm);
    card.addEventListener('click', () => {
      playBtnSfx();
      selChar = i;
      buildCGrid();
    });
    g.appendChild(card);
  });
}

// ── Theme grid ────────────────────────────────────────────────────────────────
function buildTGrid() {
  const g = document.getElementById('tgrid');
  g.innerHTML = '';
  THEMES.forEach((t, i) => {
    const card = document.createElement('div');
    card.className = 'tcard' + (i === selTheme ? ' sel' : '');

    const thumb = document.createElement('div');
    thumb.className        = 'tthumb';
    thumb.style.background = `linear-gradient(160deg,${t.sky[0]},${t.sky[1]},${t.sky[2]})`;
    thumb.innerHTML        = `<span>${t.emoji}</span>`;

    const lbl = document.createElement('div');
    lbl.className   = 'tlbl';
    lbl.textContent = t.label;

    card.appendChild(thumb);
    card.appendChild(lbl);
    card.addEventListener('click', () => {
      playBtnSfx();
      selTheme = i;
      buildTGrid();
    });
    g.appendChild(card);
  });
}

// ── Start game ────────────────────────────────────────────────────────────────
async function startGame() {
  const nameVal = document.getElementById('ni').value.trim();
  if (!nameVal) return;                // guard: name required

  playBtnSfx();

  // Cancel every pending timeout, interval, and the running RAF loop
  // before touching any state — this is the primary restart fix.
  _clearAll();
  runId++;

  playerName    = nameVal;
  score         = 0;
  peachCount    = 0;
  peachProg     = 0;
  hasShield     = false;
  shieldTimer   = 0;
  stage         = 0;
  F             = 0;
  clearObsTimer = 0;
  shieldWarning = false;
  charY         = H / 2;
  charVY        = 0;
  charFlash     = 0;
  walls         = [];
  peachItems    = [];
  parts         = [];
  wTimer        = 55;
  patIdx        = 0;
  curPat        = [];
  survStart     = Date.now();

  document.getElementById('sv').textContent     = '0';
  document.getElementById('pname').textContent  = playerName.toUpperCase();
  document.getElementById('thname').textContent = THEMES[selTheme].label;
  document.getElementById('fov').style.opacity  = '0';
  updShield();

  showSc('game');
  startBGM();

  gameOn = true;
  _rafId = requestAnimationFrame(loop);
}

// ── End game ──────────────────────────────────────────────────────────────────
async function endGame() {
  // Snapshot the runId at the moment of death.
  // If startGame() fires before our awaits complete, runId will have
  // incremented and we bail — never overwriting the new game's screen.
  const myRunId = runId;

  gameOn = false;
  stopBGM();

  // Snapshot score/time NOW before state is reset by a possible restart.
  const snapScore  = score;
  const snapPeach  = peachCount;
  const snapName   = playerName;
  const snapSurvMs = Date.now() - survStart;
  const snapTheme  = THEMES[selTheme];

  // These network calls may take time — a new game could start while waiting.
  const local = await saveLoc(snapName, snapScore);
  await saveLB(snapName, snapScore);

  // If the player already restarted, do nothing — don't touch the screen.
  if (runId !== myRunId) return;

  // Player name (primary heading)
  document.getElementById('os-player').textContent = snapName.toUpperCase();

  // Score
  document.getElementById('os-sc').textContent =
    'score · ' + snapScore + ' pts  (' + snapPeach + ' 🍑)';
  document.getElementById('os-b').textContent =
    'personal best · ' + (local ? local.best : snapScore) + ' pts';

  // Theme label (small corner tag)
  document.getElementById('os-theme-tag').textContent = snapTheme.label;

  // Survival time
  const secs = Math.floor(snapSurvMs / 1000);
  const mm   = Math.floor(secs / 60), ss = secs % 60;
  document.getElementById('os-time').textContent =
    'survived · ' + mm + ':' + (ss < 10 ? '0' : '') + ss;

  showSc('os');
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
async function showLB(from) {
  playBtnSfx();

  const lb  = await getLB();
  const tbl = document.getElementById('lbt');
  tbl.innerHTML = '';

  if (!lb.length) {
    tbl.innerHTML =
      '<div class="lbr" style="color:#b060a0;font-size:9px;">no scores yet!</div>';
  } else {
    lb.forEach((e, i) => {
      const isYou = e.name.toLowerCase() === playerName.toLowerCase();
      const row   = document.createElement('div');
      row.className = 'lbr' + (isYou ? ' lbyou' : '');
      row.innerHTML =
        `<span class="lbrank">#${i + 1}</span>` +
        `<span class="lbname">${e.name}${isYou ? ' ✦' : ''}</span>` +
        `<span class="lbsc">${e.best}</span>`;
      tbl.appendChild(row);
    });
  }

  document.getElementById('backb').onclick = () => { playBtnSfx(); showSc(from); };
  showSc('ls');
}

// ── Mute toggle ───────────────────────────────────────────────────────────────
function _updateMuteBtn() {
  const btn = document.getElementById('mute-btn');
  if (btn) btn.textContent = isMuted() ? '🔇' : '🔊';
}

document.getElementById('mute-btn').addEventListener('click', () => {
  toggleMute();
  _updateMuteBtn();
});

// ── Event wiring ──────────────────────────────────────────────────────────────
document.getElementById('ni').addEventListener('input', async function () {
  _validateName();
  const n = this.value.trim();
  if (n.length > 1) {
    const d = await loadLoc(n);
    document.getElementById('savlbl').textContent =
      d ? 'welcome back · best: ' + d.best + ' pts' : '';
  } else {
    document.getElementById('savlbl').textContent = '';
  }
});

document.getElementById('ni').addEventListener('keydown', e => {
  if (e.key === 'Enter') startGame();
});

document.getElementById('pb').addEventListener('click', startGame);

document.getElementById('lbb').addEventListener('click', () => showLB('login'));

document.getElementById('rb').addEventListener('click', () => {
  startGame();
});

document.getElementById('lbb2').addEventListener('click', () => showLB('os'));

document.getElementById('swb').addEventListener('click', () => {
  playBtnSfx();
  stopBGM();
  playerName = '';
  showSc('login');
  document.getElementById('ni').value          = '';
  document.getElementById('savlbl').textContent = '';
  _validateName();
});

// Flap / jump input
document.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    flap();
  }
});
document.addEventListener('touchstart', e => {
  const t = e.target;
  if (t.tagName === 'BUTTON' || t.tagName === 'INPUT' ||
      t.classList.contains('ccard') || t.classList.contains('tcard') ||
      t.id === 'mute-btn') return;
  if (!gameOn) return;
  e.preventDefault();
  flap();
}, { passive: false });
document.addEventListener('mousedown', e => {
  const t = e.target;
  if (t.tagName === 'BUTTON' || t.tagName === 'INPUT' ||
      t.classList.contains('ccard') || t.classList.contains('tcard') ||
      t.id === 'mute-btn') return;
  flap();
});

// ── Initialise ────────────────────────────────────────────────────────────────
buildCGrid();
buildTGrid();
_validateName();          // start with Play disabled
showSc('login');
