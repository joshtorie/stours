import React from 'react';
import { HeroSection } from '../components/ui/HeroSection';
import { Carousel } from '../components/ui/Carousel';
import { Card } from '../components/ui/Card';
import { useNeighborhoods } from '../hooks/useNeighborhoods';
import { useArtists } from '../hooks/useArtists';
import { useStreetArt } from '../hooks/useStreetArt';

export default function HomePage() {
  const { neighborhoods, loading: neighborhoodsLoading } = useNeighborhoods();
  const { artists, loading: artistsLoading } = useArtists();
  const { streetArt, loading: streetArtLoading } = useStreetArt();

  const renderLoading = () => (
    <div className="flex items-center justify-center h-48">
      <p className="text-gray-500">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection
        image="https://images.unsplash.com/photo-1532589229401-a5cad447e9ab"
        title="Discover Street Art"
        subtitle="Explore the vibrant street art scene in your city"
        showSearch
      />
      
      <div className="container mx-auto px-4 py-8">
        <Carousel title="Neighborhoods">
          {neighborhoodsLoading ? (
            renderLoading()
          ) : (
            neighborhoods.map(neighborhood => {
              console.log('Neighborhood Hero Image URL:', neighborhood.hero_image);
              return (
                <Card
                  key={neighborhood.id}
                  title={neighborhood.name}
                  image={neighborhood.hero_image}
                  link={`/neighborhoods/${neighborhood.id}`}
                />
              );
            })
          )}
        </Carousel>

        <Carousel title="Artists">
          {artistsLoading ? (
            renderLoading()
          ) : (
            artists.map(artist => (
              <Card
                key={artist.id}
                title={artist.name}
                image={artist.hero_image}
                link={`/artists/${artist.id}`}
                subtitle={artist.bio.substring(0, 100) + '...'}
              />
            ))
          )}
        </Carousel>

        <Carousel title="Street Art">
          {streetArtLoading ? (
            renderLoading()
          ) : (
            streetArt.map(art => (
              <Card
                key={art.id}
                title={art.title}
                image={art.image}
                link={`/street-art/${art.id}`}
                subtitle={art.description.substring(0, 100) + '...'}
              />
            ))
          )}
        </Carousel>
      </div>
    </div>
  );
}