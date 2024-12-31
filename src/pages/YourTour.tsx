import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleMap, DirectionsRenderer, InfoWindow, MarkerF } from '@react-google-maps/api';
import { DEFAULT_MAP_OPTIONS } from '../config/maps';
import GoogleMapsWrapper from '../components/maps/GoogleMapsWrapper';
import type { TourVariation } from '../types/tour';

interface TourState {
  selectedRoute: TourVariation;
  duration: number;
}

export default function YourTour() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedRoute: tour, duration } = location.state as TourState;
  const [selectedMarker, setSelectedMarker] = React.useState<number | null>(null);

  // Convert serialized response back to DirectionsResult
  const directionsResult = React.useMemo(() => {
    if (!tour?.response) return null;

    return {
      routes: tour.response.routes.map(route => ({
        ...route,
        bounds: new google.maps.LatLngBounds(
          new google.maps.LatLng(route.bounds.south, route.bounds.west),
          new google.maps.LatLng(route.bounds.north, route.bounds.east)
        ),
        legs: route.legs.map(leg => ({
          ...leg,
          steps: leg.steps.map(step => ({
            ...step,
            path: step.path?.map(point => new google.maps.LatLng(point.lat, point.lng)),
          })),
        })),
        overview_path: route.overview_path?.map(
          point => new google.maps.LatLng(point.lat, point.lng)
        ),
      })),
    };
  }, [tour]);

  if (!tour || !tour.response) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">No Tour Selected</h1>
        <p>Please go back and select a tour first.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Back to Tour Options
        </button>
      </div>
    );
  }

  const leg = tour.response.routes[0].legs[0];

  return (
    <GoogleMapsWrapper>
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b">
            <h1 className="text-2xl font-bold">{tour.name}</h1>
            <p className="text-gray-600 mt-1">{tour.description}</p>
          </div>

          <div className="h-[500px] relative">
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={tour.locations[0].coordinates}
              zoom={13}
              options={DEFAULT_MAP_OPTIONS}
            >
              {/* Display markers with thumbnails */}
              {tour.locations.map((location, index) => (
                <MarkerF
                  key={index}
                  position={location.coordinates}
                  label={(index + 1).toString()}
                  onClick={() => setSelectedMarker(index)}
                />
              ))}

              {/* Show info window for selected marker */}
              {selectedMarker !== null && (
                <InfoWindow
                  position={tour.locations[selectedMarker].coordinates}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div className="max-w-xs">
                    <h3 className="font-bold mb-1">
                      {tour.locations[selectedMarker].title}
                    </h3>
                    <p className="text-sm mb-2">by {tour.locations[selectedMarker].artist}</p>
                    {tour.locations[selectedMarker].image && (
                      <img
                        src={tour.locations[selectedMarker].image}
                        alt={tour.locations[selectedMarker].title}
                        className="w-full h-32 object-cover rounded"
                      />
                    )}
                  </div>
                </InfoWindow>
              )}

              {/* Display the route */}
              {directionsResult && (
                <DirectionsRenderer
                  options={{
                    directions: {
                      ...directionsResult,
                      request: {
                        travelMode: google.maps.TravelMode.WALKING,
                        destination: directionsResult.routes[0].legs[0].end_location,
                        origin: directionsResult.routes[0].legs[0].start_location,
                      }
                    },
                    suppressMarkers: false,
                    markerOptions: {
                      label: {
                        text: '',
                        color: 'white',
                        fontWeight: 'bold'
                      }
                    }
                  }}
                />
              )}
            </GoogleMap>
          </div>

          <div className="p-4">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Tour Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Tour Duration</p>
                  <p className="font-medium">{duration} minutes</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Walking Time</p>
                  <p className="font-medium">{tour.estimatedTime} minutes</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Distance</p>
                  <p className="font-medium">{tour.distance}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Street Art Stops</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tour.locations.map((location, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedMarker(index)}
                  >
                    <div className="flex items-start">
                      <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium">{location.title}</h3>
                        <p className="text-sm text-gray-600">by {location.artist}</p>
                      </div>
                    </div>
                    {location.image && (
                      <img
                        src={location.image}
                        alt={location.title}
                        className="w-full h-32 object-cover rounded mt-2"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Walking Directions</h2>
              <div className="space-y-4">
                {leg.steps.map((step, index) => (
                  <div key={index} className="flex items-start">
                    <div className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                      {index + 1}
                    </div>
                    <div>
                      <p dangerouslySetInnerHTML={{ __html: step.instructions }} />
                      <p className="text-sm text-gray-600 mt-1">
                        {step.distance?.text} · {step.duration?.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </GoogleMapsWrapper>
  );
}
