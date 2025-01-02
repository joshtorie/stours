import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleMap, DirectionsRenderer, InfoWindow, MarkerF } from '@react-google-maps/api';
import { DEFAULT_MAP_OPTIONS } from '../config/maps';
import GoogleMapsWrapper from '../components/maps/GoogleMapsWrapper';
import ARViewer from '../components/ARViewer';
import type { TourVariation, Location as ArtLocation } from '../types/tour';
import { 
  toLatLngLiteral, 
  createLatLng, 
  safePathToLatLng, 
  isWithinDistance,
  createLatLngBounds,
  getBoundsPoints
} from '../utils/mapUtils';
import type { SerializableDirectionsResult } from '../types/maps';
import { isSerializableDirectionsResult } from '../types/maps';
import { validateDirectionsResult, logValidationErrors } from '../utils/routeValidation';
import { saveTourState, loadTourState } from '../utils/storage';

// Google Maps types
type LatLngLiteral = google.maps.LatLngLiteral;
type DirectionsResult = google.maps.DirectionsResult;
type LatLng = google.maps.LatLng;

interface TourState {
  selectedRoute: TourVariation & {
    response: SerializableDirectionsResult;
  };
  duration: number;
}

interface ArtworkDisplay {
  location: ArtLocation;
  index: number;
  distance: number;
}

interface SimplifiedTourState {
  route: any;
  artLocations: any[];
  duration: number;
  timestamp: number;
}

// Custom hook for Google Maps loading state
function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (window.google) {
      setIsLoaded(true);
    }
  }, []);

  return { isLoaded, error };
}

// Custom hook for user location
function useUserLocation(isGoogleLoaded: boolean) {
  const [location, setLocation] = React.useState<LatLng | null>(null);
  const [error, setError] = React.useState<GeolocationPositionError | null>(null);

  React.useEffect(() => {
    if (!navigator.geolocation || !isGoogleLoaded) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = createLatLng(position.coords.latitude, position.coords.longitude);
        setLocation(newLocation);
        setError(null);
      },
      (error) => {
        console.error('Error getting location:', error);
        setError(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isGoogleLoaded]);

  return { location, error };
}

// Custom hook for finding nearby art
function useNearbyArt(step: google.maps.DirectionsStep | null, locations: ArtLocation[], isGoogleLoaded: boolean): ArtworkDisplay | null {
  return React.useMemo(() => {
    if (!step?.path?.[0] || !isGoogleLoaded || !locations.length) return null;

    const stepLocation = safePathToLatLng(step.path[0]);
    let closestArt: ArtworkDisplay | null = null;
    let minDistance = Infinity;

    locations.forEach((loc, index) => {
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        { lat: loc.coordinates.lat, lng: loc.coordinates.lng } as LatLngLiteral,
        stepLocation
      );

      if (distance < 50 && distance < minDistance) {
        minDistance = distance;
        closestArt = { location: loc, index, distance };
      }
    });

    return closestArt;
  }, [step, locations, isGoogleLoaded]);
}

// Simplify directions result for storage
function simplifyDirectionsResult(directionsResult: SerializableDirectionsResult) {
  return {
    routes: directionsResult.routes.map(route => ({
      bounds: {
        southwest: {
          lat: route.bounds.southwest.lat,
          lng: route.bounds.southwest.lng
        },
        northeast: {
          lat: route.bounds.northeast.lat,
          lng: route.bounds.northeast.lng
        }
      },
      legs: route.legs.map(leg => ({
        steps: leg.steps.map(step => ({
          path: step.path?.map(point => ({
            lat: point.lat,
            lng: point.lng
          })),
          start_location: {
            lat: step.start_location.lat,
            lng: step.start_location.lng
          },
          end_location: {
            lat: step.end_location.lat,
            lng: step.end_location.lng
          }
        })),
        start_location: {
          lat: leg.start_location.lat,
          lng: leg.start_location.lng
        },
        end_location: {
          lat: leg.end_location.lat,
          lng: leg.end_location.lng
        },
        via_waypoints: leg.via_waypoints?.map(point => ({
          lat: point.lat,
          lng: point.lng
        })) || []
      })),
      overview_path: route.overview_path?.map(point => ({
        lat: point.lat,
        lng: point.lng
      })),
      warnings: route.warnings || [],
      waypoint_order: route.waypoint_order || [],
      overview_polyline: typeof route.overview_polyline === 'string' 
        ? route.overview_polyline 
        : route.overview_polyline.points || '',
      summary: route.summary || '',
      copyrights: route.copyrights || ''
    })),
    request: directionsResult.request,
    geocoded_waypoints: directionsResult.geocoded_waypoints || []
  };
}

