import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { HeroSection } from '../components/ui/HeroSection';
import { Carousel } from '../components/ui/Carousel';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase'; // Import the Supabase client

export default function NeighborhoodPage() {
  const { id } = useParams();
  const [artists, setArtists] = useState([]);
  const [streetArt, setStreetArt] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch street art associated with the neighborhood
      const { data: streetArtData, error: streetArtError } = await supabase
        .from('street_art')
        .select('*')
        .eq('neighborhood_id', id); // Fetch street art by neighborhood_id

      if (streetArtError) {
        console.error(streetArtError);
        return;
      }

      // Extract street art IDs
      const streetArtIds = streetArtData.map(art => art.id);

      // Fetch artists associated with the street art IDs
      const { data: artistsData, error: artistsError } = await supabase
        .from('artists')
        .select('*')
        .in('street_art_id', streetArtIds); // Fetch artists by street_art_id

      if (artistsError) {
        console.error(artistsError);
      } else {
        setArtists(artistsData);
      }

      // Set street art data to state
      setStreetArt(streetArtData);
    };

    fetchData();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection
        image="https://images.unsplash.com/photo-1517713982677-4b66332f98de"
        title="Neighborhood Name"
        subtitle="Discover local street art"
      />
      
      <div className="container mx-auto px-4 py-8">
        <Carousel title="Artists">
          {artists.map((artist) => (
            <Card
              key={artist.id} // Assuming each artist has a unique id
              title={artist.name} // Replace with the actual field name
              image={artist.hero_image} // Replace with the actual field name
              link={`/artists/${artist.id}`}
            />
          ))}
        </Carousel>

        <Carousel title="Street Art">
          {streetArt.map((art) => (
            <Card
              key={art.id} // Assuming each street art has a unique id
              title={art.title} // Replace with the actual field name
              image={art.image} // Replace with the actual field name
              link={`/street-art/${art.id}`}
            />
          ))}
        </Carousel>
      </div>
    </div>
  );
}