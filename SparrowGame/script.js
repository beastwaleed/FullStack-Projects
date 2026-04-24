// ============================================================
//  SPARROW RUN — Physics-based Game Engine
//  Controls: ← → move | ↑ / Space = jump (double-jump!)
//  Physics: real gravity, velocity, acceleration, friction
// ============================================================

"use strict";

// ── Helpers ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ── Assets (images & audio) ──────────────────────────────────
const IMG = {};
function loadImage(key, src) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = img.onerror = () => { IMG[key] = img; resolve(); };
        img.src = src;
    });
}

// ── Background Music ─────────────────────────────────────────
const bgMusic = new Audio('assets/Hip%20Hop%20instrumental%20%5BSickest%20Beat%20ever%5D.mp3');
bgMusic.loop   = true;
bgMusic.volume = 0.35;
bgMusic.preload = 'auto';

// ── Jump SFX (plays first 1 second of sparrowAudio.mp3) ──────
const jumpSfx = new Audio('assets/sparrowAudio.mp3');
jumpSfx.volume  = 0.6;
jumpSfx.preload = 'auto';
let jumpSfxTimer = null;

function playJumpSfx() {
    try {
        if (jumpSfxTimer) clearTimeout(jumpSfxTimer);
        jumpSfx.currentTime = 0;
        jumpSfx.play().catch(() => {});
        // Stop after exactly 1 second
        jumpSfxTimer = setTimeout(() => {
            jumpSfx.pause();
            jumpSfx.currentTime = 0;
            jumpSfxTimer = null;
        }, 1000);
    } catch(e) {}
}

// ── Canvas setup ─────────────────────────────────────────────
const canvas = $('gameCanvas');
const ctx    = canvas.getContext('2d');

let W = 0, H = 0, GROUND = 0;

function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    GROUND = Math.floor(H * 0.82);   // ground line Y position
}

// ── Physics constants ────────────────────────────────────────
const GRAVITY        = 0.55;   // px/frame² (acceleration downward)
const JUMP_VEL       = -14;    // initial upward velocity (negative = up)
const DOUBLE_JUMP_VEL= -11;    // second jump is slightly weaker
const MOVE_ACCEL     = 0.9;    // horizontal acceleration per frame
const MOVE_MAX       = 6.5;    // max horizontal speed
const FRICTION       = 0.78;   // horizontal slowdown when no key held
const GROUND_FRICTION = 0.85;

// ── Game state ───────────────────────────────────────────────
let gameRunning  = false;
let gamePaused   = false;
let score        = 0;
let hiScore      = parseInt(localStorage.getItem('sparrowHi') || '0');
let lives        = 3;
let level        = 1;
let frameCount   = 0;
let invincible   = 0;         // invincibility frames after hit
let rafId        = null;

// ── Player ───────────────────────────────────────────────────
const player = {
    x: 100,
    y: 0,
    w: 155,
    h: 135,
    vx: 0,
    vy: 0,
    onGround: false,
    jumpsLeft: 2,       // supports double-jump
    facing: 1,          // 1 = right, -1 = left
    animFrame: 0,
    animTimer: 0,
};

// ── Obstacles ────────────────────────────────────────────────
const obstacles = [];

// ── Particles ────────────────────────────────────────────────
const particles = [];

function spawnParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            life: 1,
            decay: 0.03 + Math.random() * 0.03,
            radius: 3 + Math.random() * 4,
            color,
        });
    }
}

// ── Parallax background layers ───────────────────────────────
const bgLayers = [
    { img: null, scrollX: 0, speed: 0.2, alpha: 1 },
];

// ── Scrolling ground tiles ───────────────────────────────────
let groundScroll = 0;

// ── Input ────────────────────────────────────────────────────
const keys = {};

window.addEventListener('keydown', e => {
    keys[e.code] = true;

    // Jump
    if ((e.code === 'Space' || e.code === 'ArrowUp') && gameRunning && !gamePaused) {
        e.preventDefault();
        triggerJump();
    }

    // Pause
    if ((e.code === 'KeyP' || e.code === 'Escape') && gameRunning) {
        togglePause();
    }

    // Restart from game-over
    if (e.code === 'KeyR' && !gameRunning) {
        startGame();
    }
});

