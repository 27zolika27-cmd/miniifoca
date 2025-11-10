// Canvas beállítása
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Játékparaméterek
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GOAL_WIDTH = 10;
const GOAL_HEIGHT = 100;

// Változtasd meg ezt az értéket a kívánt meccsidőhöz! (percben)
const MATCH_DURATION_MINUTES = 2;

// --- SPRINT ÉS SEBESSÉG PARAMÉTEREK ---
const BASE_SPEED = 3;
const SPRINT_MULTIPLIER = 1.8;
const MAX_SPRINT_TIME = 300;
const SPRINT_DRAIN_RATE = 3;
const SPRINT_RECHARGE_RATE = 1;

// --- RÚGÁS PARAMÉTEREK ---
const KICK_POWER = 15;
const KICK_DISTANCE = 20;

// --- BECSÚSZÁS (SLIDE) PARAMÉTEREK ---
const SLIDE_TIME = 25;
const SLIDE_BOOST = 1.8;
const SLIDE_RECOVERY = 30;
const SLIDE_FRICTION = 0.96;

// --- BÜNTETÉSEK PARAMÉTEREI ---
const FOUL_KICK_PAUSE = 60;
const FOUL_LABDA_TAVOLSAG = 40;
const AIM_LINE_LENGTH = 200;

// --- VISSZAJÁTSZÁS (REPLAY) PARAMÉTEREK ---
const REPLAY_SPEED_FACTOR = 2;
const REPLAY_TEXT_TIME = 30;
const GOAL_PAUSE_TIME = 90;
const ENDGAME_PAULSE = 60;
const REPLAY_BUFFER_SIZE = 90;
const INTRO_TEXT_TIME = 150; // Bevezető szöveg megjelenítési ideje

// --- PÁLYA KONSTANSOK ---
const PENALTY_BOX_WIDTH = 60;
const PENALTY_BOX_HEIGHT = 200;
const PENALTY_SPOT_DIST = 40;
const CENTER_CIRCLE_RADIUS = 50;


// --- JÁTÉK MÓD ÉS KARRIER VÁLTOZÓK ---
let currentMode = '1v1'; 
let isBotActive = false; 
let playerName = "JÁTÉKOS CSAPAT"; 
let currentNameInput = ""; 

let currentMatchDay = 1;
// 12 csapat esetén egykörös bajnokság (mindenki mindenkivel 1x játszik) = 11 forduló
const MAX_MATCH_DAYS = 11; 
let opponentName = "Ferencvárosi TC"; // Kezdő ellenfél
let lastMatchResult = null;
const POINTS_FOR_WIN = 3;
const POINTS_FOR_DRAW = 1;

// --------------------------------------------------------------------------------------------------
// --- BAJNOKI TABELLA (OTP Bank Liga - NB I) ---
// --------------------------------------------------------------------------------------------------
let leagueTable = [
    { name: "JÁTÉKOS CSAPAT", played: 0, points: 0, win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, diff: 0, difficulty: 0.8, isPlayer: true }, 
    { name: "Ferencvárosi TC", played: 0, points: 0, win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, diff: 0, difficulty: 1.3, isPlayer: false },
    { name: "Fehérvár FC", played: 0, points: 0, win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, diff: 0, difficulty: 1.1, isPlayer: false },
    { name: "Paksi FC", played: 0, points: 0, win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, diff: 0, difficulty: 1.0, isPlayer: false },
    { name: "Debreceni VSC", played: 0, points: 0, win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, diff: 0, difficulty: 0.9, isPlayer: false },
    { name: "Puskás Akadémia", played: 0, points: 0, win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, diff: 0, difficulty: 1.1, isPlayer: false },
    { name: "Újpest FC", played: 0, points: 0, win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, diff: 0, difficulty: 0.8, isPlayer: false },
    { name: "Zalaegerszegi TE", played: 0, points: 0, win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, diff: 0, difficulty: 0.9, isPlayer: false },
    { name: "Diósgyőri VTK", played: 0, points: 0, win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, diff: 0, difficulty: 0.7, isPlayer: false },
    { name: "Kisvárda FC", played: 0, points: 0, win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, diff: 0, difficulty: 0.6, isPlayer: false },
    { name: "Kecskeméti TE", played: 0, points: 0, win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, diff: 0, difficulty: 0.7, isPlayer: false },
    { name: "MTK Budapest", played: 0, points: 0, win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, diff: 0, difficulty: 1.0, isPlayer: false }
];

const allTeams = leagueTable.slice();
const careerOpponents = allTeams.filter(t => !t.isPlayer);

// --- JÁTÉK ÁLLAPOT ÉS IDŐZÍTŐ ---
let scoreBlue = 0;
let scoreRed = 0;
let gameState = 'intro'; // Játék kezdése intro-val
let goalTimer = 0;
let introTimer = INTRO_TEXT_TIME;
let timeLeftSeconds = MATCH_DURATION_MINUTES * 60;
let replayFrameIndex = 0;
let frameCounter = 0;
let kickerPlayer = null;

// Menü vezérlés
let mainMenuItems = [
    { text: "Karrier Mód", action: "start_career" },
    { text: "Helyi 1v1", action: "start_1v1" },
    { text: "Irányítás", action: "controls" } // ÚJ MENÜPONT
];
let careerMenuItems = [
    { text: "Következő Meccs Indítása", action: "start_match" },
    { text: "Tabella megtekintése", action: "view_table" }, 
    { text: "Karrier Kilépés (Főmenü)", action: "exit_career" }
];
let selectedMenuItem = 0;
let menuControlDownLastFrame = false;

// Replay puffer
let replayBuffer = [];

// Időméréshez
let lastTime = 0;
const TIME_INTERVAL = 1000;

// --- HANG KEZELÉS (ÚJ: 2.1) ---
let kickAudio = null;
let goalAudio = null;

document.addEventListener('DOMContentLoaded', () => {
    // Csak a DOM betöltése után inicializálhatjuk az audio elemeket
    kickAudio = document.getElementById('kickSound');
    goalAudio = document.getElementById('goalSound');
});

function playKickSound() {
    if (kickAudio) {
        kickAudio.currentTime = 0; // Újraindítja a hangot, ha még szól
        kickAudio.play().catch(e => console.log("Kick sound error:", e));
    }
}

function playGoalSound() {
    if (goalAudio) {
        goalAudio.currentTime = 0;
        goalAudio.play().catch(e => console.log("Goal sound error:", e));
    }
}
// ------------------------------

// --- GAMEPAD ÉS BILLENTYŰZET KEZELÉS ---
let keys = {};
let gamepads = [null, null];
let skipPressedLastFrame = false;
let lastKick1 = false;
let lastKick2 = false;
let lastSlide1 = false;
let lastSlide2 = false;

window.addEventListener('keydown', function(e) {
    keys[e.key] = true;
    if (gameState === 'name_input') {
        handleNameInput(e.key);
    }
});
window.addEventListener('keyup', function(e) {
    keys[e.key] = false;
});

window.addEventListener("gamepadconnected", (e) => {
    gamepads[e.gamepad.index] = e.gamepad;
});

window.addEventListener("gamepaddisconnected", (e) => {
    gamepads[e.gamepad.index] = null;
});

function updateGamepad() {
    const connectedPads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (connectedPads[0]) gamepads[0] = connectedPads[0];
    if (connectedPads[1]) gamepads[1] = connectedPads[1];
}


// --- JÁTÉK OBJEKTUMOK ---

let ball = {
    x: WIDTH / 2, y: HEIGHT / 2, radius: 8, color: 'white',
    vx: 0, vy: 0, friction: 0.985, speedCap: 10
};

// JAVÍTVA: ES6 Class használata (1.1.)
class Player {
    constructor(x, y, color, team) {
        this.x = x; this.y = y; this.radius = 12; this.color = color; this.team = team;
        this.speed = BASE_SPEED; this.sprintTime = MAX_SPRINT_TIME;
        this.vx = 0; this.vy = 0;
        this.moveDirX = 0;
        this.moveDirY = 0;
        this.slideTimer = 0;
        this.yellowCards = 0;
        this.aimDirX = team === 'blue' ? 1 : -1;
        this.aimDirY = 0;
    }

