// ─────────────────────────────────────────────────────────────────────────────
// leaderboard.js  –  Device-local score persistence via localStorage
//
// Stores { name, best, plays } keyed by normalised username.
// Completely separate from the Supabase community leaderboard (supabase.js).
// Uses localStorage so data survives across browser sessions on the same device.
// ─────────────────────────────────────────────────────────────────────────────

const LS_PREFIX = 'momo_';

/** Normalise a username to a safe localStorage key. */
function _lsKey(name) {
  return LS_PREFIX + name.trim().toLowerCase().replace(/\s+/g, '_');
}

/**
 * Save (or update) a player's local personal best.
 * Only updates `best` if the new score is strictly higher.
 * Always increments `plays`.
 * Returns the updated record { name, best, plays }.
 */
function saveLoc(name, score) {
  try {
    const key     = _lsKey(name);
    const raw     = localStorage.getItem(key);
    const record  = raw ? JSON.parse(raw) : { name, best: 0, plays: 0 };
    if (score > record.best) record.best = score;
    record.plays  = (record.plays || 0) + 1;
    // Keep the canonical casing from the most recent play
    record.name   = name;
    localStorage.setItem(key, JSON.stringify(record));
    return record;
  } catch (e) {
    console.warn('saveLoc failed:', e);
    return null;
  }
}

/**
 * Load a player's local record by name (case-insensitive).
 * Returns { name, best, plays } or null if not found.
 */
function loadLoc(name) {
  try {
    const raw = localStorage.getItem(_lsKey(name));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Persist the last-used username so the login field can be pre-filled
 * on the next visit.
 */
function saveLastPlayer(name) {
  try {
    localStorage.setItem(LS_PREFIX + 'last_player', name.trim());
  } catch (e) {}
}

/**
 * Retrieve the last-used username, or null if none stored.
 */
function loadLastPlayer() {
  try {
    return localStorage.getItem(LS_PREFIX + 'last_player') || null;
  } catch (e) {
    return null;
  }
}
