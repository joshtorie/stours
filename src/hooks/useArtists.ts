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
      try {
        console.log('Starting artists fetch...');
        
        // Public query - no auth required
        const { data, error: queryError } = await supabase
          .from('artists')
          .select('id, name, bio, hero_image')
          .limit(10)
          .returns<Artist[]>();

        if (queryError) {
          console.error('Artists query error:', queryError);
          throw queryError;
        }

        if (!data || data.length === 0) {
          console.log('No artists data found');
          if (isMounted) {
            setArtists([]);
          }
          return;
        }

        console.log('Artists data found:', data.length, 'items');
        
        if (isMounted) {
          const transformedData = data.map(artist => ({
            ...artist,
            name: artist.name || 'Unknown Artist',
            bio: artist.bio || 'No biography available',
            hero_image: artist.hero_image || ''
          }));
          setArtists(transformedData);
        }
      } catch (e) {
        console.error('Error fetching artists:', e);
        if (isMounted) {
          setError(e instanceof Error ? e.message : 'An error occurred');
        }
      } finally {
        if (isMounted) {
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