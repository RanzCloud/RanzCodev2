import crypto from 'crypto';
import supabase from './db-client.js';

export function genSalt() {
  return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 64).toString('hex');
}

export function genToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function createSession(userId) {
  const token = genToken();
  const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from('sessions').insert({ token, user_id: userId, expires_at });
  if (error) throw error;
  return token;
}

export function getToken(req) {
  const h = req.headers.authorization || req.headers.Authorization || '';
  if (typeof h === 'string' && h.startsWith('Bearer ')) return h.slice(7).trim();
  return null;
}

export async function getUserFromToken(token) {
  if (!token) return null;
  const { data: session } = await supabase.from('sessions').select('*').eq('token', token).maybeSingle();
  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) return null;
  const { data: user } = await supabase
    .from('users')
    .select('id, username, email, role, full_name, whatsapp, created_at')
    .eq('id', session.user_id)
    .maybeSingle();
  return user || null;
}

export async function requireUser(req) {
  const token = getToken(req);
  return await getUserFromToken(token);
}

export async function requireAdmin(req) {
  const user = await requireUser(req);
  if (!user || user.role !== 'admin') return null;
  return user;
}
