// ===== GAME.JS - Lógica de Three.js con Modelos 3D =====

// Variables globales de Three.js
let scene, camera, renderer, loader;
let controls, player1, player2;
let heartTemplate, vestTemplate;
let activeHearts = [], activeVests = [], destructibleWalls = [];
let floor, walls = [];
let animationId;
let isCameraLocked = true; // La cámara empieza bloqueada por defecto

// Temporizadores de Power-ups
let heartSpawnTimer = 0;
let vestSpawnTimer = 0;
const MAX_HEARTS = 2;
const HEART_SPAWN_INTERVAL = 20; // 20 segundos
const VEST_SPAWN_INTERVAL = 10; // 10 segundos
const VEST_SPAWN_PROBABILITY = 0.1; // 10% de probabilidad

// Configuración del juego
const GRID_SIZE = 15;
const CELL_SIZE = 1;
const INITIAL_CAMERA_POSITION = new THREE.Vector3(0, 14, 10); // Más cerca y un poco más bajo para una mejor vista
const INITIAL_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);

// ===== INICIALIZAR THREE.JS =====
function initThreeJS() {
    const gameCanvas = document.getElementById('gameCanvas');
    
    console.log('🚀 Iniciando Three.js...');
    
    // Verificar que THREE esté cargado
    if (typeof THREE === 'undefined') {
        console.error('❌ ERROR: THREE.js no está cargado!');
        alert('Error: Three.js no se cargó correctamente. Recarga la página.');
        return;
    }
    
    // Verificar que GLTFLoader esté disponible
    if (typeof THREE.GLTFLoader === 'undefined') {
        console.error('❌ ERROR: GLTFLoader no está disponible!');
        console.warn('⚠️ Continuando con geometrías básicas...');
    } else {
        console.log('✅ GLTFLoader disponible');
        loader = new THREE.GLTFLoader();
    }
    
    // Crear escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);
    scene.fog = new THREE.Fog(0x0a0e27, 10, 50);
    console.log('✅ Escena creada');
    
    // Crear cámara
    camera = new THREE.PerspectiveCamera(
        60,
        gameCanvas.width / gameCanvas.height,
        0.1,
        1000
    );
    camera.position.copy(INITIAL_CAMERA_POSITION); // Vista desde la arista (borde)
    camera.lookAt(INITIAL_CAMERA_TARGET);
    console.log('✅ Cámara configurada');
    
    // Crear renderer
    renderer = new THREE.WebGLRenderer({ 
        canvas: gameCanvas,
        antialias: true 
    });
    renderer.setSize(gameCanvas.width, gameCanvas.height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    console.log('✅ Renderer configurado');
    
    // Crear controles de órbita
    createOrbitControls();
    
    // Crear el escenario
    createArena();
    console.log('✅ Arena creada');
    
    // Crear jugadores
    createPlayers();
    
    // Cargar modelos de power-ups
    loadHeartModel();
    loadVestModel();

    // Agregar luces
    createLights();
    console.log('✅ Luces agregadas');
    
    // Iniciar animación
    animateThree();
    
    console.log('🎉 Three.js inicializado correctamente!');
}

// ===== CREAR CONTROLES DE CÁMARA =====
function createOrbitControls() {
    if (typeof THREE.OrbitControls === 'undefined') {
        console.warn('⚠️ OrbitControls no está disponible. La cámara será estática.');
        return;
    }
    
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    
    // Configuración para una mejor experiencia
    controls.enableDamping = true; // Movimiento suave (inercia)
    controls.dampingFactor = 0.05;
    
    // Desactivar el paneo (movimiento lateral de la cámara)
    controls.enablePan = false;
    
    // Límites de zoom y ángulo
    controls.minDistance = 10;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Evitar que la cámara vaya bajo el suelo
    
    // Asignar la rotación al clic derecho y deshabilitar el izquierdo para la cámara
    controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE; // Activa la rotación con el clic izquierdo
    controls.mouseButtons.RIGHT = null; // Desactiva el clic derecho para OrbitControls
    
    // La cámara empieza bloqueada, así que deshabilitamos los controles al inicio
    controls.enabled = false;

    controls.target.copy(INITIAL_CAMERA_TARGET); // Asegurar que orbite el centro
    console.log('✅ Controles de órbita creados');
}

// ===== CREAR ARENA =====
function createArena() {
    // Suelo
    const floorGeometry = new THREE.PlaneGeometry(GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a1f3a,
        roughness: 0.8,
        metalness: 0.2
    });
    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Grid visual
    const gridHelper = new THREE.GridHelper(GRID_SIZE * CELL_SIZE, GRID_SIZE, 0x5865F2, 0x2a3682);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);
    
    createBorderWalls();
    createInternalWalls();
    createDestructibleWalls();
}

