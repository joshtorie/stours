import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

interface UserData {
  id: string;
  username: string;
  email: string;
  role: string;
  tours: any[];
  favorited_arts: any[];
  reviews: any[];
  added_street_arts: any[];
}

const UserProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If auth is still loading, wait
    if (authLoading) return;

    // If no user after auth load, redirect to auth
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user data from the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(`
            *,
            tours,
            favorited_arts (
              id,
              title,
              image
            ),
            reviews (
              id,
              content,
              rating
            ),
            added_street_arts (
              id,
              title,
              image
            )
          `)
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          throw userError;
        }

        setUserData(userData);
      } catch (e) {
        console.error('Error in profile page:', e);
        setError(e instanceof Error ? e.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/', { replace: true });
    } catch (e) {
      console.error('Error signing out:', e);
      setError(e instanceof Error ? e.message : 'An error occurred during sign out');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and activity.</p>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sign Out
            </button>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Username</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userData?.username}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userData?.email}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userData?.role}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Activity Sections */}
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {/* Tours */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Your Tours</h3>
            </div>
            <div className="border-t border-gray-200">
              {userData?.tours?.length === 0 ? (
                <p className="p-4 text-gray-500">No tours created yet.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {userData?.tours?.map((tour: any) => (
                    <li key={tour.id} className="p-4">
                      <p className="text-sm font-medium text-gray-900">{tour.name}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Favorited Art */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Favorited Art</h3>
            </div>
            <div className="border-t border-gray-200">
              {userData?.favorited_arts?.length === 0 ? (
                <p className="p-4 text-gray-500">No favorited art yet.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {userData?.favorited_arts?.map((art: any) => (
                    <li key={art.id} className="p-4">
                      <p className="text-sm font-medium text-gray-900">{art.title}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
