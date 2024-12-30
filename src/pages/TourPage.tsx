import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function TourPage() {
  const location = useLocation();
  const { route } = location.state || { route: null };
  const mapRef = useRef(null);

  useEffect(() => {
    if (!route) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: -34.397, lng: 150.644 }, // Default center, update based on route
      zoom: 12,
    });

    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

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
      <div ref={mapRef} style={{ height: '400px', width: '100%' }} className="mt-4"></div>
      <button className="mt-4 bg-green-500 text-white p-2 rounded">Start Tour</button>
      <button className="mt-2 bg-blue-500 text-white p-2 rounded">Back to Tour Options</button>
    </div>
  );
}
