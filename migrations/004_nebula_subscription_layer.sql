-- ═══════════════════════════════════════════════════════════════════════════
-- DELULU APP - NEBULA SUBSCRIPTION MIGRATION
-- Migration: 004_nebula_subscription_layer.sql
-- Description: Premium Tiers, Eternal Founder, Subscription Management
-- ═══════════════════════════════════════════════════════════════════════════

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ TIER MATRIX                                                              ║
-- ║ FREE     → Standard User (5km, 3 stars, 96kbps)                         ║
-- ║ PREMIUM  → Nebula Subscriber (15km, 10 stars, 256kbps)                  ║
-- ║ SOVEREIGN → Founder/Admin (100km, ∞ stars, 256kbps)                     ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. SUBSCRIPTION TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_subscriptions (
    user_id TEXT PRIMARY KEY,

    -- Tier Information
    tier VARCHAR(20) NOT NULL DEFAULT 'FREE'
        CHECK (tier IN ('FREE', 'PREMIUM', 'SOVEREIGN')),

    -- Subscription Status
    subscription_status VARCHAR(20) DEFAULT 'none'
        CHECK (subscription_status IN ('none', 'active', 'expired', 'cancelled', 'eternal')),

    -- Dates
    subscription_start TIMESTAMPTZ,
    subscription_end TIMESTAMPTZ,

    -- Payment Info (Reference only, no sensitive data)
    payment_provider VARCHAR(50),  -- 'stripe', 'apple', 'google', 'manual'
    payment_reference TEXT,

    -- Granted Premium
    granted_by TEXT,
    granted_at TIMESTAMPTZ,
    grant_reason TEXT,

    -- Feature Limits
    star_radius_meters INTEGER DEFAULT 5000,
    voice_cloud_limit INTEGER DEFAULT 1,
    daily_stars_limit INTEGER DEFAULT 3,
    audio_bitrate_kbps INTEGER DEFAULT 96,

    -- Premium Features
    can_ghost_mode BOOLEAN DEFAULT FALSE,
    can_invisible_mode BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON user_subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON user_subscriptions(subscription_status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end ON user_subscriptions(subscription_end);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. STARS USAGE TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS daily_stars_usage (
    id TEXT PRIMARY KEY,  -- user_id_YYYY-MM-DD
    user_id TEXT NOT NULL,
    usage_date DATE NOT NULL,
    stars_sent INTEGER DEFAULT 0,
    stars_received INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_stars_usage_user ON daily_stars_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_stars_usage_date ON daily_stars_usage(usage_date);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. SUBSCRIPTION HISTORY
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,

    -- Change Info
    previous_tier VARCHAR(20),
    new_tier VARCHAR(20) NOT NULL,
    change_type VARCHAR(20) NOT NULL
        CHECK (change_type IN ('upgrade', 'downgrade', 'renewal', 'grant', 'revoke', 'expire')),

    -- Details
    changed_by TEXT,  -- Admin/System
    reason TEXT,
    metadata JSONB,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_history_user ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_history_created ON subscription_history(created_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. ETERNAL FOUNDER SETUP COMMAND
-- ═══════════════════════════════════════════════════════════════════════════

-- Run this to set your account as Eternal Founder
-- Replace 'YOUR_FIREBASE_UID' with your actual Firebase Auth UID

/*
INSERT INTO user_subscriptions (
    user_id,
    tier,
    subscription_status,
    subscription_start,
    subscription_end,
    star_radius_meters,
    voice_cloud_limit,
    daily_stars_limit,
    audio_bitrate_kbps,
    can_ghost_mode,
    can_invisible_mode,
    grant_reason
) VALUES (
    'YOUR_FIREBASE_UID',
    'SOVEREIGN',
    'eternal',
    NOW(),
    '2099-12-31 23:59:59+00',
    100000,    -- 100 km
    999,       -- Unlimited
    999999,    -- Infinite
    256,       -- Crystal Audio
    TRUE,      -- Ghost Mode
    TRUE,      -- Invisible Mode
    'Founder Account - Eternal Premium'
)
ON CONFLICT (user_id) DO UPDATE SET
    tier = 'SOVEREIGN',
    subscription_status = 'eternal',
    subscription_end = '2099-12-31 23:59:59+00',
    star_radius_meters = 100000,
    voice_cloud_limit = 999,
    daily_stars_limit = 999999,
    audio_bitrate_kbps = 256,
    can_ghost_mode = TRUE,
    can_invisible_mode = TRUE,
    updated_at = NOW();
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to get user's access level
CREATE OR REPLACE FUNCTION get_access_level(p_user_id TEXT)
RETURNS TABLE(
    tier VARCHAR(20),
    stars INTEGER,
    radius INTEGER,
    audio_bitrate INTEGER,
    voice_limit INTEGER,
    can_ghost BOOLEAN,
    can_invisible BOOLEAN,
    is_premium BOOLEAN,
    is_founder BOOLEAN
) AS $$
DECLARE
    v_sub user_subscriptions%ROWTYPE;
    v_founder_id TEXT := current_setting('app.founder_id', TRUE);
BEGIN
    -- Get subscription
    SELECT * INTO v_sub FROM user_subscriptions WHERE user_id = p_user_id;

    -- Check if founder
    IF p_user_id = v_founder_id OR v_sub.subscription_status = 'eternal' THEN
        RETURN QUERY SELECT
            'SOVEREIGN'::VARCHAR(20),
            999999,
            100000,
            256,
            999,
            TRUE,
            TRUE,
            TRUE,
            TRUE;
        RETURN;
    END IF;

    -- Check subscription
    IF v_sub IS NOT NULL AND v_sub.subscription_status = 'active'
       AND (v_sub.subscription_end IS NULL OR v_sub.subscription_end > NOW()) THEN
        RETURN QUERY SELECT
            v_sub.tier,
            v_sub.daily_stars_limit,
            v_sub.star_radius_meters,
            v_sub.audio_bitrate_kbps,
            v_sub.voice_cloud_limit,
            v_sub.can_ghost_mode,
            v_sub.can_invisible_mode,
            TRUE,
            FALSE;
        RETURN;
    END IF;

    -- Default FREE tier
    RETURN QUERY SELECT
        'FREE'::VARCHAR(20),
        3,
        5000,
        96,
        1,
        FALSE,
        FALSE,
        FALSE,
        FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can send star
CREATE OR REPLACE FUNCTION can_send_star(p_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_access RECORD;
    v_used INTEGER;
BEGIN
    -- Get access level
    SELECT * INTO v_access FROM get_access_level(p_user_id);

    -- Founder/Unlimited check
    IF v_access.is_founder OR v_access.stars >= 999999 THEN
        RETURN TRUE;
    END IF;

    -- Get today's usage
    SELECT COALESCE(stars_sent, 0) INTO v_used
    FROM daily_stars_usage
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

    RETURN COALESCE(v_used, 0) < v_access.stars;
END;
$$ LANGUAGE plpgsql;

-- Function to record star sent
CREATE OR REPLACE FUNCTION record_star_sent(p_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO daily_stars_usage (id, user_id, usage_date, stars_sent)
    VALUES (
        p_user_id || '_' || CURRENT_DATE,
        p_user_id,
        CURRENT_DATE,
        1
    )
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET
        stars_sent = daily_stars_usage.stars_sent + 1,
        updated_at = NOW();

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subscriptions_updated
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_subscription_timestamp();

-- Log subscription changes
CREATE OR REPLACE FUNCTION log_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.tier IS DISTINCT FROM NEW.tier THEN
        INSERT INTO subscription_history (
            user_id, previous_tier, new_tier, change_type, metadata
        ) VALUES (
            NEW.user_id,
            OLD.tier,
            NEW.tier,
            CASE
                WHEN NEW.tier = 'SOVEREIGN' THEN 'upgrade'
                WHEN NEW.tier = 'PREMIUM' AND OLD.tier = 'FREE' THEN 'upgrade'
                WHEN NEW.tier = 'FREE' THEN 'downgrade'
                ELSE 'change'
            END,
            jsonb_build_object(
                'old_status', OLD.subscription_status,
                'new_status', NEW.subscription_status
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_subscription_change
    AFTER UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION log_subscription_change();

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. VIEWS
-- ═══════════════════════════════════════════════════════════════════════════

-- View for active premium users
CREATE OR REPLACE VIEW v_premium_users AS
SELECT
    s.user_id,
    s.tier,
    s.subscription_status,
    s.subscription_end,
    CASE
        WHEN s.subscription_status = 'eternal' THEN NULL
        ELSE EXTRACT(DAY FROM s.subscription_end - NOW())::INTEGER
    END as days_remaining
FROM user_subscriptions s
WHERE s.tier IN ('PREMIUM', 'SOVEREIGN')
  AND (s.subscription_status IN ('active', 'eternal')
       OR s.subscription_end > NOW());

-- View for today's star usage
CREATE OR REPLACE VIEW v_todays_stars AS
SELECT
    u.user_id,
    COALESCE(d.stars_sent, 0) as stars_sent,
    (SELECT stars FROM get_access_level(u.user_id)) as stars_limit,
    (SELECT stars FROM get_access_level(u.user_id)) - COALESCE(d.stars_sent, 0) as stars_remaining
FROM user_subscriptions u
LEFT JOIN daily_stars_usage d ON u.user_id = d.user_id AND d.usage_date = CURRENT_DATE;

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════