    /**
     * Mozgás, sprint és pálya korlátozás frissítése
     */
    updateMovement(moveX, moveY, isSprintingAttempt) {
        if (this.slideTimer > 0) return; // Ne mozogjon, ha becsúszik/áll fel

        // Sprint logika
        const isMoving = moveX !== 0 || moveY !== 0;
        if (isSprintingAttempt && this.sprintTime > 0 && isMoving) {
            this.speed = BASE_SPEED * SPRINT_MULTIPLIER;
            this.sprintTime = Math.max(0, this.sprintTime - SPRINT_DRAIN_RATE);
        } else {
            this.speed = BASE_SPEED;
            this.sprintTime = Math.min(MAX_SPRINT_TIME, this.sprintTime + SPRINT_RECHARGE_RATE);
        }

        // Sebesség beállítása
        this.vx = moveX * this.speed;
        this.vy = moveY * this.speed;

        // Pozíció frissítése
        this.x += this.vx;
        this.y += this.vy;

        // Utolsó mozgásirány tárolása (rúgáshoz)
        if (isMoving) {
            this.moveDirX = moveX;
            this.moveDirY = moveY;
        }

        // Pálya korlátozás
        this.x = Math.max(this.radius, Math.min(WIDTH - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(HEIGHT - this.radius, this.y));
    }
}

// JÁTÉKOSOK INICIALIZÁLÁSA
let player1 = new Player(WIDTH * 0.25, HEIGHT * 0.5, 'blue', 'blue');
let player2 = new Player(WIDTH * 0.75, HEIGHT * 0.5, 'red', 'red');
let players = [player1, player2];

// --- SEGÉD ÉS FIZIKAI FÜGGVÉNYEK ---

function isInsidePenaltyBox(x, y, team) {
    if (team === 'blue') {
        return x < PENALTY_BOX_WIDTH &&
               y > HEIGHT / 2 - PENALTY_BOX_HEIGHT / 2 &&
               y < HEIGHT / 2 + PENALTY_BOX_HEIGHT / 2;
    } else {
        return x > WIDTH - PENALTY_BOX_WIDTH &&
               y > HEIGHT / 2 - PENALTY_BOX_HEIGHT / 2 &&
               y < HEIGHT / 2 + PENALTY_BOX_HEIGHT / 2;
    }
}

/**
 * Visszaállítja a labda és a játékosok helyzetét.
 */
function resetBall() {
    ball.x = WIDTH / 2; ball.y = HEIGHT / 2; ball.vx = 0; ball.vy = 0;
    player1.x = WIDTH * 0.25; player1.y = HEIGHT * 0.5;
    player2.x = WIDTH * 0.75; player2.y = HEIGHT * 0.5;
    player1.sprintTime = MAX_SPRINT_TIME;
    player2.sprintTime = MAX_SPRINT_TIME;
    player1.slideTimer = 0;
    player2.slideTimer = 0;
    kickerPlayer = null;
    replayBuffer = [];

    player1.yellowCards = 0;
    player2.yellowCards = 0;

    // Alaphelyzetbe állítja a karrier statisztikákat is, HA MÁR A VÉGÉT JELZŐ ÁLLAPOTBAN VAGYUNK
    if (currentMode === 'career' && (gameState === 'finished' || gameState === 'main_menu')) {
         leagueTable.forEach(team => {
             team.played = 0; team.points = 0; team.win = 0; team.draw = 0;
             team.loss = 0; team.goalsFor = 0; team.goalsAgainst = 0; team.diff = 0;
             if (team.isPlayer) team.name = playerName; // Biztosítja a friss nevet
         });
    }
}

function dist(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

// Szabálytalanság ellenőrzése és büntetés kiosztása
function checkFoul(slidingPlayer, targetPlayer) {

    const distPlayerToPlayer = dist(slidingPlayer.x, slidingPlayer.y, targetPlayer.x, targetPlayer.y);
    const minPlayerDist = slidingPlayer.radius + targetPlayer.radius;

    if (distPlayerToPlayer < minPlayerDist) {
        if (slidingPlayer.slideTimer > SLIDE_RECOVERY) {

            const distSlideToBall = dist(slidingPlayer.x, slidingPlayer.y, ball.x, ball.y);
            const distTargetToBall = dist(targetPlayer.x, targetPlayer.y, ball.x, ball.y);

            if (distSlideToBall > FOUL_LABDA_TAVOLSAG && distTargetToBall < distSlideToBall) {

                const victimTeam = targetPlayer.team;
                const isPenalty = isInsidePenaltyBox(slidingPlayer.x, slidingPlayer.y, victimTeam);

                if (slidingPlayer.yellowCards < 1) {
                    slidingPlayer.yellowCards = 1;
                }

                if (isPenalty) {
                    gameState = 'penalty';
                } else {
                    gameState = 'foul_kick';
                }

                goalTimer = FOUL_KICK_PAUSE;
                setupFoulKick(targetPlayer, isPenalty);

                return true;
            }
        }
    }
    return false;
}

// Szabadrúgás/Tizenegyes beállítása
function setupFoulKick(foulVictim, isPenalty) {
    const isVictimBlue = foulVictim.team === 'blue';
    const opponent = isVictimBlue ? player2 : player1;

    kickerPlayer = foulVictim;

    ball.vx = 0; ball.vy = 0;
    players.forEach(p => { p.vx = 0; p.vy = 0; p.slideTimer = 0; });

    // Alapértelmezett célzás a kapu felé
    foulVictim.aimDirX = isVictimBlue ? 1 : -1;
    foulVictim.aimDirY = 0;

    if (isPenalty) {
        // Tizenegyes
        ball.x = isVictimBlue ? PENALTY_SPOT_DIST : WIDTH - PENALTY_SPOT_DIST;
        ball.y = HEIGHT / 2;

        foulVictim.x = ball.x + (isVictimBlue ? -15 : 15);
        foulVictim.y = ball.y;

        opponent.x = isVictimBlue ? WIDTH - GOAL_WIDTH - opponent.radius : GOAL_WIDTH + opponent.radius;
        opponent.y = HEIGHT / 2;

        players.forEach(p => {
            if (p !== foulVictim && p !== opponent) {
                p.x = WIDTH / 2; p.y = HEIGHT / 2;
            }
        });

    } else {
        // Szabadrúgás

        ball.x = ball.x;
        ball.y = ball.y;

        foulVictim.x = ball.x + (isVictimBlue ? -15 : 15);
        foulVictim.y = ball.y;

        // Mindenki menjen el a labda közeléből (középső körbe)
        players.forEach(p => {
             if (p !== foulVictim) {
                 const d = dist(p.x, p.y, ball.x, ball.y);
                 if (d < CENTER_CIRCLE_RADIUS * 1.5) {
                      p.x = WIDTH / 2;
                      p.y = HEIGHT / 2;
                 }
            }
        });
    }

    foulVictim.moveDirX = 0;
    foulVictim.moveDirY = 0;
}


function checkCollision(p) {

    if (gameState === 'foul_kick' || gameState === 'penalty') {
         return;
    }

    const dx = ball.x - p.x; const dy = ball.y - p.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = ball.radius + p.radius;

    if (distance < minDistance) {
        const normalX = dx / distance; const normalY = dy / distance;
        const overlap = minDistance - distance;
        ball.x += normalX * overlap; ball.y += normalY * overlap;

        if (p.slideTimer > SLIDE_RECOVERY) {
             ball.vx = normalX * KICK_POWER * 1.5;
             ball.vy = normalY * KICK_POWER * 1.5;
             p.slideTimer = SLIDE_RECOVERY;
        } else {
             ball.vx = p.vx * 1.5 + normalX * 1;
             ball.vy = p.vy * 1.5 + normalY * 1;
        }

        const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (currentSpeed > ball.speedCap) {
            ball.vx = (ball.vx / currentSpeed) * ball.speedCap;
            ball.vy = (ball.vy / currentSpeed) * ball.speedCap;
        }
    }
}

function applyKickLogic(player, isKickAttempt) {
    const isFreeKickState = gameState === 'foul_kick' || gameState === 'penalty';
    const isKicker = isFreeKickState ? (player === kickerPlayer) : true;

    if (!isKicker || !isKickAttempt || player.slideTimer > 0) return;

    const dx = ball.x - player.x;
    const dy = ball.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= player.radius + ball.radius + KICK_DISTANCE) {

        let kickDirX, kickDirY;

        if (isFreeKickState) {
            // Szabadrúgás alatt a labda irányát a CÉLZÁS határozza meg
            kickDirX = player.aimDirX;
            kickDirY = player.aimDirY;
        } else {
            // Normál játék alatt a mozgásirány (vagy labda iránya)
            kickDirX = player.moveDirX;
            kickDirY = player.moveDirY;

            if (kickDirX === 0 && kickDirY === 0) {
                 const angle = Math.atan2(dy, dx);
                 kickDirX = Math.cos(angle);
                 kickDirY = Math.sin(angle);
            }
        }

        const magnitude = Math.sqrt(kickDirX * kickDirX + kickDirY * kickDirY);
        if (magnitude > 0) {
            kickDirX /= magnitude;
            kickDirY /= magnitude;
        }

        ball.vx += kickDirX * KICK_POWER;
        ball.vy += kickDirY * KICK_POWER;
        
        playKickSound(); // HANG LEJÁTSZÁSA (2.1.)

        const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (currentSpeed > ball.speedCap) {
             ball.vx = (ball.vx / currentSpeed) * ball.speedCap;
             ball.vy = (ball.vy / currentSpeed) * ball.speedCap;
        }

        if (isFreeKickState) {
            gameState = 'playing';
            kickerPlayer = null;
            players.forEach(checkCollision);
        }
    }
}

function applySlideLogic(player, isSlideAttempt, moveX, moveY) {
    if (player.slideTimer > 0) {
        player.slideTimer--;

        if (player.slideTimer > SLIDE_RECOVERY) {
            player.vx *= SLIDE_FRICTION;
            player.vy *= SLIDE_FRICTION;
        } else {
            player.vx = 0;
            player.vy = 0;
            player.speed = BASE_SPEED;
            player.sprintTime = Math.min(MAX_SPRINT_TIME, player.sprintTime + SPRINT_RECHARGE_RATE);
        }

        return true;
    }

    if (isSlideAttempt && (Math.abs(moveX) > 0 || Math.abs(moveY) > 0)) {
        player.slideTimer = SLIDE_TIME + SLIDE_RECOVERY;

        player.moveDirX = moveX;
        player.moveDirY = moveY;

        const direction = Math.sqrt(moveX * moveX + moveY * moveY);
        if (direction > 0) {
            player.vx = (moveX / direction) * BASE_SPEED * SLIDE_BOOST;
            player.vy = (moveY / direction) * BASE_SPEED * SLIDE_BOOST;
        } else {
             player.slideTimer = 0;
             return false;
        }

        player.sprintTime = Math.max(0, player.sprintTime - MAX_SPRINT_TIME / 4);
        return true;
    }

    return false;
}

function saveStateToReplayBuffer() {
    replayBuffer.push({
        ballX: ball.x, ballY: ball.y,
        p1X: player1.x, p1Y: player1.y,
        p2X: player2.x, p2Y: player2.y,
        p1Sprint: player1.sprintTime,
        p2Sprint: player2.sprintTime,
        p1SlideTimer: player1.slideTimer,
        p2SlideTimer: player2.slideTimer,
        p1Yellow: player1.yellowCards,
        p2Yellow: player2.yellowCards,
    });
    if (replayBuffer.length > REPLAY_BUFFER_SIZE) {
        replayBuffer.shift();
    }
}


// --- RAJZOLÓ FÜGGVÉNYEK ---
function drawKickAim(p) {
    if (!p) return;

    const startX = ball.x;
    const startY = ball.y;

    const aimX = p.aimDirX;
    const aimY = p.aimDirY;

    const magnitude = Math.sqrt(aimX * aimX + aimY * aimY);
    let dirX = aimX;
    let dirY = aimY;

    if (magnitude > 0) {
        dirX /= magnitude;
        dirY /= magnitude;
    } else {
        dirX = p.team === 'blue' ? 1 : -1;
        dirY = 0;
    }

    const endX = startX + dirX * AIM_LINE_LENGTH;
    const endY = startY + dirY * AIM_LINE_LENGTH;

    ctx.strokeStyle = p.team === 'blue' ? 'rgba(0, 100, 255, 0.7)' : 'rgba(255, 0, 0, 0.7)';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 5]);

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(endX, endY, 8, 0, Math.PI * 2);
    ctx.fillStyle = p.team === 'blue' ? 'blue' : 'red';
    ctx.fill();
    ctx.closePath();
}


