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

interface TourVariation {
  name: string;
  description: string;
  locations: SelectedLocation[];
}

// Constants
const MINUTES_PER_STOP = 3;
const SURPRISE_ME = 'surprise_me';

export default function TourCreate() {
  const navigate = useNavigate();
  
  // State for form selections
  const [neighborhood, setNeighborhood] = useState('');
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set());
  const [selectedStreetArt, setSelectedStreetArt] = useState<Set<string>>(new Set());
  const [tourLength, setTourLength] = useState('');
  
  // State for selected locations
  const [selectedLocations, setSelectedLocations] = useState<SelectedLocation[]>([]);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

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
    
    return [{ id: SURPRISE_ME, name: 'Surprise Me!', hero_image: 'https://impgpcljswbjfzdpinjq.supabase.co/storage/v1/object/public/street_art_images/surprise%20me.jpeg' }, ...artistsWithArt];
  }, [neighborhood, allStreetArt, allArtists]);

  // Get street art based on selections
  const filteredStreetArt = useMemo(() => {
    if (!neighborhood) return [];
    
    const artworks = selectedArtists.has(SURPRISE_ME)
      ? allStreetArt
      : selectedArtists.size > 0
        ? allStreetArt.filter(art => selectedArtists.has(art.artist_id))
        : [];
    
    return [{ id: SURPRISE_ME, title: 'Surprise Me!', artist_id: '', neighborhood_id: '', image: 'https://impgpcljswbjfzdpinjq.supabase.co/storage/v1/object/public/street_art_images/surprise%20me.jpeg', latitude: 0, longitude: 0 }, ...artworks];
  }, [neighborhood, selectedArtists, allStreetArt]);

  const handleArtistToggle = (artistId: string) => {
    setSelectedArtists(prev => {
      const newSelection = new Set(prev);
      if (artistId === SURPRISE_ME) {
        // If selecting surprise me, clear other selections
        if (!newSelection.has(SURPRISE_ME)) {
          newSelection.clear();
          newSelection.add(SURPRISE_ME);
        } else {
          newSelection.delete(SURPRISE_ME);
        }
      } else {
        // If selecting specific artist, remove surprise me
        newSelection.delete(SURPRISE_ME);
        if (newSelection.has(artistId)) {
          newSelection.delete(artistId);
        } else {
          newSelection.add(artistId);
        }
      }
      return newSelection;
    });
    setSelectedStreetArt(new Set());
    setSelectedLocations([]);
  };

  const handleStreetArtToggle = (artId: string) => {
    setSelectedStreetArt(prev => {
      const newSelection = new Set(prev);
      if (artId === SURPRISE_ME) {
        // If selecting surprise me, clear other selections
        if (!newSelection.has(SURPRISE_ME)) {
          newSelection.clear();
          newSelection.add(SURPRISE_ME);
        } else {
          newSelection.delete(SURPRISE_ME);
        }
      } else {
        // If selecting specific art, remove surprise me
        newSelection.delete(SURPRISE_ME);
        if (newSelection.has(artId)) {
          newSelection.delete(artId);
        } else {
          newSelection.add(artId);
        }
      }
      return newSelection;
    });
  };

  const handleArtworkSelect = () => {
    if (selectedStreetArt.size === 0) return;

    if (selectedStreetArt.has(SURPRISE_ME)) {
      // Don't add anything yet, wait for tour length selection
      setSelectedLocations([]);
    } else {
      const newLocations = Array.from(selectedStreetArt)
        .map(artId => {
          const artwork = allStreetArt.find(art => art.id === artId);
          const selectedArtist = allArtists.find(a => a.id === artwork?.artist_id);
          
          if (artwork && selectedArtist) {
            return {
              id: artwork.id,
              title: artwork.title || 'Untitled',
              artist: selectedArtist.name,
              coordinates: {
                lat: artwork.latitude,
                lng: artwork.longitude
              }
            };
          }
          return null;
        })
        .filter((loc): loc is SelectedLocation => loc !== null);

      setSelectedLocations(newLocations);
    }
    
    // Reset selections for next artwork if not using surprise me
    if (!selectedStreetArt.has(SURPRISE_ME)) {
      setNeighborhood('');
      setSelectedArtists(new Set());
      setSelectedStreetArt(new Set());
    }
  };

  const generateSurpriseLocations = (minutes: number) => {
    const maxStops = Math.floor(minutes / (MINUTES_PER_STOP * 2));
    let availableArt = [...allStreetArt];
    
    // If specific artists are selected (and not surprise_me), filter by artists
    if (!selectedArtists.has(SURPRISE_ME) && selectedArtists.size > 0) {
      availableArt = availableArt.filter(art => selectedArtists.has(art.artist_id));
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

  const calculateMaxStops = (minutes: number) => {
    return Math.floor(minutes / (MINUTES_PER_STOP * 2)); // Half the time for walking
  };

  const calculateDistance = (loc1: SelectedLocation, loc2: SelectedLocation) => {
    const R = 6371; // Earth's radius in km
    const lat1 = loc1.coordinates.lat * Math.PI / 180;
    const lat2 = loc2.coordinates.lat * Math.PI / 180;
    const dLat = (loc2.coordinates.lat - loc1.coordinates.lat) * Math.PI / 180;
    const dLon = (loc2.coordinates.lng - loc1.coordinates.lng) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const generateCompactTour = (locations: SelectedLocation[], maxStops: number): SelectedLocation[] => {
    if (locations.length <= maxStops) return locations;
    
    const result: SelectedLocation[] = [locations[0]]; // Start with first location
    
    while (result.length < maxStops) {
      let shortestDistance = Infinity;
      let nextLocation: SelectedLocation | null = null;
      const lastLocation = result[result.length - 1];
      
      for (const location of locations) {
        if (result.includes(location)) continue;
        
        const distance = calculateDistance(lastLocation, location);
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nextLocation = location;
        }
      }
      
      if (nextLocation) {
        result.push(nextLocation);
      }
    }
    
    return result;
  };

  const generateDiverseTour = (locations: SelectedLocation[], maxStops: number): SelectedLocation[] => {
    if (locations.length <= maxStops) return locations;
    
    // Group locations by artist
    const artistGroups = locations.reduce((groups, location) => {
      if (!groups[location.artist]) {
        groups[location.artist] = [];
      }
      groups[location.artist].push(location);
      return groups;
    }, {} as Record<string, SelectedLocation[]>);
    
    const result: SelectedLocation[] = [];
    const artists = Object.keys(artistGroups);
    
    // Take one piece from each artist until we reach maxStops
    while (result.length < maxStops && Object.keys(artistGroups).length > 0) {
      for (const artist of artists) {
        if (result.length >= maxStops) break;
        if (artistGroups[artist]?.length) {
          result.push(artistGroups[artist].shift()!);
        }
      }
    }
    
    return result;
  };

  const generatePopularTour = (locations: SelectedLocation[], maxStops: number): SelectedLocation[] => {
    // In the future, this would use actual popularity/rating data
    // For now, randomly select locations as a fallback
    return [...locations]
      .sort(() => Math.random() - 0.5)
      .slice(0, maxStops);
  };

  const generateTourVariations = (
    locations: SelectedLocation[],
    maxStops: number
  ): TourVariation[] => {
    if (locations.length > maxStops) {
      setNotificationMessage(
        `We noticed you selected ${locations.length} locations for a ${tourLength}-minute tour. ` +
        `We've created three different tour options that will fit within your time frame, ` +
        `each optimized for a different experience.`
      );
    }

    return [
      {
        name: 'Compact Tour',
        description: 'Minimizes walking distance between locations',
        locations: generateCompactTour(locations, maxStops)
      },
      {
        name: 'Diverse Tour',
        description: 'Features work from different artists',
        locations: generateDiverseTour(locations, maxStops)
      },
      {
        name: 'Popular Tour',
        description: 'Based on ratings and popularity',
        locations: generatePopularTour(locations, maxStops)
      }
    ];
  };

  const handleCreateTour = () => {
    if (!tourLength) return;
    setNotificationMessage(null);
    
    const minutes = parseInt(tourLength);
    const maxStops = calculateMaxStops(minutes);
    let tourVariations: TourVariation[];

    if (selectedStreetArt.has(SURPRISE_ME) || selectedArtists.has(SURPRISE_ME)) {
      // For surprise me, generate three different random variations
      tourVariations = Array(3).fill(null).map((_, index) => ({
        name: `Option ${index + 1}`,
        description: 'A curated selection of street art',
        locations: generateSurpriseLocations(minutes)
      }));
    } else {
      // Generate three distinct variations based on different criteria
      tourVariations = generateTourVariations(selectedLocations, maxStops);
    }

    if (tourVariations[0].locations.length > 0) {
      navigate('/tour-options', {
        state: {
          tourVariations,
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
      {notificationMessage && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">{notificationMessage}</p>
        </div>
      )}
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
                    setSelectedArtists(new Set());
                    setSelectedStreetArt(new Set());
                    setSelectedLocations([]);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Artist Selection */}
          {neighborhood && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Select Artists
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Select multiple)
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectionCard
                  id={SURPRISE_ME}
                  title="Surprise Me!"
                  subtitle="Let us pick artists for you"
                  imageUrl="https://impgpcljswbjfzdpinjq.supabase.co/storage/v1/object/public/street_art_images/surprise%20me.jpeg"
                  selected={selectedArtists.has(SURPRISE_ME)}
                  onClick={handleArtistToggle}
                />
                {filteredArtists
                  .filter(a => a.id !== SURPRISE_ME)
                  .map((a) => (
                    <SelectionCard
                      key={a.id}
                      id={a.id}
                      title={a.name}
                      imageUrl={a.hero_image}
                      selected={selectedArtists.has(a.id)}
                      onClick={handleArtistToggle}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Street Art Selection */}
          {selectedArtists.size > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Select Street Art
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Select multiple)
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectionCard
                  id={SURPRISE_ME}
                  title="Surprise Me!"
                  subtitle="Let us pick street art for you"
                  imageUrl="https://impgpcljswbjfzdpinjq.supabase.co/storage/v1/object/public/street_art_images/surprise%20me.jpeg"
                  selected={selectedStreetArt.has(SURPRISE_ME)}
                  onClick={handleStreetArtToggle}
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
                      selected={selectedStreetArt.has(art.id)}
                      onClick={handleStreetArtToggle}
                    />
                  ))}
              </div>
              <button 
                onClick={handleArtworkSelect}
                disabled={selectedStreetArt.size === 0}
                className={`
                  mt-6 w-full p-3 rounded-lg text-white transition-colors
                  ${selectedStreetArt.size === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                  }
                `}
              >
                {selectedStreetArt.has(SURPRISE_ME) ? 'Continue to Tour Length' : 'Add to Tour'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column - Selected Items & Tour Length */}
        <div className="bg-gray-50 p-6 rounded-lg space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Tour</h2>
            {selectedStreetArt.has(SURPRISE_ME) ? (
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

          {(selectedLocations.length > 0 || selectedStreetArt.has(SURPRISE_ME)) && (
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
