-- ═══════════════════════════════════════════════════════════════════════════
-- AEGIS SECURITY LAYER v5.5
-- "Unangreifbar - Technologisch & Juristisch"
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Dieses Schema implementiert:
-- 1. Biometrisches Age-Gating mit Privacy-by-Design
-- 2. Hard-Wall Segmentierung (Erwachsene ↔ Minderjährige)
-- 3. Safety-Score-System für Verhaltens-Tracking
-- 4. Device-Fingerprinting für permanente Bans
-- 5. Ghost-Reporting Safe-Vault
--
-- LEGAL SHIELD: Keine Speicherung von Ausweisdaten, nur kryptografische Hashes
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════
-- 1. USER SAFETY PROFILES
-- Getrennt vom Hauptprofil für Datensparsamkeit
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_safety_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,

    -- ══════════════════════════════════
    -- ALTERS-GATING (Privacy-by-Design)
    -- Wir speichern NIEMALS das Geburtsdatum
    -- ══════════════════════════════════
    is_adult BOOLEAN NOT NULL DEFAULT FALSE,
    is_minor_protected BOOLEAN NOT NULL DEFAULT TRUE,
    age_verified_at TIMESTAMPTZ,
    verification_method VARCHAR(50), -- 'AI_ESTIMATION', 'ID_DOCUMENT_HASH', 'SELF_DECLARATION'
    verification_confidence DECIMAL(5,2), -- 0.00 - 100.00 für AI-Estimation

    -- ══════════════════════════════════
    -- SAFETY SCORE (0-100)
    -- Startet bei 100, sinkt bei Warnungen
    -- ══════════════════════════════════
    safety_score INTEGER NOT NULL DEFAULT 100 CHECK (safety_score >= 0 AND safety_score <= 100),
    score_last_updated TIMESTAMPTZ DEFAULT NOW(),
    warning_count INTEGER DEFAULT 0,

    -- Score-Schwellenwerte:
    -- >= 80: Volle Funktionen
    -- 50-79: Eingeschränkte Sichtbarkeit
    -- 20-49: 24h Pause + Review
    -- < 20: Permanenter Ban

    -- ══════════════════════════════════
    -- SICHTBARKEITS-KONTROLLE
    -- ══════════════════════════════════
    visible_to_gender VARCHAR(20) DEFAULT 'ALL' CHECK (visible_to_gender IN ('ALL', 'FEMALE_ONLY', 'MALE_ONLY', 'VERIFIED_ONLY')),
    radar_enabled BOOLEAN DEFAULT TRUE,
    ghost_mode BOOLEAN DEFAULT FALSE,

    -- ══════════════════════════════════
    -- DEVICE FINGERPRINT (Ban-Hammer)
    -- IMEI-Hash für Geräte-Bans
    -- ══════════════════════════════════
    device_fingerprint_hash TEXT,
    is_device_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    banned_at TIMESTAMPTZ,
    ban_expires_at TIMESTAMPTZ, -- NULL = permanent

    -- ══════════════════════════════════
    -- TIMESTAMPS
    -- ══════════════════════════════════
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance-Indices für Hard-Wall Segmentierung
CREATE INDEX IF NOT EXISTS idx_aegis_age_segment ON user_safety_profiles(is_adult, is_minor_protected);
CREATE INDEX IF NOT EXISTS idx_aegis_safety_score ON user_safety_profiles(safety_score);
CREATE INDEX IF NOT EXISTS idx_aegis_device_ban ON user_safety_profiles(device_fingerprint_hash, is_device_banned);
CREATE INDEX IF NOT EXISTS idx_aegis_visibility ON user_safety_profiles(visible_to_gender, radar_enabled);

