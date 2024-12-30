import React, { useState, useEffect, useMemo } from 'react';
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

// Constants
const MINUTES_PER_STOP = 3;
const SURPRISE_ME = 'surprise_me';

export default function TourCreate() {
  const navigate = useNavigate();
  
  // State for form selections
  const [neighborhood, setNeighborhood] = useState('');
  const [artist, setArtist] = useState('');
  const [streetArt, setStreetArt] = useState('');
  const [tourLength, setTourLength] = useState('');
  
  // State for selected locations
  const [selectedLocations, setSelectedLocations] = useState<SelectedLocation[]>([]);

  // Fetch all data
  const { neighborhoods, loading: loadingNeighborhoods } = useNeighborhoods();
  const { artists: allArtists, loading: loadingArtists } = useArtists();
  const { streetArt: allStreetArt, loading: loadingStreetArt } = useStreetArt({
    neighborhoodId: neighborhood
  });

  // Get unique artists who have street art in the selected neighborhood
  const filteredArtists = useMemo(() => {
    if (!neighborhood) return [];
    
    const artistsWithArt = Array.from(new Set(allStreetArt.map(art => art.artist_id)))
      .map(artistId => allArtists.find(a => a.id === artistId))
      .filter((artist): artist is Artist => artist !== undefined);
    
    return [{ id: SURPRISE_ME, name: 'Surprise Me!' }, ...artistsWithArt];
  }, [neighborhood, allStreetArt, allArtists]);

  // Get street art based on selections
  const filteredStreetArt = useMemo(() => {
    if (!neighborhood) return [];
    
    const artworks = artist === SURPRISE_ME
      ? allStreetArt
      : artist
        ? allStreetArt.filter(art => art.artist_id === artist)
        : [];
    
    return [{ id: SURPRISE_ME, title: 'Surprise Me!', artist_id: '', neighborhood_id: '', latitude: 0, longitude: 0 }, ...artworks];
  }, [neighborhood, artist, allStreetArt]);

  const generateSurpriseLocations = (minutes: number) => {
    const maxStops = Math.floor(minutes / (MINUTES_PER_STOP * 2)); // Half the time for walking
    let availableArt = [...allStreetArt];
    
    // If artist is selected (and not surprise_me), filter by artist
    if (artist && artist !== SURPRISE_ME) {
      availableArt = availableArt.filter(art => art.artist_id === artist);
    }

    // Randomly select street art up to maxStops
    const selectedArt = [];
    while (selectedArt.length < maxStops && availableArt.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableArt.length);
      const artwork = availableArt[randomIndex];
      const artArtist = allArtists.find(a => a.id === artwork.artist_id);
      
      if (artArtist) {
        selectedArt.push({
          id: artwork.id,
          title: artwork.title || 'Untitled',
          artist: artArtist.name,
          coordinates: {
            lat: artwork.latitude,
            lng: artwork.longitude
          }
        });
      }
      
      availableArt.splice(randomIndex, 1);
    }

    return selectedArt;
  };

  const handleArtworkSelect = () => {
    if (!streetArt) return;

    if (streetArt === SURPRISE_ME) {
      // Don't add anything yet, wait for tour length selection
      setSelectedLocations([]);
    } else {
      const artwork = allStreetArt.find(art => art.id === streetArt);
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
    }
    
    // Reset selections for next artwork if not using surprise me
    if (streetArt !== SURPRISE_ME) {
      setNeighborhood('');
      setArtist('');
      setStreetArt('');
    }
  };

  const handleCreateTour = () => {
    if (!tourLength) return;
    
    const minutes = parseInt(tourLength);
    let finalLocations = selectedLocations;

    // If using surprise me, generate locations now
    if (streetArt === SURPRISE_ME || artist === SURPRISE_ME) {
      finalLocations = generateSurpriseLocations(minutes);
    }

    if (finalLocations.length > 0) {
      navigate('/tour-options', {
        state: {
          locations: finalLocations,
          duration: minutes
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
              onChange={(e) => {
                setNeighborhood(e.target.value);
                setArtist('');
                setStreetArt('');
                setSelectedLocations([]);
              }}
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
              onChange={(e) => {
                setArtist(e.target.value);
                setStreetArt('');
                if (e.target.value === SURPRISE_ME) {
                  setSelectedLocations([]);
                }
              }}
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
              onChange={(e) => {
                setStreetArt(e.target.value);
                if (e.target.value === SURPRISE_ME) {
                  setSelectedLocations([]);
                }
              }}
              className="w-full p-2 border rounded"
              disabled={!artist}
            >
              <option value="">Select Street Art</option>
              {filteredStreetArt.map((art) => (
                <option key={art.id} value={art.id}>
                  {art.id === SURPRISE_ME ? art.title : art.title || 'Untitled'}
                </option>
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
            {streetArt === SURPRISE_ME ? 'Continue to Tour Length' : 'Add to Tour'}
          </button>
        </div>

        <div className="flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Selected Locations</h2>
          <div className="flex-grow">
            {streetArt === SURPRISE_ME ? (
              <p className="text-gray-600 italic">
                Your tour will be automatically generated based on your preferences
                and selected tour length.
              </p>
            ) : (
              <ul className="space-y-2">
                {selectedLocations.map((location, index) => (
                  <li key={index} className="border p-3 rounded shadow-sm">
                    <p><span className="font-medium">Title:</span> {location.title}</p>
                    <p><span className="font-medium">Artist:</span> {location.artist}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(selectedLocations.length > 0 || streetArt === SURPRISE_ME) && (
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
                  <option value="30">30 minutes (up to 5 stops)</option>
                  <option value="60">1 hour (up to 10 stops)</option>
                  <option value="90">1.5 hours (up to 15 stops)</option>
                  <option value="120">2 hours (up to 20 stops)</option>
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