// Reconstruct directions result from simplified format
function reconstructDirectionsResult(simplifiedRoute: any) {
  return {
    routes: simplifiedRoute.routes.map(route => ({
      bounds: new google.maps.LatLngBounds(
        new google.maps.LatLng(
          route.bounds.southwest.lat,
          route.bounds.southwest.lng
        ),
        new google.maps.LatLng(
          route.bounds.northeast.lat,
          route.bounds.northeast.lng
        )
      ),
      legs: route.legs.map(leg => ({
        ...leg,
        steps: leg.steps.map(step => ({
          ...step,
          path: step.path?.map(point => 
            new google.maps.LatLng(point.lat, point.lng)
          ),
          start_location: new google.maps.LatLng(
            step.start_location.lat,
            step.start_location.lng
          ),
          end_location: new google.maps.LatLng(
            step.end_location.lat,
            step.end_location.lng
          )
        })),
        start_location: new google.maps.LatLng(
          leg.start_location.lat,
          leg.start_location.lng
        ),
        end_location: new google.maps.LatLng(
          leg.end_location.lat,
          leg.end_location.lng
        ),
        via_waypoints: leg.via_waypoints?.map(point => 
          new google.maps.LatLng(point.lat, point.lng)
        ) || []
      })),
      overview_path: route.overview_path?.map(point => 
        new google.maps.LatLng(point.lat, point.lng)
      ),
      warnings: route.warnings || [],
      waypoint_order: route.waypoint_order || [],
      overview_polyline: typeof route.overview_polyline === 'string' 
        ? route.overview_polyline 
        : route.overview_polyline.points || '',
      summary: route.summary || '',
      copyrights: route.copyrights || ''
    })),
    request: simplifiedRoute.request,
    geocoded_waypoints: simplifiedRoute.geocoded_waypoints || []
  };
}

