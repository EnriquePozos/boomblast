// services/PuntuacionesService.js
class PuntuacionesService {
    constructor() {
        // URL del backend
        this.apiUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api/puntuaciones'
            : 'https://boom-blast-api.onrender.com/api/puntuaciones';
        
        console.log('🏆 PuntuacionesService inicializado:', this.apiUrl);
    }

    /**
     * Guardar puntuación en la base de datos
     * @param {Object} datosPuntuacion - Datos de la puntuación
     * @returns {Promise<Object|null>}
     */
    async guardarPuntuacion(datosPuntuacion) {
        try {
            console.log('💾 Guardando puntuación...', datosPuntuacion);
            
            const response = await fetch(`${this.apiUrl}/guardar`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosPuntuacion)
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ Puntuación guardada:', data.puntuacion.id);
                return data.puntuacion;
            } else {
                console.error('❌ Error al guardar:', data.error);
                return null;
            }
        } catch (error) {
            console.error('❌ Error de red al guardar puntuación:', error);
            return null;
        }
    }

    /**
     * Obtener top puntuaciones
     * @param {number} limit - Número de puntuaciones a obtener
     * @returns {Promise<Array>}
     */
    async obtenerTopPuntuaciones(limit = 10) {
        try {
            console.log(`📥 Obteniendo top ${limit} puntuaciones...`);
            
            const response = await fetch(`${this.apiUrl}/top/${limit}`);
            const data = await response.json();

            if (data.success) {
                console.log(`✅ ${data.total} puntuaciones cargadas`);
                return data.puntuaciones || [];
            }
            
            return [];
        } catch (error) {
            console.error('❌ Error al cargar puntuaciones:', error);
            return [];
        }
    }

    /**
     * Obtener historial de un jugador
     * @param {string} nombreJugador - Nombre del jugador
     * @param {number} limit - Número de partidas a obtener
     * @returns {Promise<Object>}
     */
    async obtenerHistorial(nombreJugador, limit = 50) {
        try {
            console.log(`📜 Obteniendo historial de ${nombreJugador}...`);
            
            const response = await fetch(`${this.apiUrl}/historial/${nombreJugador}?limit=${limit}`);
            const data = await response.json();

            if (data.success) {
                console.log(`✅ Historial cargado: ${data.historial.length} partidas`);
                return {
                    historial: data.historial || [],
                    estadisticas: data.estadisticas || {}
                };
            }
            
            return { historial: [], estadisticas: {} };
        } catch (error) {
            console.error('❌ Error al cargar historial:', error);
            return { historial: [], estadisticas: {} };
        }
    }

    /**
     * Calcular puntos basado en el resultado de la partida
     * @param {Object} datosPartida - Datos de la partida
     * @returns {number}
     */
    calcularPuntos(datosPartida) {
        let puntos = 500; // Base

        // Bonus por dificultad
        if (datosPartida.dificultad === 'hard') {
            puntos += 300;
        }

        // Bonus por tiempo (menos tiempo = más puntos)
        const [minutos, segundos] = (datosPartida.tiempo || '03:00').split(':').map(Number);
        const tiempoTotal = minutos * 60 + segundos;
        if (tiempoTotal < 120) puntos += 200;
        else if (tiempoTotal < 180) puntos += 100;

        // Bonus por rondas ganadas
        const rondas = datosPartida.rondasGanadas || '2-0';
        if (rondas === '2-0') puntos += 150; // Victoria perfecta

        return puntos;
    }

    /**
     * Formatear fecha para mostrar
     * @param {string} fecha - Fecha en formato ISO
     * @returns {string}
     */
    formatearFecha(fecha) {
        const date = new Date(fecha);
        const ahora = new Date();
        const diff = ahora - date;
        
        const minutos = Math.floor(diff / 60000);
        const horas = Math.floor(diff / 3600000);
        const dias = Math.floor(diff / 86400000);
        
        if (minutos < 1) return 'Hace un momento';
        if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
        if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
        if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
        
        return date.toLocaleDateString('es-MX', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
}

// Crear instancia global
const puntuacionesService = new PuntuacionesService();

// Exportar para módulos ES6 si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PuntuacionesService;
}