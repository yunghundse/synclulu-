-- ═══════════════════════════════════════════════════════════════════════════
-- DELULU MIGRATION 005: PROFILE VISITORS & NEARBY ENGINE
-- ═══════════════════════════════════════════════════════════════════════════
--
-- FEATURES:
-- 1. Profile Views Tracking (who visited your profile)
-- 2. Nearby Engine with ST_DWithin (PostGIS)
-- 3. Founder/Premium View Permissions
--
-- @version 5.0.0
-- @date 2025
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- ENABLE POSTGIS EXTENSION (if not already enabled)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS postgis;

-- ═══════════════════════════════════════════════════════════════════════════
-- PROFILE VIEWS TABLE
-- ═══════════════════════════════════════════════════════════════════════════
-- Tracks every profile visit
-- viewer_id = who viewed
-- target_id = whose profile was viewed

CREATE TABLE IF NOT EXISTS profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT now(),

    -- View metadata
    view_duration_seconds INTEGER DEFAULT 0,
    source VARCHAR(50) DEFAULT 'profile', -- 'profile', 'radar', 'search', 'nearby'

    -- Prevent duplicate views within 1 hour
    UNIQUE(viewer_id, target_id, (DATE_TRUNC('hour', viewed_at)))
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_profile_views_target ON profile_views(target_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_time ON profile_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_target_time ON profile_views(target_id, viewed_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- USER LOCATIONS TABLE (Enhanced)
-- ═══════════════════════════════════════════════════════════════════════════
-- Stores user locations with PostGIS geometry for efficient spatial queries

CREATE TABLE IF NOT EXISTS user_locations (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Raw coordinates
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,

    -- PostGIS geometry column for spatial queries
    location GEOGRAPHY(Point, 4326),

    -- Accuracy & freshness
    accuracy_meters DOUBLE PRECISION DEFAULT 100,
    altitude DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    speed DOUBLE PRECISION,

    -- Timestamps
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),

    -- Privacy settings
    is_visible BOOLEAN DEFAULT true,
    share_exact_location BOOLEAN DEFAULT false, -- Premium feature

    -- Search radius (in meters) - set by subscription tier
    search_radius INTEGER DEFAULT 5000 -- 5km default
);

-- Spatial index for ST_DWithin queries
CREATE INDEX IF NOT EXISTS idx_user_locations_geo ON user_locations USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_user_locations_visible ON user_locations(is_visible) WHERE is_visible = true;

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGER: Auto-update geometry from lat/lng
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_location_geometry()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_location_geometry ON user_locations;
CREATE TRIGGER trg_update_location_geometry
    BEFORE INSERT OR UPDATE OF latitude, longitude ON user_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_location_geometry();

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCTION: Get Nearby Users (ST_DWithin)
-- ═══════════════════════════════════════════════════════════════════════════
-- Returns users within a specified radius
-- Uses PostGIS ST_DWithin for efficient spatial filtering

CREATE OR REPLACE FUNCTION get_nearby_users(
    p_user_id UUID,
    p_radius_meters INTEGER DEFAULT 5000,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    user_id UUID,
    distance_meters DOUBLE PRECISION,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    accuracy_meters DOUBLE PRECISION,
    updated_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_location GEOGRAPHY;
BEGIN
    -- Get the requesting user's location
    SELECT location INTO v_user_location
    FROM user_locations
    WHERE user_locations.user_id = p_user_id
    AND is_visible = true;

    -- If user has no location, return empty
    IF v_user_location IS NULL THEN
        RETURN;
    END IF;

    -- Find nearby users using ST_DWithin
    RETURN QUERY
    SELECT
        ul.user_id,
        ST_Distance(ul.location, v_user_location) as distance_meters,
        ul.latitude,
        ul.longitude,
        ul.accuracy_meters,
        ul.updated_at
    FROM user_locations ul
    WHERE ul.user_id != p_user_id
    AND ul.is_visible = true
    AND ST_DWithin(ul.location, v_user_location, p_radius_meters)
    ORDER BY ST_Distance(ul.location, v_user_location) ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCTION: Get Profile View Count
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_profile_view_count(
    p_user_id UUID,
    p_days INTEGER DEFAULT 7
)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(DISTINCT viewer_id)
        FROM profile_views
        WHERE target_id = p_user_id
        AND viewed_at > NOW() - (p_days || ' days')::INTERVAL
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCTION: Get Profile Visitors (Premium/Founder Only)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_profile_visitors(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    viewer_id UUID,
    viewed_at TIMESTAMPTZ,
    view_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pv.viewer_id,
        MAX(pv.viewed_at) as viewed_at,
        COUNT(*) as view_count
    FROM profile_views pv
    WHERE pv.target_id = p_user_id
    GROUP BY pv.viewer_id
    ORDER BY MAX(pv.viewed_at) DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCTION: Record Profile View
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION record_profile_view(
    p_viewer_id UUID,
    p_target_id UUID,
    p_source VARCHAR DEFAULT 'profile'
)
RETURNS VOID AS $$
BEGIN
    -- Don't record self-views
    IF p_viewer_id = p_target_id THEN
        RETURN;
    END IF;

    -- Insert view (ignore duplicates within same hour)
    INSERT INTO profile_views (viewer_id, target_id, source)
    VALUES (p_viewer_id, p_target_id, p_source)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- VIEW: Profile View Stats
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW profile_view_stats AS
SELECT
    target_id as user_id,
    COUNT(*) as total_views,
    COUNT(DISTINCT viewer_id) as unique_visitors,
    COUNT(*) FILTER (WHERE viewed_at > NOW() - INTERVAL '24 hours') as views_today,
    COUNT(*) FILTER (WHERE viewed_at > NOW() - INTERVAL '7 days') as views_this_week,
    MAX(viewed_at) as last_view_at
FROM profile_views
GROUP BY target_id;

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- Profile views: Users can only see their own views (as target)
CREATE POLICY "Users can view their own profile visitors"
ON profile_views FOR SELECT
USING (target_id = auth.uid());

-- Profile views: Anyone authenticated can record a view
CREATE POLICY "Users can record profile views"
ON profile_views FOR INSERT
WITH CHECK (viewer_id = auth.uid());

-- User locations: Users can read their own location
CREATE POLICY "Users can view own location"
ON user_locations FOR SELECT
USING (user_id = auth.uid());

-- User locations: Users can update their own location
CREATE POLICY "Users can update own location"
ON user_locations FOR UPDATE
USING (user_id = auth.uid());

-- User locations: Users can insert their own location
CREATE POLICY "Users can insert own location"
ON user_locations FOR INSERT
WITH CHECK (user_id = auth.uid());

-- User locations: Visible users can be found by nearby queries
CREATE POLICY "Visible users can be found"
ON user_locations FOR SELECT
USING (is_visible = true);

-- ═══════════════════════════════════════════════════════════════════════════
-- FOUNDER SPECIAL: Bypass RLS for founders
-- ═══════════════════════════════════════════════════════════════════════════

-- Create a function to check if user is founder
CREATE OR REPLACE FUNCTION is_founder(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Hardcoded founder ID check
    RETURN p_user_id = 'MIbamchs82Ve7y0ecX2TpPyymbw1'::UUID;
EXCEPTION
    WHEN others THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Founder policy: Founders can see all profile visitors
CREATE POLICY "Founders can view all profile visitors"
ON profile_views FOR SELECT
USING (is_founder(auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE profile_views IS 'Tracks who viewed whose profile - "X Personen haben deine Aura besucht"';
COMMENT ON TABLE user_locations IS 'User locations with PostGIS geometry for Nearby Engine';
COMMENT ON FUNCTION get_nearby_users IS 'Returns users within radius using ST_DWithin - fixed spatial query';
COMMENT ON FUNCTION get_profile_visitors IS 'Premium/Founder feature - see who visited your profile';

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════════════════