function drawGameObjects(state, p1, p2, b) {
    
    // ÁRNYÉK BEÁLLÍTÁSA (3D-s hatás) (2.2.)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    // 1. Labda
    ctx.beginPath();
    ctx.arc(b.x, b.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.closePath();

    if (state === 'foul_kick' || state === 'penalty') {
        ctx.strokeStyle = '#00FF7F'; // Neon zöld keret a fókuszra
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(b.x, b.y, ball.radius, 0, Math.PI * 2);
        ctx.stroke();
        drawKickAim(kickerPlayer);
    }

    // 2. Játékosok
    drawPlayer(p1);
    drawPlayer(p2);

    // 3. Kitartás sáv (csak normál játékban)
    if (state === 'playing') {
        drawStaminaBar(p1);
        // Csak akkor rajzolja a 2. játékosét, ha nem bot
        if (!isBotActive) {
            drawStaminaBar(p2);
        }
    }
    
    // ÁRNYÉK VISSZAÁLLÍTÁSA (2.2.)
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function drawPlayer(p) {
    const isSprinting = p.speed > BASE_SPEED;
    const isSliding = p.slideTimer > SLIDE_RECOVERY;
    const isRecovering = p.slideTimer > 0 && !isSliding;

    let color = p.color;

    if (isSliding) {
        color = 'white';
        ctx.strokeStyle = p.color === 'blue' ? '#00FF7F' : '#00FF7F'; // Neon zöld akcentus becsúszásnál
        ctx.lineWidth = 3;
    } else if (isRecovering) {
        color = 'gray'; // Lassú visszatöltéskor szürke
    }

    // Játékos háttér (a mez)
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();

    // Kontúrvonal
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();

    // Sprint kontúr
    if (isSprinting && !isSliding) {
        ctx.strokeStyle = p.team === 'blue' ? '#00FFFF' : '#FF4500'; // Világoskék/narancs kontúr sprinteléskor
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + 1.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.closePath();
        ctx.lineWidth = 1.5; // Visszaállítva
    }
}

function drawStaminaBar(player) {
    const barWidth = 30; const barHeight = 4;
    const currentWidth = (player.sprintTime / MAX_SPRINT_TIME) * barWidth;
    const isRecovering = player.slideTimer > 0 && player.slideTimer <= SLIDE_RECOVERY;

    ctx.fillStyle = '#555555'; // Sötétszürke háttér
    ctx.fillRect(player.x - barWidth / 2, player.y - player.radius - barHeight * 2, barWidth, barHeight);

    if (isRecovering) {
        ctx.fillStyle = '#FFA500'; // Narancs büntetés
        ctx.font = '10px Arial, sans-serif'; 
        ctx.textAlign = 'center'; 
        ctx.fillText("BÜNTETÉS", player.x, player.y - player.radius - barHeight * 3 - 2);
    } else if (player.sprintTime / MAX_SPRINT_TIME > 0.5) {
        ctx.fillStyle = '#00FF00'; // Zöld
    } else if (player.sprintTime / MAX_SPRINT_TIME > 0.2) {
        ctx.fillStyle = '#FFFF00'; // Sárga
    } else {
        ctx.fillStyle = '#FF0000'; // Piros
    }

    ctx.fillRect(player.x - barWidth / 2, player.y - player.radius - barHeight * 2, currentWidth, barHeight);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(player.x - barWidth / 2, player.y - player.radius - barHeight * 2, barWidth, barHeight);
}


// --- SZURKOLÓ TÖMEG PARAMÉTEREK ÉS RAJZOLÁSA ---
const CROWD_ROW_COUNT = 5;      // Sorok száma
const CROWD_FANS_PER_ROW = 120; // Szurkolók száma egy sorban
const FAN_WIDTH = 6;
const FAN_HEIGHT = 10;
const FAN_SPACING_X = 4;
const FAN_SPACING_Y = 10;
const WAVE_SPEED = 0.04; 

// ÚJ: Rajzolja a szurkolókat a pálya ZÖLD HÁTTERE ELŐTT
function drawCrowd() {
    
    // Szurkolók rajzolása a vászon felső és alsó szélére.
    for (let row = 0; row < CROWD_ROW_COUNT; row++) {
        for (let col = 0; col < CROWD_FANS_PER_ROW; col++) {
            
            // Kezdő pozíció: Középre igazítjuk a tömeget
            const totalWidth = CROWD_FANS_PER_ROW * (FAN_WIDTH + FAN_SPACING_X);
            const startX = (WIDTH - totalWidth) / 2;
            const x = startX + col * (FAN_WIDTH + FAN_SPACING_X);

            // Hullám effektus kiszámítása
            const waveOffset = Math.sin(frameCounter * WAVE_SPEED + col * 0.3 + row * 0.5);
            
            // Magasság beállítása
            const baseHeight = FAN_HEIGHT + row * 2; 
            const animatedHeight = baseHeight + (waveOffset * 4); // 4 pixel magasság ingadozás

            // Szín beállítása (váltakozó szín a tömegben)
            ctx.fillStyle = (col % 2 === 0) ? '#FFFFFF' : '#AAAAAA'; // Fehér és világosszürke

            // 1. Felső tömeg
            // A vászon tetejéről rajzolva, Y koordináta növekszik
            let yTop = 0 + (row * FAN_SPACING_Y);
            ctx.fillRect(x, yTop, FAN_WIDTH, animatedHeight); 

            // 2. Alsó tömeg
            // A vászon aljáról rajzolva, Y koordináta csökken
            let yBottom = HEIGHT - (row * FAN_SPACING_Y);
            ctx.fillRect(x, yBottom - animatedHeight, FAN_WIDTH, animatedHeight); 
        }
    }
}


/**
 * Letisztult Pálya rajzolás.
 */
function drawPitch() {
    const COLOR_LIGHT = '#689F38';
    const COLOR_DARK = '#558B2F';
    const STRIPE_COUNT = 10;
    const stripeWidth = WIDTH / STRIPE_COUNT;
    const GOAL_WIDTH = 5; // Vékonyabb kapu
    const GOAL_HEIGHT = 100;
    const PENALTY_BOX_WIDTH = 60;
    const PENALTY_BOX_HEIGHT = 200;
    const PENALTY_SPOT_DIST = 40;
    const CENTER_CIRCLE_RADIUS = 50;

    // 1. Fű Textúra (Világosabb és sötétebb zöld csíkok)
    for (let i = 0; i < STRIPE_COUNT; i++) {
        ctx.fillStyle = (i % 2 === 0) ? COLOR_LIGHT : COLOR_DARK;
        ctx.fillRect(i * stripeWidth, 0, stripeWidth, HEIGHT);
    }

    // 2. Fehér vonalak (középvonal, tizenegyes terület, stb.)
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;

    ctx.beginPath(); // Középvonal
    ctx.moveTo(WIDTH / 2, 0);
    ctx.lineTo(WIDTH / 2, HEIGHT);
    ctx.stroke();

    ctx.beginPath(); // Középső kör
    ctx.arc(WIDTH / 2, HEIGHT / 2, CENTER_CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    // Segédfüggvény a tizenegyes terület rajzolásához
    function drawPenaltyArea(isBlueTeam) {
        ctx.beginPath();

        let x, sign;
        if (isBlueTeam) {
            x = 0;
            sign = 1;
        } else {
            x = WIDTH;
            sign = -1;
        }

        // Tizenegyes terület rajzolása
        ctx.rect(
            x,
            HEIGHT / 2 - PENALTY_BOX_HEIGHT / 2,
            PENALTY_BOX_WIDTH * sign,
            PENALTY_BOX_HEIGHT
        );
        ctx.stroke();

        // Tizenegyes pont
        const spotX = x + PENALTY_SPOT_DIST * sign;
        ctx.beginPath();
        ctx.arc(spotX, HEIGHT / 2, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();
    }

    drawPenaltyArea(true);
    drawPenaltyArea(false);

    // 3. KAPUK RAJZOLÁSA (Egyszerűsítve - Nincs mélység, csak keret)
    const netDepth = 15;
    const netSpacing = 10;

    // Kék Kapu (Bal oldalon)
    const blueGoalX = 0;
    const blueGoalY = HEIGHT / 2 - GOAL_HEIGHT / 2;
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.strokeRect(blueGoalX, blueGoalY, GOAL_WIDTH, GOAL_HEIGHT);
    
    // Háló Rajzolása (Letisztult, csak vonalak a keret mögött)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    for (let y = blueGoalY + netSpacing; y < blueGoalY + GOAL_HEIGHT; y += netSpacing) {
         ctx.beginPath(); ctx.moveTo(blueGoalX + GOAL_WIDTH, y); ctx.lineTo(blueGoalX + GOAL_WIDTH + netDepth, y); ctx.stroke();
    }
    for (let x = blueGoalX + GOAL_WIDTH; x < blueGoalX + GOAL_WIDTH + netDepth; x += netSpacing) {
         ctx.beginPath(); ctx.moveTo(x, blueGoalY); ctx.lineTo(x, blueGoalY + GOAL_HEIGHT); ctx.stroke();
    }
    

    // Piros Kapu (Jobb oldalon)
    const redGoalX = WIDTH - GOAL_WIDTH;
    const redGoalY = HEIGHT / 2 - GOAL_HEIGHT / 2;

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.strokeRect(redGoalX, redGoalY, GOAL_WIDTH, GOAL_HEIGHT);

    // Háló Rajzolása
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    for (let y = redGoalY + netSpacing; y < redGoalY + GOAL_HEIGHT; y += netSpacing) {
         ctx.beginPath(); ctx.moveTo(redGoalX, y); ctx.lineTo(redGoalX - netDepth, y); ctx.stroke();
    }
    for (let x = redGoalX - netDepth; x < redGoalX; x += netSpacing) {
         ctx.beginPath(); ctx.moveTo(x, redGoalY); ctx.lineTo(x, redGoalY + GOAL_HEIGHT); ctx.stroke();
    }
}


// --- KIJELZŐ ÉS EREDMÉNY RAJZOLÁS ---

function getCardText(player) {
    if (player.yellowCards === 1) {
        return "🟨"; // Sárga lap
    } else if (player.yellowCards === 2) {
        return "🟥"; // Piros lap (kizárás - bár a kód nem kezeli a kizárást, de jelzi a lapot)
    }
    return "";
}

function drawScoreboard() {
    ctx.textAlign = 'center';
    const minutes = Math.floor(timeLeftSeconds / 60);
    const seconds = timeLeftSeconds % 60;
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // 1. CSAPAT NEVEK (Eredmény felett)
    ctx.font = '22px Arial, sans-serif';
    ctx.fillStyle = '#ADD8E6'; // Világoskék
    ctx.fillText(playerName, WIDTH / 2 - 120, 30);
    ctx.fillStyle = '#FFA07A'; // Világospiros
    ctx.fillText(currentMode === 'career' ? opponentName : 'PIROS JÁTÉKOS', WIDTH / 2 + 120, 30);

    // 2. EREDMÉNY (Kiemelt)
    ctx.font = 'bold 50px Arial, sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText(scoreBlue, WIDTH / 2 - 120, 75);
    ctx.fillText(scoreRed, WIDTH / 2 + 120, 75);

    // 3. Idő (Középen)
    ctx.font = '30px Arial, sans-serif';
    ctx.fillStyle = '#00FF7F'; // Neon zöld akcentusszín
    ctx.fillText(timeString, WIDTH / 2, 70);

    // 4. KÁRTYÁK AZ EREDMÉNYJELZŐN
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial, sans-serif';
    // Kék csapat kártyái
    const cardTextBlue = getCardText(player1);
    ctx.fillText(cardTextBlue, WIDTH / 2 - 150, 65);
    // Piros csapat kártyái
    const cardTextRed = getCardText(player2);
    ctx.fillText(cardTextRed, WIDTH / 2 + 150, 65);
}

/**
 * LETISZTULT Intro rajzolása.
 */
function drawModernIntro() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.98)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#00FF7F';
    ctx.font = `bold 100px Arial, sans-serif`;
    ctx.fillText(`FOCI MINI JÁTÉK`, WIDTH / 2, HEIGHT / 2 - 50);

    const opacity = (Math.sin(frameCounter * 0.1) + 1) / 2;
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.font = `24px Arial, sans-serif`;
    ctx.fillText("Nyomj meg egy gombot a kezdéshez!", WIDTH / 2, HEIGHT / 2 + 50);
}

/**
 * Letisztult Háttér menühöz (Foci hangulat)
 */
function drawFCBackground() {
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Foci motívum (opcionális)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.font = `bold 150px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`⚽`, WIDTH / 2, HEIGHT / 2);
}

/**
 * Főmenü rajzolása.
 */
function drawMainMenu(menuItems) {
    drawFCBackground();

    ctx.textAlign = 'left';
    ctx.fillStyle = 'white';
    ctx.font = `bold 70px Arial, sans-serif`;
    ctx.fillText(`FŐMENÜ`, 40, 80);

    const menuX = 40;
    const menuY = 200;
    const lineHeight = 70;
    const accentColor = '#00FF7F'; // Neon zöld

    menuItems.forEach((item, index) => {
        const y = menuY + index * lineHeight;

        if (index === selectedMenuItem) {
            // Neon aláhúzás a kiválasztott elem alatt
            ctx.fillStyle = accentColor;
            ctx.fillRect(menuX, y + 5, item.text.length * 25, 3); // Dinamikus aláhúzás a szöveg hossza alapján
            ctx.fillStyle = accentColor;
            ctx.font = `bold 50px Arial, sans-serif`;
        } else {
            ctx.fillStyle = 'white';
            ctx.font = `45px Arial, sans-serif`;
        }
        ctx.fillText(item.text, menuX, y);
    });

    // Utasítások
    ctx.textAlign = 'center';
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '20px Arial, sans-serif';
    ctx.fillText("W/S (Fel/Le) | X (Kiválaszt)", WIDTH / 2, HEIGHT - 30);
}

/**
 * ÚJ FÜGGVÉNY: Irányítás/Súgó menü rajzolása.
 */
function drawControls() {
    drawFCBackground();

    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.font = `bold 70px Arial, sans-serif`;
    ctx.fillText(`IRÁNYÍTÁS / SÚGÓ`, WIDTH / 2, 80);

    // Utasítás a visszalépéshez
    ctx.font = `20px Arial, sans-serif`;
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText("Nyomj START gombot (Enter/Space/X) a visszalépéshez", WIDTH / 2, HEIGHT - 30);

    const startY = 180;
    const lineHeight = 40;

    // TÁBLÁZAT FEJLÉC
    ctx.font = `bold 24px Arial, sans-serif`;
    ctx.fillStyle = '#00FF7F'; // Neon zöld
    ctx.fillText("Akció", WIDTH / 2 - 200, startY);
    ctx.fillText("KÉK JÁTÉKOS (P1)", WIDTH / 2, startY);
    ctx.fillText("PIROS JÁTÉKOS (P2)", WIDTH / 2 + 200, startY);

    // ELVÁLASZTÓ VONAL
    ctx.fillStyle = '#333333'; // Sötétszürke elválasztó
    ctx.fillRect(WIDTH / 2 - 350, startY + 5, 700, 2);


    const controls = [
        { action: "Mozgás", p1: "W/A/S/D", p2: "Nyilak (↑↓←→)" },
        { action: "Sprint", p1: "SHIFT", p2: "P" }, // SPRINT JAVÍTVA
        { action: "Rúgás / Tűz", p1: "X / J/I/K/L", p2: ". / Numerikus Pad" },
        { action: "Becsúszás", p1: "Z", p2: "/" }
    ];

    ctx.font = `20px Arial, sans-serif`;

    controls.forEach((c, i) => {
        let y = startY + (i + 1) * lineHeight;

        ctx.fillStyle = 'white';
        ctx.fillText(c.action, WIDTH / 2 - 200, y);

        ctx.fillStyle = '#ADD8E6'; // Kék csapat
        ctx.fillText(c.p1, WIDTH / 2, y);

        ctx.fillStyle = '#FFA07A'; // Piros csapat
        ctx.fillText(c.p2, WIDTH / 2 + 200, y);
    });
}

function drawNameInput() {
    drawFCBackground();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.font = `bold 50px Arial, sans-serif`;
    ctx.fillText("CSAPAT NÉV MEGADÁSA", WIDTH / 2, 150);

    ctx.fillStyle = '#AAAAAA';
    ctx.font = `24px Arial, sans-serif`;
    ctx.fillText("Max 15 karakter. Enter a megerősítéshez.", WIDTH / 2, 200);

    // Bemeneti mező (egyszerű keret)
    ctx.strokeStyle = '#00FF7F';
    ctx.lineWidth = 3;
    ctx.strokeRect(WIDTH / 2 - 250, HEIGHT / 2 - 30, 500, 60);

    // Beírt szöveg
    ctx.fillStyle = 'white';
    ctx.font = `bold 40px Arial, sans-serif`;
    ctx.fillText(currentNameInput + (frameCounter % 30 < 15 ? '|' : ''), WIDTH / 2, HEIGHT / 2 + 15);

    ctx.fillStyle = 'red';
    ctx.font = `20px Arial, sans-serif`;
    if (currentNameInput.length > 15) {
        ctx.fillText("Túl hosszú név!", WIDTH / 2, HEIGHT / 2 + 80);
    }
}

/**
 * LETISZTULT Karrier Menü rajzolása (TABELLA NÉLKÜL).
 */
function drawCareerMenu() {
    drawFCBackground();
    ctx.textAlign = 'left';
    ctx.fillStyle = 'white';
    ctx.font = `bold 70px Arial, sans-serif`;
    ctx.fillText(`KARRIER MÓD`, 40, 80);

    // Al-cím (Játékos neve)
    ctx.font = `30px Arial, sans-serif`;
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText(`${playerName}`, 40, 140);

    // Karrier Infó
    ctx.font = `20px Arial, sans-serif`;
    ctx.fillStyle = '#00FF7F';
    ctx.fillText(`Forduló: ${currentMatchDay} / ${MAX_MATCH_DAYS}`, 40, 180);

    // Eredmény Visszajelzés
    if (lastMatchResult) {
        ctx.font = `bold 24px Arial, sans-serif`;
        ctx.fillStyle = lastMatchResult.color;
        ctx.fillText(`Utolsó meccs: ${lastMatchResult.text}`, 40, 220);
    }

    const menuX = 40;
    const menuY = 300;
    const lineHeight = 70;
    const accentColor = '#00FF7F'; // Neon zöld

    let menuItems = careerMenuItems;
    if (currentMatchDay > MAX_MATCH_DAYS) {
        // Karrier vége
        menuItems = [{ text: "Tabella (Végeredmény)", action: "view_table" }, { text: "Karrier Kilépés (Főmenü)", action: "exit_career" }];
    }

    menuItems.forEach((item, index) => {
        const y = menuY + index * lineHeight;

        if (index === selectedMenuItem) {
            // Neon aláhúzás a kiválasztott elem alatt
            ctx.fillStyle = accentColor;
            ctx.fillRect(menuX, y + 5, item.text.length * 25, 3);
            ctx.fillStyle = accentColor;
            ctx.font = `bold 50px Arial, sans-serif`;
        } else {
            ctx.fillStyle = 'white';
            ctx.font = `45px Arial, sans-serif`;
        }
        ctx.fillText(item.text, menuX, y);
    });

    // Utasítások
    ctx.textAlign = 'center';
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '20px Arial, sans-serif';
    ctx.fillText("W/S (Fel/Le) | X (Kiválaszt)", WIDTH / 2, HEIGHT - 30);
}

function drawLeagueTable() {
    drawFCBackground();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.font = `bold 70px Arial, sans-serif`;
    ctx.fillText(`BAJNOKI TABELLA`, WIDTH / 2, 80);

    // Utasítás a visszalépéshez
    ctx.font = `20px Arial, sans-serif`;
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText("Nyomj START gombot (Enter/Space/X) a visszalépéshez", WIDTH / 2, HEIGHT - 30);

    // --- BAJNOKI TABELLA MEGJELENÍTÉSE ---
    const tableStartY = 160;
    const rowHeight = 35; // Hozzáadva diff (50)
    const columnWidths = [30, 180, 40, 40, 40, 40, 40, 50];
    let currentX = 40;

    // Fejléc
    ctx.fillStyle = '#AAAAAA';
    ctx.font = `bold 16px Arial, sans-serif`;
    ctx.textAlign = 'center';
    currentX = 40;
    const headers = ["#", "Csapatnév", "M", "GY", "D", "V", "GK", "P"]; // GK = Gólkülönbség
    headers.forEach((header, i) => {
        let headerX = currentX + (i === 1 ? 5 : columnWidths[i] / 2);
        ctx.fillText(header, headerX, tableStartY);
        currentX += columnWidths[i];
    });

    currentX = 40;
    ctx.fillStyle = '#333333'; // Sötétszürke elválasztó
    ctx.fillRect(currentX, tableStartY + 5, columnWidths.reduce((a, b) => a + b), 2);

    // Sorok
    leagueTable.forEach((team, index) => {
        let y = tableStartY + (index + 1) * rowHeight;
        let x = 40;

        // Csapat kiemelése
        ctx.fillStyle = team.isPlayer ? '#00FF7F' : 'white';
        ctx.font = team.isPlayer ? `bold 18px Arial, sans-serif` : `16px Arial, sans-serif`;

        const data = [
            index + 1,
            team.name,
            team.played,
            team.win,
            team.draw,
            team.loss,
            team.diff,
            team.points
        ];

        data.forEach((value, i) => {
            let columnX = x + (i === 1 ? 5 : columnWidths[i] / 2); // Csapatnév igazítása balra
            ctx.textAlign = (i === 1) ? 'left' : 'center';
            ctx.fillText(value, columnX, y);
            x += columnWidths[i];
        });
    });
}

function drawFoulText(text, timer) {
    if (timer < FOUL_KICK_PAUSE) {
        const minScale = 1.0;
        const maxScale = 1.5;
        let scale, opacity;

        if (timer < FOUL_KICK_PAUSE / 2) {
            scale = minScale + (maxScale - minScale) * (timer / (FOUL_KICK_PAUSE / 2));
            opacity = (timer / (FOUL_KICK_PAUSE / 2));
        } else {
            scale = maxScale - (maxScale - minScale) * ((timer - FOUL_KICK_PAUSE / 2) / (FOUL_KICK_PAUSE / 2));
            opacity = 1.0 - ((timer - FOUL_KICK_PAUSE / 2) / (FOUL_KICK_PAUSE / 2));
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.textAlign = 'center';
        ctx.font = `bold ${Math.floor(60 * scale)}px Arial, sans-serif`;
        ctx.fillText(text, WIDTH / 2, HEIGHT / 2 + 10);
    }
}


function drawReplayText(text, timer) {
    const minScale = 1.0;
    const maxScale = 1.5;
    let scale, opacity;

    if (timer < REPLAY_TEXT_TIME / 2) {
        scale = minScale + (maxScale - minScale) * (timer / (REPLAY_TEXT_TIME / 2));
        opacity = (timer / (REPLAY_TEXT_TIME / 2));
    } else {
        scale = maxScale - (maxScale - minScale) * ((timer - REPLAY_TEXT_TIME / 2) / (REPLAY_TEXT_TIME / 2));
        opacity = 1.0 - ((timer - REPLAY_TEXT_TIME / 2) / (REPLAY_TEXT_TIME / 2));
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = `rgba(0, 255, 127, ${opacity})`; // Mindig neon zöld
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.floor(72 * scale)}px Arial, sans-serif`;
    ctx.fillText(text, WIDTH / 2, HEIGHT / 2 + 20);
}

// Meccs Előkészítő képernyő (LETISZTULT stílus)
function drawMatchSetup() {
    drawFCBackground();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.font = `40px Arial, sans-serif`;
    ctx.fillText(`${currentMode === 'career' ? 'Forduló ' + currentMatchDay + '.' : 'Helyi 1v1'}`, WIDTH / 2, HEIGHT / 2 - 100);

    ctx.fillStyle = 'white';
    ctx.font = `bold 60px Arial, sans-serif`;
    const horizontalSpacing = 200;

    ctx.fillStyle = 'blue';
    ctx.fillText(playerName, WIDTH / 2 - horizontalSpacing, HEIGHT / 2);

    ctx.fillStyle = 'white';
    ctx.fillText("VS", WIDTH / 2, HEIGHT / 2);

    ctx.fillStyle = 'red';
    ctx.fillText(currentMode === 'career' ? opponentName : 'PIROS JÁTÉKOS', WIDTH / 2 + horizontalSpacing, HEIGHT / 2);

    ctx.fillStyle = '#00FF7F';
    ctx.font = `30px Arial, sans-serif`;
    ctx.fillText("Nyomj meg egy gombot a kezdéshez!", WIDTH / 2, HEIGHT / 2 + 100);
}

// --- JÁTÉKOS BEVITEL LOGIKA ---
function handleNameInput(key) {
    if (gameState !== 'name_input') return;

    if (key === 'Enter') {
        if (currentNameInput.length > 0 && currentNameInput.length <= 15) {
            playerName = currentNameInput.toUpperCase();
            gameState = 'career_menu';
        }
    } else if (key === 'Backspace') {
        currentNameInput = currentNameInput.slice(0, -1);
    } else if (key.length === 1 && key.match(/[a-zA-Z0-9\s]/) && currentNameInput.length < 15) {
        currentNameInput += key;
    }
}


// --- JÁTÉK LOGIKA ÉS FRISSÍTÉS ---

function getNextOpponent(matchDay) {
    // Nagyon egyszerű párosítás: a soron következő nem-játékos csapat
    const opponentIndex = (matchDay - 1) % careerOpponents.length;
    return careerOpponents[opponentIndex];
}

function updateGameLogic() {
    updateGamepad();

    // INPUT KEZELÉS (JÁTÉKOS 1)
    let moveX1 = 0; let moveY1 = 0;
    let aimX1 = 0; let aimY1 = 0;
    let isSprinting1 = keys['Shift'] || (gamepads[0] && gamepads[0].buttons[4] && gamepads[0].buttons[4].pressed);
    let currentKick1 = keys['x'] || (gamepads[0] && gamepads[0].buttons[0] && gamepads[0].buttons[0].pressed);
    let isKick1 = currentKick1 && !lastKick1;
    lastKick1 = currentKick1;
    let currentSlide1 = keys['z'] || (gamepads[0] && gamepads[0].buttons[1] && gamepads[0].buttons[1].pressed);
    let isSlide1 = currentSlide1 && !lastSlide1;
    lastSlide1 = currentSlide1;
    const deadZone = 0.2;

    if (gamepads[0] && gamepads[0].axes.length >= 4) {
        moveX1 = gamepads[0].axes[0];
        moveY1 = gamepads[0].axes[1];
        aimX1 = gamepads[0].axes[2];
        aimY1 = gamepads[0].axes[3];
        if (Math.abs(moveX1) < deadZone) moveX1 = 0;
        if (Math.abs(moveY1) < deadZone) moveY1 = 0;
        if (Math.abs(aimX1) < deadZone) aimX1 = 0;
        if (Math.abs(aimY1) < deadZone) aimY1 = 0;
    }

    if (moveX1 === 0 && moveY1 === 0) {
        if (keys['w'] || keys['W']) moveY1 = -1;
        if (keys['s'] || keys['S']) moveY1 = 1;
        if (keys['a'] || keys['A']) moveX1 = -1;
        if (keys['d'] || keys['D']) moveX1 = 1;
    }
    if (aimX1 === 0 && aimY1 === 0) {
        if (keys['i'] || keys['I']) aimY1 = -1;
        if (keys['k'] || keys['K']) aimY1 = 1;
        if (keys['j'] || keys['J']) aimX1 = -1;
        if (keys['l'] || keys['L']) aimX1 = 1;
    }


    let skipTriggered = keys['Enter'] || keys[' '] || (gamepads[0] && gamepads[0].buttons[9] && gamepads[0].buttons[9].pressed);
    let currentSkipPressed = skipTriggered;
    skipTriggered = currentSkipPressed && !skipPressedLastFrame;
    skipPressedLastFrame = currentSkipPressed;

    // --- INTRO/MENÜ ÁLLAPOTOK KEZELÉSE ---
    if (gameState === 'intro') {
        introTimer--;
        if (introTimer <= 0 || skipTriggered) {
            gameState = 'main_menu';
        }
        return;
    }

    // JAVÍTÁS 2: hasznaljuk az isKick1-et, hogy ne válasszon ki azonnal egy menüpontot
    if (gameState === 'main_menu') {
        handleMenuInput(mainMenuItems, moveY1, isKick1); 
        return;
    }

    if (gameState === 'name_input') {
        // A név bevitelt a keydown event listener kezeli.
        return;
    }

    if (gameState === 'controls') { // ÚJ ÁLLAPOT KEZELÉS
        if (skipTriggered || isKick1) {
            gameState = 'main_menu';
            selectedMenuItem = mainMenuItems.findIndex(item => item.action === 'controls'); // Visszaugrik a menüpontra
        }
        return;
    }

    // JAVÍTÁS 1: Kilépés a tabelláról
    if (gameState === 'career_table') {
         if (skipTriggered || isKick1) {
            gameState = 'career_menu';
            // Visszaugrik a "Tabella megtekintése" menüpontra
            selectedMenuItem = careerMenuItems.findIndex(item => item.action === 'view_table'); 
         }
         return;
    }
    
    // JAVÍTÁS 2: hasznaljuk az isKick1-et, hogy ne válasszon ki azonnal egy menüpontot
    if (gameState === 'career_menu') {
        const menuItems = careerMenuItems;
        handleMenuInput(menuItems, moveY1, isKick1); 
        return;
    }

    if (gameState === 'match_setup') {
        if (skipTriggered || isKick1) {
            if (currentMode === 'career') {
                 // Karrier mód: Beállítja az aktuális ellenfelet
                 const nextOpponent = getNextOpponent(currentMatchDay);
                 opponentName = nextOpponent.name;
            }
            gameState = 'playing';
            resetBall();
        }
        return;
    }

    if (gameState === 'finished') {
         if (goalTimer > 0) {
            goalTimer--;
            return;
         }
         // Kilépés a főmenübe
         const anyKeyPressed = Object.values(keys).some(k => k) || (gamepads[0] && gamepads[0].buttons.some(b => b.pressed)) || (gamepads[1] && gamepads[1].buttons.some(b => b.pressed));
         if (anyKeyPressed && !skipPressedLastFrame) {
             // Karrier beállítások resetelése (csak ha Karrier módból jött)
             if (currentMode === 'career') {
                 currentMatchDay = 1;
                 lastMatchResult = null;
                 opponentName = getNextOpponent(1).name;
                 careerMenuItems[0].text = "Következő Meccs Indítása";
             }
             gameState = 'main_menu';
             selectedMenuItem = 0;
         }
         return;
    }

    // --- JÁTÉKOS 2/BOT INPUT KEZELÉS ---
    let moveX2 = 0; let moveY2 = 0;
    let aimX2 = 0; let aimY2 = 0;
    let isSprinting2 = false;
    let isKick2 = false;
    let isSlide2 = false;

    if (isBotActive) {
        const botMove = getBotMove();
        moveX2 = botMove.moveX;
        moveY2 = botMove.moveY;
        isSprinting2 = botMove.isSprint;
        isKick2 = botMove.isKick;
        isSlide2 = botMove.isSlide;
        aimX2 = player2.aimDirX;
        aimY2 = player2.aimDirY;
    } else {
        // PLAYER 2 INPUT (Helyi 1v1)
        isSprinting2 = keys['p'] || (gamepads[1] && gamepads[1].buttons[5] && gamepads[1].buttons[5].pressed);
        currentKick2 = keys['.'] || (gamepads[1] && gamepads[1].buttons[0] && gamepads[1].buttons[0].pressed);
        isKick2 = currentKick2 && !lastKick2;
        lastKick2 = currentKick2;
        currentSlide2 = keys['/'] || (gamepads[1] && gamepads[1].buttons[1] && gamepads[1].buttons[1].pressed);
        isSlide2 = currentSlide2 && !lastSlide2;
        lastSlide2 = currentSlide2;

        if (gamepads[1] && gamepads[1].axes.length >= 4) {
            moveX2 = gamepads[1].axes[0];
            moveY2 = gamepads[1].axes[1];
            aimX2 = gamepads[1].axes[2];
            aimY2 = gamepads[1].axes[3];
            if (Math.abs(moveX2) < deadZone) moveX2 = 0;
            if (Math.abs(moveY2) < deadZone) moveY2 = 0;
            if (Math.abs(aimX2) < deadZone) aimX1 = 0;
            if (Math.abs(aimY2) < deadZone) aimY1 = 0;
        }

        if (moveX2 === 0 && moveY2 === 0) {
            if (keys['ArrowUp']) moveY2 = -1;
            if (keys['ArrowDown']) moveY2 = 1;
            if (keys['ArrowLeft']) moveX2 = -1;
            if (keys['ArrowRight']) moveX2 = 1;
        }
        if (aimX2 === 0 && aimY2 === 0) {
            if (keys['.']) aimY2 = -1;
            if (keys[';']) aimY2 = 1;
            if (keys[',']) aimX2 = -1;
            if (keys['/']) aimX2 = 1;
        }
    }

    const inputData = [
        { p: player1, moveX: moveX1, moveY: moveY1, aimX: aimX1, aimY: aimY1, isSprinting: isSprinting1, isKick: isKick1, isSlide: isSlide1 },
        { p: player2, moveX: moveX2, moveY: moveY2, aimX: aimX2, aimY: aimY2, isSprinting: isSprinting2, isKick: isKick2, isSlide: isSlide2 }
    ];

    // --- FIZIKA FRISSÍTÉS ---

    if (gameState === 'playing' || gameState === 'foul_kick' || gameState === 'penalty') {
        inputData.forEach(({ p, moveX, moveY, aimX, aimY, isSprinting, isKick, isSlide }) => {
            if (p.yellowCards >= 2 && gameState === 'playing') {
                 // Ha piros lapot kapott, nem mozoghat
                 p.vx = 0; p.vy = 0; moveX = 0; moveY = 0; isSprinting = false; p.speed = BASE_SPEED;
            }

            if (gameState === 'foul_kick' || gameState === 'penalty') {
                 // Csak a rúgó játékos és a kapus mozoghat szabadrúgáskor/tizenegyesnél
                 if (p !== kickerPlayer && p.x > PENALTY_BOX_WIDTH && p.x < WIDTH - PENALTY_BOX_WIDTH) {
                      p.vx = 0; p.vy = 0; moveX = 0; moveY = 0; isSprinting = false; p.speed = BASE_SPEED;
                 }
                 // Célzás frissítése: csak a célsáv irányítását engedélyezzük.
                 if (p === kickerPlayer && (aimX !== 0 || aimY !== 0)) {
                    p.aimDirX = aimX;
                    p.aimDirY = aimY;
                 }
            }
            
            // EZ A LÉNYEGES RÉSZ: Becsúszás
            const isSlidingOrRecovering = applySlideLogic(p, isSlide, moveX, moveY);
            
            if (isSlidingOrRecovering) {
                p.x += p.vx;
                p.y += p.vy;
                
                // Becsúszás közbeni szabálytalanság ellenőrzése
                if (gameState === 'playing' && p.slideTimer > SLIDE_RECOVERY) {
                    const otherPlayer = (p === player1) ? player2 : player1;
                    if (checkFoul(p, otherPlayer)) {
                        // Ha szabálytalanság történt, a mozgás leáll
                        p.vx = 0; p.vy = 0;
                        return; 
                    }
                }
                return; 
            }

            // ÚJ: Osztály metódus hívása a mozgás, sprint, korlátozás frissítéséhez (1.2.)
            if (gameState === 'playing' || gameState === 'foul_kick' || gameState === 'penalty') {
                 p.updateMovement(moveX, moveY, isSprinting);
            } else {
                 p.speed = BASE_SPEED; // Ha nem aktív a mozgás, a sprint ne legyen aktív
            }


            applyKickLogic(p, isKick);
        });

        // Labda fizika
        if (gameState === 'playing') {
            players.forEach(checkCollision);
            ball.vx *= ball.friction;
            ball.vy *= ball.friction;
            ball.x += ball.vx;
            ball.y += ball.vy;
        } else {
            ball.vx = 0;
            ball.vy = 0;
        }

        // Labda fal ütközés és GÓL check
        if (ball.y + ball.radius > HEIGHT || ball.y - ball.radius < 0) {
            ball.vy = -ball.vy;
            if (ball.y < ball.radius) ball.y = ball.radius;
            if (ball.y > HEIGHT - ball.radius) ball.y = HEIGHT - ball.radius;
        }

        // GÓL check (csak a bal és jobb oldalon)
        if (ball.x + ball.radius > WIDTH) {
            if (ball.y > HEIGHT / 2 - GOAL_HEIGHT / 2 && ball.y < HEIGHT / 2 + GOAL_HEIGHT / 2) {
                scoreBlue++;
                playGoalSound(); // HANG LEJÁTSZÁSA (2.1.)
                startGoalReplay();
            } else {
                ball.vx = -ball.vx;
                ball.x = WIDTH - ball.radius;
            }
        }
        if (ball.x - ball.radius < 0) {
            if (ball.y > HEIGHT / 2 - GOAL_HEIGHT / 2 && ball.y < HEIGHT / 2 + GOAL_HEIGHT / 2) {
                scoreRed++;
                playGoalSound(); // HANG LEJÁTSZÁSA (2.1.)
                startGoalReplay();
            } else {
                ball.vx = -ball.vx;
                ball.x = ball.radius;
            }
        }

        // Replay puffer frissítése (csak lejátszás alatt)
        if (gameState === 'playing') {
             saveStateToReplayBuffer();
        }

        // Szabadrúgás időzítő
        if (gameState === 'foul_kick' || gameState === 'penalty') {
            goalTimer--;
            if (goalTimer <= 0) {
                 // Ha lejár az idő, a labda szabaddá válik (játék folytatódik)
                 gameState = 'playing';
                 kickerPlayer = null;
                 players.forEach(checkCollision);
            }
        }

    } else if (gameState.includes('replay') || gameState === 'goal_scored') {

        if (gameState === 'replay_intro') {
            goalTimer++;
            if (goalTimer >= REPLAY_TEXT_TIME || skipTriggered) {
                gameState = 'goal_replay';
                replayFrameIndex = 0;
                frameCounter = 0;
            }
        } else if (gameState === 'goal_replay') {
            if (!skipTriggered && (frameCounter % REPLAY_SPEED_FACTOR === 0)) {
                if (replayFrameIndex < replayBuffer.length - 1) {
                    replayFrameIndex++;
                } else {
                    gameState = 'replay_outro';
                    goalTimer = 0;
                }
            } else if (skipTriggered) {
                gameState = 'replay_outro';
                goalTimer = 0;
            }
        } else if (gameState === 'replay_outro') {
            goalTimer++;
            if (goalTimer >= REPLAY_TEXT_TIME || skipTriggered) {
                gameState = 'goal_scored';
                goalTimer = GOAL_PAUSE_TIME;
            }
        } else if (gameState === 'goal_scored') {
            goalTimer--;
            if (goalTimer <= 0) {
                // Gól utáni visszatérés: Karrier/1v1 meccs befejezése (ha lejárt az idő)
                if (timeLeftSeconds <= 0) {
                    if (currentMode === 'career') {
                        finishCareerMatch();
                    } else {
                        gameState = 'finished'; // 1v1 vége
                        goalTimer = ENDGAME_PAULSE;
                    }
                } else {
                    gameState = 'playing';
                    resetBall(); // Csak a labda és a játékosok helyezkednek újra
                }
            }
        }
    }
}

function startGoalReplay() {
    gameState = 'replay_intro';
    goalTimer = 0;
}

function handleMenuInput(menuItems, moveY, isSelect) {

    const currentControlDown = moveY > 0.5;
    const currentControlUp = moveY < -0.5;

    if ((currentControlDown && !menuControlDownLastFrame) || (currentControlUp && !menuControlDownLastFrame)) {
        if (currentControlDown) {
            selectedMenuItem = (selectedMenuItem + 1) % menuItems.length;
        } else if (currentControlUp) {
            selectedMenuItem = (selectedMenuItem - 1 + menuItems.length) % menuItems.length;
        }
    }
    menuControlDownLastFrame = currentControlDown || currentControlUp;

    if (isSelect) {
        const selectedAction = menuItems[selectedMenuItem].action;

        if (selectedAction === "start_career") {
            enterFullscreen();
            currentMode = 'career';
            isBotActive = true;
            currentNameInput = playerName === "JÁTÉKOS CSAPAT" ? "" : playerName;
            gameState = 'name_input';
            selectedMenuItem = 0;
        } else if (selectedAction === "start_1v1") {
            enterFullscreen();
            currentMode = '1v1';
            isBotActive = false;
            playerName = "KÉK JÁTÉKOS";
            gameState = 'match_setup';
        } else if (selectedAction === "controls") { // ÚJ ACTION KEZELÉS
            gameState = 'controls';
            selectedMenuItem = 0; // Menüpont reset
        } else if (selectedAction === "start_match") { 
            if (currentMatchDay <= MAX_MATCH_DAYS) {
                enterFullscreen();
                gameState = 'match_setup';
            } else {
                gameState = 'finished';
            }
        } else if (selectedAction === "view_table") {
            gameState = 'career_table'; // JAVÍTVA: Átállítás a tabella állapotra
            selectedMenuItem = 0;
        } else if (selectedAction === "exit_career") {
            currentMode = '1v1';
            currentMatchDay = 1;
            lastMatchResult = null;
            opponentName = getNextOpponent(1).name;
            careerMenuItems[0].text = "Következő Meccs Indítása";
            gameState = 'main_menu';
            selectedMenuItem = 0;
        }
    }
}

function finishCareerMatch() {
    // 1. Frissíti a játékos csapat statisztikáit
    const playerEntry = leagueTable.find(t => t.isPlayer);
    const opponentEntry = leagueTable.find(t => t.name === opponentName);

    if (!playerEntry || !opponentEntry) {
         console.error("Hiányzó csapatok!");
         return;
    }

    playerEntry.played++;
    opponentEntry.played++;
    playerEntry.goalsFor += scoreBlue;
    playerEntry.goalsAgainst += scoreRed;
    opponentEntry.goalsFor += scoreRed;
    opponentEntry.goalsAgainst += scoreBlue;

    if (scoreBlue > scoreRed) {
        playerEntry.win++;
        playerEntry.points += POINTS_FOR_WIN;
        opponentEntry.loss++;
    } else if (scoreBlue === scoreRed) {
        playerEntry.draw++;
        playerEntry.points += POINTS_FOR_DRAW;
        opponentEntry.draw++;
    } else {
        playerEntry.loss++;
        opponentEntry.win++;
        opponentEntry.points += POINTS_FOR_WIN;
    }

    // Gólkülönbség frissítése
    leagueTable.forEach(team => {
        team.diff = team.goalsFor - team.goalsAgainst;
    });

    // Tabella rendezése
    leagueTable.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.diff !== a.diff) return b.diff - a.diff;
        return b.goalsFor - a.goalsFor;
    });

    let resultText, color;
    if (scoreBlue > scoreRed) {
        resultText = `GYŐZELEM (${scoreBlue}-${scoreRed})`;
        color = 'green';
    } else if (scoreBlue === scoreRed) {
        resultText = `DÖNTETLEN (${scoreBlue}-${scoreRed})`;
        color = 'yellow';
    } else {
        resultText = `VERESÉG (${scoreBlue}-${scoreRed})`;
        color = 'red';
    }
    lastMatchResult = { text: resultText, color: color };
    currentMatchDay++;
    selectedMenuItem = 0;

    if (currentMatchDay <= MAX_MATCH_DAYS) {
        const nextOpponent = getNextOpponent(currentMatchDay);
        opponentName = nextOpponent.name;
    } else {
        opponentName = "NINCS";
        careerMenuItems[0].text = "Karrier Eredmények";
    }

    gameState = 'career_menu';
}

