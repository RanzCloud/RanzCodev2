import { Link } from 'react-router-dom';
import { Server, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#05070d] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg mb-3">
            <span className="h-9 w-9 rounded-xl btn-gradient flex items-center justify-center">
              <Server className="h-5 w-5 text-black" />
            </span>
            <span>
              Ranz<span className="text-gradient">Cloud</span> Store
            </span>
          </Link>
          <p className="text-sm text-slate-400 leading-relaxed">
            Marketplace hosting SA-MP, script bot, gamemode, dan script website dengan pembayaran QRIS otomatis.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Kategori</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link to="/produk?category=hosting-samp" className="hover:text-cyan-400">Hosting SA-MP</Link></li>
            <li><Link to="/produk?category=script-bot" className="hover:text-cyan-400">Script Bot</Link></li>
            <li><Link to="/produk?category=gamemode-samp" className="hover:text-cyan-400">Gamemode SA-MP</Link></li>
            <li><Link to="/produk?category=script-website" className="hover:text-cyan-400">Script Website</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Perusahaan</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link to="/produk" className="hover:text-cyan-400">Semua Produk</Link></li>
            <li><Link to="/login" className="hover:text-cyan-400">Masuk / Daftar</Link></li>
            <li><Link to="/dashboard" className="hover:text-cyan-400">Dashboard Saya</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Kontak</h4>
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-cyan-400" /> WhatsApp Admin: 0812-3456-7890
          </p>
        </div>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} RanzCloud Store. Seluruh hak cipta dilindungi.
      </div>
    </footer>
  );
}
