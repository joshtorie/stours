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
          // Get the public URL for the image
          const { data: { publicUrl: imageUrl } } = art.image ? 
            supabase.storage.from('street_art_images').getPublicUrl(art.image) : 
            { data: { publicUrl: null } };

          // Get public URLs for AR content
          let arContent = null;
          if (art.ar_content) {
            const { data: { publicUrl: modelUrl } } = supabase.storage
              .from('ar_models')
              .getPublicUrl(art.ar_content.modelUrl);

            const { data: { publicUrl: previewUrl } } = art.ar_content.imageUrl ?
              supabase.storage.from('ar_previews').getPublicUrl(art.ar_content.imageUrl) :
              { data: { publicUrl: null } };

            const { data: { publicUrl: iosUrl } } = art.ar_content.iosQuickLook ?
              supabase.storage.from('ar_models').getPublicUrl(art.ar_content.iosQuickLook) :
              { data: { publicUrl: null } };

            const { data: { publicUrl: markerUrl } } = art.ar_content.markerImage ?
              supabase.storage.from('ar_markers').getPublicUrl(art.ar_content.markerImage) :
              { data: { publicUrl: null } };

            arContent = {
              modelUrl,
              imageUrl: previewUrl,
              iosQuickLook: iosUrl,
              markerImage: markerUrl
            };
          }

          return {
            ...art,
            image: imageUrl,
            ar_content: arContent
          };
        }) || [];

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