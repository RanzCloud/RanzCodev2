import supabase from './db-client.js';
import { corsHeaders } from './_utils.js';
import { requireAdmin } from './_auth.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'GET') {
      let query = supabase.from('vouchers').select('*').order('created_at', { ascending: false });
      if (req.query.kind) query = query.eq('kind', req.query.kind);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const b = req.body;
      if (!b.code || !b.discount_value) return res.status(400).json({ error: 'Kode dan nilai diskon wajib diisi' });
      const payload = {
        code: String(b.code).toUpperCase().trim(),
        kind: b.kind || 'voucher',
        discount_type: b.discount_type || 'percent',
        discount_value: b.discount_value,
        min_purchase: b.min_purchase || 0,
        max_discount: b.max_discount || null,
        usage_limit: b.usage_limit || null,
        is_active: b.is_active !== undefined ? b.is_active : true,
        expires_at: b.expires_at || null,
      };
      const { data, error } = await supabase.from('vouchers').insert(payload).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const b = req.body;
      if (!b.id) return res.status(400).json({ error: 'id wajib diisi' });
      const update = {
        kind: b.kind,
        discount_type: b.discount_type,
        discount_value: b.discount_value,
        min_purchase: b.min_purchase,
        max_discount: b.max_discount,
        usage_limit: b.usage_limit,
        is_active: b.is_active,
        expires_at: b.expires_at,
      };
      if (b.code) update.code = String(b.code).toUpperCase().trim();
      Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
      const { data, error } = await supabase.from('vouchers').update(update).eq('id', b.id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id wajib diisi' });
      const { error } = await supabase.from('vouchers').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Vouchers API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