window.addEventListener('keyup', e => { keys[e.code] = false; });

// Mobile buttons
function setupMobileBtn(id, action) {
    const btn = $(id);
    if (!btn) return;
    const start = () => { keys[action] = true;  btn.classList.add('pressed'); };
    const end   = () => { keys[action] = false; btn.classList.remove('pressed'); };
    btn.addEventListener('pointerdown',  e => { e.preventDefault(); start(); }, { passive: false });
    btn.addEventListener('pointerup',    end);
    btn.addEventListener('pointerleave', end);
    btn.addEventListener('pointercancel',end);
}
setupMobileBtn('mcLeft',  'ArrowLeft');
setupMobileBtn('mcRight', 'ArrowRight');

// Jump button is a one-shot trigger
const mcJump = $('mcJump');
if (mcJump) {
    mcJump.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (gameRunning && !gamePaused) triggerJump();
        mcJump.classList.add('pressed');
    }, { passive: false });
    mcJump.addEventListener('pointerup',    () => mcJump.classList.remove('pressed'));
    mcJump.addEventListener('pointerleave', () => mcJump.classList.remove('pressed'));
}

// ── Jump logic ───────────────────────────────────────────────
function triggerJump() {
    if (player.jumpsLeft <= 0) return;

    if (player.onGround) {
        player.vy = JUMP_VEL;
    } else {
        // Double-jump (midair) — weaker
        player.vy = DOUBLE_JUMP_VEL;
        spawnParticles(player.x + player.w / 2, player.y + player.h, '#fbbf24', 6);
    }

    player.jumpsLeft--;
    player.onGround = false;
    playJumpSfx();
}

// ── Toggle Pause ─────────────────────────────────────────────
function togglePause() {
    gamePaused = !gamePaused;
    $('pauseOverlay').style.display = gamePaused ? 'flex' : 'none';
    // Pause / resume background music with the game
    if (gamePaused) {
        bgMusic.pause();
    } else {
        bgMusic.play().catch(() => {});
    }
}

// ── Obstacle factory ─────────────────────────────────────────
function baseSpeed() {
    // Increases with score & level
    return 4 + level * 0.8 + score * 0.002;
}

function spawnObstacle() {
    const spd = baseSpeed() * (0.9 + Math.random() * 0.4);
    const h   = 60 + Math.random() * 60;
    const w   = h * 0.9;

    obstacles.push({
        x:   W + 60,
        y:   GROUND - h,
        w, h,
        vx:  -spd,
        img: IMG.dragon,
        animFrame: 0,
        animTimer: 0,
    });
}

// Gap between obstacle spawns (decreases with level)
function spawnInterval() {
    return Math.max(60, 180 - level * 15 - score * 0.04);
}

let nextSpawn = 100;   // frames until next obstacle

// ── Physics update ───────────────────────────────────────────
function updatePlayer() {
    // Horizontal movement
    if (keys['ArrowLeft'])  player.vx -= MOVE_ACCEL;
    if (keys['ArrowRight']) player.vx += MOVE_ACCEL;

    // Clamp speed
    player.vx = Math.max(-MOVE_MAX, Math.min(MOVE_MAX, player.vx));

    // Friction
    if (!keys['ArrowLeft'] && !keys['ArrowRight']) {
        player.vx *= player.onGround ? GROUND_FRICTION : FRICTION;
        if (Math.abs(player.vx) < 0.1) player.vx = 0;
    }

    // Gravity
    player.vy += GRAVITY;

    // Apply velocity
    player.x += player.vx;
    player.y += player.vy;

    // Clamp horizontal (can't leave screen)
    const minX = 0;
    const maxX = W - player.w;
    if (player.x < minX) { player.x = minX; player.vx = 0; }
    if (player.x > maxX) { player.x = maxX; player.vx = 0; }

    // Ground collision
    if (player.y + player.h >= GROUND) {
        player.y = GROUND - player.h;
        player.vy = 0;
        if (!player.onGround) {
            // Landing impact particles
            spawnParticles(player.x + player.w / 2, GROUND, '#94a3b8', 5);
        }
        player.onGround = true;
        player.jumpsLeft = 2;   // reset double-jump on landing
    } else {
        player.onGround = false;
    }

    // Sprite direction
    if (player.vx > 0.2) player.facing = 1;
    if (player.vx < -0.2) player.facing = -1;

    // Simple animation frame
    player.animTimer++;
    if (player.animTimer > 8) {
        player.animFrame = (player.animFrame + 1) % 2;
        player.animTimer = 0;
    }

    // Invincibility countdown
    if (invincible > 0) invincible--;
}

