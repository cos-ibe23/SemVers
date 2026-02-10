-- Add indexes to improve authentication query performance

-- User table indexes
CREATE INDEX IF NOT EXISTS "user_email_idx" ON "user" ("email");
CREATE INDEX IF NOT EXISTS "user_is_system_user_idx" ON "user" ("is_system_user");

-- Session table indexes
CREATE INDEX IF NOT EXISTS "session_token_idx" ON "session" ("token");
CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" ("user_id");

-- Account table indexes
CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account" ("user_id");
CREATE INDEX IF NOT EXISTS "account_provider_id_idx" ON "account" ("provider_id");
