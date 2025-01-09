import React, { useEffect } from 'react';
import { HeroSection } from '../components/ui/HeroSection';
import { Carousel } from '../components/ui/Carousel';
import { Card } from '../components/ui/Card';
import { useNeighborhoods } from '../hooks/useNeighborhoods';
import { useArtists } from '../hooks/useArtists';
import { useStreetArt } from '../hooks/useStreetArt';
import { supabase } from '../lib/supabase';

export default function HomePage() {
  const { neighborhoods, loading: neighborhoodsLoading, error: neighborhoodsError } = useNeighborhoods();
  const { artists, loading: artistsLoading, error: artistsError } = useArtists();
  const { streetArt, loading: streetArtLoading, error: streetArtError } = useStreetArt();

  // Debug effect to check data loading
  useEffect(() => {
    async function checkData() {
      console.log('Checking database access...');

      try {
        // Check street_art table
        const { count: streetArtCount, error: streetArtError } = await supabase
          .from('street_art')
          .select('*', { count: 'exact', head: true });

        console.log('Street Art Count:', { count: streetArtCount, error: streetArtError });

        // Check artists table
        const { count: artistsCount, error: artistsError } = await supabase
          .from('artists')
          .select('*', { count: 'exact', head: true });

        console.log('Artists Count:', { count: artistsCount, error: artistsError });

        // Check neighborhoods table
        const { count: neighborhoodsCount, error: neighborhoodsError } = await supabase
          .from('neighborhoods')
          .select('*', { count: 'exact', head: true });

        console.log('Neighborhoods Count:', { count: neighborhoodsCount, error: neighborhoodsError });

      } catch (e) {
        console.error('Database check error:', e);
      }
    }

    checkData();
  }, []);

  // Debug log for hook data
  useEffect(() => {
    console.log('HomePage Data State:', {
      neighborhoods: { 
        data: neighborhoods, 
        loading: neighborhoodsLoading, 
        error: neighborhoodsError 
      },
      artists: { 
        data: artists, 
        loading: artistsLoading, 
        error: artistsError 
      },
      streetArt: { 
        data: streetArt, 
        loading: streetArtLoading, 
        error: streetArtError 
      }
    });
  }, [
    neighborhoods, neighborhoodsLoading, neighborhoodsError,
    artists, artistsLoading, artistsError,
    streetArt, streetArtLoading, streetArtError
  ]);

  const renderLoading = () => (
    <div className="flex items-center justify-center h-48">
      <p className="text-gray-500">Loading...</p>
    </div>
  );

  const renderError = (error: string) => (
    <div className="flex items-center justify-center h-48">
      <p className="text-red-500">Error: {error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection
        image="https://impgpcljswbjfzdpinjq.supabase.co/storage/v1/object/public/street_art_images/0.22770001286388153.png"
        title="Discover Street Art"
        subtitle="Explore the vibrant street art scene in your city"
        showSearch
      />
      
      <div className="container mx-auto px-4 py-8">
        <Carousel title="Neighborhoods">
          {neighborhoodsLoading ? (
            renderLoading()
          ) : neighborhoodsError ? (
            renderError(neighborhoodsError)
          ) : neighborhoods.length === 0 ? (
            <p className="text-gray-500">No neighborhoods found</p>
          ) : (
            neighborhoods.map(neighborhood => (
              <Card
                key={neighborhood.id}
                title={neighborhood.name}
                image={neighborhood.hero_image}
                link={`/neighborhoods/${neighborhood.id}`}
              />
            ))
          )}
        </Carousel>

        <Carousel title="Artists">
          {artistsLoading ? (
            renderLoading()
          ) : artistsError ? (
            renderError(artistsError)
          ) : artists.length === 0 ? (
            <p className="text-gray-500">No artists found</p>
          ) : (
            artists.map(artist => (
              <Card
                key={artist.id}
                title={artist.name}
                image={artist.hero_image}
                link={`/artists/${artist.id}`}
                subtitle={artist.bio?.substring(0, 100) + '...'}
              />
            ))
          )}
        </Carousel>

        <Carousel title="Street Art">
          {streetArtLoading ? (
            renderLoading()
          ) : streetArtError ? (
            renderError(streetArtError)
          ) : streetArt.length === 0 ? (
            <p className="text-gray-500">No street art found</p>
          ) : (
            streetArt.map(art => (
              <Card
                key={art.id}
                title={art.title || 'Untitled'}
                image={art.image}
                link={`/street-art/${art.id}`}
                subtitle={art.description?.substring(0, 100) + '...' || 'No description available'}
              />
            ))
          )}
        </Carousel>
      </div>
    </div>
  );
}