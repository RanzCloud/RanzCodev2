import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Boxes, Minus, Plus, ShieldCheck, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatRupiah, PRODUCT_TYPE_LABELS } from '../lib/api';

interface ProductFull {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  product_type: string;
  delivery_type: string;
  stock: number;
  features: string[];
  categories?: { name: string; slug: string; icon?: string } | null;
}

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data) {
          setError('Produk tidak ditemukan');
        } else {
          setProduct(data);
        }
      })
      .catch(() => setError('Gagal memuat produk'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <LoadingSpinner fullscreen={false} label="Memuat produk..." />
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-slate-400">{error || 'Produk tidak ditemukan'}</p>
          <Link to="/produk" className="text-cyan-400 font-semibold">Kembali ke Produk</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const discountPct = product.original_price
    ? Math.round(100 - (Number(product.price) / Number(product.original_price)) * 100)
    : 0;
  const outOfStock = product.stock !== -1 && product.stock <= 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="rounded-3xl overflow-hidden glass h-72 md:h-96 flex items-center justify-center">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Boxes className="h-20 w-20 text-slate-700" />
            )}
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/30">
              {PRODUCT_TYPE_LABELS[product.product_type] || product.product_type}
            </span>
            <h1 className="font-display text-3xl font-bold mt-4">{product.name}</h1>
            <p className="text-slate-400 mt-3 text-sm">{product.short_description}</p>

            <div className="mt-6 flex items-end gap-3">
              {product.original_price ? (
                <span className="text-slate-500 line-through text-sm">{formatRupiah(product.original_price)}</span>
              ) : null}
              <span className="text-3xl font-bold text-gradient font-display">{formatRupiah(product.price)}</span>
              {discountPct > 0 && (
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  Hemat {discountPct}%
                </span>
              )}
            </div>

            {product.features?.length ? (
              <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center border border-white/10 rounded-xl overflow-hidden">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 hover:bg-white/5">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 font-semibold w-10 text-center">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="p-3 hover:bg-white/5">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                disabled={outOfStock}
                onClick={() => navigate(`/checkout/${product.slug}?qty=${qty}`)}
                className="flex-1 py-3.5 rounded-xl btn-gradient text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {outOfStock ? 'Stok Habis' : 'Beli Sekarang'}
              </button>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Pembayaran aman via QRIS &bull; Aktif otomatis setelah bayar
            </div>
          </div>
        </div>

        <div className="mt-14 glass rounded-2xl p-8">
          <h2 className="font-display font-bold text-xl mb-4">Deskripsi Produk</h2>
          <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
