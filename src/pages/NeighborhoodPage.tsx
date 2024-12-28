import React from 'react';
import { useParams } from 'react-router-dom';
import { HeroSection } from '../components/ui/HeroSection';
import { Carousel } from '../components/ui/Carousel';
import { Card } from '../components/ui/Card';

export default function NeighborhoodPage() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection
        image="https://images.unsplash.com/photo-1517713982677-4b66332f98de"
        title="Neighborhood Name"
        subtitle="Discover local street art"
      />
      
      <div className="container mx-auto px-4 py-8">
        <Carousel title="Artists">
          <Card
            title="Featured Artist"
            image="https://images.unsplash.com/photo-1571115764595-644a1f56a55c"
            link={`/artists/1`}
          />
        </Carousel>

        <Carousel title="Street Art">
          <Card
            title="Local Masterpiece"
            image="https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8"
            link={`/street-art/1`}
          />
        </Carousel>
      </div>
    </div>
  );
}