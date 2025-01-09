import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

interface UserData {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface UserActivity {
  favorites: Array<{
    street_art_id: string;
    title: string;
    image: string;
  }>;
  tours: Array<{
    tour_id: string;
    name: string;
  }>;
  reviews: Array<{
    id: string;
    content: string;
    rating: number;
    street_art_id: string;
  }>;
  addedArt: Array<{
    street_art_id: string;
    title: string;
    image: string;
  }>;
}

const UserProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity>({
    favorites: [],
    tours: [],
    reviews: [],
    addedArt: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch basic user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, username, email, role')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;
        setUserData(userData);

        // Fetch user favorites with street art details
        const { data: favorites, error: favoritesError } = await supabase
          .from('user_favorites')
          .select(`
            street_art_id,
            street_art:street_art_id (
              title,
              image
            )
          `)
          .eq('user_id', user.id);

        if (favoritesError) throw favoritesError;

        // Fetch user tours
        const { data: tours, error: toursError } = await supabase
          .from('user_tours')
          .select(`
            tour_id,
            tour:tour_id (
              name
            )
          `)
          .eq('user_id', user.id);

        if (toursError) throw toursError;

        // Fetch user reviews
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('id, content, rating, street_art_id')
          .eq('user_id', user.id);

        if (reviewsError) throw reviewsError;

        // Fetch user added art
        const { data: addedArt, error: addedArtError } = await supabase
          .from('user_added_art')
          .select(`
            street_art_id,
            street_art:street_art_id (
              title,
              image
            )
          `)
          .eq('user_id', user.id);

        if (addedArtError) throw addedArtError;

        setUserActivity({
          favorites: favorites.map(f => ({
            street_art_id: f.street_art_id,
            title: f.street_art?.title || 'Untitled',
            image: f.street_art?.image || ''
          })),
          tours: tours.map(t => ({
            tour_id: t.tour_id,
            name: t.tour?.name || 'Untitled Tour'
          })),
          reviews,
          addedArt: addedArt.map(a => ({
            street_art_id: a.street_art_id,
            title: a.street_art?.title || 'Untitled',
            image: a.street_art?.image || ''
          }))
        });

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
        {/* Profile Info */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
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

        {/* Activity Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          {/* Favorites */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Favorited Art</h3>
            </div>
            <div className="border-t border-gray-200">
              {userActivity.favorites.length === 0 ? (
                <p className="p-4 text-gray-500">No favorited art yet.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {userActivity.favorites.map(art => (
                    <li key={art.street_art_id} className="p-4">
                      <div className="flex items-center space-x-4">
                        {art.image && (
                          <img src={art.image} alt={art.title} className="h-16 w-16 object-cover rounded" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{art.title}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Tours */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Your Tours</h3>
            </div>
            <div className="border-t border-gray-200">
              {userActivity.tours.length === 0 ? (
                <p className="p-4 text-gray-500">No tours created yet.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {userActivity.tours.map(tour => (
                    <li key={tour.tour_id} className="p-4">
                      <p className="text-sm font-medium text-gray-900">{tour.name}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Your Reviews</h3>
            </div>
            <div className="border-t border-gray-200">
              {userActivity.reviews.length === 0 ? (
                <p className="p-4 text-gray-500">No reviews written yet.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {userActivity.reviews.map(review => (
                    <li key={review.id} className="p-4">
                      <div>
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">Rating: {review.rating}/5</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{review.content}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Added Art */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Added Street Art</h3>
            </div>
            <div className="border-t border-gray-200">
              {userActivity.addedArt.length === 0 ? (
                <p className="p-4 text-gray-500">No street art added yet.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {userActivity.addedArt.map(art => (
                    <li key={art.street_art_id} className="p-4">
                      <div className="flex items-center space-x-4">
                        {art.image && (
                          <img src={art.image} alt={art.title} className="h-16 w-16 object-cover rounded" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{art.title}</p>
                        </div>
                      </div>
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
