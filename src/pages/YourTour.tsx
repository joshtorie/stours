import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleMap, DirectionsRenderer, InfoWindow, MarkerF } from '@react-google-maps/api';
import { DEFAULT_MAP_OPTIONS } from '../config/maps';
import GoogleMapsWrapper from '../components/maps/GoogleMapsWrapper';
import type { TourVariation } from '../types/tour';
import type { SerializableDirectionsResult } from '../types/maps';
import { toGoogleMapsDirectionsResult } from '../types/maps';
import type { ArtLocation } from '../types/art';

// Google Maps types
type LatLngLiteral = google.maps.LatLngLiteral;
type DirectionsResult = google.maps.DirectionsResult;
type LatLng = google.maps.LatLng;

interface TourState {
  selectedRoute: TourVariation & {
    response: SerializableDirectionsResult;
  };
  duration: number;
}

interface ArtworkDisplay {
  location: ArtLocation;
  index: number;
  distance: number;
}

interface SimplifiedTourState {
  route: any;
  artLocations: any[];
  duration: number;
  timestamp: number;
}

// State declarations
export default function YourTour() {
  const location = useLocation();
  const navigate = useNavigate();

  // Google Maps loading state
  const [isGoogleLoaded, setIsGoogleLoaded] = React.useState(false);

  // Component state
  const [tour, setTour] = React.useState<TourVariation & { response: SerializableDirectionsResult } | null>(null);
  const [duration, setDuration] = React.useState<number>(0);
  const [error, setError] = React.useState<{ message: string } | null>(null);
  const [mapsError, setMapsError] = React.useState<{ message: string } | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [maximizedArtCard, setMaximizedArtCard] = React.useState<number | null>(null);
  const [showARViewer, setShowARViewer] = React.useState(false);
  const [selectedArtwork, setSelectedArtwork] = React.useState<ArtLocation | null>(null);
  const [selectedMarker, setSelectedMarker] = React.useState<ArtLocation | null>(null);
  const [isArtStopsExpanded, setIsArtStopsExpanded] = React.useState(false);

  // Location state
  const [userLocation, setUserLocation] = React.useState<google.maps.LatLng | null>(null);
  const [locationError, setLocationError] = React.useState<{ message: string } | null>(null);

  // Effects
  React.useEffect(() => {
    if (window.google) {
      setIsGoogleLoaded(true);
    }
  }, []);

  // Location watching effect with proper cleanup
  React.useEffect(() => {
    if (!isGoogleLoaded || !window.google?.maps) {
      console.log('Google Maps not loaded yet');
      return;
    }

    let watchId: number;
    let timeoutId: number;
    const cleanup = () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      setLocationError(null);
    };

    if ('geolocation' in navigator) {
      // First try to get a single position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          try {
            if (!window.google?.maps) {
              throw new Error('Google Maps not loaded');
            }
            const newLocation = new window.google.maps.LatLng(
              position.coords.latitude,
              position.coords.longitude
            );
            setUserLocation(newLocation);
            setLocationError(null);

            // After getting initial position, start watching
            watchId = navigator.geolocation.watchPosition(
              (position) => {
                try {
                  if (!window.google?.maps) {
                    throw new Error('Google Maps not loaded');
                  }
                  const newLocation = new window.google.maps.LatLng(
                    position.coords.latitude,
                    position.coords.longitude
                  );
                  setUserLocation(newLocation);
                  setLocationError(null);
                } catch (error) {
                  console.error('Error creating location:', error);
                }
              },
              (error) => {
                console.error('Location watch error:', error);
              },
              {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 30000
              }
            );
          } catch (error) {
            console.error('Error creating initial location:', error);
          }
        },
        (error) => {
          console.error('Initial location error:', error);
          // Only show the error message after a delay
          timeoutId = window.setTimeout(() => {
            if (!userLocation) {
              setLocationError({ 
                message: error.code === 1 
                  ? 'Please enable location access in your browser settings to use navigation.'
                  : 'Unable to get your location. Please try again.'
              });
            }
          }, 10000); // Wait 10 seconds before showing error
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 30000 // Increased timeout to 30 seconds
        }
      );
    } else {
      setLocationError({ message: 'Geolocation is not supported by your browser.' });
    }

    return cleanup;
  }, [isGoogleLoaded]);

  React.useEffect(() => {
    if (!location.state?.selectedRoute) {
      // Try to load from localStorage
      const savedTour = localStorage.getItem('currentTour');
      if (savedTour) {
        try {
          const parsedTour = JSON.parse(savedTour);
          setTour(parsedTour);
          setDuration(parsedTour.duration || 0);
        } catch (e) {
          console.error('Error parsing saved tour:', e);
          setError({ message: 'Failed to load saved tour' });
        }
      } else {
        setError({ message: 'No tour selected' });
      }
    } else {
      const { selectedRoute, duration: tourDuration } = location.state;
      console.log('Setting tour from location state:', selectedRoute);
      setTour(selectedRoute);
      setDuration(tourDuration);
      // Save to localStorage
      localStorage.setItem('currentTour', JSON.stringify({
        ...selectedRoute,
        duration: tourDuration
      }));
    }
  }, [location.state]);

  React.useEffect(() => {
    if (!tour?.response || !isGoogleLoaded) return;
    
    try {
      const state = {
        route: toGoogleMapsDirectionsResult(tour.response),
        artLocations: tour.locations.map(loc => ({
          id: loc.id,
          location: {
            lat: loc.coordinates.lat,
            lng: loc.coordinates.lng
          },
          title: loc.title,
          description: loc.description
        })),
        duration,
        timestamp: Date.now()
      };
      
      localStorage.setItem('currentTour', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving tour state:', error);
    }
  }, [tour, duration, isGoogleLoaded]);

  // Custom hooks
  function useUserLocation(isGoogleLoaded: boolean) {
    const [location, setLocation] = React.useState<LatLng | null>(null);
    const [error, setError] = React.useState<GeolocationPositionError | null>(null);

    React.useEffect(() => {
      if (!navigator.geolocation || !isGoogleLoaded) return;

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = new window.google.maps.LatLng(
            position.coords.latitude,
            position.coords.longitude
          );
          setLocation(newLocation);
          setError(null);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }, [isGoogleLoaded]);

    return { location, error };
  }

  function useNearbyArt(step: google.maps.DirectionsStep | null, locations: ArtLocation[], isGoogleLoaded: boolean): ArtworkDisplay | null {
    return React.useMemo(() => {
      if (!step?.path?.[0] || !isGoogleLoaded || !locations.length) return null;

      const stepLocation = new window.google.maps.LatLng(
        step.path[0].lat(),
        step.path[0].lng()
      );
      let closestArt: ArtworkDisplay | null = null;
      let minDistance = Infinity;

      locations.forEach((loc, index) => {
        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
          { lat: loc.coordinates.lat, lng: loc.coordinates.lng } as LatLngLiteral,
          stepLocation
        );

        if (distance < 50 && distance < minDistance) {
          minDistance = distance;
          closestArt = { location: loc, index, distance };
        }
      });

      return closestArt;
    }, [step, locations, isGoogleLoaded]);
  }

  // Helper functions
  function simplifyDirectionsResult(directionsResult: SerializableDirectionsResult) {
    return {
      routes: directionsResult.routes.map(route => ({
        bounds: {
          southwest: {
            lat: route.bounds.southwest.lat,
            lng: route.bounds.southwest.lng
          },
          northeast: {
            lat: route.bounds.northeast.lat,
            lng: route.bounds.northeast.lng
          }
        },
        legs: route.legs.map(leg => ({
          steps: leg.steps.map(step => ({
            path: step.path?.map(point => ({
              lat: point.lat,
              lng: point.lng
            })),
            start_location: {
              lat: step.start_location.lat,
              lng: step.start_location.lng
            },
            end_location: {
              lat: step.end_location.lat,
              lng: step.end_location.lng
            }
          })),
          start_location: {
            lat: leg.start_location.lat,
            lng: leg.start_location.lng
          },
          end_location: {
            lat: leg.end_location.lat,
            lng: leg.end_location.lng
          },
          via_waypoints: leg.via_waypoints?.map(point => ({
            lat: point.lat,
            lng: point.lng
          })) || []
        })),
        overview_path: route.overview_path?.map(point => ({
          lat: point.lat,
          lng: point.lng
        })),
        warnings: route.warnings || [],
        waypoint_order: route.waypoint_order || [],
        overview_polyline: typeof route.overview_polyline === 'string' 
          ? route.overview_polyline 
          : route.overview_polyline.points || '',
        summary: route.summary || '',
        copyrights: route.copyrights || ''
      })),
      request: directionsResult.request,
      geocoded_waypoints: directionsResult.geocoded_waypoints || []
    };
  }

  function reconstructDirectionsResult(simplifiedRoute: any) {
    return {
      routes: simplifiedRoute.routes.map(route => ({
        bounds: new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(
            route.bounds.southwest.lat,
            route.bounds.southwest.lng
          ),
          new window.google.maps.LatLng(
            route.bounds.northeast.lat,
            route.bounds.northeast.lng
          )
        ),
        legs: route.legs.map(leg => ({
          ...leg,
          steps: leg.steps.map(step => ({
            ...step,
            path: step.path?.map(point => 
              new window.google.maps.LatLng(point.lat, point.lng)
            ),
            start_location: new window.google.maps.LatLng(
              step.start_location.lat,
              step.start_location.lng
            ),
            end_location: new window.google.maps.LatLng(
              step.end_location.lat,
              step.end_location.lng
            )
          })),
          start_location: new window.google.maps.LatLng(
            leg.start_location.lat,
            leg.start_location.lng
          ),
          end_location: new window.google.maps.LatLng(
            leg.end_location.lat,
            leg.end_location.lng
          ),
          via_waypoints: leg.via_waypoints?.map(point => 
            new window.google.maps.LatLng(point.lat, point.lng)
          ) || []
        })),
        overview_path: route.overview_path?.map(point => 
          new window.google.maps.LatLng(point.lat, point.lng)
        ),
        warnings: route.warnings || [],
        waypoint_order: route.waypoint_order || [],
        overview_polyline: typeof route.overview_polyline === 'string' 
          ? route.overview_polyline 
          : route.overview_polyline.points || '',
        summary: route.summary || '',
        copyrights: route.copyrights || ''
      })),
      request: simplifiedRoute.request,
      geocoded_waypoints: simplifiedRoute.geocoded_waypoints || []
    };
  }

  function createLatLng(lat: number, lng: number): google.maps.LatLng {
    return new window.google.maps.LatLng(lat, lng);
  }

  // Convert serializable route to Google Maps objects
  const toGoogleMapsRoute = React.useCallback((route: SerializableRoute): google.maps.DirectionsRoute => {
    const createLatLng = (coords: SerializableLatLng): google.maps.LatLng => 
      new window.google.maps.LatLng(coords.lat, coords.lng);

    const bounds = new window.google.maps.LatLngBounds(
      createLatLng(route.bounds.southwest),
      createLatLng(route.bounds.northeast)
    );

    return {
      bounds,
      legs: route.legs.map(leg => ({
        distance: leg.distance,
        duration: leg.duration,
        end_address: leg.end_address,
        start_address: leg.start_address,
        end_location: createLatLng(leg.end_location),
        start_location: createLatLng(leg.start_location),
        steps: leg.steps.map(step => ({
          distance: step.distance,
          duration: step.duration,
          end_location: createLatLng(step.end_location),
          start_location: createLatLng(step.start_location),
          instructions: step.instructions,
          path: step.path?.map(createLatLng),
          travel_mode: step.travel_mode
        })),
        via_waypoints: leg.via_waypoints?.map(createLatLng) || []
      })),
      overview_path: route.overview_path?.map(createLatLng),
      overview_polyline: typeof route.overview_polyline === 'string' 
        ? { points: route.overview_polyline }
        : route.overview_polyline,
      warnings: route.warnings,
      waypoint_order: route.waypoint_order,
      summary: route.summary,
      copyrights: route.copyrights
    };
  }, []);

  // DirectionsRenderer options with proper conversion
  const directionsRendererOptions = React.useMemo(() => {
    if (!tour?.response) return null;

    try {
      const result = toGoogleMapsDirectionsResult(tour.response);
      console.log('Processed directions result:', result);
      return {
        directions: result,
        suppressMarkers: true,
        preserveViewport: false,
        polylineOptions: {
          strokeColor: '#4285F4',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      };
    } catch (e) {
      console.error('Error processing directions:', e);
      setMapsError({ message: 'Failed to process directions' });
      return null;
    }
  }, [tour?.response]);

  // Component rendering
  if (!tour || !tour.response) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="font-bold mb-2">Error Loading Tour</h2>
          <p>Unable to load tour data. Please try again.</p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-2 text-xs whitespace-pre-wrap">
              {JSON.stringify(tour, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  }

  if (mapsError) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="font-bold mb-2">Google Maps Error</h2>
          <p>{mapsError.message}</p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-2 text-xs whitespace-pre-wrap">
              {JSON.stringify(mapsError, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <h2 className="font-bold mb-2">Location Access Required</h2>
          <p>Please enable location access to use the tour navigation.</p>
          <p className="text-sm mt-2">{locationError.message}</p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-2 text-xs whitespace-pre-wrap">
              {JSON.stringify(locationError, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  }

  const leg = tour.response.routes[0].legs[0];

  // Function to handle art card click
  const handleArtCardClick = (locationIndex: number) => {
    setMaximizedArtCard(maximizedArtCard === locationIndex ? null : locationIndex);
  };

  // Function to handle AR button click
  const handleARClick = (artwork: ArtLocation) => {
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
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeColor: "#FFFFFF",
                    strokeWeight: 2,
                  }}
                />
              )}

              {/* Display the route */}
              {tour.response && directionsRendererOptions && (
                <DirectionsRenderer
                  options={directionsRendererOptions}
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
                  <ArtCard
                    key={index}
                    artLocation={location}
                    isMaximized={maximizedArtCard === index}
                    onClose={() => setMaximizedArtCard(null)}
                    onARClick={handleARClick}
                    onArtCardClick={handleArtCardClick}
                    index={index}
                  />
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
                {tour.response.routes[0].legs.flatMap((leg, legIndex) =>
                  leg.steps.map((step, stepIndex) => {
                    const globalStepIndex = leg.steps.slice(0, stepIndex).length + 
                      tour.response.routes[0].legs.slice(0, legIndex).reduce((acc, l) => acc + l.steps.length, 0);

                    // Find art location that matches this step's end location
                    const artMatch = tour.locations.find((location) => {
                      if (!step.end_location || !window.google?.maps) return false;

                      const stepLatLng = new google.maps.LatLng(
                        step.end_location.lat(),
                        step.end_location.lng()
                      );

                      const locationLatLng = new google.maps.LatLng(
                        location.coordinates.lat,
                        location.coordinates.lng
                      );

                      const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
                        stepLatLng,
                        locationLatLng
                      );

                      return distance < 20; // 20 meters threshold
                    });

                    const artIndex = artMatch ? tour.locations.indexOf(artMatch) : -1;

                    return (
                      <Step
                        key={`${legIndex}-${stepIndex}`}
                        step={step}
                        index={globalStepIndex}
                        isCurrentStep={currentStepIndex === globalStepIndex}
                        artLocation={artMatch}
                        artLocationIndex={artIndex}
                        maximizedArtCard={maximizedArtCard}
                        onArtCardClick={(idx) => {
                          setMaximizedArtCard(idx === maximizedArtCard ? null : idx);
                        }}
                        onARClick={handleARClick}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ... */}
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

// Art card component
function ArtCard({ 
  artLocation, 
  isMaximized, 
  onClose,
  onARClick,
  onArtCardClick,
  index
}: {
  artLocation: ArtLocation;
  isMaximized: boolean;
  onClose: () => void;
  onARClick: (artwork: ArtLocation) => void;
  onArtCardClick: (index: number) => void;
  index: number;
}) {
  if (isMaximized) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-xl">{artLocation.title}</h3>
            <p className="text-gray-600">by {artLocation.artist}</p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {artLocation.imageUrl && (
          <div className="relative">
            <img
              src={artLocation.imageUrl}
              alt={artLocation.title}
              className="w-full h-64 object-cover rounded mb-4"
            />
            <div className="absolute bottom-6 right-2 flex gap-2">
              {artLocation.arEnabled && artLocation.arContent && (
                <button 
                  className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onARClick(artLocation);
                  }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
              )}
              {artLocation.shopUrl && (
                <a
                  href={artLocation.shopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </a>
              )}
              <button 
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  if (navigator.share) {
                    navigator.share({
                      title: artLocation.title,
                      text: `Check out this street art: ${artLocation.title} by ${artLocation.artist}`,
                      url: window.location.href
                    }).catch(console.error);
                  }
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>
        )}
        <p className="text-gray-700 mt-2">{artLocation.description}</p>
      </div>
    );
  }

  return (
    <div 
      className="flex items-start space-x-4 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onArtCardClick(index);
      }}
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
  );
}

// Step component
function Step({
  step,
  index,
  isCurrentStep,
  artLocation,
  artLocationIndex,
  maximizedArtCard,
  onArtCardClick,
  onARClick
}: {
  step: google.maps.DirectionsStep;
  index: number;
  isCurrentStep: boolean;
  artLocation?: ArtLocation;
  artLocationIndex: number;
  maximizedArtCard: number | null;
  onArtCardClick: (index: number) => void;
  onARClick: (artwork: ArtLocation) => void;
}) {
  const isArtStop = artLocation !== undefined && artLocationIndex !== -1;
  const isMaximized = isArtStop && maximizedArtCard === artLocationIndex;

  return (
    <div className={`p-4 rounded-lg ${isCurrentStep ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white'}`}>
      <div className="flex items-start space-x-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isCurrentStep ? 'bg-blue-500 text-white' : 'bg-gray-200'
        }`}>
          {index + 1}
        </div>
        <div className="flex-1">
          <div 
            dangerouslySetInnerHTML={{ __html: step.instructions }} 
            className="prose prose-sm max-w-none"
          />
          {step.distance && step.duration && (
            <div className="text-sm text-gray-600 mt-1">
              {step.distance.text} · {step.duration.text}
            </div>
          )}
          {isArtStop && artLocation && (
            <div className="mt-4">
              <div 
                className={`relative ${isMaximized ? 'w-full' : 'w-48'} cursor-pointer transition-all duration-300`}
                onClick={() => onArtCardClick(artLocationIndex)}
              >
                <img
                  src={artLocation.imageUrl}
                  alt={artLocation.title}
                  className={`w-full h-auto rounded-lg shadow-md transition-all duration-300 ${
                    isMaximized ? 'max-h-96 object-contain' : 'max-h-32 object-cover'
                  }`}
                />
                {isMaximized && (
                  <div className="absolute bottom-4 right-4 flex space-x-2">
                    {artLocation.arContent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onARClick(artLocation);
                        }}
                        className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                      >
                        <span className="sr-only">View in AR</span>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                    {artLocation.shopUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(artLocation.shopUrl, '_blank');
                        }}
                        className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors"
                      >
                        <span className="sr-only">Shop</span>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add share functionality
                      }}
                      className="bg-purple-500 text-white p-2 rounded-full hover:bg-purple-600 transition-colors"
                    >
                      <span className="sr-only">Share</span>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              {isMaximized && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold">{artLocation.title}</h3>
                  <p className="text-gray-600 mt-2">{artLocation.description}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
