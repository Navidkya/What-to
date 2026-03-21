-- Influencers
CREATE TABLE IF NOT EXISTS influencers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  handle TEXT NOT NULL,
  bio TEXT DEFAULT '',
  platform TEXT DEFAULT 'instagram',
  tier TEXT DEFAULT 'base' CHECK (tier IN ('base','silver','gold')),
  allowed_cats TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('active','pending','blocked')),
  invite_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Influencer suggestions
CREATE TABLE IF NOT EXISTS influencer_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  influencer_id UUID REFERENCES influencers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  desc TEXT DEFAULT '',
  emoji TEXT DEFAULT '✦',
  cat_id TEXT NOT NULL,
  cat TEXT NOT NULL,
  type TEXT DEFAULT '',
  genre TEXT DEFAULT '',
  img TEXT,
  rating NUMERIC,
  year TEXT,
  duration TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Creator applications
CREATE TABLE IF NOT EXISTS creator_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT NOT NULL,
  platform TEXT DEFAULT 'instagram',
  message TEXT DEFAULT '',
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "influencers_own" ON influencers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "suggestions_own" ON influencer_suggestions FOR ALL USING (
  influencer_id IN (SELECT id FROM influencers WHERE user_id = auth.uid())
);
CREATE POLICY "suggestions_read" ON influencer_suggestions FOR SELECT USING (active = true);
CREATE POLICY "applications_insert" ON creator_applications FOR INSERT WITH CHECK (true);
