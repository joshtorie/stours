import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = 'https://impgpcljswbjfzdpinjq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcGdwY2xqc3dianpmZHBpbmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ4MzI0NzksImV4cCI6MjAyMDQwODQ3OX0.GQDsXgF5sJVmtS5qm5AIQbNHR6eVxQDRqJxjXPFQBXs';

// Create a public client that doesn't require authentication
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Don't persist auth state
    autoRefreshToken: false, // Don't refresh token
    detectSessionInUrl: false // Don't detect session in URL
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