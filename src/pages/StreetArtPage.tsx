import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, User, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase'; // Import the Supabase client

export default function StreetArtPage() {
  const { id } = useParams();
  const [streetArt, setStreetArt] = useState(null);
  const [artist, setArtist] = useState(null);
  const [neighborhood, setNeighborhood] = useState(null);

  useEffect(() => {
    const fetchStreetArt = async () => {
      const { data, error } = await supabase
        .from('street_art')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setStreetArt(data);
        // Fetch artist data
        const artistData = await supabase
          .from('artists')
          .select('*')
          .eq('id', data.artist_id)
          .single();
        setArtist(artistData.data);

        // Fetch neighborhood data
        const neighborhoodData = await supabase
          .from('neighborhoods')
          .select('*')
          .eq('id', data.neighborhood_id)
          .single();
        setNeighborhood(neighborhoodData.data);
      }
    };

    fetchStreetArt();
  }, [id]);

  if (!streetArt || !artist || !neighborhood) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-[70vh] relative">
        <img
          src={streetArt.image} // Use the image from the street art card
          alt={streetArt.title}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 -mt-20 relative z-10 max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">{streetArt.title}</h1> {/* Title of the street art */}
          
          <div className="flex items-center gap-4 mb-6 text-gray-600">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span>{artist.name}</span> {/* Artist name */}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span>{neighborhood.name}</span> {/* Neighborhood name */}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <a href={streetArt.shop_page} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition">
              <ShoppingCart className="w-5 h-5" />
              <span>Shop</span>
            </a>
          </div>
          
          <p className="text-gray-600 mt-4">
            {streetArt.description} {/* Description of the street art */}
          </p>
        </div>
      </div>
    </div>
  );
}