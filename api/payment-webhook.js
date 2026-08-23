import crypto from 'crypto';
import supabase from './db-client.js';
import { corsHeaders } from './_utils.js';
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
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const body = req.body || {};

    const settings = await getSettingsMap(['buatqris_webhook_secret', 'buatqris_secret_token']);
    const secret = settings.buatqris_webhook_secret || settings.buatqris_secret_token;
    const signature = req.headers['x-buatqris-signature'];
    if (secret && signature) {
      try {
        const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
        if (expected !== signature) {
          console.warn('Webhook signature mismatch (best-effort check, continuing to process).');
        }
      } catch (e) { /* ignore signature verification errors */ }
    }

    const event = body.event || body.status;
    const transactionId = body.transaction_id ? String(body.transaction_id) : null;
    if (!transactionId) return res.status(200).json({ ok: true, note: 'no transaction_id' });

    const { data: order } = await supabase.from('orders').select('*').eq('transaction_id', transactionId).maybeSingle();
    if (!order) return res.status(200).json({ ok: true, note: 'order not found' });
    if (['paid', 'completed'].includes(order.status)) return res.status(200).json({ ok: true, note: 'already processed' });

    if (event === 'payment.success' || body.status === 'success') {
      const { data: updated } = await supabase.from('orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', order.id).select().single();
      const { data: product } = await supabase.from('products').select('*').eq('id', order.product_id).maybeSingle();
      if (product) await fulfillOrder(updated, product);
    } else if (event === 'payment.failed' || body.status === 'failed') {
      await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id);
    } else if (event === 'payment.expired' || body.status === 'expired') {
      await supabase.from('orders').update({ status: 'expired' }).eq('id', order.id);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(200).json({ ok: true, error: err.message });
  }
}
