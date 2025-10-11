// ===== VARIABLES GLOBALES =====
let gamePaused = false;
let gameStarted = false;

// ===== GESTIÓN DE PANTALLAS =====
function showScreen(screenId) {
    // Ocultar todas las pantallas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Mostrar la pantalla seleccionada
    document.getElementById(screenId).classList.add('active');
    
    // Inicializar el juego si se selecciona la pantalla de juego
    if (screenId === 'gameScreen') {
        if (!gameStarted) {
            initGame();
            gameStarted = true;
        }
    } else {
        // Si salimos de la pantalla de juego, detener la animación
        if (gameStarted && typeof stopThreeAnimation === 'function') {
            stopThreeAnimation();
        }
    }
    
    // Reproducir sonido de clic
    playSound('click');
}

// ===== GESTIÓN DE PAUSA =====
function togglePause() {
    gamePaused = !gamePaused;
    const pauseMenu = document.getElementById('pauseMenu');
    
    if (gamePaused) {
        pauseMenu.classList.add('active');
        playSound('pause');
        // Detener animación de Three.js
        if (typeof stopThreeAnimation === 'function') {
            stopThreeAnimation();
        }
    } else {
        pauseMenu.classList.remove('active');
        playSound('unpause');
        // Reanudar animación de Three.js
        if (typeof animateThree === 'function') {
            animateThree();
        }
    }
}

function resumeGame() {
    gamePaused = false;
    document.getElementById('pauseMenu').classList.remove('active');
    playSound('unpause');
    // Reanudar animación de Three.js
    if (typeof animateThree === 'function') {
        animateThree();
    }
}

// ===== EVENT LISTENERS =====
document.addEventListener('keydown', (e) => {
    // Pausa con ESC
    if (e.key === 'Escape' && document.getElementById('gameScreen').classList.contains('active')) {
        togglePause();
    }

    // Centrar cámara con 'C'
    if ((e.key === 'c' || e.key === 'C') && document.getElementById('gameScreen').classList.contains('active')) {
        if (typeof toggleCameraLock === 'function') {
            toggleCameraLock();
        }
    }
});

