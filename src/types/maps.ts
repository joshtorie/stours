/**
 * Type definitions for serializable Google Maps objects
 */

export interface SerializableLatLng {
  lat: number;
  lng: number;
}

export interface SerializableBounds {
  northeast: SerializableLatLng;
  southwest: SerializableLatLng;
}

export interface SerializableDistance {
  text?: string;
  value?: number;
}

export interface SerializableDuration {
  text?: string;
  value?: number;
}

export interface SerializableStep {
  distance?: SerializableDistance;
  duration?: SerializableDuration;
  end_location: SerializableLatLng;
  start_location: SerializableLatLng;
  instructions: string;
  path?: SerializableLatLng[];
  travel_mode: google.maps.TravelMode;
}

export interface SerializableLeg {
  distance?: SerializableDistance;
  duration?: SerializableDuration;
  end_address: string;
  end_location: SerializableLatLng;
  start_address: string;
  start_location: SerializableLatLng;
  steps: SerializableStep[];
  via_waypoints?: SerializableLatLng[];
}

export interface SerializableRoute {
  bounds: SerializableBounds;
  copyrights: string;
  legs: SerializableLeg[];
  overview_path?: SerializableLatLng[];
  warnings: string[];
  waypoint_order: number[];
  overview_polyline: { points: string } | string;
  summary: string;
}

export interface SerializableDirectionsResult {
  routes: SerializableRoute[];
  request: google.maps.DirectionsRequest | null;
  geocoded_waypoints: google.maps.DirectionsGeocodedWaypoint[];
}

/**
 * Convert a Google Maps LatLng to a serializable format
 */
export function toSerializableLatLng(latLng: google.maps.LatLng | google.maps.LatLngLiteral): SerializableLatLng {
  return {
    lat: typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat,
    lng: typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng
  };
}

/**
 * Convert Google Maps Bounds to a serializable format
 */
export function toSerializableBounds(bounds: google.maps.LatLngBounds): SerializableBounds {
  return {
    northeast: toSerializableLatLng(bounds.getNorthEast()),
    southwest: toSerializableLatLng(bounds.getSouthWest())
  };
}

/**
 * Type guard to check if an object is a SerializableLatLng
 */
export function isSerializableLatLng(obj: any): obj is SerializableLatLng {
  return (
    obj &&
    typeof obj.lat === 'number' &&
    typeof obj.lng === 'number'
  );
}

/**
 * Type guard to check if an object is a SerializableBounds
 */
export function isSerializableBounds(obj: any): obj is SerializableBounds {
  return (
    obj &&
    obj.northeast &&
    obj.southwest &&
    isSerializableLatLng(obj.northeast) &&
    isSerializableLatLng(obj.southwest)
  );
}

/**
 * Type guard to check if an object is a SerializableDirectionsResult
 */
export function isSerializableDirectionsResult(obj: any): obj is SerializableDirectionsResult {
  return (
    obj &&
    Array.isArray(obj.routes) &&
    obj.routes.every((route: any) =>
      route.bounds &&
      isSerializableBounds(route.bounds) &&
      Array.isArray(route.legs) &&
      route.legs.every((leg: any) =>
        leg.steps &&
        Array.isArray(leg.steps) &&
        leg.steps.every((step: any) =>
          step.end_location &&
          step.start_location &&
          isSerializableLatLng(step.end_location) &&
          isSerializableLatLng(step.start_location)
        )
      )
    )
  );
}
