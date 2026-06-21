/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ProjectSettings, UserAccount } from '../types';
import { Settings, Shield, User, Key, KeyRound, Plus, Trash2, Save, Undo, Info, AlertTriangle } from 'lucide-react';

interface SettingsPanelProps {
  settings: ProjectSettings;
  users: UserAccount[];
  currentUser: UserAccount;
  onSaveSettings: (settings: ProjectSettings) => void;
  onSaveUsers: (users: UserAccount[]) => void;
  onBack: () => void;
}

export default function SettingsPanel({
  settings,
  users,
  currentUser,
  onSaveSettings,
  onSaveUsers,
  onBack
}: SettingsPanelProps) {
  
  // Settings Form
  const [capitalSocial, setCapitalSocial] = useState(settings.capitalSocial);
  const [devise, setDevise] = useState(settings.devise);
  const [montantPretMin, setMontantPretMin] = useState(settings.montantPretMin);
  const [montantPretMax, setMontantPretMax] = useState(settings.montantPretMax);
  const [dureeMoisDefaut, setDureeMoisDefaut] = useState(settings.dureeMoisDefaut);
  const [tauxSocialMensuel, setTauxSocialMensuel] = useState(settings.tauxSocialMensuel);
  const [tauxEquilibreMensuel, setTauxEquilibreMensuel] = useState(settings.tauxEquilibreMensuel);

  // Accounts Creator Form
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'agent'>('agent');
  const [errorUsr, setErrorUsr] = useState('');

  const handleSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (montantPretMin >= montantPretMax) {
      alert("Erreur: Le montant minimum de prêt doit être strictement inférieur au montant maximal.");
      return;
    }
    
    onSaveSettings({
      capitalSocial: Number(capitalSocial),
      devise,
      montantPretMin: Number(montantPretMin),
      montantPretMax: Number(montantPretMax),
      dureeMoisDefaut: Number(dureeMoisDefaut),
      tauxSocialMensuel: Number(tauxSocialMensuel),
      tauxEquilibreMensuel: Number(tauxEquilibreMensuel)
    });
    alert("Paramètres d'administration de l'ONGD DEBOUT GRANS LACS enregistrés avec succès !");
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorUsr('');

    if (!username.trim() || !password.trim() || !fullName.trim()) {
      setErrorUsr("Tous les champs sont requis pour la création d'un utilisateur.");
      return;
    }

    const exists = users.some(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (exists) {
      setErrorUsr("Ce nom d'utilisateur est déjà utilisé.");
      return;
    }

    const newUser: UserAccount = {
      id: `user_${Date.now()}`,
      username: username.trim().toLowerCase(),
      passwordHash: password,
      role,
      fullName: fullName.trim(),
      createdAt: new Date().toISOString()
    };

    onSaveUsers([...users, newUser]);
    
    // reset form fields
    setUsername('');
    setPassword('');
    setFullName('');
    alert(`Compte ${role === 'admin' ? 'Administrateur' : 'Agent'} de ${fullName} créé avec succès.`);
  };

  const handleDeleteUser = (id: string) => {
    if (id === currentUser.id) {
      alert("Erreur: Vous ne pouvez pas supprimer votre propre compte actif.");
      return;
    }
    if (id === 'user_admin') {
      alert("Erreur: Le compte Coordinateur initial est protégé et ne peut être supprimé.");
      return;
    }

    if (confirm("Êtes-vous certain de vouloir supprimer cet utilisateur ? Cette opération est irréversible.")) {
      const updatedUsers = users.filter(u => u.id !== id);
      onSaveUsers(updatedUsers);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      
      {/* Return Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-sans text-white tracking-tight">
            Paramètres d'Administration Générale
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Mise à jour des finances initiales du projet et coordination des comptes d'agents de l'ONGD.
          </p>
        </div>
        <button
          id="btn-settings-back"
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 text-slate-400 hover:text-white text-xs font-bold bg-slate-900/60 border border-slate-800 rounded-xl transition-all shadow-lg cursor-pointer"
        >
          <Undo className="w-4 h-4" />
          Retour au registre
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1 & 2: Project settings form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSettingsSave} className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
            <div className="bg-slate-950/70 px-6 py-4 border-b border-slate-850 flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wide">
                I. Paramètres du Projet & Capital Social (CDF / USD)
              </h3>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-300">
              
              {/* Capital & Devise */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Capital Social de l'ONGD (Fonds disponible)
                  </label>
                  <input
                    id="set-capital"
                    type="number"
                    required
                    value={capitalSocial}
                    onChange={(e) => setCapitalSocial(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl font-mono text-xs font-bold text-white focus:bg-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1.5 focus:ring-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Devise Monétaire
                  </label>
                  <select
                    id="set-devise"
                    value={devise}
                    onChange={(e) => setDevise(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl font-bold text-slate-300 focus:bg-slate-900 focus:outline-none"
                  >
                    <option value="CDF">CDF (Franc Congolais)</option>
                    <option value="USD">USD (Dollar Américain)</option>
                  </select>
                </div>
              </div>

              {/* Loans Value bounds limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Montant Prêté Minimum
                  </label>
                  <input
                    id="set-minamount"
                    type="number"
                    required
                    value={montantPretMin}
                    onChange={(e) => setMontantPretMin(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl font-mono text-slate-300 focus:bg-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Montant Prêté Maximum (Standard limits)
                  </label>
                  <input
                    id="set-maxamount"
                    type="number"
                    required
                    value={montantPretMax}
                    onChange={(e) => setMontantPretMax(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl font-mono text-white font-bold focus:bg-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Preset interest rates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Proposition Taux Social (% par mois)
                  </label>
                  <input
                    id="set-socialrate"
                    type="number"
                    required
                    value={tauxSocialMensuel}
                    onChange={(e) => setTauxSocialMensuel(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-emerald-400 font-bold font-mono focus:bg-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Proposition Taux Équilibré (% par mois)
                  </label>
                  <input
                    id="set-equilibrerate"
                    type="number"
                    required
                    value={tauxEquilibreMensuel}
                    onChange={(e) => setTauxEquilibreMensuel(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-amber-400 font-bold font-mono focus:bg-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Standard Default month duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Durée Standard des Prêts (Mois)
                  </label>
                  <input
                    id="set-dureedefault"
                    type="number"
                    required
                    min="3"
                    value={dureeMoisDefaut}
                    onChange={(e) => setDureeMoisDefaut(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl font-mono text-slate-200 focus:bg-slate-900 focus:outline-none"
                  />
                </div>

                {/* Status Notice */}
                <div className="bg-[#02231c]/30 rounded-xl border border-[#0d4f3e]/40 p-3 flex gap-2.5 items-start text-emerald-300 leading-normal backdrop-blur-md">
                  <Info className="w-4.5 h-4.5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[10px]">
                    Ces configurations déterminent les filtres d'enregistrement et de calcul du calendrier d'échéances sur les fiches d'engagement.
                  </p>
                </div>
              </div>

            </div>

            {/* Footer Row */}
            <div className="bg-slate-950/70 px-6 py-4 border-t border-slate-850 flex justify-end">
              <button
                id="btn-save-settings"
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer font-sans"
              >
                <Save className="w-4 h-4 text-white" />
                Mettre à Jour les Paramètres
              </button>
            </div>
          </form>

          {/* Accounts List Manager */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden text-xs backdrop-blur-md">
            <div className="bg-slate-950/70 px-6 py-4 border-b border-slate-850">
              <h3 className="text-xs font-black text-white uppercase tracking-wide">
                II. Comptes Administrateurs & Agents existants
              </h3>
            </div>
            <div className="divide-y divide-slate-850 font-sans">
              {users.map((usr) => (
                <div key={usr.id} className="p-4 flex items-center justify-between hover:bg-slate-950/40">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                      usr.role === 'admin' 
                        ? 'bg-amber-950/80 text-amber-400 border-amber-900/40' 
                        : 'bg-emerald-950/80 text-emerald-400 border-emerald-900/40'
                    }`}>
                      {usr.role === 'admin' ? 'AD' : 'AG'}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{usr.fullName}</h4>
                      <div className="text-[10px] text-slate-450 font-mono mt-0.5">
                        <span>ID: {usr.username}</span>
                        <span className="mx-1">•</span>
                        <span>Rôle spécifique: {usr.role === 'admin' ? 'Administrateur' : 'Agent CVEM'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {usr.id === currentUser.id && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900/40">
                        Votre Session
                      </span>
                    )}
                    {usr.id !== 'user_admin' && usr.id !== currentUser.id && (
                      <button
                        onClick={() => handleDeleteUser(usr.id)}
                        className="p-1.5 hover:bg-red-955/40 text-slate-400 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-900/40 cursor-pointer"
                        title="Supprimer le collaborateur"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 3: Accounts creator panel */}
        <div className="space-y-6">
          <form onSubmit={handleCreateUser} className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
            <div className="bg-slate-950/70 px-6 py-4 border-b border-slate-850 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wide">
                Nouveau Compte
              </h3>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-300">
              
              {/* FullName */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Nom Complet du titulaire
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="usr-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Maman Rachel Kibambe"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-650 focus:bg-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Username ID */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Identifiant de Connexion
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    id="usr-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: maman_rachel"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-650 focus:bg-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Mot de passe provisoire
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    id="usr-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ex: 5678"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-650 focus:bg-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Role selection strictly */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Rôle & Droits spécifiques
                </label>
                <select
                  id="usr-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-350 font-semibold focus:bg-slate-900 focus:outline-none"
                >
                  <option value="agent">Agent CVEM (Ecriture, Suivi, Print)</option>
                  <option value="admin">Administrateur ONGD (Full Rights)</option>
                </select>
              </div>

              {errorUsr && (
                <p className="text-[10px] font-bold text-red-400 bg-red-950/40 p-2.5 rounded-lg border border-red-900/40 font-semibold">
                  {errorUsr}
                </p>
              )}

              {/* Warn on agent permissions */}
              <div className="p-3 bg-amber-950/20 rounded-xl border border-amber-900/40 text-[10px] text-amber-400 leading-normal flex gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                <p>
                  Un compte <strong>Agent</strong> ne peut pas modifier les taux d'intérêt, le capital social ou supprimer de fiches.
                </p>
              </div>

            </div>

            {/* Submit Button */}
            <div className="bg-slate-950/70 px-6 py-4 border-t border-slate-850">
              <button
                id="btn-create-account"
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-450 text-slate-950 font-black text-xs rounded-xl shadow transition-all cursor-pointer uppercase tracking-wider font-sans"
              >
                <Plus className="w-4 h-4 text-zinc-950 stroke-[3px]" />
                Enregistrer le Collaborateur
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}
