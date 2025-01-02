import type { 
  SerializableDirectionsResult,
  SerializableRoute,
  SerializableLeg,
  SerializableStep,
  SerializableLatLng,
  SerializableBounds
} from '../types/maps';

interface ValidationError {
  field: string;
  message: string;
  path?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

function validateLatLng(latLng: any, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!latLng) {
    errors.push({ field: 'latLng', message: 'LatLng object is missing', path });
    return errors;
  }

  if (typeof latLng.lat !== 'function') {
    errors.push({ field: 'lat', message: 'lat() method is missing', path });
  }
  if (typeof latLng.lng !== 'function') {
    errors.push({ field: 'lng', message: 'lng() method is missing', path });
  }

  // Validate coordinate ranges
  try {
    const lat = latLng.lat();
    const lng = latLng.lng();
    if (lat < -90 || lat > 90) {
      errors.push({ field: 'lat', message: 'Latitude must be between -90 and 90', path });
    }
    if (lng < -180 || lng > 180) {
      errors.push({ field: 'lng', message: 'Longitude must be between -180 and 180', path });
    }
  } catch (error) {
    errors.push({ field: 'latLng', message: 'Error accessing lat/lng values', path });
  }

  return errors;
}

function validateBounds(bounds: SerializableBounds, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!bounds) {
    errors.push({ field: 'bounds', message: 'Bounds object is missing', path });
    return errors;
  }

  try {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    errors.push(...validateLatLng(ne, `${path}.northEast`));
    errors.push(...validateLatLng(sw, `${path}.southWest`));

    // Validate bounds logic
    const neLat = ne.lat();
    const neLng = ne.lng();
    const swLat = sw.lat();
    const swLng = sw.lng();

    if (neLat < swLat) {
      errors.push({ field: 'bounds', message: 'Northeast latitude must be greater than southwest latitude', path });
    }
    if (neLng < swLng && Math.abs(neLng - swLng) < 180) {
      errors.push({ field: 'bounds', message: 'Invalid longitude span', path });
    }
  } catch (error) {
    errors.push({ field: 'bounds', message: 'Error accessing bounds values', path });
  }

  return errors;
}

function validateStep(step: SerializableStep, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!step.instructions) {
    errors.push({ field: 'instructions', message: 'Step instructions are missing', path });
  }

  if (!step.travel_mode) {
    errors.push({ field: 'travel_mode', message: 'Travel mode is missing', path });
  }

  errors.push(...validateLatLng(step.start_location, `${path}.start_location`));
  errors.push(...validateLatLng(step.end_location, `${path}.end_location`));

  if (step.path) {
    step.path.forEach((point, index) => {
      errors.push(...validateLatLng(point, `${path}.path[${index}]`));
    });
  }

  return errors;
}

function validateLeg(leg: SerializableLeg, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!leg.start_address) {
    errors.push({ field: 'start_address', message: 'Start address is missing', path });
  }
  if (!leg.end_address) {
    errors.push({ field: 'end_address', message: 'End address is missing', path });
  }

  errors.push(...validateLatLng(leg.start_location, `${path}.start_location`));
  errors.push(...validateLatLng(leg.end_location, `${path}.end_location`));

  if (!leg.steps || !leg.steps.length) {
    errors.push({ field: 'steps', message: 'Steps array is empty or missing', path });
  } else {
    leg.steps.forEach((step, index) => {
      errors.push(...validateStep(step, `${path}.steps[${index}]`));
    });
  }

  if (leg.via_waypoints) {
    leg.via_waypoints.forEach((point, index) => {
      errors.push(...validateLatLng(point, `${path}.via_waypoints[${index}]`));
    });
  }

  return errors;
}

function validateRoute(route: SerializableRoute, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  errors.push(...validateBounds(route.bounds, `${path}.bounds`));

  if (!route.legs || !route.legs.length) {
    errors.push({ field: 'legs', message: 'Route legs array is empty or missing', path });
  } else {
    route.legs.forEach((leg, index) => {
      errors.push(...validateLeg(leg, `${path}.legs[${index}]`));
    });
  }

  // Make overview_polyline validation more lenient
  if (!route.overview_polyline) {
    errors.push({ field: 'overview_polyline', message: 'Overview polyline is missing', path });
  } else if (typeof route.overview_polyline === 'string') {
    // If it's a string, it's valid
  } else if (typeof route.overview_polyline === 'object' && !route.overview_polyline.points) {
    errors.push({ field: 'overview_polyline', message: 'Overview polyline points is missing', path });
  }

  if (!route.summary) {
    errors.push({ field: 'summary', message: 'Route summary is missing', path });
  }

  if (route.overview_path) {
    route.overview_path.forEach((point, index) => {
      errors.push(...validateLatLng(point, `${path}.overview_path[${index}]`));
    });
  }

  return errors;
}

export function validateDirectionsResult(result: SerializableDirectionsResult): ValidationResult {
  const errors: ValidationError[] = [];

  if (!result) {
    return { isValid: false, errors: [{ field: 'result', message: 'Directions result is null or undefined' }] };
  }

  if (!result.routes || !result.routes.length) {
    errors.push({ field: 'routes', message: 'Routes array is empty or missing' });
  } else {
    result.routes.forEach((route, index) => {
      errors.push(...validateRoute(route, `routes[${index}]`));
    });
  }

  if (!result.geocoded_waypoints || !result.geocoded_waypoints.length) {
    errors.push({ field: 'geocoded_waypoints', message: 'Geocoded waypoints array is empty or missing' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function logValidationErrors(errors: ValidationError[]): void {
  if (errors.length === 0) return;

  console.group('Route Validation Errors');
  errors.forEach(error => {
    console.error(`${error.path ? `[${error.path}] ` : ''}${error.field}: ${error.message}`);
  });
  console.groupEnd();
}