function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x += o.vx;

        // Animate
        o.animTimer++;
        if (o.animTimer > 10) { o.animFrame = (o.animFrame + 1) % 2; o.animTimer = 0; }

        // Off-screen → remove
        if (o.x + o.w < -20) {
            obstacles.splice(i, 1);
            score += 10;
            if (score > hiScore) { hiScore = score; localStorage.setItem('sparrowHi', hiScore); }
            updateHUD();
        }
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;   // gravity on particles
        p.life -= p.decay;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function checkCollisions() {
    if (invincible > 0) return;

    const margin = 14;   // forgiving hitbox
    const pL = player.x + margin;
    const pR = player.x + player.w - margin;
    const pT = player.y + margin;
    const pB = player.y + player.h - margin;

    for (const o of obstacles) {
        const oL = o.x + 10;
        const oR = o.x + o.w - 10;
        const oT = o.y + 10;
        const oB = o.y + o.h - 10;

        if (pR > oL && pL < oR && pB > oT && pT < oB) {
            // Hit!
            lives--;
            invincible = 90;   // ~1.5 seconds invincible
            spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ef4444', 14);
            updateHUD();

            if (lives <= 0) {
                endGame();
            }
            break;
        }
    }
}

// Raise level every 200 score
function checkLevel() {
    const newLevel = 1 + Math.floor(score / 200);
    if (newLevel !== level) {
        level = newLevel;
        spawnParticles(W / 2, H / 2, '#22c55e', 20);
        updateHUD();
    }
}

// ── Draw ─────────────────────────────────────────────────────
function drawBackground() {
    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND);
    grad.addColorStop(0,    '#0f0c1d');
    grad.addColorStop(0.45, '#1a1040');
    grad.addColorStop(1,    '#2d1b6b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Stars (static, drawn every frame for simplicity)
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    // Use seeded positions based on constants so they don't flicker
    for (let i = 0; i < 80; i++) {
        const sx = ((i * 137.508 + 42) % W);
        const sy = ((i * 53.17  + 17) % GROUND * 0.75);
        const r  = ((i % 3) * 0.5 + 0.5);
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Background image (if loaded)
    if (IMG.bg) {
        ctx.globalAlpha = 0.35;
        ctx.drawImage(IMG.bg, 0, 0, W, GROUND);
        ctx.globalAlpha = 1;
    }
}

function drawGround() {
    // Ground base
    const groundH = H - GROUND;
    const grad = ctx.createLinearGradient(0, GROUND, 0, H);
    grad.addColorStop(0, '#3d2b0a');
    grad.addColorStop(1, '#1a1005');
    ctx.fillStyle = grad;
    ctx.fillRect(0, GROUND, W, groundH);

    // Ground top border / grass strip
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, GROUND - 6, W, 6);

    // Scrolling ground pattern
    groundScroll = (groundScroll + baseSpeed() * 0.5) % 80;
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let x = -groundScroll; x < W; x += 80) {
        ctx.fillRect(x, GROUND, 40, groundH);
    }
}

function drawPlayer() {
    const { x, y, w, h, facing, onGround } = player;

    ctx.save();

    // Invincibility flicker
    if (invincible > 0 && Math.floor(invincible / 6) % 2 === 0) {
        ctx.globalAlpha = 0.35;
    }

    // Shadow on ground
    if (onGround) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, GROUND - 2, w * 0.42, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Airborne shadow (shrinks as we go up)
        const shadowY = GROUND - 2;
        const dist    = Math.max(0, GROUND - (y + h));
        const scale   = Math.max(0.1, 1 - dist / (GROUND * 0.7));
        ctx.fillStyle = `rgba(0,0,0,${0.2 * scale})`;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, shadowY, w * 0.42 * scale, 8 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Flip sprite when facing left
    if (facing === -1) {
        ctx.translate(x + w, y);
        ctx.scale(-1, 1);
        if (IMG.sparrow) ctx.drawImage(IMG.sparrow, 0, 0, w, h);
        else drawFallbackPlayer(0, 0, w, h);
    } else {
        if (IMG.sparrow) ctx.drawImage(IMG.sparrow, x, y, w, h);
        else drawFallbackPlayer(x, y, w, h);
    }

    ctx.restore();
}

