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

// Simplified route types that only store essential data
export interface SimplifiedLatLng {
  lat: number;
  lng: number;
}

export interface SimplifiedRoute {
  waypoints: SimplifiedLatLng[];
  duration: number;
  distance: number;
  polyline: string;
  steps: {
    location: SimplifiedLatLng;
    instruction: string;
    distance: number;
    duration: number;
  }[];
}

export interface SimplifiedTourState {
  route: SimplifiedRoute;
  artLocations: {
    id: string;
    location: SimplifiedLatLng;
    title: string;
    description?: string;
  }[];
  duration: number;
  timestamp: number;
}

// Conversion utilities
export function simplifyDirectionsResult(result: google.maps.DirectionsResult): SimplifiedRoute {
  const route = result.routes[0];
  const leg = route.legs[0];
  
  return {
    waypoints: leg.via_waypoints?.map(point => ({
      lat: point.lat(),
      lng: point.lng()
    })) || [],
    duration: leg.duration?.value || 0,
    distance: leg.distance?.value || 0,
    polyline: route.overview_polyline,
    steps: leg.steps.map(step => ({
      location: {
        lat: step.start_location.lat(),
        lng: step.start_location.lng()
      },
      instruction: step.instructions,
      distance: step.distance?.value || 0,
      duration: step.duration?.value || 0
    }))
  };
}

export function reconstructDirectionsResult(simplified: SimplifiedRoute): google.maps.DirectionsResult {
  return {
    routes: [{
      bounds: new google.maps.LatLngBounds(),
      legs: [{
        steps: simplified.steps.map(step => ({
          distance: { value: step.distance, text: `${step.distance}m` },
          duration: { value: step.duration, text: `${step.duration}s` },
          start_location: new google.maps.LatLng(step.location.lat, step.location.lng),
          end_location: new google.maps.LatLng(step.location.lat, step.location.lng),
          instructions: step.instruction
        })),
        distance: { value: simplified.distance, text: `${simplified.distance}m` },
        duration: { value: simplified.duration, text: `${simplified.duration}s` },
        start_location: new google.maps.LatLng(simplified.steps[0].location.lat, simplified.steps[0].location.lng),
        end_location: new google.maps.LatLng(simplified.steps[simplified.steps.length - 1].location.lat, simplified.steps[simplified.steps.length - 1].location.lng)
      }],
      overview_polyline: simplified.polyline
    }],
    geocoded_waypoints: []
  } as google.maps.DirectionsResult;
}

/**
 * Convert functions for Google Maps objects
 */

export function toGoogleMapsLatLng(coords: SerializableLatLng | google.maps.LatLng | google.maps.LatLngLiteral): google.maps.LatLng {
  if (coords instanceof google.maps.LatLng) {
    return coords;
  }
  const lat = typeof coords.lat === 'function' ? coords.lat() : coords.lat;
  const lng = typeof coords.lng === 'function' ? coords.lng() : coords.lng;
  return new google.maps.LatLng(lat, lng);
}

export function toGoogleMapsBounds(bounds: SerializableBounds): google.maps.LatLngBounds {
  return new google.maps.LatLngBounds(
    toGoogleMapsLatLng(bounds.southwest),
    toGoogleMapsLatLng(bounds.northeast)
  );
}

export function toGoogleMapsRoute(route: SerializableRoute): google.maps.DirectionsRoute {
  return {
    bounds: toGoogleMapsBounds(route.bounds),
    legs: route.legs.map(leg => ({
      distance: leg.distance,
      duration: leg.duration,
      end_address: leg.end_address,
      start_address: leg.start_address,
      end_location: toGoogleMapsLatLng(leg.end_location),
      start_location: toGoogleMapsLatLng(leg.start_location),
      steps: leg.steps.map(step => ({
        distance: step.distance,
        duration: step.duration,
        end_location: toGoogleMapsLatLng(step.end_location),
        start_location: toGoogleMapsLatLng(step.start_location),
        instructions: step.instructions,
        path: step.path?.map(toGoogleMapsLatLng),
        travel_mode: step.travel_mode
      })),
      via_waypoints: leg.via_waypoints?.map(toGoogleMapsLatLng) || []
    })),
    overview_path: route.overview_path?.map(toGoogleMapsLatLng),
    overview_polyline: typeof route.overview_polyline === 'string' 
      ? { points: route.overview_polyline }
      : route.overview_polyline,
    warnings: route.warnings || [],
    waypoint_order: route.waypoint_order || [],
    summary: route.summary || '',
    copyrights: route.copyrights || ''
  } as google.maps.DirectionsRoute;
}

export function toGoogleMapsDirectionsResult(result: SerializableDirectionsResult): google.maps.DirectionsResult {
  try {
    return {
      routes: result.routes.map(toGoogleMapsRoute),
      geocoded_waypoints: result.geocoded_waypoints || [],
      request: result.request
    } as google.maps.DirectionsResult;
  } catch (error) {
    console.error('Error converting directions result:', error);
    throw new Error('Failed to convert directions result');
  }
}
