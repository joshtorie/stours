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

  const handleArtistSelect = (artistId: string) => {
    setSelectedArtists(prev => {
      const next = new Set(prev);
      if (artistId === SURPRISE_ME) {
        next.clear();
        next.add(SURPRISE_ME);
        // Auto-populate random artists
        const availableArtists = allArtists.filter(artist => artist.id !== SURPRISE_ME);
        const numToSelect = Math.floor(Math.random() * 3) + 2; // Select 2-4 random artists
        const shuffled = shuffleArray([...availableArtists]);
        shuffled.slice(0, numToSelect).forEach(artist => {
          next.add(artist.id);
        });
      } else {
        // If surprise me was selected, remove it
        if (prev.has(SURPRISE_ME)) {
          next.clear();
        }
        if (next.has(artistId)) {
          next.delete(artistId);
        } else {
          next.add(artistId);
        }
      }
      return next;
    });
    setSelectedStreetArt(new Set());
    setSelectedLocations([]);
  };

  const handleStreetArtSelect = (artId: string) => {
    setSelectedStreetArt(prev => {
      const next = new Set(prev);
      if (artId === SURPRISE_ME) {
        next.clear();
        next.add(SURPRISE_ME);
        // Auto-populate random street art
        const availableArt = allStreetArt.filter(art => art.id !== SURPRISE_ME);
        const numToSelect = Math.floor(Math.random() * 4) + 3; // Select 3-6 random pieces
        const shuffled = shuffleArray([...availableArt]);
        shuffled.slice(0, numToSelect).forEach(art => {
          next.add(art.id);
        });
      } else {
        // If surprise me was selected, remove it
        if (prev.has(SURPRISE_ME)) {
          next.clear();
        }
        if (next.has(artId)) {
          next.delete(artId);
        } else {
          next.add(artId);
        }
      }
      return next;
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

  const generateCompactTour = (locations: SelectedLocation[], maxStops: number): SelectedLocation[] => {
    if (locations.length <= maxStops) return locations;

    // Start with a random location
    const startLocation = locations[Math.floor(Math.random() * locations.length)];
    const result: SelectedLocation[] = [startLocation];
    const remaining = locations.filter(loc => loc.id !== startLocation.id);

    // Keep adding the closest location until we reach maxStops
    while (result.length < maxStops && remaining.length > 0) {
      const current = result[result.length - 1];
      let closest = remaining[0];
      let minDistance = calculateDistance(
        current.coordinates,
        closest.coordinates
      );

      // Find the closest remaining location
      for (let i = 1; i < remaining.length; i++) {
        const distance = calculateDistance(
          current.coordinates,
          remaining[i].coordinates
        );
        if (distance < minDistance) {
          minDistance = distance;
          closest = remaining[i];
        }
      }

      result.push(closest);
      const index = remaining.findIndex(loc => loc.id === closest.id);
      remaining.splice(index, 1);
    }

    return result;
  };

  const generateDiverseTour = (locations: SelectedLocation[], maxStops: number): SelectedLocation[] => {
    if (locations.length <= maxStops) return locations;

    // Group locations by artist
    const byArtist = locations.reduce((acc, loc) => {
      if (!acc[loc.artist]) {
        acc[loc.artist] = [];
      }
      acc[loc.artist].push(loc);
      return acc;
    }, {} as Record<string, SelectedLocation[]>);

    const result: SelectedLocation[] = [];
    const artists = Object.keys(byArtist);

    // First, ensure we have at least one piece from each artist
    for (const artist of artists) {
      if (result.length < maxStops) {
        // Randomly select one piece from this artist
        const artistWorks = byArtist[artist];
        const randomIndex = Math.floor(Math.random() * artistWorks.length);
        result.push(artistWorks[randomIndex]);
        artistWorks.splice(randomIndex, 1);
      }
    }

    // If we still have room, add random pieces while maintaining diversity
    while (result.length < maxStops) {
      // Find artists who still have works
      const availableArtists = artists.filter(artist => byArtist[artist].length > 0);
      if (availableArtists.length === 0) break;

      // Randomly select an artist and add one of their works
      const randomArtist = availableArtists[Math.floor(Math.random() * availableArtists.length)];
      const artistWorks = byArtist[randomArtist];
      const randomIndex = Math.floor(Math.random() * artistWorks.length);
      result.push(artistWorks[randomIndex]);
      artistWorks.splice(randomIndex, 1);
    }

    return result;
  };

  const generatePopularTour = (locations: SelectedLocation[], maxStops: number): SelectedLocation[] => {
    if (locations.length <= maxStops) return locations;

    // For now, we'll simulate popularity using a weighted random selection
    // In the future, this could use real popularity data
    const withPopularity = locations.map(loc => ({
      ...loc,
      // Simulate popularity score (0-1)
      popularity: Math.random()
    }));

    // Sort by "popularity"
    withPopularity.sort((a, b) => b.popularity - a.popularity);

    // Take the top maxStops locations, but shuffle them slightly to add variety
    const topLocations = withPopularity.slice(0, maxStops);
    return shuffleArray(topLocations);
  };

  const calculateDistance = (coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = coord1.lat * Math.PI / 180;
    const φ2 = coord2.lat * Math.PI / 180;
    const Δφ = (coord2.lat - coord1.lat) * Math.PI / 180;
    const Δλ = (coord2.lng - coord1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const handleCreateTour = () => {
    if (!tourLength) return;
    setNotificationMessage(null);
    
    const minutes = parseInt(tourLength);
    const maxStops = calculateMaxStops(minutes);

    // Generate locations based on selections
    let locations: SelectedLocation[] = [];
    
    if (selectedArtists.has(SURPRISE_ME) && selectedStreetArt.has(SURPRISE_ME)) {
      // Both are surprise me - generate completely random selections
      locations = generateRandomLocations(maxStops * 2); // Generate more than needed for variety
    } else if (selectedArtists.has(SURPRISE_ME)) {
      // Random artists, specific street art
      const selectedArt = Array.from(selectedStreetArt).filter(id => id !== SURPRISE_ME);
      locations = generateLocationsWithRandomArtists(selectedArt, maxStops * 2);
    } else if (selectedStreetArt.has(SURPRISE_ME)) {
      // Specific artists, random street art
      const selectedArtistIds = Array.from(selectedArtists).filter(id => id !== SURPRISE_ME);
      locations = generateLocationsWithRandomArt(selectedArtistIds, maxStops * 2);
    } else {
      // Specific selections for both
      locations = selectedLocations;
    }

    // Generate three different variations of the tour
    const tourVariations = [
      {
        name: 'Compact Tour',
        description: 'Minimizes walking distance between locations',
        locations: generateCompactTour([...locations], maxStops)
      },
      {
        name: 'Diverse Tour',
        description: 'Features work from different artists',
        locations: generateDiverseTour([...locations], maxStops)
      },
      {
        name: 'Popular Tour',
        description: 'Based on ratings and popularity',
        locations: generatePopularTour([...locations], maxStops)
      }
    ];

    // Verify that the tours are different
    console.log('[TourCreate] Generated tour variations:', 
      tourVariations.map(tour => ({
        name: tour.name,
        locations: tour.locations.map(loc => loc.id)
      }))
    );

    if (tourVariations[0].locations.length > 0) {
      navigate('/tour-options', {
        state: {
          tourVariations,
          duration: minutes
        }
      });
    }
  };

  const generateRandomLocations = (maxStops: number): SelectedLocation[] => {
    // Get all available street art for the selected neighborhood
    const availableArt = allStreetArt.filter(art => art.neighborhood_id === neighborhood);
    
    // Randomly select up to maxStops pieces
    return shuffleArray(availableArt)
      .slice(0, maxStops)
      .map(art => ({
        id: art.id,
        title: art.title,
        artist: art.artist_name,
        coordinates: {
          lat: art.latitude,
          lng: art.longitude
        }
      }));
  };

  const generateLocationsWithRandomArtists = (selectedArtIds: string[], maxStops: number): SelectedLocation[] => {
    // Get all available street art for selected pieces
    const selectedArt = allStreetArt.filter(art => 
      art.neighborhood_id === neighborhood && 
      selectedArtIds.includes(art.id)
    );
    
    return shuffleArray(selectedArt)
      .slice(0, maxStops)
      .map(art => ({
        id: art.id,
        title: art.title,
        artist: art.artist_name,
        coordinates: {
          lat: art.latitude,
          lng: art.longitude
        }
      }));
  };

  const generateLocationsWithRandomArt = (artistIds: string[], maxStops: number): SelectedLocation[] => {
    // Get all available street art by selected artists
    const availableArt = allStreetArt.filter(art => 
      art.neighborhood_id === neighborhood && 
      artistIds.includes(art.artist_id)
    );
    
    return shuffleArray(availableArt)
      .slice(0, maxStops)
      .map(art => ({
        id: art.id,
        title: art.title,
        artist: art.artist_name,
        coordinates: {
          lat: art.latitude,
          lng: art.longitude
        }
      }));
  };

  // Helper function to shuffle an array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const calculateMaxStops = (minutes: number) => {
    return Math.floor(minutes / (MINUTES_PER_STOP * 2)); // Half the time for walking
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
                  onClick={handleArtistSelect}
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
                      onClick={handleArtistSelect}
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
                  onClick={handleStreetArtSelect}
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
                      onClick={handleStreetArtSelect}
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
