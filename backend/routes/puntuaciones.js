const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET: Top puntuaciones (sin el ?)
router.get('/top/:limit', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.params.limit) || 10, 100);
    
    const result = await db.query(
      `SELECT 
        id, 
        jugador, 
        puntos, 
        tiempo, 
        dificultad, 
        mapa,
        fecha,
        ROW_NUMBER() OVER (ORDER BY puntos DESC) as posicion
      FROM puntuaciones 
      ORDER BY puntos DESC 
      LIMIT $1`,
      [limit]
    );
    
    console.log(`✅ ${result.rows.length} puntuaciones recuperadas`);
    
    res.json({ 
      success: true, 
      puntuaciones: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ Error al obtener puntuaciones:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET: Top puntuaciones sin límite (por defecto 10)
router.get('/top', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    
    const result = await db.query(
      `SELECT 
        id, 
        jugador, 
        puntos, 
        tiempo, 
        dificultad, 
        mapa,
        fecha,
        ROW_NUMBER() OVER (ORDER BY puntos DESC) as posicion
      FROM puntuaciones 
      ORDER BY puntos DESC 
      LIMIT $1`,
      [limit]
    );
    
    console.log(`✅ ${result.rows.length} puntuaciones recuperadas`);
    
    res.json({ 
      success: true, 
      puntuaciones: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ Error al obtener puntuaciones:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST: Guardar nueva puntuación
router.post('/guardar', async (req, res) => {
  try {
    const { jugador, puntos, tiempo, dificultad, mapa } = req.body;
    
    // Validar datos requeridos
    if (!jugador || puntos === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Faltan datos requeridos: jugador y puntos' 
      });
    }
    
    const result = await db.query(
      `INSERT INTO puntuaciones 
        (jugador, puntos, tiempo, dificultad, mapa, fecha) 
      VALUES ($1, $2, $3, $4, $5, NOW()) 
      RETURNING *`,
      [jugador, puntos, tiempo || null, dificultad || 'normal', mapa || 'Arena Clásica']
    );
    
    console.log('✅ Puntuación guardada:', result.rows[0].id);
    
    res.json({ 
      success: true, 
      puntuacion: result.rows[0],
      mensaje: 'Puntuación guardada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error al guardar puntuación:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET: Historial de un jugador específico
router.get('/historial/:jugador', async (req, res) => {
  try {
    const { jugador } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const result = await db.query(
      `SELECT * FROM puntuaciones 
      WHERE jugador = $1 
      ORDER BY fecha DESC 
      LIMIT $2`,
      [jugador, limit]
    );
    
    // Calcular estadísticas del jugador
    const stats = await db.query(
      `SELECT 
        COUNT(*) as total_partidas,
        MAX(puntos) as mejor_puntuacion,
        AVG(puntos)::INTEGER as promedio_puntos,
        SUM(CASE WHEN puntos > 1000 THEN 1 ELSE 0 END) as victorias
      FROM puntuaciones 
      WHERE jugador = $1`,
      [jugador]
    );
    
    console.log(`✅ Historial de ${jugador}: ${result.rows.length} partidas`);
    
    res.json({ 
      success: true, 
      jugador: jugador,
      historial: result.rows,
      estadisticas: stats.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error al obtener historial:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// DELETE: Limpiar todas las puntuaciones (solo para desarrollo)
router.delete('/limpiar', async (req, res) => {
  try {
    // Solo permitir en desarrollo
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        success: false, 
        error: 'No permitido en producción' 
      });
    }
    
    await db.query('DELETE FROM puntuaciones');
    
    console.log('⚠️ Todas las puntuaciones eliminadas');
    
    res.json({ 
      success: true, 
      mensaje: 'Todas las puntuaciones eliminadas' 
    });
    
  } catch (error) {
    console.error('❌ Error al limpiar puntuaciones:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;