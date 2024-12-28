/*
  # Street Art Tour Database Schema

  1. Tables
    - cities: Store city information
    - neighborhoods: Store neighborhood information, linked to cities
    - artists: Store artist information
    - street_art: Store street art pieces, linked to artists and neighborhoods

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for authenticated admin write access
*/

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  hero_image text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on cities"
  ON cities FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert cities"
  ON cities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update cities"
  ON cities FOR UPDATE
  TO authenticated
  USING (true);

-- Neighborhoods table
CREATE TABLE IF NOT EXISTS neighborhoods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city_id uuid NOT NULL REFERENCES cities(id),
  hero_image text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on neighborhoods"
  ON neighborhoods FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert neighborhoods"
  ON neighborhoods FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update neighborhoods"
  ON neighborhoods FOR UPDATE
  TO authenticated
  USING (true);

-- Artists table
CREATE TABLE IF NOT EXISTS artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bio text NOT NULL,
  hero_image text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on artists"
  ON artists FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert artists"
  ON artists FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update artists"
  ON artists FOR UPDATE
  TO authenticated
  USING (true);

-- Street Art table
CREATE TABLE IF NOT EXISTS street_art (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  image text NOT NULL,
  artist_id uuid NOT NULL REFERENCES artists(id),
  neighborhood_id uuid NOT NULL REFERENCES neighborhoods(id),
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE street_art ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on street_art"
  ON street_art FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert street_art"
  ON street_art FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update street_art"
  ON street_art FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_neighborhoods_city_id ON neighborhoods(city_id);
CREATE INDEX IF NOT EXISTS idx_street_art_artist_id ON street_art(artist_id);
CREATE INDEX IF NOT EXISTS idx_street_art_neighborhood_id ON street_art(neighborhood_id);