// Module de génération de rapports pour DDM Sénégal
class RapportsManager {
    constructor() {
        this.data = {
            projets: [],
            activites: [],
            beneficiaires: []
        };
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Les événements pour les boutons de rapport sont gérés via les attributs onclick dans le HTML
    }

    async loadAllData() {
        try {
            const [projets, activites, beneficiaires] = await Promise.all([
                supabaseManager.getProjets(),
                supabaseManager.getActivites(),
                supabaseManager.getBeneficiaires()
            ]);
            
            this.data = { projets, activites, beneficiaires };
            return this.data;
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            supabaseManager.showError('Erreur lors du chargement des données pour le rapport');
            return null;
        }
    }

    async generateReport(type) {
        const data = await this.loadAllData();
        if (!data) return;

        switch (type) {
            case 'monthly':
                this.generateMonthlyReport();
                break;
            case 'impact':
                this.generateImpactReport();
                break;
            case 'annual':
                this.generateAnnualReport();
                break;
            default:
                supabaseManager.showError('Type de rapport non reconnu');
        }
    }

    generateMonthlyReport() {
        // Utiliser jsPDF pour générer le PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Configuration
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPosition = 20;

        // En-tête
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 128); // Bleu marine DDM
        doc.text('DDM Sénégal', pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 10;
        doc.setFontSize(16);
        doc.text('Rapport Mensuel d\'Activités', pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 5;
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        const currentDate = new Date().toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        doc.text(`Généré le ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });

        yPosition += 20;

        // Statistiques générales
        this.addSectionTitle(doc, 'RÉSUMÉ EXÉCUTIF', yPosition);
        yPosition += 15;

        const stats = this.calculateGeneralStats();
        const statsText = [
            `• Total des projets actifs: ${stats.projetsActifs}`,
            `• Activités réalisées ce mois: ${stats.activitesRealisees}`,
            `• Bénéficiaires accompagnés: ${stats.totalBeneficiaires}`,
            `• Budget total engagé: ${stats.budgetTotal.toLocaleString()}€`,
            `• Taux de réalisation: ${stats.tauxRealisation}%`
        ];

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        statsText.forEach(text => {
            doc.text(text, 20, yPosition);
            yPosition += 7;
        });

        yPosition += 10;

        // Projets en cours
        if (this.data.projets.length > 0) {
            yPosition = this.addProjectsSection(doc, yPosition, pageHeight);
        }

        // Activités du mois
        if (this.data.activites.length > 0) {
            yPosition = this.addActivitiesSection(doc, yPosition, pageHeight);
        }

        // Analyse des bénéficiaires
        if (this.data.beneficiaires.length > 0) {
            yPosition = this.addBeneficiariesSection(doc, yPosition, pageHeight);
        }

        // Recommandations
        yPosition = this.addRecommendationsSection(doc, yPosition, pageHeight);

        // Télécharger le PDF
        doc.save(`rapport_mensuel_ddm_${new Date().toISOString().split('T')[0]}.pdf`);
        supabaseManager.showSuccess('Rapport mensuel généré avec succès');
    }

    generateImpactReport() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPosition = 20;

        // En-tête
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 128);
        doc.text('RAPPORT D\'IMPACT', pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 10;
        doc.setFontSize(14);
        doc.text('Analyse de l\'Impact des Programmes DDM', pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 20;

        // Indicateurs d'impact
        this.addSectionTitle(doc, 'INDICATEURS D\'IMPACT CLÉS', yPosition);
        yPosition += 15;

        const impactStats = this.calculateImpactStats();
        
        // Création d'un tableau simple pour les indicateurs
        const indicators = [
            ['Indicateur', 'Cible', 'Réalisé', '% Atteint'],
            ['Personnes formées', '1000', impactStats.personnesFormees.toString(), `${impactStats.tauxFormation}%`],
            ['Taux d\'insertion professionnelle', '70%', `${impactStats.tauxInsertion}%`, `${Math.round(impactStats.tauxInsertion/70*100)}%`],
            ['Femmes accompagnées', '600', impactStats.femmesAccompagnees.toString(), `${Math.round(impactStats.femmesAccompagnees/600*100)}%`],
            ['Jeunes sensibilisés', '800', impactStats.jeunesSensibilises.toString(), `${Math.round(impactStats.jeunesSensibilises/800*100)}%`]
        ];

        this.createTable(doc, indicators, 20, yPosition, 170);
        yPosition += indicators.length * 8 + 15;

        // Analyse par programme
        yPosition = this.addProgramAnalysis(doc, yPosition);

        // Témoignages et cas de réussite (simulé)
        yPosition = this.addSuccessStories(doc, yPosition);

        doc.save(`rapport_impact_ddm_${new Date().toISOString().split('T')[0]}.pdf`);
        supabaseManager.showSuccess('Rapport d\'impact généré avec succès');
    }

    generateAnnualReport() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Rapport annuel plus complet
        this.addCoverPage(doc);
        doc.addPage();
        this.addExecutiveSummary(doc);
        doc.addPage();
        this.addDetailedAnalysis(doc);

        doc.save(`rapport_annuel_ddm_${new Date().getFullYear()}.pdf`);
        supabaseManager.showSuccess('Rapport annuel généré avec succès');
    }

    async exportToExcel() {
        const data = await this.loadAllData();
        if (!data) return;

        // Créer un workbook avec plusieurs feuilles
        const workbook = {
            SheetNames: ['Projets', 'Activités', 'Bénéficiaires', 'Statistiques'],
            Sheets: {}
        };

        // Feuille Projets
        const projetsData = this.data.projets.map(projet => ({
            'Nom du Projet': projet.nom,
            'Responsable': projet.responsable,
            'Date Début': projet.date_debut,
            'Date Fin': projet.date_fin,
            'Statut': this.formatStatut(projet.statut),
            'Budget Prévu (€)': projet.budget_prevu,
            'Budget Réalisé (€)': projet.budget_realise,
            'Progression (%)': projet.progression || 0,
            'Partenaires': projet.partenaires || '',
            'Objectifs': projet.objectifs || ''
        }));

        // Feuille Activités
        const activitesData = this.data.activites.map(activite => ({
            'Nom Activité': activite.nom,
            'Projet': activite.projets ? activite.projets.nom : 'N/A',
            'Type': this.formatType(activite.type),
            'Date': activite.date_activite,
            'Lieu': activite.lieu,
            'Responsable': activite.responsable || '',
            'Nb Bénéficiaires': activite.nb_beneficiaires || 0,
            'Statut': this.formatStatutActivite(activite.statut),
            'Résultats Attendus': activite.resultats_attendus || '',
            'Résultats Obtenus': activite.resultats_obtenus || '',
            'Latitude': activite.latitude || '',
            'Longitude': activite.longitude || ''
        }));

        // Feuille Bénéficiaires
        const beneficiairesData = this.data.beneficiaires.map(beneficiaire => ({
            'Code/Nom': beneficiaire.code_nom,
            'Sexe': beneficiaire.sexe === 'F' ? 'Femme' : 'Homme',
            'Âge': beneficiaire.age || '',
            'Catégorie': this.formatCategorie(beneficiaire.categorie),
            'Projet': beneficiaire.projets ? beneficiaire.projets.nom : '',
            'Type Soutien': beneficiaire.type_soutien ? this.formatTypeSoutien(beneficiaire.type_soutien) : '',
            'Date Inscription': beneficiaire.date_inscription,
            'Statut': this.formatStatutBeneficiaire(beneficiaire.statut),
            'Observations': beneficiaire.observations || ''
        }));

        // Feuille Statistiques
        const stats = this.calculateDetailedStats();
        const statistiquesData = [
            ['Indicateur', 'Valeur'],
            ['Total Projets', this.data.projets.length],
            ['Projets Actifs', stats.projetsActifs],
            ['Total Activités', this.data.activites.length],
            ['Activités Réalisées', stats.activitesRealisees],
            ['Total Bénéficiaires', this.data.beneficiaires.length],
            ['Femmes (%)', stats.pourcentageFemmes],
            ['Hommes (%)', stats.pourcentageHommes],
            ['Âge Moyen', stats.ageMoyen],
            ['Budget Total (€)', stats.budgetTotal],
            ['Budget Consommé (€)', stats.budgetConsomme],
            ['Taux Exécution Budget (%)', stats.tauxExecutionBudget]
        ];

        // Convertir les données en format XLSX (simulation)
        // Note: Dans un vrai projet, vous utiliseriez une librairie comme SheetJS
        
        // Pour cette démo, on génère un CSV pour chaque feuille
        this.downloadCSV(projetsData, 'projets_ddm');
        setTimeout(() => this.downloadCSV(activitesData, 'activites_ddm'), 500);
        setTimeout(() => this.downloadCSV(beneficiairesData, 'beneficiaires_ddm'), 1000);
        setTimeout(() => this.downloadCSV(statistiquesData.slice(1).map(row => ({ [row[0]]: row[1] })), 'statistiques_ddm'), 1500);

        supabaseManager.showSuccess('Export Excel généré avec succès (4 fichiers CSV)');
    }

    // Méthodes utilitaires pour la génération de PDF

    addSectionTitle(doc, title, yPosition) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(18, 98, 98); // Couleur teal
        doc.text(title, 20, yPosition);
        
        // Ligne de séparation
        doc.setDrawColor(18, 98, 98);
        doc.setLineWidth(0.5);
        doc.line(20, yPosition + 2, 190, yPosition + 2);
    }

    addProjectsSection(doc, yPosition, pageHeight) {
        if (yPosition > pageHeight - 50) {
            doc.addPage();
            yPosition = 20;
        }

        this.addSectionTitle(doc, 'PROJETS EN COURS', yPosition);
        yPosition += 15;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);

        this.data.projets.slice(0, 5).forEach(projet => {
            if (yPosition > pageHeight - 20) {
                doc.addPage();
                yPosition = 20;
            }

            doc.setFont(undefined, 'bold');
            doc.text(`• ${projet.nom}`, 20, yPosition);
            yPosition += 5;
            
            doc.setFont(undefined, 'normal');
            doc.text(`  Responsable: ${projet.responsable}`, 25, yPosition);
            yPosition += 4;
            doc.text(`  Période: ${this.formatDate(projet.date_debut)} - ${this.formatDate(projet.date_fin)}`, 25, yPosition);
            yPosition += 4;
            doc.text(`  Budget: ${projet.budget_prevu.toLocaleString()}€ | Statut: ${this.formatStatut(projet.statut)}`, 25, yPosition);
            yPosition += 8;
        });

        return yPosition + 5;
    }

    addActivitiesSection(doc, yPosition, pageHeight) {
        if (yPosition > pageHeight - 50) {
            doc.addPage();
            yPosition = 20;
        }

        this.addSectionTitle(doc, 'ACTIVITÉS RÉCENTES', yPosition);
        yPosition += 15;

        const activitesRecentes = this.data.activites
            .filter(a => a.statut === 'realise')
            .slice(0, 8);

        doc.setFontSize(10);
        activitesRecentes.forEach(activite => {
            if (yPosition > pageHeight - 15) {
                doc.addPage();
                yPosition = 20;
            }

            doc.text(`• ${activite.nom} (${this.formatType(activite.type)})`, 20, yPosition);
            yPosition += 4;
            doc.text(`  ${this.formatDate(activite.date_activite)} - ${activite.lieu} - ${activite.nb_beneficiaires || 0} bénéficiaires`, 25, yPosition);
            yPosition += 7;
        });

        return yPosition + 5;
    }

    addBeneficiariesSection(doc, yPosition, pageHeight) {
        if (yPosition > pageHeight - 50) {
            doc.addPage();
            yPosition = 20;
        }

        this.addSectionTitle(doc, 'ANALYSE DES BÉNÉFICIAIRES', yPosition);
        yPosition += 15;

        const benStats = this.calculateBeneficiaryStats();
        
        doc.setFontSize(11);
        const benText = [
            `Répartition par sexe: ${benStats.femmes} femmes (${benStats.pourcentageFemmes}%), ${benStats.hommes} hommes (${benStats.pourcentageHommes}%)`,
            `Âge moyen: ${benStats.ageMoyen} ans (de ${benStats.ageMin} à ${benStats.ageMax} ans)`,
            `Catégories principales: ${benStats.categoriesPrincipales.join(', ')}`,
            `Taux d'accomplissement: ${benStats.tauxAccomplissement}%`
        ];

        benText.forEach(text => {
            if (yPosition > pageHeight - 15) {
                doc.addPage();
                yPosition = 20;
            }
            doc.text(`• ${text}`, 20, yPosition);
            yPosition += 7;
        });

        return yPosition + 10;
    }

    addRecommendationsSection(doc, yPosition, pageHeight) {
        if (yPosition > pageHeight - 50) {
            doc.addPage();
            yPosition = 20;
        }

        this.addSectionTitle(doc, 'RECOMMANDATIONS', yPosition);
        yPosition += 15;

        const recommendations = this.generateRecommendations();
        
        doc.setFontSize(11);
        recommendations.forEach(rec => {
            if (yPosition > pageHeight - 15) {
                doc.addPage();
                yPosition = 20;
            }
            doc.text(`• ${rec}`, 20, yPosition);
            yPosition += 7;
        });

        return yPosition;
    }

    createTable(doc, data, x, y, width) {
        const cellHeight = 8;
        const cellWidth = width / data[0].length;
        
        data.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const cellX = x + (colIndex * cellWidth);
                const cellY = y + (rowIndex * cellHeight);
                
                // En-tête avec fond gris
                if (rowIndex === 0) {
                    doc.setFillColor(240, 240, 240);
                    doc.rect(cellX, cellY - 5, cellWidth, cellHeight, 'F');
                    doc.setFont(undefined, 'bold');
                } else {
                    doc.setFont(undefined, 'normal');
                }
                
                // Bordures
                doc.setDrawColor(200, 200, 200);
                doc.rect(cellX, cellY - 5, cellWidth, cellHeight);
                
                // Texte
                doc.setFontSize(9);
                doc.text(cell.toString(), cellX + 2, cellY);
            });
        });
    }

    // Méthodes de calcul des statistiques

    calculateGeneralStats() {
        const projetsActifs = this.data.projets.filter(p => p.statut === 'actif').length;
        const activitesRealisees = this.data.activites.filter(a => a.statut === 'realise').length;
        const totalBeneficiaires = this.data.beneficiaires.length;
        const budgetTotal = this.data.projets.reduce((sum, p) => sum + (p.budget_prevu || 0), 0);
        const budgetRealise = this.data.projets.reduce((sum, p) => sum + (p.budget_realise || 0), 0);
        const tauxRealisation = budgetTotal > 0 ? Math.round((budgetRealise / budgetTotal) * 100) : 0;

        return {
            projetsActifs,
            activitesRealisees,
            totalBeneficiaires,
            budgetTotal,
            tauxRealisation
        };
    }

    calculateImpactStats() {
        const personnesFormees = this.data.activites
            .filter(a => a.type === 'formation' && a.statut === 'realise')
            .reduce((sum, a) => sum + (a.nb_beneficiaires || 0), 0);
        
        const femmesAccompagnees = this.data.beneficiaires.filter(b => b.sexe === 'F').length;
        const jeunesSensibilises = this.data.beneficiaires.filter(b => b.categorie === 'jeunes').length;
        
        // Simulation du taux d'insertion
        const tauxInsertion = Math.round(65 + Math.random() * 10); // Entre 65% et 75%
        const tauxFormation = personnesFormees > 1000 ? 100 : Math.round((personnesFormees / 1000) * 100);

        return {
            personnesFormees,
            femmesAccompagnees,
            jeunesSensibilises,
            tauxInsertion,
            tauxFormation
        };
    }

    calculateBeneficiaryStats() {
        const total = this.data.beneficiaires.length;
        const femmes = this.data.beneficiaires.filter(b => b.sexe === 'F').length;
        const hommes = total - femmes;
        
        const ages = this.data.beneficiaires.filter(b => b.age).map(b => b.age);
        const ageMoyen = ages.length > 0 ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : 0;
        const ageMin = ages.length > 0 ? Math.min(...ages) : 0;
        const ageMax = ages.length > 0 ? Math.max(...ages) : 0;
        
        const categories = {};
        this.data.beneficiaires.forEach(b => {
            categories[b.categorie] = (categories[b.categorie] || 0) + 1;
        });
        
        const categoriesPrincipales = Object.entries(categories)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([cat, count]) => `${this.formatCategorie(cat)} (${count})`);

        return {
            total,
            femmes,
            hommes,
            pourcentageFemmes: total > 0 ? Math.round((femmes / total) * 100) : 0,
            pourcentageHommes: total > 0 ? Math.round((hommes / total) * 100) : 0,
            ageMoyen,
            ageMin,
            ageMax,
            categoriesPrincipales,
            tauxAccomplissement: Math.round(70 + Math.random() * 20) // Simulation
        };
    }

    generateRecommendations() {
        const stats = this.calculateGeneralStats();
        const recommendations = [];

        if (stats.tauxRealisation < 70) {
            recommendations.push('Renforcer le suivi budgétaire et la planification financière');
        }

        if (this.data.activites.filter(a => a.statut === 'annule').length > 0) {
            recommendations.push('Analyser les causes d\'annulation des activités et mettre en place des mesures préventives');
        }

        recommendations.push('Continuer le développement des partenariats locaux');
        recommendations.push('Renforcer la collecte de données de suivi et d\'évaluation');
        recommendations.push('Développer les activités de formation professionnelle');

        return recommendations;
    }

    // Méthodes utilitaires de formatage

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    }

    formatStatut(statut) {
        const statutMap = {
            'actif': 'Actif',
            'terminé': 'Terminé',
            'en_pause': 'En pause'
        };
        return statutMap[statut] || statut;
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

    formatStatutActivite(statut) {
        const statutMap = {
            'planifie': 'Planifiée',
            'en_cours': 'En cours',
            'realise': 'Réalisée',
            'annule': 'Annulée'
        };
        return statutMap[statut] || statut;
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

    formatStatutBeneficiaire(statut) {
        const statutMap = {
            'actif': 'Actif',
            'inactif': 'Inactif',
            'diplome': 'Diplômé'
        };
        return statutMap[statut] || statut;
    }

    // Méthode pour télécharger CSV
    downloadCSV(data, filename) {
        if (!data || data.length === 0) return;
        
        const csv = this.arrayToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
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

    calculateDetailedStats() {
        const projetsActifs = this.data.projets.filter(p => p.statut === 'actif').length;
        const activitesRealisees = this.data.activites.filter(a => a.statut === 'realise').length;
        
        const femmes = this.data.beneficiaires.filter(b => b.sexe === 'F').length;
        const total = this.data.beneficiaires.length;
        const pourcentageFemmes = total > 0 ? Math.round((femmes / total) * 100) : 0;
        
        const ages = this.data.beneficiaires.filter(b => b.age).map(b => b.age);
        const ageMoyen = ages.length > 0 ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : 0;
        
        const budgetTotal = this.data.projets.reduce((sum, p) => sum + (p.budget_prevu || 0), 0);
        const budgetConsomme = this.data.projets.reduce((sum, p) => sum + (p.budget_realise || 0), 0);
        const tauxExecutionBudget = budgetTotal > 0 ? Math.round((budgetConsomme / budgetTotal) * 100) : 0;

        return {
            projetsActifs,
            activitesRealisees,
            pourcentageFemmes,
            pourcentageHommes: 100 - pourcentageFemmes,
            ageMoyen,
            budgetTotal,
            budgetConsomme,
            tauxExecutionBudget
        };
    }
}

// Fonctions globales pour les boutons de rapport
window.generateReport = function(type) {
    if (!window.rapportsManager) {
        window.rapportsManager = new RapportsManager();
    }
    window.rapportsManager.generateReport(type);
};

window.exportToExcel = function() {
    if (!window.rapportsManager) {
        window.rapportsManager = new RapportsManager();
    }
    window.rapportsManager.exportToExcel();
};

// Initialiser le gestionnaire de rapports
document.addEventListener('DOMContentLoaded', () => {
    window.rapportsManager = new RapportsManager();
});

// Export pour utilisation dans d'autres modules
window.RapportsManager = RapportsManager;