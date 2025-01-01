import { useState } from 'react';
import { supabase } from '../lib/supabase';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MODEL_TYPES = [
  'model/gltf-binary',  // .glb
  'model/gltf+json',    // .gltf
  'model/vnd.usdz+zip', // .usdz
];
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

interface ARUploadError {
  field: 'model' | 'iosModel' | 'preview';
  message: string;
}

export function useARFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<ARUploadError | null>(null);

  const validateFile = (file: File, type: 'model' | 'preview'): boolean => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError({
        field: type === 'preview' ? 'preview' : 'model',
        message: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
      });
      return false;
    }

    // Check file type
    const allowedTypes = type === 'preview' ? ALLOWED_IMAGE_TYPES : ALLOWED_MODEL_TYPES;
    if (!allowedTypes.includes(file.type)) {
      setError({
        field: type === 'preview' ? 'preview' : 'model',
        message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      });
      return false;
    }

    return true;
  };

  const uploadARFile = async (
    file: File,
    bucket: string,
    type: 'model' | 'preview'
  ): Promise<string | null> => {
    try {
      setError(null);
      setUploading(true);

      if (!validateFile(file, type)) {
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      setError({
        field: type === 'preview' ? 'preview' : 'model',
        message: 'Error uploading file: ' + (err as Error).message
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadARFile,
    uploading,
    error,
    setError
  };
}
