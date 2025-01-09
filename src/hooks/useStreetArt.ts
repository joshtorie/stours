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
        
        // First, check if we can access the table at all
        const { count, error: countError } = await supabase
          .from('street_art')
          .select('*', { count: 'exact', head: true });

        console.log('Count check result:', { count, error: countError });

        if (countError) {
          console.error('Count check failed:', countError);
          throw countError;
        }

        // Now try to fetch the actual data
        const { data, error: queryError } = await supabase
          .from('street_art')
          .select(`
            id,
            title,
            description,
            image,
            created_at,
            artist_id,
            neighborhood_id,
            artists:artist_id (
              id,
              name
            ),
            neighborhoods:neighborhood_id (
              id,
              name
            )
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        console.log('Query result:', {
          success: !queryError,
          data: data?.length,
          error: queryError
        });

        if (queryError) {
          console.error('Query failed:', queryError);
          throw queryError;
        }

        if (!data || data.length === 0) {
          console.log('No street art data found');
          if (isMounted) {
            setStreetArt([]);
          }
          return;
        }

        console.log('Street art data found:', {
          count: data.length,
          firstItem: data[0]
        });
        
        if (isMounted) {
          const transformedData = data.map(art => ({
            ...art,
            title: art.title || 'Untitled',
            description: art.description || 'No description available',
            image: art.image || '',
            artist: art.artists?.name || 'Unknown Artist',
            neighborhood: art.neighborhoods?.name || 'Unknown Location'
          }));

          console.log('Transformed data:', {
            count: transformedData.length,
            firstItem: transformedData[0]
          });

          setStreetArt(transformedData);
        }
      } catch (e) {
        console.error('Error fetching street art:', e);
        if (isMounted) {
          setError(e instanceof Error ? e.message : 'An error occurred');
        }
      } finally {
        if (isMounted) {
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