import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ShieldCheck, LayoutDashboard, LogOut, Server } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navLinks = [
  { to: '/', label: 'Beranda' },
  { to: '/produk', label: 'Produk' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#05070d]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="h-9 w-9 rounded-xl btn-gradient flex items-center justify-center">
            <Server className="h-5 w-5 text-black" />
          </span>
          <span>
            Ranz<span className="text-gradient">Cloud</span> Store
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-300 hover:text-white'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 text-sm font-medium text-violet-300 hover:text-violet-200 px-3 py-2 rounded-lg border border-violet-500/30 bg-violet-500/10"
                >
                  <ShieldCheck className="h-4 w-4" /> Admin Panel
                </Link>
              )}
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-200 hover:text-white px-3 py-2 rounded-lg border border-white/10"
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-red-400 px-2 py-2"
                title="Keluar"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-200 hover:text-white px-3 py-2">
                Masuk
              </Link>
              <Link to="/login?mode=signup" className="text-sm font-semibold px-4 py-2 rounded-lg btn-gradient text-black">
                Daftar
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-slate-200" onClick={() => setOpen((o) => !o)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/5 bg-[#05070d] px-4 py-4 flex flex-col gap-3">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-sm text-slate-200 py-1">
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" onClick={() => setOpen(false)} className="text-sm text-violet-300 py-1">
                  Admin Panel
                </Link>
              )}
              <Link to="/dashboard" onClick={() => setOpen(false)} className="text-sm text-slate-200 py-1">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="text-sm text-red-400 text-left py-1">
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="text-sm text-slate-200 py-1">
                Masuk
              </Link>
              <Link to="/login?mode=signup" onClick={() => setOpen(false)} className="text-sm font-semibold py-2 px-4 rounded-lg btn-gradient text-black text-center">
                Daftar
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
