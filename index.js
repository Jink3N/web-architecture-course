/**
 * Server Express minimale per Vercel deployment
 * Serve i file statici dalla cartella public/
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS per tutti gli origins
app.use(cors());

// Middleware per servire file statici dalla cartella public
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true,
    lastModified: true
}));

// Serve lessons-config.json dalla root
app.get('/lessons-config.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'lessons-config.json'));
});

// API routes (importa le funzioni dall'api directory)
app.use('/api', (req, res, next) => {
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

// Error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message 
    });
});

// Per Vercel, esportiamo l'app invece di fare listen
if (process.env.VERCEL) {
    module.exports = app;
} else {
    // Sviluppo locale
    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
}