// ===== CREAR PAREDES DEL BORDE =====
function createBorderWalls() {
    const wallHeight = 2;
    const wallGeometry = new THREE.BoxGeometry(CELL_SIZE, wallHeight, CELL_SIZE);
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4c5fd7,
        roughness: 0.6,
        metalness: 0.4
    });
    
    const halfSize = (GRID_SIZE * CELL_SIZE) / 2;
    
    for (let i = 0; i < GRID_SIZE; i++) {
        const offset = (i - GRID_SIZE / 2 + 0.5) * CELL_SIZE;
        
        [[offset, -halfSize], [offset, halfSize], [-halfSize, offset], [halfSize, offset]].forEach(([x, z]) => {
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            wall.position.set(x, wallHeight / 2, z);
            wall.castShadow = true;
            wall.receiveShadow = true;
            scene.add(wall);
            walls.push(wall);
        });
    }
}

// ===== CREAR PAREDES INTERNAS =====
function createInternalWalls() {
    const wallHeight = 2;
    const wallGeometry = new THREE.BoxGeometry(CELL_SIZE, wallHeight, CELL_SIZE);
    const indestructibleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x5865F2,
        roughness: 0.5,
        metalness: 0.5,
        emissive: 0x5865F2,
        emissiveIntensity: 0.2
    });
    
    for (let x = -6; x <= 6; x += 2) {
        for (let z = -6; z <= 6; z += 2) {
            const wall = new THREE.Mesh(wallGeometry, indestructibleMaterial);
            wall.position.set(x * CELL_SIZE, wallHeight / 2, z * CELL_SIZE);
            wall.castShadow = true;
            wall.receiveShadow = true;
            scene.add(wall);
            walls.push(wall);
        }
    }
}

// ===== CREAR PAREDES DESTRUCTIBLES =====
function createDestructibleWalls() {
    const wallHeight = 2;
    const wallGeometry = new THREE.BoxGeometry(CELL_SIZE, wallHeight, CELL_SIZE);
    const destructibleMaterial = new THREE.MeshStandardMaterial({
        color: 0x8ea1ff, // Un azul más claro que las paredes indestructibles
        roughness: 0.7,
        metalness: 0.1
    });

    // Celdas que deben permanecer vacías al inicio
    const safeZones = new Set([
        '-5,-5', '-5,-4', '-4,-5', // Zona segura Jugador 1
        '5,5', '5,4', '4,5'      // Zona segura Jugador 2
    ]);

    const spawnProbability = 0.4; // probabilidad de spawn de paredes destructibles

    for (let x = -6; x <= 6; x++) {
        for (let z = -6; z <= 6; z++) {
            // No generar en posiciones de paredes indestructibles (ambas coordenadas pares)
            if (x % 2 === 0 && z % 2 === 0) {
                continue;
            }

            // No generar en las zonas seguras
            if (safeZones.has(`${x},${z}`)) {
                continue;
            }

            if (Math.random() < spawnProbability) {
                const wall = new THREE.Mesh(wallGeometry, destructibleMaterial);
                wall.position.set(x * CELL_SIZE, wallHeight / 2, z * CELL_SIZE);
                wall.castShadow = true;
                wall.receiveShadow = true;
                scene.add(wall);
                destructibleWalls.push(wall);
            }
        }
    }
    console.log(`🧱 Creadas ${destructibleWalls.length} paredes destructibles.`);
}

// ===== CARGAR MODELO DE CORAZÓN (POWER-UP) =====
function loadHeartModel() {
    if (!loader) return;

    const modelPath = 'assets/models/Heart.glb';
    console.log(`❤️ Cargando modelo de corazón desde: ${modelPath}`);

    loader.load(modelPath, (gltf) => {
        heartTemplate = gltf.scene;
        heartTemplate.scale.set(.6, .6, .6); // Ajustar escala si es necesario
        
        // Configurar material para que brille un poco
        heartTemplate.traverse((child) => {
            if (child.isMesh) {
                child.material.emissive = new THREE.Color(0xff0000);
                child.material.emissiveIntensity = 0.5;
            }
        });

        console.log('✅ Modelo de corazón cargado y listo.');
    }, undefined, (error) => {
        console.error('❌ Error cargando el modelo de corazón:', error);
    });
}

