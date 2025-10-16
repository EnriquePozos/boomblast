// ===== INTEGRACIÓN CON TWITTER SERVICE EXISTENTE =====
// Este archivo extiende la funcionalidad de TwitterService.js
// para agregar el botón de prueba temporal

// ===== DATOS ALEATORIOS PARA TWEETS DE PRUEBA =====
const NOMBRES_JUGADORES = [
    'BomberKing', 'ExplosiveMaster', 'BlastHero', 'MegaBomber',
    'FireStorm', 'ToxicBlast', 'NeonNinja', 'ThunderBomb',
    'CyberBlast', 'PixelWarrior', 'ShadowBomber', 'IceBlaster',
    'LaserLord', 'PlasmaKnight', 'VortexMaster', 'QuantumBomber'
];

const MAPAS = [
    'Arena Clásica', 'Zona de Guerra', 'Laberinto Neon',
    'Campo de Batalla', 'Dimensión Digital', 'Ruinas Antiguas',
    'Ciudad Cyberpunk', 'Templo Místico'
];

const LOGROS = [
    '🔥 Racha de Fuego', '💣 Maestro Explosivo', '⚡ Velocidad Extrema',
    '🏆 Invencible', '💀 Sin Piedad', '🎯 Puntería Perfecta',
    '🌟 Estrella del Combate', '👑 Dominación Total', '🎭 Artista del Caos',
    '⚔️ Guerrero Imparable', '🔮 Estratega Supremo', '💎 Leyenda Viviente'
];

// ===== GENERADOR DE DATOS ALEATORIOS =====
function generarDatosPartidaAleatoria() {
    // Seleccionar dos jugadores diferentes
    const jugador1 = NOMBRES_JUGADORES[Math.floor(Math.random() * NOMBRES_JUGADORES.length)];
    let jugador2 = NOMBRES_JUGADORES[Math.floor(Math.random() * NOMBRES_JUGADORES.length)];
    
    // Asegurar que sean diferentes
    while (jugador2 === jugador1) {
        jugador2 = NOMBRES_JUGADORES[Math.floor(Math.random() * NOMBRES_JUGADORES.length)];
    }
    
    // Determinar ganador aleatoriamente
    const esGanador1 = Math.random() > 0.5;
    const ganador = esGanador1 ? jugador1 : jugador2;
    const perdedor = esGanador1 ? jugador2 : jugador1;
    
    // Generar rondas ganadas (formato "X-Y")
    const rondasGanador = 2;
    const rondasPerdedor = Math.random() > 0.5 ? 1 : 0;
    const rondasGanadas = `${rondasGanador}-${rondasPerdedor}`;
    
    // Generar tiempo aleatorio (entre 2:30 y 8:45)
    const minutos = Math.floor(Math.random() * 6) + 2; // 2-7
    const segundos = Math.floor(Math.random() * 60); // 0-59
    const tiempo = `${minutos}:${segundos.toString().padStart(2, '0')}`;
    
    // Seleccionar mapa aleatorio
    const mapa = MAPAS[Math.floor(Math.random() * MAPAS.length)];
    
    // Generar 2-4 logros aleatorios únicos
    const numLogros = Math.floor(Math.random() * 3) + 2; // 2-4
    const logrosSeleccionados = [];
    const logrosDisponibles = [...LOGROS];
    
    for (let i = 0; i < numLogros && logrosDisponibles.length > 0; i++) {
        const index = Math.floor(Math.random() * logrosDisponibles.length);
        logrosSeleccionados.push(logrosDisponibles[index]);
        logrosDisponibles.splice(index, 1);
    }
    
    return {
        ganador,
        perdedor,
        rondasGanadas,
        tiempo,
        mapa,
        logros: logrosSeleccionados
    };
}

