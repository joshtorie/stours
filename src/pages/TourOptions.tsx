import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleMap, DirectionsService, DirectionsRenderer, MarkerF } from '@react-google-maps/api';
import { DEFAULT_MAP_OPTIONS } from '../config/maps';
import GoogleMapsWrapper from '../components/maps/GoogleMapsWrapper';
import type { TourVariation, TourState } from '../types/tour';
import type { 
  SerializableDirectionsResult, 
  SerializableLatLng, 
  SerializableBounds 
} from '../types/maps';
import { isSerializableDirectionsResult } from '../types/maps';
import { validateDirectionsResult, logValidationErrors } from '../utils/routeValidation';
import { getTourHistory, clearTourData } from '../utils/storage';

export default function TourOptions() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tourVariations: initialTourVariations = [], duration = 0 } = location.state as TourState;
  
  const [tourVariations, setTourVariations] = useState<TourVariation[]>(initialTourVariations);
  const [calculatingRoutes, setCalculatingRoutes] = useState<Set<number>>(new Set());
  const [selectedTour, setSelectedTour] = useState<number | null>(null);
  const [requestCount, setRequestCount] = useState<Record<number, number>>({});
  const [error, setError] = useState<{ title: string; message: string; details: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [tourHistory, setTourHistory] = useState<ReturnType<typeof getTourHistory>>([]);

  // Load tour history
  useEffect(() => {
    const history = getTourHistory();
    setTourHistory(history);
  }, []);

  // Handle history selection
  const handleHistorySelect = (historyItem: ReturnType<typeof getTourHistory>[0]) => {
    navigate('/your-tour', {
      state: {
        selectedRoute: historyItem.selectedRoute,
        duration: historyItem.duration
      }
    });
  };

  // Clear history
  const handleClearHistory = () => {
    clearTourData();
    setTourHistory([]);
    setShowHistory(false);
  };

  // Request directions for all tours when component mounts
  useEffect(() => {
    console.log('[TourOptions] Initial tour variations:', tourVariations);
    tourVariations.forEach((_, index) => {
      if (!tourVariations[index].response) {
        setCalculatingRoutes(prev => {
          const next = new Set(prev);
          next.add(index);
          return next;
        });
        setRequestCount(prev => ({
          ...prev,
          [index]: 0
        }));
      }
    });
  }, []);

  const handleDirectionsCallback = useCallback((
    response: google.maps.DirectionsResult | null,
    status: google.maps.DirectionsStatus,
    index: number
  ) => {
    console.log(`[TourOptions] Directions callback for tour ${index}:`, { 
      status, 
      hasResponse: !!response,
      requestCount: requestCount[index]
    });

    if (status === 'OK' && response) {
      const route = response.routes[0];
      const leg = route.legs[0];
      
      // Calculate total walking time and distance
      const totalDuration = route.legs.reduce((total, leg) => total + (leg.duration?.value || 0), 0);
      const totalDistance = route.legs.reduce((total, leg) => total + (leg.distance?.value || 0), 0);
      
      setTourVariations(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          response,
          estimatedTime: Math.ceil(totalDuration / 60), // Convert seconds to minutes
          distance: `${(totalDistance / 1000).toFixed(1)} km` // Convert meters to kilometers
        };
        return updated;
      });
      setCalculatingRoutes(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    } else {
      console.error(`[TourOptions] Directions request failed for tour ${index}:`, status);
      
      // If we haven't tried too many times, retry
      if (requestCount[index] < 3) {
        console.log(`[TourOptions] Retrying request for tour ${index}`);
        setRequestCount(prev => ({
          ...prev,
          [index]: (prev[index] || 0) + 1
        }));
      } else {
        // If we've tried too many times, give up
        console.error(`[TourOptions] Failed to get directions for tour ${index} after multiple attempts`);
        setCalculatingRoutes(prev => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      }
    }
  }, [requestCount]);

  const handleRouteSelect = (index: number) => {
    if (!tourVariations[index].response) {
      console.error('Cannot select route without directions response');
      return;
    }

    try {
      const response = tourVariations[index].response;
      if (!response.routes[0]) {
        console.error('No route found in directions response');
        return;
      }

      // Create a serializable version of the tour
      const serializableTour = {
        ...tourVariations[index],
        estimatedTime: tourVariations[index].estimatedTime,
        distance: tourVariations[index].distance,
        response: {
          routes: response.routes.map(route => ({
            bounds: {
              northeast: {
                lat: Number(typeof route.bounds.getNorthEast().lat === 'function' 
                  ? route.bounds.getNorthEast().lat() 
                  : route.bounds.getNorthEast().lat),
                lng: Number(typeof route.bounds.getNorthEast().lng === 'function'
                  ? route.bounds.getNorthEast().lng()
                  : route.bounds.getNorthEast().lng)
              },
              southwest: {
                lat: Number(typeof route.bounds.getSouthWest().lat === 'function'
                  ? route.bounds.getSouthWest().lat()
                  : route.bounds.getSouthWest().lat),
                lng: Number(typeof route.bounds.getSouthWest().lng === 'function'
                  ? route.bounds.getSouthWest().lng()
                  : route.bounds.getSouthWest().lng)
              }
            },
            legs: route.legs.map(leg => ({
              distance: {
                text: leg.distance?.text || '',
                value: leg.distance?.value || 0
              },
              duration: {
                text: leg.duration?.text || '',
                value: leg.duration?.value || 0
              },
              end_address: leg.end_address || '',
              start_address: leg.start_address || '',
              end_location: {
                lat: Number(typeof leg.end_location.lat === 'function' ? leg.end_location.lat() : leg.end_location.lat),
                lng: Number(typeof leg.end_location.lng === 'function' ? leg.end_location.lng() : leg.end_location.lng)
              },
              start_location: {
                lat: Number(typeof leg.start_location.lat === 'function' ? leg.start_location.lat() : leg.start_location.lat),
                lng: Number(typeof leg.start_location.lng === 'function' ? leg.start_location.lng() : leg.start_location.lng)
              },
              steps: leg.steps.map(step => ({
                distance: {
                  text: step.distance?.text || '',
                  value: step.distance?.value || 0
                },
                duration: {
                  text: step.duration?.text || '',
                  value: step.duration?.value || 0
                },
                instructions: step.instructions || '',
                path: (step.path || []).map(point => ({
                  lat: Number(typeof point.lat === 'function' ? point.lat() : point.lat),
                  lng: Number(typeof point.lng === 'function' ? point.lng() : point.lng)
                })),
                start_location: {
                  lat: Number(typeof step.start_location.lat === 'function' ? step.start_location.lat() : step.start_location.lat),
                  lng: Number(typeof step.start_location.lng === 'function' ? step.start_location.lng() : step.start_location.lng)
                },
                end_location: {
                  lat: Number(typeof step.end_location.lat === 'function' ? step.end_location.lat() : step.end_location.lat),
                  lng: Number(typeof step.end_location.lng === 'function' ? step.end_location.lng() : step.end_location.lng)
                },
                travel_mode: step.travel_mode || 'WALKING'
              })),
              via_waypoints: (leg.via_waypoints || []).map(point => ({
                lat: Number(typeof point.lat === 'function' ? point.lat() : point.lat),
                lng: Number(typeof point.lng === 'function' ? point.lng() : point.lng)
              }))
            })),
            overview_path: (route.overview_path || []).map(point => ({
              lat: Number(typeof point.lat === 'function' ? point.lat() : point.lat),
              lng: Number(typeof point.lng === 'function' ? point.lng() : point.lng)
            })),
            overview_polyline: {
              points: typeof route.overview_polyline === 'string' 
                ? route.overview_polyline 
                : route.overview_polyline?.points || ''
            },
            warnings: [...(route.warnings || [])],
            waypoint_order: [...(route.waypoint_order || [])],
            summary: route.summary || ''
          })),
          request: null, // Exclude request object as it may contain functions
          geocoded_waypoints: (response.geocoded_waypoints || []).map(waypoint => ({
            place_id: waypoint.place_id || '',
            types: [...(waypoint.types || [])],
            partial_match: waypoint.partial_match || false
          }))
        }
      };

      // Remove any functions or non-serializable data
      const cleanTour = JSON.parse(JSON.stringify(serializableTour));

      // Validate before proceeding
      if (!isSerializableDirectionsResult(cleanTour.response)) {
        throw new Error('Failed to create serializable directions result');
      }

      navigate('/your-tour', {
        state: {
          selectedRoute: cleanTour,
          duration
        }
      });
    } catch (error) {
      console.error('Error serializing route:', error);
      setError({
        title: 'Route Processing Error',
        message: 'An unexpected error occurred while processing the route. Please try again.',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  };

  // Create DirectionsService component
  const DirectionsServiceComponent = ({ variation, index }: { variation: TourVariation; index: number }) => {
    if (!window.google || variation.response || !calculatingRoutes.has(index)) {
      return null;
    }

    const waypoints = variation.locations.slice(1, -1).map(loc => ({
      location: { lat: loc.coordinates.lat, lng: loc.coordinates.lng },
      stopover: true
    }));

    return (
      <DirectionsService
        options={{
          destination: { lat: variation.locations[variation.locations.length - 1].coordinates.lat, lng: variation.locations[variation.locations.length - 1].coordinates.lng },
          origin: { lat: variation.locations[0].coordinates.lat, lng: variation.locations[0].coordinates.lng },
          waypoints,
          travelMode: window.google.maps.TravelMode.WALKING,
          optimizeWaypoints: true
        }}
        callback={(response, status) => handleDirectionsCallback(response, status, index)}
      />
    );
  };

  return (
    <GoogleMapsWrapper>
      <div className="container mx-auto p-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h2 className="font-bold">{error.title}</h2>
            <p className="mb-2">{error.message}</p>
            <pre className="text-sm">{error.details}</pre>
          </div>
        )}
        <h1 className="text-2xl font-bold mb-6">
          {tourVariations.length > 1 ? 'Choose Your Tour' : 'Your Optimized Tour'}
        </h1>
        {tourVariations.length === 1 && (
          <p className="text-gray-600 mb-6">
            We've created the best possible tour based on your selections, optimizing for both walking distance and variety.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tourVariations.map((variation, index) => (
            <div 
              key={index}
              className={`
                bg-white rounded-lg shadow-lg overflow-hidden
                ${selectedTour === index ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{variation.name}</h2>
                <p className="text-gray-600 mb-4">{variation.description}</p>
                
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Stops:</h3>
                  <ul className="list-disc pl-5">
                    {variation.locations.map((location, idx) => (
                      <li key={idx} className="text-sm text-gray-600">
                        {location.title} by {location.artist}
                      </li>
                    ))}
                  </ul>
                </div>

                {variation.response && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Walking time: {Math.round(variation.estimatedTime || 0)} minutes
                    </p>
                    <p className="text-sm text-gray-600">
                      Distance: {variation.distance}
                    </p>
                  </div>
                )}

                <div className="h-48 bg-gray-100 mb-4 relative">
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={variation.locations[0].coordinates}
                    zoom={13}
                    options={DEFAULT_MAP_OPTIONS}
                  >
                    {!variation.response && variation.locations.map((loc, idx) => (
                      <MarkerF
                        key={idx}
                        position={{ lat: loc.coordinates.lat, lng: loc.coordinates.lng }}
                        label={(idx + 1).toString()}
                      />
                    ))}

                    {variation.response && (
                      <DirectionsRenderer
                        options={{
                          directions: variation.response,
                          suppressMarkers: false
                        }}
                      />
                    )}

                    <DirectionsServiceComponent variation={variation} index={index} />
                  </GoogleMap>

                  {calculatingRoutes.has(index) && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="animate-spin h-6 w-6 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-sm mt-2">
                          {requestCount[index] > 0 
                            ? `Retrying... (Attempt ${requestCount[index] + 1}/3)`
                            : 'Calculating route...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleRouteSelect(index)}
                  disabled={!variation.response || calculatingRoutes.has(index)}
                  className={`
                    w-full py-2 px-4 rounded-lg font-medium
                    ${!variation.response || calculatingRoutes.has(index)
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }
                  `}
                >
                  {calculatingRoutes.has(index)
                    ? requestCount[index] > 0 
                      ? `Retrying... (${requestCount[index]}/3)`
                      : 'Calculating Route...'
                    : variation.response
                    ? 'Select This Tour'
                    : 'Loading...'}
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowHistory(prev => !prev)}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium"
        >
          {showHistory ? 'Hide History' : 'Show History'}
        </button>
        {showHistory && (
          <div className="mt-4">
            <h2 className="text-xl font-bold mb-2">Tour History</h2>
            <ul>
              {tourHistory.map((historyItem, index) => (
                <li key={index} className="mb-2">
                  <button
                    onClick={() => handleHistorySelect(historyItem)}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium"
                  >
                    {historyItem.selectedRoute.name}
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={handleClearHistory}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium"
            >
              Clear History
            </button>
          </div>
        )}
      </div>
    </GoogleMapsWrapper>
  );
}
