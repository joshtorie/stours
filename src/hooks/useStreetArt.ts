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
        console.log('Fetching street art with options:', options);

        // First, let's try a simple query to check if we can access the table
        const { data: basicData, error: basicError } = await supabase
          .from('street_art')
          .select('id, title, image, description');

        console.log('Basic query result:', {
          data: basicData,
          error: basicError
        });

        if (basicError) {
          console.error('Basic query error:', basicError);
          throw basicError;
        }

        // Now try with relationships
        let query = supabase
          .from('street_art')
          .select(`
            id,
            title,
            image,
            description,
            created_at,
            artist_id,
            neighborhood_id,
            ar_content,
            artists!artist_id (
              id,
              name,
              bio,
              hero_image
            ),
            neighborhoods!neighborhood_id (
              id,
              name,
              city_id,
              hero_image
            )
          `);

        // Add filters if provided
        if (options.artistId) {
          query = query.eq('artist_id', options.artistId);
        }
        if (options.neighborhoodId) {
          query = query.eq('neighborhood_id', options.neighborhoodId);
        }
        if (options.cityId) {
          query = query.eq('neighborhoods.city_id', options.cityId);
        }

        // Add ordering
        query = query.order('created_at', { ascending: false });

        const { data, error: queryError } = await query;

        console.log('Full query result:', {
          data,
          error: queryError
        });

        if (queryError) {
          console.error('Full query error:', queryError);
          throw queryError;
        }

        if (!data || data.length === 0) {
          console.log('No street art found');
          setStreetArt([]);
          return;
        }

        // Transform data
        const transformedData = data.map(art => ({
          ...art,
          title: art.title || 'Untitled',
          description: art.description || 'No description available',
          image: art.image || '',
          ar_content: art.ar_content ? {
            ...art.ar_content,
            modelUrl: art.ar_content.modelUrl || '',
            imageUrl: art.ar_content.imageUrl || '',
            iosQuickLook: art.ar_content.iosQuickLook || '',
            markerImage: art.ar_content.markerImage || ''
          } : null
        }));

        console.log('Transformed data:', transformedData);
        setStreetArt(transformedData);
      } catch (e) {
        console.error('Error in useStreetArt:', e);
        setError(e instanceof Error ? e.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchStreetArt();
  }, [options.artistId, options.neighborhoodId, options.cityId]);

  return { streetArt, loading, error };
}