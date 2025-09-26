/**
 * API Serverless per Vercel - Corso Architettura Web
 */

export default function handler(req, res) {
    const { method, url } = req;
    
    // CORS Configuration con Best Practices
    const allowedOrigins = [
        'https://web-architecture-course.vercel.app',
        'https://web-architecture-course-*.vercel.app', // Per deployment preview
        'http://localhost:3000',  // Development locale
        'http://localhost:3001',  // Server locale
        'http://127.0.0.1:3000',  // Fallback localhost
        'http://127.0.0.1:3001'   // Fallback localhost
    ];
    
    const origin = req.headers.origin;
    
    // Controlla se l'origin è permesso
    let isAllowed = false;
    if (origin) {
        isAllowed = allowedOrigins.some(allowedOrigin => {
            if (allowedOrigin.includes('*')) {
                // Pattern matching per domini Vercel preview
                const pattern = allowedOrigin.replace(/\*/g, '[a-zA-Z0-9-]+');
                const regex = new RegExp(`^${pattern}$`);
                return regex.test(origin);
            }
            return allowedOrigin === origin;
        });
    }
    
    // Imposta headers CORS sicuri
    if (isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (process.env.NODE_ENV === 'development') {
        // Solo in development, permetti tutti gli origin per facilitare testing
        res.setHeader('Access-Control-Allow-Origin', '*');
    } else {
        // In produzione, nega richieste da origin non autorizzati
        res.setHeader('Access-Control-Allow-Origin', 'https://web-architecture-course.vercel.app');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight per 24h
    res.setHeader('Vary', 'Origin'); // Importante per caching corretto
    
    if (method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Route handlers
    if (url === '/api/course-info') {
        return res.json({
            title: 'Architettura Web: Guida Completa',
            version: '1.0.0',
            sections: 25,
            technologies: ['HTML5', 'CSS3', 'JavaScript ES6+', 'Node.js', 'Express'],
            description: 'Corso universitario completo dall\'era mainframe alle moderne architetture cloud',
            lastUpdated: new Date().toISOString()
        });
    }
    
    if (url === '/api/health') {
        return res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            version: 'vercel-serverless'
        });
    }
    
    if (url === '/api/stats') {
        return res.json({
            totalViews: Math.floor(Math.random() * 1000) + 500,
            averageTime: '12 minuti',
            completionRate: '78%',
            mostViewedSection: 'microservices'
        });
    }
    
    // Default 404
    res.status(404).json({
        error: 'API endpoint not found',
        path: url
    });
}