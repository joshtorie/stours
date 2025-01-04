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
    async function fetchStreetArt() {
      try {
        let query = supabase
          .from('street_art')
          .select(`
            *,
            neighborhoods!inner(
              id,
              city_id
            ),
            artists!inner(
              id,
              name
            )
          `)
          .order('created_at', { ascending: false });

        if (options.artistId) {
          query = query.eq('artist_id', options.artistId);
        }
        if (options.neighborhoodId) {
          query = query.eq('neighborhood_id', options.neighborhoodId);
        }
        if (options.cityId) {
          query = query.eq('neighborhoods.city_id', options.cityId);
        }

        const { data, error: queryError } = await query;

        if (queryError) throw queryError;
        
        // Transform data to include full image URLs
        const transformedData = data?.map(art => {
          // Just use the image URL directly as it's already stored as a public URL
          return {
            ...art,
            image: art.image,
            ar_content: art.ar_content ? {
              ...art.ar_content,
              modelUrl: art.ar_content.modelUrl,
              imageUrl: art.ar_content.imageUrl,
              iosQuickLook: art.ar_content.iosQuickLook,
              markerImage: art.ar_content.markerImage
            } : null
          };
        }) || [];

        console.log('Transformed street art data:', transformedData);
        setStreetArt(transformedData);
      } catch (e) {
        console.error('Error fetching street art:', e);
        setError(e instanceof Error ? e.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchStreetArt();
  }, [options.artistId, options.neighborhoodId, options.cityId]);

  return { streetArt, loading, error };
}