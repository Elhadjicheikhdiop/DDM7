// Module de gestion des projets pour DDM Sénégal
class ProjetsManager {
    constructor() {
        this.projets = [];
        this.currentProjet = null;
        this.filters = {
            search: '',
            statut: ''
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadProjets();
    }

    bindEvents() {
        // Bouton nouveau projet
        const addBtn = document.getElementById('add-projet-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openProjetModal());
        }

        // Recherche et filtres
        const searchInput = document.getElementById('projets-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.filterProjets();
            });
        }

        const filterSelect = document.getElementById('projets-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filters.statut = e.target.value;
                this.filterProjets();
            });
        }

        // Formulaire projet
        const projetForm = document.getElementById('projet-form');
        if (projetForm) {
            projetForm.addEventListener('submit', (e) => this.handleProjetSubmit(e));
        }

        // Fermeture des modals
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close') || e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });
    }

    async loadProjets() {
        try {
            this.projets = await supabaseManager.getProjets();
            this.renderProjetsTable();
        } catch (error) {
            console.error('Erreur lors du chargement des projets:', error);
            supabaseManager.showError('Erreur lors du chargement des projets');
        }
    }

    renderProjetsTable() {
        const tbody = document.querySelector('#projets-table tbody');
        if (!tbody) return;

        if (this.projets.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <p style="padding: 40px; color: #7f8c8d;">
                            Aucun projet trouvé. <br>
                            <button class="btn btn-primary" onclick="projetsManager.openProjetModal()" style="margin-top: 10px;">
                                <i class="fas fa-plus"></i> Créer le premier projet
                            </button>
                        </p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.projets.map(projet => `
            <tr>
                <td>
                    <strong>${this.escapeHtml(projet.nom)}</strong>
                    ${projet.objectifs ? `<br><small class="text-secondary">${this.truncateText(projet.objectifs, 50)}</small>` : ''}
                </td>
                <td>${this.formatDate(projet.date_debut)}</td>
                <td>${this.formatDate(projet.date_fin)}</td>
                <td>${this.escapeHtml(projet.responsable)}</td>
                <td>${this.formatCurrency(projet.budget_prevu)}</td>
                <td>
                    <span class="status-badge status-${projet.statut}">
                        ${this.formatStatut(projet.statut)}
                    </span>
                </td>
                <td>
                    <div class="progress-bar" style="width: 100px;">
                        <div class="progress-fill" style="width: ${projet.progression || 0}%"></div>
                    </div>
                    <small>${projet.progression || 0}%</small>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view-btn" onclick="projetsManager.viewProjet('${projet.id}')" title="Voir">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" onclick="projetsManager.editProjet('${projet.id}')" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="projetsManager.deleteProjet('${projet.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    filterProjets() {
        let filteredProjets = [...this.projets];

        // Filtre par recherche
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filteredProjets = filteredProjets.filter(projet => 
                projet.nom.toLowerCase().includes(searchTerm) ||
                projet.responsable.toLowerCase().includes(searchTerm) ||
                (projet.objectifs && projet.objectifs.toLowerCase().includes(searchTerm))
            );
        }

        // Filtre par statut
        if (this.filters.statut) {
            filteredProjets = filteredProjets.filter(projet => projet.statut === this.filters.statut);
        }

        // Temporairement remplacer la liste pour le rendu
        const originalProjets = this.projets;
        this.projets = filteredProjets;
        this.renderProjetsTable();
        this.projets = originalProjets;
    }

    openProjetModal(projetId = null) {
        const modal = document.getElementById('projet-modal');
        const form = document.getElementById('projet-form');
        const title = document.getElementById('projet-modal-title');

        if (!modal || !form || !title) return;

        this.currentProjet = projetId ? this.projets.find(p => p.id === projetId) : null;

        if (this.currentProjet) {
            title.textContent = 'Modifier le Projet';
            this.populateProjetForm(this.currentProjet);
        } else {
            title.textContent = 'Nouveau Projet';
            form.reset();
            // Définir la date de début par défaut à aujourd'hui
            const today = new Date().toISOString().split('T')[0];
            form.querySelector('[name="date_debut"]').value = today;
        }

        modal.style.display = 'block';
    }

    populateProjetForm(projet) {
        const form = document.getElementById('projet-form');
        if (!form) return;

        const fields = ['nom', 'date_debut', 'date_fin', 'responsable', 'partenaires', 'budget_prevu', 'budget_realise', 'objectifs', 'statut'];
        
        fields.forEach(field => {
            const input = form.querySelector(`[name="${field}"]`);
            if (input && projet[field] !== undefined) {
                input.value = projet[field];
            }
        });
    }

    async handleProjetSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const projetData = {};

        // Récupérer toutes les données du formulaire
        for (let [key, value] of formData.entries()) {
            projetData[key] = value;
        }

        // Validation
        if (!this.validateProjetData(projetData)) {
            return;
        }

        // Convertir les types numériques
        projetData.budget_prevu = parseFloat(projetData.budget_prevu) || 0;
        projetData.budget_realise = parseFloat(projetData.budget_realise) || 0;

        try {
            let result;
            if (this.currentProjet) {
                result = await supabaseManager.updateProjet(this.currentProjet.id, projetData);
            } else {
                result = await supabaseManager.createProjet(projetData);
            }

            if (result) {
                this.closeModals();
                await this.loadProjets();
                
                // Rafraîchir le dashboard si on est sur la page dashboard
                if (window.dashboard) {
                    await window.dashboard.refresh();
                }
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du projet:', error);
            supabaseManager.showError('Erreur lors de la sauvegarde du projet');
        }
    }

    validateProjetData(data) {
        const requiredFields = CONFIG.VALIDATION.REQUIRED_FIELDS.PROJET;
        
        for (let field of requiredFields) {
            if (!data[field] || data[field].trim() === '') {
                supabaseManager.showError(`Le champ "${this.getFieldLabel(field)}" est obligatoire`);
                return false;
            }
        }

        // Validation des dates
        const dateDebut = new Date(data.date_debut);
        const dateFin = new Date(data.date_fin);
        
        if (dateFin <= dateDebut) {
            supabaseManager.showError('La date de fin doit être postérieure à la date de début');
            return false;
        }

        // Validation du budget
        if (data.budget_prevu <= 0) {
            supabaseManager.showError('Le budget prévu doit être supérieur à 0');
            return false;
        }

        if (data.budget_realise < 0) {
            supabaseManager.showError('Le budget réalisé ne peut pas être négatif');
            return false;
        }

        return true;
    }

    async viewProjet(projetId) {
        const projet = this.projets.find(p => p.id === projetId);
        if (!projet) return;

        // Créer un modal de vue détaillée
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-project-diagram"></i> ${this.escapeHtml(projet.nom)}</h2>
                    <span class="close">&times;</span>
                </div>
                <div style="padding: 30px;">
                    <div class="form-row">
                        <div class="form-group">
                            <label><strong>Responsable:</strong></label>
                            <p>${this.escapeHtml(projet.responsable)}</p>
                        </div>
                        <div class="form-group">
                            <label><strong>Statut:</strong></label>
                            <p><span class="status-badge status-${projet.statut}">${this.formatStatut(projet.statut)}</span></p>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label><strong>Date de début:</strong></label>
                            <p>${this.formatDate(projet.date_debut)}</p>
                        </div>
                        <div class="form-group">
                            <label><strong>Date de fin:</strong></label>
                            <p>${this.formatDate(projet.date_fin)}</p>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label><strong>Budget prévu:</strong></label>
                            <p>${this.formatCurrency(projet.budget_prevu)}</p>
                        </div>
                        <div class="form-group">
                            <label><strong>Budget réalisé:</strong></label>
                            <p>${this.formatCurrency(projet.budget_realise)}</p>
                        </div>
                    </div>
                    
                    ${projet.partenaires ? `
                        <div class="form-group">
                            <label><strong>Partenaires:</strong></label>
                            <p>${this.escapeHtml(projet.partenaires)}</p>
                        </div>
                    ` : ''}
                    
                    ${projet.objectifs ? `
                        <div class="form-group">
                            <label><strong>Objectifs:</strong></label>
                            <p>${this.escapeHtml(projet.objectifs)}</p>
                        </div>
                    ` : ''}
                    
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="projetsManager.editProjet('${projet.id}'); this.closest('.modal').remove();">
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove();">Fermer</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    editProjet(projetId) {
        this.openProjetModal(projetId);
    }

    async deleteProjet(projetId) {
        const projet = this.projets.find(p => p.id === projetId);
        if (!projet) return;

        if (confirm(`Êtes-vous sûr de vouloir supprimer le projet "${projet.nom}" ?\n\nCette action est irréversible et supprimera également toutes les activités associées.`)) {
            try {
                const success = await supabaseManager.deleteProjet(projetId);
                if (success) {
                    await this.loadProjets();
                    
                    // Rafraîchir le dashboard
                    if (window.dashboard) {
                        await window.dashboard.refresh();
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la suppression du projet:', error);
                supabaseManager.showError('Erreur lors de la suppression du projet');
            }
        }
    }

    closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.style.display = 'none');
        this.currentProjet = null;
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

    formatCurrency(amount) {
        if (amount === null || amount === undefined) return '0€';
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    formatStatut(statut) {
        const statutMap = {
            'actif': 'Actif',
            'terminé': 'Terminé',
            'en_pause': 'En pause'
        };
        return statutMap[statut] || statut;
    }

    getFieldLabel(fieldName) {
        const labelMap = {
            'nom': 'Nom du projet',
            'date_debut': 'Date de début',
            'date_fin': 'Date de fin',
            'responsable': 'Responsable',
            'budget_prevu': 'Budget prévu'
        };
        return labelMap[fieldName] || fieldName;
    }

    // Méthode pour exporter les projets
    exportProjets() {
        if (this.projets.length === 0) {
            supabaseManager.showError('Aucun projet à exporter');
            return;
        }

        const exportData = this.projets.map(projet => ({
            nom: projet.nom,
            responsable: projet.responsable,
            date_debut: projet.date_debut,
            date_fin: projet.date_fin,
            statut: this.formatStatut(projet.statut),
            budget_prevu: projet.budget_prevu,
            budget_realise: projet.budget_realise,
            progression: projet.progression || 0,
            partenaires: projet.partenaires,
            objectifs: projet.objectifs
        }));

        // Créer le CSV
        const csvContent = this.arrayToCSV(exportData);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `projets_ddm_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        supabaseManager.showSuccess('Export des projets réalisé avec succès');
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

// Initialiser le gestionnaire de projets
let projetsManager;

document.addEventListener('DOMContentLoaded', () => {
    projetsManager = new ProjetsManager();
    window.projetsManager = projetsManager;
});

// Export pour utilisation dans d'autres modules
window.ProjetsManager = ProjetsManager;