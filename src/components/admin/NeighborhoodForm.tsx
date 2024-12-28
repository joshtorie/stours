import React, { useEffect, useState } from 'react';
import { useFormSubmit } from '../../hooks/useFormSubmit';
import { useCities } from '../../hooks/useCities';

interface NeighborhoodFormData {
  name: string;
  city_id: string;
  hero_image: string;
}

export function NeighborhoodForm() {
  const { cities, loading: citiesLoading } = useCities();
  const {
    formData,
    loading,
    error,
    success,
    handleSubmit,
    handleChange
  } = useFormSubmit<NeighborhoodFormData>({
    table: 'neighborhoods',
    initialData: {
      name: '',
      city_id: '',
      hero_image: ''
    }
  });

  if (citiesLoading) {
    return <div>Loading cities...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-md">
          Neighborhood added successfully!
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Neighborhood Name</label>
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
        <label className="block text-sm font-medium text-gray-700">City</label>
        <select
          name="city_id"
          value={formData.city_id}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Select a city...</option>
          {cities.map(city => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
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
        {loading ? 'Adding Neighborhood...' : 'Add Neighborhood'}
      </button>
    </form>
  );
}