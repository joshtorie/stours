-- Create junction table for user favorites
CREATE TABLE IF NOT EXISTS user_favorites (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    street_art_id UUID REFERENCES street_art(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    PRIMARY KEY (user_id, street_art_id)
);

-- Create junction table for user tours
CREATE TABLE IF NOT EXISTS user_tours (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    PRIMARY KEY (user_id, tour_id)
);

-- Create reviews table with user reference
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    street_art_id UUID REFERENCES street_art(id) ON DELETE CASCADE,
    content TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create table for tracking user-added street art
CREATE TABLE IF NOT EXISTS user_added_art (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    street_art_id UUID REFERENCES street_art(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    PRIMARY KEY (user_id, street_art_id)
);

-- Add RLS policies
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_added_art ENABLE ROW LEVEL SECURITY;

-- User favorites policies
CREATE POLICY "Users can view their own favorites"
    ON user_favorites FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites"
    ON user_favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites"
    ON user_favorites FOR DELETE
    USING (auth.uid() = user_id);

-- User tours policies
CREATE POLICY "Users can view their own tours"
    ON user_tours FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can add tours"
    ON user_tours FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their tours"
    ON user_tours FOR DELETE
    USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Anyone can view reviews"
    ON reviews FOR SELECT
    USING (true);

CREATE POLICY "Users can add reviews"
    ON reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
    ON reviews FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
    ON reviews FOR DELETE
    USING (auth.uid() = user_id);

-- User added art policies
CREATE POLICY "Anyone can view user added art"
    ON user_added_art FOR SELECT
    USING (true);

CREATE POLICY "Users can add art"
    ON user_added_art FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their added art"
    ON user_added_art FOR DELETE
    USING (auth.uid() = user_id);
