import React from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, User } from 'lucide-react';

export default function StreetArtPage() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-[70vh] relative">
        <img
          src="https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8"
          alt="Street Art Title"
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 -mt-20 relative z-10 max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Street Art Title</h1>
          
          <div className="flex items-center gap-4 mb-6 text-gray-600">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span>Artist Name</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span>Neighborhood Name</span>
            </div>
          </div>
          
          <p className="text-gray-600">
            Detailed description of the street art piece goes here. This should include
            information about when it was created, the artist's inspiration, and any
            other relevant details.
          </p>
        </div>
      </div>
    </div>
  );
}