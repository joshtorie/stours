/**
 * Utility functions for handling Google Maps coordinates and conversions
 */

type LatLngLiteral = google.maps.LatLngLiteral;
type LatLng = google.maps.LatLng;
type LatLngBounds = google.maps.LatLngBounds;

/**
 * Converts a Google Maps LatLng object to a LatLngLiteral
 */
export function toLatLngLiteral(latLng: LatLng): LatLngLiteral {
  return {
    lat: latLng.lat(),
    lng: latLng.lng()
  };
}

/**
 * Creates a new Google Maps LatLng object from coordinates
 */
export function createLatLng(lat: number, lng: number): LatLng {
  return new google.maps.LatLng(lat, lng);
}

/**
 * Creates a new LatLngBounds from a bounds object with SW and NE coordinates
 */
export function createLatLngBounds(bounds: { 
  southwest: LatLngLiteral; 
  northeast: LatLngLiteral; 
}): LatLngBounds {
  return new google.maps.LatLngBounds(
    createLatLng(bounds.southwest.lat, bounds.southwest.lng),
    createLatLng(bounds.northeast.lat, bounds.northeast.lng)
  );
}

/**
 * Extracts southwest and northeast points from a LatLngBounds object
 */
export function getBoundsPoints(bounds: LatLngBounds): {
  southwest: LatLngLiteral;
  northeast: LatLngLiteral;
} {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  return {
    southwest: toLatLngLiteral(sw),
    northeast: toLatLngLiteral(ne)
  };
}

/**
 * Safely converts a path point to LatLngLiteral, handling null/undefined
 */
export function safePathToLatLng(pathPoint: LatLng | null | undefined): LatLngLiteral | null {
  if (!pathPoint) return null;
  return toLatLngLiteral(pathPoint);
}

/**
 * Calculates the distance between two points
 */
export function calculateDistance(point1: LatLngLiteral, point2: LatLngLiteral): number {
  return google.maps.geometry.spherical.computeDistanceBetween(point1, point2);
}

/**
 * Checks if a point is within a certain distance of another point
 */
export function isWithinDistance(point1: LatLngLiteral, point2: LatLngLiteral, maxDistance: number): boolean {
  return calculateDistance(point1, point2) < maxDistance;
}

/**
 * Finds the closest point from a list of points to a target point
 */
export function findClosestPoint(targetPoint: LatLngLiteral, points: LatLngLiteral[]): { point: LatLngLiteral; distance: number; index: number } | null {
  if (!points.length) return null;

  let closestPoint = points[0];
  let minDistance = calculateDistance(targetPoint, closestPoint);
  let closestIndex = 0;

  points.forEach((point, index) => {
    const distance = calculateDistance(targetPoint, point);
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = point;
      closestIndex = index;
    }
  });

  return {
    point: closestPoint,
    distance: minDistance,
    index: closestIndex
  };
}
