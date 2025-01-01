import React, { useRef, useState } from 'react';
import { useFormSubmit } from '../../hooks/useFormSubmit';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useARFileUpload } from '../../hooks/useARFileUpload';
import { useArtists } from '../../hooks/useArtists';
import { useNeighborhoods } from '../../hooks/useNeighborhoods';
import { Upload } from 'lucide-react';
import { ModelPreview } from '../ModelPreview';

interface StreetArtFormData {
  title: string;
  description: string;
  image: string;
  artist_id: string;
  neighborhood_id: string;
  latitude: number;
  longitude: number;
  ar_enabled: boolean;
  ar_content?: {
    modelUrl: string;
    imageUrl: string;
    iosQuickLook?: string;
  } | null;
}

export function StreetArtForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelFileRef = useRef<HTMLInputElement>(null);
  const iosModelFileRef = useRef<HTMLInputElement>(null);
  const arPreviewFileRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [arPreviewUrl, setArPreviewUrl] = useState<string | null>(null);
  const { artists, loading: artistsLoading } = useArtists();
  const { neighborhoods, loading: neighborhoodsLoading } = useNeighborhoods();
  const { uploadImage, uploading: imageUploading, uploadError: imageUploadError } = useImageUpload();
  const { uploadARFile, uploading: arUploading, error: arError } = useARFileUpload();
  
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
      longitude: 0,
      ar_enabled: false,
      ar_content: null
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
      {(error || imageUploadError) && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md">
          {error || imageUploadError}
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
      
      {/* AR Support Section */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="ar_enabled"
            name="ar_enabled"
            checked={formData.ar_enabled}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="ar_enabled" className="ml-2 block text-sm text-gray-900">
            Enable AR Experience
          </label>
        </div>
        
        {formData.ar_enabled && (
          <div className="space-y-4 mt-4">
            {/* AR Error Display */}
            {arError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md">
                {arError.message}
              </div>
            )}

            {/* 3D Model Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700">3D Model (GLB/GLTF)</label>
              <input
                ref={modelFileRef}
                type="file"
                accept=".glb,.gltf"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const modelUrl = await uploadARFile(file, 'street_art_models', 'model');
                    if (modelUrl) {
                      handleChange({
                        target: {
                          name: 'ar_content',
                          value: {
                            ...formData.ar_content,
                            modelUrl
                          }
                        }
                      });
                    }
                  }
                }}
                className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <p className="mt-1 text-sm text-gray-500">
                Supported formats: GLB, GLTF. Max size: 50MB
              </p>
            </div>

            {/* iOS Model Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700">iOS Model (USDZ)</label>
              <input
                ref={iosModelFileRef}
                type="file"
                accept=".usdz"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const iosUrl = await uploadARFile(file, 'street_art_models_ios', 'model');
                    if (iosUrl) {
                      handleChange({
                        target: {
                          name: 'ar_content',
                          value: {
                            ...formData.ar_content,
                            iosQuickLook: iosUrl
                          }
                        }
                      });
                    }
                  }
                }}
                className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <p className="mt-1 text-sm text-gray-500">
                Supported format: USDZ. Max size: 50MB
              </p>
            </div>

            {/* AR Preview Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700">AR Preview Image</label>
              <input
                ref={arPreviewFileRef}
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setArPreviewUrl(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                    
                    const imageUrl = await uploadARFile(file, 'street_art_ar_previews', 'preview');
                    if (imageUrl) {
                      handleChange({
                        target: {
                          name: 'ar_content',
                          value: {
                            ...formData.ar_content,
                            imageUrl
                          }
                        }
                      });
                    }
                  }
                }}
                className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <p className="mt-1 text-sm text-gray-500">
                Supported formats: JPG, PNG, WebP. Max size: 50MB
              </p>
              {arPreviewUrl && (
                <img 
                  src={arPreviewUrl} 
                  alt="AR Preview" 
                  className="mt-2 max-h-32 object-contain"
                />
              )}
            </div>

            {/* Model Preview */}
            {formData.ar_content?.modelUrl && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  3D Model Preview
                </label>
                <ModelPreview
                  modelUrl={formData.ar_content.modelUrl}
                  iosUrl={formData.ar_content.iosQuickLook}
                  previewImage={formData.ar_content.imageUrl}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || imageUploading || arUploading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
      >
        {loading || imageUploading || arUploading ? 'Adding Street Art...' : 'Add Street Art'}
      </button>
    </form>
  );
}