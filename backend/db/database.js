const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false
});

// Verificar conexión
pool.on('connect', () => {
  console.log('✅ Conectado a la base de datos PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error en la base de datos:', err);
});

// Inicializar tablas
async function initDB() {
  try {
    // Tabla de puntuaciones
    await pool.query(`
      CREATE TABLE IF NOT EXISTS puntuaciones (
        id SERIAL PRIMARY KEY,
        jugador VARCHAR(100) NOT NULL,
        puntos INTEGER NOT NULL,
        tiempo VARCHAR(20),
        dificultad VARCHAR(50),
        mapa VARCHAR(100),
        fecha TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Crear índices para mejorar rendimiento
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_puntuaciones_puntos 
      ON puntuaciones(puntos DESC)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_puntuaciones_jugador 
      ON puntuaciones(jugador)
    `);
    
    console.log('✅ Tablas de base de datos inicializadas');
    
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
}

// Ejecutar inicialización
initDB();

module.exports = pool;