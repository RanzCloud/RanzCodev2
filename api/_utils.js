export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';
}

export function generateOrderCode() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RCS-${ts}-${rnd}`;
}

export function computeDiscount(voucher, subtotal) {
  if (!voucher) return 0;
  let discount = 0;
  if (voucher.discount_type === 'percent') {
    discount = (subtotal * Number(voucher.discount_value)) / 100;
    if (voucher.max_discount) discount = Math.min(discount, Number(voucher.max_discount));
  } else {
    discount = Number(voucher.discount_value);
  }
  return Math.min(discount, subtotal);
}

export function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
