-- Migration: 20260907120000_create_newsletter_subscriptions.sql
-- Description: Cria tabela privada para captação de e-mails/newsletter da landing page.
-- Specification references: docs/backend_integration_spec.md §4, §6; AGENTS.md

CREATE TABLE IF NOT EXISTS app_private.newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'landing_page',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_newsletter_subscriptions_email UNIQUE (email),
    CONSTRAINT chk_newsletter_subscriptions_status CHECK (status IN ('active', 'unsubscribed'))
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_created_at
ON app_private.newsletter_subscriptions (created_at DESC);

CREATE TRIGGER update_newsletter_subscriptions_updated_at
BEFORE UPDATE ON app_private.newsletter_subscriptions
FOR EACH ROW EXECUTE FUNCTION app_private.update_updated_at_column();

-- Segurança e isolamento: RLS habilitado e sem exposição ao PostgREST (Data API)
ALTER TABLE app_private.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.newsletter_subscriptions FROM PUBLIC, anon, authenticated;
