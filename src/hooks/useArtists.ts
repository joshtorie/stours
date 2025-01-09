import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Artist = Database['public']['Tables']['artists']['Row'];

export function useArtists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArtists() {
      try {
        const { data, error: queryError } = await supabase
          .from('artists')
          .select(`
            id,
            name,
            bio,
            hero_image,
            created_at,
            street_art (
              id,
              title
            )
          `)
          .order('name');

        if (queryError) {
          console.error('Error fetching artists:', queryError);
          throw queryError;
        }

        console.log('Artists data:', data);
        setArtists(data || []);
      } catch (e) {
        console.error('Error in useArtists:', e);
        setError(e instanceof Error ? e.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchArtists();
  }, []);

  return { artists, loading, error };
}