// ─────────────────────────────────────────────────────────────────────────────
// audio.js  –  Sound effects and background music
//
// All SFX are generated via the Web Audio API (no external files needed).
// To use real audio files instead, replace each generator with:
//   const sfxPeach = new Audio('./assets/audio/peach.mp3');
//   sfxPeach.preload = 'auto';
//   function playPeachSfx(){ sfxPeach.currentTime=0; sfxPeach.play(); }
//
// BGM: place a looping file at assets/audio/bgm.mp3 and flip useBGMFile=true.
// ─────────────────────────────────────────────────────────────────────────────

// ── AudioContext (shared, created lazily on first user gesture) ───────────────
let _ac = null;
function getAC() {
  if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
  if (_ac.state === 'suspended') _ac.resume();
  return _ac;
}

// ── Mute state ────────────────────────────────────────────────────────────────
let _muted = false;
let _masterGain = null;

function getMasterGain() {
  if (!_masterGain) {
    const ac = getAC();
    _masterGain = ac.createGain();
    _masterGain.gain.value = _muted ? 0 : 1;
    _masterGain.connect(ac.destination);
  }
  return _masterGain;
}

function toggleMute() {
  _muted = !_muted;
  if (_masterGain) _masterGain.gain.value = _muted ? 0 : 1;
  // Also mute/unmute BGM oscillator if running
  if (_bgmGain) _bgmGain.gain.value = _muted ? 0 : BGM_VOLUME;
  return _muted;
}

function isMuted() { return _muted; }

// ── Generic tone helper ───────────────────────────────────────────────────────
function _tone(freq, type, duration, gainVal, freqEnd) {
  try {
    const ac   = getAC();
    const g    = ac.createGain();
    const osc  = ac.createOscillator();
    g.gain.setValueAtTime(gainVal, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (freqEnd !== undefined)
      osc.frequency.exponentialRampToValueAtTime(freqEnd, ac.currentTime + duration);
    osc.connect(g);
    g.connect(getMasterGain());
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  } catch(e) {}
}

// ── SFX ───────────────────────────────────────────────────────────────────────

/** Short bright chirp – peach collected */
function playPeachSfx() {
  _tone(880, 'sine', 0.12, 0.35, 1200);
  setTimeout(() => _tone(1200, 'sine', 0.08, 0.2), 60);
}

/** Rising sparkle sweep – shield activated */
function playShieldSfx() {
  _tone(400,  'sine', 0.18, 0.3, 800);
  setTimeout(() => _tone(800,  'sine', 0.18, 0.25, 1400), 100);
  setTimeout(() => _tone(1400, 'sine', 0.14, 0.2,  2000), 200);
}

/** Descending tone – shield expires */
function playShieldExpireSfx() {
  _tone(600, 'triangle', 0.22, 0.3, 250);
}

/** Thud hit – shield absorbs a hit */
function playHitSfx() {
  _tone(180, 'sawtooth', 0.15, 0.4, 80);
}

/** Deep death sound */
function playDeathSfx() {
  _tone(280, 'sawtooth', 0.25, 0.45, 60);
  setTimeout(() => _tone(120, 'triangle', 0.3, 0.3, 40), 150);
}

/** Soft click – button tap */
function playBtnSfx() {
  _tone(660, 'sine', 0.07, 0.2, 700);
}

// ── Background music (procedural looping chiptune) ───────────────────────────
let _bgmNodes   = [];
let _bgmGain    = null;
let _bgmRunning = false;
const BGM_VOLUME = 0.08;

// Simple repeating melody pattern (MIDI note numbers → Hz)
const BGM_NOTES = [60,64,67,72, 67,64,60,62, 64,67,71,76, 71,67,64,60].map(
  n => 440 * Math.pow(2, (n - 69) / 12)
);
let _bgmStep = 0;
let _bgmTimeout = null;

function _bgmTick() {
  if (!_bgmRunning) return;
  const freq = BGM_NOTES[_bgmStep % BGM_NOTES.length];
  _bgmStep++;
  try {
    const ac  = getAC();
    const g   = ac.createGain();
    const osc = ac.createOscillator();
    g.gain.setValueAtTime(BGM_VOLUME, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.22);
    osc.type = 'square';
    osc.frequency.value = freq;
    if (!_bgmGain) {
      _bgmGain = ac.createGain();
      _bgmGain.gain.value = _muted ? 0 : BGM_VOLUME;
      _bgmGain.connect(ac.destination);
    }
    osc.connect(g);
    g.connect(_bgmGain);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.25);
  } catch(e) {}
  _bgmTimeout = setTimeout(_bgmTick, 220);
}

function startBGM() {
  if (_bgmRunning) return;
  _bgmRunning = true;
  _bgmStep = 0;
  _bgmTick();
}

function stopBGM() {
  _bgmRunning = false;
  if (_bgmTimeout) clearTimeout(_bgmTimeout);
  _bgmTimeout = null;
}
