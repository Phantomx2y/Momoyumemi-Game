// ─────────────────────────────────────────────────────────────────────────────
// ui.js  –  Login screen, character/theme pickers, screen transitions,
//           event wiring, and the survival timer HUD element.
// Depends on: game.js (for state vars), leaderboard.js, supabase.js
// ─────────────────────────────────────────────────────────────────────────────

/** Switch between named screens: 'login' | 'game' | 'os' | 'ls' */
function showSc(id) {
  document.getElementById('login-wrap').style.display = id === 'login' ? 'flex' : 'none';
  document.getElementById('os').style.display         = id === 'os'    ? 'flex' : 'none';
  document.getElementById('ls').style.display         = id === 'ls'    ? 'flex' : 'none';
  document.getElementById('ui').style.display         = id === 'game'  ? 'block': 'none';
}

/** Populate the character selection grid with NFT thumbnails. */
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
    card.addEventListener('click', () => { selChar = i; buildCGrid(); });
    g.appendChild(card);
  });
}

/** Populate the theme selection grid with colour-gradient thumbnails. */
function buildTGrid() {
  const g = document.getElementById('tgrid');
  g.innerHTML = '';
  THEMES.forEach((t, i) => {
    const card = document.createElement('div');
    card.className = 'tcard' + (i === selTheme ? ' sel' : '');

    const thumb = document.createElement('div');
    thumb.className  = 'tthumb';
    thumb.style.background = `linear-gradient(160deg,${t.sky[0]},${t.sky[1]},${t.sky[2]})`;
    thumb.innerHTML  = `<span>${t.emoji}</span>`;

    const lbl = document.createElement('div');
    lbl.className   = 'tlbl';
    lbl.textContent = t.label;

    card.appendChild(thumb);
    card.appendChild(lbl);
    card.addEventListener('click', () => { selTheme = i; buildTGrid(); });
    g.appendChild(card);
  });
}

/** Start a new game run. */
async function startGame() {
  playerName  = document.getElementById('ni').value.trim() || 'dreamer';
  score       = 0;
  peachCount  = 0;
  peachProg   = 0;
  hasShield   = false;
  shieldTimer = 0;
  stage       = 0;
  F           = 0;
  clearObsTimer = 0;
  charY       = H / 2;
  charVY      = 0;
  charFlash   = 0;
  walls       = [];
  peachItems  = [];
  parts       = [];
  wTimer      = 55;   // spawn first wall quickly
  patIdx      = 0;
  curPat      = [];
  survStart   = Date.now();

  document.getElementById('sv').textContent    = '0';
  document.getElementById('pname').textContent = playerName.toUpperCase();
  document.getElementById('thname').textContent = THEMES[selTheme].label;
  document.getElementById('fov').style.opacity = '0';
  updShield();
  showSc('game');

  gameOn = true;
  requestAnimationFrame(loop);
}

/** Called when the player dies. Saves scores and shows the game-over screen. */
async function endGame() {
  gameOn = false;
  const local = await saveLoc(playerName, score);
  await saveLB(playerName, score);

  const T = THEMES[selTheme];
  document.getElementById('os-k').textContent  = T.okk;
  document.getElementById('os-t').textContent  = T.ott;
  document.getElementById('os-s').textContent  = T.os2;
  document.getElementById('os-sc').textContent =
    'score · ' + score + ' pts  (' + peachCount + ' 🍑)';
  document.getElementById('os-b').textContent  =
    'personal best · ' + (local ? local.best : score) + ' pts';

  showSc('os');
}

/** Fetch top-10 from Supabase and render the leaderboard screen. */
async function showLB(from) {
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

  document.getElementById('backb').onclick = () => showSc(from);
  showSc('ls');
}

// ── Event wiring ──────────────────────────────────────────────────────────────

document.getElementById('ni').addEventListener('input', async function () {
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

document.getElementById('pb').addEventListener('click',  startGame);
document.getElementById('lbb').addEventListener('click', () => showLB('login'));
document.getElementById('rb').addEventListener('click',  startGame);
document.getElementById('lbb2').addEventListener('click',() => showLB('os'));
document.getElementById('swb').addEventListener('click', () => {
  playerName = '';
  showSc('login');
  document.getElementById('ni').value        = '';
  document.getElementById('savlbl').textContent = '';
});

// Flap input
document.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    flap();
  }
});
document.addEventListener('touchstart', e => {
  const t = e.target;
  if (t.tagName === 'BUTTON' || t.tagName === 'INPUT' ||
      t.classList.contains('ccard') || t.classList.contains('tcard')) return;
  if (!gameOn) return;
  e.preventDefault();
  flap();
}, { passive: false });
document.addEventListener('mousedown', e => {
  const t = e.target;
  if (t.tagName === 'BUTTON' || t.tagName === 'INPUT' ||
      t.classList.contains('ccard') || t.classList.contains('tcard')) return;
  flap();
});

// ── Initialise ────────────────────────────────────────────────────────────────
buildCGrid();
buildTGrid();
showSc('login');