-- ═══════════════════════════════════════
-- 2. INCIDENT SAFE-VAULT
-- Verschlüsselte Beweissicherung für Ghost-Reporting
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS incident_safe_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- ══════════════════════════════════
    -- INCIDENT METADATA
    -- ══════════════════════════════════
    reporter_id UUID NOT NULL,
    reported_user_id UUID NOT NULL,
    incident_type VARCHAR(50) NOT NULL CHECK (incident_type IN (
        'HARASSMENT', 'GROOMING_ATTEMPT', 'EXPLICIT_CONTENT',
        'IDENTITY_FRAUD', 'THREATS', 'SPAM', 'OTHER'
    )),
    severity_level VARCHAR(20) NOT NULL CHECK (severity_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),

    -- ══════════════════════════════════
    -- ENCRYPTED EVIDENCE (AES-256)
    -- ══════════════════════════════════
    encrypted_chat_log TEXT, -- AES-256 verschlüsselter Chat-Verlauf
    encrypted_screenshots TEXT[], -- Array von verschlüsselten Base64-Screenshots
    encryption_key_reference TEXT NOT NULL, -- Verweis auf Key-Vault (nicht der Key selbst!)

    -- ══════════════════════════════════
    -- CONTEXT DATA
    -- ══════════════════════════════════
    incident_timestamp TIMESTAMPTZ NOT NULL,
    location_hash TEXT, -- SHA-256 Hash der Location (nicht exakt)
    session_duration_seconds INTEGER,
    message_count INTEGER,

    -- ══════════════════════════════════
    -- SANCTUARY KI FLAGS
    -- ══════════════════════════════════
    ai_detected BOOLEAN DEFAULT FALSE,
    ai_confidence_score DECIMAL(5,2),
    ai_trigger_keywords TEXT[],

    -- ══════════════════════════════════
    -- PROCESSING STATUS
    -- ══════════════════════════════════
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'UNDER_REVIEW', 'CONFIRMED', 'DISMISSED', 'ESCALATED_TO_AUTHORITIES'
    )),
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    action_taken TEXT,

    -- ══════════════════════════════════
    -- LEGAL COMPLIANCE
    -- Für StPO-konforme Beweissicherung
    -- ══════════════════════════════════
    evidence_hash TEXT NOT NULL, -- SHA-256 Hash aller Beweise (Integritätsnachweis)
    chain_of_custody_log JSONB DEFAULT '[]'::JSONB,

    -- ══════════════════════════════════
    -- TIMESTAMPS
    -- ══════════════════════════════════
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_vault_reporter ON incident_safe_vault(reporter_id);
CREATE INDEX IF NOT EXISTS idx_vault_reported ON incident_safe_vault(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_vault_status ON incident_safe_vault(status, severity_level);
CREATE INDEX IF NOT EXISTS idx_vault_timestamp ON incident_safe_vault(incident_timestamp DESC);

-- ═══════════════════════════════════════
-- 3. DEVICE BAN REGISTRY
-- Zentrale Blacklist für gebannte Geräte
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS device_ban_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_fingerprint_hash TEXT NOT NULL UNIQUE,

    -- Ban-Details
    ban_type VARCHAR(20) NOT NULL CHECK (ban_type IN ('TEMPORARY', 'PERMANENT')),
    ban_reason TEXT NOT NULL,
    original_user_id UUID, -- Der erste gebannte Account auf diesem Gerät

    -- Zeitliche Daten
    banned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- NULL = permanent

    -- Attempts-Tracking
    blocked_registration_attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_device_ban_hash ON device_ban_registry(device_fingerprint_hash);

-- ═══════════════════════════════════════
-- 4. SAFETY SCORE HISTORY
-- Audit-Trail für Score-Änderungen
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS safety_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,

    previous_score INTEGER NOT NULL,
    new_score INTEGER NOT NULL,
    change_reason VARCHAR(100) NOT NULL,
    change_source VARCHAR(50) NOT NULL CHECK (change_source IN (
        'SANCTUARY_AI', 'USER_REPORT', 'MANUAL_REVIEW', 'AUTO_RECOVERY', 'SYSTEM'
    )),

    -- Optional: Verweis auf Incident
    incident_id UUID REFERENCES incident_safe_vault(id),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_score_history_user ON safety_score_history(user_id, created_at DESC);

-- ═══════════════════════════════════════
-- 5. BLOCKED KEYWORDS (Profile Name Scanner)
-- Dynamische Blacklist für Profilnamen
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS blocked_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'EXPLICIT', 'HATE_SPEECH', 'GROOMING', 'IMPERSONATION', 'SPAM', 'OTHER'
    )),
    severity VARCHAR(20) DEFAULT 'HIGH' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    is_regex BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    added_by TEXT DEFAULT 'SYSTEM',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_keywords_active ON blocked_keywords(is_active, category);

-- Initiale Keyword-Liste (wird durch guardianMiddleware erweitert)
INSERT INTO blocked_keywords (keyword, category, severity) VALUES
    ('admin', 'IMPERSONATION', 'HIGH'),
    ('moderator', 'IMPERSONATION', 'HIGH'),
    ('support', 'IMPERSONATION', 'HIGH'),
    ('official', 'IMPERSONATION', 'MEDIUM'),
    ('delulu_team', 'IMPERSONATION', 'CRITICAL')
ON CONFLICT (keyword) DO NOTHING;

-- ═══════════════════════════════════════
-- 6. FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════

