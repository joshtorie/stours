import React, { useState, useCallback } from 'react';
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

  const handleDirectionsCallback = useCallback((
    response: google.maps.DirectionsResult | null,
    status: google.maps.DirectionsStatus,
    index: number
  ) => {
    if (status === 'OK' && response) {
      const route = response.routes[0];
      const leg = route.legs[0];
      
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
      console.error('Directions request failed:', status);
    }
    
    setCalculatingRoutes(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }, []);

  const requestDirections = useCallback((variation: TourVariation, index: number) => {
    setCalculatingRoutes(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  const handleRouteSelect = (index: number) => {
    setSelectedVariation(index);
    navigate('/tour-page', { 
      state: { 
        selectedRoute: tourVariations[index],
        duration
      } 
    });
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
                    <DirectionsService
                      options={{
                        destination: variation.locations[variation.locations.length - 1].coordinates,
                        origin: variation.locations[0].coordinates,
                        waypoints: variation.locations.slice(1, -1).map(loc => ({
                          location: new google.maps.LatLng(loc.coordinates.lat, loc.coordinates.lng),
                          stopover: true
                        })),
                        travelMode: google.maps.TravelMode.WALKING,
                        optimizeWaypoints: true
                      }}
                      callback={(response, status) => handleDirectionsCallback(response, status, index)}
                    />
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
