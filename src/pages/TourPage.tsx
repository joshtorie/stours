import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleMap, DirectionsRenderer } from '@react-google-maps/api';
import { DEFAULT_MAP_OPTIONS, DEFAULT_ZOOM } from '../config/maps';
import GoogleMapsWrapper from '../components/maps/GoogleMapsWrapper';
import type { TourState } from '../types/tour';

export default function TourPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedRoute: route, duration } = location.state || {};

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  if (!route) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">No Route Selected</h1>
        <p>Please go back and select a tour route first.</p>
        <button 
          onClick={handleBack}
          className="mt-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Back to Tour Options
        </button>
      </div>
    );
  }

  return (
    <GoogleMapsWrapper>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">{route.name}</h1>
        <p className="text-gray-600 mb-4">{route.description}</p>
        
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Tour Details</h2>
          <ul className="list-disc pl-5">
            <li>Duration: {duration} minutes</li>
            <li>Stops: {route.locations.length}</li>
            {route.estimatedTime && <li>Walking Time: {Math.round(route.estimatedTime)} minutes</li>}
            {route.distance && <li>Total Distance: {route.distance}</li>}
          </ul>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Stops</h2>
          <ul className="list-disc pl-5">
            {route.locations.map((location, index) => (
              <li key={index} className="mb-2">
                <span className="font-medium">{index + 1}.</span>{' '}
                {location.title} by {location.artist}
              </li>
            ))}
          </ul>
        </div>

        <div className="h-[400px] w-full mb-4 rounded-lg overflow-hidden shadow-lg">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={route.locations[0].coordinates}
            zoom={DEFAULT_ZOOM}
            options={DEFAULT_MAP_OPTIONS}
          >
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

        <div className="flex gap-4">
          <button 
            className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            Start Tour
          </button>
          <button 
            onClick={handleBack}
            className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Back to Tour Options
          </button>
        </div>
      </div>
    </GoogleMapsWrapper>
  );
}
