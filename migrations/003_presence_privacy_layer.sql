-- ═══════════════════════════════════════════════════════════════════════════
-- DELULU APP - PRESENCE & PRIVACY MIGRATION
-- Migration: 003_presence_privacy_layer.sql
-- Description: Last Seen, Privacy Controls, Admin Hierarchy
-- ═══════════════════════════════════════════════════════════════════════════

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ NOTE: This is a reference schema for PostgreSQL/Supabase                 ║
-- ║ Primary data is stored in Firebase Firestore                             ║
-- ║ Use this for analytics, backups, or SQL-based reporting                  ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. USER PRESENCE TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_presence (
    user_id TEXT PRIMARY KEY,

    -- Online Status
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    last_activity VARCHAR(50), -- 'voice_chat', 'browsing', 'messaging', 'idle'

    -- Device Info
    device_type VARCHAR(20), -- 'mobile', 'desktop', 'tablet'
    device_fingerprint_hash TEXT,

    -- Privacy Settings
    show_online_status BOOLEAN DEFAULT TRUE,
    show_last_seen BOOLEAN DEFAULT TRUE,
    show_activity_type BOOLEAN DEFAULT FALSE,
    is_incognito BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast online user queries
CREATE INDEX IF NOT EXISTS idx_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_presence_last_heartbeat ON user_presence(last_heartbeat);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. USER PRIVACY SETTINGS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_privacy_settings (
    user_id TEXT PRIMARY KEY,

    -- Presence Privacy
    show_online_status BOOLEAN DEFAULT TRUE,
    show_last_seen BOOLEAN DEFAULT TRUE,
    show_activity_type BOOLEAN DEFAULT FALSE,

    -- Profile Privacy
    show_profile_visitors BOOLEAN DEFAULT TRUE,
    allow_profile_visits BOOLEAN DEFAULT TRUE,
    anonymous_browsing BOOLEAN DEFAULT FALSE,

    -- Radar Privacy
    show_on_radar BOOLEAN DEFAULT TRUE,
    show_distance BOOLEAN DEFAULT TRUE,
    fuzzy_location BOOLEAN DEFAULT TRUE, -- Show approximate, not exact location

    -- Communication Privacy
    allow_messages_from VARCHAR(20) DEFAULT 'everyone'
        CHECK (allow_messages_from IN ('everyone', 'matches', 'nobody')),
    allow_voice_from VARCHAR(20) DEFAULT 'everyone'
        CHECK (allow_voice_from IN ('everyone', 'matches', 'nobody')),

    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. ADMIN ROLES & PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS admin_roles (
    user_id TEXT PRIMARY KEY,

    -- Role Info
    role VARCHAR(20) NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'premium', 'moderator', 'admin', 'founder')),
    power_level INTEGER NOT NULL DEFAULT 1,

    -- Role History
    previous_role VARCHAR(20),
    role_granted_by TEXT,
    role_granted_at TIMESTAMPTZ,

    -- Premium Info
    is_premium BOOLEAN DEFAULT FALSE,
    premium_until TIMESTAMPTZ,
    premium_granted_by TEXT,

    -- Founder Protection Flag
    is_founder BOOLEAN DEFAULT FALSE,
    is_protected BOOLEAN DEFAULT FALSE, -- Cannot be modified by anyone

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for role queries
CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON admin_roles(role);
CREATE INDEX IF NOT EXISTS idx_admin_roles_power ON admin_roles(power_level);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. ADMIN AUDIT LOG (Enhanced)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Action Info
    actor_id TEXT NOT NULL,
    actor_role VARCHAR(20) NOT NULL,
    action VARCHAR(50) NOT NULL,
    target_user_id TEXT,

    -- Action Details
    previous_value JSONB,
    new_value JSONB,
    metadata JSONB,

    -- Security
    ip_address TEXT, -- Hashed for privacy
    user_agent_hash TEXT,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_actor ON admin_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_target ON admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log(created_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. LOCATION PERMISSIONS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_location_permissions (
    user_id TEXT PRIMARY KEY,

    -- Permission Status
    permission_status VARCHAR(20) DEFAULT 'pending'
        CHECK (permission_status IN ('pending', 'granted', 'denied', 'unavailable')),

    -- Last Known Location (fuzzy for privacy)
    last_latitude DECIMAL(10, 6),
    last_longitude DECIMAL(10, 6),
    location_accuracy DECIMAL(10, 2),

    -- Geohash for proximity queries (privacy-preserving)
    geohash_precise VARCHAR(12), -- Full precision
    geohash_fuzzy VARCHAR(6),    -- Approximate (shown to others)

    -- Timestamps
    permission_granted_at TIMESTAMPTZ,
    location_updated_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for location queries
CREATE INDEX IF NOT EXISTS idx_location_status ON user_location_permissions(permission_status);
CREATE INDEX IF NOT EXISTS idx_location_geohash ON user_location_permissions(geohash_fuzzy);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to check if user is online (heartbeat within 2 minutes)
CREATE OR REPLACE FUNCTION is_user_online(p_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_presence
        WHERE user_id = p_user_id
        AND last_heartbeat > NOW() - INTERVAL '2 minutes'
        AND status != 'offline'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get formatted last seen
CREATE OR REPLACE FUNCTION get_last_seen_display(p_user_id TEXT, p_viewer_id TEXT)
RETURNS TABLE(display TEXT, text TEXT) AS $$
DECLARE
    v_privacy user_privacy_settings%ROWTYPE;
    v_presence user_presence%ROWTYPE;
    v_diff INTERVAL;
BEGIN
    -- Get privacy settings
    SELECT * INTO v_privacy FROM user_privacy_settings WHERE user_id = p_user_id;

    -- Check if hidden
    IF NOT COALESCE(v_privacy.show_last_seen, TRUE) AND NOT COALESCE(v_privacy.show_online_status, TRUE) THEN
        RETURN QUERY SELECT 'hidden'::TEXT, ''::TEXT;
        RETURN;
    END IF;

    -- Get presence
    SELECT * INTO v_presence FROM user_presence WHERE user_id = p_user_id;

    IF v_presence IS NULL THEN
        RETURN QUERY SELECT 'hidden'::TEXT, ''::TEXT;
        RETURN;
    END IF;

    -- Check if online
    IF is_user_online(p_user_id) AND COALESCE(v_privacy.show_online_status, TRUE) THEN
        RETURN QUERY SELECT 'online'::TEXT, 'Online'::TEXT;
        RETURN;
    END IF;

    -- Check last seen permission
    IF NOT COALESCE(v_privacy.show_last_seen, TRUE) THEN
        RETURN QUERY SELECT 'hidden'::TEXT, ''::TEXT;
        RETURN;
    END IF;

    -- Calculate time difference
    v_diff := NOW() - v_presence.last_seen;

    IF v_diff < INTERVAL '5 minutes' THEN
        RETURN QUERY SELECT 'recently'::TEXT, 'Kürzlich aktiv'::TEXT;
    ELSIF v_diff < INTERVAL '1 hour' THEN
        RETURN QUERY SELECT 'recently'::TEXT,
            'Vor ' || EXTRACT(MINUTE FROM v_diff)::INTEGER || ' Min.'::TEXT;
    ELSIF v_presence.last_seen::DATE = CURRENT_DATE THEN
        RETURN QUERY SELECT 'today'::TEXT,
            'Heute um ' || TO_CHAR(v_presence.last_seen, 'HH24:MI')::TEXT;
    ELSIF v_presence.last_seen::DATE = CURRENT_DATE - 1 THEN
        RETURN QUERY SELECT 'yesterday'::TEXT,
            'Gestern um ' || TO_CHAR(v_presence.last_seen, 'HH24:MI')::TEXT;
    ELSIF v_diff < INTERVAL '7 days' THEN
        RETURN QUERY SELECT 'this_week'::TEXT,
            TO_CHAR(v_presence.last_seen, 'Day')::TEXT;
    ELSE
        RETURN QUERY SELECT 'long_ago'::TEXT,
            TO_CHAR(v_presence.last_seen, 'DD. Mon')::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check power level permission
CREATE OR REPLACE FUNCTION check_power_level(
    p_actor_id TEXT,
    p_target_id TEXT,
    p_action TEXT
) RETURNS TABLE(allowed BOOLEAN, reason TEXT) AS $$
DECLARE
    v_actor_role admin_roles%ROWTYPE;
    v_target_role admin_roles%ROWTYPE;
    v_founder_id TEXT := current_setting('app.founder_id', TRUE);
BEGIN
    -- Get roles
    SELECT * INTO v_actor_role FROM admin_roles WHERE user_id = p_actor_id;
    SELECT * INTO v_target_role FROM admin_roles WHERE user_id = p_target_id;

    -- FOUNDER IMMUNITY
    IF p_target_id = v_founder_id OR COALESCE(v_target_role.is_founder, FALSE) THEN
        RETURN QUERY SELECT FALSE, 'FOUNDER_IMMUNITY: Dieser Account ist geschützt.'::TEXT;
        RETURN;
    END IF;

    -- Power level check
    IF COALESCE(v_actor_role.power_level, 1) <= COALESCE(v_target_role.power_level, 1) THEN
        RETURN QUERY SELECT FALSE, 'INSUFFICIENT_POWER: Dein Power-Level ist zu niedrig.'::TEXT;
        RETURN;
    END IF;

    -- Action-specific checks
    IF p_action = 'DEMOTE_ADMIN' AND COALESCE(v_actor_role.role, 'user') != 'founder' THEN
        RETURN QUERY SELECT FALSE, 'FOUNDER_ONLY: Nur der Founder kann Admins degradieren.'::TEXT;
        RETURN;
    END IF;

    RETURN QUERY SELECT TRUE, 'ALLOWED'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_presence_updated
    BEFORE UPDATE ON user_presence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_privacy_updated
    BEFORE UPDATE ON user_privacy_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_roles_updated
    BEFORE UPDATE ON admin_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. VIEWS
-- ═══════════════════════════════════════════════════════════════════════════

-- View for online users
CREATE OR REPLACE VIEW v_online_users AS
SELECT
    p.user_id,
    p.status,
    p.last_seen,
    p.last_activity,
    p.device_type,
    r.role,
    r.is_premium
FROM user_presence p
LEFT JOIN admin_roles r ON p.user_id = r.user_id
WHERE p.last_heartbeat > NOW() - INTERVAL '2 minutes'
  AND p.status != 'offline'
  AND COALESCE(p.is_incognito, FALSE) = FALSE;

-- View for admin users
CREATE OR REPLACE VIEW v_admin_users AS
SELECT
    r.user_id,
    r.role,
    r.power_level,
    r.is_founder,
    r.is_premium,
    r.role_granted_at,
    p.status,
    p.last_seen
FROM admin_roles r
LEFT JOIN user_presence p ON r.user_id = p.user_id
WHERE r.power_level >= 3; -- Moderator and above

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════
