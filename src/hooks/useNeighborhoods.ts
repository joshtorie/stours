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
    async function fetchNeighborhoods() {
      try {
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
          console.error('Error fetching neighborhoods:', queryError);
          throw queryError;
        }

        console.log('Neighborhoods data:', data);
        setNeighborhoods(data || []);
      } catch (e) {
        console.error('Error in useNeighborhoods:', e);
        setError(e instanceof Error ? e.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchNeighborhoods();
  }, [options.cityId]);

  return { neighborhoods, loading, error };
}