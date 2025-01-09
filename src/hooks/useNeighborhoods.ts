import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Neighborhood = Database['public']['Tables']['neighborhoods']['Row'];

interface UseNeighborhoodsOptions {
  cityId?: string;
}

export function useNeighborhoods(options: UseNeighborhoodsOptions = {}) {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchNeighborhoods() {
      if (!isMounted) return;

      try {
        setLoading(true);
        console.log('Starting neighborhoods fetch...');

        let query = supabase
          .from('neighborhoods')
          .select(`
            id,
            name,
            city_id,
            hero_image,
            created_at,
            cities (
              id,
              name
            )
          `)
          .order('name');

        if (options.cityId) {
          query = query.eq('city_id', options.cityId);
        }

        const { data, error: queryError } = await query;

        if (queryError) {
          console.error('Neighborhoods query failed:', queryError);
          throw queryError;
        }

        console.log('Raw neighborhoods data:', data);

        if (!data) {
          setNeighborhoods([]);
          return;
        }

        // Transform and set data
        const transformedData = data.map(neighborhood => ({
          ...neighborhood,
          name: neighborhood.name || 'Unknown Neighborhood',
          hero_image: neighborhood.hero_image || ''
        }));

        if (isMounted) {
          console.log('Setting neighborhoods data:', transformedData);
          setNeighborhoods(transformedData);
        }
      } catch (e) {
        console.error('Error in useNeighborhoods:', e);
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

    fetchNeighborhoods();

    return () => {
      isMounted = false;
    };
  }, [options.cityId]);

  return { neighborhoods, loading, error };
}