function spawnHeart() {
    // No hacer nada si ya alcanzamos el máximo o el modelo no ha cargado
    if (activeHearts.length >= MAX_HEARTS || !heartTemplate) return;

    // Si ya hay un corazón, el nuevo debe aparecer en el lado opuesto.
    const firstHeartPosition = activeHearts.length > 0 ? activeHearts[0].position : null;
    const position = findEmptyCell(firstHeartPosition);

    const newHeart = heartTemplate.clone();
    newHeart.position.set(position.x, 1, position.z);
    scene.add(newHeart);
    activeHearts.push(newHeart);
    console.log(`❤️ Corazón #${activeHearts.length} generado en: (${position.x}, ${position.z})`);
}

// ===== CARGAR Y GENERAR CHALECO (POWER-UP) =====
function loadVestModel() {
    if (!loader) return;

    const modelPath = 'assets/models/Vest.glb';
    console.log(`🛡️ Cargando modelo de chaleco desde: ${modelPath}`);

    loader.load(modelPath, (gltf) => {
        vestTemplate = gltf.scene;
        vestTemplate.scale.set(1.0, 1.0, 1.0); // Ajustar escala
        
        vestTemplate.traverse((child) => {
            if (child.isMesh) {
                // Darle un ligero brillo para que destaque
                child.material.emissive = new THREE.Color(0x00ff00);
                child.material.emissiveIntensity = 0.2;
            }
        });

        console.log('✅ Modelo de chaleco cargado y listo.');
    }, undefined, (error) => {
        console.error('❌ Error cargando el modelo de chaleco:', error);
    });
}

function spawnVest() {
    if (!vestTemplate) return; // No hacer nada si el modelo no ha cargado

    const position = findEmptyCell();
    if (!position) return; // No hay espacio disponible

    const newVest = vestTemplate.clone();
    newVest.position.set(position.x, 1, position.z); // Altura ajustada para que coincida visualmente
    scene.add(newVest);
    activeVests.push(newVest);
    console.log(`🛡️ Chaleco generado en: (${position.x}, ${position.z})`);
}


// ===== CREAR JUGADORES =====
function createPlayers() {
    console.log('🎮 Creando jugadores...');
    
    // Intentar cargar modelo si GLTFLoader está disponible
    if (loader) {
        loadPlayerModel(-5, -5, 0x00D9FF, 1);
        loadPlayerModel(5, 5, 0xEB459E, 2);
    } else {
        // Usar geometrías básicas si no hay loader
        console.warn('⚠️ GLTFLoader no disponible, usando geometrías básicas');
        createFallbackPlayer(-5, -5, 0x00D9FF, 1);
        createFallbackPlayer(5, 5, 0xEB459E, 2);
    }
}

// ===== CARGAR MODELO 3D =====
function loadPlayerModel(posX, posZ, color, playerNum) {
    const modelPath = 'assets/models/player.glb';
    
    console.log(`📦 Cargando modelo ${playerNum} desde: ${modelPath}`);
    
    loader.load(
        modelPath,
        function(gltf) {
            const model = gltf.scene;
            console.log(`✅ Modelo ${playerNum} cargado exitosamente!`);
            
            // Configurar posición
            model.position.set(posX, 0, posZ);
            
            // Auto-escalar
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 1.5 / maxDim;
            model.scale.set(scale, scale, scale);
            
            console.log(`📏 Escala aplicada: ${scale.toFixed(2)}`);
            
            // Configurar sombras
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            scene.add(model);
            
            // Agregar luz de jugador
            const glow = new THREE.PointLight(color, 1, 5);
            glow.position.set(posX, 1, posZ);
            scene.add(glow);
            model.userData.glow = glow;
            
            // Asignar a variables globales
            if (playerNum === 1) {
                player1 = model;
            } else {
                player2 = model;
            }
            
            // Animaciones
            if (gltf.animations && gltf.animations.length > 0) {
                const mixer = new THREE.AnimationMixer(model);
                const action = mixer.clipAction(gltf.animations[0]);
                action.play();
                model.userData.mixer = mixer;
                console.log(`🎬 Animación reproduciendo en Jugador ${playerNum}`);
            }
        },
        function(xhr) {
            const percent = xhr.lengthComputable ? (xhr.loaded / xhr.total * 100).toFixed(0) : '?';
            console.log(`📦 Jugador ${playerNum}: ${percent}%`);
        },
        function(error) {
            console.error(`❌ Error cargando modelo ${playerNum}:`, error);
            console.log(`🔄 Usando geometría básica para Jugador ${playerNum}`);
            createFallbackPlayer(posX, posZ, color, playerNum);
        }
    );
}

