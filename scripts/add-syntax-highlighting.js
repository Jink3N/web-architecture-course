#!/usr/bin/env node

/**
 * Script per aggiungere syntax highlighting (Prism.js) ai blocchi di codice
 * nelle pagine HTML del corso.
 * 
 * Scansiona tutti i file HTML in public/pages/ e:
 * - Identifica il linguaggio dei blocchi <pre><code>
 * - Aggiunge le classi Prism.js appropriate
 * - Aggiunge la classe line-numbers per numerazione righe
 */

const fs = require('fs');
const path = require('path');

// Configurazione
const pagesDir = path.join(__dirname, '..', 'public', 'pages');
const dryRun = process.argv.includes('--dry-run');
const verbose = process.argv.includes('--verbose');

// Statistiche
let stats = {
    filesProcessed: 0,
    blocksFound: 0,
    blocksUpdated: 0,
    errors: []
};

/**
 * Identifica il linguaggio del codice basandosi sul contenuto
 */
function detectLanguage(code) {
    // Rimuovi spazi bianchi per analisi
    const trimmed = code.trim();
    
    // JavaScript/Node.js
    if (
        /^(const|let|var|function|class|import|export|require|module\.exports)\b/.test(trimmed) ||
        /=>\s*{/.test(trimmed) ||
        /console\.(log|error|warn)/.test(trimmed) ||
        /(async|await)\s+(function|=>)/.test(trimmed) ||
        /\{\s*["']?\w+["']?\s*:\s*/.test(trimmed)  // oggetti JS
    ) {
        return 'javascript';
    }
    
    // Bash/Shell
    if (
        /^(npm|node|cd|ls|mkdir|rm|cp|mv|cat|echo|chmod|chown|curl|wget|git)\s/.test(trimmed) ||
        /^\$\s+(npm|node|cd|git|curl)/.test(trimmed) ||
        /^#!\/bin\/(bash|sh)/.test(trimmed) ||
        /&&|\|\|/.test(trimmed) && /^(npm|yarn|git)/.test(trimmed) ||
        /^curl\s+-/.test(trimmed) ||
        /^(export|source)\s+\w+=/.test(trimmed)
    ) {
        return 'bash';
    }
    
    // JSON
    if (
        /^\{[\s\S]*".*":\s*/.test(trimmed) ||
        /^\[[\s\S]*\{[\s\S]*".*":/.test(trimmed)
    ) {
        // Verifica che sia JSON valido, non JS object
        if (!/(const|let|var|function|=>)/.test(trimmed)) {
            return 'json';
        }
    }
    
    // HTML
    if (
        /^<!DOCTYPE html>/i.test(trimmed) ||
        /^<html[\s>]/i.test(trimmed) ||
        /^<(div|section|article|header|footer|nav|aside|main)[\s>]/i.test(trimmed)
    ) {
        return 'html';
    }
    
    // CSS
    if (
        /^\s*[.#]?[\w-]+\s*\{/.test(trimmed) ||
        /^\s*@(media|keyframes|import)/.test(trimmed) ||
        /:\s*[\w-]+;/.test(trimmed)
    ) {
        return 'css';
    }
    
    // XML/SOAP
    if (
        /^<\?xml/.test(trimmed) ||
        /<soap:Envelope/.test(trimmed) ||
        /<SOAP-ENV:/.test(trimmed)
    ) {
        return 'xml';
    }
    
    // SQL
    if (
        /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/i.test(trimmed) ||
        /\b(FROM|WHERE|JOIN|GROUP BY|ORDER BY)\b/i.test(trimmed)
    ) {
        return 'sql';
    }
    
    // TypeScript
    if (
        /:\s*(string|number|boolean|any|void|Promise<)/.test(trimmed) ||
        /interface\s+\w+\s*\{/.test(trimmed) ||
        /type\s+\w+\s*=/.test(trimmed)
    ) {
        return 'typescript';
    }
    
    // Python
    if (
        /^(def|class|import|from|if __name__|print\()/.test(trimmed) ||
        /@\w+\s*$/.test(trimmed.split('\n')[0]) // decorators
    ) {
        return 'python';
    }
    
    // HTTP Request/Response
    if (
        /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+\//.test(trimmed) ||
        /^HTTP\/\d\.\d\s+\d{3}/.test(trimmed) ||
        /^(Content-Type|Authorization|Accept|Set-Cookie|Access-Control):\s/.test(trimmed) ||
        /^(GET|POST|PUT|DELETE|PATCH)\s+\/.*\nHost:/.test(trimmed)
    ) {
        return 'http';
    }
    
    // Nginx/Apache config
    if (
        /^(server|location|listen|root|proxy_pass)\s*\{/.test(trimmed) ||
        /^\s*(listen|server_name|location)\s+/.test(trimmed)
    ) {
        return 'nginx';
    }
    
    // Markdown (solo se ha realmente sintassi markdown)
    if (
        /^#{1,6}\s+/.test(trimmed) ||
        (/^\*\s+/.test(trimmed) && /\n\*\s+/.test(trimmed))
    ) {
        return 'markdown';
    }
    
    // YAML
    if (
        /^---\s*$/.test(trimmed.split('\n')[0]) ||
        /^\w+:\s*$/.test(trimmed) && /\n\s{2,}\w+:/.test(trimmed)
    ) {
        return 'yaml';
    }
    
    // Default: javascript per compatibilità (meglio di markup)
    // Molti snippet misti sono meglio renderizzati come JS
    if (code.length < 200 && !/<[a-z]+/.test(trimmed)) {
        return 'javascript';
    }
    
    // Default: markup generico per HTML o testo
    return 'markup';
}

/**
 * Processa un blocco di codice e aggiunge le classi Prism.js
 */
function processCodeBlock(match, preAttributes, codeAttributes, codeContent) {
    stats.blocksFound++;
    
    // Estrai attributi esistenti
    const preAttrs = preAttributes || '';
    const codeAttrs = codeAttributes || '';
    
    // Se ha già una classe language-*, non modificare
    if (/class=["'][^"']*language-\w+/.test(codeAttrs)) {
        if (verbose) console.log('  ⏭️  Blocco già con syntax highlighting, skip');
        return match;
    }
    
    // Identifica il linguaggio
    const language = detectLanguage(codeContent);
    
    if (verbose) {
        console.log(`  🔍 Linguaggio rilevato: ${language}`);
        console.log(`     Anteprima: ${codeContent.substring(0, 50)}...`);
    }
    
    // Aggiungi classe line-numbers al <pre> se non presente
    let newPreAttrs = preAttrs;
    if (!preAttrs.includes('class=')) {
        newPreAttrs = ' class="line-numbers"';
    } else if (!preAttrs.includes('line-numbers')) {
        newPreAttrs = preAttrs.replace(/class=["']([^"']*)["']/, 'class="$1 line-numbers"');
    }
    
    // Aggiungi classe language-* al <code>
    let newCodeAttrs = codeAttrs;
    if (!codeAttrs.includes('class=')) {
        newCodeAttrs = ` class="language-${language}"`;
    } else {
        newCodeAttrs = codeAttrs.replace(/class=["']([^"']*)["']/, `class="$1 language-${language}"`);
    }
    
    stats.blocksUpdated++;
    
    return `<pre${newPreAttrs}><code${newCodeAttrs}>${codeContent}</code></pre>`;
}

/**
 * Processa un file HTML
 */
function processHtmlFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Regex per trovare blocchi <pre><code>...</code></pre>
        // Cattura attributi opzionali e contenuto
        const regex = /<pre([^>]*)><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g;
        
        const originalBlockCount = stats.blocksFound;
        const newContent = content.replace(regex, processCodeBlock);
        
        const blocksInFile = stats.blocksFound - originalBlockCount;
        
        if (blocksInFile > 0) {
            console.log(`\n📄 ${path.relative(pagesDir, filePath)}`);
            console.log(`   Blocchi trovati: ${blocksInFile}`);
            
            if (newContent !== content) {
                if (dryRun) {
                    console.log('   ⚠️  DRY RUN: modifiche non salvate');
                } else {
                    fs.writeFileSync(filePath, newContent, 'utf8');
                    console.log('   ✅ File aggiornato');
                }
            } else {
                console.log('   ℹ️  Nessuna modifica necessaria');
            }
        }
        
        stats.filesProcessed++;
        
    } catch (error) {
        stats.errors.push({ file: filePath, error: error.message });
        console.error(`\n❌ Errore processando ${filePath}:`, error.message);
    }
}

/**
 * Scansiona ricorsivamente una directory
 */
function scanDirectory(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
            scanDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            processHtmlFile(fullPath);
        }
    }
}

// Main execution
console.log('🎨 Script Syntax Highlighting - Prism.js\n');
console.log('📁 Directory:', pagesDir);
console.log('🔧 Modalità:', dryRun ? 'DRY RUN (test)' : 'SCRITTURA');
console.log('📝 Verbose:', verbose ? 'SI' : 'NO');
console.log('\n' + '='.repeat(60) + '\n');

if (!fs.existsSync(pagesDir)) {
    console.error('❌ Directory non trovata:', pagesDir);
    process.exit(1);
}

// Scansiona tutte le directory
scanDirectory(pagesDir);

// Stampa statistiche finali
console.log('\n' + '='.repeat(60));
console.log('\n📊 STATISTICHE FINALI\n');
console.log(`✅ File processati: ${stats.filesProcessed}`);
console.log(`🔍 Blocchi di codice trovati: ${stats.blocksFound}`);
console.log(`🎨 Blocchi aggiornati: ${stats.blocksUpdated}`);
console.log(`⏭️  Blocchi già formattati: ${stats.blocksFound - stats.blocksUpdated}`);

if (stats.errors.length > 0) {
    console.log(`\n❌ Errori: ${stats.errors.length}`);
    stats.errors.forEach(({ file, error }) => {
        console.log(`   - ${file}: ${error}`);
    });
}

console.log('\n' + '='.repeat(60));

if (dryRun) {
    console.log('\n⚠️  DRY RUN completato. Esegui senza --dry-run per applicare le modifiche.\n');
} else {
    console.log('\n✨ Syntax highlighting aggiunto con successo!\n');
}

process.exit(stats.errors.length > 0 ? 1 : 0);
