// Module de cartographie pour DDM Sénégal
class CartographieManager {
    constructor() {
        this.map = null;
        this.markers = [];
        this.activites = [];
        this.projets = [];
        this.filters = {
            projet: '',
            type: ''
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadData();
    }

    bindEvents() {
        // Filtres de la carte
        const projetFilter = document.getElementById('map-filter-projet');
        if (projetFilter) {
            projetFilter.addEventListener('change', (e) => {
                this.filters.projet = e.target.value;
                this.updateMapMarkers();
            });
        }

        const typeFilter = document.getElementById('map-filter-type');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filters.type = e.target.value;
                this.updateMapMarkers();
            });
        }
    }

    async loadData() {
        try {
            // Charger les données nécessaires
            const [projets, activites] = await Promise.all([
                supabaseManager.getProjets(),
                supabaseManager.getActivites()
            ]);
            
            this.projets = projets;
            this.activites = activites.filter(a => a.latitude && a.longitude); // Seulement celles avec coordonnées
            
            this.populateFilters();
            this.initMap();
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            supabaseManager.showError('Erreur lors du chargement des données de cartographie');
            
            // Initialiser une carte vide en cas d'erreur
            this.initMap();
        }
    }

    populateFilters() {
        // Remplir le filtre des projets
        const projetFilter = document.getElementById('map-filter-projet');
        if (projetFilter) {
            projetFilter.innerHTML = '<option value="">Tous les projets</option>';
            this.projets.forEach(projet => {
                const option = document.createElement('option');
                option.value = projet.id;
                option.textContent = projet.nom;
                projetFilter.appendChild(option);
            });
        }

        // Remplir le filtre des types d'activités
        const typeFilter = document.getElementById('map-filter-type');
        if (typeFilter) {
            const types = [...new Set(this.activites.map(a => a.type))];
            typeFilter.innerHTML = '<option value="">Tous types d\'activités</option>';
            types.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = this.formatType(type);
                typeFilter.appendChild(option);
            });
        }
    }

    initMap() {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;

        // Initialiser la carte centrée sur le Sénégal
        this.map = L.map('map').setView(CONFIG.MAP.CENTER, CONFIG.MAP.ZOOM);

        // Ajouter la couche de tuiles
        L.tileLayer(CONFIG.MAP.TILE_LAYER, {
            attribution: CONFIG.MAP.ATTRIBUTION,
            maxZoom: 18
        }).addTo(this.map);

        // Ajouter les marqueurs
        this.updateMapMarkers();

        // Ajouter un contrôle de légende
        this.addLegend();

        // Ajouter un contrôle de localisation
        this.addLocationControl();
    }

    updateMapMarkers() {
        // Supprimer tous les marqueurs existants
        this.clearMarkers();

        // Filtrer les activités selon les critères
        let filteredActivites = [...this.activites];

        if (this.filters.projet) {
            filteredActivites = filteredActivites.filter(a => a.projet_id === this.filters.projet);
        }

        if (this.filters.type) {
            filteredActivites = filteredActivites.filter(a => a.type === this.filters.type);
        }

        // Ajouter les nouveaux marqueurs
        filteredActivites.forEach(activite => {
            if (activite.latitude && activite.longitude) {
                this.addMarker(activite);
            }
        });

        // Ajuster la vue si il y a des marqueurs
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }

        // Mettre à jour les statistiques de la carte
        this.updateMapStats(filteredActivites);
    }

    addMarker(activite) {
        const projet = this.projets.find(p => p.id === activite.projet_id);
        
        // Définir l'icône selon le type d'activité
        const icon = this.getMarkerIcon(activite.type);
        
        // Créer le marqueur
        const marker = L.marker([activite.latitude, activite.longitude], {
            icon: icon
        }).addTo(this.map);

        // Créer le contenu de la popup
        const popupContent = this.createPopupContent(activite, projet);
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'custom-popup'
        });

        // Ajouter à la liste des marqueurs
        this.markers.push(marker);

        return marker;
    }

    getMarkerIcon(type) {
        const iconConfig = {
            formation: { icon: '🎓', color: '#3498db' },
            atelier: { icon: '🛠️', color: '#9b59b6' },
            sensibilisation: { icon: '📢', color: '#e74c3c' },
            accompagnement: { icon: '🤝', color: '#27ae60' },
            plaidoyer: { icon: '⚖️', color: '#f39c12' }
        };

        const config = iconConfig[type] || { icon: '📍', color: '#34495e' };

        return L.divIcon({
            html: `<div style="
                background-color: ${config.color}; 
                width: 30px; 
                height: 30px; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-size: 16px; 
                border: 3px solid white; 
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            ">${config.icon}</div>`,
            className: 'custom-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
    }

    createPopupContent(activite, projet) {
        return `
            <div class="marker-popup">
                <h4 style="margin: 0 0 10px 0; color: ${CONFIG.CHARTS.COLORS.PRIMARY};">
                    ${this.escapeHtml(activite.nom)}
                </h4>
                
                <div style="margin-bottom: 8px;">
                    <strong>Type:</strong> 
                    <span class="popup-badge" style="background: ${this.getTypeColor(activite.type)};">
                        ${this.formatType(activite.type)}
                    </span>
                </div>
                
                <div style="margin-bottom: 8px;">
                    <strong>Projet:</strong> ${projet ? this.escapeHtml(projet.nom) : 'N/A'}
                </div>
                
                <div style="margin-bottom: 8px;">
                    <strong>Date:</strong> ${this.formatDate(activite.date_activite)}
                </div>
                
                <div style="margin-bottom: 8px;">
                    <strong>Lieu:</strong> ${this.escapeHtml(activite.lieu)}
                </div>
                
                <div style="margin-bottom: 8px;">
                    <strong>Bénéficiaires:</strong> 
                    <span style="font-weight: bold; color: ${CONFIG.CHARTS.COLORS.SUCCESS};">
                        ${activite.nb_beneficiaires || 0}
                    </span>
                </div>
                
                <div style="margin-bottom: 8px;">
                    <strong>Statut:</strong> 
                    <span class="popup-badge status-${activite.statut}">
                        ${this.formatStatut(activite.statut)}
                    </span>
                </div>
                
                ${activite.responsable ? `
                    <div style="margin-bottom: 8px;">
                        <strong>Responsable:</strong> ${this.escapeHtml(activite.responsable)}
                    </div>
                ` : ''}
                
                <div style="margin-top: 15px; text-align: center;">
                    <button onclick="activitesManager.viewActivite('${activite.id}')" 
                            style="background: ${CONFIG.CHARTS.COLORS.PRIMARY}; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-eye"></i> Voir détails
                    </button>
                    <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${activite.latitude},${activite.longitude}', '_blank')" 
                            style="background: ${CONFIG.CHARTS.COLORS.SECONDARY}; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-left: 5px;">
                        <i class="fas fa-directions"></i> Itinéraire
                    </button>
                </div>
            </div>
        `;
    }

    addLegend() {
        const legend = L.control({ position: 'bottomright' });

        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'map-legend');
            div.style.cssText = `
                background: white; 
                padding: 10px; 
                border-radius: 8px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                font-size: 12px;
                line-height: 18px;
            `;
            
            div.innerHTML = `
                <h4 style="margin: 0 0 10px 0; color: ${CONFIG.CHARTS.COLORS.PRIMARY};">Légende</h4>
                <div><span style="color: #3498db;">🎓</span> Formation</div>
                <div><span style="color: #9b59b6;">🛠️</span> Atelier</div>
                <div><span style="color: #e74c3c;">📢</span> Sensibilisation</div>
                <div><span style="color: #27ae60;">🤝</span> Accompagnement</div>
                <div><span style="color: #f39c12;">⚖️</span> Plaidoyer</div>
            `;
            
            return div;
        };

        legend.addTo(this.map);
    }

    addLocationControl() {
        // Bouton pour centrer sur le Sénégal
        const locationControl = L.control({ position: 'topleft' });
        
        locationControl.onAdd = () => {
            const div = L.DomUtil.create('div', 'leaflet-control-location');
            div.innerHTML = `
                <button style="
                    background: white; 
                    border: 2px solid rgba(0,0,0,0.2); 
                    border-radius: 4px; 
                    width: 30px; 
                    height: 30px; 
                    cursor: pointer;
                    font-size: 14px;
                " title="Centrer sur le Sénégal">🇸🇳</button>
            `;
            
            div.addEventListener('click', (e) => {
                e.stopPropagation();
                this.map.setView(CONFIG.MAP.CENTER, CONFIG.MAP.ZOOM);
            });
            
            return div;
        };
        
        locationControl.addTo(this.map);
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];
    }

    updateMapStats(activites) {
        // Créer ou mettre à jour un panneau de statistiques
        let statsDiv = document.querySelector('.map-stats');
        if (!statsDiv) {
            statsDiv = document.createElement('div');
            statsDiv.className = 'map-stats';
            statsDiv.style.cssText = `
                position: absolute;
                top: 10px;
                left: 10px;
                background: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                z-index: 1000;
                min-width: 200px;
            `;
            document.querySelector('#cartographie-page').appendChild(statsDiv);
        }

        const totalBeneficiaires = activites.reduce((sum, a) => sum + (a.nb_beneficiaires || 0), 0);
        const activitesParType = this.countBy(activites, 'type');
        const activitesParStatut = this.countBy(activites, 'statut');

        statsDiv.innerHTML = `
            <h4 style="margin: 0 0 10px 0; color: ${CONFIG.CHARTS.COLORS.PRIMARY};">
                Statistiques Cartographiques
            </h4>
            <div><strong>Activités affichées:</strong> ${activites.length}</div>
            <div><strong>Total bénéficiaires:</strong> ${totalBeneficiaires}</div>
            <hr style="margin: 10px 0;">
            <div style="font-size: 12px;">
                <strong>Par type:</strong><br>
                ${Object.entries(activitesParType).map(([type, count]) => 
                    `<span style="color: ${this.getTypeColor(type)};">• ${this.formatType(type)}: ${count}</span>`
                ).join('<br>')}
            </div>
        `;
    }

    // Méthodes utilitaires
    countBy(array, field) {
        const counts = {};
        array.forEach(item => {
            const value = item[field] || 'Non défini';
            counts[value] = (counts[value] || 0) + 1;
        });
        return counts;
    }

    getTypeColor(type) {
        const colors = {
            formation: '#3498db',
            atelier: '#9b59b6',
            sensibilisation: '#e74c3c',
            accompagnement: '#27ae60',
            plaidoyer: '#f39c12'
        };
        return colors[type] || '#34495e';
    }

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

    // Méthode pour exporter la carte
    exportMap() {
        if (!this.map || this.markers.length === 0) {
            supabaseManager.showError('Aucune donnée cartographique à exporter');
            return;
        }

        // Créer un GeoJSON avec toutes les activités visibles
        const geojson = {
            type: 'FeatureCollection',
            features: []
        };

        // Récupérer les activités filtrées
        let filteredActivites = [...this.activites];
        
        if (this.filters.projet) {
            filteredActivites = filteredActivites.filter(a => a.projet_id === this.filters.projet);
        }
        
        if (this.filters.type) {
            filteredActivites = filteredActivites.filter(a => a.type === this.filters.type);
        }

        // Convertir chaque activité en feature GeoJSON
        filteredActivites.forEach(activite => {
            if (activite.latitude && activite.longitude) {
                const projet = this.projets.find(p => p.id === activite.projet_id);
                
                geojson.features.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [activite.longitude, activite.latitude]
                    },
                    properties: {
                        nom: activite.nom,
                        type: activite.type,
                        projet: projet ? projet.nom : null,
                        date_activite: activite.date_activite,
                        lieu: activite.lieu,
                        nb_beneficiaires: activite.nb_beneficiaires || 0,
                        statut: activite.statut,
                        responsable: activite.responsable
                    }
                });
            }
        });

        // Télécharger le fichier GeoJSON
        const dataStr = JSON.stringify(geojson, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/geo+json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `activites_cartographie_ddm_${new Date().toISOString().split('T')[0]}.geojson`;
        link.click();
        
        URL.revokeObjectURL(url);
        supabaseManager.showSuccess('Export cartographique réalisé avec succès (format GeoJSON)');
    }

    // Méthode pour ajouter manuellement une activité avec coordonnées
    async addActivityWithLocation() {
        if (!navigator.geolocation) {
            supabaseManager.showError('La géolocalisation n\'est pas supportée par ce navigateur');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                
                // Ouvrir le modal d'ajout d'activité avec les coordonnées pré-remplies
                if (window.activitesManager) {
                    window.activitesManager.openActiviteModal();
                    
                    // Attendre que le modal soit créé
                    setTimeout(() => {
                        const latInput = document.querySelector('[name="latitude"]');
                        const lonInput = document.querySelector('[name="longitude"]');
                        
                        if (latInput) latInput.value = latitude.toFixed(6);
                        if (lonInput) lonInput.value = longitude.toFixed(6);
                        
                        supabaseManager.showSuccess('Position actuelle détectée et ajoutée au formulaire');
                    }, 500);
                }
            },
            (error) => {
                console.error('Erreur de géolocalisation:', error);
                supabaseManager.showError('Impossible d\'obtenir la position actuelle');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }

    // Méthode pour rafraîchir la carte
    async refresh() {
        await this.loadData();
    }
}

