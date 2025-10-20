/**
 * Server Express minimale per Vercel deployment
 * Serve i file statici dalla cartella public/
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy per rate limiting e IP corretti su Vercel/Proxies
app.set('trust proxy', 1);

// Logging HTTP (in produzione log minimal, in dev più verboso)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Sicurezza con Helmet (headers HTTP sicuri)
app.use(helmet({
    // CSP personalizzabile se necessario; per ora omesso per non bloccare Prism.js
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false, // evitiamo conflitti con CDN
}));

// Abilita CORS in modo safe (limita metodi e headers)
app.use(cors({
    origin: true, // riflette l'origin della richiesta; per controllo fine-grained usare lista
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compressione gzip/br per payload più rapidi
app.use(compression());

// Rate limit per API per mitigare abusi
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 300, // max richieste per IP per window
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware per servire file statici dalla cartella public
app.use((req, res, next) => {
    // Alcuni header sicuri e performance hints per tutte le risposte
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
});

app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        // Asset fingerprintati potrebbero avere cache più lunga; qui manteniamo semplice
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        } else {
            res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        }
    }
}));

// Serve lessons-config.json dalla root
app.get('/lessons-config.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'lessons-config.json'));
});

// Health check endpoint migliorato
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: require('./package.json').version
    });
});

// API routes (importa le funzioni dall'api directory) con rate limit
app.use('/api', apiLimiter, (req, res, next) => {
    // Importa dinamicamente l'handler API
    try {
        const apiHandler = require('./api/index.js');
        if (apiHandler.default) {
            apiHandler.default(req, res);
        } else {
            apiHandler(req, res);
        }
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// SPA Fallback - serve index.html per tutte le route non-API
app.get('*', (req, res) => {
    // Se è una richiesta per un file esistente, lascia che express.static la gestisca
    if (req.path.includes('.') && !req.path.includes('html')) {
        return res.status(404).json({ error: 'File not found' });
    }
    
    // Altrimenti serve la SPA
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler migliorato
app.use((err, req, res, next) => {
    // Log dell'errore con dettagli
    console.error('Server Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    
    // Risposta user-friendly
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ 
        error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// 404 handler per route non trovate
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} not found`,
        timestamp: new Date().toISOString()
    });
});

// Per Vercel, esportiamo l'app invece di fare listen
if (process.env.VERCEL) {
    module.exports = app;
} else {
    // Sviluppo locale
    const server = app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM received, closing server gracefully...');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });
    
    process.on('SIGINT', () => {
        console.log('\nSIGINT received, closing server gracefully...');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });
}