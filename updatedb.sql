-- Create app_settings key/value store for application settings (idempotent)
CREATE TABLE IF NOT EXISTS app_settings (
    "key" VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL
);


