-- Site notifications (banners)
CREATE TABLE IF NOT EXISTS site_notifications (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',  -- info, warning, error, maintenance
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Site lockdown status
CREATE TABLE IF NOT EXISTS site_status (
  id SERIAL PRIMARY KEY,
  is_locked BOOLEAN DEFAULT false,
  lock_title VARCHAR(255) DEFAULT 'Site Under Maintenance',
  lock_message TEXT,
  lock_html TEXT,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by VARCHAR(255)
);

-- Insert default row if not exists
INSERT INTO site_status (id, is_locked) VALUES (1, false) ON CONFLICT (id) DO NOTHING;

-- Environment/Config storage (for syncing to .env)
CREATE TABLE IF NOT EXISTS app_config (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default Discord config placeholders
INSERT INTO app_config (key, value, description) VALUES 
  ('DISCORD_BOT_TOKEN', '', 'Discord bot token from developer portal'),
  ('DISCORD_GUILD_ID', '', 'Your Discord server ID'),
  ('DISCORD_CHANNEL_ID', '', 'Optional channel for bot logs')
ON CONFLICT (key) DO NOTHING;
