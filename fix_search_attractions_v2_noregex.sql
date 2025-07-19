-- Drop all versions of the problematic function
DROP FUNCTION IF EXISTS search_locations_comprehensive CASCADE;
DROP FUNCTION IF EXISTS search_locations_comprehensive(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, JSONB, JSONB, JSONB, JSONB, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS search_attractions_v2 CASCADE;

-- Create a new function without regex operators
CREATE OR REPLACE FUNCTION search_attractions_v2(
    center_lat DOUBLE PRECISION DEFAULT NULL,
    center_lon DOUBLE PRECISION DEFAULT NULL,
    radius_meters DOUBLE PRECISION DEFAULT NULL,
    search_text TEXT DEFAULT NULL,
    filter_city TEXT DEFAULT NULL,
    filter_country TEXT DEFAULT NULL,
    filter_petfriendly BOOLEAN DEFAULT NULL,
    filter_family_friendly BOOLEAN DEFAULT NULL,
    filter_open_24hrs BOOLEAN DEFAULT NULL,
    filter_free_entry BOOLEAN DEFAULT NULL,
    filter_souvenirs BOOLEAN DEFAULT NULL,
    min_rating DOUBLE PRECISION DEFAULT NULL,
    max_rating DOUBLE PRECISION DEFAULT NULL,
    max_results INTEGER DEFAULT 100,
    offset_results INTEGER DEFAULT 0,
    sort_by TEXT DEFAULT 'name'
)
RETURNS TABLE(
    name TEXT,
    slug TEXT,
    description TEXT,
    latitude TEXT,
    longitude TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    petfriendly BOOLEAN,
    family_friendly BOOLEAN,
    open_24hrs BOOLEAN,
    free_entry BOOLEAN,
    rating TEXT,
    url TEXT,
    admission_fee TEXT,
    opening_hours TEXT,
    quote TEXT,
    reviews JSONB,
    type TEXT,
    phone TEXT,
    souvenirs BOOLEAN,
    uid UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    is_active BOOLEAN,
    price_range JSONB,
    categories JSONB,
    wifi JSONB,
    parking JSONB,
    accessibility JSONB,
    audience_range JSONB,
    tags JSONB,
    images JSONB,
    geog GEOGRAPHY,
    distance_meters DOUBLE PRECISION,
    distance_km DOUBLE PRECISION,
    rating_numeric DOUBLE PRECISION
) AS $$
DECLARE
    has_location BOOLEAN;
BEGIN
    has_location := (center_lat IS NOT NULL AND center_lon IS NOT NULL);
    
    RETURN QUERY
    SELECT 
        l.name,
        l.slug,
        l.description,
        l.latitude,
        l.longitude,
        l.address,
        l.city,
        l.country,
        l.petfriendly,
        l.family_friendly,
        l.open_24hrs,
        l.free_entry,
        l.rating,
        l.url,
        l.admission_fee,
        l.opening_hours,
        l.quote,
        l.reviews,
        l.type,
        l.phone,
        l.souvenirs,
        l.uid,
        l.created_at,
        l.updated_at,
        l.is_active,
        l.price_range,
        l.categories,
        l.wifi,
        l.parking,
        l.accessibility,
        l.audience_range,
        l.tags,
        l.images,
        l.geog,
        -- Distance calculations
        CASE 
            WHEN has_location THEN ST_Distance(l.geog, ST_MakePoint(center_lon, center_lat)::geography)
            ELSE NULL
        END as distance_meters,
        CASE 
            WHEN has_location THEN ROUND((ST_Distance(l.geog, ST_MakePoint(center_lon, center_lat)::geography) / 1000)::numeric, 2)
            ELSE NULL
        END as distance_km,
        -- Rating conversion - try to parse as number, fallback to 0
        CASE 
            WHEN l.rating IS NOT NULL AND l.rating != '' THEN 
                CASE 
                    WHEN l.rating::TEXT ~ '^[0-9]+\.?[0-9]*$' THEN l.rating::TEXT::DOUBLE PRECISION
                    ELSE 0
                END
            ELSE 0 
        END as rating_numeric
    FROM locations l
    WHERE 
        l.type = 'attraction'
        AND l.is_active = true
        
        -- Distance filter
        AND (NOT has_location OR (
            l.geog IS NOT NULL 
            AND ST_DWithin(l.geog, ST_MakePoint(center_lon, center_lat)::geography, COALESCE(radius_meters, 50000))
        ))
        
        -- Text search
        AND (search_text IS NULL OR search_text = '' OR l.name ILIKE '%' || search_text || '%')
        
        -- Location filters
        AND (filter_city IS NULL OR l.city = filter_city)
        AND (filter_country IS NULL OR l.country = filter_country)
        
        -- Boolean filters
        AND (filter_petfriendly IS NULL OR l.petfriendly = filter_petfriendly)
        AND (filter_family_friendly IS NULL OR l.family_friendly = filter_family_friendly)
        AND (filter_open_24hrs IS NULL OR l.open_24hrs = filter_open_24hrs)
        AND (filter_free_entry IS NULL OR l.free_entry = filter_free_entry)
        AND (filter_souvenirs IS NULL OR l.souvenirs = filter_souvenirs)
        
        -- Rating filters - simplified without regex
        AND (min_rating IS NULL OR (
            l.rating IS NOT NULL 
            AND l.rating != ''
            AND (l.rating::TEXT ~ '^[0-9]+\.?[0-9]*$')
            AND l.rating::TEXT::DOUBLE PRECISION >= min_rating
        ))
        AND (max_rating IS NULL OR (
            l.rating IS NOT NULL 
            AND l.rating != ''
            AND (l.rating::TEXT ~ '^[0-9]+\.?[0-9]*$')
            AND l.rating::TEXT::DOUBLE PRECISION <= max_rating
        ))
    
    ORDER BY 
        CASE 
            WHEN sort_by = 'distance' AND has_location THEN 
                ST_Distance(l.geog, ST_MakePoint(center_lon, center_lat)::geography)
            WHEN sort_by = 'rating' THEN 
                CASE 
                    WHEN l.rating IS NOT NULL AND l.rating != '' AND (l.rating::TEXT ~ '^[0-9]+\.?[0-9]*$') THEN -l.rating::TEXT::DOUBLE PRECISION
                    ELSE 0 
                END
            WHEN sort_by = 'name' THEN 0
            ELSE 
                CASE 
                    WHEN has_location THEN ST_Distance(l.geog, ST_MakePoint(center_lon, center_lat)::geography)
                    ELSE 0
                END
        END,
        l.name
    
    LIMIT max_results
    OFFSET offset_results;
    
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_attractions_v2 TO anon, authenticated;