function drawFallbackPlayer(x, y, w, h) {
    // Simple fallback bird shape
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.6, w * 0.35, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.65, y + h * 0.35, w * 0.25, h * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // beak
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.88, y + h * 0.38);
    ctx.lineTo(x + w, y + h * 0.33);
    ctx.lineTo(x + w * 0.9, y + h * 0.44);
    ctx.closePath();
    ctx.fill();
    // wing
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.4, y + h * 0.55, w * 0.22, h * 0.12, -0.3, 0, Math.PI * 2);
    ctx.fill();
}

function drawObstacles() {
    for (const o of obstacles) {
        ctx.save();

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(o.x + o.w / 2, GROUND - 2, o.w * 0.42, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sprite
        if (IMG.dragon) {
            ctx.drawImage(IMG.dragon, o.x, o.y, o.w, o.h);
        } else {
            // Fallback dragon
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.ellipse(o.x + o.w * 0.5, o.y + o.h * 0.55, o.w * 0.38, o.h * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#b91c1c';
            ctx.beginPath();
            ctx.ellipse(o.x + o.w * 0.3, o.y + o.h * 0.3, o.w * 0.25, o.h * 0.22, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Fiery glow behind dragon
        const grd = ctx.createRadialGradient(
            o.x + o.w / 2, o.y + o.h * 0.5, 0,
            o.x + o.w / 2, o.y + o.h * 0.5, o.w * 0.6
        );
        grd.addColorStop(0, 'rgba(239,68,68,0.18)');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.ellipse(o.x + o.w / 2, o.y + o.h * 0.5, o.w * 0.6, o.h * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawHitIndicator() {
    if (invincible > 60) {   // only show in first 30 frames
        ctx.fillStyle = `rgba(239,68,68,${(invincible - 60) / 30 * 0.3})`;
        ctx.fillRect(0, 0, W, H);
    }
}

// ── HUD updater ──────────────────────────────────────────────
function updateHUD() {
    $('scoreVal').textContent = score;
    $('hiVal').textContent    = hiScore;
    $('levelVal').textContent = level;
    $('livesVal').textContent = '❤️'.repeat(Math.max(0, lives));
}

// ── Main game loop ───────────────────────────────────────────
function gameLoop() {
    if (!gameRunning) return;
    if (gamePaused) { rafId = requestAnimationFrame(gameLoop); return; }

    frameCount++;
    score++;
    if (score > hiScore) { hiScore = score; localStorage.setItem('sparrowHi', hiScore); }

    // Spawn obstacles
    nextSpawn--;
    if (nextSpawn <= 0) {
        spawnObstacle();
        nextSpawn = spawnInterval();
    }

    // ── UPDATE ──
    updatePlayer();
    updateObstacles();
    updateParticles();
    checkCollisions();
    checkLevel();
    if (frameCount % 5 === 0) updateHUD();

    // ── DRAW ──
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawGround();
    drawObstacles();
    drawPlayer();
    drawParticles();
    drawHitIndicator();

    rafId = requestAnimationFrame(gameLoop);
}

// ── Start / End Game ─────────────────────────────────────────
function startGame() {
    // Reset state
    score     = 0;
    lives     = 3;
    level     = 1;
    frameCount= 0;
    invincible= 0;
    gamePaused= false;
    nextSpawn = 100;
    obstacles.length = 0;
    particles.length = 0;

    player.x = 100;
    player.y = GROUND - player.h;
    player.vx = 0;
    player.vy = 0;
    player.onGround = true;
    player.jumpsLeft = 2;
    player.facing    = 1;

    updateHUD();

    $('gameOverOverlay').style.display = 'none';
    $('pauseOverlay').style.display    = 'none';
    $('startScreen').style.display     = 'none';
    $('gameWrap').style.display        = 'block';

    resize();   // make sure canvas matches layout after show

    gameRunning = true;

    // Start background music (browser requires user gesture — button click qualifies)
    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => {});

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }

    bgMusic.pause();
    bgMusic.currentTime = 0;

    $('goScore').textContent = `Score: ${score}`;
    $('goHi').textContent    = `Best: ${hiScore}`;
    $('gameOverOverlay').style.display = 'flex';
}

function goToMenu() {
    gameRunning = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }

    bgMusic.pause();
    bgMusic.currentTime = 0;

    $('gameOverOverlay').style.display = 'none';
    $('gameWrap').style.display        = 'none';
    $('startScreen').style.display     = 'flex';
}

// ── Resize handler ───────────────────────────────────────────
window.addEventListener('resize', () => {
    resize();
    // Re-place player on new ground
    if (player.y + player.h > GROUND) {
        player.y = GROUND - player.h;
        player.onGround = true;
    }
});

// ── Button wiring ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    $('btnStart').addEventListener('click', startGame);
    $('btnRestart').addEventListener('click', startGame);
    $('btnMenu').addEventListener('click', goToMenu);

    // Initial resize so canvas fills screen
    resize();

    // Load assets
    Promise.all([
        loadImage('bg',      'assets/bg.png'),
        loadImage('sparrow', 'assets/sparrowRun.png'),
        loadImage('dragon',  'assets/dragon.png'),
    ]).then(() => {
        // Images loaded — game is ready
    });

    // Show hi-score immediately
    $('hiVal').textContent = hiScore;


    // ── Review System — Firebase Firestore ───────────────────
 
    const firebaseConfig = {
        apiKey:            "AIzaSyAouXF2ckq-e383li1Ek8fqb8ZctfZdR94",
        authDomain:        "sparrowrungame.firebaseapp.com",
        projectId:         "sparrowrungame",
        storageBucket:     "sparrowrungame.firebasestorage.app",
        messagingSenderId: "187644954515",
        appId:             "1:187644954515:web:46a737513f05cc21f34a66",
        measurementId:     "G-ZLR1D2RB55"
    };

    // Initialise Firebase (guard against duplicate DOMContentLoaded calls)
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    const reviewsCol = db.collection('sparrowrun_reviews');
    const aggDoc     = db.collection('sparrowrun_meta').doc('aggregate');

    let selectedStar = 0;
    const starLabels = ['', 'Terrible 😞', 'Not great 😕', "It's okay 😐", 'Pretty good 😊', 'Amazing! 🤩'];

    // ── Render helpers ────────────────────────────────────────
    function starsText(avg) {
        const full  = Math.floor(avg);
        const half  = avg - full >= 0.5 ? 1 : 0;
        const empty = 5 - full - half;
        return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
    }

    function applyRatingUI(avg, count) {
        const hudStarsEl       = $('hudStars');
        const hudRatingTextEl  = $('hudRatingText');
        const reviewAvgNumEl   = $('reviewAvgNum');
        const reviewAvgStarsEl = $('reviewAvgStars');
        const reviewAvgLabelEl = $('reviewAvgLabel');

        if (!count) {
            hudStarsEl.textContent      = '★★★★★';
            hudStarsEl.style.color      = 'rgba(255,255,255,0.2)';
            hudRatingTextEl.textContent = 'No reviews';
            reviewAvgNumEl.textContent  = '—';
            reviewAvgStarsEl.textContent = '';
            reviewAvgLabelEl.textContent = 'No reviews yet — be the first!';
        } else {
            const rounded = Math.round(avg * 10) / 10;
            const filled  = Math.round(avg);
            hudStarsEl.textContent      = '★'.repeat(filled) + '☆'.repeat(5 - filled);
            hudStarsEl.style.color      = '#fbbf24';
            hudRatingTextEl.textContent = `${rounded}/5  (${count} ${count === 1 ? 'review' : 'reviews'})`;
            reviewAvgNumEl.textContent  = rounded.toFixed(1);
            reviewAvgStarsEl.textContent = starsText(avg);
            reviewAvgStarsEl.style.color = '#fbbf24';
            reviewAvgLabelEl.textContent = `${count} ${count === 1 ? 'review' : 'reviews'}`;
        }
    }

    // ── Real-time aggregate listener ──────────────────────────
    // Fires instantly whenever ANY player submits a review
    aggDoc.onSnapshot(snap => {
        if (snap.exists) {
            const { totalStars, count } = snap.data();
            applyRatingUI(totalStars / count, count);
        } else {
            applyRatingUI(0, 0);
        }
    }, () => {
        // Firestore not configured yet — silently fail
        applyRatingUI(0, 0);
    });

    // ── Save a review to Firestore ────────────────────────────
    async function saveReview(stars, text) {
        // 1. Write the individual review document
        await reviewsCol.add({
            stars,
            text: text.trim(),
            time: firebase.firestore.FieldValue.serverTimestamp()
        });
        // 2. Atomically update the aggregate so the HUD stays fast
        await db.runTransaction(async t => {
            const snap = await t.get(aggDoc);
            if (!snap.exists) {
                t.set(aggDoc, { totalStars: stars, count: 1 });
            } else {
                t.update(aggDoc, {
                    totalStars: firebase.firestore.FieldValue.increment(stars),
                    count:      firebase.firestore.FieldValue.increment(1)
                });
            }
        });
    }

    // ── Star Picker interaction ───────────────────────────────
    const stars      = document.querySelectorAll('.star');
    const starLabel  = $('starLabel');
    const submitBtn  = $('btnSubmitReview');
    const reviewText = $('reviewText');
    const charCount  = $('reviewCharCount');

    function highlightStars(val) {
        stars.forEach(s => s.classList.toggle('hovered', parseInt(s.dataset.val) <= val));
    }

    function selectStars(val) {
        selectedStar = val;
        stars.forEach(s => {
            s.classList.toggle('selected', parseInt(s.dataset.val) <= val);
            s.classList.remove('hovered');
        });
        starLabel.textContent = starLabels[val];
        submitBtn.disabled    = false;
    }

    stars.forEach(s => {
        s.addEventListener('mouseenter', () => highlightStars(parseInt(s.dataset.val)));
        s.addEventListener('mouseleave', () => highlightStars(selectedStar));
        s.addEventListener('click',      () => selectStars(parseInt(s.dataset.val)));
        s.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectStars(parseInt(s.dataset.val)); }
        });
    });

    reviewText.addEventListener('input', () => { charCount.textContent = reviewText.value.length; });

    // ── Modal open / close ────────────────────────────────────
    function openReviewModal() {
        $('reviewModalBg').classList.add('open');
        selectedStar = 0;
        stars.forEach(s => s.classList.remove('selected', 'hovered'));
        starLabel.textContent = 'Tap a star to rate';
        reviewText.value      = '';
        charCount.textContent = '0';
        submitBtn.textContent = 'Submit Review';
        submitBtn.disabled    = true;
    }

    function closeReviewModal() {
        $('reviewModalBg').classList.remove('open');
    }

    $('btnReview').addEventListener('click', openReviewModal);
    $('reviewClose').addEventListener('click', closeReviewModal);
    $('reviewModalBg').addEventListener('click', e => { if (e.target === $('reviewModalBg')) closeReviewModal(); });
    window.addEventListener('keydown', e => { if (e.key === 'Escape') closeReviewModal(); });

    // ── Submit ────────────────────────────────────────────────
    submitBtn.addEventListener('click', async () => {
        if (!selectedStar) return;
        submitBtn.disabled    = true;
        submitBtn.textContent = '⏳ Saving...';
        try {
            await saveReview(selectedStar, reviewText.value);
            submitBtn.textContent = '✅ Thank you!';
            setTimeout(() => closeReviewModal(), 1400);
        } catch(err) {
            // Firebase not configured yet — show helpful message
            submitBtn.textContent = '⚠️ Set up Firebase first!';
            submitBtn.disabled    = false;
            console.warn('Firebase not configured:', err.message);
        }
    });
});
