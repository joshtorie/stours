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

interface RouteOption {
  name: string;
  waypoints: google.maps.DirectionsWaypoint[];
  origin: google.maps.LatLng;
  destination: google.maps.LatLng;
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
  const { locations = [], duration = 0 } = location.state || {};
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  // Generate different route options
  const generateRouteOptions = useCallback((locations: Location[]): RouteOption[] => {
    if (locations.length < 2) return [];

    // Create waypoints from locations (excluding first and last)
    const createWaypoints = (locs: Location[]) => 
      locs.slice(1, -1).map(loc => ({
        location: new google.maps.LatLng(loc.coordinates.lat, loc.coordinates.lng),
        stopover: true
      }));

    // Create three different route variations
    return [
      {
        name: 'Shortest Route',
        waypoints: createWaypoints(locations),
        origin: new google.maps.LatLng(locations[0].coordinates.lat, locations[0].coordinates.lng),
        destination: new google.maps.LatLng(
          locations[locations.length - 1].coordinates.lat,
          locations[locations.length - 1].coordinates.lng
        ),
        response: null,
        estimatedTime: 0,
        distance: ''
      },
      {
        name: 'Scenic Route',
        waypoints: createWaypoints([...locations].reverse()),
        origin: new google.maps.LatLng(
          locations[locations.length - 1].coordinates.lat,
          locations[locations.length - 1].coordinates.lng
        ),
        destination: new google.maps.LatLng(locations[0].coordinates.lat, locations[0].coordinates.lng),
        response: null,
        estimatedTime: 0,
        distance: ''
      },
      {
        name: 'Alternative Route',
        waypoints: createWaypoints([...locations].sort(() => Math.random() - 0.5)),
        origin: new google.maps.LatLng(locations[0].coordinates.lat, locations[0].coordinates.lng),
        destination: new google.maps.LatLng(
          locations[locations.length - 1].coordinates.lat,
          locations[locations.length - 1].coordinates.lng
        ),
        response: null,
        estimatedTime: 0,
        distance: ''
      }
    ];
  }, []);

  const [routeOptions, setRouteOptions] = useState<RouteOption[]>(() => 
    generateRouteOptions(locations)
  );

  const directionsCallback = useCallback((
    response: google.maps.DirectionsResult | null,
    status: google.maps.DirectionsStatus,
    routeIndex: number
  ) => {
    if (status === 'OK' && response) {
      const route = response.routes[0];
      const leg = route.legs[0];
      
      setRouteOptions(prev => {
        const updated = [...prev];
        updated[routeIndex] = {
          ...updated[routeIndex],
          response,
          estimatedTime: Math.ceil(leg.duration?.value || 0) / 60, // Convert to minutes
          distance: leg.distance?.text || ''
        };
        return updated;
      });
    }
  }, []);

  const handleRouteSelect = (route: RouteOption) => {
    setSelectedRoute(route);
    navigate('/tour-page', { 
      state: { 
        selectedRoute: route,
        locations
      } 
    });
  };

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading maps...</div>;
  }

  if (locations.length === 0) {
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {routeOptions.map((route, index) => (
          <div key={index} className="border p-4 rounded shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-semibold mb-2">{route.name}</h2>
            
            {/* Map preview */}
            <div className="mb-4">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={13}
              >
                {/* Request directions */}
                <DirectionsService
                  options={{
                    destination: route.destination,
                    origin: route.origin,
                    waypoints: route.waypoints,
                    travelMode: google.maps.TravelMode.WALKING,
                    optimizeWaypoints: true
                  }}
                  callback={(response, status) => 
                    directionsCallback(response, status, index)
                  }
                />
                
                {/* Render directions if available */}
                {route.response && (
                  <DirectionsRenderer
                    options={{
                      directions: route.response,
                      suppressMarkers: false
                    }}
                  />
                )}
              </GoogleMap>
            </div>

            {/* Route details */}
            {route.response && (
              <>
                <p className="text-gray-600 mb-2">
                  Estimated Time: {Math.round(route.estimatedTime)} minutes
                </p>
                <p className="text-gray-600 mb-4">Distance: {route.distance}</p>
              </>
            )}

            <h3 className="font-medium mb-2">Stops:</h3>
            <ul className="list-disc pl-5 mb-4">
              {locations.map((location, idx) => (
                <li key={idx} className="text-gray-700">
                  {location.title} by {location.artist}
                </li>
              ))}
            </ul>

            <button 
              onClick={() => handleRouteSelect(route)}
              disabled={!route.response}
              className={`w-full p-2 rounded text-white transition-colors ${
                !route.response
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {route.response ? 'Select this Route' : 'Calculating route...'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
