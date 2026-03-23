import { supabase } from '../lib/supabase';

// Gera sugestão de username baseada no nome
export function suggestUsername(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9_]/g, '_')     // substitui caracteres inválidos por _
    .replace(/_+/g, '_')              // colapsa múltiplos _
    .replace(/^_|_$/g, '')            // remove _ no início/fim
    .substring(0, 20)
    || 'utilizador';
}

// Valida formato do username
export function validateUsername(u: string): string | null {
  if (!u) return 'O username não pode estar vazio';
  if (u.length < 3) return 'Mínimo 3 caracteres';
  if (u.length > 20) return 'Máximo 20 caracteres';
  if (!/^[a-z0-9_]+$/.test(u)) return 'Só letras minúsculas, números e _';
  return null;
}

// Verifica se username está disponível
export async function checkUsernameAvailable(username: string, currentUserId?: string): Promise<boolean> {
  try {
    const query = supabase.from('profiles').select('id').eq('username', username);
    const { data } = await query;
    if (!data || data.length === 0) return true;
    if (currentUserId && data.length === 1 && data[0].id === currentUserId) return true;
    return false;
  } catch { return true; }
}

// Guarda username no Supabase
export async function saveUsername(userId: string, username: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', userId);
    return !error;
  } catch { return false; }
}

// Busca perfil por username
export async function getProfileByUsername(username: string): Promise<{ id: string; name: string; username: string } | null> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, username')
      .eq('username', username)
      .single();
    return data || null;
  } catch { return null; }
}
