import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      console.log('Starting sign up process...');
      
      // Step 1: Sign up with Supabase auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0]
          }
        }
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        throw signUpError;
      }

      if (!data?.user) {
        console.error('No user in response');
        throw new Error('Failed to create user account');
      }

      // Step 2: Create user record
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: data.user.id,
          email: data.user.email,
          username: username || data.user.email?.split('@')[0],
          password: password, // Add password field
          role: 'user',
          tours: [],
          favorited_arts: [],
          reviews: [],
          added_street_arts: []
        }])
        .single();

      if (insertError) {
        console.error('Error creating user record:', insertError);
        throw insertError;
      }

      console.log('Successfully created user account');
      navigate('/profile');
    } catch (err) {
      console.error('Error in sign up process:', err);
      setError(err.message || 'An error occurred during sign up');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      console.log('Starting sign in process...');
      
      // Step 1: Sign in with Supabase auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        throw signInError;
      }

      if (!data?.user) {
        console.error('No user in response');
        throw new Error('Failed to sign in');
      }

      // Step 2: Get or create user record
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user:', userError);
        throw userError;
      }

      // Create user record if it doesn't exist
      if (!userData) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            username: data.user.email?.split('@')[0],
            password: password, // Add password field
            role: 'user',
            tours: [],
            favorited_arts: [],
            reviews: [],
            added_street_arts: []
          }])
          .single();

        if (insertError) {
          console.error('Error creating user record:', insertError);
          throw insertError;
        }
      }

      console.log('Successfully signed in');
      navigate('/profile');
    } catch (err) {
      console.error('Error signing in:', err);
      setError(err.message || 'An error occurred during sign in');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={isSignUp ? handleSignUp : handleSignIn}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="mt-1">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isSignUp ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
