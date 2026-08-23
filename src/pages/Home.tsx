import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, QrCode, Server, Bot, Gamepad2, Globe, ArrowRight, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard, { Product } from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import heroBg from '../assets/hero-bg.jpg';
import ctaBg from '../assets/cta-bg.jpg';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

const categoryIcons: Record<string, any> = {
  'hosting-samp': Server,
  'script-bot': Bot,
  'gamemode-samp': Gamepad2,
  'script-website': Globe,
};

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/categories').then((r) => r.json()),
          fetch('/api/products').then((r) => r.json()),
        ]);
        setCategories(catRes || []);
        setProducts((prodRes || []).slice(0, 8));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="relative overflow-hidden bg-grid">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05070d] via-[#05070d]/80 to-[#05070d]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-cyan-300 bg-cyan-400/10 border border-cyan-400/30 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="h-3.5 w-3.5" /> Pembayaran QRIS Otomatis
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Marketplace <span className="text-gradient">Hosting SA-MP</span><br />
            &amp; Script Digital #1
          </h1>
          <p className="mt-6 text-slate-400 max-w-2xl mx-auto text-base md:text-lg">
            Beli hosting SA-MP berbasis Pterodactyl, script bot, gamemode, dan script website. Bayar dengan QRIS,
            langsung aktif otomatis tanpa menunggu admin.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/produk" className="px-6 py-3 rounded-xl btn-gradient text-black font-semibold flex items-center gap-2 glow-cyan">
              Lihat Semua Produk <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/produk?category=hosting-samp" className="px-6 py-3 rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5">
              Pesan Hosting SA-MP
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { icon: Zap, label: 'Aktivasi Instan' },
              { icon: QrCode, label: 'QRIS Otomatis' },
              { icon: ShieldCheck, label: 'Server Aman' },
              { icon: Server, label: 'Pterodactyl Ready' },
            ].map((f) => (
              <div key={f.label} className="glass rounded-xl p-4 flex flex-col items-center gap-2">
                <f.icon className="h-6 w-6 text-cyan-300" />
                <span className="text-xs text-slate-300 text-center">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold">Kategori Produk</h2>
          <p className="text-slate-400 mt-2 text-sm">Pilih kebutuhan digital Anda</p>
        </div>
        {loading ? (
          <LoadingSpinner label="Memuat kategori..." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {categories.map((c) => {
              const Icon = categoryIcons[c.slug] || Boxes;
              return (
                <Link
                  key={c.id}
                  to={`/produk?category=${c.slug}`}
                  className="glass rounded-2xl p-6 flex flex-col items-center gap-3 text-center card-hover"
                >
                  <span className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center text-2xl">
                    {c.icon || <Icon className="h-6 w-6 text-cyan-300" />}
                  </span>
                  <h3 className="font-semibold text-white text-sm">{c.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{c.description}</p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold">Produk Unggulan</h2>
            <p className="text-slate-400 mt-2 text-sm">Paling banyak dicari pelanggan kami</p>
          </div>
          <Link to="/produk" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1">
            Lihat Semua <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <LoadingSpinner label="Memuat produk..." />
        ) : products.length === 0 ? (
          <p className="text-slate-500 text-center py-10">Belum ada produk tersedia.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl md:text-3xl font-bold">Cara Kerja</h2>
          <p className="text-slate-400 mt-2 text-sm">3 langkah mudah, tanpa ribet</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Pilih Produk', desc: 'Pilih hosting SA-MP, script bot, gamemode, atau script website sesuai kebutuhan Anda.' },
            { step: '02', title: 'Bayar via QRIS', desc: 'Scan QRIS dan selesaikan pembayaran otomatis melalui payment gateway kami.' },
            { step: '03', title: 'Aktif Otomatis', desc: 'Hosting langsung dibuat otomatis via Pterodactyl, script/gamemode langsung terkirim.' },
          ].map((s) => (
            <div key={s.step} className="glass rounded-2xl p-8 relative overflow-hidden">
              <span className="text-5xl font-display font-extrabold text-white/5 absolute top-4 right-6">{s.step}</span>
              <h3 className="font-display font-bold text-xl mb-2 text-gradient">{s.title}</h3>
              <p className="text-sm text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative rounded-3xl overflow-hidden">
          <img src={ctaBg} alt="" className="w-full h-64 md:h-80 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40 flex items-center">
            <div className="px-8 md:px-16 max-w-lg">
              <h3 className="font-display text-2xl md:text-3xl font-bold mb-3">Siap membangun server SA-MP impianmu?</h3>
              <p className="text-slate-300 text-sm mb-6">Aktifkan hosting SA-MP kamu sekarang, otomatis online dalam hitungan menit.</p>
              <Link to="/produk?category=hosting-samp" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl btn-gradient text-black font-semibold">
                Mulai Sekarang <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Boxes(props: any) {
  return <Server {...props} />;
}