// BOT LOGIKA
function getBotMove() {
    // Nagyon egyszerű bot: mindig a labda felé tart, ha nincs nála a labda
    const bot = player2;
    let moveX = 0; let moveY = 0;
    let isSprint = false;
    let isKick = false;
    let isSlide = false;
    
    const dx = ball.x - bot.x;
    const dy = ball.y - bot.y;
    const distance = dist(bot.x, bot.y, ball.x, ball.y);
    const minDistance = bot.radius + ball.radius + KICK_DISTANCE;

    // A labda irányába mozog (követés)
    if (distance > bot.radius + ball.radius) {
        moveX = dx / distance;
        moveY = dy / distance;
    }

    // Sprint: ha a labda messzebb van, sprintel
    if (distance > 100 && bot.sprintTime > MAX_SPRINT_TIME * 0.5) {
        isSprint = true;
    }

    // Rúgás: ha elég közel van, rúgja el a labdát a kapu felé
    if (distance < minDistance) {
        // Célzás a kék kapu felé (balra)
        bot.aimDirX = -1;
        bot.aimDirY = 0; 
        isKick = true;
    }

    // Becsúszás (csak akkor, ha a labda elé kerül)
    if (bot.slideTimer === 0 && distance < minDistance * 1.5 && dx < 0 && bot.x > WIDTH * 0.5) {
         // Csak a saját térfelén próbáljon becsúszni
         isSlide = true;
    }

    return { moveX, moveY, isSprint, isKick, isSlide };
}


