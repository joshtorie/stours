import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNeighborhoods } from '../hooks/useNeighborhoods';
import { useArtists } from '../hooks/useArtists';
import { useStreetArt } from '../hooks/useStreetArt';
import type { Database } from '../types/supabase';
import { SelectionCard } from '../components/ui/SelectionCard';

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Neighborhood Selection */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Select a Neighborhood</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {neighborhoods.map((n) => (
                <SelectionCard
                  key={n.id}
                  id={n.id}
                  title={n.name}
                  imageUrl={n.hero_image}
                  selected={neighborhood === n.id}
                  onClick={(id) => {
                    setNeighborhood(id);
                    setArtist('');
                    setStreetArt('');
                    setSelectedLocations([]);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Artist Selection */}
          {neighborhood && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Select an Artist</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectionCard
                  id={SURPRISE_ME}
                  title="Surprise Me!"
                  subtitle="Let us pick artists for you"
                  imageUrl="/surprise-artist.jpg"
                  selected={artist === SURPRISE_ME}
                  onClick={(id) => {
                    setArtist(id);
                    setStreetArt('');
                    setSelectedLocations([]);
                  }}
                />
                {filteredArtists
                  .filter(a => a.id !== SURPRISE_ME)
                  .map((a) => (
                    <SelectionCard
                      key={a.id}
                      id={a.id}
                      title={a.name}
                      imageUrl={a.hero_image}
                      selected={artist === a.id}
                      onClick={(id) => {
                        setArtist(id);
                        setStreetArt('');
                      }}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Street Art Selection */}
          {artist && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Select Street Art</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectionCard
                  id={SURPRISE_ME}
                  title="Surprise Me!"
                  subtitle="Let us pick street art for you"
                  imageUrl="/surprise-art.jpg"
                  selected={streetArt === SURPRISE_ME}
                  onClick={(id) => {
                    setStreetArt(id);
                    setSelectedLocations([]);
                  }}
                />
                {filteredStreetArt
                  .filter(art => art.id !== SURPRISE_ME)
                  .map((art) => (
                    <SelectionCard
                      key={art.id}
                      id={art.id}
                      title={art.title || 'Untitled'}
                      imageUrl={art.image}
                      subtitle={allArtists.find(a => a.id === art.artist_id)?.name}
                      selected={streetArt === art.id}
                      onClick={(id) => setStreetArt(id)}
                    />
                  ))}
              </div>
              <button 
                onClick={handleArtworkSelect}
                disabled={!streetArt}
                className={`
                  mt-6 w-full p-3 rounded-lg text-white transition-colors
                  ${!streetArt
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                  }
                `}
              >
                {streetArt === SURPRISE_ME ? 'Continue to Tour Length' : 'Add to Tour'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column - Selected Items & Tour Length */}
        <div className="bg-gray-50 p-6 rounded-lg space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Tour</h2>
            {streetArt === SURPRISE_ME ? (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-600 italic">
                  Your tour will be automatically generated based on your preferences
                  and selected tour length.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedLocations.map((location, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-medium">{location.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">by {location.artist}</p>
                  </div>
                ))}
                {selectedLocations.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No locations selected yet
                  </p>
                )}
              </div>
            )}
          </div>

          {(selectedLocations.length > 0 || streetArt === SURPRISE_ME) && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tour Length
                </label>
                <select 
                  value={tourLength} 
                  onChange={(e) => setTourLength(e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white"
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
                className={`
                  w-full p-3 rounded-lg text-white transition-colors
                  ${!tourLength
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600'
                  }
                `}
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
