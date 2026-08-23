import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Server, Clock, User } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch, formatRupiah, STATUS_LABELS } from '../lib/api';

interface Order {
  id: number;
  order_code: string;
  product_name: string;
  total: number;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/orders')
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const activeHosting = orders.filter((o) => (o.status === 'paid' || o.status === 'completed'));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="flex items-center gap-4 mb-10">
          <span className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center">
            <User className="h-6 w-6 text-cyan-300" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">Halo, {user?.full_name || user?.username}!</h1>
            <p className="text-slate-400 text-sm">{user?.email || 'Selamat datang di dashboard RanzCloud Store'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          <div className="glass rounded-2xl p-5 flex items-center gap-4">
            <Package className="h-8 w-8 text-cyan-300" />
            <div>
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-xs text-slate-400">Total Pesanan</p>
            </div>
          </div>
          <div className="glass rounded-2xl p-5 flex items-center gap-4">
            <Server className="h-8 w-8 text-emerald-300" />
            <div>
              <p className="text-2xl font-bold">{activeHosting.length}</p>
              <p className="text-xs text-slate-400">Produk Aktif</p>
            </div>
          </div>
          <div className="glass rounded-2xl p-5 flex items-center gap-4">
            <Clock className="h-8 w-8 text-amber-300" />
            <div>
              <p className="text-2xl font-bold">{orders.filter((o) => o.status === 'pending').length}</p>
              <p className="text-xs text-slate-400">Menunggu Pembayaran</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <h2 className="font-semibold">Riwayat Pesanan</h2>
          </div>
          {loading ? (
            <LoadingSpinner label="Memuat pesanan..." />
          ) : error ? (
            <p className="text-red-400 text-sm p-6">{error}</p>
          ) : orders.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-sm">
              Anda belum memiliki pesanan. <Link to="/produk" className="text-cyan-400 font-semibold">Belanja sekarang</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-white/10">
                    <th className="p-4 font-medium">Kode</th>
                    <th className="p-4 font-medium">Produk</th>
                    <th className="p-4 font-medium">Total</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const st = STATUS_LABELS[o.status] || STATUS_LABELS.pending;
                    return (
                      <tr key={o.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4">
                          <Link to={`/pesanan/${o.order_code}`} className="font-mono text-cyan-300 font-semibold">
                            {o.order_code}
                          </Link>
                        </td>
                        <td className="p-4">{o.product_name}</td>
                        <td className="p-4">{formatRupiah(o.total)}</td>
                        <td className="p-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${st.color}`}>{st.label}</span>
                        </td>
                        <td className="p-4 text-slate-400">{new Date(o.created_at).toLocaleDateString('id-ID')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
