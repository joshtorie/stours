import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { HeartIcon, ShoppingBagIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const ArtCard = ({ art }: { art: any }) => {
  const [isFavorite, setIsFavorite] = React.useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
      {/* Art Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={art.imageUrl || 'https://via.placeholder.com/400x300'}
          alt={art.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Art Info */}
      <div className="p-4">
        <h4 className="text-lg font-semibold mb-2">{art.title}</h4>
        <p className="text-gray-600 mb-2">by {art.artist}</p>
        
        {/* Icons Row */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
          {/* Shop Link */}
          <a
            href={art.shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Buy Art"
          >
            <ShoppingBagIcon className="w-6 h-6" />
          </a>

          {/* Favorite Button */}
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="text-red-500 hover:text-red-700 transition-colors"
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? (
              <HeartSolidIcon className="w-6 h-6" />
            ) : (
              <HeartIcon className="w-6 h-6" />
            )}
          </button>

          {/* Review Button */}
          <button
            onClick={() => {/* TODO: Implement review functionality */}}
            className="text-green-600 hover:text-green-800 transition-colors"
            title="Leave a review"
          >
            <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

const TourComplete = () => {
  const location = useLocation();
  
  console.log('TourComplete received location:', location);

  if (!location.state) {
    console.log('No state found, redirecting to home');
    return <Navigate to="/" />;
  }

  const { stepsWalked, duration, streetArtViewed } = location.state;

  console.log('TourComplete rendering with data:', { stepsWalked, duration, streetArtViewed });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6">Tour Complete!</h2>
      
      {/* Tour Stats */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-gray-600">Steps Walked</p>
            <p className="text-2xl font-bold">{stepsWalked}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Duration</p>
            <p className="text-2xl font-bold">{duration} minutes</p>
          </div>
        </div>
      </div>

      {/* Street Art Section */}
      <h3 className="text-2xl font-semibold mb-4">Street Art Viewed</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {streetArtViewed && streetArtViewed.length > 0 ? (
          streetArtViewed.map((art, index) => (
            <ArtCard key={index} art={art} />
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">
            No street art viewed during this tour.
          </p>
        )}
      </div>
    </div>
  );
};

export default TourComplete;
