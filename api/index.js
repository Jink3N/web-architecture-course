/**
 * API Serverless per Vercel - Corso Architettura Web
 */

export default function handler(req, res) {
    const { method, url } = req;
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
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