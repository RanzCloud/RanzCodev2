import supabase from './db-client.js';
import { corsHeaders, slugify } from './_utils.js';
import { requireAdmin } from './_auth.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const admin = await requireAdmin(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const { name, description, icon } = req.body;
      if (!name) return res.status(400).json({ error: 'Nama kategori wajib diisi' });
      const slug = req.body.slug ? slugify(req.body.slug) : slugify(name);
      const { data, error } = await supabase
        .from('categories')
        .insert({ name, slug, description: description || null, icon: icon || null })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const admin = await requireAdmin(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const { id, name, description, icon } = req.body;
      if (!id) return res.status(400).json({ error: 'id wajib diisi' });
      const update = { name, description, icon };
      if (req.body.slug) update.slug = slugify(req.body.slug);
      Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
      const { data, error } = await supabase.from('categories').update(update).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const admin = await requireAdmin(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id wajib diisi' });
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Categories API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