function draw() {
    frameCounter++;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Különleges állapotok, ahol nincs játék
    if (gameState === 'intro') {
        drawModernIntro();
        return;
    }
    if (gameState === 'main_menu') {
        drawMainMenu(mainMenuItems);
        return;
    }
    if (gameState === 'controls') {
        drawControls();
        return;
    }
    if (gameState === 'name_input') {
        drawNameInput();
        return;
    }
    if (gameState === 'career_menu') {
        drawCareerMenu();
        return;
    }
    if (gameState === 'career_table') {
        drawLeagueTable();
        return;
    }
    if (gameState === 'match_setup') {
        drawMatchSetup();
        return;
    }

    // Játék alatti állapotok
    if (gameState === 'playing' || gameState === 'foul_kick' || gameState === 'penalty' || gameState.includes('replay') || gameState === 'goal_scored') {
        drawCrowd();
    }

    drawPitch();

    let p1State = player1;
    let p2State = player2;
    let ballState = ball;

    if (gameState.includes('replay')) {
        const frameIndexToUse = (gameState === 'goal_replay') ? replayFrameIndex : replayBuffer.length - 1;
        const frame = replayBuffer[frameIndexToUse];
        if (frame) {
            ballState = { x: frame.ballX, y: frame.ballY, color: ball.color, radius: ball.radius };
            p1State = { x: frame.p1X, y: frame.p1Y, color: player1.color, radius: player1.radius, team: player1.team, speed: BASE_SPEED, slideTimer: frame.p1SlideTimer, yellowCards: frame.p1Yellow };
            p2State = { x: frame.p2X, y: frame.p2Y, color: player2.color, radius: player2.radius, team: player2.team, speed: BASE_SPEED, slideTimer: frame.p2SlideTimer, yellowCards: frame.p2Yellow };
        }

        drawGameObjects(gameState, p1State, p2State, ballState);

        if (gameState === 'replay_intro') {
            drawReplayText("REPLAY", goalTimer);
        } else if (gameState === 'replay_outro') {
            drawReplayText("GÓL!", goalTimer);
        } else if (gameState === 'goal_replay') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, HEIGHT - 50, WIDTH, 50);
            ctx.fillStyle = 'white';
            ctx.font = '24px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("VISSZAJÁTSZÁS (Nyomj START gombot a kihagyáshoz)", WIDTH / 2, HEIGHT - 20);
        }

    } else {
        drawGameObjects(gameState, p1State, p2State, ballState);

        if (gameState === 'foul_kick') {
            drawFoulText("SZABADRÚGÁS 🟨", goalTimer);
        } else if (gameState === 'penalty') {
            drawFoulText("TIZENEGYES!", goalTimer);
        }
        drawScoreboard();

        if (gameState === 'finished') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            ctx.textAlign = 'center';
            ctx.font = 'bold 40px Arial, sans-serif';

            const playerEntry = leagueTable.find(t => t.isPlayer);
            let headerText = currentMode === 'career' ? 'KARRIER VÉGE' : 'MECCS VÉGE';
            let finalText = '';

            if (currentMode === 'career' && currentMatchDay > MAX_MATCH_DAYS) {
                 headerText = 'BAJNOKSÁG VÉGE';
                 finalText = `Csapatod a(z) ${playerEntry.points}. helyen végzett!`;
                 ctx.fillStyle = playerEntry.points >= 40 ? 'gold' : 'silver';

            } else {
                 if (scoreBlue > scoreRed) {
                    finalText = `${playerName} GYŐZÖTT! (${scoreBlue}-${scoreRed})`;
                    ctx.fillStyle = 'blue';
                 } else if (scoreRed > scoreBlue) {
                    finalText = `${currentMode === 'career' ? opponentName : 'PIROS JÁTÉKOS'} GYŐZÖTT! (${scoreBlue}-${scoreRed})`;
                    ctx.fillStyle = 'red';
                 } else {
                    finalText = `DÖNTETLEN! (${scoreBlue}-${scoreRed})`;
                    ctx.fillStyle = 'yellow';
                 }
            }

            ctx.fillText(headerText, WIDTH / 2, HEIGHT / 2 - 80);
            ctx.fillText(finalText, WIDTH / 2, HEIGHT / 2 + 5);

            if (currentMode === 'career') {
                 ctx.font = '30px Arial, sans-serif';
                 ctx.fillStyle = 'white';
                 ctx.fillText(`Összes pont: ${playerEntry.points}`, WIDTH / 2, HEIGHT / 2 + 80);
            }

            ctx.font = '24px Arial, sans-serif';
            ctx.fillStyle = 'white';
            ctx.fillText("Nyomj meg egy gombot a Főmenübe való visszatéréshez!", WIDTH / 2, HEIGHT / 2 + 140);
        }
    }
}

