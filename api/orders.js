import supabase from './db-client.js';
import { corsHeaders, computeDiscount, generateOrderCode } from './_utils.js';
import { requireUser, requireAdmin, getToken, getUserFromToken } from './_auth.js';
import { createQrisTransaction } from './_buatqris.js';
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
    if (req.method === 'GET') {
      const { order_code, status } = req.query;
      if (order_code) {
        const { data, error } = await supabase.from('orders').select('*').eq('order_code', order_code).maybeSingle();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
        return res.status(200).json(data);
      }
      const admin = await getUserFromToken(getToken(req));
      if (admin && admin.role === 'admin') {
        let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (status) query = query.eq('status', status);
        const { data, error } = await query;
        if (error) throw error;
        return res.status(200).json(data);
      }
      const user = await requireUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const { data, error } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const b = req.body;
      const user = await requireUser(req);
      if (!b.product_id) return res.status(400).json({ error: 'Produk wajib dipilih' });
      if (!user && (!b.customer_name || !b.customer_email || !b.customer_whatsapp)) {
        return res.status(400).json({ error: 'Nama, email, dan WhatsApp wajib diisi' });
      }

      const { data: product, error: prodErr } = await supabase.from('products').select('*').eq('id', b.product_id).maybeSingle();
      if (prodErr) throw prodErr;
      if (!product || !product.is_active) return res.status(400).json({ error: 'Produk tidak tersedia' });

      const quantity = Math.max(1, Number(b.quantity) || 1);
      if (product.stock !== -1 && product.stock < quantity) {
        return res.status(400).json({ error: 'Stok produk tidak mencukupi' });
      }

      const subtotal = Number(product.price) * quantity;
      let discount = 0;
      let voucher = null;
      if (b.voucher_code) {
        const { data: v } = await supabase.from('vouchers').select('*').eq('code', String(b.voucher_code).toUpperCase().trim()).maybeSingle();
        if (v && v.is_active && (!v.expires_at || new Date(v.expires_at) > new Date()) && (!v.usage_limit || v.used_count < v.usage_limit) && subtotal >= Number(v.min_purchase || 0)) {
          discount = computeDiscount(v, subtotal);
          voucher = v;
        }
      }
      const total = Math.max(0, subtotal - discount);
      const order_code = generateOrderCode();

      const settings = await getSettingsMap(['buatqris_account_id', 'buatqris_secret_token', 'payment_mode', 'custom_qris_image_url', 'custom_qris_note']);
      const paymentMode = settings.payment_mode || 'manual';

      let paymentData = { transaction_id: null, qr_url: null, qris_image: null, payment_url: null };
      if (paymentMode === 'gateway' && settings.buatqris_account_id && settings.buatqris_secret_token) {
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const proto = req.headers['x-forwarded-proto'] || 'https';
        const callback_url = `${proto}://${host}/api/payment-webhook`;
        const result = await createQrisTransaction({
          account_id: settings.buatqris_account_id,
          secret_token: settings.buatqris_secret_token,
          amount: total,
          description: `RanzCloud ${order_code} - ${product.name}`,
          callback_url,
        });
        const d = result?.data || result;
        if (result?.success !== false && d) {
          paymentData = {
            transaction_id: d.transaction_id ? String(d.transaction_id) : null,
            qr_url: d.qr_url || null,
            qris_image: d.qris_image || null,
            payment_url: d.payment_url || null,
          };
        }
      }

      const orderPayload = {
        order_code,
        user_id: user ? user.id : null,
        customer_name: b.customer_name || user?.full_name || user?.username || 'Customer',
        customer_email: b.customer_email || user?.email || null,
        customer_whatsapp: b.customer_whatsapp || user?.whatsapp || null,
        product_id: product.id,
        product_name: product.name,
        product_type: product.product_type,
        quantity,
        subtotal,
        discount,
        voucher_code: voucher ? voucher.code : null,
        total,
        status: 'pending',
        payment_provider: 'buatqris',
        transaction_id: paymentData.transaction_id,
        qr_url: paymentData.qr_url,
        qris_image: paymentData.qris_image,
        payment_url: paymentData.payment_url,
        pterodactyl_status: 'none',
      };

      const { data: order, error } = await supabase.from('orders').insert(orderPayload).select().single();
      if (error) throw error;

      if (voucher) {
        await supabase.from('vouchers').update({ used_count: (voucher.used_count || 0) + 1 }).eq('id', voucher.id);
      }
      if (product.stock !== -1) {
        await supabase.from('products').update({ stock: product.stock - quantity }).eq('id', product.id);
      }

      return res.status(201).json(order);
    }

    if (req.method === 'PUT') {
      const admin = await requireAdmin(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const { order_id, action } = req.body;
      if (!order_id || !action) return res.status(400).json({ error: 'order_id dan action wajib diisi' });
      const { data: order, error: getErr } = await supabase.from('orders').select('*').eq('id', order_id).maybeSingle();
      if (getErr) throw getErr;
      if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

      if (action === 'mark_paid') {
        const { data: updated, error } = await supabase.from('orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', order_id).select().single();
        if (error) throw error;
        const { data: product } = await supabase.from('products').select('*').eq('id', order.product_id).maybeSingle();
        if (product) await fulfillOrder(updated, product);
        const { data: finalOrder } = await supabase.from('orders').select('*').eq('id', order_id).single();
        return res.status(200).json(finalOrder);
      }

      if (action === 'mark_failed') {
        const { data, error } = await supabase.from('orders').update({ status: 'failed' }).eq('id', order_id).select().single();
        if (error) throw error;
        return res.status(200).json(data);
      }

      if (action === 'retry_provision') {
        const { data: product } = await supabase.from('products').select('*').eq('id', order.product_id).maybeSingle();
        if (product) await fulfillOrder(order, product);
        const { data: finalOrder } = await supabase.from('orders').select('*').eq('id', order_id).single();
        return res.status(200).json(finalOrder);
      }

      return res.status(400).json({ error: 'Aksi tidak dikenal' });
    }

    if (req.method === 'DELETE') {
      const admin = await requireAdmin(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id wajib diisi' });
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Orders API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
