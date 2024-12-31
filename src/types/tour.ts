export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  id: string;
  title: string;
  artist: string;
  coordinates: Coordinates;
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