// ===== CREAR JUGADOR BÁSICO (FALLBACK) =====
function createFallbackPlayer(posX, posZ, color, playerNum) {
    const playerHeight = 1.2;
    const playerRadius = 0.4;
    
    const playerGroup = new THREE.Group();
    
    // Cuerpo
    const bodyGeometry = new THREE.CylinderGeometry(playerRadius, playerRadius, playerHeight, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.4,
        metalness: 0.6,
        emissive: color,
        emissiveIntensity: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    playerGroup.add(body);
    
    // Cabeza
    const headGeometry = new THREE.SphereGeometry(playerRadius, 16, 16);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.y = playerHeight / 2;
    head.castShadow = true;
    playerGroup.add(head);
    
    playerGroup.position.set(posX, playerHeight / 2 + playerRadius, posZ);
    scene.add(playerGroup);
    
    // Luz
    const glow = new THREE.PointLight(color, 1, 5);
    glow.position.copy(playerGroup.position);
    scene.add(glow);
    playerGroup.userData.glow = glow;
    
    if (playerNum === 1) {
        player1 = playerGroup;
    } else {
        player2 = playerGroup;
    }
    
    console.log(`🎮 Jugador ${playerNum} creado (geometría básica)`);
}

// ===== LUCES =====
function createLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    scene.add(directionalLight);
    
    const accentLight = new THREE.PointLight(0x9747FF, 0.5, 30);
    accentLight.position.set(0, 10, 0);
    scene.add(accentLight);
}

// ===== ANIMACIÓN =====
const clock = new THREE.Clock();

function animateThree() {
    if (gamePaused) return;
    
    animationId = requestAnimationFrame(animateThree);
    const delta = clock.getDelta();
    
    // Lógica de aparición de corazones
    if (activeHearts.length < MAX_HEARTS) {
        heartSpawnTimer += delta;
        if (heartSpawnTimer >= HEART_SPAWN_INTERVAL) {
            heartSpawnTimer = 0;
            spawnHeart();
        }
    }
    // Animación de flotación para todos los corazones activos
    activeHearts.forEach(heart => {
        heart.rotation.y += delta;
        heart.position.y = 1 + Math.sin(clock.getElapsedTime() * 2 + heart.position.x) * 0.25;
    });

    // Lógica de aparición de chalecos
    vestSpawnTimer += delta;
    if (vestSpawnTimer >= VEST_SPAWN_INTERVAL) {
        vestSpawnTimer = 0;
        if (Math.random() < VEST_SPAWN_PROBABILITY) {
            spawnVest();
        }
    }
    // Animación de flotación para todos los chalecos activos
    activeVests.forEach(vest => {
        vest.rotation.y -= delta * 0.5; // Rotación más lenta y en sentido contrario
        vest.position.y = 1 + Math.cos(clock.getElapsedTime() * 1.5 + vest.position.z) * 0.2;
    });


    // Actualizar controles si existen
    if (controls) controls.update();
    
    if (player1) {
        // La rotación ahora se manejará con el movimiento del jugador
        // player1.rotation.y += 0.01;
        if (player1.userData.mixer) player1.userData.mixer.update(delta);
        if (player1.userData.glow) {
            player1.userData.glow.position.set(
                player1.position.x,
                player1.position.y + 1,
                player1.position.z
            );
        }
    }
    
    if (player2) {
        // La rotación ahora se manejará con el movimiento del jugador
        // player2.rotation.y -= 0.01;
        if (player2.userData.mixer) player2.userData.mixer.update(delta);
        if (player2.userData.glow) {
            player2.userData.glow.position.set(
                player2.position.x,
                player2.position.y + 1,
                player2.position.z
            );
        }
    }
    
    renderer.render(scene, camera);
}

// ===== RESTABLECER CÁMARA =====
function resetCameraPosition() {
    if (!camera || !controls) return;

    // Restablece la posición de la cámara y el objetivo de los controles
    // a sus valores iniciales.
    camera.position.copy(INITIAL_CAMERA_POSITION);
    controls.target.copy(INITIAL_CAMERA_TARGET);
    console.log('📷 Cámara restablecida a la posición inicial.');
}

