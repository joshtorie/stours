// Google Maps configuration
export const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry")[] = ['places', 'geometry'];

export const DEFAULT_MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true, // Disables all controls
  zoomControl: true, // We'll keep zoom control as it's useful
  scrollwheel: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [], // Can add custom styles here if needed
};

export const DEFAULT_MAP_CENTER = {
  lat: -33.8688, // Default to Sydney
  lng: 151.2093,
};

export const DEFAULT_ZOOM = 13;
