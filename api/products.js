import supabase from './db-client.js';
import { corsHeaders, slugify } from './_utils.js';
import { requireAdmin, getToken, getUserFromToken } from './_auth.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { slug, category, type, search, all, id } = req.query;
      let isAdmin = false;
      if (all === '1') {
        const user = await getUserFromToken(getToken(req));
        isAdmin = !!(user && user.role === 'admin');
      }
      let query = supabase.from('products').select('*, categories(id, name, slug, icon)').order('created_at', { ascending: false });
      if (!isAdmin) query = query.eq('is_active', true);
      if (slug) query = query.eq('slug', slug);
      if (id) query = query.eq('id', id);
      if (category) query = query.eq('categories.slug', category);
      if (type) query = query.eq('product_type', type);
      if (search) query = query.ilike('name', `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      let result = data;
      if (category) result = result.filter((p) => p.categories && p.categories.slug === category);
      if (slug) {
        const single = result[0] || null;
        return res.status(200).json(single);
      }
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const admin = await requireAdmin(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const b = req.body;
      if (!b.name || !b.price) return res.status(400).json({ error: 'Nama dan harga produk wajib diisi' });
      const slug = b.slug ? slugify(b.slug) : slugify(b.name + '-' + Math.floor(Math.random() * 1000));
      const payload = {
        name: b.name,
        slug,
        category_id: b.category_id || null,
        description: b.description || null,
        short_description: b.short_description || null,
        price: b.price,
        original_price: b.original_price || null,
        stock: b.stock === undefined || b.stock === '' ? -1 : b.stock,
        image_url: b.image_url || null,
        product_type: b.product_type || 'website',
        delivery_type: b.delivery_type || 'file',
        file_url: b.file_url || null,
        license_note: b.license_note || null,
        pterodactyl_config: b.pterodactyl_config || null,
        features: b.features || [],
        is_active: b.is_active !== undefined ? b.is_active : true,
      };
      const { data, error } = await supabase.from('products').insert(payload).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const admin = await requireAdmin(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const b = req.body;
      if (!b.id) return res.status(400).json({ error: 'id wajib diisi' });
      const update = {
        name: b.name,
        category_id: b.category_id,
        description: b.description,
        short_description: b.short_description,
        price: b.price,
        original_price: b.original_price,
        stock: b.stock,
        image_url: b.image_url,
        product_type: b.product_type,
        delivery_type: b.delivery_type,
        file_url: b.file_url,
        license_note: b.license_note,
        pterodactyl_config: b.pterodactyl_config,
        features: b.features,
        is_active: b.is_active,
      };
      if (b.slug) update.slug = slugify(b.slug);
      Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
      const { data, error } = await supabase.from('products').update(update).eq('id', b.id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const admin = await requireAdmin(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id wajib diisi' });
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Products API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
