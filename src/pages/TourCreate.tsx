import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNeighborhoods } from '../hooks/useNeighborhoods';
import { useArtists } from '../hooks/useArtists';
import { useStreetArt } from '../hooks/useStreetArt';
import type { Database } from '../types/supabase';

type StreetArt = Database['public']['Tables']['street_art']['Row'];
type Artist = Database['public']['Tables']['artists']['Row'];
type Neighborhood = Database['public']['Tables']['neighborhoods']['Row'];

interface SelectedLocation {
  id: string;
  title: string;
  artist: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export default function TourCreate() {
  const navigate = useNavigate();
  
  // State for form selections
  const [neighborhood, setNeighborhood] = useState('');
  const [artist, setArtist] = useState('');
  const [streetArt, setStreetArt] = useState('');
  const [tourLength, setTourLength] = useState('');
  
  // State for selected locations
  const [selectedLocations, setSelectedLocations] = useState<SelectedLocation[]>([]);

  // Fetch data using hooks
  const { neighborhoods, loading: loadingNeighborhoods } = useNeighborhoods();
  const { artists: allArtists, loading: loadingArtists } = useArtists();
  const { streetArt: streetArtworks, loading: loadingStreetArt } = useStreetArt({
    artistId: artist,
    neighborhoodId: neighborhood
  });

  // Filter artists by neighborhood
  const filteredArtists = neighborhood
    ? allArtists.filter(a => a.neighborhood_id === neighborhood)
    : [];

  const handleArtworkSelect = () => {
    if (streetArt) {
      const artwork = streetArtworks.find(art => art.id === streetArt);
      const selectedArtist = allArtists.find(a => a.id === artwork?.artist_id);
      
      if (artwork && selectedArtist) {
        setSelectedLocations([...selectedLocations, {
          id: artwork.id,
          title: artwork.title || 'Untitled',
          artist: selectedArtist.name,
          coordinates: {
            lat: artwork.latitude,
            lng: artwork.longitude
          }
        }]);
      }
      
      // Reset selections for next artwork
      setNeighborhood('');
      setArtist('');
      setStreetArt('');
    }
  };

  const handleCreateTour = () => {
    if (selectedLocations.length > 0 && tourLength) {
      // Pass the selected locations and tour length to the tour options page
      navigate('/tour-options', {
        state: {
          locations: selectedLocations,
          duration: parseInt(tourLength)
        }
      });
    }
  };

  if (loadingNeighborhoods || loadingArtists || loadingStreetArt) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Build Your Tour</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select a Neighborhood
            </label>
            <select 
              value={neighborhood} 
              onChange={(e) => setNeighborhood(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Neighborhood</option>
              {neighborhoods.map((n) => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select an Artist
            </label>
            <select 
              value={artist} 
              onChange={(e) => setArtist(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={!neighborhood}
            >
              <option value="">Select Artist</option>
              {filteredArtists.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Street Art
            </label>
            <select 
              value={streetArt} 
              onChange={(e) => setStreetArt(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={!artist}
            >
              <option value="">Select Street Art</option>
              {streetArtworks.map((art) => (
                <option key={art.id} value={art.id}>{art.title || 'Untitled'}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleArtworkSelect}
            disabled={!streetArt}
            className={`mt-4 p-2 rounded text-white transition-colors ${
              !streetArt
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            Add to Tour
          </button>
        </div>

        <div className="flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Selected Locations</h2>
          <div className="flex-grow">
            <ul className="space-y-2">
              {selectedLocations.map((location, index) => (
                <li key={index} className="border p-3 rounded shadow-sm">
                  <p><span className="font-medium">Title:</span> {location.title}</p>
                  <p><span className="font-medium">Artist:</span> {location.artist}</p>
                </li>
              ))}
            </ul>
          </div>

          {selectedLocations.length > 0 && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tour Length
                </label>
                <select 
                  value={tourLength} 
                  onChange={(e) => setTourLength(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Tour Length</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>

              <button 
                onClick={handleCreateTour}
                disabled={!tourLength}
                className={`w-full p-2 rounded text-white transition-colors ${
                  !tourLength
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                Create My Tour
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
