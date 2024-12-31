import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleMap, DirectionsService, DirectionsRenderer, MarkerF } from '@react-google-maps/api';
import { DEFAULT_MAP_OPTIONS } from '../config/maps';
import GoogleMapsWrapper from '../components/maps/GoogleMapsWrapper';
import type { TourVariation, TourState } from '../types/tour';

interface Location {
  id: string;
  title: string;
  artist: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface TourVariation {
  name: string;
  description: string;
  locations: Location[];
  response?: google.maps.DirectionsResult;
  estimatedTime?: number;
  distance?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '300px'
};

const center = { lat: -33.92543, lng: 18.42322 }; // Cape Town

export default function TourOptions() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tourVariations: initialTourVariations = [], duration = 0 } = location.state as TourState;
  
  const [tourVariations, setTourVariations] = useState<TourVariation[]>(initialTourVariations);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [calculatingRoutes, setCalculatingRoutes] = useState<Set<number>>(new Set());

  const createWaypoint = useCallback((location: Location) => {
    if (window.google) {
      return {
        location: new window.google.maps.LatLng(
          location.coordinates.lat,
          location.coordinates.lng
        ),
        stopover: true
      };
    }
    return null;
  }, []);

  const getDirectionsOptions = useCallback((variation: TourVariation) => {
    if (!window.google) return null;

    const waypoints = variation.locations
      .slice(1, -1)
      .map(createWaypoint)
      .filter((wp): wp is google.maps.DirectionsWaypoint => wp !== null);

    return {
      destination: variation.locations[variation.locations.length - 1].coordinates,
      origin: variation.locations[0].coordinates,
      waypoints,
      travelMode: window.google.maps.TravelMode.WALKING,
      optimizeWaypoints: true
    };
  }, [createWaypoint]);

  const handleDirectionsCallback = useCallback((
    response: google.maps.DirectionsResult | null,
    status: google.maps.DirectionsStatus,
    index: number
  ) => {
    console.log(`[TourOptions] Directions callback for tour ${index}:`, {
      status,
      hasResponse: !!response,
      tourName: tourVariations[index].name
    });

    if (status === 'OK' && response) {
      const route = response.routes[0];
      const leg = route.legs[0];
      
      console.log(`[TourOptions] Processing route for tour ${index}:`, {
        duration: leg.duration?.value,
        distance: leg.distance?.text,
        steps: leg.steps?.length
      });

      setTourVariations(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          response,
          estimatedTime: Math.ceil(leg.duration?.value || 0) / 60,
          distance: leg.distance?.text || ''
        };
        return updated;
      });
    } else {
      console.error(`[TourOptions] Directions request failed for tour ${index}:`, {
        status,
        errorType: status === 'ZERO_RESULTS' ? 'No route found' : 'API Error',
        locations: tourVariations[index].locations.length
      });
    }
    
    setCalculatingRoutes(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });

    // Log current state after update
    console.log('[TourOptions] Current state after callback:', {
      calculatingRoutes: Array.from(calculatingRoutes),
      completedTours: tourVariations.filter(t => t.response).length,
      totalTours: tourVariations.length
    });
  }, [tourVariations, calculatingRoutes]);

  const requestDirections = useCallback((variation: TourVariation, index: number) => {
    console.log(`[TourOptions] Requesting directions for tour ${index}:`, {
      name: variation.name,
      locations: variation.locations.length,
      hasResponse: !!variation.response
    });

    if (!window.google) {
      console.error('[TourOptions] Google Maps not loaded yet');
      return;
    }

    setCalculatingRoutes(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  // Log state changes
  useEffect(() => {
    console.log('[TourOptions] State updated:', {
      tourVariations: tourVariations.map(t => ({
        name: t.name,
        hasResponse: !!t.response,
        locations: t.locations.length
      })),
      calculatingRoutes: Array.from(calculatingRoutes),
      selectedVariation
    });
  }, [tourVariations, calculatingRoutes, selectedVariation]);

  const generateCompactTour = (locations: Location[], maxStops: number) => {
    // Sort locations by proximity to first location
    const sorted = [...locations].sort((a, b) => {
      const distA = calculateDistance(locations[0].coordinates, a.coordinates);
      const distB = calculateDistance(locations[0].coordinates, b.coordinates);
      return distA - distB;
    });
    return sorted.slice(0, maxStops);
  };

  const generateDiverseTour = (locations: Location[], maxStops: number) => {
    // Group by artist and select one from each until maxStops
    const byArtist = locations.reduce((acc, loc) => {
      if (!acc[loc.artist]) acc[loc.artist] = [];
      acc[loc.artist].push(loc);
      return acc;
    }, {} as Record<string, Location[]>);

    const diverse: Location[] = [];
    const artists = Object.keys(byArtist);
    let currentIndex = 0;

    while (diverse.length < maxStops && currentIndex < artists.length) {
      const artist = artists[currentIndex];
      if (byArtist[artist].length > 0) {
        diverse.push(byArtist[artist].shift()!);
      }
      currentIndex = (currentIndex + 1) % artists.length;
    }

    return diverse;
  };

  const generatePopularTour = (locations: Location[], maxStops: number) => {
    // For now, randomly shuffle since we don't have popularity data
    return shuffleArray(locations).slice(0, maxStops);
  };

  // Helper function to calculate distance between two points
  const calculateDistance = (p1: Coordinates, p2: Coordinates) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = p1.lat * Math.PI / 180;
    const φ2 = p2.lat * Math.PI / 180;
    const Δφ = (p2.lat - p1.lat) * Math.PI / 180;
    const Δλ = (p2.lng - p1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Helper function to shuffle an array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleRouteSelect = (index: number) => {
    const selectedRoute = tourVariations[index];
    if (!selectedRoute.response) {
      console.error('Cannot select route without directions response');
      return;
    }
    navigate('/tour', { state: { selectedRoute, duration } });
  };

  if (tourVariations.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">No Tour Options Available</h1>
        <p>Please go back and select your tour preferences first.</p>
      </div>
    );
  }

  return (
    <GoogleMapsWrapper>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Select Your Tour Route</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tourVariations.map((variation, index) => (
            <div 
              key={index} 
              className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-white"
            >
              <div className="p-4 border-b bg-gray-50">
                <h2 className="text-xl font-semibold">{variation.name}</h2>
                <p className="text-gray-600 mt-1">{variation.description}</p>
              </div>
              
              {/* Map preview */}
              <div className="h-64 relative">
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={variation.locations[0].coordinates}
                  zoom={13}
                  options={DEFAULT_MAP_OPTIONS}
                >
                  {/* Add markers for each location */}
                  {variation.locations.map((location, locationIndex) => (
                    <MarkerF
                      key={locationIndex}
                      position={location.coordinates}
                      label={(locationIndex + 1).toString()}
                      title={`${location.title} by ${location.artist}`}
                    />
                  ))}

                  {/* Request directions */}
                  {!variation.response && !calculatingRoutes.has(index) && (
                    <>
                      {window.google && (
                        <DirectionsService
                          options={getDirectionsOptions(variation)!}
                          callback={(response, status) => handleDirectionsCallback(response, status, index)}
                        />
                      )}
                    </>
                  )}

                  {/* Render directions if available */}
                  {variation.response && (
                    <DirectionsRenderer
                      options={{
                        directions: variation.response,
                        suppressMarkers: true // Hide default markers to show our custom ones
                      }}
                    />
                  )}
                </GoogleMap>
              </div>

              <div className="p-4">
                <h3 className="font-medium mb-2">Tour Details:</h3>
                <ul className="space-y-2 mb-4">
                  <li>
                    <span className="font-medium">Stops:</span> {variation.locations.length}
                  </li>
                  {variation.estimatedTime && (
                    <li>
                      <span className="font-medium">Walking Time:</span>{' '}
                      {Math.round(variation.estimatedTime)} minutes
                    </li>
                  )}
                  {variation.distance && (
                    <li>
                      <span className="font-medium">Total Distance:</span> {variation.distance}
                    </li>
                  )}
                </ul>

                <div className="space-y-2">
                  <h3 className="font-medium">Stops:</h3>
                  <ul className="space-y-1">
                    {variation.locations.map((location, idx) => (
                      <li key={idx} className="text-gray-700 text-sm">
                        {idx + 1}. {location.title} by {location.artist}
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  onClick={() => handleRouteSelect(index)}
                  disabled={!variation.response}
                  className={`
                    w-full mt-4 p-3 rounded-lg text-white transition-colors
                    ${!variation.response
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                    }
                  `}
                >
                  {calculatingRoutes.has(index) ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Calculating route...
                    </span>
                  ) : variation.response ? (
                    'Select this Route'
                  ) : (
                    'Loading...'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GoogleMapsWrapper>
  );
}
