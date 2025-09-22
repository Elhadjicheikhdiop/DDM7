// Module Dashboard pour DDM Sénégal
class Dashboard {
    constructor() {
        this.charts = {};
        this.stats = null;
        this.init();
    }

    async init() {
        await this.loadDashboardData();
        this.updateKPIs();
        this.initCharts();
    }

    async loadDashboardData() {
        try {
            this.stats = await supabaseManager.getDashboardStats();
        } catch (error) {
            console.error('Erreur lors du chargement des données du dashboard:', error);
            // Utiliser des données de démonstration si la connexion échoue
            this.stats = this.getDemoData();
        }
    }

    updateKPIs() {
        if (!this.stats) return;

        // Total des bénéficiaires
        const totalBeneficiaires = this.stats.beneficiaires.length;
        document.getElementById('total-beneficiaires').textContent = totalBeneficiaires.toLocaleString();

        // Projets actifs
        const projetsActifs = this.stats.projets.filter(p => p.statut === 'actif').length;
        document.getElementById('projets-actifs').textContent = projetsActifs;

        // Activités réalisées
        const activitesRealisees = this.stats.activites.filter(a => a.statut === 'realise').length;
        document.getElementById('activites-realisees').textContent = activitesRealisees;

        // Budget total
        const budgetTotal = this.stats.projets.reduce((sum, p) => sum + (p.budget_prevu || 0), 0);
        document.getElementById('budget-total').textContent = `${budgetTotal.toLocaleString()}€`;
    }

    initCharts() {
        this.createActivitesChart();
        this.createBeneficiairesChart();
        this.createBudgetChart();
        this.createEvolutionChart();
    }

