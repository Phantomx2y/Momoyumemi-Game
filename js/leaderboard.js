// ─────────────────────────────────────────────────────────────────────────────
// leaderboard.js  –  Local (device) score persistence via artifact storage
// The community leaderboard (Supabase) lives in supabase.js
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_PREFIX = 'mm7_';

/** Generic safe storage getter – returns null if key missing. */
async function sGet(key, shared = false) {
  try {
    return await window.storage.get(key, shared);
  } catch (e) {
    return null;
  }
}

/**
 * Save a player's local best score on this device.
 * Returns the updated record { name, best, plays }.
 */
async function saveLoc(name, score) {
  try {
    const key = STORAGE_PREFIX + name.toLowerCase().replace(/\s/g, '_');
    const ex  = await sGet(key);
    const d   = ex ? JSON.parse(ex.value) : { name, best: 0, plays: 0 };
    if (score > d.best) d.best = score;
    d.plays = (d.plays || 0) + 1;
    await window.storage.set(key, JSON.stringify(d));
    return d;
  } catch (e) {
    return null;
  }
}

/**
 * Load a player's local record by name.
 * Returns { name, best, plays } or null if not found.
 */
async function loadLoc(name) {
  try {
    const key = STORAGE_PREFIX + name.toLowerCase().replace(/\s/g, '_');
    const r   = await sGet(key);
    return r ? JSON.parse(r.value) : null;
  } catch (e) {
    return null;
  }
}
