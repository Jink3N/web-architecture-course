/**
 * Applicazione Educativa Completa per Architettura Web
 * Con supporto Dark/Light Theme Toggle e contenuti universitari approfonditi
 */

class WebArchitectureApp {
    constructor() {
        // Stato dinamico delle lezioni
        this.lessonsConfig = null;
        this.currentLesson = 'lezione-1'; // default
        this.currentSection = 'intro';
        this.sections = [];
        this.pageMap = {};
        
        // Cache per contenuti caricati dinamicamente
        this.sectionCache = new Map();
        this.lessonsCache = new Map();
        
        // UI State
        this.isMobile = window.innerWidth <= 768;
        this.sidebarVisible = !this.isMobile;
        this.currentTheme = this.getInitialTheme();
        
        this.init();
    }

    async init() {
        try {
            this._isInitializing = true;
            console.log('🚀 Inizializzazione WebArchitectureApp...');
            
            // Carica configurazione delle lezioni
            await this.loadLessonsConfig();
            
            // Carica la lezione salvata o usa default
            const savedLesson = localStorage.getItem('web-arch-current-lesson');
            if (savedLesson && this.lessonsConfig.lessons[savedLesson]) {
                this.currentLesson = savedLesson;
            } else {
                // Nessuna lezione salvata o lezione non valida, usa default e salva
                localStorage.setItem('web-arch-current-lesson', this.currentLesson);
            }
            
            // Prima caching degli elementi DOM (necessario per updateSidebarForLesson)
            this.cacheDOMElements();
            
            // Inizializza la lezione corrente
            this.setCurrentLesson(this.currentLesson);
            
            // Forza aggiornamento sidebar se non è stata popolata
            if (this.navList && this.navList.children.length <= 1) {
                const currentLessonConfig = this.lessonsConfig.lessons[this.currentLesson];
                if (currentLessonConfig) {
                    this.updateSidebarForLesson(currentLessonConfig);
                }
            }
            
            // Setup navigation listeners dopo l'impostazione della lezione
            this.setupNavigationListeners();
            
            // Continua con l'inizializzazione normale
            this.initializeTheme();
            this.setupEventListeners();
            this.createLessonSelector();
            this.updateProgress();
            this.createMobileMenuToggle();
            this.setupKeyboardNavigation();
            this.setupAccessibility();
            
            // Inizializza la prima sezione o intro se nella lezione 1
            const initialSection = this.currentLesson === 'lezione-1' ? 'intro' : this.sections[0];
            if (initialSection) {
                const isDynamicLoad = initialSection !== 'intro'; // intro è già nel DOM
                this.navigateToSection(initialSection, false, isDynamicLoad);
            }
            
            console.log('✅ Applicazione caricata correttamente');
            
            this._isInitializing = false;
        } catch (error) {
            console.error('❌ Errore inizializzazione:', error);
            this._isInitializing = false;
            this.showErrorMessage('Errore nel caricamento della configurazione delle lezioni');
        }
    }

    cacheDOMElements() {
        // Header elements
        this.header = document.querySelector('.app-header');
        this.themeToggle = document.getElementById('themeToggle');
        this.themeToggleIcon = this.themeToggle?.querySelector('.theme-toggle-icon');
        this.themeToggleText = this.themeToggle?.querySelector('.theme-toggle-text');
        
        // Sidebar elements
        this.sidebar = document.getElementById('sidebar');
        this.navList = document.getElementById('navList');
        this.navItems = Array.from(document.querySelectorAll('.nav-item'));
        this.navLinks = Array.from(document.querySelectorAll('.nav-link'));
        this.toggleSidebarBtn = document.getElementById('toggleSidebar');
        
        // Verifica elementi critici
        if (!this.navList) {
            console.error('❌ Elemento navList non trovato nel DOM!');
        }
        
        // Progress elements
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        
        // Main content
        this.mainContent = document.getElementById('mainContent');
        this.contentContainer = document.getElementById('contentContainer');
        this.contentSections = Array.from(document.querySelectorAll('.content-section'));
        
        // Mobile overlay
        this.sidebarOverlay = null; // Sarà creato dinamicamente
    }

    // ==================== THEME MANAGEMENT ====================
    