    createActivitesChart() {
        const ctx = document.getElementById('activites-chart');
        if (!ctx || !this.stats) return;

        // Compter les activités par type
        const activitesCounts = {};
        this.stats.activites.forEach(activite => {
            const type = activite.type || 'non_defini';
            activitesCounts[type] = (activitesCounts[type] || 0) + 1;
        });

        const labels = Object.keys(activitesCounts);
        const data = Object.values(activitesCounts);

        this.charts.activites = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.map(label => this.formatLabel(label)),
                datasets: [{
                    label: 'Nombre d\'activités',
                    data: data,
                    backgroundColor: CONFIG.CHARTS.COLORS.PRIMARY,
                    borderColor: CONFIG.CHARTS.COLORS.SECONDARY,
                    borderWidth: 1,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: CONFIG.CHARTS.COLORS.ACCENT,
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    createBeneficiairesChart() {
        const ctx = document.getElementById('beneficiaires-chart');
        if (!ctx || !this.stats) return;

        // Compter les bénéficiaires par catégorie
        const categoriesCounts = {};
        this.stats.beneficiaires.forEach(beneficiaire => {
            const categorie = beneficiaire.categorie || 'autres';
            categoriesCounts[categorie] = (categoriesCounts[categorie] || 0) + 1;
        });

        const labels = Object.keys(categoriesCounts);
        const data = Object.values(categoriesCounts);
        const colors = [
            CONFIG.CHARTS.COLORS.PRIMARY,
            CONFIG.CHARTS.COLORS.SECONDARY,
            CONFIG.CHARTS.COLORS.ACCENT,
            CONFIG.CHARTS.COLORS.SUCCESS,
            CONFIG.CHARTS.COLORS.WARNING
        ];

        this.charts.beneficiaires = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.map(label => this.formatLabel(label)),
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    createBudgetChart() {
        const ctx = document.getElementById('budget-chart');
        if (!ctx || !this.stats) return;

        const projets = this.stats.projets.slice(0, 5); // Top 5 projets
        const labels = projets.map((p, index) => p.nom || `Projet ${index + 1}`);
        const budgetPrevu = projets.map(p => p.budget_prevu || 0);
        const budgetRealise = projets.map(p => p.budget_realise || 0);

        this.charts.budget = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Budget Prévu',
                        data: budgetPrevu,
                        backgroundColor: CONFIG.CHARTS.COLORS.PRIMARY,
                        borderRadius: 6
                    },
                    {
                        label: 'Budget Réalisé',
                        data: budgetRealise,
                        backgroundColor: CONFIG.CHARTS.COLORS.SUCCESS,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}€`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString() + '€';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    createEvolutionChart() {
        const ctx = document.getElementById('evolution-chart');
        if (!ctx) return;

        // Générer des données d'évolution mensuelles simulées
        const monthsData = this.generateEvolutionData();

        this.charts.evolution = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthsData.labels,
                datasets: [
                    {
                        label: 'Bénéficiaires',
                        data: monthsData.beneficiaires,
                        borderColor: CONFIG.CHARTS.COLORS.PRIMARY,
                        backgroundColor: 'rgba(0, 0, 128, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: CONFIG.CHARTS.COLORS.PRIMARY,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5
                    },
                    {
                        label: 'Activités',
                        data: monthsData.activites,
                        borderColor: CONFIG.CHARTS.COLORS.SECONDARY,
                        backgroundColor: 'rgba(18, 98, 98, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: CONFIG.CHARTS.COLORS.SECONDARY,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    generateEvolutionData() {
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
        const beneficiaires = [120, 180, 250, 320, 400, 480];
        const activites = [8, 12, 15, 18, 22, 25];

        return {
            labels: months,
            beneficiaires: beneficiaires,
            activites: activites
        };
    }

    formatLabel(label) {
        const labelMap = {
            'formation': 'Formation',
            'atelier': 'Atelier',
            'sensibilisation': 'Sensibilisation',
            'accompagnement': 'Accompagnement',
            'plaidoyer': 'Plaidoyer',
            'femmes': 'Femmes',
            'jeunes': 'Jeunes',
            'migrants': 'Migrants',
            'handicapes': 'Personnes Handicapées',
            'autres': 'Autres'
        };
        return labelMap[label] || label.charAt(0).toUpperCase() + label.slice(1);
    }

    getDemoData() {
        // Données de démonstration si pas de connexion Supabase
        return {
            projets: [
                { id: 1, nom: 'Formation Professionnelle', statut: 'actif', budget_prevu: 50000, budget_realise: 30000 },
                { id: 2, nom: 'Accompagnement Psychosocial', statut: 'actif', budget_prevu: 30000, budget_realise: 15000 },
                { id: 3, nom: 'Sensibilisation Communautaire', statut: 'terminé', budget_prevu: 20000, budget_realise: 20000 },
                { id: 4, nom: 'Plaidoyer Regional', statut: 'actif', budget_prevu: 25000, budget_realise: 10000 }
            ],
            activites: [
                { id: 1, type: 'formation', statut: 'realise', nb_beneficiaires: 25 },
                { id: 2, type: 'atelier', statut: 'realise', nb_beneficiaires: 15 },
                { id: 3, type: 'sensibilisation', statut: 'realise', nb_beneficiaires: 50 },
                { id: 4, type: 'accompagnement', statut: 'realise', nb_beneficiaires: 30 },
                { id: 5, type: 'formation', statut: 'realise', nb_beneficiaires: 20 },
                { id: 6, type: 'plaidoyer', statut: 'en_cours', nb_beneficiaires: 100 }
            ],
            beneficiaires: [
                { id: 1, categorie: 'femmes', sexe: 'F' },
                { id: 2, categorie: 'jeunes', sexe: 'M' },
                { id: 3, categorie: 'migrants', sexe: 'M' },
                { id: 4, categorie: 'femmes', sexe: 'F' },
                { id: 5, categorie: 'handicapes', sexe: 'F' },
                { id: 6, categorie: 'jeunes', sexe: 'F' },
                { id: 7, categorie: 'migrants', sexe: 'M' },
                { id: 8, categorie: 'femmes', sexe: 'F' }
            ]
        };
    }

    // Méthode pour rafraîchir le dashboard
    async refresh() {
        // Détruire les graphiques existants
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};

        // Recharger les données et recréer les graphiques
        await this.loadDashboardData();
        this.updateKPIs();
        this.initCharts();
    }

    // Méthode pour exporter les données du dashboard
    exportData() {
        if (!this.stats) return;

        const exportData = {
            date_export: new Date().toISOString(),
            resume: {
                total_projets: this.stats.projets.length,
                projets_actifs: this.stats.projets.filter(p => p.statut === 'actif').length,
                total_activites: this.stats.activites.length,
                activites_realisees: this.stats.activites.filter(a => a.statut === 'realise').length,
                total_beneficiaires: this.stats.beneficiaires.length,
                budget_total: this.stats.projets.reduce((sum, p) => sum + (p.budget_prevu || 0), 0)
            },
            donnees_detaillees: this.stats
        };

        // Créer et télécharger le fichier JSON
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `ddm_dashboard_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        supabaseManager.showSuccess('Export du dashboard réalisé avec succès');
    }
}

// Initialiser le dashboard
let dashboard;

// Attendre que la page soit chargée
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser le dashboard après un délai pour s'assurer que Supabase est prêt
    setTimeout(() => {
        dashboard = new Dashboard();
        window.dashboard = dashboard;
    }, 1000);
});

// Export pour utilisation dans d'autres modules
window.Dashboard = Dashboard;