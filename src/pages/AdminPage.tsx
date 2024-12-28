import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LoginForm } from '../components/admin/LoginForm';
import { ArtistForm } from '../components/admin/ArtistForm';
import { CityForm } from '../components/admin/CityForm';
import { NeighborhoodForm } from '../components/admin/NeighborhoodForm';
import { StreetArtForm } from '../components/admin/StreetArtForm';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [selectedForm, setSelectedForm] = useState('artist');

  const forms = {
    artist: { title: 'Add Artist', component: ArtistForm },
    city: { title: 'Add City', component: CityForm },
    neighborhood: { title: 'Add Neighborhood', component: NeighborhoodForm },
    streetArt: { title: 'Add Street Art', component: StreetArtForm },
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
            <LoginForm />
          </div>
        </div>
      </div>
    );
  }

  const { title, component: FormComponent } = forms[selectedForm as keyof typeof forms];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Form
            </label>
            <select
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="artist">Add Artist</option>
              <option value="city">Add City</option>
              <option value="neighborhood">Add Neighborhood</option>
              <option value="streetArt">Add Street Art</option>
            </select>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            <FormComponent />
          </div>
        </div>
      </div>
    </div>
  );
}