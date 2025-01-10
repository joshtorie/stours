-- Create tours table
CREATE TABLE IF NOT EXISTS tours (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create tour_stops table to store the order of street art in a tour
CREATE TABLE IF NOT EXISTS tour_stops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
    street_art_id UUID REFERENCES street_art(id) ON DELETE CASCADE,
    stop_order INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(tour_id, stop_order)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    street_art_id UUID REFERENCES street_art(id) ON DELETE CASCADE,
    content TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Tours policies
CREATE POLICY "Anyone can view tours"
    ON tours FOR SELECT
    USING (true);

CREATE POLICY "Users can create tours"
    ON tours FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Tour creators can update their tours"
    ON tours FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Tour creators can delete their tours"
    ON tours FOR DELETE
    USING (auth.uid() = created_by);

-- Tour stops policies
CREATE POLICY "Anyone can view tour stops"
    ON tour_stops FOR SELECT
    USING (true);

CREATE POLICY "Tour creators can manage tour stops"
    ON tour_stops FOR ALL
    USING (
        auth.uid() IN (
            SELECT created_by
            FROM tours
            WHERE id = tour_stops.tour_id
        )
    );

-- Reviews policies
CREATE POLICY "Anyone can view reviews"
    ON reviews FOR SELECT
    USING (true);

CREATE POLICY "Users can create reviews"
    ON reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
    ON reviews FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
    ON reviews FOR DELETE
    USING (auth.uid() = user_id);
