// Configuration de l'application DDM Sénégal
const CONFIG = {
    // Configuration Supabase - À personnaliser avec vos propres valeurs
    SUPABASE: {
        URL: localStorage.getItem('supabase_url') || 'YOUR_SUPABASE_URL',
        ANON_KEY: localStorage.getItem('supabase_key') || 'YOUR_SUPABASE_ANON_KEY'
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

// SQL pour créer les tables Supabase
const SUPABASE_SCHEMA = {
    // Table des projets
    PROJETS: `
        CREATE TABLE IF NOT EXISTS projets (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            nom TEXT NOT NULL,
            objectifs TEXT,
            date_debut DATE NOT NULL,
            date_fin DATE NOT NULL,
            responsable TEXT NOT NULL,
            partenaires TEXT,
            budget_prevu DECIMAL(12,2) NOT NULL DEFAULT 0,
            budget_realise DECIMAL(12,2) DEFAULT 0,
            statut TEXT DEFAULT 'actif' CHECK (statut IN ('actif', 'terminé', 'en_pause')),
            progression INTEGER DEFAULT 0 CHECK (progression >= 0 AND progression <= 100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Index pour améliorer les performances
        CREATE INDEX IF NOT EXISTS idx_projets_statut ON projets(statut);
        CREATE INDEX IF NOT EXISTS idx_projets_dates ON projets(date_debut, date_fin);
    `,
    
    // Table des activités
    ACTIVITES: `
        CREATE TABLE IF NOT EXISTS activites (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            nom TEXT NOT NULL,
            projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
            type TEXT NOT NULL CHECK (type IN ('formation', 'atelier', 'sensibilisation', 'accompagnement', 'plaidoyer')),
            date_activite DATE NOT NULL,
            lieu TEXT NOT NULL,
            responsable TEXT,
            nb_beneficiaires INTEGER DEFAULT 0,
            resultats_attendus TEXT,
            resultats_obtenus TEXT,
            statut TEXT DEFAULT 'planifie' CHECK (statut IN ('planifie', 'en_cours', 'realise', 'annule')),
            latitude DECIMAL(10,8),
            longitude DECIMAL(11,8),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Index
        CREATE INDEX IF NOT EXISTS idx_activites_projet ON activites(projet_id);
        CREATE INDEX IF NOT EXISTS idx_activites_type ON activites(type);
        CREATE INDEX IF NOT EXISTS idx_activites_date ON activites(date_activite);
        CREATE INDEX IF NOT EXISTS idx_activites_statut ON activites(statut);
    `,
    
    // Table des bénéficiaires
    BENEFICIAIRES: `
        CREATE TABLE IF NOT EXISTS beneficiaires (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            code_nom TEXT NOT NULL,
            sexe TEXT NOT NULL CHECK (sexe IN ('M', 'F')),
            age INTEGER CHECK (age > 0 AND age < 120),
            categorie TEXT NOT NULL CHECK (categorie IN ('femmes', 'jeunes', 'migrants', 'handicapes', 'autres')),
            projet_id UUID REFERENCES projets(id) ON DELETE SET NULL,
            activite_id UUID REFERENCES activites(id) ON DELETE SET NULL,
            type_soutien TEXT CHECK (type_soutien IN ('psychosocial', 'materiel', 'formation', 'accompagnement')),
            date_inscription DATE DEFAULT CURRENT_DATE,
            statut TEXT DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'diplome')),
            observations TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Index
        CREATE INDEX IF NOT EXISTS idx_beneficiaires_projet ON beneficiaires(projet_id);
        CREATE INDEX IF NOT EXISTS idx_beneficiaires_activite ON beneficiaires(activite_id);
        CREATE INDEX IF NOT EXISTS idx_beneficiaires_categorie ON beneficiaires(categorie);
        CREATE INDEX IF NOT EXISTS idx_beneficiaires_sexe ON beneficiaires(sexe);
    `,
    
    // Table des indicateurs
    INDICATEURS: `
        CREATE TABLE IF NOT EXISTS indicateurs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            intitule TEXT NOT NULL,
            description TEXT,
            projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
            valeur_cible DECIMAL(12,2) NOT NULL,
            valeur_realisee DECIMAL(12,2) DEFAULT 0,
            unite TEXT DEFAULT 'nombre',
            source_verification TEXT,
            frequence_mesure TEXT DEFAULT 'mensuelle' CHECK (frequence_mesure IN ('hebdomadaire', 'mensuelle', 'trimestrielle', 'semestrielle', 'annuelle')),
            date_mesure DATE,
            statut TEXT DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'atteint')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Index
        CREATE INDEX IF NOT EXISTS idx_indicateurs_projet ON indicateurs(projet_id);
        CREATE INDEX IF NOT EXISTS idx_indicateurs_statut ON indicateurs(statut);
    `,
    
    // Table des partenaires
    PARTENAIRES: `
        CREATE TABLE IF NOT EXISTS partenaires (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            nom TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('donateur', 'partenaire', 'volontaire', 'bailleur', 'beneficiaire')),
            contact_personne TEXT,
            email TEXT,
            telephone TEXT,
            adresse TEXT,
            montant_contribution DECIMAL(12,2) DEFAULT 0,
            date_contribution DATE,
            statut TEXT DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'potentiel')),
            observations TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Index
        CREATE INDEX IF NOT EXISTS idx_partenaires_type ON partenaires(type);
        CREATE INDEX IF NOT EXISTS idx_partenaires_statut ON partenaires(statut);
    `
};

// Instructions pour configurer Supabase
const SUPABASE_SETUP_INSTRUCTIONS = `
INSTRUCTIONS POUR CONFIGURER SUPABASE :

1. Créez un compte sur https://supabase.com
2. Créez un nouveau projet
3. Allez dans l'éditeur SQL (SQL Editor)
4. Exécutez les requêtes suivantes une par une :

${Object.values(SUPABASE_SCHEMA).join('\n\n')}

5. Configurez les politiques RLS (Row Level Security) si nécessaire
6. Récupérez votre URL et votre clé API anon dans Settings > API
7. Remplacez les valeurs dans le fichier config.js ou via l'interface d'administration

POLITIQUES RLS RECOMMANDÉES (optionnel pour une utilisation interne) :

-- Permettre toutes les opérations (à adapter selon vos besoins de sécurité)
ALTER TABLE projets ENABLE ROW LEVEL SECURITY;
ALTER TABLE activites ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE partenaires ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations (remplacez par des politiques plus restrictives si nécessaire)
CREATE POLICY "Allow all operations" ON projets FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON activites FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON beneficiaires FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON indicateurs FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON partenaires FOR ALL USING (true);
`;

// Fonction utilitaire pour valider la configuration
function validateConfig() {
    if (!CONFIG.SUPABASE.URL || CONFIG.SUPABASE.URL === 'YOUR_SUPABASE_URL') {
        console.warn('Configuration Supabase manquante. Veuillez configurer votre URL Supabase.');
        return false;
    }
    if (!CONFIG.SUPABASE.ANON_KEY || CONFIG.SUPABASE.ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.warn('Configuration Supabase manquante. Veuillez configurer votre clé API Supabase.');
        return false;
    }
    return true;
}

// Fonction pour sauvegarder la configuration Supabase
function saveSupabaseConfig(url, key) {
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_key', key);
    CONFIG.SUPABASE.URL = url;
    CONFIG.SUPABASE.ANON_KEY = key;
    
    // Réinitialiser le client Supabase
    if (window.supabaseClient) {
        window.supabaseClient = supabase.createClient(url, key);
    }
}

// Export pour utilisation dans d'autres fichiers
window.CONFIG = CONFIG;
window.SUPABASE_SCHEMA = SUPABASE_SCHEMA;
window.SUPABASE_SETUP_INSTRUCTIONS = SUPABASE_SETUP_INSTRUCTIONS;
window.validateConfig = validateConfig;
window.saveSupabaseConfig = saveSupabaseConfig;