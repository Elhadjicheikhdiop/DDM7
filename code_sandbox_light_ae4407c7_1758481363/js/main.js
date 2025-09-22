// Fichier principal pour DDM Sénégal - Gestion de la navigation et initialisation
class DDMApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.managers = {};
        this.init();
    }

    init() {
        this.initializeApp();
        this.bindNavigationEvents();
        this.bindGlobalEvents();
        this.loadInitialPage();
    }

    async initializeApp() {
        // Afficher le loader
        this.showLoader();

        try {
            // Vérifier la configuration Supabase
            if (!validateConfig()) {
                console.warn('Configuration Supabase manquante');
            }

            // Attendre que tous les composants soient prêts
            await this.waitForComponents();

            // Initialiser les gestionnaires
            await this.initializeManagers();

            // Masquer le loader
            this.hideLoader();

            console.log('Application DDM Sénégal initialisée avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            this.hideLoader();
            this.showError('Erreur lors du chargement de l\'application');
        }
    }

    async waitForComponents() {
        // Attendre que tous les scripts soient chargés
        const checkComponents = () => {
            return new Promise((resolve) => {
                const check = () => {
                    if (
                        typeof supabaseManager !== 'undefined' &&
                        typeof Chart !== 'undefined' &&
                        typeof L !== 'undefined'
                    ) {
                        resolve();
                    } else {
                        setTimeout(check, 100);
                    }
                };
                check();
            });
        };

        await checkComponents();
    }

    async initializeManagers() {
        try {
            // Initialiser les gestionnaires avec un délai pour éviter les conflits
            if (typeof Dashboard !== 'undefined') {
                setTimeout(() => {
                    if (!window.dashboard) {
                        window.dashboard = new Dashboard();
                    }
                }, 500);
            }

            if (typeof ProjetsManager !== 'undefined') {
                setTimeout(() => {
                    if (!window.projetsManager) {
                        window.projetsManager = new ProjetsManager();
                    }
                }, 750);
            }

            if (typeof ActivitesManager !== 'undefined') {
                setTimeout(() => {
                    if (!window.activitesManager) {
                        window.activitesManager = new ActivitesManager();
                    }
                }, 1000);
            }

            if (typeof BeneficiairesManager !== 'undefined') {
                setTimeout(() => {
                    if (!window.beneficiairesManager) {
                        window.beneficiairesManager = new BeneficiairesManager();
                    }
                }, 1250);
            }

            if (typeof CartographieManager !== 'undefined') {
                setTimeout(() => {
                    if (!window.cartographieManager) {
                        window.cartographieManager = new CartographieManager();
                    }
                }, 1500);
            }

            if (typeof RapportsManager !== 'undefined') {
                setTimeout(() => {
                    if (!window.rapportsManager) {
                        window.rapportsManager = new RapportsManager();
                    }
                }, 1750);
            }
        } catch (error) {
            console.error('Erreur lors de l\'initialisation des gestionnaires:', error);
        }
    }

    bindNavigationEvents() {
        // Gestion de la navigation
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                this.navigateTo(page);
            });
        });

        // Gestion de l'historique du navigateur
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.navigateTo(e.state.page, false);
            }
        });
    }

    bindGlobalEvents() {
        // Bouton de synchronisation
        const syncBtn = document.getElementById('sync-btn');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => this.synchronizeData());
        }

        // Bouton d'export global
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.showExportOptions());
        }

        // Gestion des erreurs globales
        window.addEventListener('error', (e) => {
            console.error('Erreur JavaScript:', e.error);
        });

        // Gestion de la perte de connexion
        window.addEventListener('online', () => {
            supabaseManager.showSuccess('Connexion rétablie');
        });

        window.addEventListener('offline', () => {
            supabaseManager.showError('Connexion perdue - Mode hors ligne activé');
        });
    }

    loadInitialPage() {
        // Charger la page depuis l'URL ou par défaut le dashboard
        const urlParams = new URLSearchParams(window.location.search);
        const page = urlParams.get('page') || 'dashboard';
        this.navigateTo(page, false);
    }

    navigateTo(page, pushState = true) {
        // Validation de la page
        const validPages = ['dashboard', 'projets', 'activites', 'beneficiaires', 'indicateurs', 'cartographie', 'rapports', 'administration'];
        if (!validPages.includes(page)) {
            page = 'dashboard';
        }

        // Mise à jour de l'état
        this.currentPage = page;

        // Mise à jour de l'interface
        this.updateUI(page);

        // Mise à jour de l'URL
        if (pushState) {
            const url = new URL(window.location);
            url.searchParams.set('page', page);
            window.history.pushState({ page }, '', url);
        }

        // Actions spécifiques par page
        this.handlePageSpecificActions(page);
    }

    updateUI(page) {
        // Mise à jour du menu actif
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === page) {
                item.classList.add('active');
            }
        });

        // Mise à jour du titre de la page
        const titles = {
            'dashboard': 'Tableau de Bord',
            'projets': 'Gestion des Projets',
            'activites': 'Gestion des Activités',
            'beneficiaires': 'Gestion des Bénéficiaires',
            'indicateurs': 'Indicateurs de Suivi',
            'cartographie': 'Cartographie des Interventions',
            'rapports': 'Rapports et Exports',
            'administration': 'Administration'
        };
        
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = titles[page] || 'DDM Sénégal';
        }

        // Affichage/masquage des pages
        document.querySelectorAll('.page').forEach(pageEl => {
            pageEl.classList.remove('active');
        });

        const currentPageEl = document.getElementById(`${page}-page`);
        if (currentPageEl) {
            currentPageEl.classList.add('active');
        }
    }

    handlePageSpecificActions(page) {
        // Actions spécifiques selon la page
        switch (page) {
            case 'dashboard':
                this.refreshDashboard();
                break;
            case 'cartographie':
                this.initializeMap();
                break;
            case 'administration':
                this.loadAdministrationData();
                break;
        }
    }

    async refreshDashboard() {
        if (window.dashboard) {
            try {
                await window.dashboard.refresh();
            } catch (error) {
                console.error('Erreur lors du rafraîchissement du dashboard:', error);
            }
        }
    }

    initializeMap() {
        if (window.cartographieManager) {
            // Forcer le redimensionnement de la carte après un délai
            setTimeout(() => {
                if (window.cartographieManager.map) {
                    window.cartographieManager.map.invalidateSize();
                }
            }, 300);
        }
    }

    loadAdministrationData() {
        // Charger les données d'administration
        const lastSyncEl = document.getElementById('last-sync');
        if (lastSyncEl) {
            const lastSync = localStorage.getItem('last-sync');
            if (lastSync) {
                const date = new Date(lastSync);
                lastSyncEl.textContent = date.toLocaleString('fr-FR');
            }
        }

        // Pré-remplir les champs de configuration
        const urlInput = document.getElementById('supabase-url');
        const keyInput = document.getElementById('supabase-key');
        
        if (urlInput && CONFIG.SUPABASE.URL && CONFIG.SUPABASE.URL !== 'YOUR_SUPABASE_URL') {
            urlInput.value = CONFIG.SUPABASE.URL;
        }
        
        if (keyInput && CONFIG.SUPABASE.ANON_KEY && CONFIG.SUPABASE.ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
            keyInput.value = '••••••••••••••••';
        }
    }

    async synchronizeData() {
        this.showLoader('Synchronisation en cours...');

        try {
            // Test de connexion
            const isConnected = await supabaseManager.testConnection();
            
            if (!isConnected) {
                throw new Error('Impossible de se connecter à la base de données');
            }

            // Rafraîchir tous les gestionnaires
            const promises = [];
            
            if (window.dashboard) promises.push(window.dashboard.refresh());
            if (window.projetsManager) promises.push(window.projetsManager.loadProjets());
            if (window.activitesManager) promises.push(window.activitesManager.loadData());
            if (window.beneficiairesManager) promises.push(window.beneficiairesManager.loadData());
            if (window.cartographieManager) promises.push(window.cartographieManager.refresh());

            await Promise.all(promises);

            // Enregistrer la date de synchronisation
            localStorage.setItem('last-sync', new Date().toISOString());

            this.hideLoader();
            supabaseManager.showSuccess('Synchronisation réussie');
        } catch (error) {
            console.error('Erreur de synchronisation:', error);
            this.hideLoader();
            supabaseManager.showError('Erreur lors de la synchronisation');
        }
    }

    showExportOptions() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-download"></i> Options d'Export</h2>
                    <span class="close">&times;</span>
                </div>
                <div style="padding: 30px;">
                    <div class="export-options">
                        <div class="export-option">
                            <h4><i class="fas fa-chart-line"></i> Données du Dashboard</h4>
                            <p>Exporter les statistiques et données du tableau de bord</p>
                            <button class="btn btn-primary" onclick="dashboard.exportData(); this.closest('.modal').remove();">
                                Exporter JSON
                            </button>
                        </div>
                        
                        <div class="export-option" style="margin-top: 20px;">
                            <h4><i class="fas fa-project-diagram"></i> Projets</h4>
                            <p>Exporter la liste complète des projets</p>
                            <button class="btn btn-secondary" onclick="projetsManager.exportProjets(); this.closest('.modal').remove();">
                                Exporter CSV
                            </button>
                        </div>
                        
                        <div class="export-option" style="margin-top: 20px;">
                            <h4><i class="fas fa-tasks"></i> Activités</h4>
                            <p>Exporter toutes les activités avec détails</p>
                            <button class="btn btn-secondary" onclick="activitesManager.exportActivites(); this.closest('.modal').remove();">
                                Exporter CSV
                            </button>
                        </div>
                        
                        <div class="export-option" style="margin-top: 20px;">
                            <h4><i class="fas fa-users"></i> Bénéficiaires</h4>
                            <p>Exporter les données des bénéficiaires</p>
                            <button class="btn btn-secondary" onclick="beneficiairesManager.exportBeneficiaires(); this.closest('.modal').remove();">
                                Exporter CSV
                            </button>
                        </div>
                        
                        <div class="export-option" style="margin-top: 20px;">
                            <h4><i class="fas fa-map"></i> Données Cartographiques</h4>
                            <p>Exporter les données géographiques (GeoJSON)</p>
                            <button class="btn btn-secondary" onclick="cartographieManager.exportMap(); this.closest('.modal').remove();">
                                Exporter GeoJSON
                            </button>
                        </div>
                        
                        <div class="export-option" style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
                            <h4><i class="fas fa-file-excel"></i> Export Complet Excel</h4>
                            <p>Exporter toutes les données en format Excel</p>
                            <button class="btn btn-primary" onclick="exportToExcel(); this.closest('.modal').remove();">
                                Exporter Excel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Ajouter les événements de fermeture
        modal.querySelector('.close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Ajouter les styles pour les options d'export
        const style = document.createElement('style');
        style.textContent = `
            .export-option {
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 8px;
                background: #f9f9f9;
            }
            .export-option h4 {
                margin: 0 0 10px 0;
                color: ${CONFIG.CHARTS.COLORS.PRIMARY};
            }
            .export-option p {
                margin: 0 0 15px 0;
                color: #666;
                font-size: 14px;
            }
        `;
        document.head.appendChild(style);
    }

    showLoader(message = 'Chargement...') {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.querySelector('p').textContent = message;
            loader.classList.remove('hidden');
        }
    }

    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('hidden');
        }
    }

    showError(message) {
        if (window.supabaseManager) {
            supabaseManager.showError(message);
        } else {
            alert(message);
        }
    }
}

// Fonctions globales pour l'administration
window.saveSupabaseConfig = function() {
    const url = document.getElementById('supabase-url').value;
    const key = document.getElementById('supabase-key').value;

    if (!url || !key) {
        supabaseManager.showError('Veuillez remplir tous les champs');
        return;
    }

    // Ne pas écraser la clé si c'est des points
    if (key === '••••••••••••••••') {
        supabaseManager.showSuccess('Configuration URL mise à jour');
        return;
    }

    saveSupabaseConfig(url, key);
    supabaseManager.showSuccess('Configuration Supabase sauvegardée');
    
    // Recharger la page après 2 secondes
    setTimeout(() => {
        window.location.reload();
    }, 2000);
};

window.forceSync = function() {
    if (window.ddmApp) {
        window.ddmApp.synchronizeData();
    }
};

// Fonction pour fermer les modals
window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
};

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    window.ddmApp = new DDMApp();
    console.log('DDM Sénégal - Application initialisée');
});

// Gestion des erreurs non capturées
window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesse rejetée:', event.reason);
    event.preventDefault();
});

// Export pour utilisation dans d'autres modules
window.DDMApp = DDMApp;