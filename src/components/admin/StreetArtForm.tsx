import React, { useRef, useState } from 'react';
import { useFormSubmit } from '../../hooks/useFormSubmit';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useArtists } from '../../hooks/useArtists';
import { useNeighborhoods } from '../../hooks/useNeighborhoods';
import { Upload } from 'lucide-react';

interface StreetArtFormData {
  title: string;
  description: string;
  image: string;
  artist_id: string;
  neighborhood_id: string;
  latitude: number;
  longitude: number;
}

export function StreetArtForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { artists, loading: artistsLoading } = useArtists();
  const { neighborhoods, loading: neighborhoodsLoading } = useNeighborhoods();
  const { uploadImage, uploading, uploadError } = useImageUpload();
  
  const {
    formData,
    loading,
    error,
    success,
    handleSubmit: originalHandleSubmit,
    handleChange
  } = useFormSubmit<StreetArtFormData>({
    table: 'street_art',
    initialData: {
      title: '',
      description: '',
      image: '',
      artist_id: '',
      neighborhood_id: '',
      latitude: 0,
      longitude: 0
    }
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (fileInputRef.current?.files?.[0]) {
      const imageUrl = await uploadImage(fileInputRef.current.files[0], 'street_art_images');
      if (imageUrl) {
        const updatedFormData = { ...formData, image: imageUrl };
        originalHandleSubmit(e, updatedFormData);
      }
    } else {
      originalHandleSubmit(e);
    }
  };

  if (artistsLoading || neighborhoodsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(error || uploadError) && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md">
          {error || uploadError}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-md">
          Street art added successfully!
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Artist</label>
        <select
          name="artist_id"
          value={formData.artist_id}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Select an artist...</option>
          {artists.map(artist => (
            <option key={artist.id} value={artist.id}>
              {artist.name}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Neighborhood</label>
        <select
          name="neighborhood_id"
          value={formData.neighborhood_id}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Select a neighborhood...</option>
          {neighborhoods.map(neighborhood => (
            <option key={neighborhood.id} value={neighborhood.id}>
              {neighborhood.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Latitude</label>
          <input
            type="number"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            required
            step="any"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Longitude</label>
          <input
            type="number"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            required
            step="any"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-h-52 object-contain mb-4"
                />
              ) : (
                <>
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageSelect}
              required
            />
          </label>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading || uploading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
      >
        {loading || uploading ? 'Adding Street Art...' : 'Add Street Art'}
      </button>
    </form>
  );
}