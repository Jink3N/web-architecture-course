# 🔒 Miglioramenti di Sicurezza e Best Practices

## 1. Content Security Policy (CSP) ⚠️ CRITICO

### Problema Attuale
```javascript
// index.js - ATTUALMENTE DISABILITATO
contentSecurityPolicy: false,
```

### Soluzione Raccomandata
```javascript
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'", // Solo per Prism.js - da rimuovere se possibile
                    "https://cdn.jsdelivr.net",
                    "https://cdnjs.cloudflare.com"
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://cdn.jsdelivr.net"
                ],
                imgSrc: ["'self'", "data:", "https:"],
                fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
                connectSrc: ["'self'"],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: []
            }
        },
        crossOriginEmbedderPolicy: true,
        crossOriginResourcePolicy: { policy: "cross-origin" }
    })
);
```

---

## 2. Variabili d'Ambiente ⚠️ IMPORTANTE

### Problema Attuale
- Configurazioni hardcoded nel codice
- Nessun file `.env` per segreti

### Soluzione Raccomandata

#### Crea `.env` file:
```bash
# .env (NON COMMITTARE!)
NODE_ENV=development
PORT=3000

# Security
HELMET_CSP_ENABLED=true
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=300

# Cache
STATIC_CACHE_MAX_AGE=604800
HTML_CACHE_CONTROL=no-cache

# Logging
LOG_LEVEL=info
MORGAN_FORMAT=dev
```

#### Installa dotenv:
```bash
npm install dotenv
```

#### Usa in index.js:
```javascript
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const corsOrigin = process.env.CORS_ORIGIN?.split(',') || true;

app.use(cors({
    origin: corsOrigin,
    credentials: true,
}));
```

---

## 3. CSRF Protection 🛡️ RACCOMANDATO

### Problema Attuale
- Nessuna protezione CSRF implementata

### Soluzione Raccomandata
```bash
npm install csurf cookie-parser
```

```javascript
const cookieParser = require('cookie-parser');
const csrf = require('csurf');

app.use(cookieParser());

// CSRF protection per form POST
const csrfProtection = csrf({ cookie: true });

app.get('/api/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Proteggi route POST
app.post('/api/*', csrfProtection, (req, res, next) => {
    // API logic
});

// Error handling CSRF
app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        res.status(403).json({ error: 'Invalid CSRF token' });
    } else {
        next(err);
    }
});
```

---

## 4. Input Validation & Sanitization ⚠️ IMPORTANTE

### Problema Attuale
- Nessuna validazione input API

### Soluzione Raccomandata
```bash
npm install express-validator
```

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/contact',
    [
        body('email').isEmail().normalizeEmail(),
        body('name').trim().isLength({ min: 2, max: 100 }).escape(),
        body('message').trim().isLength({ min: 10, max: 1000 }).escape()
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        // Process validated input
    }
);
```

---

## 5. Testing ✅ ESSENZIALE

### Problema Attuale
```json
"test": "echo 'No tests configured yet' && exit 0"
```

### Soluzione Raccomandata

#### Installa testing framework:
```bash
npm install --save-dev jest supertest
```

#### Crea `tests/server.test.js`:
```javascript
const request = require('supertest');
const app = require('../index');

describe('Server Health Checks', () => {
    test('GET /health should return 200', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('status', 'healthy');
    });

    test('Static files should be served', async () => {
        const res = await request(app).get('/index.html');
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toMatch(/html/);
    });

    test('Rate limiting should work', async () => {
        // Test rate limit
        for (let i = 0; i < 301; i++) {
            await request(app).get('/api/test');
        }
        const res = await request(app).get('/api/test');
        expect(res.statusCode).toBe(429);
    });
});
```

#### Aggiorna package.json:
```json
"scripts": {
    "test": "jest --coverage",
    "test:watch": "jest --watch"
}
```

---

## 6. Logging Avanzato 📊 RACCOMANDATO

### Problema Attuale
- Solo console.log e Morgan HTTP logging

### Soluzione Raccomandata
```bash
npm install winston winston-daily-rotate-file
```

```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxFiles: '14d'
        }),
        new winston.transports.DailyRotateFile({
            filename: 'logs/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '7d'
        })
    ]
});

// Usa invece di console.log
logger.info('Server started');
logger.error('Error occurred', { error: err });
```

---

## 7. Database Connection & Error Handling 💾

### Se/Quando aggiungi database:
```javascript
// Connessione con retry logic
const connectDB = async (retries = 5) => {
    try {
        await mongoose.connect(process.env.DATABASE_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        logger.info('Database connected');
    } catch (err) {
        logger.error('Database connection failed', { error: err });
        if (retries > 0) {
            logger.info(`Retrying... (${retries} attempts left)`);
            setTimeout(() => connectDB(retries - 1), 5000);
        } else {
            process.exit(1);
        }
    }
};
```

---

## 8. API Versioning 🔄 BEST PRACTICE

### Soluzione Raccomandata
```javascript
// Versiona le tue API
app.use('/api/v1', require('./routes/v1'));
app.use('/api/v2', require('./routes/v2'));

// Redirect default a latest version
app.use('/api', (req, res, next) => {
    req.url = '/v1' + req.url;
    next();
});
```

---

## 9. Monitoring & Health Checks 📈

### Migliora health check endpoint:
```javascript
app.get('/health', async (req, res) => {
    const healthcheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
        checks: {
            database: 'OK', // Se hai DB, fai un ping
            memory: {
                used: process.memoryUsage().heapUsed / 1024 / 1024,
                total: process.memoryUsage().heapTotal / 1024 / 1024,
                percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
            },
            cpu: process.cpuUsage()
        }
    };

    try {
        res.status(200).json(healthcheck);
    } catch (error) {
        healthcheck.message = error;
        res.status(503).json(healthcheck);
    }
});
```

---

## 10. Client-Side Miglioramenti 🎨

### Service Worker per PWA
```javascript
// public/sw.js
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('v1').then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/style.css',
                '/app.js'
            ]);
        })
    );
});
```

### Lazy Loading Immagini
```html
<img src="placeholder.jpg" data-src="actual-image.jpg" loading="lazy" />
```

---

## Priorità di Implementazione

### 🔴 CRITICO (Implementa subito)
1. ✅ Content Security Policy
2. ✅ Variabili d'ambiente (.env)
3. ✅ CSRF Protection

### 🟡 IMPORTANTE (Prossime settimane)
4. ✅ Input Validation
5. ✅ Testing Suite
6. ✅ Logging Avanzato

### 🟢 RACCOMANDATO (Quando hai tempo)
7. ✅ Database Error Handling
8. ✅ API Versioning
9. ✅ Monitoring avanzato
10. ✅ PWA Features

---

## Checklist Finale

- [ ] CSP abilitato con whitelist CDN
- [ ] File .env creato e .gitignore aggiornato
- [ ] CSRF tokens implementati
- [ ] Input validation su tutte le API
- [ ] Test coverage > 80%
- [ ] Winston logger configurato
- [ ] Health check avanzato
- [ ] API versioning implementato
- [ ] Service Worker per offline support
- [ ] Monitoring/Analytics integrato

