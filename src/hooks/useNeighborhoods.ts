import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Neighborhood = Database['public']['Tables']['neighborhoods']['Row'];

export function useNeighborhoods(cityId?: string) {
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
            created_at
          `)
          .order('name');

        if (cityId) {
          query = query.eq('city_id', cityId);
        }

        const { data, error: queryError } = await query;

        if (queryError) throw queryError;
        if (!data) throw new Error('No data returned');

        console.log('Fetched neighborhoods:', data); // Debug log
        setNeighborhoods(data);
      } catch (e) {
        console.error('Error fetching neighborhoods:', e); // Debug log
        setError(e instanceof Error ? e.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchNeighborhoods();
  }, [cityId]);

  return { neighborhoods, loading, error };
}