// --------------------------------------------------------------------------------------------------
// --- TELJES KÉPERNYŐ (FULLSCREEN) LOGIKA ---
// --------------------------------------------------------------------------------------------------
const fullscreenButton = document.getElementById('fullscreenButton');

/**
 * Belépés teljes képernyős módba a canvas elemen.
 */
function enterFullscreen() {
    if (canvas.requestFullscreen) {
        canvas.requestFullscreen();
    } else if (canvas.mozRequestFullScreen) { // Firefox
        canvas.mozRequestFullScreen();
    } else if (canvas.webkitRequestFullscreen) { // Chrome, Safari és Opera
        canvas.webkitRequestFullscreen();
    } else if (canvas.msRequestFullscreen) { // IE/Edge
        canvas.msRequestFullscreen();
    }
}

/**
 * Kezeli a teljes képernyő állapotának változását.
 */
function handleFullscreenChange() {
    if (
        !document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.mozFullScreenElement &&
        !document.msFullscreenElement
    ) {
        // Ha kilépett a teljes képernyőből, újra megjeleníti a gombot
        if (fullscreenButton) {
            // Nem jelenítjük meg, mert a felhasználó akarta, hogy az indulással fusson.
            fullscreenButton.style.display = 'none'; 
        }
    }
}

// Eseményfigyelők
if (fullscreenButton) {
    // Ez a gomb már rejtett a HTML-ben, de az eseményfigyelő megmarad.
    fullscreenButton.addEventListener('click', enterFullscreen);
}

document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);


// A FŐ ciklus
function gameLoop(timestamp) {

    // Időzítő csak normál játékban pörög
    if (gameState === 'playing' && timeLeftSeconds > 0 && timestamp - lastTime > TIME_INTERVAL) {
        timeLeftSeconds--;
        lastTime = timestamp;
    }

    // Meccs befejezése, Karrier mód logika
    if (gameState === 'playing' && timeLeftSeconds <= 0) {
        gameState = 'goal_scored';
        goalTimer = GOAL_PAUSE_TIME;
    }

    updateGameLogic();
    draw();
    requestAnimationFrame(gameLoop);
}

// Játék indítása
requestAnimationFrame(gameLoop);