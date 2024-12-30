import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNeighborhoods, getArtistsByNeighborhood, getStreetArtByArtist } from '../lib/api';
import type { Neighborhood, Artist, StreetArt } from '../lib/api';

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
  
  // State for selections
  const [neighborhood, setNeighborhood] = useState('');
  const [artist, setArtist] = useState('');
  const [streetArt, setStreetArt] = useState('');
  const [tourLength, setTourLength] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<SelectedLocation[]>([]);
  const [streetArts, setStreetArts] = useState<StreetArt[]>([]);

  // State for data
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const tourLengths = ['30 minutes', '1 hour', '1.5 hours', '2 hours'];

  // Fetch neighborhoods on component mount
  useEffect(() => {
    const fetchNeighborhoods = async () => {
      const data = await getNeighborhoods();
      setNeighborhoods(data);
    };
    fetchNeighborhoods();
  }, []);

  // Fetch artists when neighborhood is selected
  useEffect(() => {
    const fetchArtists = async () => {
      if (neighborhood) {
        const data = await getArtistsByNeighborhood(neighborhood);
        setArtists(data);
        setArtist(''); // Reset artist selection
        setStreetArt(''); // Reset street art selection
      } else {
        setArtists([]);
      }
    };
    fetchArtists();
  }, [neighborhood]);

  // Fetch street art when artist is selected
  useEffect(() => {
    const fetchStreetArt = async () => {
      if (artist && neighborhood) {
        const data = await getStreetArtByArtist(artist, neighborhood);
        setStreetArts(data);
        setStreetArt(''); // Reset street art selection
      } else {
        setStreetArts([]);
      }
    };
    fetchStreetArt();
  }, [artist, neighborhood]);

  const handleArtworkSelect = () => {
    if (streetArt && artist) {
      const artwork = streetArts.find(s => s.id === streetArt);
      if (artwork) {
        setSelectedLocations([...selectedLocations, {
          id: artwork.id,
          title: artwork.title,
          artist: artwork.artist,
          coordinates: artwork.coordinates
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
          duration: tourLength
        }
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Build Your Tour</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select a Neighborhood</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Select an Artist</label>
            <select 
              value={artist} 
              onChange={(e) => setArtist(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={!neighborhood}
            >
              <option value="">Select Artist</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Street Art</label>
            <select 
              value={streetArt} 
              onChange={(e) => setStreetArt(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={!artist}
            >
              <option value="">Select Street Art</option>
              {streetArts.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
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
                  {tourLengths.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
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
