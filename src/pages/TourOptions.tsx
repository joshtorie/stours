import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleMap, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';

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
  waypoints: Location[];
  estimatedTime: number;
  distance: string;
}

export default function TourOptions() {
  const location = useLocation();
  const navigate = useNavigate();
  const { locations, duration } = location.state || { locations: [], duration: 0 };

  // Generate different route options based on the locations
  const generateRouteOptions = (locations: Location[], duration: number): RouteOption[] => {
    // Here you would implement your route optimization logic
    // For now, we'll create simple variations
    return [
      {
        name: 'Shortest Route',
        waypoints: [...locations],
        estimatedTime: Math.floor(duration * 0.8),
        distance: '2.5 km'
      },
      {
        name: 'Scenic Route',
        waypoints: [...locations].reverse(),
        estimatedTime: duration,
        distance: '3.2 km'
      },
      {
        name: 'Popular Route',
        waypoints: [...locations].sort(() => Math.random() - 0.5),
        estimatedTime: Math.floor(duration * 1.2),
        distance: '3.8 km'
      }
    ];
  };

  const routeOptions = generateRouteOptions(locations, parseInt(duration));

  const handleRouteSelect = (route: RouteOption) => {
    navigate('/tour-page', { 
      state: { 
        selectedRoute: route,
        locations: route.waypoints
      } 
    });
  };

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
            <p className="text-gray-600 mb-2">Estimated Time: {route.estimatedTime} minutes</p>
            <p className="text-gray-600 mb-4">Distance: {route.distance}</p>
            <h3 className="font-medium mb-2">Stops:</h3>
            <ul className="list-disc pl-5 mb-4">
              {route.waypoints.map((location, idx) => (
                <li key={idx} className="text-gray-700">
                  {location.title} by {location.artist}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => handleRouteSelect(route)}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
            >
              Select this Route
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
