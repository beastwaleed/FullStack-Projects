<div align="center">

# 🐦 SparrowRun

### A physics-based side-scrolling browser game

[![Made with](https://img.shields.io/badge/Made%20with-HTML%20%7C%20CSS%20%7C%20JavaScript-orange?style=for-the-badge)](#)
[![Firebase](https://img.shields.io/badge/Powered%20by-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](#)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#)

> Save the Sparrow from the Dragon — dodge obstacles, level up, and survive as long as you can!

**[▶ Play Now](https://savesparrow.netlify.app/)** • **[LinkedIn](https://www.linkedin.com/in/digiwaleed)** • **[Report a Bug](https://github.com/digiwaleed/SparrowRun/issues)**

</div>

---

## 📸 Preview

| Home Screen | Gameplay | Game Over |
|:-----------:|:--------:|:---------:|
| Dark themed start screen with floating sparrow | Physics-based running & jumping | Score summary with restart option |

---

## 🎮 How to Play

| Action | Keyboard | Mobile |
|--------|----------|--------|
| **Jump** | `↑` or `Space` | Tap **▲ JUMP** |
| **Double Jump** | Press jump again mid-air | Tap **▲ JUMP** again |
| **Move Left** | `←` Arrow | Tap **◀** |
| **Move Right** | `→` Arrow | Tap **▶** |
| **Pause** | `P` or `Esc` | — |
| **Restart** | `R` (after Game Over) | Tap **Restart** button |

### 🏆 Scoring
- **+1 point** every game frame you stay alive
- **+10 points** for every obstacle you successfully dodge
- Score **200+** to reach **Level 2** (faster dragons!)
- Every 200 points advances you to the next level

---

## ✨ Features

### 🔭 Realistic Physics Engine
- **Gravity** — constant downward acceleration pulls the sparrow naturally
- **Jump velocity** — initial upward burst that decelerates against gravity
- **Double Jump** — a mid-air second jump (slightly weaker than the first)
- **Horizontal acceleration** — smooth speed build-up, not instant teleport
- **Friction** — different deceleration on the ground vs. in the air
- **Dynamic shadow** — shadow shrinks realistically as the sparrow rises

### 🎨 Visual Polish
- Dark space / night sky theme with a starfield background
- `requestAnimationFrame`-based canvas rendering (smooth 60 fps)
- Scrolling ground with green grass strip
- Particle effects on jump, landing, hits, and level-up
- Red screen flash on collision for impact feedback
- Invincibility flicker effect after taking a hit

### 🧠 Game Mechanics
- **3 Lives** — take 3 hits before Game Over
- **Invincibility frames** — ~1.5 seconds of protection after each hit
- **Level system** — speed and spawn rate increase every 200 points
- **Persistent high score** — saved in `localStorage` across sessions

### 🌐 Global Review System (Firebase)
- Players can rate the game **1–5 stars** with an optional text comment
- Reviews are stored in **Firebase Firestore** — shared across ALL players worldwide
- **Real-time HUD** — star rating and review count update live as anyone submits
- Aggregate score computed atomically (no stale data)

### 🔊 Audio
- 🎵 **Background music** — Hip Hop instrumental loops during gameplay
- 🐦 **Jump SFX** — 1-second sparrow chirp plays on every jump
- Music **pauses** when the game is paused and **stops** on Game Over / Menu

### 📱 Mobile Ready
- On-screen D-Pad (◀ ▲ ▶) auto-appears on touch devices
- Responsive layout adapts from 320px wide phones to 4K screens

---

## 🗂️ Project Structure

```
SparrowGame/
├── index.html          # Game HTML — screens, HUD, overlays, review modal
├── style.css           # All styles — dark theme, animations, responsive layout
├── script.js           # Game engine — physics, rendering, Firebase reviews
└── assets/
    ├── sparrowRun.png  # Player character sprite
    ├── dragon.png      # Obstacle sprite
    ├── bg.png          # Background image
    ├── sparrow.png     # Favicon / icon
    ├── sparrowAudio.mp3        # Jump sound effect
    └── Hip Hop instrumental [Sickest Beat ever].mp3  # Background music
```

---

## 🚀 Running Live
https://savesparrow.netlify.app/

## 💾 Running Locally

No build step needed — it's pure HTML/CSS/JS.

**Option 1 — VS Code Live Server (recommended)**
1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension
2. Right-click `index.html` → **Open with Live Server**

**Option 2 — Python simple server**
```bash
# Python 3
python -m http.server 5500
# Then open http://localhost:5500
```

**Option 3 — Just open the file**
```
Double-click index.html in File Explorer
```
> ⚠️ Audio and Firebase may be blocked when opening directly as `file://` — use a local server for full functionality.

---

## 🔥 Firebase Setup (for Global Reviews)

Reviews require a Firebase Firestore database to be shared across all players.

1. Go to **[console.firebase.google.com](https://console.firebase.google.com)**
2. Create a new project → Register a **Web App**
3. Enable **Firestore Database** → Start in **Test Mode**
4. Copy your `firebaseConfig` object
5. Paste it into `script.js` inside the `// ── Review System` section

```js
const firebaseConfig = {
    apiKey:            "YOUR_API_KEY",
    authDomain:        "YOUR_PROJECT.firebaseapp.com",
    projectId:         "YOUR_PROJECT_ID",
    storageBucket:     "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId:             "YOUR_APP_ID"
};
```

> The free Spark plan allows **50,000 reads + 20,000 writes per day** — more than enough for a hobby game.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 |
| Styling | Vanilla CSS3 (custom properties, animations, glassmorphism) |
| Logic | Vanilla JavaScript ES2021 (no frameworks) |
| Rendering | HTML5 Canvas API (`requestAnimationFrame`) |
| Database | Firebase Firestore (real-time reviews) |
| Fonts | Google Fonts — Orbitron + Inter |

---

## 🧑‍💻 Author

**Waleed** — Full Stack Developer & Creative Technologist

[![LinkedIn](https://img.shields.io/badge/LinkedIn-digiwaleed-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/digiwaleed)

---

## 📄 License

This project is open source under the [MIT License](LICENSE).

---

<div align="center">
  Made with ❤️ by <strong>Waleed</strong> — if you enjoyed the game, leave a ⭐ review in-game!
</div>
