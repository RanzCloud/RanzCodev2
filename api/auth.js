import supabase from './db-client.js';
import { corsHeaders } from './_utils.js';
import { hashPassword, genSalt, createSession, getUserFromToken, getToken } from './_auth.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const token = getToken(req);
      const user = await getUserFromToken(token);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      return res.status(200).json(user);
    }

    if (req.method === 'POST') {
      const { action } = req.body || {};

      if (action === 'signup') {
        const { username, email, password, full_name, whatsapp } = req.body;
        if (!username || !password || String(password).length < 6) {
          return res.status(400).json({ error: 'Username & password (minimal 6 karakter) wajib diisi' });
        }
        const orFilter = email ? `username.eq.${username},email.eq.${email}` : `username.eq.${username}`;
        const { data: existing } = await supabase.from('users').select('id').or(orFilter);
        if (existing && existing.length) {
          return res.status(400).json({ error: 'Username atau email sudah terdaftar' });
        }
        const salt = genSalt();
        const password_hash = hashPassword(password, salt);
        const { data: user, error } = await supabase
          .from('users')
          .insert({ username, email: email || null, password_hash, salt, role: 'user', full_name: full_name || null, whatsapp: whatsapp || null })
          .select('id, username, email, role, full_name, whatsapp, created_at')
          .single();
        if (error) throw error;
        const token = await createSession(user.id);
        return res.status(201).json({ user, token });
      }

      if (action === 'login') {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username dan password wajib diisi' });
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .or(`username.eq.${username},email.eq.${username}`)
          .maybeSingle();
        if (!user) return res.status(401).json({ error: 'Akun tidak ditemukan' });
        const hash = hashPassword(password, user.salt);
        if (hash !== user.password_hash) return res.status(401).json({ error: 'Password salah' });
        const token = await createSession(user.id);
        const { password_hash, salt, ...safe } = user;
        return res.status(200).json({ user: safe, token });
      }

      if (action === 'logout') {
        const token = getToken(req);
        if (token) await supabase.from('sessions').delete().eq('token', token);
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: 'Aksi tidak dikenal' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Auth API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