// ===== BLOQUEO DE CÁMARA =====
function toggleCameraLock() {
    if (!controls) return;

    isCameraLocked = !isCameraLocked;

    if (isCameraLocked) {
        controls.enabled = false;
        resetCameraPosition(); // Vuelve a la posición fija
        showNotification('Cámara bloqueada');
    } else {
        controls.enabled = true;
        showNotification('Rotación libre activada');
    }
}

function getCameraLockState() {
    return isCameraLocked;
}

// ===== LÓGICA DEL GRID =====
function findEmptyCell(firstHeartPosition = null) {
    const occupiedCells = new Set();
    
    // Marcar paredes indestructibles (posiciones pares)
    for (let x = -6; x <= 6; x += 2) {
        for (let z = -6; z <= 6; z += 2) {
            occupiedCells.add(`${x},${z}`);
        }
    }

    // Marcar posiciones iniciales de jugadores
    occupiedCells.add('-5,-5');
    occupiedCells.add('5,5');

    // Marcar posiciones de paredes destructibles
    destructibleWalls.forEach(wall => {
        const x = Math.round(wall.position.x / CELL_SIZE);
        const z = Math.round(wall.position.z / CELL_SIZE);
        occupiedCells.add(`${x},${z}`);
    });

    // Marcar posiciones de corazones activos
    activeHearts.forEach(heart => {
        const x = Math.round(heart.position.x / CELL_SIZE);
        const z = Math.round(heart.position.z / CELL_SIZE);
        occupiedCells.add(`${x},${z}`);
    });

    // Marcar posiciones de chalecos activos
    activeVests.forEach(vest => {
        const x = Math.round(vest.position.x / CELL_SIZE);
        const z = Math.round(vest.position.z / CELL_SIZE);
        occupiedCells.add(`${x},${z}`);
    });

    let randomX, randomZ, cellKey;
    const maxCoord = Math.floor((GRID_SIZE - 3) / 2); // -6 a 6

    // Determinar el lado de búsqueda si se debe generar en el lado opuesto
    const xSignToAvoid = firstHeartPosition ? Math.sign(firstHeartPosition.x) : 0;
    let attempts = 0;
    do {
        randomX = Math.floor(Math.random() * (maxCoord * 2 + 1)) - maxCoord;
        randomZ = Math.floor(Math.random() * (maxCoord * 2 + 1)) - maxCoord;
        cellKey = `${randomX},${randomZ}`;

        // Si estamos buscando en el lado opuesto y el signo de X coincide, intenta de nuevo.
        // Esto fuerza al segundo corazón a aparecer en la mitad opuesta del tablero.
        // Se ignora si el primer corazón o el nuevo están en la columna central (x=0).
        if (xSignToAvoid !== 0 && Math.sign(randomX) === xSignToAvoid) {
            continue;
        }

        attempts++;
        if (attempts > 100) { // Evitar bucle infinito si el mapa está lleno
            console.warn('⚠️ No se encontró celda vacía para el power-up.');
            return null;
        }

    } while (occupiedCells.has(cellKey));

    return { x: randomX * CELL_SIZE, z: randomZ * CELL_SIZE };
}


// ===== OTRAS FUNCIONES =====
function stopThreeAnimation() {
    if (animationId) cancelAnimationFrame(animationId);
}

function resizeThreeJS() {
    const gameCanvas = document.getElementById('gameCanvas');
    if (!camera || !renderer) return;
    camera.aspect = gameCanvas.width / gameCanvas.height;
    camera.updateProjectionMatrix();
    renderer.setSize(gameCanvas.width, gameCanvas.height);
}

function cleanupThreeJS() {
    stopThreeAnimation();
    if (controls) controls.dispose();
    if (scene) {
        scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(m => m.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        // Limpiar paredes destructibles
        destructibleWalls.forEach(wall => scene.remove(wall));
        destructibleWalls = [];
        activeHearts.forEach(heart => scene.remove(heart));
        activeHearts = [];
        // Limpiar chalecos
        activeVests.forEach(vest => scene.remove(vest));
        activeVests = [];
    }
    if (renderer) renderer.dispose();
    console.log('🧹 Three.js limpiado');
}

// Exportar
window.initThreeJS = initThreeJS;
window.stopThreeAnimation = stopThreeAnimation;
window.resizeThreeJS = resizeThreeJS;
window.cleanupThreeJS = cleanupThreeJS;
window.resetCameraPosition = resetCameraPosition;
window.toggleCameraLock = toggleCameraLock;
window.getCameraLockState = getCameraLockState;