import React from 'react';
import { useParams } from 'react-router-dom';
import { HeroSection } from '../components/ui/HeroSection';
import { Carousel } from '../components/ui/Carousel';
import { Card } from '../components/ui/Card';

export default function ArtistPage() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection
        image="https://images.unsplash.com/photo-1571115764595-644a1f56a55c"
        title="Artist Name"
        subtitle="Explore the artist's work"
      />
      
      <div className="container mx-auto px-4 py-8">
        <Carousel title="Street Art">
          <Card
            title="Featured Work"
            image="https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8"
            link={`/street-art/1`}
          />
        </Carousel>

        <Carousel title="Featured Tours">
          <Card
            title="Downtown Art Walk"
            image="https://images.unsplash.com/photo-1517713982677-4b66332f98de"
            link={`/tours/1`}
            subtitle="2 hour walking tour"
          />
        </Carousel>
      </div>
    </div>
  );
}