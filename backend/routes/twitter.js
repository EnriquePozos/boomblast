const express = require('express');
const { TwitterApi } = require('twitter-api-v2');
const router = express.Router();

// Función para verificar si las credenciales de Twitter están configuradas
function hasTwitterCredentials() {
  return !!(
    process.env.TWITTER_API_KEY &&
    process.env.TWITTER_API_SECRET &&
    process.env.TWITTER_ACCESS_TOKEN &&
    process.env.TWITTER_ACCESS_TOKEN_SECRET
  );
}

// Inicializar cliente de Twitter solo si hay credenciales
let rwClient = null;

if (hasTwitterCredentials()) {
  try {
    const twitterClient = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });
    rwClient = twitterClient.readWrite;
    console.log('✅ Cliente de Twitter inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando Twitter:', error.message);
  }
} else {
  console.warn('⚠️ Credenciales de Twitter no configuradas. Las rutas de Twitter no funcionarán.');
}

// Middleware para verificar que Twitter esté configurado
function requireTwitter(req, res, next) {
  if (!rwClient) {
    return res.status(503).json({
      success: false,
      error: 'Servicio de Twitter no configurado. Por favor, configura las credenciales de Twitter.'
    });
  }
  next();
}

// POST: Compartir resultado de partida
router.post('/compartir', requireTwitter, async (req, res) => {
  try {
    const { ganador, perdedor, rondasGanadas, tiempo, mapa, logros } = req.body;
    
    // Validar datos requeridos
    if (!ganador || !perdedor) {
      return res.status(400).json({ 
        success: false, 
        error: 'Faltan datos requeridos: ganador y perdedor' 
      });
    }
    
    // Construir mensaje del tweet
    let mensaje = `🎮 BOOM BLAST - ¡Partida Finalizada! 🎮\n\n`;
    mensaje += `🏆 ${ganador} VENCIÓ a ${perdedor}\n`;
    mensaje += `📊 Rondas: ${rondasGanadas || '2-1'}\n`;
    mensaje += `⏱️ Tiempo: ${tiempo || 'N/A'}\n`;
    mensaje += `🗺️ Mapa: ${mapa || 'Arena Clásica'}\n`;
    
    // Agregar logros si existen
    if (logros && Array.isArray(logros) && logros.length > 0) {
      mensaje += `\n🎖️ Logros Desbloqueados:\n`;
      logros.slice(0, 3).forEach(logro => {
        mensaje += `• ${logro}\n`;
      });
    }
    
    mensaje += `\n#BoomBlast #Bomberman3D #GraficasWeb #UANL`;

    // Publicar tweet
    const tweet = await rwClient.v2.tweet(mensaje);
    
    console.log('✅ Tweet publicado:', tweet.data.id);
    
    res.json({ 
      success: true, 
      tweetId: tweet.data.id,
      mensaje: '¡Partida compartida en Twitter!',
      url: `https://twitter.com/user/status/${tweet.data.id}`
    });
    
  } catch (error) {
    console.error('❌ Error al publicar tweet:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error al publicar en Twitter'
    });
  }
});

// GET: Obtener feed público de partidas
router.get('/feed', requireTwitter, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const tweets = await rwClient.v2.search({
      query: '#BoomBlast -is:retweet',
      max_results: Math.min(limit, 100),
      'tweet.fields': ['created_at', 'public_metrics', 'text'],
      'user.fields': ['username', 'name', 'profile_image_url'],
      expansions: ['author_id']
    });
    
    const partidas = tweets.data?.data || [];
    const usuarios = tweets.data?.includes?.users || [];
    
    console.log(`✅ ${partidas.length} partidas recuperadas del feed`);
    
    res.json({ 
      success: true, 
      partidas: partidas,
      usuarios: usuarios,
      total: tweets.data?.meta?.result_count || 0
    });
    
  } catch (error) {
    console.error('❌ Error al obtener feed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error al obtener feed de Twitter'
    });
  }
});

// GET: Estadísticas globales
router.get('/estadisticas', requireTwitter, async (req, res) => {
  try {
    const tweets = await rwClient.v2.search({
      query: '#BoomBlast -is:retweet',
      max_results: 100,
      'tweet.fields': ['public_metrics']
    });
    
    const data = tweets.data?.data || [];
    
    const estadisticas = {
      totalPartidas: data.length,
      totalLikes: data.reduce((sum, t) => sum + (t.public_metrics?.like_count || 0), 0),
      totalRetweets: data.reduce((sum, t) => sum + (t.public_metrics?.retweet_count || 0), 0),
      totalRespuestas: data.reduce((sum, t) => sum + (t.public_metrics?.reply_count || 0), 0),
      engagement: data.reduce((sum, t) => 
        sum + 
        (t.public_metrics?.like_count || 0) + 
        (t.public_metrics?.retweet_count || 0) +
        (t.public_metrics?.reply_count || 0), 0)
    };
    
    console.log('✅ Estadísticas calculadas:', estadisticas);
    
    res.json({ 
      success: true, 
      estadisticas: estadisticas 
    });
    
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;