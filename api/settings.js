import supabase from './db-client.js';
import { corsHeaders } from './_utils.js';
import { requireAdmin } from './_auth.js';

const PUBLIC_KEYS = ['store_name', 'store_tagline', 'contact_whatsapp', 'payment_mode', 'custom_qris_image_url', 'custom_qris_note'];

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const admin = await requireAdmin(req);
      const { data, error } = await supabase.from('app_settings').select('*');
      if (error) throw error;
      const map = {};
      (data || []).forEach((r) => { map[r.key] = r.value; });
      if (!admin) {
        const filtered = {};
        PUBLIC_KEYS.forEach((k) => { if (map[k] !== undefined) filtered[k] = map[k]; });
        return res.status(200).json(filtered);
      }
      return res.status(200).json(map);
    }

    if (req.method === 'PUT') {
      const admin = await requireAdmin(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const { settings } = req.body;
      if (!settings || typeof settings !== 'object') return res.status(400).json({ error: 'settings wajib berupa object' });
      const rows = Object.entries(settings).map(([key, value]) => ({ key, value: value === null || value === undefined ? '' : String(value), updated_at: new Date().toISOString() }));
      const { error } = await supabase.from('app_settings').upsert(rows, { onConflict: 'key' });
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Settings API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
