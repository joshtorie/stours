import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Artist = Database['public']['Tables']['artists']['Row'];

export function useArtists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchArtists() {
      if (!isMounted) return;

      try {
        setLoading(true);
        console.log('Starting artists fetch...');

        // Basic query
        const { data, error: queryError } = await supabase
          .from('artists')
          .select('*');

        if (queryError) {
          console.error('Artists query failed:', queryError);
          throw queryError;
        }

        console.log('Raw artists data:', data);

        if (!data) {
          setArtists([]);
          return;
        }

        // Transform and set data
        const transformedData = data.map(artist => ({
          ...artist,
          name: artist.name || 'Unknown Artist',
          bio: artist.bio || 'No biography available',
          hero_image: artist.hero_image || ''
        }));

        if (isMounted) {
          console.log('Setting artists data:', transformedData);
          setArtists(transformedData);
        }
      } catch (e) {
        console.error('Error in useArtists:', e);
        if (isMounted) {
          setError(e instanceof Error ? e.message : 'An error occurred');
        }
      } finally {
        if (isMounted) {
          console.log('Setting loading to false');
          setLoading(false);
        }
      }
    }

    fetchArtists();

    return () => {
      isMounted = false;
    };
  }, []);

  return { artists, loading, error };
}