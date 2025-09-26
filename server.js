/**
 * Server Node.js per il Corso di Architettura Web
 * Serve l'applicazione SPA con tutte le funzionalità moderne
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3001;

// ==================== MIDDLEWARE SETUP ====================

// Sicurezza con Helmet (configurato per permettere inline styles/scripts della nostra SPA)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "data:"],
            connectSrc: ["'self'"], // Permette fetch delle sezioni dinamiche
            objectSrc: ["'none'"],
            baseUri: ["'self'"]
        }
    }
}));

// CORS per sviluppo
app.use(cors());

// Compressione gzip
app.use(compression());

// Parse JSON e URL-encoded data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== STATIC FILES ====================

// Serve i file statici dalla root del progetto
app.use(express.static('.', {
    maxAge: '1d', // Cache per 1 giorno in produzione
    etag: true,
    lastModified: true
}));

// ==================== API ROUTES (opzionali per future estensioni) ====================

// API per ottenere informazioni sul corso
app.get('/api/course-info', (req, res) => {
    res.json({
        title: 'Architettura Web: Guida Completa',
        version: '1.0.0',
        sections: 25,
        technologies: ['HTML5', 'CSS3', 'JavaScript ES6+', 'Node.js', 'Express'],
        description: 'Corso universitario completo dall\'era mainframe alle moderne architetture cloud',
        lastUpdated: new Date().toISOString()
    });
});

// API per statistiche di utilizzo (placeholder)
app.get('/api/stats', (req, res) => {
    res.json({
        totalViews: Math.floor(Math.random() * 1000) + 500,
        averageTime: '12 minuti',
        completionRate: '78%',
        mostViewedSection: 'microservices'
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        version: process.version
    });
});

// ==================== SPA ROUTING ====================

// Serve index.html per tutte le route non-API (SPA routing)
app.get('*', (req, res, next) => {
    // Se la richiesta è per un file esistente (CSS, JS, HTML nelle pages, etc.)
    // lascia che Express.static lo gestisca
    if (req.path.includes('.')) {
        return next();
    }
    
    // Altrimenti serve la SPA shell
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==================== ERROR HANDLING ====================

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Risorsa non trovata',
        message: 'La risorsa richiesta non esiste su questo server',
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

// Error handler generale
app.use((err, req, res, next) => {
    console.error('Errore server:', err.stack);
    
    res.status(err.status || 500).json({
        error: 'Errore interno del server',
        message: process.env.NODE_ENV === 'production' ? 
                'Si è verificato un errore interno' : err.message,
        timestamp: new Date().toISOString()
    });
});

// ==================== SERVER STARTUP ====================

const server = app.listen(PORT, () => {
    console.log('🚀 ===================================');
    console.log('🏗️  Corso Architettura Web - Server Attivo');
    console.log('🚀 ===================================');
    console.log(`📡 URL Locale:     http://localhost:${PORT}`);
    console.log(`🌐 URL Rete:      http://0.0.0.0:${PORT}`);
    console.log('📚 Sezioni:       25 (dalla storia al Node.js)');
    console.log('⚡ Tecnologie:    SPA + Dynamic Loading');
    console.log('🎯 API Health:    http://localhost:' + PORT + '/api/health');
    console.log('📊 API Info:      http://localhost:' + PORT + '/api/course-info');
    console.log('🚀 ===================================');
    console.log(`🕐 Server avviato alle: ${new Date().toLocaleString('it-IT')}`);
    console.log('💡 Usa Ctrl+C per fermare il server');
    console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM ricevuto, chiusura server...');
    server.close(() => {
        console.log('✅ Server chiuso correttamente');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT ricevuto (Ctrl+C), chiusura server...');
    server.close(() => {
        console.log('✅ Server chiuso correttamente');
        process.exit(0);
    });
});

// Log degli errori non gestiti
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

module.exports = app;