import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = 'https://impgpcljswbjfzdpinjq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcGdwY2xqc3dianpmZHBpbmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ4MzI0NzksImV4cCI6MjAyMDQwODQ3OX0.GQDsXgF5sJVmtS5qm5AIQbNHR6eVxQDRqJxjXPFQBXs';

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// Test database connection
supabase
  .from('street_art')
  .select('count')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('Database connection error:', error);
    } else {
      console.log('Database connected successfully');
    }
  });