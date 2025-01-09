import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserCircleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import logo from '../../assets/STreet ART TOuRS.png';
import { supabase } from '../../lib/supabase';

export function Navbar() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check for user session
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Session:', session);
        
        if (error) {
          console.error('Error getting session:', error);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          // Check if user is admin
          const { data, error: roleError } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (roleError) {
            console.error('Error getting user role:', roleError);
            return;
          }

          if (data?.role === 'admin') {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error('Error in checkUser:', err);
      }
    };

    checkUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img
              src={logo}
              alt="Street Tours Logo"
              className="h-8 w-auto"
            />
          </Link>

          {/* Center Build Your Tour Button */}
          <div className="flex-grow flex justify-center">
            <Link
              to="/tour-create"
              className="transform transition-all duration-200 hover:scale-105 active:scale-95
                bg-gradient-to-r from-blue-500 to-blue-600
                text-white font-semibold px-6 py-2.5 rounded-full
                shadow-lg hover:shadow-xl
                flex items-center space-x-2
                text-sm sm:text-base
                mx-2 sm:mx-0"
            >
              <span className="hidden sm:inline">New</span>
              <span>Tour</span>
            </Link>
          </div>

          {/* User Profile and Admin Settings */}
          <div className="flex items-center space-x-2">
            <Link
              to={user ? "/user-profile" : "/user"}
              className="flex-shrink-0 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <UserCircleIcon className="h-6 w-6 text-gray-600" />
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="flex-shrink-0 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}