// ===== FUNCIÓN PRINCIPAL DE PRUEBA (USA TwitterService EXISTENTE) =====
async function testTwitterIntegration() {
    console.log('🐦 Iniciando prueba de integración con Twitter...');
    
    // Verificar que TwitterService esté disponible
    if (typeof twitterService === 'undefined') {
        console.error('❌ TwitterService no está cargado');
        showNotification('Error: TwitterService no disponible', 'error');
        return;
    }
    
    // Mostrar notificación de inicio
    showNotification('Generando tweet aleatorio...', 'info');
    
    // Generar datos aleatorios
    const datosPartida = generarDatosPartidaAleatoria();
    
    console.log('📊 Datos generados:', datosPartida);
    
    // Usar el método compartirPartida de TwitterService
    const resultado = await twitterService.compartirPartida(datosPartida);
    
    if (resultado && resultado.success) {
        console.log('✅ Tweet publicado exitosamente:', resultado);
        
        // Opcional: Abrir el tweet en una nueva pestaña
        if (resultado.url) {
            setTimeout(() => {
                if (confirm('¿Quieres ver el tweet publicado?')) {
                    window.open(resultado.url, '_blank');
                }
            }, 1000);
        }
    }
}

// ===== FUNCIÓN AUXILIAR PARA VER DATOS SIN PUBLICAR =====
function verDatosAleatorios() {
    const datos = generarDatosPartidaAleatoria();
    console.log('🎲 Datos aleatorios generados (sin publicar):');
    console.table(datos);
    
    // Mostrar en la consola el formato del tweet
    console.log('\n📝 Vista previa del tweet:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎮 BOOM BLAST - ¡Partida Finalizada! 🎮\n`);
    console.log(`🏆 ${datos.ganador} VENCIÓ a ${datos.perdedor}`);
    console.log(`📊 Rondas: ${datos.rondasGanadas}`);
    console.log(`⏱️ Tiempo: ${datos.tiempo}`);
    console.log(`🗺️ Mapa: ${datos.mapa}\n`);
    console.log(`🎖️ Logros Desbloqueados:`);
    datos.logros.forEach(logro => console.log(`• ${logro}`));
    console.log('\n#BoomBlast #Bomberman3D #GraficasWeb #UANL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return datos;
}

// ===== FUNCIÓN PARA PROBAR ESTADÍSTICAS =====
async function testTwitterStats() {
    if (typeof twitterService === 'undefined') {
        console.error('❌ TwitterService no está cargado');
        return;
    }
    
    console.log('📊 Obteniendo estadísticas de Twitter...');
    showNotification('Cargando estadísticas...', 'info');
    
    const stats = await twitterService.obtenerEstadisticas();
    
    if (stats) {
        console.log('✅ Estadísticas globales:', stats);
        showNotification(`Total de partidas compartidas: ${stats.totalPartidas}`, 'success');
    }
}

// ===== FUNCIÓN PARA PROBAR FEED =====
async function testTwitterFeed() {
    if (typeof twitterService === 'undefined') {
        console.error('❌ TwitterService no está cargado');
        return;
    }
    
    console.log('📥 Obteniendo feed de Twitter...');
    showNotification('Cargando feed público...', 'info');
    
    const feed = await twitterService.obtenerFeedPublico(10);
    
    if (feed.total > 0) {
        console.log(`✅ ${feed.total} partidas en el feed:`);
        console.table(feed.partidas.map(p => ({
            id: p.id,
            texto: p.text.substring(0, 50) + '...',
            likes: p.public_metrics?.like_count || 0
        })));
        showNotification(`Feed cargado: ${feed.total} partidas`, 'success');
    } else {
        showNotification('No hay partidas en el feed', 'info');
    }
}

console.log('✅ Extensión de TwitterService cargada');
console.log('💡 Funciones disponibles:');
console.log('   - testTwitterIntegration() - Publicar tweet aleatorio');
console.log('   - verDatosAleatorios() - Ver datos sin publicar');
console.log('   - testTwitterStats() - Ver estadísticas globales');
console.log('   - testTwitterFeed() - Ver feed público de partidas');