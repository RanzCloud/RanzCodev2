import supabase from './db-client.js';
import { corsHeaders } from './_utils.js';
import { requireAdmin } from './_auth.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: 'Unauthorized' });

    const { fileName, fileBase64, contentType } = req.body;
    if (!fileName || !fileBase64) return res.status(400).json({ error: 'File wajib diisi' });
    const buffer = Buffer.from(fileBase64, 'base64');
    const path = `${Date.now()}-${fileName}`.replace(/\s+/g, '-');
    const { error } = await supabase.storage.from('ranzcloud-assets').upload(path, buffer, {
      contentType: contentType || 'application/octet-stream',
      upsert: true,
    });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('ranzcloud-assets').getPublicUrl(path);
    return res.status(200).json({ url: urlData.publicUrl });
  } catch (err) {
    console.error('Upload API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
