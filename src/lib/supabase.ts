import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a public client that doesn't require authentication
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true, // Keep the session for authenticated users
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      // Add headers to bypass RLS for public data
      'X-Client-Info': 'stours-public'
    }
  }
});

// Test database connection and RLS policies
async function testDatabaseAccess() {
  console.log('Testing database access...');
  
  try {
    // Test street_art access
    const { data: streetArtData, error: streetArtError } = await supabase
      .from('street_art')
      .select('id')
      .limit(1);
      
    console.log('Street Art Test:', {
      success: !streetArtError,
      data: streetArtData,
      error: streetArtError
    });

    // Test artists access
    const { data: artistsData, error: artistsError } = await supabase
      .from('artists')
      .select('id')
      .limit(1);
      
    console.log('Artists Test:', {
      success: !artistsError,
      data: artistsData,
      error: artistsError
    });

    // Test neighborhoods access
    const { data: neighborhoodsData, error: neighborhoodsError } = await supabase
      .from('neighborhoods')
      .select('id')
      .limit(1);
      
    console.log('Neighborhoods Test:', {
      success: !neighborhoodsError,
      data: neighborhoodsData,
      error: neighborhoodsError
    });

  } catch (e) {
    console.error('Database access test failed:', e);
  }
}

// Run the test immediately
testDatabaseAccess();