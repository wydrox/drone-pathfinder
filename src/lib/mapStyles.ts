export interface MapStyle {
  id: string;
  name: string;
  url: string;
  attribution: string;
  type: 'vector' | 'raster';
  requiresToken: boolean;
}

export const MAP_STYLES: MapStyle[] = [
  {
    id: 'carto-dark',
    name: 'Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    type: 'raster',
    requiresToken: false,
  },
  {
    id: 'carto-light',
    name: 'Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    type: 'raster',
    requiresToken: false,
  },
  {
    id: 'satellite',
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    type: 'raster',
    requiresToken: false,
  },
  {
    id: 'terrain',
    name: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap',
    type: 'raster',
    requiresToken: false,
  },
];

export function getMapStyleById(id: string): MapStyle {
  return MAP_STYLES.find(s => s.id === id) || MAP_STYLES[0];
}
