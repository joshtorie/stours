import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type StreetArt = Database['public']['Tables']['street_art']['Row'];

export function useStreetArt() {
  const [streetArt, setStreetArt] = useState<StreetArt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchStreetArt() {
      try {
        console.log('Starting street art fetch...');
        
        // Simple query first
        const { data, error: queryError } = await supabase
          .from('street_art')
          .select('id, title, image, description')
          .limit(10);

        console.log('Street art query result:', {
          success: !queryError,
          data,
          error: queryError
        });

        if (queryError) {
          throw queryError;
        }

        if (!data) {
          console.log('No street art data found');
          if (isMounted) {
            setStreetArt([]);
            setError('No data available');
          }
          return;
        }

        console.log('Street art data found:', data.length, 'items');
        
        if (isMounted) {
          setStreetArt(data.map(art => ({
            ...art,
            title: art.title || 'Untitled',
            description: art.description || 'No description available',
            image: art.image || ''
          })));
        }
      } catch (e) {
        console.error('Error fetching street art:', e);
        if (isMounted) {
          setError(e instanceof Error ? e.message : 'An error occurred');
        }
      } finally {
        if (isMounted) {
          console.log('Setting street art loading to false');
          setLoading(false);
        }
      }
    }

    fetchStreetArt();

    return () => {
      isMounted = false;
    };
  }, []);

  return { streetArt, loading, error };
}