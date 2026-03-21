-- Corre este SQL no Supabase SQL Editor para permitir remoção de códigos via Admin Panel

CREATE POLICY "invite_codes_delete" ON invite_codes
  FOR DELETE USING (true);
