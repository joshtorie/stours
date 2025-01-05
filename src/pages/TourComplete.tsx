import React from 'react';
import { useLocation } from 'react-router-dom';

const TourComplete = () => {
  const location = useLocation();
  const { stepsWalked, duration, streetArtViewed } = location.state || {};

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Tour Complete!</h2>
      <div className="mb-4">
        <p className="text-lg">You walked <strong>{stepsWalked}</strong> steps.</p>
        <p className="text-lg">Total duration: <strong>{duration} minutes</strong>.</p>
      </div>
      <h3 className="text-xl font-semibold mb-2">Street Art Viewed:</h3>
      <ul className="list-disc pl-5">
        {streetArtViewed && streetArtViewed.length > 0 ? (
          streetArtViewed.map((art, index) => (
            <li key={index} className="mb-1">{art.title} by {art.artist}</li>
          ))
        ) : (
          <li>No street art viewed during this tour.</li>
        )}
      </ul>
    </div>
  );
};

export default TourComplete;
