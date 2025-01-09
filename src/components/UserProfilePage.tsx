import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const UserProfilePage = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { user } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Fetch user role
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        if (error) setError('Failed to fetch user role');
        else if (data) {
          if (data.role === 'admin') {
            setIsAdmin(true);
          }
        }
      } else {
        setError('User not found');
      }
    };
    fetchUser();
  }, []);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>User Profile</h2>
      {user && (
        <div>
          <p>Username: {user.user_metadata.username}</p>
          <p>Email: {user.email}</p>
          {isAdmin && (
            <div>
              <h3>Admin Options</h3>
              {/* Render admin options here */}
            </div>
          )}
          {/* Display user's tours, favorited arts, and reviews here */}
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
