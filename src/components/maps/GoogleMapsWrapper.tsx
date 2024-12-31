import { LoadScript } from '@react-google-maps/api';
import { GOOGLE_MAPS_LIBRARIES } from '../../config/maps';
import React from 'react';

interface GoogleMapsWrapperProps {
  children: React.ReactNode;
}

// Create a memoized wrapper component
const GoogleMapsWrapper = React.memo(({ children }: GoogleMapsWrapperProps) => {
  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      libraries={GOOGLE_MAPS_LIBRARIES}
    >
      {children}
    </LoadScript>
  );
});

GoogleMapsWrapper.displayName = 'GoogleMapsWrapper';

export default GoogleMapsWrapper;
