import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Neighborhood = Database['public']['Tables']['neighborhoods']['Row'];

export function useNeighborhoods() {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchNeighborhoods() {
      try {
        console.log('Starting neighborhoods fetch...');
        
        // Public query - no auth required
        const { data, error: queryError } = await supabase
          .from('neighborhoods')
          .select('id, name, hero_image, city_id')
          .limit(10)
          .returns<Neighborhood[]>();

        if (queryError) {
          console.error('Neighborhoods query error:', queryError);
          throw queryError;
        }

        if (!data || data.length === 0) {
          console.log('No neighborhoods data found');
          if (isMounted) {
            setNeighborhoods([]);
          }
          return;
        }

        console.log('Neighborhoods data found:', data.length, 'items');
        
        if (isMounted) {
          const transformedData = data.map(neighborhood => ({
            ...neighborhood,
            name: neighborhood.name || 'Unknown Neighborhood',
            hero_image: neighborhood.hero_image || ''
          }));
          setNeighborhoods(transformedData);
        }
      } catch (e) {
        console.error('Error fetching neighborhoods:', e);
        if (isMounted) {
          setError(e instanceof Error ? e.message : 'An error occurred');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchNeighborhoods();

    return () => {
      isMounted = false;
    };
  }, []);

  return { neighborhoods, loading, error };
}