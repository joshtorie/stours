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
  const [neighborhood, setNeighborhood] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch neighborhood data
      const { data: neighborhoodData, error: neighborhoodError } = await supabase
        .from('neighborhoods')
        .select('*')
        .eq('id', id)
        .single();

      if (neighborhoodError) {
        console.error(neighborhoodError);
      } else {
        setNeighborhood(neighborhoodData);
      }

      // Fetch street art associated with the neighborhood
      const { data: streetArtData, error: streetArtError } = await supabase
        .from('street_art')
        .select('*')
        .eq('neighborhood_id', id); // Fetch street art by neighborhood_id

      if (streetArtError) {
        console.error(streetArtError);
        return;
      }

      // Extract artist IDs from the street art data
      const artistIds = streetArtData.map(art => art.artist_id); // Assuming artist_id is the correct field

      // Fetch artists using the extracted artist IDs
      const { data: artistsData, error: artistsError } = await supabase
        .from('artists')
        .select('*')
        .in('id', artistIds); // Fetch artists by their IDs

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

  if (!neighborhood) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection
        image={neighborhood.hero_image} // Dynamic hero image
        title={neighborhood.name} // Dynamic title
        subtitle={`Explore the neighborhood`} // Optional subtitle
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