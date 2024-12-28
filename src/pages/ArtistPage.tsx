import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { HeroSection } from '../components/ui/HeroSection';
import { Carousel } from '../components/ui/Carousel';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase'; // Import the Supabase client

export default function ArtistPage() {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);
  const [streetArt, setStreetArt] = useState([]);

  useEffect(() => {
    const fetchArtist = async () => {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setArtist(data);
        fetchStreetArt(data.id); // Fetch street art using the artist's ID
      }
    };

    const fetchStreetArt = async (artistId) => {
      const { data, error } = await supabase
        .from('street_art')
        .select('*')
        .eq('artist_id', artistId); // Fetch street art by artist_id

      if (error) {
        console.error(error);
      } else {
        setStreetArt(data);
      }
    };

    fetchArtist();
  }, [id]);

  if (!artist) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection
        image={artist.hero_image} // Dynamic hero image
        title={artist.name} // Dynamic title
        subtitle={`Explore the artist's work`} // Optional subtitle
      />
      
      <div className="container mx-auto px-4 py-8">
        <Carousel title="Street Art">
          {streetArt.map((art) => (
            <Card
              key={art.id} // Assuming each street art has a unique id
              title={art.title} // Replace with the actual field name
              image={art.image} // Replace with the actual field name
              link={`/street-art/${art.id}`} // Link to the street art page
            />
          ))}
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