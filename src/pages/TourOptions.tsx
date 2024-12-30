import React, { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';

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
  response: google.maps.DirectionsResult | null;
  estimatedTime: number;
  distance: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '300px'
};

const center = { lat: -33.92543, lng: 18.42322 }; // Cape Town

export default function TourOptions() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tourVariations = [], duration = 0 } = location.state || {};

  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const handleRouteSelect = (index: number) => {
    setSelectedVariation(index);
    navigate('/tour-page', { 
      state: { 
        selectedRoute: tourVariations[index],
        duration
      } 
    });
  };

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading maps...</div>;
  }

  if (tourVariations.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">No Tour Options Available</h1>
        <p>Please go back and select your tour preferences first.</p>
      </div>
    );
  }

  return (
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
              >
                {/* Request directions */}
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
                  callback={(response, status) => {
                    if (status === 'OK' && response) {
                      const route = response.routes[0];
                      const leg = route.legs[0];
                      
                      // Update the tour variation with the route details
                      tourVariations[index] = {
                        ...variation,
                        response,
                        estimatedTime: Math.ceil(leg.duration?.value || 0) / 60,
                        distance: leg.distance?.text || ''
                      };
                    }
                  }}
                />
                
                {/* Render directions if available */}
                {variation.response && (
                  <DirectionsRenderer
                    options={{
                      directions: variation.response,
                      suppressMarkers: false
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
                {variation.response ? 'Select this Route' : 'Calculating route...'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
