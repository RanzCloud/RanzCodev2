import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2, Server, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Username dan password wajib diisi');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    setLoading(true);
    try {
      const user = mode === 'login'
        ? await login(username, password)
        : await signup({ username, email, password, full_name: fullName, whatsapp });
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-grid px-4">
      <div className="w-full max-w-md glass rounded-3xl p-8">
        <div className="flex flex-col items-center mb-8">
          <span className="h-12 w-12 rounded-2xl btn-gradient flex items-center justify-center mb-3">
            <Server className="h-6 w-6 text-black" />
          </span>
          <h1 className="font-display text-xl font-bold">
            Ranz<span className="text-gradient">Cloud</span> Store
          </h1>
          <p className="text-sm text-slate-400 mt-1">{mode === 'login' ? 'Masuk ke akun Anda' : 'Buat akun baru'}</p>
        </div>

        <div className="flex mb-6 rounded-xl bg-white/5 p-1">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-white/10 text-white' : 'text-slate-400'}`}
          >
            Masuk
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'signup' ? 'bg-white/10 text-white' : 'text-slate-400'}`}
          >
            Daftar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50"
              placeholder="Masukkan username"
              autoComplete="username"
            />
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nama Lengkap</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50"
                  placeholder="Nama lengkap"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50"
                  placeholder="email@contoh.com"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nomor WhatsApp</label>
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50 pr-10"
                placeholder="Masukkan password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl btn-gradient text-black font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'login' ? 'Masuk' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          <Link to="/" className="hover:text-slate-300">&larr; Kembali ke Beranda</Link>
        </p>
      </div>
    </div>
  );
}
