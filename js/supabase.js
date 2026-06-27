// ─────────────────────────────────────────────────────────────────────────────
// supabase.js  –  Community leaderboard via Supabase REST API
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://yzvwmkgfvukfqrqkhsmu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_uiza8BkcJ8mk_vlBHytbjg_OxqtmAqb';

/**
 * Save or update a player score.
 * Only overwrites if the new score is strictly higher.
 */
async function saveLB(name, score) {
  try {
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
    };

    // Check for existing record
    const chk = await fetch(
      SUPABASE_URL + '/rest/v1/leaderboard?name=eq.' + encodeURIComponent(name) + '&select=id,score',
      { headers }
    );
    const rows = await chk.json();

    if (rows && rows.length > 0) {
      if (score > rows[0].score) {
        await fetch(
          SUPABASE_URL + '/rest/v1/leaderboard?id=eq.' + rows[0].id,
          {
            method: 'PATCH',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ score }),
          }
        );
      }
    } else {
      await fetch(SUPABASE_URL + '/rest/v1/leaderboard', {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ name, score }),
      });
    }
  } catch (e) {
    console.warn('Leaderboard save failed:', e);
  }
}

/**
 * Fetch the top-10 scores from Supabase.
 * Returns an array of { name, best } objects.
 */
async function getLB() {
  try {
    const res = await fetch(
      SUPABASE_URL + '/rest/v1/leaderboard?select=name,score&order=score.desc&limit=10',
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
        },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(r => ({ name: r.name, best: r.score }));
  } catch (e) {
    console.warn('Leaderboard fetch failed:', e);
    return [];
  }
}
