/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount } from '../types';
import { Shield, User, Lock, Heart, Users } from 'lucide-react';

interface LoginScreenProps {
  users: UserAccount[];
  onLogin: (user: UserAccount) => void;
}

export default function LoginScreen({ users, onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.passwordHash === password
    );

    if (user) {
      onLogin(user);
    } else {
      setError('Identifiants incorrects. Veuillez réessayer.');
    }
  };

  const handleQuickLogin = (role: 'admin' | 'agent') => {
    const user = users.find((u) => u.role === role);
    if (user) {
      setUsername(user.username);
      setPassword(user.passwordHash);
      setError('');
    }
  };
  return (
    <div id="login-container" className="min-h-screen flex items-center justify-center bg-[#020617] p-4 immersive-gradient">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-850 overflow-hidden transition-all duration-300">
        
        {/* Banner with logo info */}
        <div className="bg-slate-950 p-8 text-white relative overflow-hidden border-b border-slate-850">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl -ml-10 -mb-10"></div>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-emerald-500 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                Plateforme de Micro-crédit
              </span>
              <h1 className="text-xl font-extrabold font-display tracking-tight text-white">
                ONGD DEBOUT GRANDS LACS
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
            ONGD - Autonomisation socio-économique des membres de l'église CVEM
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          <h2 className="text-lg font-bold text-white mb-6 font-display">
            Connexion au portail administratif
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <User className="w-4.5 h-4.5" />
                </span>
                <input
                  id="login-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:bg-slate-900 focus:outline-none focus:ring-1.5 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
                  placeholder="Ex: admin, maman_sarah"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:bg-slate-900 focus:outline-none focus:ring-1.5 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs font-semibold text-red-400 bg-red-950/35 p-3.5 rounded-xl border border-red-900/50 animate-pulse">
                {error}
              </p>
            )}

            <button
              id="login-submit-btn"
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/15 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4 text-emerald-100" />
              S'authentifier avec succès
            </button>
          </form>

          {/* Quick simulation accounts helper */}
          <div className="mt-8 pt-6 border-t border-slate-850">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              Comptes de démonstration (Accès Rapide)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                id="quick-login-admin"
                onClick={() => handleQuickLogin('admin')}
                className="p-3 bg-amber-950/20 hover:bg-amber-950/35 border border-amber-900/35 rounded-xl text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-400">Admin</span>
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                </div>
                <span className="block text-[9px] text-slate-400 font-mono">admin / admin123</span>
              </button>

              <button
                id="quick-login-agent"
                onClick={() => handleQuickLogin('agent')}
                className="p-3 bg-emerald-950/20 hover:bg-emerald-950/35 border border-emerald-900/35 rounded-xl text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-400">Agent</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                </div>
                <span className="block text-[9px] text-slate-400 font-mono">agent / agent123</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-950/50 px-8 py-4 border-t border-slate-850 text-center text-slate-500">
          <p className="text-[10px] font-mono uppercase tracking-widest">
            Kinshasa, République Démocratique du Congo
          </p>
        </div>
      </div>
    </div>
  );
}