    getInitialTheme() {
        // Priorità: localStorage -> system preference -> default light
        const savedTheme = localStorage.getItem('web-arch-theme');
        if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
            return savedTheme;
        }
        
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    }

    initializeTheme() {
        this.applyTheme(this.currentTheme);
        this.updateThemeToggle();
        
        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            // Solo se non c'è una preferenza salvata
            if (!localStorage.getItem('web-arch-theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                this.switchTheme(newTheme);
            }
        });
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-color-scheme', theme);
        document.body.className = `theme-${theme}`;
        this.currentTheme = theme;
        
        // Salva preferenza utente
        localStorage.setItem('web-arch-theme', theme);
        
        console.log(`🎨 Tema applicato: ${theme}`);
    }

    switchTheme(newTheme = null) {
        const targetTheme = newTheme || (this.currentTheme === 'light' ? 'dark' : 'light');
        
        // Animazione smooth per il cambio tema
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        
        this.applyTheme(targetTheme);
        this.updateThemeToggle();
        
        // Annuncia il cambio per screen readers
        this.announceThemeChange(targetTheme);
        
        // Rimuovi la transizione dopo l'animazione
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    updateThemeToggle() {
        if (!this.themeToggle || !this.themeToggleIcon || !this.themeToggleText) return;
        
        const isDark = this.currentTheme === 'dark';
        
        // Aggiorna icona
        this.themeToggleIcon.textContent = isDark ? '☀️' : '🌙';
        
        // Aggiorna testo
        this.themeToggleText.textContent = isDark ? 'Light' : 'Dark';
        
        // Aggiorna attributi accessibilità
        this.themeToggle.setAttribute('aria-label', 
            `Cambia a tema ${isDark ? 'chiaro' : 'scuro'}`);
        
        // Aggiorna classe per stili CSS
        this.themeToggle.classList.toggle('dark-mode', isDark);
    }

    announceThemeChange(theme) {
        const message = `Tema cambiato a ${theme === 'dark' ? 'scuro' : 'chiaro'}`;
        if (this.liveRegion) {
            this.liveRegion.textContent = message;
            setTimeout(() => {
                this.liveRegion.textContent = '';
            }, 2000);
        }
    }

    // ==================== LESSONS MANAGEMENT ====================

    async loadLessonsConfig() {
        try {
            // Prima proviamo il file esterno
            const response = await fetch('./lessons-config.json');
            if (response.ok) {
                this.lessonsConfig = await response.json();
                console.log('✅ Configurazione caricata da file esterno');
                return;
            }
        } catch (error) {
            console.warn('⚠️ File lessons-config.json non disponibile, uso configurazione integrata');
        }
        
        // Fallback alla configurazione integrata
        this.lessonsConfig = this.getEmbeddedLessonsConfig();
        console.log('✅ Configurazione caricata da fallback integrato');
    }

    getEmbeddedLessonsConfig() {
        return {
            "lessons": {
                "lezione-1": {
                    "title": "Lezione 1: Fondamenti di Architettura Web",
                    "description": "Dalle architetture tradizionali alle moderne SPA con Node.js",
                    "icon": "🏗️",
                    "sections": [
                        { "id": "intro", "title": "Introduzione", "icon": "🏗️", "file": "intro.html" },
                        { "id": "client-server", "title": "Client-Server", "icon": "🔄", "file": "client-server.html" },
                        { "id": "monolithic", "title": "Architettura Monolitica", "icon": "🏢", "file": "monolithic.html" },
                        { "id": "microservices", "title": "Microservizi", "icon": "🔧", "file": "microservices.html" },
                        { "id": "spa", "title": "Single Page Application", "icon": "📱", "file": "spa.html" },
                        { "id": "http", "title": "Protocollo HTTP", "icon": "🌐", "file": "http.html" },
                        { "id": "cors", "title": "Cross-Origin Resource Sharing", "icon": "🔐", "file": "cors.html" },
                        { "id": "csrf", "title": "Cross-Site Request Forgery", "icon": "🛡️", "file": "csrf.html" },
                        { "id": "url-uri", "title": "URL e URI", "icon": "🔗", "file": "url-uri.html" },
                        { "id": "api-soap", "title": "API e SOAP", "icon": "📡", "file": "api-soap.html" },
                        { "id": "rest", "title": "RESTful APIs", "icon": "🔄", "file": "rest.html" },
                        { "id": "endpoints", "title": "Endpoints", "icon": "🎯", "file": "endpoints.html" },
                        { "id": "json-xml", "title": "JSON vs XML", "icon": "📋", "file": "json-xml.html" },
                        { "id": "jwt", "title": "JSON Web Tokens", "icon": "🔑", "file": "jwt.html" },
                        { "id": "cookie-session", "title": "Cookie e Sessioni", "icon": "🍪", "file": "cookie-session.html" },
                        { "id": "webstorage", "title": "Web Storage", "icon": "💾", "file": "webstorage.html" },
                        { "id": "api-keys", "title": "API Keys", "icon": "🔐", "file": "api-keys.html" },
                        { "id": "oauth", "title": "OAuth 2.0", "icon": "🔓", "file": "oauth.html" },
                        { "id": "oidc", "title": "OpenID Connect", "icon": "🆔", "file": "oidc.html" },
                        { "id": "nodejs-intro", "title": "Introduzione a Node.js", "icon": "💚", "file": "nodejs-intro.html" },
                        { "id": "installation", "title": "Installazione Node.js", "icon": "⚙️", "file": "installation.html" },
                        { "id": "vscode", "title": "VS Code per Node.js", "icon": "💻", "file": "vscode.html" },
                        { "id": "first-app", "title": "Prima Applicazione", "icon": "🚀", "file": "first-app.html" },
                        { "id": "spa-details", "title": "SPA - Dettagli Tecnici", "icon": "⚡", "file": "spa-details.html" },
                        { "id": "spa-nodejs", "title": "SPA con Node.js", "icon": "🌟", "file": "spa-nodejs.html" }
                    ]
                },
                "lezione-2": {
                    "title": "Lezione 2: Architetture Avanzate",
                    "description": "Database, caching, deployment e scaling",
                    "icon": "🚀",
                    "sections": [
                        { "id": "database-intro", "title": "Database Fundamentals", "icon": "🗄️", "file": "database-intro.html" },
                        { "id": "sql-nosql", "title": "SQL vs NoSQL", "icon": "📊", "file": "sql-nosql.html" },
                        { "id": "caching", "title": "Strategie di Caching", "icon": "⚡", "file": "caching.html" },
                        { "id": "deployment", "title": "Deployment e DevOps", "icon": "🚢", "file": "deployment.html" }
                    ]
                }
            }
        };
    }

    setCurrentLesson(lessonId) {
        if (!this.lessonsConfig || !this.lessonsConfig.lessons[lessonId]) {
            console.error(`Lezione ${lessonId} non trovata`);
            return false;
        }

        this.currentLesson = lessonId;
        const lesson = this.lessonsConfig.lessons[lessonId];
        
        // Aggiorna sections e pageMap per la lezione corrente
        this.sections = lesson.sections.map(s => s.id);
        this.pageMap = {};
        lesson.sections.forEach(section => {
            this.pageMap[section.id] = section.file;
        });


        this.updateSidebarForLesson(lesson);
        return true;
    }

    updateSidebarForLesson(lesson) {
        if (!this.navList) {
            console.warn('⚠️ navList non disponibile in updateSidebarForLesson');
            return;
        }
        
        console.log('🔄 Aggiornamento sidebar per lezione:', lesson.title);

        // Pulisci la navigazione attuale (inclusi elementi hardcoded)
        this.navList.innerHTML = '';

        // Aggiungi le sezioni della lezione corrente
        lesson.sections.forEach((section, index) => {
            const li = document.createElement('li');
            li.className = `nav-item ${index === 0 ? 'active' : ''}`;
            li.setAttribute('data-section', section.id);

            li.innerHTML = `
                <a href="#${section.id}" class="nav-link" data-file="${section.file}">
                    <span class="nav-icon">${section.icon}</span>
                    <span class="nav-text">${section.title}</span>
                </a>
            `;

            this.navList.appendChild(li);
        });

        // Aggiorna il titolo della sidebar
        const sidebarTitle = document.querySelector('.sidebar-title');
        if (sidebarTitle) {
            sidebarTitle.textContent = `${lesson.icon} ${lesson.title.split(':')[0]}`;
        }

        const sidebarSubtitle = document.querySelector('.sidebar-subtitle');
        if (sidebarSubtitle) {
            sidebarSubtitle.textContent = lesson.description;
        }

        // Aggiorna il pulsante "Inizia la Lezione" per puntare alla prima sezione
        this.updateStartCourseButton(lesson);

        // Re-cache DOM elements per la navigazione
        this.navItems = Array.from(document.querySelectorAll('.nav-item'));
        this.navLinks = Array.from(document.querySelectorAll('.nav-link'));
        
        // Event delegation gestisce automaticamente i nuovi elementi
    }

    updateStartCourseButton(lesson) {
        const startBtn = document.getElementById('startCourseBtn');
        if (!startBtn || !lesson.sections || lesson.sections.length === 0) return;

        // Per il pulsante "Inizia il Corso", naviga alla seconda sezione se esiste (dopo intro)
        // altrimenti vai alla prima sezione
        const targetSection = lesson.sections.length > 1 ? lesson.sections[1] : lesson.sections[0];
        
        // Rimuovi event listener precedenti
        const newBtn = startBtn.cloneNode(true);
        startBtn.parentNode.replaceChild(newBtn, startBtn);
        
        // Aggiungi nuovo event listener per la sezione target
        newBtn.addEventListener('click', () => {
            const dynamicLoad = targetSection.id !== 'intro';
            this.navigateToSection(targetSection.id, true, dynamicLoad);
        });
    }

    createLessonSelector() {
        if (!this.lessonsConfig) {
            console.warn('⚠️ lessonsConfig non disponibile per createLessonSelector');
            return;
        }

        // Trova il selettore esistente (dovrebbe già essere nell'HTML)
        let selector = document.getElementById('lessonSelector');
        if (!selector) {
            const header = document.querySelector('.app-header .header-content');
            if (!header) {
                console.error('❌ Header non trovato');
                return;
            }

            selector = document.createElement('select');
            selector.id = 'lessonSelector';
            selector.className = 'lesson-selector';
            selector.setAttribute('aria-label', 'Seleziona lezione');
            
            // Inserisci dopo il titolo
            const title = header.querySelector('.header-title');
            if (title) {
                title.insertAdjacentElement('afterend', selector);
            }
        }

        // Popola le opzioni
        selector.innerHTML = '';
        Object.entries(this.lessonsConfig.lessons).forEach(([lessonId, lesson]) => {
            const option = document.createElement('option');
            option.value = lessonId;
            option.textContent = `${lesson.icon} ${lesson.title.split(':')[0]}`;
            option.selected = lessonId === this.currentLesson;
            selector.appendChild(option);
        });

        // Forza la sincronizzazione del valore selezionato
        selector.value = this.currentLesson;
        
        // Event listener per cambio lezione
        selector.addEventListener('change', (e) => {
            console.log('🔄 Cambio lezione richiesto:', e.target.value);
            this.switchLesson(e.target.value);
        });
        

    }

    async switchLesson(lessonId) {
        if (lessonId === this.currentLesson) return;

        try {
            console.log(`🔄 Iniziando cambio lezione da ${this.currentLesson} a ${lessonId}`);
            
            // Pulisci la cache delle sezioni
            this.sectionCache.clear();
            
            // Rimuovi tutte le sezioni dal DOM tranne intro
            const sectionsToRemove = document.querySelectorAll('.content-section:not(#intro)');
            sectionsToRemove.forEach(section => section.remove());

            // Imposta la nuova lezione
            const success = this.setCurrentLesson(lessonId);
            if (!success) {
                throw new Error(`Impossibile impostare la lezione ${lessonId}`);
            }
            
            // Reset alla prima sezione disponibile per la lezione
            const firstSectionId = this.sections[0];
            if (!firstSectionId) {
                throw new Error('Nessuna sezione disponibile per questa lezione');
            }
            
            console.log(`🎯 Navigando alla prima sezione della lezione: ${firstSectionId}`);
            
            // Per la lezione-1 la prima sezione è 'intro' che è già nel DOM
            // Per altre lezioni potrebbe essere diversa e necessitare di caricamento dinamico
            if (lessonId === 'lezione-1' && firstSectionId === 'intro') {
                // Caso speciale per lezione-1: intro è già presente nel DOM
                const introSection = document.getElementById('intro');
                if (introSection) {
                    // Rimuovi active da tutte le sezioni
                    document.querySelectorAll('.content-section.active').forEach(s => s.classList.remove('active'));
                    // Attiva intro
                    introSection.classList.add('active');
                    
                    // Aggiorna la navigazione per puntare a intro
                    document.querySelectorAll('.nav-item.active').forEach(n => n.classList.remove('active'));
                    const introNavItem = document.querySelector('[data-section="intro"]');
                    if (introNavItem) {
                        introNavItem.classList.add('active');
                    }
                    
                    this.currentSection = 'intro';
                    this.updateProgress();
                    this.scrollToTop();
                } else {
                    throw new Error('Sezione intro non trovata nel DOM');
                }
            } else {
                // Per altre lezioni, naviga alla prima sezione con caricamento dinamico
                this.navigateToSection(firstSectionId, true, true);
            }

            // Salva la lezione corrente
            localStorage.setItem('web-arch-current-lesson', lessonId);

            this.announceMessage(`Caricata ${this.lessonsConfig.lessons[lessonId].title}`);
            console.log(`✅ Cambio lezione completato: ${lessonId}`);

        } catch (error) {
            console.error('❌ Errore cambio lezione:', error);
            this.showErrorMessage('Errore nel cambio di lezione. Ricarica la pagina.');
        }
    }

    getAvailableLessons() {
        if (!this.lessonsConfig) return [];
        return Object.entries(this.lessonsConfig.lessons).map(([id, lesson]) => ({
            id,
            title: lesson.title,
            description: lesson.description,
            icon: lesson.icon,
            sectionsCount: lesson.sections.length
        }));
    }

    // ==================== EVENT LISTENERS ====================

    setupEventListeners() {
        // Theme toggle
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTheme();
            });
        }

        // Navigation listeners sono già impostati con event delegation

        // Sidebar toggle
        if (this.toggleSidebarBtn) {
            this.toggleSidebarBtn.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Scroll event per sezioni lunghe
        if (this.mainContent) {
            this.mainContent.addEventListener('scroll', () => {
                this.handleScroll();
            });
        }

        // Setup history navigation
        this.setupHistoryNavigation();

        // Gestione click fuori sidebar su mobile
        document.addEventListener('click', (e) => {
            if (this.isMobile && this.sidebarVisible) {
                const isClickInsideSidebar = this.sidebar?.contains(e.target);
                const isClickOnToggle = e.target.closest('.mobile-menu-toggle');
                
                if (!isClickInsideSidebar && !isClickOnToggle) {
                    this.hideSidebar();
                }
            }
        });

        // Prevenire chiusura sidebar quando si clicca dentro
        if (this.sidebar) {
            this.sidebar.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }

    setupNavigationListeners() {
        // Usa event delegation invece di listener multipli per evitare duplicati
        if (!this._navigationDelegateSetup) {
            // Listener per la navigazione nella sidebar
            this.navList.addEventListener('click', (e) => {
                const link = e.target.closest('.nav-link');
                if (!link) return;
                
                const href = link.getAttribute('href');
                if (!href) return;
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const sectionId = href.substring(1);
                    const file = link.getAttribute('data-file');
                    // Per intro non eseguire fetch (shell già presente)
                    const dynamic = sectionId !== 'intro';
                    this.navigateToSection(sectionId, true, dynamic);
                }
            });

            // Listener per i pulsanti di navigazione all'interno delle sezioni
            document.addEventListener('click', (e) => {
                const link = e.target.closest('.section-navigation a, .btn');
                if (!link) return;
                
                const href = link.getAttribute('href');
                if (!href || href.startsWith('http') || href === '#') return;
                
                // Se l'href contiene .html, è un link di navigazione delle sezioni
                if (href.endsWith('.html')) {
                    console.log(`🔗 Intercettato click su pulsante navigazione: ${href}`);
                    e.preventDefault();
                    const sectionId = this.getSectionIdFromHref(href);
                    console.log(`🎯 Sezione target identificata: ${sectionId}`);
                    if (sectionId && this.sections.includes(sectionId)) {
                        // Per intro non eseguire fetch (shell già presente)
                        const dynamic = sectionId !== 'intro';
                        console.log(`✅ Navigando a sezione: ${sectionId} (dynamic: ${dynamic})`);
                        this.navigateToSection(sectionId, true, dynamic);
                    } else {
                        console.warn(`⚠️ Sezione non trovata o non disponibile: ${sectionId}`);
                    }
                }
            });

            this._navigationDelegateSetup = true;
        }
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Solo se non stiamo scrivendo in un input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (e.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateToPreviousSection();
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateToNextSection();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.navigateToSection('intro');
                    break;
                case 'End':
                    e.preventDefault();
                    this.navigateToSection('spa-nodejs');
                    break;
                case 'Escape':
                    if (this.sidebarVisible && this.isMobile) {
                        this.hideSidebar();
                    }
                    break;
                case 'm':
                case 'M':
                    e.preventDefault();
                    this.toggleSidebar();
                    break;
                case 't':
                case 'T':
                    e.preventDefault();
                    this.switchTheme();
                    break;
            }
        });
    }

    setupAccessibility() {
        // Aggiungi ARIA labels
        if (this.sidebar) {
            this.sidebar.setAttribute('role', 'navigation');
            this.sidebar.setAttribute('aria-label', 'Navigazione principale del corso');
        }
        
        if (this.mainContent) {
            this.mainContent.setAttribute('role', 'main');
            this.mainContent.setAttribute('aria-label', 'Contenuto della lezione');
        }

        // Skip link
        this.createSkipLink();
        
        // Live region per annunci
        this.createLiveRegion();

        // Gestione focus per accessibilità
        this.setupFocusManagement();
    }

    setupFocusManagement() {
        // Quando si naviga con tastiera, assicurati che il focus sia visibile
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('user-is-tabbing');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('user-is-tabbing');
        });
    }

    createSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#mainContent';
        skipLink.textContent = 'Salta al contenuto principale';
        skipLink.className = 'skip-link sr-only';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: var(--color-primary);
            color: var(--color-btn-primary-text);
            padding: 8px 12px;
            border-radius: 4px;
            text-decoration: none;
            z-index: 1000;
            transition: top 0.2s;
            font-weight: 500;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '70px'; // Sotto l'header
            skipLink.classList.remove('sr-only');
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
            skipLink.classList.add('sr-only');
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    createLiveRegion() {
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'live-region';
        document.body.appendChild(liveRegion);
        this.liveRegion = liveRegion;
    }

    createMobileMenuToggle() {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'mobile-menu-toggle';
        toggleBtn.innerHTML = '☰';
        toggleBtn.setAttribute('aria-label', 'Apri menu di navigazione');
        toggleBtn.setAttribute('aria-expanded', 'false');
        
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSidebar();
        });
        
        document.body.appendChild(toggleBtn);
        this.mobileToggle = toggleBtn;
    }

    createSidebarOverlay() {
        if (this.sidebarOverlay) return;
        
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', () => {
            this.hideSidebar();
        });
        
        document.body.appendChild(overlay);
        this.sidebarOverlay = overlay;
    }

    // ==================== NAVIGATION ====================

    navigateToSection(sectionId, updateHistory = true, dynamicLoad = false) {
        console.log(`🔍 Tentativo di navigazione a: ${sectionId} (dynamic: ${dynamicLoad})`);
        
        const targetNavItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (!targetNavItem) {
            console.error(`❌ Elemento navigazione per ${sectionId} non trovato`);
            return;
        }

        // Se richiesta navigazione dinamica e non abbiamo la sezione, carichiamo
        let targetSection = document.getElementById(sectionId);
        if (dynamicLoad && !targetSection) {
            console.log(`📥 Caricamento dinamico richiesto per: ${sectionId}`);
            this.loadSectionDynamically(sectionId)
                .then(() => {
                    console.log(`✅ Caricamento completato per: ${sectionId}, richiamando navigazione`);
                    this.navigateToSection(sectionId, updateHistory, false);
                })
                .catch(err => {
                    console.error('❌ Errore caricamento dinamico:', err);
                    this.announceMessage(`Impossibile caricare la sezione ${sectionId}. Verifica la connessione.`);
                    // Fallback alla sezione intro se il caricamento fallisce
                    if (sectionId !== 'intro') {
                        console.log('🔄 Fallback alla sezione intro');
                        this.navigateToSection('intro', updateHistory, false);
                    }
                });
            return;
        }

        // Sezione potrebbe ancora mancare se caricamento fallito
        targetSection = document.getElementById(sectionId);
        if (!targetSection) {
            console.error(`Sezione ${sectionId} non trovata nel DOM`);
            return;
        }

        // Nascondi sezione attuale
        const currentSection = document.querySelector('.content-section.active');
        if (currentSection) {
            currentSection.classList.remove('active');
            console.log(`Nascondendo sezione: ${currentSection.id}`);
        }

        // Rimuovi active dalla nav attuale
        const currentNavItem = document.querySelector('.nav-item.active');
        if (currentNavItem) {
            currentNavItem.classList.remove('active');
        }

        // Attiva nuova sezione
        targetSection.classList.add('active');
        targetNavItem.classList.add('active');
        console.log(`Attivando sezione: ${sectionId}`);

        // Scroll to top automaticamente
        this.scrollToTop();

        // Aggiorna stato interno
        this.currentSection = sectionId;
        this.updateProgress();

        // Annuncia il cambio per screen readers
        this.announceSection(sectionId);

        // Aggiorna URL se richiesto
        if (updateHistory) {
            this.updateURL(sectionId);
        }

        // Nascondi sidebar su mobile dopo navigazione
        if (this.isMobile && this.sidebarVisible) {
            setTimeout(() => this.hideSidebar(), 300);
        }

        // Focus management
        this.manageFocusAfterNavigation(targetSection);

        // Salva progresso
        this.saveProgress();

        console.log(`✅ Navigazione completata verso: ${sectionId}`);
    }

    getSectionIdFromHref(href) {
        // Supporta href con path (es: 'pages/client-server.html') o query/hash
        if (!href) return null;
        const clean = href.split('?')[0].split('#')[0];
        const fileName = clean.split('/').pop(); // estrae 'client-server.html'
        
        // Cerca nella mappa delle pagine della lezione corrente
        const id = Object.keys(this.pageMap).find(key => this.pageMap[key] === fileName);
        if (id) return id;
        
        // Fallback: prova a ricavare l'id dal nome del file
        if (fileName.endsWith('.html')) {
            const baseId = fileName.replace('.html', '');
            if (this.sections.includes(baseId)) {
                return baseId;
            }
        }
        
        return null;
    }

    async loadSectionDynamically(sectionId) {
        if (!this.pageMap[sectionId]) throw new Error('Pagina non mappata');
        if (this.sectionCache.has(sectionId)) return;

        // Previeni race condition: se già in caricamento
        if (this._loadingSection === sectionId) return;
        this._loadingSection = sectionId;

        const pagePath = `./pages/${this.currentLesson}/${this.pageMap[sectionId]}`;
        console.log(`📥 Tentativo di caricamento da: ${pagePath}`);

        // Placeholder spinner
        const placeholderId = `placeholder-${sectionId}`;
        if (!document.getElementById(sectionId)) {
            const placeholder = document.createElement('section');
            placeholder.className = 'content-section loading';
            placeholder.id = sectionId; // così la navigateToSection troverà qualcosa
            placeholder.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner" aria-hidden="true"></div>
                    <p>Caricamento sezione <strong>${sectionId}</strong>...</p>
                </div>`;
            this.contentContainer.appendChild(placeholder);
        }

        this.announceMessage(`Caricamento sezione ${sectionId}...`);
        let abortController = new AbortController();
        this._currentFetch = abortController;
        try {
            const response = await fetch(pagePath, { cache: 'no-cache', signal: abortController.signal });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();

            // Parse sicuro
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            let extracted = doc.querySelector(`section.content-section#${sectionId}`);
            if (!extracted) {
                // fallback: prende la prima section se id mancato
                extracted = doc.querySelector('section.content-section');
            }
            if (!extracted) throw new Error('Section tag non trovato');

            // Sanitizzazione minima: rimuovi eventuali script
            extracted.querySelectorAll('script').forEach(s => s.remove());

            // Sostituisci placeholder
            const existing = document.getElementById(sectionId);
            if (existing) {
                existing.replaceWith(extracted);
            } else {
                this.contentContainer.appendChild(extracted);
            }

            this.sectionCache.set(sectionId, true);
            this.contentSections.push(extracted);
        } catch (e) {
            console.error('Errore fetch sezione', sectionId, e);
            const existing = document.getElementById(sectionId);
            if (existing) {
                existing.innerHTML = `
                    <div class="info-box curiosity">
                        <h3>❌ Errore caricamento</h3>
                        <p>Impossibile caricare la sezione <strong>${sectionId}</strong>. ${e.message}</p>
                        <button class="btn btn--outline" data-retry="${sectionId}">Riprova</button>
                    </div>`;
                const retryBtn = existing.querySelector('[data-retry]');
                if (retryBtn) {
                    retryBtn.addEventListener('click', () => {
                        this.sectionCache.delete(sectionId);
                        existing.remove();
                        this.loadSectionDynamically(sectionId).then(() => {
                            this.navigateToSection(sectionId, false, false);
                        });
                    });
                }
            }
            throw e;
        } finally {
            if (this._currentFetch === abortController) this._currentFetch = null;
            this._loadingSection = null;
        }
    }

    manageFocusAfterNavigation(targetSection) {
        // Sposta il focus al titolo della sezione per screen readers
        const sectionTitle = targetSection.querySelector('h1');
        if (sectionTitle) {
            sectionTitle.setAttribute('tabindex', '-1');
            sectionTitle.focus();
            
            // Rimuovi tabindex dopo un po'
            setTimeout(() => {
                sectionTitle.removeAttribute('tabindex');
            }, 1000);
        }
    }

    navigateToPreviousSection() {
        const currentIndex = this.sections.indexOf(this.currentSection);
        if (currentIndex > 0) {
            const prevSection = this.sections[currentIndex - 1];
            // Per intro non eseguire caricamento dinamico
            const dynamicLoad = prevSection !== 'intro';
            this.navigateToSection(prevSection, true, dynamicLoad);
        } else {
            this.announceMessage('Sei già alla prima sezione del corso');
        }
    }

    navigateToNextSection() {
        const currentIndex = this.sections.indexOf(this.currentSection);
        if (currentIndex < this.sections.length - 1) {
            const nextSection = this.sections[currentIndex + 1];
            // Per intro non eseguire caricamento dinamico
            const dynamicLoad = nextSection !== 'intro';
            this.navigateToSection(nextSection, true, dynamicLoad);
        } else {
            // Se siamo all'ultima sezione della lezione corrente, offri di passare alla lezione successiva
            if (this.currentLesson === 'lezione-1' && this.lessonsConfig.lessons['lezione-2']) {
                this.announceMessage('Hai completato la Lezione 1! Passa alla Lezione 2 dal selettore in alto.');
            } else {
                this.announceMessage('Hai completato tutte le sezioni del corso!');
            }
        }
    }

    updateProgress() {
        const currentIndex = this.sections.indexOf(this.currentSection);
        const progress = ((currentIndex + 1) / this.sections.length) * 100;
        
        if (this.progressFill) {
            this.progressFill.style.width = `${progress}%`;
        }
        
        if (this.progressText) {
            this.progressText.textContent = `Sezione ${currentIndex + 1} di ${this.sections.length}`;
        }

        // Aggiorna anche il titolo della pagina
        const sectionTitle = document.querySelector(`#${this.currentSection} h1`)?.textContent || 'Architettura Web';
        document.title = `${sectionTitle} - Guida Completa Architettura Web`;
    }

    scrollToTop() {
        if (this.mainContent) {
            this.mainContent.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }

    // ==================== SIDEBAR MANAGEMENT ====================

    toggleSidebar() {
        if (this.sidebarVisible) {
            this.hideSidebar();
        } else {
            this.showSidebar();
        }
    }

    showSidebar() {
        this.sidebarVisible = true;
        
        if (this.isMobile) {
            this.createSidebarOverlay();
            if (this.sidebar) this.sidebar.classList.add('visible');
            if (this.sidebarOverlay) this.sidebarOverlay.classList.add('visible');
            document.body.style.overflow = 'hidden';
            if (this.mobileToggle) {
                this.mobileToggle.innerHTML = '✕';
                this.mobileToggle.setAttribute('aria-expanded', 'true');
                this.mobileToggle.setAttribute('aria-label', 'Chiudi menu di navigazione');
            }
        } else {
            if (this.sidebar) this.sidebar.classList.remove('hidden');
            if (this.mainContent) this.mainContent.classList.remove('expanded');
        }

        if (this.sidebar) {
            this.sidebar.setAttribute('aria-hidden', 'false');
        }

        this.announceMessage('Menu di navigazione aperto');
    }

    hideSidebar() {
        this.sidebarVisible = false;
        
        if (this.isMobile) {
            if (this.sidebar) this.sidebar.classList.remove('visible');
            if (this.sidebarOverlay) this.sidebarOverlay.classList.remove('visible');
            document.body.style.overflow = '';
            if (this.mobileToggle) {
                this.mobileToggle.innerHTML = '☰';
                this.mobileToggle.setAttribute('aria-expanded', 'false');
                this.mobileToggle.setAttribute('aria-label', 'Apri menu di navigazione');
            }
        } else {
            if (this.sidebar) this.sidebar.classList.add('hidden');
            if (this.mainContent) this.mainContent.classList.add('expanded');
        }

        if (this.sidebar) {
            this.sidebar.setAttribute('aria-hidden', 'true');
        }

        this.announceMessage('Menu di navigazione chiuso');
    }

    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        
        if (wasMobile !== this.isMobile) {
            // Cambio da/verso mobile
            if (this.isMobile) {
                // Ora è mobile
                this.hideSidebar();
                if (this.mobileToggle) {
                    this.mobileToggle.style.display = 'flex';
                }
            } else {
                // Ora è desktop
                this.showSidebar();
                if (this.mobileToggle) {
                    this.mobileToggle.style.display = 'none';
                }
                if (this.sidebarOverlay) {
                    this.sidebarOverlay.classList.remove('visible');
                }
                document.body.style.overflow = '';
            }
        }

        // Aggiorna layout header se necessario
        this.updateHeaderLayout();
    }

    updateHeaderLayout() {
        if (this.header && this.isMobile) {
            // Aggiustamenti specifici per mobile se necessari
        }
    }

    handleScroll() {
        // Opzionale: logica per evidenziare sezioni durante scroll
        // Al momento non implementata perché ogni sezione occupa tutto lo schermo
        
        // Potresti aggiungere qui logiche come:
        // - Progress bar basato su scroll della sezione
        // - Reading time estimation
        // - Auto-hide header su scroll down
    }

    // ==================== ANNOUNCEMENTS & ACCESSIBILITY ====================

    announceSection(sectionId) {
        const sectionTitle = document.querySelector(`#${sectionId} h1`)?.textContent || sectionId;
        const currentIndex = this.sections.indexOf(sectionId);
        const announcement = `Navigato alla sezione ${currentIndex + 1} di ${this.sections.length}: ${sectionTitle}`;
        
        this.announceMessage(announcement);
    }

    announceMessage(message) {
        if (this.liveRegion) {
            this.liveRegion.textContent = message;
            
            // Pulisci dopo un po'
            setTimeout(() => {
                this.liveRegion.textContent = '';
            }, 3000);
        }
    }

    showErrorMessage(message) {
        console.error('Error:', message);
        this.announceMessage(`Errore: ${message}`);
        
        // Mostra anche un toast visuale se disponibile
        if (this.showToast) {
            this.showToast(message, 'error');
        }
    }

    // ==================== HISTORY & URL MANAGEMENT ====================

    updateURL(sectionId) {
        const newURL = `${window.location.pathname}#${sectionId}`;
        window.history.pushState({ section: sectionId }, '', newURL);
    }

    setupHistoryNavigation() {
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.section) {
                this.navigateToSection(e.state.section, false);
            } else {
                // Fallback to hash
                const hash = window.location.hash.substring(1);
                if (hash && this.sections.includes(hash)) {
                    this.navigateToSection(hash, false);
                }
            }
        });

        // Gestisci hash iniziale
        const initialHash = window.location.hash.substring(1);
        if (initialHash && this.sections.includes(initialHash)) {
            this.navigateToSection(initialHash, false);
        }
    }

    // ==================== PERSISTENCE ====================

    saveProgress() {
        try {
            const progress = {
                currentSection: this.currentSection,
                theme: this.currentTheme,
                timestamp: new Date().toISOString(),
                completedSections: this.getCompletedSections()
            };
            localStorage.setItem('web-arch-progress', JSON.stringify(progress));
        } catch (e) {
            console.warn('Impossibile salvare il progresso:', e);
        }
    }

    loadProgress() {
        try {
            const saved = localStorage.getItem('web-arch-progress');
            if (saved) {
                const progress = JSON.parse(saved);
                
                // Ripristina sezione corrente
                if (progress.currentSection && this.sections.includes(progress.currentSection)) {
                    this.navigateToSection(progress.currentSection, false);
                    console.log(`Progresso ripristinato: ${progress.currentSection}`);
                }
                
                // Ripristina tema
                if (progress.theme && ['light', 'dark'].includes(progress.theme)) {
                    this.switchTheme(progress.theme);
                }
                
                return progress;
            }
        } catch (e) {
            console.warn('Impossibile caricare il progresso:', e);
        }
        return null;
    }

    getCompletedSections() {
        // Logica per tracciare sezioni completate
        // Per ora consideriamo tutte le sezioni visitate come completate
        const currentIndex = this.sections.indexOf(this.currentSection);
        return this.sections.slice(0, currentIndex + 1);
    }

    // ==================== SEARCH & UTILITY FUNCTIONS ====================

    searchContent(query) {
        if (!query || query.length < 3) return [];
        
        const results = [];
        const sections = document.querySelectorAll('.content-section');
        
        sections.forEach(section => {
            const content = section.textContent.toLowerCase();
            const title = section.querySelector('h1')?.textContent || '';
            const description = section.querySelector('.section-description')?.textContent || '';
            
            if (content.includes(query.toLowerCase())) {
                results.push({
                    id: section.id,
                    title: title,
                    description: description.substring(0, 200) + '...',
                    relevance: this.calculateRelevance(content, title, query.toLowerCase())
                });
            }
        });
        
        return results.sort((a, b) => b.relevance - a.relevance);
    }

    calculateRelevance(content, title, query) {
        const contentOccurrences = (content.match(new RegExp(query, 'g')) || []).length;
        const titleMatch = title.toLowerCase().includes(query) ? 20 : 0;
        const positionBonus = content.indexOf(query) < 200 ? 10 : 0;
        
        return contentOccurrences + titleMatch + positionBonus;
    }

    exportSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return null;
        
        const title = section.querySelector('h1')?.textContent || sectionId;
        const content = section.querySelector('.section-content')?.innerHTML || '';
        
        return {
            title,
            content,
            url: `${window.location.origin}${window.location.pathname}#${sectionId}`,
            exportedAt: new Date().toISOString()
        };
    }

    // ==================== PUBLIC API METHODS ====================

    getCurrentSection() {
        return this.currentSection;
    }

    getAllSections() {
        return [...this.sections];
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getProgress() {
        const currentIndex = this.sections.indexOf(this.currentSection);
        return {
            currentSection: this.currentSection,
            currentIndex,
            totalSections: this.sections.length,
            percentComplete: Math.round(((currentIndex + 1) / this.sections.length) * 100),
            completedSections: this.getCompletedSections()
        };
    }

    // ==================== DEVELOPMENT & DEBUG UTILITIES ====================

    enableDebugMode() {
        window.webArchDebug = {
            app: this,
            navigateToSection: (id) => this.navigateToSection(id),
            getCurrentSection: () => this.getCurrentSection(),
            switchTheme: (theme) => this.switchTheme(theme),
            searchContent: (query) => this.searchContent(query),
            exportSection: (id) => this.exportSection(id),
            getProgress: () => this.getProgress(),
            showAllSections: () => {
                this.contentSections.forEach(section => {
                    section.style.display = 'block';
                    section.style.position = 'relative';
                    section.style.marginBottom = '50px';
                });
            }
        };
        console.log('🐛 Debug mode abilitato - vedi window.webArchDebug');
    }

    // ==================== CLEANUP ====================

    destroy() {
        // Rimuovi event listeners se necessario
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('popstate', this.setupHistoryNavigation);
        
        // Pulisci timer e interval
        if (this.progressSaveInterval) {
            clearInterval(this.progressSaveInterval);
        }
        
        // Ripristina body styles
        document.body.style.overflow = '';
        document.body.classList.remove('user-is-tabbing');
        
        console.log('🧹 Applicazione pulita correttamente');
    }
}

