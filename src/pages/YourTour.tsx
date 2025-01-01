import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleMap, DirectionsRenderer, InfoWindow, MarkerF } from '@react-google-maps/api';
import { DEFAULT_MAP_OPTIONS } from '../config/maps';
import GoogleMapsWrapper from '../components/maps/GoogleMapsWrapper';
import ARViewer from '../components/ARViewer';
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
  const [userLocation, setUserLocation] = React.useState<google.maps.LatLng | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0);
  const [isPaused, setIsPaused] = React.useState<boolean>(false);
  const [isArtStopsExpanded, setIsArtStopsExpanded] = React.useState(false);
  const [maximizedArtCard, setMaximizedArtCard] = React.useState<number | null>(null);
  const [showARViewer, setShowARViewer] = React.useState(false);
  const [selectedArtwork, setSelectedArtwork] = React.useState<any | null>(null);

  // Convert serialized response back to DirectionsResult
  const directionsResult = React.useMemo(() => {
    if (!tour?.response || !window.google) return null;

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
  }, [tour, window.google]);

  // Watch user's location
  React.useEffect(() => {
    if (!navigator.geolocation || !window.google || !tour?.response) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = new google.maps.LatLng(
          position.coords.latitude,
          position.coords.longitude
        );
        setUserLocation(newLocation);

        // Update current step based on user location if tour is not paused
        if (!isPaused) {
          const leg = tour.response.routes[0].legs[0];
          // Find the closest step to the user's current location
          const closestStepIndex = leg.steps.findIndex((step, index) => {
            const stepPath = step.path?.[0];
            if (!stepPath) return false;
            const distance = google.maps.geometry.spherical.computeDistanceBetween(
              new google.maps.LatLng(stepPath.lat, stepPath.lng),
              newLocation
            );
            return distance < 50; // Within 50 meters
          });
          if (closestStepIndex !== -1) {
            setCurrentStepIndex(closestStepIndex);
          }
        }
      },
      (error) => {
        console.error('Error getting location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [tour, isPaused, window.google]);

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

  // Function to handle art card click
  const handleArtCardClick = (locationIndex: number) => {
    setMaximizedArtCard(maximizedArtCard === locationIndex ? null : locationIndex);
  };

  // Function to handle AR button click
  const handleARClick = (artwork: any) => {
    if (artwork.arContent) {
      setSelectedArtwork(artwork);
      setShowARViewer(true);
    }
  };

  return (
    <GoogleMapsWrapper>
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b">
            <h1 className="text-2xl font-bold">{tour.name}</h1>
            <p className="text-gray-600 mt-1">{tour.description}</p>
          </div>

          {/* Tour Details */}
          <div className="p-4 border-b">
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
          </div>

          {/* Map */}
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
                    {tour.locations[selectedMarker].imageUrl && (
                      <img
                        src={tour.locations[selectedMarker].imageUrl}
                        alt={tour.locations[selectedMarker].title}
                        className="w-full h-32 object-cover rounded"
                      />
                    )}
                  </div>
                </InfoWindow>
              )}

              {/* Display user location */}
              {userLocation && (
                <MarkerF
                  position={userLocation}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeColor: "#FFFFFF",
                    strokeWeight: 2,
                  }}
                />
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

          {/* Street Art Stops - Collapsible */}
          <div className="p-4 border-b">
            <button 
              onClick={() => setIsArtStopsExpanded(!isArtStopsExpanded)}
              className="w-full flex justify-between items-center text-xl font-semibold mb-4"
            >
              <span>Street Art Stops</span>
              <svg 
                className={`w-6 h-6 transform transition-transform ${isArtStopsExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isArtStopsExpanded && (
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
                    {location.imageUrl && (
                      <img
                        src={location.imageUrl}
                        alt={location.title}
                        className="w-full h-32 object-cover rounded mt-2"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Walking Directions */}
          <div className="p-4">
            <div>
              <h2 className="text-xl font-semibold mb-4">Walking Directions</h2>
              <div className="flex justify-end mb-4 space-x-4">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className={`px-4 py-2 rounded-lg ${
                    isPaused ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'
                  } text-white`}
                >
                  {isPaused ? 'Resume Tour' : 'Pause Tour'}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to complete this tour?')) {
                      navigate('/');
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Complete Tour
                </button>
              </div>
              <div className="space-y-4">
                {leg.steps.map((step, index) => {
                  const isArtStop = window.google && tour.locations.some(loc => 
                    google.maps.geometry.spherical.computeDistanceBetween(
                      new google.maps.LatLng(loc.coordinates.lat, loc.coordinates.lng),
                      step.path?.[0] || new google.maps.LatLng(0, 0)
                    ) < 50
                  );
                  
                  const artLocation = window.google && tour.locations.find(loc => 
                    google.maps.geometry.spherical.computeDistanceBetween(
                      new google.maps.LatLng(loc.coordinates.lat, loc.coordinates.lng),
                      step.path?.[0] || new google.maps.LatLng(0, 0)
                    ) < 50
                  );

                  const artLocationIndex = artLocation ? tour.locations.findIndex(loc => loc.title === artLocation.title) : -1;

                  return (
                    <React.Fragment key={index}>
                      {isArtStop && <div className="border-t-2 border-blue-500 my-4" />}
                      <div className={`flex items-start p-4 rounded-lg ${
                        currentStepIndex === index ? 'bg-blue-50 border-2 border-blue-500' : ''
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-3 ${
                          currentStepIndex === index ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p dangerouslySetInnerHTML={{ __html: step.instructions }} />
                          <p className="text-sm text-gray-600 mt-1">
                            {step.distance?.text} · {step.duration?.text}
                          </p>
                        </div>
                      </div>
                      {isArtStop && artLocation && (
                        <div className="ml-9 mt-2 mb-4">
                          {maximizedArtCard === artLocationIndex ? (
                            <div className="bg-white rounded-lg shadow-lg p-4">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="font-bold text-xl">{artLocation.title}</h3>
                                  <p className="text-gray-600">by {artLocation.artist}</p>
                                </div>
                                <button 
                                  onClick={() => setMaximizedArtCard(null)}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                              {artLocation.imageUrl && (
                                <img
                                  src={artLocation.imageUrl}
                                  alt={artLocation.title}
                                  className="w-full h-64 object-cover rounded mb-4"
                                />
                              )}
                              {/* Action buttons */}
                              <div className="flex flex-wrap gap-4 mt-4">
                                {artLocation.arEnabled && artLocation.arContent && (
                                  <button 
                                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 flex items-center space-x-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleARClick(artLocation);
                                    }}
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>View in AR</span>
                                  </button>
                                )}
                                {artLocation.shopUrl && (
                                  <a
                                    href={artLocation.shopUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center space-x-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    <span>Shop</span>
                                  </a>
                                )}
                                <button 
                                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center space-x-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Add share logic here
                                    console.log('Sharing artwork');
                                  }}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                  </svg>
                                  <span>Share</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="flex items-start space-x-4 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => handleArtCardClick(artLocationIndex)}
                            >
                              {artLocation.imageUrl && (
                                <img
                                  src={artLocation.imageUrl}
                                  alt={artLocation.title}
                                  className="w-24 h-24 object-cover rounded"
                                />
                              )}
                              <div>
                                <h3 className="font-bold text-lg">{artLocation.title}</h3>
                                <p className="text-gray-600">by {artLocation.artist}</p>
                                <p className="text-sm text-blue-500 mt-1">Click to view details</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {isArtStop && <div className="border-b-2 border-blue-500 my-4" />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showARViewer && selectedArtwork?.arContent && (
        <ARViewer
          artwork={selectedArtwork.arContent}
          onClose={() => {
            setShowARViewer(false);
            setSelectedArtwork(null);
          }}
        />
      )}
    </GoogleMapsWrapper>
  );
}
