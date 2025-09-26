# Web Architecture Course - Deploy su Vercel

## Opzioni di Deploy

### Opzione 1: Deploy con Server Node.js (Raccomandato)
La configurazione attuale usa il server Express per servire l'app e fornire API.

### Opzione 2: Deploy Statico (Solo Frontend)
Se preferisci un deploy completamente statico, puoi usare solo i file frontend.

## File di configurazione creati:

### vercel.json
- Configura il routing per SPA
- Imposta headers di sicurezza
- Gestisce file statici e API routes

### .gitignore
- Esclude file non necessari dal deploy
- Mantiene il repository pulito

## Note per Vercel:
- L'app funziona come SPA con caricamento dinamico delle sezioni
- Le API sono opzionali (usate per statistiche e info)
- Tutti i file delle lezioni sono nella cartella `pages/`