import React from 'react';
import { useFormSubmit } from '../../hooks/useFormSubmit';

interface CityFormData {
  name: string;
  hero_image: string;
}

export function CityForm() {
  const {
    formData,
    loading,
    error,
    success,
    handleSubmit,
    handleChange
  } = useFormSubmit<CityFormData>({
    table: 'cities',
    initialData: {
      name: '',
      hero_image: ''
    }
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-md">
          City added successfully!
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">City Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Hero Image URL</label>
        <input
          type="url"
          name="hero_image"
          value={formData.hero_image}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
      >
        {loading ? 'Adding City...' : 'Add City'}
      </button>
    </form>
  );
}