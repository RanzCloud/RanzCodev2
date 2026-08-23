import supabase from './db-client.js';
import { corsHeaders, computeDiscount } from './_utils.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ error: 'Kode voucher wajib diisi' });

    const { data: voucher } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', String(code).toUpperCase().trim())
      .maybeSingle();

    if (!voucher) return res.status(404).json({ error: 'Kode voucher tidak ditemukan' });
    if (!voucher.is_active) return res.status(400).json({ error: 'Voucher ini sudah tidak aktif' });
    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Voucher ini sudah kedaluwarsa' });
    }
    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
      return res.status(400).json({ error: 'Kuota penggunaan voucher ini sudah habis' });
    }
    if (voucher.min_purchase && Number(subtotal) < Number(voucher.min_purchase)) {
      return res.status(400).json({ error: `Minimal pembelian Rp${Number(voucher.min_purchase).toLocaleString('id-ID')} untuk voucher ini` });
    }

    const discount = computeDiscount(voucher, Number(subtotal) || 0);
    return res.status(200).json({ valid: true, code: voucher.code, kind: voucher.kind, discount_type: voucher.discount_type, discount_value: voucher.discount_value, discount });
  } catch (err) {
    console.error('Validate voucher error:', err);
    return res.status(500).json({ error: err.message });
  }
}
