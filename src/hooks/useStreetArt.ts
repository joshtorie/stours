import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type StreetArt = Database['public']['Tables']['street_art']['Row'];

interface UseStreetArtOptions {
  artistId?: string;
  neighborhoodId?: string;
  cityId?: string;
}

export function useStreetArt(options: UseStreetArtOptions = {}) {
  const [streetArt, setStreetArt] = useState<StreetArt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchStreetArt() {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        console.log('Starting street art fetch...');

        // Basic query to test connection
        const { data: testData, error: testError } = await supabase
          .from('street_art')
          .select('count');

        if (testError) {
          console.error('Database connection test failed:', testError);
          throw testError;
        }

        console.log('Database connection test successful:', testData);

        // Main query
        const { data, error: queryError } = await supabase
          .from('street_art')
          .select('*');

        if (queryError) {
          console.error('Street art query failed:', queryError);
          throw queryError;
        }

        console.log('Raw street art data:', data);

        if (!data) {
          setStreetArt([]);
          return;
        }

        // Transform and set data
        const transformedData = data.map(art => ({
          ...art,
          title: art.title || 'Untitled',
          description: art.description || 'No description available',
          image: art.image || ''
        }));

        if (isMounted) {
          console.log('Setting street art data:', transformedData);
          setStreetArt(transformedData);
        }
      } catch (e) {
        console.error('Error in useStreetArt:', e);
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

    fetchStreetArt();

    return () => {
      isMounted = false;
    };
  }, [options.artistId, options.neighborhoodId, options.cityId]);

  return { streetArt, loading, error };
}