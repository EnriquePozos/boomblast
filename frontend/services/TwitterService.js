// services/TwitterService.js
class TwitterService {
constructor() {
    this.apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api/twitter'
        : 'https://boomblast.onrender.com/api/twitter';
    
    console.log('🐦 TwitterService inicializado:', this.apiUrl);
}

    /**
     * Compartir resultado de partida en Twitter
     * @param {Object} datosPartida - Datos de la partida
     * @returns {Promise<Object|null>}
     */
    async compartirPartida(datosPartida) {
        try {
            console.log('📤 Compartiendo partida en Twitter...', datosPartida);
            
            const response = await fetch(`${this.apiUrl}/compartir`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosPartida)
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ Partida compartida:', data.tweetId);
                if (typeof showNotification === 'function') {
                    showNotification('¡Partida compartida en Twitter! 🐦');
                }
                return data;
            } else {
                console.error('❌ Error del servidor:', data.error);
                if (typeof showNotification === 'function') {
                    showNotification('Error al compartir en Twitter');
                }
                return null;
            }
        } catch (error) {
            console.error('❌ Error de red al compartir:', error);
            if (typeof showNotification === 'function') {
                showNotification('Error de conexión con Twitter');
            }
            return null;
        }
    }

    /**
     * Obtener feed público de partidas compartidas
     * @param {number} limit - Número máximo de partidas a obtener
     * @returns {Promise<Array>}
     */
    async obtenerFeedPublico(limit = 20) {
        try {
            console.log('📥 Obteniendo feed público de Twitter...');
            
            const response = await fetch(`${this.apiUrl}/feed?limit=${limit}`);
            const data = await response.json();

            if (data.success) {
                console.log(`✅ ${data.total} partidas cargadas del feed`);
                return {
                    partidas: data.partidas || [],
                    usuarios: data.usuarios || [],
                    total: data.total || 0
                };
            }
            
            return { partidas: [], usuarios: [], total: 0 };
        } catch (error) {
            console.error('❌ Error al cargar feed:', error);
            return { partidas: [], usuarios: [], total: 0 };
        }
    }

    /**
     * Obtener estadísticas globales de partidas compartidas
     * @returns {Promise<Object|null>}
     */
    async obtenerEstadisticas() {
        try {
            console.log('📊 Obteniendo estadísticas globales...');
            
            const response = await fetch(`${this.apiUrl}/estadisticas`);
            const data = await response.json();

            if (data.success) {
                console.log('✅ Estadísticas obtenidas:', data.estadisticas);
                return data.estadisticas;
            }
            
            return null;
        } catch (error) {
            console.error('❌ Error al obtener estadísticas:', error);
            return null;
        }
    }

    /**
     * Parsear texto de tweet para extraer información de la partida
     * @param {string} texto - Texto del tweet
     * @returns {Object}
     */
    parsearTweet(texto) {
        const info = {
            ganador: null,
            perdedor: null,
            rondas: null,
            tiempo: null,
            mapa: null
        };

        // Extraer ganador y perdedor
        const matchVs = texto.match(/🏆\s*(.+?)\s*VENCIÓ\s*a\s*(.+)/i);
        if (matchVs) {
            info.ganador = matchVs[1].trim();
            info.perdedor = matchVs[2].trim().split('\n')[0];
        }

        // Extraer rondas
        const matchRondas = texto.match(/📊\s*Rondas:\s*(.+)/i);
        if (matchRondas) {
            info.rondas = matchRondas[1].trim().split('\n')[0];
        }

        // Extraer tiempo
        const matchTiempo = texto.match(/⏱️\s*Tiempo:\s*(.+)/i);
        if (matchTiempo) {
            info.tiempo = matchTiempo[1].trim().split('\n')[0];
        }

        // Extraer mapa
        const matchMapa = texto.match(/🗺️\s*Mapa:\s*(.+)/i);
        if (matchMapa) {
            info.mapa = matchMapa[1].trim().split('\n')[0];
        }

        return info;
    }
}

// Crear instancia global
const twitterService = new TwitterService();

// Exportar para módulos ES6 si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TwitterService;
}