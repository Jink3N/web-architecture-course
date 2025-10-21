# 🏗️ Architettura Web - Corso Interattivo

Corso universitario completo sull'architettura web dall'era mainframe alle moderne architetture cloud e microservizi.

## 🚀 Avvio Rapido con Node.js

### 1. Installazione Dipendenze

```bash
npm install
```

### 2. Avvio del Server

**Modalità Produzione:**

```bash
npm start
```

**Modalità Sviluppo (con auto-reload):**

```bash
npm run dev
```

### 3. Accesso all'Applicazione

- **URL Locale:** http://localhost:3000
- **URL Rete:** http://0.0.0.0:3000

## 📡 API Disponibili

L'applicazione include anche alcune API REST per future estensioni:

- `GET /api/health` - Health check del server
- `GET /api/course-info` - Informazioni sul corso
- `GET /api/stats` - Statistiche di utilizzo (demo)

## 🏗️ Architettura

### Frontend (SPA)

- **Shell:** `index.html` - Entry point dell'applicazione
- **Sezioni:** `pages/*.html` - 25 sezioni caricate dinamicamente
- **Stili:** `style.css` - CSS centralizzato con tema light/dark
- **Logic:** `app.js` - Gestione navigazione, caricamento dinamico, accessibilità

### Backend (Node.js + Express)

- **Server:** `server.js` - Server Express con middleware moderni
- **Static Files:** Serve tutti i file frontend
- **API:** Endpoints REST per funzionalità future
- **Security:** Helmet, CORS, Compression

## 🎯 Funzionalità

### Navigazione

- ✅ **25 Sezioni Complete:** Dalla storia del web a Node.js
- ✅ **Caricamento Dinamico:** Fetch delle sezioni senza reload pagina
- ✅ **Cache Intelligente:** Ogni sezione caricata una volta sola
- ✅ **Gestione Errori:** Retry automatico e messaggi user-friendly

### Accessibilità

- ✅ **Navigazione Tastiera:** Frecce ← → per precedente/successivo
- ✅ **Screen Readers:** ARIA labels e live regions
- ✅ **Temi:** Light/Dark mode (T per toggle)
- ✅ **Mobile Friendly:** Layout responsive + menu hamburger

### Performance

- ✅ **Lazy Loading:** Sezioni caricate on-demand
- ✅ **Compression:** Gzip per tutti i contenuti
- ✅ **Caching:** Headers appropriati per static assets
- ✅ **Optimized:** Spinner di caricamento e UX fluida

## 📚 Contenuti del Corso

### 🏛️ Fondamenti (9 sezioni)

1. **Introduzione** - Storia e panoramica
2. **Client-Server** - Modello fondamentale
3. **Architettura Monolitica** - Vantaggi e svantaggi
4. **Microservizi** - Scalabilità e distribuzione
5. **Single Page Applications** - SPA vs MPA
6. **HTTP/HTTPS** - Protocolli web
7. **CORS** - Cross-Origin Resource Sharing
8. **CSRF** - Sicurezza e protezioni
9. **URL/URI** - Identificatori web

### 📡 API & REST (4 sezioni)

10. **API/SOAP** - Confronto paradigmi
11. **REST** - Architectural style
12. **Endpoints** - Design e best practices
13. **JSON/XML** - Formati dati

### 🔐 Autenticazione (6 sezioni)

14. **JWT** - JSON Web Tokens
15. **Cookie/Session** - Gestione stato
16. **Web Storage** - LocalStorage e SessionStorage
17. **API Keys** - Autenticazione servizi
18. **OAuth 2.0** - Autorizzazione delegata
19. **OpenID Connect** - Identità e SSO

### 💚 Node.js (6 sezioni)

20. **Node.js Introduzione** - Runtime JavaScript
21. **Installazione** - Setup ambiente sviluppo
22. **VS Code** - IDE e tooling
23. **Prima Applicazione** - Hello World e server base
24. **SPA Dettagli** - Implementazione frontend
25. **SPA con Node.js** - Full-stack integration

## 🛠️ Tecnologie Utilizzate

**Frontend:**

- HTML5 semantico con accessibilità
- CSS3 con variabili e grid/flexbox
- JavaScript ES6+ vanilla (no framework)
- Fetch API per caricamento dinamico

**Backend:**

- Node.js 16+
- Express.js 4.x
- Helmet (sicurezza)
- CORS (cross-origin)
- Compression (gzip)

## 🔧 Configurazione Avanzata

### Variabili d'Ambiente

Crea un file `.env` (opzionale):

```env
PORT=3000
NODE_ENV=development
```

### Proxy per Sviluppo

Se usi un altro server di sviluppo, puoi configurare un proxy verso Node.js.

### Deploy

L'applicazione è pronta per il deploy su:

- **Vercel:** `vercel --prod`
- **Netlify:** Commit su git con auto-deploy
- **Heroku:** `git push heroku main`
- **Docker:** Dockerfile incluso (vedi sotto)

## 🐳 Docker (Opzionale)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📱 Compatibilità Browser

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🤝 Contributi

Il corso è progettato per essere estendibile:

1. **Nuove Sezioni:** Aggiungi file in `pages/`
2. **Temi:** Modifica variabili CSS in `style.css`
3. **API:** Estendi `server.js` con nuovi endpoint
4. **Funzionalità:** Aggiungi logica in `app.js`

## 📄 Licenza

MIT License - Vedi LICENSE per dettagli.

---

**🎓 Steve Jobs Academy**  
_Formare sviluppatori del futuro_
