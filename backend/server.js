const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
const twitterRoutes = require('./routes/twitter');
const puntuacionesRoutes = require('./routes/puntuaciones');

app.use('/api/twitter', twitterRoutes);
app.use('/api/puntuaciones', puntuacionesRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: '✅ BOOM BLAST API activa',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      twitter: {
        compartir: 'POST /api/twitter/compartir',
        feed: 'GET /api/twitter/feed',
        estadisticas: 'GET /api/twitter/estadisticas'
      },
      puntuaciones: {
        top: 'GET /api/puntuaciones/top/:limit',
        guardar: 'POST /api/puntuaciones/guardar',
        historial: 'GET /api/puntuaciones/historial/:jugador'
      }
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Error interno del servidor'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint no encontrado' 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}`);
  console.log(`🌐 Modo: ${process.env.NODE_ENV || 'development'}`);
});