export default function YourTour() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tour, setTour] = React.useState<TourVariation & { response: SerializableDirectionsResult } | null>(null);
  const [duration, setDuration] = React.useState<number>(0);
  const [error, setError] = React.useState<{ message: string } | null>(null);
  const [mapsError, setMapsError] = React.useState<{ message: string } | null>(null);
  const [locationError, setLocationError] = React.useState<{ message: string } | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [userLocation, setUserLocation] = React.useState<google.maps.LatLng | null>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = React.useState(false);
  const [maximizedArtCard, setMaximizedArtCard] = React.useState<number | null>(null);
  const [showARViewer, setShowARViewer] = React.useState(false);
  const [selectedArtwork, setSelectedArtwork] = React.useState<ArtLocation | null>(null);
  const [selectedMarker, setSelectedMarker] = React.useState<number | null>(null);
  const [isArtStopsExpanded, setIsArtStopsExpanded] = React.useState(false);

  // Convert to simplified format for storage
  const simplifiedState = React.useMemo(() => {
    if (!tour?.response || !isGoogleLoaded) return null;
    
    try {
      return {
        route: simplifyDirectionsResult(tour.response),
        artLocations: tour.locations.map(loc => ({
          id: loc.id,
          location: {
            lat: loc.coordinates.lat,
            lng: loc.coordinates.lng
          },
          title: loc.title,
          description: loc.description
        })),
        duration,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error simplifying tour state:', error);
      return null;
    }
  }, [tour, duration, isGoogleLoaded]);

  // Convert back to Google Maps objects for rendering
  const directionsResult = React.useMemo((): google.maps.DirectionsResult | null => {
    if (!simplifiedState?.route || !isGoogleLoaded) return null;

    try {
      const firstRoute = simplifiedState.route.routes[0];
      if (!firstRoute) {
        console.error('No route found in directions response');
        return null;
      }

      // Create bounds once and reuse
      const bounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(firstRoute.bounds.southwest.lat, firstRoute.bounds.southwest.lng),
        new google.maps.LatLng(firstRoute.bounds.northeast.lat, firstRoute.bounds.northeast.lng)
      );

      // Create a stable reference for the route
      const convertedRoute: google.maps.DirectionsRoute = {
        bounds,
        legs: firstRoute.legs.map(leg => {
          const startLocation = new google.maps.LatLng(leg.start_location.lat, leg.start_location.lng);
          const endLocation = new google.maps.LatLng(leg.end_location.lat, leg.end_location.lng);

          return {
            distance: leg.distance,
            duration: leg.duration,
            end_address: leg.end_address,
            end_location: endLocation,
            start_address: leg.start_address,
            start_location: startLocation,
            steps: leg.steps.map(step => {
              const stepStart = new google.maps.LatLng(step.start_location.lat, step.start_location.lng);
              const stepEnd = new google.maps.LatLng(step.end_location.lat, step.end_location.lng);
              const path = (step.path || []).map(point => 
                new google.maps.LatLng(point.lat, point.lng)
              );

              return {
                distance: step.distance,
                duration: step.duration,
                end_location: stepEnd,
                instructions: step.instructions,
                path,
                start_location: stepStart,
                travel_mode: step.travel_mode
              };
            }),
            via_waypoints: (leg.via_waypoints || []).map(point => 
              new google.maps.LatLng(point.lat, point.lng)
            )
          };
        }),
        overview_path: (firstRoute.overview_path || []).map(point => 
          new google.maps.LatLng(point.lat, point.lng)
        ),
        overview_polyline: {
          points: typeof firstRoute.overview_polyline === 'string' 
            ? firstRoute.overview_polyline 
            : firstRoute.overview_polyline?.points || ''
        },
        warnings: [...(firstRoute.warnings || [])],
        waypoint_order: [...(firstRoute.waypoint_order || [])],
        summary: firstRoute.summary || ''
      };

      // Create a stable reference for the final result
      const result: google.maps.DirectionsResult = {
        routes: [convertedRoute],
        geocoded_waypoints: simplifiedState.route.geocoded_waypoints?.map(waypoint => ({
          place_id: waypoint.place_id || '',
          types: [...(waypoint.types || [])],
          partial_match: waypoint.partial_match || false
        })) || [],
        request: null // Exclude request to avoid serialization issues
      };

      return result;
    } catch (error) {
      console.error('Error converting directions result:', error);
      return null;
    }
  }, [simplifiedState?.route, isGoogleLoaded]);

  // Save simplified state
  React.useEffect(() => {
    if (simplifiedState) {
      localStorage.setItem('currentTour', JSON.stringify(simplifiedState));
    }
  }, [simplifiedState]);

  // Load from storage if needed
  React.useEffect(() => {
    if (!location.state?.selectedRoute) {
      const stored = localStorage.getItem('currentTour');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as SimplifiedTourState;
          if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            setDuration(parsed.duration);
            // Reconstruct tour object
            setTour({
              name: 'Restored Tour',
              description: 'Tour restored from storage',
              locations: parsed.artLocations.map(art => ({
                id: art.id,
                title: art.title,
                description: art.description || '',
                coordinates: art.location
              })),
              response: reconstructDirectionsResult(parsed.route)
            });
          } else {
            localStorage.removeItem('currentTour');
            navigate('/');
          }
        } catch (error) {
          console.error('Error loading stored tour:', error);
          navigate('/');
        }
      } else {
        navigate('/');
      }
    }
  }, [location.state, navigate, isGoogleLoaded]);

  // Load tour data from state or storage
  React.useEffect(() => {
    if (location.state?.selectedRoute) {
      const { selectedRoute, duration: tourDuration } = location.state;
      setTour(selectedRoute);
      setDuration(tourDuration || 0);
      // Save to storage
      saveTourState({
        selectedRoute,
        duration: tourDuration || 0
      });
    } else {
      // Try to load from storage
      const stored = loadTourState();
      if (stored) {
        const { selectedRoute, duration: storedDuration } = stored;
        if (selectedRoute && selectedRoute.response) {
          setTour(selectedRoute as TourVariation & { response: SerializableDirectionsResult });
          setDuration(storedDuration);
        } else {
          setError({ message: 'Invalid tour data in storage.' });
          navigate('/');
        }
      } else {
        setError({ message: 'No tour data found. Please select a tour first.' });
        navigate('/');
      }
    }
  }, [location.state, navigate]);

  // Handle Google Maps load
  const handleGoogleMapsLoad = React.useCallback(() => {
    setIsGoogleLoaded(true);
  }, []);

  // Handle location updates
  const handleLocationUpdate = React.useCallback((position: GeolocationPosition) => {
    if (!isGoogleLoaded) return;
    
    const { latitude, longitude } = position.coords;
    setUserLocation(new google.maps.LatLng(latitude, longitude));
  }, [isGoogleLoaded]);

  // Watch user location
  React.useEffect(() => {
    if (!isGoogleLoaded || !tour) return;

    let watchId: number;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        (error) => {
          console.error('Location error:', error);
          setLocationError({ message: error.message });
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000
        }
      );
    } else {
      setLocationError({ message: 'Geolocation is not supported by your browser.' });
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isGoogleLoaded, tour, handleLocationUpdate]);

  if (!tour || !tour.response) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="font-bold mb-2">Error Loading Tour</h2>
          <p>Unable to load tour data. Please try again.</p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-2 text-xs whitespace-pre-wrap">
              {JSON.stringify(tour, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  }

  if (mapsError) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="font-bold mb-2">Google Maps Error</h2>
          <p>{mapsError.message}</p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-2 text-xs whitespace-pre-wrap">
              {JSON.stringify(mapsError, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <h2 className="font-bold mb-2">Location Access Required</h2>
          <p>Please enable location access to use the tour navigation.</p>
          <p className="text-sm mt-2">{locationError.message}</p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-2 text-xs whitespace-pre-wrap">
              {JSON.stringify(locationError, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  }

  const leg = tour.response.routes[0].legs[0];

  // Function to handle art card click
  const handleArtCardClick = (locationIndex: number) => {
    setMaximizedArtCard(maximizedArtCard === locationIndex ? null : locationIndex);
  };

  // Function to handle AR button click
  const handleARClick = (artwork: ArtLocation) => {
    if (artwork.arContent) {
      setSelectedArtwork(artwork);
      setShowARViewer(true);
    }
  };

  return (
    <GoogleMapsWrapper>
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b">
            <h1 className="text-2xl font-bold">{tour.name}</h1>
            <p className="text-gray-600 mt-1">{tour.description}</p>
          </div>

          {/* Tour Details */}
          <div className="p-4 border-b">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Tour Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Tour Duration</p>
                  <p className="font-medium">{duration} minutes</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Walking Time</p>
                  <p className="font-medium">{tour.estimatedTime} minutes</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Distance</p>
                  <p className="font-medium">{tour.distance}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="h-[500px] relative">
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={tour.locations[0].coordinates}
              zoom={13}
              options={DEFAULT_MAP_OPTIONS}
            >
              {/* Display markers with thumbnails */}
              {tour.locations.map((location, index) => (
                <MarkerF
                  key={index}
                  position={location.coordinates}
                  label={(index + 1).toString()}
                  onClick={() => setSelectedMarker(index)}
                />
              ))}

              {/* Show info window for selected marker */}
              {selectedMarker !== null && (
                <InfoWindow
                  position={tour.locations[selectedMarker].coordinates}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div className="max-w-xs">
                    <h3 className="font-bold mb-1">
                      {tour.locations[selectedMarker].title}
                    </h3>
                    <p className="text-sm mb-2">by {tour.locations[selectedMarker].artist}</p>
                    {tour.locations[selectedMarker].imageUrl && (
                      <img
                        src={tour.locations[selectedMarker].imageUrl}
                        alt={tour.locations[selectedMarker].title}
                        className="w-full h-32 object-cover rounded"
                      />
                    )}
                  </div>
                </InfoWindow>
              )}

              {/* Display user location */}
              {userLocation && (
                <MarkerF
                  position={userLocation}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeColor: "#FFFFFF",
                    strokeWeight: 2,
                  }}
                />
              )}

              {/* Display the route */}
              {directionsResult && (
                <DirectionsRenderer
                  options={{
                    directions: {
                      ...directionsResult,
                      request: {
                        travelMode: google.maps.TravelMode.WALKING,
                        destination: directionsResult.routes[0].legs[0].end_location,
                        origin: directionsResult.routes[0].legs[0].start_location,
                      }
                    },
                    suppressMarkers: false,
                    markerOptions: {
                      label: {
                        text: '',
                        color: 'white',
                        fontWeight: 'bold'
                      }
                    }
                  }}
                />
              )}
            </GoogleMap>
          </div>

          {/* Street Art Stops - Collapsible */}
          <div className="p-4 border-b">
            <button 
              onClick={() => setIsArtStopsExpanded(!isArtStopsExpanded)}
              className="w-full flex justify-between items-center text-xl font-semibold mb-4"
            >
              <span>Street Art Stops</span>
              <svg 
                className={`w-6 h-6 transform transition-transform ${isArtStopsExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isArtStopsExpanded && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tour.locations.map((location, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleArtCardClick(index)}
                  >
                    <div className="flex items-start">
                      <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium">{location.title}</h3>
                        <p className="text-sm text-gray-600">by {location.artist}</p>
                      </div>
                    </div>
                    {location.imageUrl && (
                      <img
                        src={location.imageUrl}
                        alt={location.title}
                        className="w-full h-32 object-cover rounded mt-2"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Walking Directions */}
          <div className="p-4">
            <div>
              <h2 className="text-xl font-semibold mb-4">Walking Directions</h2>
              <div className="flex justify-end mb-4 space-x-4">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className={`px-4 py-2 rounded-lg ${
                    isPaused ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'
                  } text-white`}
                >
                  {isPaused ? 'Resume Tour' : 'Pause Tour'}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to complete this tour?')) {
                      navigate('/');
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Complete Tour
                </button>
              </div>
              <div className="space-y-4">
                {leg.steps.map((step, index) => {
                  const isArtStop = isGoogleLoaded && tour.locations.some(loc => {
                    const stepPath = step.path?.[0];
                    if (!stepPath) return false;

                    const stepLatLng = toLatLngLiteral(stepPath);
                    const locationLatLng = {
                      lat: loc.coordinates.lat,
                      lng: loc.coordinates.lng
                    } as LatLngLiteral;

                    return isWithinDistance(stepLatLng, locationLatLng, 50);
                  });
                  
                  const artLocation = isGoogleLoaded && tour.locations.find(loc => {
                    const stepPath = step.path?.[0];
                    if (!stepPath) return false;

                    const stepLatLng = toLatLngLiteral(stepPath);
                    const locationLatLng = {
                      lat: loc.coordinates.lat,
                      lng: loc.coordinates.lng
                    } as LatLngLiteral;

                    return isWithinDistance(stepLatLng, locationLatLng, 50);
                  });

                  const artLocationIndex = artLocation ? tour.locations.findIndex(loc => loc.title === artLocation.title) : -1;

                  const nearbyArt = useNearbyArt(step, tour.locations, isGoogleLoaded);

                  return (
                    <React.Fragment key={index}>
                      {isArtStop && <div className="border-t-2 border-blue-500 my-4" />}
                      <div className={`flex items-start p-4 rounded-lg ${
                        currentStepIndex === index ? 'bg-blue-50 border-2 border-blue-500' : ''
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-3 ${
                          currentStepIndex === index ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p dangerouslySetInnerHTML={{ __html: step.instructions }} />
                          <p className="text-sm text-gray-600 mt-1">
                            {step.distance?.text} · {step.duration?.text}
                          </p>
                        </div>
                      </div>
                      {isArtStop && artLocation && (
                        <div className="ml-9 mt-2 mb-4">
                          {maximizedArtCard === artLocationIndex ? (
                            <div className="bg-white rounded-lg shadow-lg p-4">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="font-bold text-xl">{artLocation.title}</h3>
                                  <p className="text-gray-600">by {artLocation.artist}</p>
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMaximizedArtCard(null);
                                  }}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                              {artLocation.imageUrl && (
                                <img
                                  src={artLocation.imageUrl}
                                  alt={artLocation.title}
                                  className="w-full h-64 object-cover rounded mb-4"
                                />
                              )}
                              {/* Action buttons */}
                              <div className="flex flex-wrap gap-4 mt-4">
                                {artLocation.arEnabled && artLocation.arContent && (
                                  <button 
                                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 flex items-center space-x-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleARClick(artLocation);
                                    }}
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>View in AR</span>
                                  </button>
                                )}
                                {artLocation.shopUrl && (
                                  <a
                                    href={artLocation.shopUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center space-x-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    <span>Shop</span>
                                  </a>
                                )}
                                <button 
                                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center space-x-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Add share logic here
                                    console.log('Sharing artwork');
                                  }}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                  </svg>
                                  <span>Share</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="flex items-start space-x-4 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArtCardClick(artLocationIndex);
                              }}
                            >
                              {artLocation.imageUrl && (
                                <img
                                  src={artLocation.imageUrl}
                                  alt={artLocation.title}
                                  className="w-24 h-24 object-cover rounded"
                                />
                              )}
                              <div>
                                <h3 className="font-bold text-lg">{artLocation.title}</h3>
                                <p className="text-gray-600">by {artLocation.artist}</p>
                                <p className="text-sm text-blue-500 mt-1">Click to view details</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {isArtStop && <div className="border-b-2 border-blue-500 my-4" />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showARViewer && selectedArtwork?.arContent && (
        <ARViewer
          artwork={selectedArtwork.arContent}
          onClose={() => {
            setShowARViewer(false);
            setSelectedArtwork(null);
          }}
        />
      )}
    </GoogleMapsWrapper>
  );
}
