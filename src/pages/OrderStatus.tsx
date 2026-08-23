import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle, Copy, MessageCircle, Server } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatRupiah, STATUS_LABELS } from '../lib/api';

interface Order {
  id: number;
  order_code: string;
  product_name: string;
  quantity: number;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  qr_url: string | null;
  qris_image: string | null;
  payment_url: string | null;
  delivery_content: string | null;
  customer_whatsapp: string | null;
  created_at: string;
}

interface PublicSettings {
  store_name?: string;
  contact_whatsapp?: string;
  payment_mode?: string;
  custom_qris_image_url?: string;
  custom_qris_note?: string;
}

export default function OrderStatus() {
  const { order_code } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<PublicSettings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then(setSettings).catch(() => {});
  }, []);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/payment-status?order_code=${order_code}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat pesanan');
      setOrder(data);
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    pollRef.current = window.setInterval(() => {
      fetchOrder();
    }, 5000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order_code]);

  useEffect(() => {
    if (order && ['paid', 'completed', 'failed', 'expired'].includes(order.status) && pollRef.current) {
      window.clearInterval(pollRef.current);
    }
  }, [order]);

  const copyCode = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.order_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <LoadingSpinner label="Memuat pesanan..." />
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24">
          <XCircle className="h-10 w-10 text-red-400" />
          <p className="text-slate-400">{error || 'Pesanan tidak ditemukan'}</p>
          <Link to="/produk" className="text-cyan-400 font-semibold">Kembali ke Produk</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isPending = order.status === 'pending';
  const isPaid = order.status === 'paid' || order.status === 'completed';
  const isFailed = order.status === 'failed' || order.status === 'expired';
  const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
  const qrImage = order.qris_image
    ? `data:image/png;base64,${order.qris_image}`
    : order.qr_url || settings.custom_qris_image_url || '';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="glass rounded-3xl p-8 text-center">
          {isPending && <Clock className="h-12 w-12 text-amber-400 mx-auto animate-pulse" />}
          {isPaid && <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />}
          {isFailed && <XCircle className="h-12 w-12 text-red-400 mx-auto" />}

          <h1 className="font-display text-2xl font-bold mt-4">
            {isPending && 'Menunggu Pembayaran'}
            {isPaid && 'Pembayaran Berhasil!'}
            {isFailed && 'Pembayaran Gagal / Kedaluwarsa'}
          </h1>
          <p className="text-slate-400 text-sm mt-2">Kode Pesanan</p>
          <button onClick={copyCode} className="mt-1 inline-flex items-center gap-2 font-mono font-bold text-lg text-cyan-300">
            {order.order_code} <Copy className="h-4 w-4" />
          </button>
          {copied && <p className="text-xs text-emerald-400">Kode disalin!</p>}

          <div className="mt-6 flex justify-center">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${statusInfo.color}`}>{statusInfo.label}</span>
          </div>

          <div className="mt-8 text-left glass rounded-2xl p-5 space-y-2 text-sm">
            <div className="flex justify-between text-slate-400"><span>Produk</span><span className="text-white">{order.product_name} x{order.quantity}</span></div>
            <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{formatRupiah(order.subtotal)}</span></div>
            <div className="flex justify-between text-slate-400"><span>Diskon</span><span className="text-emerald-400">-{formatRupiah(order.discount)}</span></div>
            <div className="flex justify-between font-bold text-white pt-2 border-t border-white/10"><span>Total Bayar</span><span className="text-gradient">{formatRupiah(order.total)}</span></div>
          </div>

          {isPending && (
            <div className="mt-8">
              {qrImage ? (
                <div className="bg-white p-4 rounded-2xl inline-block">
                  <img src={qrImage} alt="QRIS" className="h-56 w-56 object-contain" />
                </div>
              ) : (
                <p className="text-slate-500 text-sm">QRIS belum tersedia. Silakan hubungi admin untuk instruksi pembayaran.</p>
              )}
              <p className="text-xs text-slate-500 mt-3">Scan menggunakan aplikasi mobile banking / e-wallet apapun yang mendukung QRIS.</p>
              {settings.custom_qris_note && (
                <p className="text-xs text-slate-400 mt-3 bg-white/5 rounded-lg p-3">{settings.custom_qris_note}</p>
              )}
              <p className="text-xs text-amber-400/80 mt-4 animate-pulse">Halaman ini akan diperbarui otomatis setiap beberapa detik...</p>
              <a
                href={`https://wa.me/${(settings.contact_whatsapp || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo admin, saya sudah bayar pesanan ${order.order_code}, mohon dikonfirmasi.`)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
              >
                <MessageCircle className="h-4 w-4" /> Konfirmasi manual via WhatsApp
              </a>
            </div>
          )}

          {isPaid && (
            <div className="mt-8 text-left">
              <div className="flex items-center gap-2 mb-3">
                <Server className="h-5 w-5 text-cyan-400" />
                <h3 className="font-semibold">Detail Pengiriman Produk</h3>
              </div>
              <pre className="whitespace-pre-wrap text-sm bg-black/40 border border-white/10 rounded-xl p-4 text-slate-200 font-sans">
                {order.delivery_content || 'Produk Anda sedang diproses, mohon tunggu sebentar...'}
              </pre>
            </div>
          )}

          {isFailed && (
            <p className="mt-8 text-sm text-slate-400">
              Silakan buat pesanan baru atau hubungi admin jika Anda merasa sudah melakukan pembayaran.
            </p>
          )}

          <Link to="/produk" className="inline-block mt-8 text-sm font-semibold text-cyan-300 hover:text-cyan-200">
            &larr; Kembali Belanja
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
