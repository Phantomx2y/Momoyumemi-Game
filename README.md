# MOMOYUMEMI · 桃夢見

> *"The one who sees peach-colored dreams"*

A retro anime-styled arcade runner built as an NFT project game. Five playable characters, five themed worlds, a community leaderboard powered by Supabase, and survival-based gameplay.

---

## Project structure

```
survival-game/
├── index.html              Main entry point
├── css/
│   └── style.css           All styles (login, game UI, leaderboard, game-over)
├── js/
│   ├── images.js           Base64-encoded NFT character images
│   ├── audio.js            Audio stubs (wire up .mp3 files here)
│   ├── supabase.js         Community leaderboard – Supabase REST API
│   ├── leaderboard.js      Device-local score persistence (artifact storage)
│   ├── game.js             Canvas, game state, physics, backgrounds, game loop
│   └── ui.js               Screens, character/theme pickers, event wiring
├── assets/
│   ├── images/             Place any external image assets here
│   ├── audio/              Place .mp3 / .ogg sound files here
│   └── fonts/              Place custom web fonts here
├── vercel.json             Vercel static hosting config
├── .gitignore
├── LICENSE
└── README.md
```

---

## Local development

No build step required — this is a plain HTML/CSS/JS project.

```bash
# Clone or unzip the project
cd survival-game

# Option 1 — Python (zero dependencies)
python3 -m http.server 8080
# Then open http://localhost:8080

# Option 2 — Node (npx, zero install)
npx serve .
# Then open the URL shown in the terminal

# Option 3 — VS Code
# Install the "Live Server" extension, right-click index.html → Open with Live Server
```

> **Do not** open `index.html` directly via `file://` in your browser — the Supabase fetch calls require an HTTP context (CORS).

---

## Deployment

### Vercel (recommended)

```bash
npm i -g vercel   # one-time install
vercel            # follow the prompts – deploy in ~30 s
```

Or drag-and-drop the project folder at **vercel.com/new**.

### Netlify

1. Go to **netlify.com** → New site → Deploy manually
2. Drag the entire `survival-game/` folder onto the upload area
3. Done – you get a free `.netlify.app` URL

### GitHub Pages

```bash
git init && git add . && git commit -m "init"
git remote add origin https://github.com/YOUR_USER/momoyumemi.git
git push -u origin main
```
Then in the repo settings → Pages → Source: `main` / `/ (root)`.

---

## Supabase leaderboard

Credentials live in `js/supabase.js`:

| Variable        | Value                                      |
|-----------------|--------------------------------------------|
| `SUPABASE_URL`  | `https://yzvwmkgfvukfqrqkhsmu.supabase.co` |
| `SUPABASE_KEY`  | publishable anon key (safe for client use) |

The `leaderboard` table schema:

| Column       | Type          | Notes                   |
|--------------|---------------|-------------------------|
| `id`         | int8 PK       | auto-increment          |
| `name`       | text          | player name             |
| `score`      | int8          | personal best           |
| `created_at` | timestamptz   | default: `now()`        |

RLS policies required:
- **Public read** – `SELECT` allowed for `anon`
- **Public insert** – `INSERT` allowed for `anon`
- **Public update** – `UPDATE` allowed for `anon` (for score improvements)

---

## Gameplay

| Action          | Control                    |
|-----------------|----------------------------|
| Flap / float    | Click · Tap · Space · ↑    |
| Navigate menus  | Click / Tap                |

- Collect **🍑 peaches** to score points (+10 each)
- Collect **3 peaches** (while unshielded) to earn an **8-second 🛡️ shield**
- Peaches while shielded only add score – no shield progress
- Shield absorbs one hit; obstacles clear for ~0.4 s after impact
- Speed increases at **7** and **30** peaches collected
- Gap patterns grow harder every 5 peaches

---

## Adding audio

1. Place `.mp3` (or `.ogg`) files in `assets/audio/`
2. Uncomment the relevant lines in `js/audio.js`
3. Call `playPeachSfx()`, `playShieldSfx()`, `playHitSfx()` from `game.js`

---

## License

See `LICENSE`.