// Listener para intentos de mover la cámara cuando está bloqueada
document.addEventListener('DOMContentLoaded', () => {
    const gameCanvas = document.getElementById('gameCanvas');
    if (gameCanvas) {
        gameCanvas.addEventListener('mousedown', (e) => {
            // Botón izquierdo del mouse es 0
            if (e.button === 0 && typeof getCameraLockState === 'function' && getCameraLockState()) {
                showNotification('Cámara Bloqueada. Presione C para activar la rotación libre.');
            }
        });
        // Deshabilitar menú contextual en el canvas para que el clic derecho no interfiera
        gameCanvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
});

// ===== NOTIFICACIONES =====
let notificationTimeout;

function showNotification(message) {
    const notificationElement = document.getElementById('notification');
    if (!notificationElement) return;

    notificationElement.textContent = message;
    notificationElement.classList.add('show');

    // Limpiar timeout anterior si existe
    clearTimeout(notificationTimeout);

    // Ocultar la notificación después de 3 segundos
    notificationTimeout = setTimeout(() => {
        notificationElement.classList.remove('show');
    }, 3000);
}

// ===== ANIMACIÓN DE FONDO =====
const bgCanvas = document.getElementById('bgCanvas');
const ctx = bgCanvas.getContext('2d');


// Ajustar tamaño del canvas
bgCanvas.width = window.innerWidth;
bgCanvas.height = window.innerHeight;

// Clase para partículas del fondo
class BackgroundParticle {
    constructor() {
        this.x = Math.random() * bgCanvas.width;
        this.y = Math.random() * bgCanvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        
        // Colores alternos: cyan, magenta, purple
        const colors = ['#00D9FF', '#EB459E', '#9747FF', '#FEE75C'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        this.life = Math.random() * 100;
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life += 0.5;
        
        // Rebotar en los bordes
        if (this.x < 0 || this.x > bgCanvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > bgCanvas.height) this.speedY *= -1;
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        // Efecto de parpadeo
        const opacity = Math.sin(this.life * 0.05) * 0.5 + 0.5;
        ctx.globalAlpha = opacity;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }
}

// Crear partículas
const backgroundParticles = [];
for (let i = 0; i < 80; i++) {
    backgroundParticles.push(new BackgroundParticle());
}

// Animar fondo
function animateBackground() {
    // Degradado de fondo
    const gradient = ctx.createLinearGradient(0, 0, bgCanvas.width, bgCanvas.height);
    gradient.addColorStop(0, '#0a0e27');
    gradient.addColorStop(0.5, '#1a1f3a');
    gradient.addColorStop(1, '#0a0e27');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    
    // Actualizar y dibujar partículas
    backgroundParticles.forEach(particle => {
        particle.update();
        particle.draw();
    });
    
    // Dibujar conexiones entre partículas cercanas
    drawConnections();
    
    requestAnimationFrame(animateBackground);
}

// Dibujar líneas entre partículas cercanas
function drawConnections() {
    for (let i = 0; i < backgroundParticles.length; i++) {
        for (let j = i + 1; j < backgroundParticles.length; j++) {
            const dx = backgroundParticles[i].x - backgroundParticles[j].x;
            const dy = backgroundParticles[i].y - backgroundParticles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                ctx.strokeStyle = `rgba(102, 126, 234, ${1 - distance / 100})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(backgroundParticles[i].x, backgroundParticles[i].y);
                ctx.lineTo(backgroundParticles[j].x, backgroundParticles[j].y);
                ctx.stroke();
            }
        }
    }
}

// Iniciar animación de fondo
animateBackground();

// ===== CONFIGURACIÓN =====
const volumeSlider = document.getElementById('volume');
const volumeValue = document.querySelector('.volume-value');

if (volumeSlider && volumeValue) {
    volumeSlider.addEventListener('input', (e) => {
        volumeValue.textContent = e.target.value + '%';
    });
}

// ===== JUEGO CON THREE.JS =====
function initGame() {
    const gameCanvas = document.getElementById('gameCanvas');
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight - 120; // Espacio para el HUD
    
    // Verificar si Three.js está cargado
    if (typeof THREE !== 'undefined') {
        console.log('✅ Three.js detectado, iniciando escena 3D...');
        
        // Llamar a la función de inicialización de Three.js (definida en game.js)
        if (typeof initThreeJS === 'function') {
            initThreeJS();
        } else {
            console.error('❌ Error: initThreeJS no está definida. Verifica que game.js esté cargado.');
        }
    } else {
        console.error('❌ Three.js no está cargado. Verifica el CDN en el HTML.');
        
        // Mostrar mensaje de error en el canvas
        const gameCtx = gameCanvas.getContext('2d');
        gameCtx.fillStyle = '#ED4245';
        gameCtx.font = 'bold 24px Fredoka';
        gameCtx.textAlign = 'center';
        gameCtx.fillText('ERROR: Three.js no cargado', gameCanvas.width / 2, gameCanvas.height / 2);
    }
}

// ===== SISTEMA DE SONIDO (PLACEHOLDER) =====
function playSound(soundType) {
    console.log(`🔊 Playing sound: ${soundType}`);
}

// ===== TIMER DEL JUEGO =====
let gameTime = 180;
let timerInterval;

function startGameTimer() {
    const timerElement = document.querySelector('.timer-display');
    
    timerInterval = setInterval(() => {
        if (!gamePaused && gameTime > 0) {
            gameTime--;
            
            const minutes = Math.floor(gameTime / 60);
            const seconds = gameTime % 60;
            
            timerElement.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Cambiar color cuando quede poco tiempo
            if (gameTime <= 30) {
                timerElement.style.color = '#ED4245';
                timerElement.style.animation = 'shake 0.5s infinite';
            }
            
            if (gameTime === 0) {
                endGame('timeout');
            }
        }
    }, 1000);
}

function stopGameTimer() {
    clearInterval(timerInterval);
}

function resetGameTimer() {
    gameTime = 180;
    const timerElement = document.querySelector('.timer-display');
    if (timerElement) {
        timerElement.textContent = '03:00';
        timerElement.style.color = '#FEE75C';
        timerElement.style.animation = 'none';
    }
}

// ===== SISTEMA DE VIDAS =====
function updateLives(player, lives) {
    const playerHud = player === 1 ? 
        document.querySelector('.player-1 .player-lives-new') : 
        document.querySelector('.player-2 .player-lives-new');
    
    if (playerHud) {
        playerHud.innerHTML = '';
        for (let i = 0; i < lives; i++) {
            const heart = document.createElement('span');
            heart.className = 'heart-icon';
            heart.textContent = '❤️';
            playerHud.appendChild(heart);
        }
        
        if (lives === 0) {
            endGame(player === 1 ? 'player2' : 'player1');
        }
    }
}

// ===== FIN DE JUEGO =====
function endGame(winner) {
    stopGameTimer();
    
    alert(`¡Juego terminado! ${winner === 'timeout' ? 'Tiempo agotado' : `Ganador: ${winner}`}`);
    
    showScreen('mainMenu');
    resetGameTimer();
    gameStarted = false;
}

// ===== REDIMENSIONAR VENTANA =====
window.addEventListener('resize', () => {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    
    if (gameStarted && typeof resizeThreeJS === 'function') {
        const gameCanvas = document.getElementById('gameCanvas');
        gameCanvas.width = window.innerWidth;
        gameCanvas.height = window.innerHeight - 120;
        resizeThreeJS();
    }
});

// ===== DATOS DE CONFIGURACIÓN =====
const gameConfig = {
    difficulty: 'easy',
    scenario: 'map1',
    gameMode: 'local',
    volume: 70
};

// Guardar configuración
document.getElementById('difficulty')?.addEventListener('change', (e) => {
    gameConfig.difficulty = e.target.value;
    console.log('Dificultad:', gameConfig.difficulty);
});

document.getElementById('scenario')?.addEventListener('change', (e) => {
    gameConfig.scenario = e.target.value;
    console.log('Escenario:', gameConfig.scenario);
});

document.getElementById('gameMode')?.addEventListener('change', (e) => {
    gameConfig.gameMode = e.target.value;
    console.log('Modo:', gameConfig.gameMode);
});

// ===== INICIALIZACIÓN =====
console.log('🎮 BOOM BLAST - Sistema iniciado');
console.log('📋 Controles:');
console.log('  - ESC: Pausar juego');
console.log('  - Haz clic en JUGAR para ver la escena 3D');

// ===== EXPORTAR FUNCIONES =====
window.showScreen = showScreen;
window.togglePause = togglePause;
window.resumeGame = resumeGame;
window.showNotification = showNotification; // Exportar para que game.js la use