// Initialiser le gestionnaire de cartographie
let cartographieManager;

// Attendre que Leaflet soit chargé
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si Leaflet est disponible
    if (typeof L !== 'undefined') {
        cartographieManager = new CartographieManager();
        window.cartographieManager = cartographieManager;
    } else {
        console.error('Leaflet n\'est pas chargé');
    }
});

// Ajouter les styles CSS pour la carte
const mapStyles = document.createElement('style');
mapStyles.textContent = `
    .custom-popup .leaflet-popup-content-wrapper {
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .marker-popup {
        font-family: 'Poppins', sans-serif;
        font-size: 13px;
        line-height: 1.4;
    }
    
    .popup-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        color: white;
        font-size: 11px;
        font-weight: 500;
    }
    
    .status-planifie { background-color: #f39c12; }
    .status-en_cours { background-color: #3498db; }
    .status-realise { background-color: #27ae60; }
    .status-annule { background-color: #e74c3c; }
    
    .map-legend {
        font-family: 'Poppins', sans-serif;
    }
    
    .map-stats {
        font-family: 'Poppins', sans-serif;
        font-size: 13px;
        line-height: 1.4;
    }
    
    .leaflet-control-location button:hover {
        background-color: #f8f9fa !important;
    }
`;
document.head.appendChild(mapStyles);

// Export pour utilisation dans d'autres modules
window.CartographieManager = CartographieManager;