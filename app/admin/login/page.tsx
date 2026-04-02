'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Feather, LogIn, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    setLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError('Email ou senha inválidos');
      } else {
        window.location.href = '/admin';
      }
    } catch (err: any) {
      console.error(err);
      setError('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Feather className="w-10 h-10 text-gold mx-auto mb-3" />
          <h1 className="font-playfair text-2xl text-navy">Painel Administrativo</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy/70 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e: any) => setEmail(e?.target?.value ?? '')}
              className="w-full px-4 py-3 rounded-lg border border-navy/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-navy"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy/70 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e: any) => setPassword(e?.target?.value ?? '')}
              className="w-full px-4 py-3 rounded-lg border border-navy/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-navy"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-navy text-white rounded-lg hover:bg-navy-light transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Entrar
          </button>
        </form>
      </motion.div>
    </div>
  );
}
