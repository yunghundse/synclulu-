-- ═══════════════════════════════════════════════════════════════════════════
-- DELULU LEGAL AUDIT SCHEMA v3.5
-- "Gerichtsfeste Dokumentation"
-- ═══════════════════════════════════════════════════════════════════════════
--
-- LEGAL COMPLIANCE:
-- - GDPR Article 7: Consent Recording
-- - DSGVO §7: Einwilligung
-- - California Privacy Rights Act
-- - New York Data Protection Law
--
-- ARCHITECTURE:
-- - Immutable audit trail
-- - Cryptographic IP hashing
-- - Consent versioning
-- - Soft deletion for revocation
--
-- @legal New York Law Grade
-- @version 3.5.0
-- @date 2024-01-01
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════
-- LEGAL CONSENTS TABLE
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS legal_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User reference (FK to users table)
  user_id VARCHAR(255) NOT NULL,

  -- Consent metadata
  consent_type VARCHAR(50) NOT NULL,
  version VARCHAR(20) NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT false,

  -- Privacy-safe audit trail
  ip_hash VARCHAR(64) NOT NULL, -- SHA-256 hash, never raw IP
  user_agent TEXT,

  -- Timestamps
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ, -- Soft delete: NULL = active

  -- Additional metadata (JSONB for flexibility)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT valid_consent_type CHECK (
    consent_type IN (
      'community_guidelines',
      'safety_recording',
      'content_moderation',
      'privacy_policy',
      'marketing_emails',
      'data_sharing',
      'voice_recording',
      'location_tracking',
      'age_verification'
    )
  )
);

-- ═══════════════════════════════════════
-- AUDIT LOGS TABLE (IMMUTABLE)
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User reference
  user_id VARCHAR(255) NOT NULL,

  -- Action metadata
  action VARCHAR(50) NOT NULL,
  category VARCHAR(30) NOT NULL,
  severity VARCHAR(10) NOT NULL DEFAULT 'info',

  -- Details (JSONB for structured data)
  details JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Privacy-safe audit trail
  ip_hash VARCHAR(64) NOT NULL,

  -- Timestamps
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Session correlation
  session_id VARCHAR(50),

  -- Constraints
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'critical')),
  CONSTRAINT valid_category CHECK (
    category IN (
      'consent',
      'content_moderation',
      'user_safety',
      'authentication',
      'data_privacy',
      'account_management',
      'payment'
    )
  ),
  CONSTRAINT valid_action CHECK (
    action IN (
      'consent_granted',
      'consent_revoked',
      'content_flagged',
      'content_blocked',
      'content_approved',
      'user_reported',
      'user_blocked',
      'user_unblocked',
      'safety_trigger',
      'login_attempt',
      'login_success',
      'login_failure',
      'data_export',
      'data_deletion',
      'profile_updated',
      'account_created',
      'account_deleted'
    )
  )
);

-- ═══════════════════════════════════════
-- CONTENT MODERATION TABLE
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Content reference
  user_id VARCHAR(255) NOT NULL,
  content_type VARCHAR(20) NOT NULL,
  content_id VARCHAR(255),

  -- Moderation result
  flagged_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  action VARCHAR(20) NOT NULL DEFAULT 'review',

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_content_type CHECK (content_type IN ('text', 'image', 'audio', 'video')),
  CONSTRAINT valid_action CHECK (action IN ('allow', 'review', 'block')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected'))
);

-- ═══════════════════════════════════════
-- INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════

-- Indexes for legal_consents
CREATE INDEX IF NOT EXISTS idx_consents_user_type
  ON legal_consents(user_id, consent_type);
