import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Tag, Loader2, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch, formatRupiah } from '../lib/api';

interface ProductFull {
  id: number;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  stock: number;
}

export default function Checkout() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState<ProductFull | null>(null);
  const [loading, setLoading] = useState(true);
  const qty = Math.max(1, Number(searchParams.get('qty')) || 1);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherApplied, setVoucherApplied] = useState<{ code: string; discount: number } | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.full_name || user.username);
      setEmail(user.email || '');
      setWhatsapp(user.whatsapp || '');
    }
  }, [user]);

  useEffect(() => {
    fetch(`/api/products?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => setProduct(data))
      .finally(() => setLoading(false));
  }, [slug]);

  const subtotal = product ? Number(product.price) * qty : 0;
  const discount = voucherApplied?.discount || 0;
  const total = Math.max(0, subtotal - discount);

  const applyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setCheckingVoucher(true);
    setVoucherError('');
    try {
      const res = await apiFetch('/validate-voucher', {
        method: 'POST',
        body: JSON.stringify({ code: voucherCode.trim(), subtotal }),
      });
      setVoucherApplied({ code: res.code, discount: res.discount });
    } catch (e: any) {
      setVoucherError(e.message);
      setVoucherApplied(null);
    } finally {
      setCheckingVoucher(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!user && (!name || !email || !whatsapp)) {
      setFormError('Nama, email, dan nomor WhatsApp wajib diisi');
      return;
    }
    if (!product) return;
    setSubmitting(true);
    try {
      const order = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          product_id: product.id,
          quantity: qty,
          voucher_code: voucherApplied?.code || null,
          customer_name: name,
          customer_email: email,
          customer_whatsapp: whatsapp,
        }),
      });
      navigate(`/pesanan/${order.order_code}`);
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <LoadingSpinner label="Memuat checkout..." />
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24">
          <p className="text-slate-400">Produk tidak ditemukan.</p>
          <Link to="/produk" className="text-cyan-400 font-semibold">Kembali ke Produk</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
        <h1 className="font-display text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <form onSubmit={handleSubmit} className="md:col-span-3 glass rounded-2xl p-6 space-y-5">
            <h2 className="font-semibold text-lg">Data Pemesan</h2>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Nama Lengkap</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50"
                placeholder="Nama lengkap Anda"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50"
                placeholder="email@contoh.com"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Nomor WhatsApp</label>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50"
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Kode Voucher / Kupon (opsional)</label>
              <div className="flex gap-2">
                <input
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50"
                  placeholder="Contoh: RANZ10"
                />
                <button
                  type="button"
                  onClick={applyVoucher}
                  disabled={checkingVoucher}
                  className="px-4 py-2.5 rounded-xl border border-cyan-400/40 text-cyan-300 text-sm font-semibold hover:bg-cyan-400/10 flex items-center gap-1.5"
                >
                  {checkingVoucher ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                  Pakai
                </button>
              </div>
              {voucherError && <p className="text-xs text-red-400 mt-1">{voucherError}</p>}
              {voucherApplied && (
                <p className="text-xs text-emerald-400 mt-1">
                  Voucher {voucherApplied.code} diterapkan: -{formatRupiah(voucherApplied.discount)}
                </p>
              )}
            </div>

            {formError && <p className="text-sm text-red-400">{formError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl btn-gradient text-black font-bold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Lanjutkan Pembayaran QRIS
            </button>
          </form>

          <div className="md:col-span-2 glass rounded-2xl p-6 h-fit sticky top-24">
            <h2 className="font-semibold text-lg mb-4">Ringkasan Pesanan</h2>
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="h-14 w-14 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                {product.image_url ? <img src={product.image_url} className="h-full w-full object-cover" /> : <Tag className="h-5 w-5 text-slate-600" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{product.name}</p>
                <p className="text-xs text-slate-500">Qty: {qty}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Diskon</span>
                <span className="text-emerald-400">-{formatRupiah(discount)}</span>
              </div>
              <div className="flex justify-between font-bold text-white text-base pt-2 border-t border-white/10">
                <span>Total</span>
                <span className="text-gradient">{formatRupiah(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
