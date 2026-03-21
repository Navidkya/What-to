CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  handle TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('base','silver','gold')),
  platform TEXT DEFAULT 'instagram',
  used BOOLEAN DEFAULT false,
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Só o serviço (service role) pode inserir/ler códigos
-- A app pode verificar se um código existe e está por usar
CREATE POLICY "invite_codes_read" ON invite_codes
  FOR SELECT USING (true);

CREATE POLICY "invite_codes_update" ON invite_codes
  FOR UPDATE USING (true);
