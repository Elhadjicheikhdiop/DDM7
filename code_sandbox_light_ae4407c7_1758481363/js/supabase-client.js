// Client Supabase pour DDM Sénégal
class SupabaseManager {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.init();
    }

    // Initialiser la connexion Supabase
    init() {
        try {
            if (validateConfig()) {
                this.client = supabase.createClient(CONFIG.SUPABASE.URL, CONFIG.SUPABASE.ANON_KEY);
                this.isConnected = true;
                console.log('Connexion Supabase établie avec succès');
            } else {
                console.warn('Configuration Supabase manquante');
                this.showConfigurationModal();
            }
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de Supabase:', error);
            this.showError('Erreur de connexion à la base de données');
        }
    }

    // Vérifier la connexion
    async testConnection() {
        if (!this.client) return false;
        
        try {
            const { data, error } = await this.client.from('projets').select('count').limit(1);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Test de connexion échoué:', error);
            return false;
        }
    }

    // CRUD Operations - Projets
    async getProjets(filters = {}) {
        try {
            let query = this.client.from(CONFIG.TABLES.PROJETS).select('*');
            
            if (filters.statut) {
                query = query.eq('statut', filters.statut);
            }
            if (filters.search) {
                query = query.or(`nom.ilike.%${filters.search}%,responsable.ilike.%${filters.search}%`);
            }
            
            query = query.order('created_at', { ascending: false });
            
            const { data, error } = await query;
            if (error) throw error;
            
            return data || [];
        } catch (error) {
            console.error('Erreur lors du chargement des projets:', error);
            this.showError(CONFIG.MESSAGES.ERROR.NETWORK);
            return [];
        }
    }

    async createProjet(projet) {
        try {
            const { data, error } = await this.client
                .from(CONFIG.TABLES.PROJETS)
                .insert([{
                    ...projet,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            
            this.showSuccess(CONFIG.MESSAGES.SUCCESS.SAVE);
            return data[0];
        } catch (error) {
            console.error('Erreur lors de la création du projet:', error);
            this.showError(CONFIG.MESSAGES.ERROR.SAVE);
            return null;
        }
    }

    async updateProjet(id, updates) {
        try {
            const { data, error } = await this.client
                .from(CONFIG.TABLES.PROJETS)
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select();
            
            if (error) throw error;
            
            this.showSuccess(CONFIG.MESSAGES.SUCCESS.UPDATE);
            return data[0];
        } catch (error) {
            console.error('Erreur lors de la mise à jour du projet:', error);
            this.showError(CONFIG.MESSAGES.ERROR.UPDATE);
            return null;
        }
    }

    async deleteProjet(id) {
        try {
            const { error } = await this.client
                .from(CONFIG.TABLES.PROJETS)
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            this.showSuccess(CONFIG.MESSAGES.SUCCESS.DELETE);
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression du projet:', error);
            this.showError(CONFIG.MESSAGES.ERROR.DELETE);
            return false;
        }
    }

    // CRUD Operations - Activités
    async getActivites(filters = {}) {
        try {
            let query = this.client
                .from(CONFIG.TABLES.ACTIVITES)
                .select(`
                    *,
                    projets(nom)
                `);
            
            if (filters.projet_id) {
                query = query.eq('projet_id', filters.projet_id);
            }
            if (filters.type) {
                query = query.eq('type', filters.type);
            }
            if (filters.search) {
                query = query.or(`nom.ilike.%${filters.search}%,lieu.ilike.%${filters.search}%`);
            }
            
            query = query.order('date_activite', { ascending: false });
            
            const { data, error } = await query;
            if (error) throw error;
            
            return data || [];
        } catch (error) {
            console.error('Erreur lors du chargement des activités:', error);
            this.showError(CONFIG.MESSAGES.ERROR.NETWORK);
            return [];
        }
    }

    async createActivite(activite) {
        try {
            const { data, error } = await this.client
                .from(CONFIG.TABLES.ACTIVITES)
                .insert([{
                    ...activite,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            
            this.showSuccess(CONFIG.MESSAGES.SUCCESS.SAVE);
            return data[0];
        } catch (error) {
            console.error('Erreur lors de la création de l\'activité:', error);
            this.showError(CONFIG.MESSAGES.ERROR.SAVE);
            return null;
        }
    }

    async updateActivite(id, updates) {
        try {
            const { data, error } = await this.client
                .from(CONFIG.TABLES.ACTIVITES)
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select();
            
            if (error) throw error;
            
            this.showSuccess(CONFIG.MESSAGES.SUCCESS.UPDATE);
            return data[0];
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'activité:', error);
            this.showError(CONFIG.MESSAGES.ERROR.UPDATE);
            return null;
        }
    }

    async deleteActivite(id) {
        try {
            const { error } = await this.client
                .from(CONFIG.TABLES.ACTIVITES)
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            this.showSuccess(CONFIG.MESSAGES.SUCCESS.DELETE);
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'activité:', error);
            this.showError(CONFIG.MESSAGES.ERROR.DELETE);
            return false;
        }
    }

    // CRUD Operations - Bénéficiaires
    async getBeneficiaires(filters = {}) {
        try {
            let query = this.client
                .from(CONFIG.TABLES.BENEFICIAIRES)
                .select(`
                    *,
                    projets(nom),
                    activites(nom)
                `);
            
            if (filters.projet_id) {
                query = query.eq('projet_id', filters.projet_id);
            }
            if (filters.categorie) {
                query = query.eq('categorie', filters.categorie);
            }
            if (filters.search) {
                query = query.or(`code_nom.ilike.%${filters.search}%`);
            }
            
            query = query.order('created_at', { ascending: false });
            
            const { data, error } = await query;
            if (error) throw error;
            
            return data || [];
        } catch (error) {
            console.error('Erreur lors du chargement des bénéficiaires:', error);
            this.showError(CONFIG.MESSAGES.ERROR.NETWORK);
            return [];
        }
    }

    async createBeneficiaire(beneficiaire) {
        try {
            const { data, error } = await this.client
                .from(CONFIG.TABLES.BENEFICIAIRES)
                .insert([{
                    ...beneficiaire,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            
            this.showSuccess(CONFIG.MESSAGES.SUCCESS.SAVE);
            return data[0];
        } catch (error) {
            console.error('Erreur lors de la création du bénéficiaire:', error);
            this.showError(CONFIG.MESSAGES.ERROR.SAVE);
            return null;
        }
    }

    async updateBeneficiaire(id, updates) {
        try {
            const { data, error } = await this.client
                .from(CONFIG.TABLES.BENEFICIAIRES)
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select();
            
            if (error) throw error;
            
            this.showSuccess(CONFIG.MESSAGES.SUCCESS.UPDATE);
            return data[0];
        } catch (error) {
            console.error('Erreur lors de la mise à jour du bénéficiaire:', error);
            this.showError(CONFIG.MESSAGES.ERROR.UPDATE);
            return null;
        }
    }

    async deleteBeneficiaire(id) {
        try {
            const { error } = await this.client
                .from(CONFIG.TABLES.BENEFICIAIRES)
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            this.showSuccess(CONFIG.MESSAGES.SUCCESS.DELETE);
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression du bénéficiaire:', error);
            this.showError(CONFIG.MESSAGES.ERROR.DELETE);
            return false;
        }
    }

    // Statistiques pour le dashboard
    async getDashboardStats() {
        try {
            const [projets, activites, beneficiaires] = await Promise.all([
                this.client.from(CONFIG.TABLES.PROJETS).select('id, statut, budget_prevu, budget_realise'),
                this.client.from(CONFIG.TABLES.ACTIVITES).select('id, statut, nb_beneficiaires, type'),
                this.client.from(CONFIG.TABLES.BENEFICIAIRES).select('id, categorie, sexe')
            ]);

            return {
                projets: projets.data || [],
                activites: activites.data || [],
                beneficiaires: beneficiaires.data || []
            };
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error);
            return {
                projets: [],
                activites: [],
                beneficiaires: []
            };
        }
    }

    // Utilitaires
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Créer une notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;

        // Ajouter les styles si pas déjà présents
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    max-width: 400px;
                    animation: slideInRight 0.3s ease;
                }
                .notification.success { border-left: 4px solid #27ae60; }
                .notification.error { border-left: 4px solid #e74c3c; }
                .notification.info { border-left: 4px solid #3498db; }
                .notification button {
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    margin-left: auto;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Auto-remove après 5 secondes
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    showConfigurationModal() {
        // Afficher le modal de configuration si les identifiants Supabase ne sont pas configurés
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Configuration Supabase Requise</h2>
                </div>
                <div style="padding: 30px;">
                    <p style="margin-bottom: 20px;">Pour utiliser cette application, vous devez configurer votre base de données Supabase.</p>
                    <div class="form-group">
                        <label>URL Supabase</label>
                        <input type="text" id="config-url" placeholder="https://votre-projet.supabase.co">
                    </div>
                    <div class="form-group">
                        <label>Clé API Anon</label>
                        <input type="password" id="config-key" placeholder="Votre clé API anon">
                    </div>
                    <div style="margin-top: 20px;">
                        <button class="btn btn-primary" onclick="supabaseManager.saveConfiguration()">Enregistrer</button>
                        <button class="btn btn-secondary" onclick="supabaseManager.showSetupInstructions()" style="margin-left: 10px;">Instructions</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    saveConfiguration() {
        const url = document.getElementById('config-url').value;
        const key = document.getElementById('config-key').value;

        if (!url || !key) {
            this.showError('Veuillez remplir tous les champs');
            return;
        }

        saveSupabaseConfig(url, key);
        this.init();

        // Fermer le modal
        document.querySelector('.modal').remove();
        
        // Recharger la page pour appliquer la nouvelle configuration
        window.location.reload();
    }

    showSetupInstructions() {
        alert(SUPABASE_SETUP_INSTRUCTIONS);
    }
}

// Initialiser le gestionnaire Supabase
const supabaseManager = new SupabaseManager();
window.supabaseManager = supabaseManager;