// ==================== UTILITY FUNCTIONS GLOBALI ====================

window.navigateToSection = function(sectionId) {
    console.log(`navigateToSection chiamata con: ${sectionId}`);
    if (window.webArchApp) {
        const dynamicLoad = sectionId !== 'intro';
        window.webArchApp.navigateToSection(sectionId, true, dynamicLoad);
    } else {
        console.error('webArchApp non disponibile');
    }
};

window.navigateNext = function() {
    if (window.webArchApp) {
        window.webArchApp.navigateToNextSection();
    }
};

window.navigatePrevious = function() {
    if (window.webArchApp) {
        window.webArchApp.navigateToPreviousSection();
    }
};

window.scrollToTop = function() {
    if (window.webArchApp) {
        window.webArchApp.scrollToTop();
    }
};

window.switchTheme = function(theme = null) {
    if (window.webArchApp) {
        window.webArchApp.switchTheme(theme);
    }
};

window.searchCourse = function(query) {
    if (window.webArchApp) {
        return window.webArchApp.searchContent(query);
    }
    return [];
};

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inizializzazione applicazione Web Architecture...');

    // Controlla supporto per funzionalità moderne
    if (!window.CSS || !window.CSS.supports || !('classList' in document.createElement('div'))) {
        console.warn('Il browser potrebbe non supportare tutte le funzionalità');
        
        // Fallback per browser molto vecchi
        const fallbackMessage = document.createElement('div');
        fallbackMessage.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ff6b35;
            color: white;
            padding: 10px;
            text-align: center;
            z-index: 9999;
        `;
        fallbackMessage.textContent = 'Il tuo browser potrebbe non supportare tutte le funzionalità. Ti consigliamo di aggiornare.';
        document.body.insertBefore(fallbackMessage, document.body.firstChild);
    }

    // Inizializza l'applicazione principale
    window.webArchApp = new WebArchitectureApp();

    // Carica progresso salvato
    const savedProgress = window.webArchApp.loadProgress();
    if (savedProgress) {
        console.log('📖 Progresso precedente caricato', savedProgress);
    }

    // Salva progresso periodicamente
    window.webArchApp.progressSaveInterval = setInterval(() => {
        if (window.webArchApp) {
            window.webArchApp.saveProgress();
        }
    }, 30000); // Ogni 30 secondi

    // Gestisci visibilità pagina per performance
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Pagina è diventata visibile, aggiorna UI
            if (window.webArchApp) {
                window.webArchApp.updateProgress();
            }
        }
    });

    // Service Worker per caching (opzionale futuro)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // Potrai registrare un service worker qui in futuro
            console.log('📡 Service Worker supportato');
        });
    }

    // Debug mode per sviluppo
    if (window.location.search.includes('debug=true') || 
        localStorage.getItem('web-arch-debug') === 'true') {
        console.log('🐛 Debug mode richiesto');
        window.webArchApp.enableDebugMode();
    }

    // Gestione errori globale
    window.addEventListener('error', (e) => {
        console.error('Errore nell\'applicazione:', e.error);
        
        // Mostra messaggio di errore user-friendly
        if (window.webArchApp && window.webArchApp.announceMessage) {
            window.webArchApp.announceMessage('Si è verificato un errore. Prova a ricaricare la pagina.');
        }
    });

    // Gestione errori Promise non gestite
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Promise rejection non gestita:', e.reason);
    });

    // Performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            console.log(`⚡ Applicazione caricata in ${Math.round(loadTime)}ms`);
        });
    }

    console.log('✅ Applicazione Web Architecture inizializzata con successo!');
    console.log('📖 Usa le frecce per navigare, M per il menu, T per il tema');
    console.log('🔍 window.webArchApp disponibile per controllo programmatico');
});

// ==================== PWA & INSTALLATION ====================

// PWA manifest e installazione
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    console.log('💾 App può essere installata come PWA');
    
    // Potresti mostrare un banner di installazione qui
    if (window.webArchApp) {
        window.webArchApp.announceMessage('Questa app può essere installata sul tuo dispositivo');
    }
});

window.addEventListener('appinstalled', () => {
    console.log('📱 App installata come PWA');
    if (window.webArchApp) {
        window.webArchApp.announceMessage('App installata con successo!');
    }
});

// ==================== EXPORT FOR MODULE USAGE ====================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebArchitectureApp;
}

// ==================== ADDITIONAL ENHANCEMENTS ====================

// Auto-save quando l'utente sta per chiudere la pagina
window.addEventListener('beforeunload', () => {
    if (window.webArchApp) {
        window.webArchApp.saveProgress();
    }
});

// Gestione stato online/offline
window.addEventListener('online', () => {
    console.log('🌐 Connessione ripristinata');
    if (window.webArchApp) {
        window.webArchApp.announceMessage('Connessione internet ripristinata');
    }
});

window.addEventListener('offline', () => {
    console.log('📱 Modalità offline');
    if (window.webArchApp) {
        window.webArchApp.announceMessage('Modalità offline attiva - alcune funzionalità potrebbero essere limitate');
    }
});

// Migliore handling dei link esterni
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="http"]');
    if (link && !link.hasAttribute('target')) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    }
});

// ==================== AUTO-INITIALIZATION ====================

// Inizializza l'app quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM caricato, inizializzo WebArchitectureApp...');
    try {
        window.webArchApp = new WebArchitectureApp();
        console.log('✅ WebArchitectureApp inizializzata con successo!');
    } catch (error) {
        console.error('❌ Errore nell\'inizializzazione dell\'app:', error);
        
        // Mostra errore all'utente
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; 
            transform: translate(-50%, -50%);
            background: #f44336; color: white; 
            padding: 20px; border-radius: 8px;
            font-family: Arial, sans-serif; text-align: center;
            z-index: 10000; max-width: 90%;
        `;
        errorDiv.innerHTML = `
            <h3>🚨 Errore di Inizializzazione</h3>
            <p>Si è verificato un errore nel caricamento dell'applicazione.</p>
            <p><small>${error.message}</small></p>
            <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: white; color: #f44336; border: none; border-radius: 4px; cursor: pointer;">
                🔄 Ricarica Pagina
            </button>
        `;
        document.body.appendChild(errorDiv);
    }
});