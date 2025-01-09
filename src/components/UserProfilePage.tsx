import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

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
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('Current session:', session);

        if (sessionError) {
          console.error('Session error:', sessionError);
          navigate('/auth');
          return;
        }

        if (!session?.user) {
          console.log('No active session, redirecting to auth');
          navigate('/auth');
          return;
        }

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
          .eq('id', session.user.id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          setError(userError.message);
          navigate('/auth');
          return;
        }

        if (!userData) {
          console.log('No user data found, redirecting to auth');
          navigate('/auth');
          return;
        }

        console.log('User data loaded:', userData);
        setUserData(userData);
      } catch (err) {
        console.error('Error in fetchUserData:', err);
        setError(err.message || 'An error occurred');
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      if (!session) {
        navigate('/auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error loading profile: {error}</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No user data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{userData.username}</h2>
                <p className="text-sm text-gray-500">{userData.email}</p>
                {userData.role === 'admin' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                    Admin
                  </span>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* User Content Sections */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {/* Tours */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Your Tours</h3>
              {userData.tours.length > 0 ? (
                <ul className="mt-4 divide-y divide-gray-200">
                  {userData.tours.map((tour, index) => (
                    <li key={index} className="py-4">
                      {/* Add tour details here */}
                      <p className="text-sm text-gray-600">{tour.name}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-gray-500">No tours created yet</p>
              )}
            </div>
          </div>

          {/* Favorited Arts */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Favorited Street Art</h3>
              {userData.favorited_arts.length > 0 ? (
                <ul className="mt-4 divide-y divide-gray-200">
                  {userData.favorited_arts.map((art, index) => (
                    <li key={index} className="py-4">
                      {/* Add art details here */}
                      <p className="text-sm text-gray-600">{art.title}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-gray-500">No favorited street art yet</p>
              )}
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Your Reviews</h3>
              {userData.reviews.length > 0 ? (
                <ul className="mt-4 divide-y divide-gray-200">
                  {userData.reviews.map((review, index) => (
                    <li key={index} className="py-4">
                      {/* Add review details here */}
                      <p className="text-sm text-gray-600">{review.content}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-gray-500">No reviews written yet</p>
              )}
            </div>
          </div>

          {/* Added Street Arts */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Added Street Art</h3>
              {userData.added_street_arts.length > 0 ? (
                <ul className="mt-4 divide-y divide-gray-200">
                  {userData.added_street_arts.map((art, index) => (
                    <li key={index} className="py-4">
                      {/* Add art details here */}
                      <p className="text-sm text-gray-600">{art.title}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-gray-500">No street art added yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
