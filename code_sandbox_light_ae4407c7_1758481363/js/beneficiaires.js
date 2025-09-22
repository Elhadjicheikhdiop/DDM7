// Module de gestion des bénéficiaires pour DDM Sénégal
class BeneficiairesManager {
    constructor() {
        this.beneficiaires = [];
        this.projets = [];
        this.activites = [];
        this.currentBeneficiaire = null;
        this.filters = {
            search: '',
            categorie: ''
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadData();
    }

    bindEvents() {
        // Bouton nouveau bénéficiaire
        const addBtn = document.getElementById('add-beneficiaire-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openBeneficiaireModal());
        }

        // Recherche et filtres
        const searchInput = document.getElementById('beneficiaires-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.filterBeneficiaires();
            });
        }

        const filterSelect = document.getElementById('beneficiaires-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filters.categorie = e.target.value;
                this.filterBeneficiaires();
            });
        }

        // Formulaire bénéficiaire - sera créé dynamiquement
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'beneficiaire-form') {
                this.handleBeneficiaireSubmit(e);
            }
        });
    }

    async loadData() {
        try {
            // Charger toutes les données nécessaires
            const [projets, activites, beneficiaires] = await Promise.all([
                supabaseManager.getProjets(),
                supabaseManager.getActivites(),
                supabaseManager.getBeneficiaires()
            ]);
            
            this.projets = projets;
            this.activites = activites;
            this.beneficiaires = beneficiaires;
            
            this.renderBeneficiairesTable();
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            supabaseManager.showError('Erreur lors du chargement des données');
        }
    }

    renderBeneficiairesTable() {
        const tbody = document.querySelector('#beneficiaires-table tbody');
        if (!tbody) return;

        if (this.beneficiaires.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <p style="padding: 40px; color: #7f8c8d;">
                            Aucun bénéficiaire trouvé. <br>
                            <button class="btn btn-primary" onclick="beneficiairesManager.openBeneficiaireModal()" style="margin-top: 10px;">
                                <i class="fas fa-plus"></i> Ajouter le premier bénéficiaire
                            </button>
                        </p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.beneficiaires.map(beneficiaire => `
            <tr>
                <td>
                    <strong>${this.escapeHtml(beneficiaire.code_nom)}</strong>
                    ${beneficiaire.observations ? `<br><small class="text-secondary">${this.truncateText(beneficiaire.observations, 30)}</small>` : ''}
                </td>
                <td>
                    <span class="status-badge ${beneficiaire.sexe === 'F' ? 'status-femmes' : 'status-hommes'}">
                        ${beneficiaire.sexe === 'F' ? 'Femme' : 'Homme'}
                    </span>
                </td>
                <td>${beneficiaire.age || 'N/A'} ans</td>
                <td>
                    <span class="status-badge status-${beneficiaire.categorie}">
                        ${this.formatCategorie(beneficiaire.categorie)}
                    </span>
                </td>
                <td>${beneficiaire.projets ? this.escapeHtml(beneficiaire.projets.nom) : 'N/A'}</td>
                <td>
                    ${beneficiaire.type_soutien ? `<span class="status-badge status-soutien">${this.formatTypeSoutien(beneficiaire.type_soutien)}</span>` : 'Non défini'}
                </td>
                <td>${this.formatDate(beneficiaire.date_inscription)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view-btn" onclick="beneficiairesManager.viewBeneficiaire('${beneficiaire.id}')" title="Voir">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" onclick="beneficiairesManager.editBeneficiaire('${beneficiaire.id}')" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="beneficiairesManager.deleteBeneficiaire('${beneficiaire.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    filterBeneficiaires() {
        let filteredBeneficiaires = [...this.beneficiaires];

        // Filtre par recherche
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filteredBeneficiaires = filteredBeneficiaires.filter(beneficiaire => 
                beneficiaire.code_nom.toLowerCase().includes(searchTerm) ||
                (beneficiaire.observations && beneficiaire.observations.toLowerCase().includes(searchTerm))
            );
        }

        // Filtre par catégorie
        if (this.filters.categorie) {
            filteredBeneficiaires = filteredBeneficiaires.filter(beneficiaire => beneficiaire.categorie === this.filters.categorie);
        }

        // Temporairement remplacer la liste pour le rendu
        const originalBeneficiaires = this.beneficiaires;
        this.beneficiaires = filteredBeneficiaires;
        this.renderBeneficiairesTable();
        this.beneficiaires = originalBeneficiaires;
    }

    openBeneficiaireModal(beneficiaireId = null) {
        this.currentBeneficiaire = beneficiaireId ? this.beneficiaires.find(b => b.id === beneficiaireId) : null;
        
        // Créer le modal dynamiquement
        const modal = document.createElement('div');
        modal.id = 'beneficiaire-modal';
        modal.className = 'modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${this.currentBeneficiaire ? 'Modifier le Bénéficiaire' : 'Nouveau Bénéficiaire'}</h2>
                    <span class="close">&times;</span>
                </div>
                <form id="beneficiaire-form">
                    <div style="padding: 30px;">
                        <div class="form-group">
                            <label>Code/Nom du Bénéficiaire *</label>
                            <input type="text" name="code_nom" required value="${this.currentBeneficiaire ? this.escapeHtml(this.currentBeneficiaire.code_nom) : ''}" placeholder="Ex: BEN001 ou Nom complet (si autorisé)">
                            <small class="text-secondary">Utilisez un code anonyme pour préserver la confidentialité</small>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Sexe *</label>
                                <select name="sexe" required>
                                    <option value="">Sélectionner</option>
                                    <option value="M" ${this.currentBeneficiaire && this.currentBeneficiaire.sexe === 'M' ? 'selected' : ''}>Homme</option>
                                    <option value="F" ${this.currentBeneficiaire && this.currentBeneficiaire.sexe === 'F' ? 'selected' : ''}>Femme</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Âge *</label>
                                <input type="number" name="age" min="0" max="120" required value="${this.currentBeneficiaire ? this.currentBeneficiaire.age || '' : ''}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Catégorie *</label>
                            <select name="categorie" required>
                                <option value="">Sélectionner une catégorie</option>
                                <option value="femmes" ${this.currentBeneficiaire && this.currentBeneficiaire.categorie === 'femmes' ? 'selected' : ''}>Femmes</option>
                                <option value="jeunes" ${this.currentBeneficiaire && this.currentBeneficiaire.categorie === 'jeunes' ? 'selected' : ''}>Jeunes</option>
                                <option value="migrants" ${this.currentBeneficiaire && this.currentBeneficiaire.categorie === 'migrants' ? 'selected' : ''}>Migrants</option>
                                <option value="handicapes" ${this.currentBeneficiaire && this.currentBeneficiaire.categorie === 'handicapes' ? 'selected' : ''}>Personnes Handicapées</option>
                                <option value="autres" ${this.currentBeneficiaire && this.currentBeneficiaire.categorie === 'autres' ? 'selected' : ''}>Autres</option>
                            </select>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Projet Associé</label>
                                <select name="projet_id">
                                    <option value="">Aucun projet spécifique</option>
                                    ${this.projets.map(projet => `
                                        <option value="${projet.id}" ${this.currentBeneficiaire && this.currentBeneficiaire.projet_id === projet.id ? 'selected' : ''}>
                                            ${this.escapeHtml(projet.nom)}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Activité Associée</label>
                                <select name="activite_id">
                                    <option value="">Aucune activité spécifique</option>
                                    ${this.activites.map(activite => `
                                        <option value="${activite.id}" ${this.currentBeneficiaire && this.currentBeneficiaire.activite_id === activite.id ? 'selected' : ''}>
                                            ${this.escapeHtml(activite.nom)}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Type de Soutien</label>
                                <select name="type_soutien">
                                    <option value="">Non défini</option>
                                    <option value="psychosocial" ${this.currentBeneficiaire && this.currentBeneficiaire.type_soutien === 'psychosocial' ? 'selected' : ''}>Psychosocial</option>
                                    <option value="materiel" ${this.currentBeneficiaire && this.currentBeneficiaire.type_soutien === 'materiel' ? 'selected' : ''}>Matériel</option>
                                    <option value="formation" ${this.currentBeneficiaire && this.currentBeneficiaire.type_soutien === 'formation' ? 'selected' : ''}>Formation</option>
                                    <option value="accompagnement" ${this.currentBeneficiaire && this.currentBeneficiaire.type_soutien === 'accompagnement' ? 'selected' : ''}>Accompagnement</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Date d'Inscription</label>
                                <input type="date" name="date_inscription" value="${this.currentBeneficiaire ? this.currentBeneficiaire.date_inscription : new Date().toISOString().split('T')[0]}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Statut</label>
                            <select name="statut">
                                <option value="actif" ${this.currentBeneficiaire && this.currentBeneficiaire.statut === 'actif' ? 'selected' : ''}>Actif</option>
                                <option value="inactif" ${this.currentBeneficiaire && this.currentBeneficiaire.statut === 'inactif' ? 'selected' : ''}>Inactif</option>
                                <option value="diplome" ${this.currentBeneficiaire && this.currentBeneficiaire.statut === 'diplome' ? 'selected' : ''}>Diplômé</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Observations</label>
                            <textarea name="observations" rows="3" placeholder="Notes, commentaires, évolution...">${this.currentBeneficiaire ? this.escapeHtml(this.currentBeneficiaire.observations || '') : ''}</textarea>
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

    async handleBeneficiaireSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const beneficiaireData = {};

        // Récupérer toutes les données du formulaire
        for (let [key, value] of formData.entries()) {
            if (value === '') {
                beneficiaireData[key] = null;
            } else {
                beneficiaireData[key] = value;
            }
        }

        // Validation
        if (!this.validateBeneficiaireData(beneficiaireData)) {
            return;
        }

        // Convertir les types numériques
        if (beneficiaireData.age) beneficiaireData.age = parseInt(beneficiaireData.age);

        try {
            let result;
            if (this.currentBeneficiaire) {
                result = await supabaseManager.updateBeneficiaire(this.currentBeneficiaire.id, beneficiaireData);
            } else {
                result = await supabaseManager.createBeneficiaire(beneficiaireData);
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
            console.error('Erreur lors de la sauvegarde du bénéficiaire:', error);
            supabaseManager.showError('Erreur lors de la sauvegarde du bénéficiaire');
        }
    }

    validateBeneficiaireData(data) {
        const requiredFields = CONFIG.VALIDATION.REQUIRED_FIELDS.BENEFICIAIRE;
        
        for (let field of requiredFields) {
            if (!data[field] || data[field].toString().trim() === '') {
                supabaseManager.showError(`Le champ "${this.getFieldLabel(field)}" est obligatoire`);
                return false;
            }
        }

        // Validation de l'âge
        if (data.age && (data.age < 0 || data.age > 120)) {
            supabaseManager.showError('L\'âge doit être entre 0 et 120 ans');
            return false;
        }

        return true;
    }

    async viewBeneficiaire(beneficiaireId) {
        const beneficiaire = this.beneficiaires.find(b => b.id === beneficiaireId);
        if (!beneficiaire) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-user"></i> ${this.escapeHtml(beneficiaire.code_nom)}</h2>
                    <span class="close">&times;</span>
                </div>
                <div style="padding: 30px;">
                    <div class="form-row">
                        <div class="form-group">
                            <label><strong>Sexe:</strong></label>
                            <p><span class="status-badge ${beneficiaire.sexe === 'F' ? 'status-femmes' : 'status-hommes'}">${beneficiaire.sexe === 'F' ? 'Femme' : 'Homme'}</span></p>
                        </div>
                        <div class="form-group">
                            <label><strong>Âge:</strong></label>
                            <p>${beneficiaire.age || 'Non renseigné'} ${beneficiaire.age ? 'ans' : ''}</p>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label><strong>Catégorie:</strong></label>
                            <p><span class="status-badge status-${beneficiaire.categorie}">${this.formatCategorie(beneficiaire.categorie)}</span></p>
                        </div>
                        <div class="form-group">
                            <label><strong>Statut:</strong></label>
                            <p><span class="status-badge status-${beneficiaire.statut}">${this.formatStatut(beneficiaire.statut)}</span></p>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label><strong>Projet:</strong></label>
                            <p>${beneficiaire.projets ? this.escapeHtml(beneficiaire.projets.nom) : 'Aucun projet spécifique'}</p>
                        </div>
                        <div class="form-group">
                            <label><strong>Activité:</strong></label>
                            <p>${beneficiaire.activites ? this.escapeHtml(beneficiaire.activites.nom) : 'Aucune activité spécifique'}</p>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label><strong>Type de Soutien:</strong></label>
                            <p>${beneficiaire.type_soutien ? `<span class="status-badge status-soutien">${this.formatTypeSoutien(beneficiaire.type_soutien)}</span>` : 'Non défini'}</p>
                        </div>
                        <div class="form-group">
                            <label><strong>Date d'Inscription:</strong></label>
                            <p>${this.formatDate(beneficiaire.date_inscription)}</p>
                        </div>
                    </div>
                    
                    ${beneficiaire.observations ? `
                        <div class="form-group">
                            <label><strong>Observations:</strong></label>
                            <p style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">${this.escapeHtml(beneficiaire.observations)}</p>
                        </div>
                    ` : ''}
                    
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="beneficiairesManager.editBeneficiaire('${beneficiaire.id}'); this.closest('.modal').remove();">
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

    editBeneficiaire(beneficiaireId) {
        this.openBeneficiaireModal(beneficiaireId);
    }

    async deleteBeneficiaire(beneficiaireId) {
        const beneficiaire = this.beneficiaires.find(b => b.id === beneficiaireId);
        if (!beneficiaire) return;

        if (confirm(`Êtes-vous sûr de vouloir supprimer le bénéficiaire "${beneficiaire.code_nom}" ?\n\nCette action est irréversible.`)) {
            try {
                const success = await supabaseManager.deleteBeneficiaire(beneficiaireId);
                if (success) {
                    await this.loadData();
                    
                    // Rafraîchir le dashboard
                    if (window.dashboard) {
                        await window.dashboard.refresh();
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la suppression du bénéficiaire:', error);
                supabaseManager.showError('Erreur lors de la suppression du bénéficiaire');
            }
        }
    }

    // Méthodes pour générer des statistiques
    generateStats() {
        const stats = {
            total: this.beneficiaires.length,
            parSexe: this.countBy('sexe'),
            parCategorie: this.countBy('categorie'),
            parStatut: this.countBy('statut'),
            parTypeSoutien: this.countBy('type_soutien'),
            agesMoyens: this.calculateAgeStats()
        };

        return stats;
    }

    countBy(field) {
        const counts = {};
        this.beneficiaires.forEach(beneficiaire => {
            const value = beneficiaire[field] || 'Non défini';
            counts[value] = (counts[value] || 0) + 1;
        });
        return counts;
    }

    calculateAgeStats() {
        const ages = this.beneficiaires.filter(b => b.age).map(b => b.age);
        if (ages.length === 0) return { moyenne: 0, min: 0, max: 0 };
        
        return {
            moyenne: Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length),
            min: Math.min(...ages),
            max: Math.max(...ages)
        };
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

    formatCategorie(categorie) {
        const categorieMap = {
            'femmes': 'Femmes',
            'jeunes': 'Jeunes',
            'migrants': 'Migrants',
            'handicapes': 'Personnes Handicapées',
            'autres': 'Autres'
        };
        return categorieMap[categorie] || categorie;
    }

    formatTypeSoutien(type) {
        const typeMap = {
            'psychosocial': 'Psychosocial',
            'materiel': 'Matériel',
            'formation': 'Formation',
            'accompagnement': 'Accompagnement'
        };
        return typeMap[type] || type;
    }

    formatStatut(statut) {
        const statutMap = {
            'actif': 'Actif',
            'inactif': 'Inactif',
            'diplome': 'Diplômé'
        };
        return statutMap[statut] || statut;
    }

    getFieldLabel(fieldName) {
        const labelMap = {
            'code_nom': 'Code/Nom',
            'sexe': 'Sexe',
            'age': 'Âge',
            'categorie': 'Catégorie'
        };
        return labelMap[fieldName] || fieldName;
    }

    // Méthode pour exporter les bénéficiaires
    exportBeneficiaires() {
        if (this.beneficiaires.length === 0) {
            supabaseManager.showError('Aucun bénéficiaire à exporter');
            return;
        }

        const exportData = this.beneficiaires.map(beneficiaire => ({
            code_nom: beneficiaire.code_nom,
            sexe: beneficiaire.sexe === 'F' ? 'Femme' : 'Homme',
            age: beneficiaire.age || '',
            categorie: this.formatCategorie(beneficiaire.categorie),
            projet: beneficiaire.projets ? beneficiaire.projets.nom : '',
            activite: beneficiaire.activites ? beneficiaire.activites.nom : '',
            type_soutien: beneficiaire.type_soutien ? this.formatTypeSoutien(beneficiaire.type_soutien) : '',
            date_inscription: beneficiaire.date_inscription,
            statut: this.formatStatut(beneficiaire.statut),
            observations: beneficiaire.observations || ''
        }));

        // Créer le CSV
        const csvContent = this.arrayToCSV(exportData);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `beneficiaires_ddm_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        supabaseManager.showSuccess('Export des bénéficiaires réalisé avec succès');
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

// Initialiser le gestionnaire de bénéficiaires
let beneficiairesManager;

document.addEventListener('DOMContentLoaded', () => {
    beneficiairesManager = new BeneficiairesManager();
    window.beneficiairesManager = beneficiairesManager;
});

// Export pour utilisation dans d'autres modules
window.BeneficiairesManager = BeneficiairesManager;