-- Auto-Update für updated_at
CREATE OR REPLACE FUNCTION update_aegis_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_aegis_profile_updated
    BEFORE UPDATE ON user_safety_profiles
    FOR EACH ROW EXECUTE FUNCTION update_aegis_timestamp();

CREATE TRIGGER trigger_aegis_incident_updated
    BEFORE UPDATE ON incident_safe_vault
    FOR EACH ROW EXECUTE FUNCTION update_aegis_timestamp();

-- ═══════════════════════════════════════
-- 7. AEGIS MATCHING FUNCTION
-- Sichere Abfrage mit Hard-Wall Segmentierung
-- ═══════════════════════════════════════

CREATE OR REPLACE FUNCTION aegis_find_nearby_users(
    p_current_user_id UUID,
    p_user_location GEOGRAPHY,
    p_dynamic_radius_meters FLOAT,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    user_id UUID,
    distance_meters FLOAT,
    safety_score INTEGER
) AS $$
DECLARE
    v_is_adult BOOLEAN;
    v_user_gender TEXT;
    v_safety_score INTEGER;
BEGIN
    -- Hole Status des aktuellen Users
    SELECT sp.is_adult, u.gender, sp.safety_score
    INTO v_is_adult, v_user_gender, v_safety_score
    FROM user_safety_profiles sp
    JOIN users u ON sp.user_id = u.id
    WHERE sp.user_id = p_current_user_id;

    -- Prüfe ob User selbst gebannt ist
    IF v_safety_score < 20 THEN
        RETURN; -- Keine Ergebnisse für gebannte User
    END IF;

    RETURN QUERY
    SELECT
        u.id AS user_id,
        ST_Distance(u.last_location::geography, p_user_location) AS distance_meters,
        sp.safety_score
    FROM users u
    JOIN user_safety_profiles sp ON u.id = sp.user_id
    WHERE
        -- Nicht sich selbst
        u.id != p_current_user_id

        -- HARD-WALL: Alters-Segmentierung
        AND sp.is_adult = v_is_adult

        -- Nicht gebannt
        AND sp.safety_score >= 20
        AND sp.is_device_banned = FALSE

        -- Radar aktiviert
        AND sp.radar_enabled = TRUE
        AND sp.ghost_mode = FALSE

        -- Sichtbarkeits-Filter
        AND (
            sp.visible_to_gender = 'ALL'
            OR (sp.visible_to_gender = 'FEMALE_ONLY' AND v_user_gender = 'female')
            OR (sp.visible_to_gender = 'MALE_ONLY' AND v_user_gender = 'male')
            OR (sp.visible_to_gender = 'VERIFIED_ONLY' AND v_is_adult = TRUE)
        )

        -- Dynamischer Radius
        AND ST_DWithin(
            u.last_location::geography,
            p_user_location,
            p_dynamic_radius_meters
        )
    ORDER BY distance_meters ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════
-- 8. SAFETY SCORE ADJUSTMENT FUNCTION
-- ═══════════════════════════════════════

CREATE OR REPLACE FUNCTION aegis_adjust_safety_score(
    p_user_id UUID,
    p_adjustment INTEGER, -- Positiv oder negativ
    p_reason TEXT,
    p_source TEXT,
    p_incident_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_old_score INTEGER;
    v_new_score INTEGER;
BEGIN
    -- Hole aktuellen Score
    SELECT safety_score INTO v_old_score
    FROM user_safety_profiles
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', p_user_id;
    END IF;

    -- Berechne neuen Score (0-100)
    v_new_score := GREATEST(0, LEAST(100, v_old_score + p_adjustment));

    -- Update Score
    UPDATE user_safety_profiles
    SET
        safety_score = v_new_score,
        score_last_updated = NOW(),
        warning_count = CASE WHEN p_adjustment < 0 THEN warning_count + 1 ELSE warning_count END
    WHERE user_id = p_user_id;

    -- Log History
    INSERT INTO safety_score_history (
        user_id, previous_score, new_score, change_reason, change_source, incident_id
    ) VALUES (
        p_user_id, v_old_score, v_new_score, p_reason, p_source, p_incident_id
    );

    RETURN v_new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════
-- LEGAL COMPLIANCE NOTICE
-- ═══════════════════════════════════════
-- Dieses Schema wurde entwickelt unter Berücksichtigung von:
-- - DSGVO Art. 25 (Privacy by Design)
-- - DSGVO Art. 5 (Datensparsamkeit)
-- - JuSchG §24a (Jugendschutz)
-- - StPO §94 (Beweissicherung)
--
-- Keine personenbezogenen Daten werden unnötig gespeichert.
-- Alle sensiblen Daten sind verschlüsselt oder gehasht.
-- ═══════════════════════════════════════
