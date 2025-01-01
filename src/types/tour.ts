export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ARArtwork {
  modelUrl: string;     // 3D model URL (glb/gltf format)
  imageUrl: string;     // Preview image
  iosQuickLook?: string; // iOS quick look URL (usdz format)
  markerImage?: string; // Optional marker image for marker-based AR
}

export interface Location {
  id: string;
  title: string;
  artist: string;
  coordinates: Coordinates;
  imageUrl: string;
  shopUrl?: string;
  arEnabled?: boolean;
  arContent?: ARArtwork;  // AR content if available
}

export interface TourVariation {
  name: string;
  description: string;
  locations: Location[];
  response?: google.maps.DirectionsResult;
  estimatedTime?: number;
  distance?: string;
}

export interface TourState {
  tourVariations: TourVariation[];
  duration: number;
}
