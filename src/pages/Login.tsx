import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(email, password);
    if (success) {
      navigate('/');
    } else {
      setError('Invalid credentials. Try the quick-login cards below.');
    }
  };

  const quickLogin = (userEmail: string) => {
    const success = login(userEmail, 'demo');
    if (success) navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--momento-bg)]">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto bg-white/70 backdrop-blur-md border border-white/60 rounded-3xl flex items-center justify-center shadow-lg">
            <span className="text-3xl">✦</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-widest">MOMENTO</h1>
          <p className="text-sm text-gray-500 font-medium">The Generative City-Wallet</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl p-5 space-y-4 shadow-sm">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center font-medium">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 rounded-2xl text-white font-bold text-lg shadow-[0_4px_14px_rgba(232,145,58,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Sign In
          </button>
        </form>

        {/* Quick login */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="h-px bg-gray-300 flex-1" />
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Quick Demo</p>
            <div className="h-px bg-gray-300 flex-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => quickLogin('mia@demo.momento')}
              className="bg-white/70 backdrop-blur-md border border-white/60 py-4 rounded-2xl text-center hover:border-amber-400 hover:shadow-md transition-all shadow-sm group"
            >
              <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">👩🏼</div>
              <div className="text-sm text-gray-900 font-semibold">Mia Weber</div>
              <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">Consumer</div>
            </button>
            <button
              onClick={() => quickLogin('hans@demo.momento')}
              className="bg-white/70 backdrop-blur-md border border-white/60 py-4 rounded-2xl text-center hover:border-amber-400 hover:shadow-md transition-all shadow-sm group"
            >
              <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">👨🏻‍🍳</div>
              <div className="text-sm text-gray-900 font-semibold">Hans Müller</div>
              <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">Merchant</div>
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-400 pt-2">
          MOMENTO × DSV Gruppe · Hack-Nation 2026
        </p>
      </div>
    </div>
  );
}
