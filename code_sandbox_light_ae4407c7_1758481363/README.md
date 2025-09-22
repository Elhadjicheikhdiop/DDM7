# DDM Sénégal - Application de Suivi & Évaluation

## 📊 Vue d'ensemble

Application web complète de suivi et évaluation des programmes de DDM (Dignité et Droits des Migrants) au Sénégal. Cette application permet de gérer les projets, activités, bénéficiaires, et de générer des rapports d'impact avec visualisations interactives et cartographie.

## 🚀 Fonctionnalités Actuellement Implémentées

### ✅ Dashboard Interactif
- **KPIs en temps réel** : Projets actifs, bénéficiaires atteints, activités réalisées, budget total
- **Graphiques dynamiques** : Chart.js avec visualisations interactives
- **Évolution temporelle** : Suivi mensuel des indicateurs clés
- **Analyse comparative** : Budget prévu vs réalisé par programme

### ✅ Gestion des Projets (CRUD Complet)
- Création, modification, suppression de projets
- Suivi budgétaire (prévu/réalisé)
- Gestion des partenaires et objectifs
- Calcul automatique de progression
- Filtrage et recherche avancée
- Export CSV

### ✅ Gestion des Activités (CRUD Complet)
- Planification et suivi des activités
- Types : Formation, Atelier, Sensibilisation, Accompagnement, Plaidoyer
- Géolocalisation (coordonnées GPS)
- Liaison avec les projets
- Suivi des résultats attendus/obtenus
- Export CSV avec géolocalisation

### ✅ Gestion des Bénéficiaires (CRUD Complet)
- Enregistrement sécurisé (codes anonymes)
- Catégorisation : Femmes, Jeunes, Migrants, Personnes Handicapées
- Types de soutien : Psychosocial, Matériel, Formation, Accompagnement
- Statistiques démographiques automatiques
- Export CSV conforme RGPD

### ✅ Cartographie Interactive
- **Carte Leaflet** centrée sur le Sénégal
- Marqueurs géolocalisés par type d'activité
- Filtrage par projet et type d'activité
- Popups informatifs avec détails complets
- Statistiques cartographiques en temps réel
- Export GeoJSON pour SIG
- Intégration Google Maps pour itinéraires

### ✅ Système de Rapports Avancé
- **Rapport Mensuel PDF** : Résumé exécutif, projets, activités, bénéficiaires
- **Rapport d'Impact PDF** : Indicateurs d'impact, analyse programme, recommandations
- **Export Excel multi-feuilles** : Toutes les données structurées
- **Génération automatique** avec jsPDF
- **Analyses statistiques** approfondies

### ✅ Architecture Technique Robuste
- **Frontend** : HTML5, CSS3, JavaScript ES6+
- **Base de données** : Supabase (PostgreSQL en cloud)
- **Cartographie** : Leaflet.js + OpenStreetMap
- **Graphiques** : Chart.js avec thèmes personnalisés
- **Exports** : jsPDF + CSV natif
- **Déployment** : Vercel (optimisé)
- **Design** : Responsive, thème DDM (bleu marine/teal/or)

## 🛠️ Configuration Supabase

### Étapes Obligatoires :

1. **Créer un projet Supabase** sur [supabase.com](https://supabase.com)

2. **Exécuter le schéma de base de données** dans l'éditeur SQL :

```sql
-- Table des projets
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

-- Table des activités
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

-- Table des bénéficiaires
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

-- Index pour performances optimales
CREATE INDEX IF NOT EXISTS idx_projets_statut ON projets(statut);
CREATE INDEX IF NOT EXISTS idx_activites_projet ON activites(projet_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaires_categorie ON beneficiaires(categorie);
```

3. **Configurer l'authentification** (optionnel pour usage interne)

4. **Récupérer les identifiants** :
   - URL du projet : `https://votre-projet.supabase.co`
   - Clé API anon : Dans Settings > API

5. **Configurer dans l'application** :
   - Via l'interface Administration
   - Ou directement dans `js/config.js`

## 🚀 Déployement Vercel

### Méthode Recommandée (Dossier) :

1. **Préparer le dossier** :
   ```bash
   # Créer un nouveau dossier
   mkdir ddm-senegal-app
   cd ddm-senegal-app
   
   # Copier tous les fichiers du projet
   cp -r * ddm-senegal-app/
   ```

2. **Installer Vercel CLI** :
   ```bash
   npm install -g vercel
   ```

3. **Déployer** :
   ```bash
   cd ddm-senegal-app
   vercel --prod
   ```

4. **Configuration automatique** :
   - Vercel détecte automatiquement le site statique
   - Le fichier `vercel.json` configure le routing SPA
   - Headers de sécurité inclus

### URL de Production :
`https://ddm-senegal-suivi-evaluation.vercel.app`

## 📁 Structure du Projet

```
ddm-senegal-app/
├── index.html              # Page principale SPA
├── css/
│   └── style.css           # Styles responsifs complets
├── js/
│   ├── config.js           # Configuration Supabase + schémas
│   ├── supabase-client.js  # Client Supabase + CRUD
│   ├── dashboard.js        # Dashboard + graphiques
│   ├── projets.js         # Gestion projets
│   ├── activites.js       # Gestion activités
│   ├── beneficiaires.js   # Gestion bénéficiaires
│   ├── cartographie.js    # Carte interactive
│   ├── rapports.js        # Génération rapports
│   └── main.js            # Navigation + initialisation
├── vercel.json            # Configuration Vercel
├── package.json           # Métadonnées projet
└── README.md             # Documentation complète
```

## 🎯 Fonctionnalités Prêtes Après Déployement

### Immédiatement Utilisables :
- ✅ **Navigation complète** entre tous les modules
- ✅ **Interface responsive** sur desktop/mobile/tablet
- ✅ **Mode démonstration** avec données simulées
- ✅ **Tous les formulaires** de création/modification
- ✅ **Système de notifications** utilisateur
- ✅ **Exports CSV/PDF/JSON** fonctionnels

### Après Configuration Supabase :
- ✅ **Persistance des données** en temps réel
- ✅ **Synchronisation multi-utilisateurs**
- ✅ **Sauvegardes automatiques** en cloud
- ✅ **Performances optimisées** avec index
- ✅ **Sécurité des données** PostgreSQL

## 🔧 Maintenance et Mises à Jour

### Points d'Attention :
1. **Sauvegardes Supabase** : Configuration backup automatique
2. **Monitoring Vercel** : Surveillance des performances
3. **Mises à jour de sécurité** : Dépendances CDN
4. **Formation utilisateurs** : Documentation utilisateur

### Évolutions Futures Possibles :
- 📱 Application mobile (React Native/Flutter)
- 🔐 Système d'authentification multi-niveaux  
- 📊 Tableau de bord exécutif avancé
- 🤖 Analyse prédictive des indicateurs
- 🌐 Multi-langue (Wolof, Français, Anglais)
- 📧 Notifications email automatiques
- 🔄 API REST publique pour partenaires

## 📞 Support Technique

### En Cas de Problème :
1. **Vérifier la console navigateur** (F12)
2. **Tester la connexion Supabase** via l'onglet Administration  
3. **Consulter les logs Vercel** sur le dashboard
4. **Utiliser le mode hors ligne** si problème réseau

### Contacts :
- **Technique** : Configuration Supabase et déployement
- **Fonctionnel** : Formations utilisateurs et workflows
- **Support** : Maintenance et évolutions

---

**DDM Sénégal** - Application de Suivi & Évaluation v1.0.0  
Développée pour optimiser l'impact des programmes d'aide aux migrants 🇸🇳