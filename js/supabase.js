// ─────────────────────────────────────────────────────────────────────────────
// supabase.js  –  Community leaderboard via Supabase REST API
//
// Guarantees exactly one row per username (case-insensitive):
//   • INSERT on first appearance
//   • PATCH only when the new score is strictly higher than the stored best
//   • getLB() returns top-10, deduplicated by the DB (one row per player)
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://yzvwmkgfvukfqrqkhsmu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_uiza8BkcJ8mk_vlBHytbjg_OxqtmAqb';

const _sbHeaders = {
  'apikey':        SUPABASE_KEY,
  'Authorization': 'Bearer ' + SUPABASE_KEY,
  'Content-Type':  'application/json',
};

/**
 * Upsert a player score into the online leaderboard.
 *
 * Strategy:
 *   1. Look up the player by username using a case-insensitive ILIKE filter
 *      so "Momo", "momo", and "MOMO" all resolve to the same row.
 *   2. If no row exists  → INSERT a new row.
 *   3. If a row exists and new score > stored score → PATCH that row only.
 *   4. If a row exists but new score ≤ stored score → do nothing (never overwrite
 *      a higher score with a lower one).
 */
async function saveLB(name, score) {
  try {
    // Case-insensitive lookup — ilike matches regardless of capitalisation
    const lookupRes = await fetch(
      SUPABASE_URL +
        '/rest/v1/leaderboard?name=ilike.' +
        encodeURIComponent(name.trim()) +
        '&select=id,score',
      { headers: _sbHeaders }
    );

    if (!lookupRes.ok) {
      console.warn('saveLB lookup failed:', lookupRes.status);
      return;
    }

    const rows = await lookupRes.json();

    if (!rows || rows.length === 0) {
      // No existing row → create one
      await fetch(SUPABASE_URL + '/rest/v1/leaderboard', {
        method:  'POST',
        headers: { ..._sbHeaders, 'Prefer': 'return=minimal' },
        body:    JSON.stringify({ name: name.trim(), score }),
      });
    } else {
      // Row exists — update only if the new score is strictly better
      const existing = rows[0];
      if (score > existing.score) {
        await fetch(
          SUPABASE_URL + '/rest/v1/leaderboard?id=eq.' + existing.id,
          {
            method:  'PATCH',
            headers: { ..._sbHeaders, 'Prefer': 'return=minimal' },
            body:    JSON.stringify({ score }),
          }
        );
      }
      // else: lower or equal score → silently skip, never overwrite
    }
  } catch (e) {
    console.warn('saveLB failed:', e);
  }
}

/**
 * Fetch the global top-10 from Supabase, ordered by score descending.
 * Because saveLB enforces one row per username, every entry here is unique.
 * Returns an array of { name, best } objects, or [] on error.
 */
async function getLB() {
  try {
    const res = await fetch(
      SUPABASE_URL +
        '/rest/v1/leaderboard?select=name,score&order=score.desc&limit=10',
      { headers: _sbHeaders }
    );

    if (!res.ok) {
      console.warn('getLB failed:', res.status);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data)
      ? data.map(r => ({ name: r.name, best: r.score }))
      : [];
  } catch (e) {
    console.warn('getLB failed:', e);
    return [];
  }
}
