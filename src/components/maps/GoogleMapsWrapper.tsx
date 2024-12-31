import { LoadScript } from '@react-google-maps/api';
import { GOOGLE_MAPS_LIBRARIES } from '../../config/maps';
import React, { useState, useEffect } from 'react';

interface GoogleMapsWrapperProps {
  children: React.ReactNode;
}

// Create a memoized wrapper component
const GoogleMapsWrapper = React.memo(({ children }: GoogleMapsWrapperProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('[GoogleMapsWrapper] Current state:', {
      isLoaded,
      hasLoadError: !!loadError,
      hasGoogleObject: !!window.google,
      apiKey: !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    });
  }, [isLoaded, loadError]);

  const handleLoad = () => {
    console.log('[GoogleMapsWrapper] Script loaded successfully');
    setIsLoaded(true);
  };

  const handleError = (error: Error) => {
    console.error('[GoogleMapsWrapper] Error loading Google Maps:', error);
    setLoadError(error);
    setIsLoaded(false);
  };

  if (loadError) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <h3 className="font-bold mb-2">Error Loading Google Maps</h3>
        <p>{loadError.message}</p>
        <p className="text-sm mt-2">Check console for more details</p>
      </div>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      libraries={GOOGLE_MAPS_LIBRARIES}
      onLoad={handleLoad}
      onError={handleError}
    >
      {isLoaded ? (
        children
      ) : (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Loading Google Maps...</p>
          </div>
        </div>
      )}
    </LoadScript>
  );
});

GoogleMapsWrapper.displayName = 'GoogleMapsWrapper';

export default GoogleMapsWrapper;
