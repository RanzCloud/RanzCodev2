import supabase from './db-client.js';
import { corsHeaders } from './_utils.js';
import { checkQrisStatus } from './_buatqris.js';
import { fulfillOrder } from './_pterodactyl.js';

async function getSettingsMap(keys) {
  const { data } = await supabase.from('app_settings').select('*').in('key', keys);
  const map = {};
  (data || []).forEach((r) => { map[r.key] = r.value; });
  return map;
}

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const { order_code } = req.query;
    if (!order_code) return res.status(400).json({ error: 'order_code wajib diisi' });

    const { data: order, error } = await supabase.from('orders').select('*').eq('order_code', order_code).maybeSingle();
    if (error) throw error;
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

    if (['paid', 'completed', 'failed', 'expired'].includes(order.status) || !order.transaction_id) {
      return res.status(200).json(order);
    }

    const settings = await getSettingsMap(['buatqris_account_id', 'buatqris_secret_token']);
    if (!settings.buatqris_account_id || !settings.buatqris_secret_token) {
      return res.status(200).json(order);
    }

    const result = await checkQrisStatus({
      account_id: settings.buatqris_account_id,
      secret_token: settings.buatqris_secret_token,
      transaction_id: order.transaction_id,
    });
    const d = result?.data || result;
    const remoteStatus = d?.status;

    if (remoteStatus === 'success' || remoteStatus === 'paid') {
      const { data: updated } = await supabase.from('orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', order.id).select().single();
      const { data: product } = await supabase.from('products').select('*').eq('id', order.product_id).maybeSingle();
      if (product) await fulfillOrder(updated, product);
      const { data: finalOrder } = await supabase.from('orders').select('*').eq('id', order.id).single();
      return res.status(200).json(finalOrder);
    }
    if (remoteStatus === 'expired' || remoteStatus === 'failed') {
      const { data: updated } = await supabase.from('orders').update({ status: remoteStatus }).eq('id', order.id).select().single();
      return res.status(200).json(updated);
    }

    return res.status(200).json(order);
  } catch (err) {
    console.error('Payment status error:', err);
    return res.status(500).json({ error: err.message });
  }
}
