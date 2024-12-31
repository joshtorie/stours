import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useJsApiLoader, GoogleMap, DirectionsRenderer } from '@react-google-maps/api';
import { GOOGLE_MAPS_LIBRARIES, DEFAULT_MAP_OPTIONS, DEFAULT_ZOOM } from '../config/maps';

// Define libraries array as a constant outside the component

export default function TourPage() {
  const location = useLocation();
  const { route } = location.state || { route: null };
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  useEffect(() => {
    if (!route) return;

    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer();
    directionsRenderer.setMap(mapRef.current);

    const request = {
      origin: 'start_location', // Replace with actual start location
      destination: 'end_location', // Replace with actual end location
      travelMode: window.google.maps.TravelMode.WALKING,
    };

    directionsService.route(request, (result, status) => {
      if (status === window.google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(result);
      } else {
        console.error('Error fetching directions: ' + status);
      }
    });
  }, [route]);

  if (!route) {
    return <div>No route selected.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Tour: {route.name}</h1>
      <p>Estimated Time: {route.time}</p>
      <h2 className="font-medium">Includes:</h2>
      <ul className="list-disc pl-5">
        {route.details.map((detail, index) => <li key={index}>{detail}</li>)}
      </ul>
      {isLoaded && (
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '400px' }}
          center={route.locations[0].coordinates}
          zoom={DEFAULT_ZOOM}
          options={DEFAULT_MAP_OPTIONS}
        >
          <DirectionsRenderer />
        </GoogleMap>
      )}
      <button className="mt-4 bg-green-500 text-white p-2 rounded">Start Tour</button>
      <button className="mt-2 bg-blue-500 text-white p-2 rounded">Back to Tour Options</button>
    </div>
  );
}
