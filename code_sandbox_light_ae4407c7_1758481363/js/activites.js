// Module de gestion des activités pour DDM Sénégal
class ActivitesManager {
    constructor() {
        this.activites = [];
        this.projets = [];
        this.currentActivite = null;
        this.filters = {
            search: '',
            type: ''
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadData();
    }

    bindEvents() {
        // Bouton nouvelle activité
        const addBtn = document.getElementById('add-activite-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openActiviteModal());
        }

        // Recherche et filtres
        const searchInput = document.getElementById('activites-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.filterActivites();
            });
        }

        const filterSelect = document.getElementById('activites-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filters.type = e.target.value;
                this.filterActivites();
            });
        }

        // Formulaire activité - sera créé dynamiquement
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'activite-form') {
                this.handleActiviteSubmit(e);
            }
        });
    }

    async loadData() {
        try {
            // Charger les projets pour le select
            this.projets = await supabaseManager.getProjets();
            // Charger les activités
            this.activites = await supabaseManager.getActivites();
            this.renderActivitesTable();
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            supabaseManager.showError('Erreur lors du chargement des données');
        }
    }

    renderActivitesTable() {
        const tbody = document.querySelector('#activites-table tbody');
        if (!tbody) return;

        if (this.activites.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <p style="padding: 40px; color: #7f8c8d;">
                            Aucune activité trouvée. <br>
                            <button class="btn btn-primary" onclick="activitesManager.openActiviteModal()" style="margin-top: 10px;">
                                <i class="fas fa-plus"></i> Créer la première activité
                            </button>
                        </p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.activites.map(activite => `
            <tr>
                <td>
                    <strong>${this.escapeHtml(activite.nom)}</strong>
                    ${activite.resultats_attendus ? `<br><small class="text-secondary">${this.truncateText(activite.resultats_attendus, 50)}</small>` : ''}
                </td>
                <td>${activite.projets ? this.escapeHtml(activite.projets.nom) : 'N/A'}</td>
                <td>
                    <span class="status-badge status-${activite.type}">
                        ${this.formatType(activite.type)}
                    </span>
                </td>
                <td>${this.formatDate(activite.date_activite)}</td>
                <td>${this.escapeHtml(activite.lieu)}</td>
                <td>
                    <strong>${activite.nb_beneficiaires || 0}</strong>
                    <small class="text-secondary">participants</small>
                </td>
                <td>
                    <span class="status-badge status-${activite.statut}">
                        ${this.formatStatut(activite.statut)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view-btn" onclick="activitesManager.viewActivite('${activite.id}')" title="Voir">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" onclick="activitesManager.editActivite('${activite.id}')" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="activitesManager.deleteActivite('${activite.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    filterActivites() {
        let filteredActivites = [...this.activites];

        // Filtre par recherche
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filteredActivites = filteredActivites.filter(activite => 
                activite.nom.toLowerCase().includes(searchTerm) ||
                activite.lieu.toLowerCase().includes(searchTerm) ||
                (activite.responsable && activite.responsable.toLowerCase().includes(searchTerm))
            );
        }

        // Filtre par type
        if (this.filters.type) {
            filteredActivites = filteredActivites.filter(activite => activite.type === this.filters.type);
        }

        // Temporairement remplacer la liste pour le rendu
        const originalActivites = this.activites;
        this.activites = filteredActivites;
        this.renderActivitesTable();
        this.activites = originalActivites;
    }

    openActiviteModal(activiteId = null) {
        this.currentActivite = activiteId ? this.activites.find(a => a.id === activiteId) : null;
        
        // Créer le modal dynamiquement
        const modal = document.createElement('div');
        modal.id = 'activite-modal';
        modal.className = 'modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${this.currentActivite ? 'Modifier l\'Activité' : 'Nouvelle Activité'}</h2>
                    <span class="close">&times;</span>
                </div>
                <form id="activite-form">
                    <div style="padding: 30px;">
                        <div class="form-group">
                            <label>Nom de l'Activité *</label>
                            <input type="text" name="nom" required value="${this.currentActivite ? this.escapeHtml(this.currentActivite.nom) : ''}">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Projet *</label>
                                <select name="projet_id" required>
                                    <option value="">Sélectionner un projet</option>
                                    ${this.projets.map(projet => `
                                        <option value="${projet.id}" ${this.currentActivite && this.currentActivite.projet_id === projet.id ? 'selected' : ''}>
                                            ${this.escapeHtml(projet.nom)}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Type d'Activité *</label>
                                <select name="type" required>
                                    <option value="">Sélectionner un type</option>
                                    <option value="formation" ${this.currentActivite && this.currentActivite.type === 'formation' ? 'selected' : ''}>Formation</option>
                                    <option value="atelier" ${this.currentActivite && this.currentActivite.type === 'atelier' ? 'selected' : ''}>Atelier</option>
                                    <option value="sensibilisation" ${this.currentActivite && this.currentActivite.type === 'sensibilisation' ? 'selected' : ''}>Sensibilisation</option>
                                    <option value="accompagnement" ${this.currentActivite && this.currentActivite.type === 'accompagnement' ? 'selected' : ''}>Accompagnement</option>
                                    <option value="plaidoyer" ${this.currentActivite && this.currentActivite.type === 'plaidoyer' ? 'selected' : ''}>Plaidoyer</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Date de l'Activité *</label>
                                <input type="date" name="date_activite" required value="${this.currentActivite ? this.currentActivite.date_activite : ''}">
                            </div>
                            <div class="form-group">
                                <label>Lieu *</label>
                                <input type="text" name="lieu" required value="${this.currentActivite ? this.escapeHtml(this.currentActivite.lieu) : ''}">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Responsable</label>
                                <input type="text" name="responsable" value="${this.currentActivite ? this.escapeHtml(this.currentActivite.responsable || '') : ''}">
                            </div>
                            <div class="form-group">
                                <label>Nombre de Bénéficiaires</label>
                                <input type="number" name="nb_beneficiaires" min="0" value="${this.currentActivite ? this.currentActivite.nb_beneficiaires || 0 : 0}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Résultats Attendus</label>
                            <textarea name="resultats_attendus" rows="3">${this.currentActivite ? this.escapeHtml(this.currentActivite.resultats_attendus || '') : ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Résultats Obtenus</label>
                            <textarea name="resultats_obtenus" rows="3">${this.currentActivite ? this.escapeHtml(this.currentActivite.resultats_obtenus || '') : ''}</textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Statut</label>
                                <select name="statut">
                                    <option value="planifie" ${this.currentActivite && this.currentActivite.statut === 'planifie' ? 'selected' : ''}>Planifiée</option>
                                    <option value="en_cours" ${this.currentActivite && this.currentActivite.statut === 'en_cours' ? 'selected' : ''}>En cours</option>
                                    <option value="realise" ${this.currentActivite && this.currentActivite.statut === 'realise' ? 'selected' : ''}>Réalisée</option>
                                    <option value="annule" ${this.currentActivite && this.currentActivite.statut === 'annule' ? 'selected' : ''}>Annulée</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Coordonnées GPS</label>
                                <div style="display: flex; gap: 10px;">
                                    <input type="number" name="latitude" step="0.000001" placeholder="Latitude" value="${this.currentActivite ? this.currentActivite.latitude || '' : ''}" style="flex: 1;">
                                    <input type="number" name="longitude" step="0.000001" placeholder="Longitude" value="${this.currentActivite ? this.currentActivite.longitude || '' : ''}" style="flex: 1;">
                                </div>
                            </div>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Annuler</button>
                            <button type="submit" class="btn btn-primary">Enregistrer</button>
                        </div>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Ajouter l'événement de fermeture
        modal.querySelector('.close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    async handleActiviteSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const activiteData = {};

        // Récupérer toutes les données du formulaire
        for (let [key, value] of formData.entries()) {
            activiteData[key] = value;
        }

        // Validation
        if (!this.validateActiviteData(activiteData)) {
            return;
        }

        // Convertir les types numériques
        activiteData.nb_beneficiaires = parseInt(activiteData.nb_beneficiaires) || 0;
        if (activiteData.latitude) activiteData.latitude = parseFloat(activiteData.latitude);
        if (activiteData.longitude) activiteData.longitude = parseFloat(activiteData.longitude);

        try {
            let result;
            if (this.currentActivite) {
                result = await supabaseManager.updateActivite(this.currentActivite.id, activiteData);
            } else {
                result = await supabaseManager.createActivite(activiteData);
            }

            if (result) {
                form.closest('.modal').remove();
                await this.loadData();
                
                // Rafraîchir le dashboard
                if (window.dashboard) {
                    await window.dashboard.refresh();
                }
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'activité:', error);
            supabaseManager.showError('Erreur lors de la sauvegarde de l\'activité');
        }
    }

    validateActiviteData(data) {
        const requiredFields = CONFIG.VALIDATION.REQUIRED_FIELDS.ACTIVITE;
        
        for (let field of requiredFields) {
            if (!data[field] || data[field].trim() === '') {
                supabaseManager.showError(`Le champ "${this.getFieldLabel(field)}" est obligatoire`);
                return false;
            }
        }

        // Validation de la date
        const dateActivite = new Date(data.date_activite);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Permettre les dates futures et passées (pas de restriction)
        
        // Validation des coordonnées GPS si fournies
        if (data.latitude && (data.latitude < -90 || data.latitude > 90)) {
            supabaseManager.showError('La latitude doit être entre -90 et 90');
            return false;
        }
        
        if (data.longitude && (data.longitude < -180 || data.longitude > 180)) {
            supabaseManager.showError('La longitude doit être entre -180 et 180');
            return false;
        }

        return true;
    }

    async viewActivite(activiteId) {
        const activite = this.activites.find(a => a.id === activiteId);
        if (!activite) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-tasks"></i> ${this.escapeHtml(activite.nom)}</h2>
                    <span class="close">&times;</span>
                </div>
                <div style="padding: 30px;">
                    <div class="form-row">
                        <div class="form-group">
                            <label><strong>Projet:</strong></label>
                            <p>${activite.projets ? this.escapeHtml(activite.projets.nom) : 'N/A'}</p>
                        </div>
                        <div class="form-group">
                            <label><strong>Type:</strong></label>
                            <p><span class="status-badge status-${activite.type}">${this.formatType(activite.type)}</span></p>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label><strong>Date:</strong></label>
                            <p>${this.formatDate(activite.date_activite)}</p>
                        </div>
                        <div class="form-group">
                            <label><strong>Lieu:</strong></label>
                            <p>${this.escapeHtml(activite.lieu)}</p>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label><strong>Responsable:</strong></label>
                            <p>${activite.responsable ? this.escapeHtml(activite.responsable) : 'Non défini'}</p>
                        </div>
                        <div class="form-group">
                            <label><strong>Bénéficiaires:</strong></label>
                            <p><strong>${activite.nb_beneficiaires || 0}</strong> participants</p>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label><strong>Statut:</strong></label>
                        <p><span class="status-badge status-${activite.statut}">${this.formatStatut(activite.statut)}</span></p>
                    </div>
                    
                    ${activite.resultats_attendus ? `
                        <div class="form-group">
                            <label><strong>Résultats Attendus:</strong></label>
                            <p>${this.escapeHtml(activite.resultats_attendus)}</p>
                        </div>
                    ` : ''}
                    
                    ${activite.resultats_obtenus ? `
                        <div class="form-group">
                            <label><strong>Résultats Obtenus:</strong></label>
                            <p>${this.escapeHtml(activite.resultats_obtenus)}</p>
                        </div>
                    ` : ''}
                    
                    ${activite.latitude && activite.longitude ? `
                        <div class="form-group">
                            <label><strong>Coordonnées GPS:</strong></label>
                            <p>Lat: ${activite.latitude}, Long: ${activite.longitude}</p>
                            <button class="btn btn-secondary" onclick="window.open('https://www.google.com/maps?q=${activite.latitude},${activite.longitude}', '_blank')">
                                <i class="fas fa-map-marker-alt"></i> Voir sur la carte
                            </button>
                        </div>
                    ` : ''}
                    
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="activitesManager.editActivite('${activite.id}'); this.closest('.modal').remove();">
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove();">Fermer</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Ajouter l'événement de fermeture
        modal.querySelector('.close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    editActivite(activiteId) {
        this.openActiviteModal(activiteId);
    }

    async deleteActivite(activiteId) {
        const activite = this.activites.find(a => a.id === activiteId);
        if (!activite) return;

        if (confirm(`Êtes-vous sûr de vouloir supprimer l'activité "${activite.nom}" ?\n\nCette action est irréversible.`)) {
            try {
                const success = await supabaseManager.deleteActivite(activiteId);
                if (success) {
                    await this.loadData();
                    
                    // Rafraîchir le dashboard
                    if (window.dashboard) {
                        await window.dashboard.refresh();
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la suppression de l\'activité:', error);
                supabaseManager.showError('Erreur lors de la suppression de l\'activité');
            }
        }
    }

    // Méthodes utilitaires
    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    }

    formatType(type) {
        const typeMap = {
            'formation': 'Formation',
            'atelier': 'Atelier',
            'sensibilisation': 'Sensibilisation',
            'accompagnement': 'Accompagnement',
            'plaidoyer': 'Plaidoyer'
        };
        return typeMap[type] || type;
    }

    formatStatut(statut) {
        const statutMap = {
            'planifie': 'Planifiée',
            'en_cours': 'En cours',
            'realise': 'Réalisée',
            'annule': 'Annulée'
        };
        return statutMap[statut] || statut;
    }

    getFieldLabel(fieldName) {
        const labelMap = {
            'nom': 'Nom de l\'activité',
            'projet_id': 'Projet',
            'type': 'Type d\'activité',
            'date_activite': 'Date de l\'activité',
            'lieu': 'Lieu'
        };
        return labelMap[fieldName] || fieldName;
    }

    // Méthode pour exporter les activités
    exportActivites() {
        if (this.activites.length === 0) {
            supabaseManager.showError('Aucune activité à exporter');
            return;
        }

        const exportData = this.activites.map(activite => ({
            nom: activite.nom,
            projet: activite.projets ? activite.projets.nom : 'N/A',
            type: this.formatType(activite.type),
            date: activite.date_activite,
            lieu: activite.lieu,
            responsable: activite.responsable || '',
            nb_beneficiaires: activite.nb_beneficiaires || 0,
            statut: this.formatStatut(activite.statut),
            resultats_attendus: activite.resultats_attendus || '',
            resultats_obtenus: activite.resultats_obtenus || '',
            latitude: activite.latitude || '',
            longitude: activite.longitude || ''
        }));

        // Créer le CSV
        const csvContent = this.arrayToCSV(exportData);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `activites_ddm_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        supabaseManager.showSuccess('Export des activités réalisé avec succès');
    }

    arrayToCSV(array) {
        if (array.length === 0) return '';
        
        const headers = Object.keys(array[0]);
        const csvRows = [];
        
        // Ajouter les en-têtes
        csvRows.push(headers.join(','));
        
        // Ajouter les données
        array.forEach(row => {
            const values = headers.map(header => {
                const val = row[header];
                return `"${val !== null && val !== undefined ? String(val).replace(/"/g, '""') : ''}"`;
            });
            csvRows.push(values.join(','));
        });
        
        return csvRows.join('\n');
    }
}

// Initialiser le gestionnaire d'activités
let activitesManager;

document.addEventListener('DOMContentLoaded', () => {
    activitesManager = new ActivitesManager();
    window.activitesManager = activitesManager;
});

// Export pour utilisation dans d'autres modules
window.ActivitesManager = ActivitesManager;