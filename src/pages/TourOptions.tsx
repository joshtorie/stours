import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleMap, DirectionsService, DirectionsRenderer, MarkerF } from '@react-google-maps/api';
import { DEFAULT_MAP_OPTIONS } from '../config/maps';
import GoogleMapsWrapper from '../components/maps/GoogleMapsWrapper';
import type { TourVariation, TourState } from '../types/tour';

export default function TourOptions() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tourVariations: initialTourVariations = [], duration = 0 } = location.state as TourState;
  
  const [tourVariations, setTourVariations] = useState<TourVariation[]>(initialTourVariations);
  const [calculatingRoutes, setCalculatingRoutes] = useState<Set<number>>(new Set());
  const [selectedTour, setSelectedTour] = useState<number | null>(null);

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
      }
    });
  }, []);

  const handleDirectionsCallback = useCallback((
    response: google.maps.DirectionsResult | null,
    status: google.maps.DirectionsStatus,
    index: number
  ) => {
    console.log(`[TourOptions] Directions callback for tour ${index}:`, { status, hasResponse: !!response });

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
      console.error(`[TourOptions] Directions request failed for tour ${index}:`, status);
    }
    
    setCalculatingRoutes(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }, []);

  const handleRouteSelect = (index: number) => {
    if (!tourVariations[index].response) {
      console.error('Cannot select route without directions response');
      return;
    }
    navigate('/tour', { state: { selectedRoute: tourVariations[index], duration } });
  };

  return (
    <GoogleMapsWrapper>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Choose Your Tour</h1>
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
                        position={loc.coordinates}
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
                  </GoogleMap>

                  {/* Request directions if not already calculated */}
                  {!variation.response && !calculatingRoutes.has(index) && window.google && (
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

                  {calculatingRoutes.has(index) && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="animate-spin h-6 w-6 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-sm mt-2">Calculating route...</p>
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
                    ? 'Calculating Route...'
                    : variation.response
                    ? 'Select This Tour'
                    : 'Loading...'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GoogleMapsWrapper>
  );
}