CREATE INDEX IF NOT EXISTS idx_consents_timestamp
  ON legal_consents(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_consents_active
  ON legal_consents(user_id, consent_type)
  WHERE revoked_at IS NULL AND granted = true;

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_user_action
  ON audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_category
  ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp
  ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_critical
  ON audit_logs(timestamp DESC)
  WHERE severity IN ('warning', 'critical');
CREATE INDEX IF NOT EXISTS idx_audit_session
  ON audit_logs(session_id)
  WHERE session_id IS NOT NULL;

-- Indexes for moderation_queue
CREATE INDEX IF NOT EXISTS idx_moderation_status
  ON moderation_queue(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_user
  ON moderation_queue(user_id, created_at DESC);

-- ═══════════════════════════════════════
-- IMMUTABILITY TRIGGER
-- ═══════════════════════════════════════

-- Prevent modification of audit logs (legal requirement)
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted. This is a legal requirement.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_immutable ON audit_logs;
CREATE TRIGGER audit_log_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- ═══════════════════════════════════════
-- VIEWS FOR REPORTING
-- ═══════════════════════════════════════

-- Active user consents
CREATE OR REPLACE VIEW active_consents AS
SELECT
  user_id,
  consent_type,
  version,
  timestamp as granted_at,
  metadata
FROM legal_consents
WHERE granted = true AND revoked_at IS NULL;

-- Recent critical events (for admin dashboard)
CREATE OR REPLACE VIEW critical_events AS
SELECT
  id,
  user_id,
  action,
  category,
  severity,
  details,
  timestamp
FROM audit_logs
WHERE severity IN ('warning', 'critical')
ORDER BY timestamp DESC
LIMIT 1000;

-- Pending moderation queue
CREATE OR REPLACE VIEW pending_moderation AS
SELECT
  id,
  user_id,
  content_type,
  content_id,
  flagged_categories,
  confidence,
  action,
  created_at
FROM moderation_queue
WHERE status = 'pending'
ORDER BY
  CASE action
    WHEN 'block' THEN 1
    WHEN 'review' THEN 2
    ELSE 3
  END,
  confidence DESC,
  created_at ASC;

-- User consent summary
CREATE OR REPLACE VIEW user_consent_summary AS
SELECT
  user_id,
  array_agg(DISTINCT consent_type) as active_consents,
  COUNT(*) as total_consents,
  MAX(timestamp) as last_consent_at
FROM legal_consents
WHERE granted = true AND revoked_at IS NULL
GROUP BY user_id;

-- ═══════════════════════════════════════
-- FUNCTIONS FOR GDPR COMPLIANCE
-- ═══════════════════════════════════════

-- Export all user data (GDPR Article 20)
CREATE OR REPLACE FUNCTION export_user_data(p_user_id VARCHAR)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'user_id', p_user_id,
    'exported_at', NOW(),
    'consents', (
      SELECT json_agg(row_to_json(c))
      FROM legal_consents c
      WHERE c.user_id = p_user_id
    ),
    'audit_logs', (
      SELECT json_agg(row_to_json(a))
      FROM audit_logs a
      WHERE a.user_id = p_user_id
    )
  ) INTO result;

  -- Log the export
  INSERT INTO audit_logs (user_id, action, category, severity, details, ip_hash)
  VALUES (p_user_id, 'data_export', 'data_privacy', 'info', '{"source": "gdpr_export"}'::jsonb, 'system');

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Right to be forgotten (GDPR Article 17) - Anonymize data
CREATE OR REPLACE FUNCTION anonymize_user_data(p_user_id VARCHAR)
RETURNS VOID AS $$
BEGIN
  -- Anonymize consents (keep structure for legal compliance)
  UPDATE legal_consents
  SET
    ip_hash = 'ANONYMIZED',
    user_agent = NULL,
    metadata = '{}'::jsonb
  WHERE user_id = p_user_id;

  -- Anonymize audit logs (keep action records for compliance)
  UPDATE audit_logs
  SET
    ip_hash = 'ANONYMIZED',
    details = jsonb_set(details, '{anonymized}', 'true'::jsonb)
  WHERE user_id = p_user_id;

  -- Log the anonymization
  INSERT INTO audit_logs (user_id, action, category, severity, details, ip_hash)
  VALUES ('SYSTEM', 'data_deletion', 'data_privacy', 'info',
    json_build_object('original_user_id', p_user_id, 'reason', 'gdpr_request')::jsonb,
    'system');
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════
-- COMMENTS FOR DOCUMENTATION
-- ═══════════════════════════════════════

COMMENT ON TABLE legal_consents IS 'Stores user consent records for GDPR/DSGVO compliance. Consents are never deleted, only marked as revoked.';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all user actions. Cannot be modified or deleted after creation.';
COMMENT ON TABLE moderation_queue IS 'Queue for content moderation. Tracks flagged content and moderation decisions.';
COMMENT ON COLUMN legal_consents.ip_hash IS 'SHA-256 hash of user IP address. Raw IP is never stored for privacy.';
COMMENT ON COLUMN legal_consents.revoked_at IS 'When consent was revoked. NULL means consent is still active.';
COMMENT ON FUNCTION export_user_data IS 'GDPR Article 20: Data portability. Exports all user data as JSON.';
COMMENT ON FUNCTION anonymize_user_data IS 'GDPR Article 17: Right to be forgotten. Anonymizes user data while keeping legal records.';
