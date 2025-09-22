// Configuration de l'application DDM Sénégal
const CONFIG = {
    // Configuration Supabase - Clés pour le déploiement
    SUPABASE: {
        URL: 'https://bmpabviuhfytcukmyvbs.supabase.co',
        ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtcGFidml1aGZ5dGN1a215dmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzQ5NTcsImV4cCI6MjA3Mzk1MDk1N30.nriF4rqjAK5mR7bKeUQdAqWsSWEm8vfgRuoVckhfyKs'
    },
    
    // Configuration des tables
    TABLES: {
        PROJETS: 'projets',
        ACTIVITES: 'activites', 
        BENEFICIAIRES: 'beneficiaires',
        INDICATEURS: 'indicateurs',
        PARTENAIRES: 'partenaires'
    },
    
    // Configuration de l'application
    APP: {
        NAME: 'DDM Sénégal - Suivi & Évaluation',
        VERSION: '1.0.0',
        AUTHOR: 'DDM Sénégal',
        DESCRIPTION: 'Application de suivi et évaluation des programmes DDM'
    },
    
    // Configuration des graphiques
    CHARTS: {
        COLORS: {
            PRIMARY: '#000080',
            SECONDARY: '#126262', 
            ACCENT: '#FFD700',
            SUCCESS: '#27ae60',
            DANGER: '#e74c3c',
            WARNING: '#f39c12'
        },
        GRADIENTS: {
            PRIMARY: ['#000080', '#126262'],
            SECONDARY: ['#126262', '#FFD700'],
            ACCENT: ['#FFD700', '#000080']
        }
    },
    
    // Configuration de la carte
    MAP: {
        CENTER: [14.7167, -17.4667], // Dakar, Sénégal
        ZOOM: 7,
        TILE_LAYER: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        ATTRIBUTION: '© OpenStreetMap contributors'
    },
    
    // Configuration des exports
    EXPORT: {
        FORMATS: ['PDF', 'EXCEL', 'CSV'],
        DATE_FORMAT: 'DD/MM/YYYY',
        CURRENCY: 'FCFA'
    },
    
    // Messages et labels
    MESSAGES: {
        SUCCESS: {
            SAVE: 'Données enregistrées avec succès',
            DELETE: 'Élément supprimé avec succès',
            UPDATE: 'Mise à jour effectuée avec succès',
            SYNC: 'Synchronisation réussie'
        },
        ERROR: {
            SAVE: 'Erreur lors de l\'enregistrement',
            DELETE: 'Erreur lors de la suppression',
            UPDATE: 'Erreur lors de la mise à jour',
            SYNC: 'Erreur de synchronisation',
            NETWORK: 'Erreur de connexion réseau',
            CONFIG: 'Configuration Supabase manquante'
        },
        CONFIRM: {
            DELETE: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
            RESET: 'Êtes-vous sûr de vouloir réinitialiser ?'
        }
    },
    
    // Validation des formulaires
    VALIDATION: {
        REQUIRED_FIELDS: {
            PROJET: ['nom', 'date_debut', 'date_fin', 'responsable', 'budget_prevu'],
            ACTIVITE: ['nom', 'projet_id', 'type', 'date', 'lieu'],
            BENEFICIAIRE: ['code_nom', 'sexe', 'age', 'categorie']
        },
        FIELD_TYPES: {
            EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            PHONE: /^(\+221)?[0-9]{9}$/,
            NUMBER: /^[0-9]+(\.[0-9]+)?$/
        }
    }
};

// Exporte la configuration pour qu'elle soit utilisable par les autres scripts
window.CONFIG = CONFIG;
