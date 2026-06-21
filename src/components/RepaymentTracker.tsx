/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Beneficiaire, Echeance, Paiement, ProjectSettings } from '../types';
import { Calendar, CircleDollarSign, Check, X, ShieldAlert, ArrowLeft, RefreshCw, Printer, AlertCircle } from 'lucide-react';

interface RepaymentTrackerProps {
  beneficiaire: Beneficiaire;
  settings: ProjectSettings;
  onUpdateBeneficiaire: (updated: Beneficiaire) => void;
  onBack: () => void;
  currentUserFullName: string;
  currentUserRole: string;
}

export default function RepaymentTracker({
  beneficiaire,
  settings,
  onUpdateBeneficiaire,
  onBack,
  currentUserFullName,
  currentUserRole
}: RepaymentTrackerProps) {
  
  // 1. Local state for editing expected milestone details
  const [echeances, setEcheances] = useState<Echeance[]>([]);
  
  // Local state for registering payments
  const [p1Amount, setP1Amount] = useState<number>(0);
  const [p1Date, setP1Date] = useState<string>('');
  const [p1Enregistre, setP1Enregistre] = useState<boolean>(false);

  const [p2Amount, setP2Amount] = useState<number>(0);
  const [p2Date, setP2Date] = useState<string>('');
  const [p2Enregistre, setP2Enregistre] = useState<boolean>(false);

  const [p3Amount, setP3Amount] = useState<number>(0);
  const [p3Date, setP3Date] = useState<string>('');
  const [p3Enregistre, setP3Enregistre] = useState<boolean>(false);

  // Sync state on load
  useEffect(() => {
    setEcheances(JSON.parse(JSON.stringify(beneficiaire.echeances)));
    
    // Fill payments
    const p1 = beneficiaire.paiements.find(p => p.numero === 1);
    if (p1) {
      setP1Amount(p1.montantPaye);
      setP1Date(p1.datePaiement);
      setP1Enregistre(true);
    } else {
      setP1Amount(0);
      setP1Date('');
      setP1Enregistre(false);
    }

    const p2 = beneficiaire.paiements.find(p => p.numero === 2);
    if (p2) {
      setP2Amount(p2.montantPaye);
      setP2Date(p2.datePaiement);
      setP2Enregistre(true);
    } else {
      setP2Amount(0);
      setP2Date('');
      setP2Enregistre(false);
    }

    const p3 = beneficiaire.paiements.find(p => p.numero === 3);
    if (p3) {
      setP3Amount(p3.montantPaye);
      setP3Date(p3.datePaiement);
      setP3Enregistre(true);
    } else {
      setP3Amount(0);
      setP3Date('');
      setP3Enregistre(false);
    }
  }, [beneficiaire]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: settings.devise,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // 2. Calculations for Payments Balances
  // Total expected to repay (sum of the current 3 expected milestones)
  const totalExpected = echeances.reduce((acc, curr) => acc + curr.montantPrevu, 0);

  // Balance calculations
  const balanceAfterP1 = totalExpected - (p1Enregistre ? p1Amount : 0);
  const balanceAfterP2 = balanceAfterP1 - (p2Enregistre ? p2Amount : 0);
  const balanceAfterP3 = balanceAfterP2 - (p3Enregistre ? p3Amount : 0);

  // Checks if milestones status aligns with payments recorded
  const handleToggleEcheanceStatut = (numero: number) => {
    const updatedEch = echeances.map(e => {
      if (e.numero === numero) {
        return {
          ...e,
          statut: e.statut === 'reussi' ? 'en_attente' : 'reussi' as const
        };
      }
      return e;
    });
    setEcheances(updatedEch);
  };

  // Modify expected amount or scheduled date of milestones immediately
  const handleModifyEcheancePrevu = (numero: number, updatedPrevu: number, updatedDate: string) => {
    const updatedEch = echeances.map(e => {
      if (e.numero === numero) {
        return {
          ...e,
          montantPrevu: updatedPrevu,
          date: updatedDate
        };
      }
      return e;
    });
    setEcheances(updatedEch);
  };

  // Reset/Save Payment info to DB
  const handleSaveTracking = () => {
    // Generate payments array
    const compiledPaiements: Paiement[] = [];
    
    if (p1Enregistre && p1Amount > 0) {
      compiledPaiements.push({
        numero: 1,
        montantPaye: p1Amount,
        datePaiement: p1Date || new Date().toISOString().split('T')[0],
        soldeRestant: Math.max(0, balanceAfterP1),
        enregistrePar: beneficiaire.paiements.find(p => p.numero === 1)?.enregistrePar || currentUserFullName
      });
    }

    if (p2Enregistre && p2Amount > 0) {
      compiledPaiements.push({
        numero: 2,
        montantPaye: p2Amount,
        datePaiement: p2Date || new Date().toISOString().split('T')[0],
        soldeRestant: Math.max(0, balanceAfterP2),
        enregistrePar: beneficiaire.paiements.find(p => p.numero === 2)?.enregistrePar || currentUserFullName
      });
    }

    if (p3Enregistre && p3Amount > 0) {
      compiledPaiements.push({
        numero: 3,
        montantPaye: p3Amount,
        datePaiement: p3Date || new Date().toISOString().split('T')[0],
        soldeRestant: Math.max(0, balanceAfterP3),
        enregistrePar: beneficiaire.paiements.find(p => p.numero === 3)?.enregistrePar || currentUserFullName
      });
    }

    // Auto-align Echeances status with registered payments
    // If payment recorded, mark corresponding echeance as 'reussi'
    const finalEcheances = echeances.map(e => {
      if (e.numero === 1) return { ...e, statut: p1Enregistre ? 'reussi' as const : 'en_attente' as const };
      if (e.numero === 2) return { ...e, statut: p2Enregistre ? 'reussi' as const : 'en_attente' as const };
      if (e.numero === 3) return { ...e, statut: p3Enregistre ? 'reussi' as const : 'en_attente' as const };
      return e;
    });

    const updatedBeneficiaire: Beneficiaire = {
      ...beneficiaire,
      echeances: finalEcheances,
      paiements: compiledPaiements,
      misAJourLe: new Date().toISOString()
    };

    onUpdateBeneficiaire(updatedBeneficiaire);
    alert("Fiche de suivi de paiements et échéances mise à jour avec succès !");
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in print:p-0 print:border-0 print:bg-white">
      
      {/* Upper Navigation Row */}
      <div className="flex items-center justify-between print:hidden">
        <button
          id="btn-tracker-back"
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 text-slate-400 hover:text-white text-xs font-bold bg-slate-900/60 border border-slate-800 rounded-xl transition-all cursor-pointer shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au registre
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintReceipt}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 text-xs font-bold rounded-xl shadow border border-slate-700 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            Imprimer reçu
          </button>
        </div>
      </div>

      {/* Profile Card Summary */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden print:bg-white print:text-zinc-900 print:shadow-none print:border-zinc-200 print:rounded-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-900/10 rounded-full blur-xl -mr-6 -mt-6"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-900/40 px-2.5 py-1 rounded-full print:border print:border-zinc-200">
              Fiche n° {beneficiaire.id}
            </span>
            <h2 className="text-xl font-bold font-sans tracking-tight mt-3 text-white print:text-zinc-900">
              {beneficiaire.nom.toUpperCase()} {beneficiaire.postNom} {beneficiaire.prenom}
            </h2>
            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-1.5 print:text-zinc-500">
              <span>{beneficiaire.age} ans</span>
              <span>•</span>
              <span className="font-semibold text-slate-350">{beneficiaire.etatCivil}</span>
              <span>•</span>
              <span>Com.: {beneficiaire.adresse}</span>
              <span>•</span>
              <span>Tél.: {beneficiaire.telephone}</span>
            </div>
          </div>
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-850 text-right print:bg-zinc-50 print:border-zinc-100">
            <span className="text-[10px] text-slate-450 block print:text-zinc-400 font-bold uppercase tracking-wider">Capital Octroyé</span>
            <span className="text-xl font-black text-white font-mono print:text-zinc-950">
              {formatMoney(beneficiaire.montantAccorde)}
            </span>
            <span className="block text-[8px] text-slate-500 uppercase tracking-widest mt-1 print:text-zinc-400 font-bold">
              Taux: {beneficiaire.tauxInteretMensuel}% / Mois (Type {beneficiaire.categorieTaux})
            </span>
          </div>
        </div>
      </div>

      {/* SECTION I: CALENDRIER DE REMBOURSEMENT (UPDATABLE) */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden print:border-zinc-200 print:shadow-none">
        <div className="bg-slate-950/70 px-6 py-4 border-b border-slate-850 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-emerald-500 rounded"></span>
              I. Planification / Calendrier de Remboursement Échéancier
            </h3>
            <p className="text-[10px] text-slate-450 mt-0.5 font-bold">
              Montants et dates des 3 échéances réglementaires à recouvrer. Modifiables par l'administration.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-slate-800 text-amber-400 border border-slate-700 px-2 py-1 rounded">
            Total Dû: {formatMoney(totalExpected)}
          </span>
        </div>

        <div className="p-6 divide-y divide-slate-850">
          {echeances.map((item) => (
            <div key={item.numero} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center border ${
                  item.statut === 'reussi' 
                    ? 'bg-emerald-950 text-emerald-450 border-emerald-900/40' 
                    : 'bg-slate-950 text-slate-500 border-slate-850'
                }`}>
                  {item.numero}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-sans">
                    Échéance Mensuelle N°{item.numero}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-450 mt-0.5">
                    <span>Statut requis:</span>
                    <span className={`font-semibold ${item.statut === 'reussi' ? 'text-emerald-400' : 'text-slate-550'}`}>
                      {item.statut === 'reussi' ? '● Réussi avec succès' : '○ En attente de paiement'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Editing Controls of the scheduled milestones */}
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Montant prévu (CDF)</label>
                  <input
                    id={`amt-${item.numero}`}
                    type="number"
                    value={item.montantPrevu}
                    disabled={currentUserRole === 'agent'}
                    onChange={(e) => handleModifyEcheancePrevu(item.numero, Number(e.target.value), item.date)}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/55 w-28 disabled:bg-slate-900 disabled:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Date d'échéance</label>
                  <input
                    id={`date-${item.numero}`}
                    type="date"
                    value={item.date}
                    disabled={currentUserRole === 'agent'}
                    onChange={(e) => handleModifyEcheancePrevu(item.numero, item.montantPrevu, e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/55 w-32 disabled:bg-slate-900 disabled:text-slate-500"
                  />
                </div>
                
                {/* Check toggle for quick manual override (Admin only) */}
                <div className="pt-4">
                  {currentUserRole === 'admin' ? (
                    <button
                      type="button"
                      id={`toggle-statut-${item.numero}`}
                      onClick={() => handleToggleEcheanceStatut(item.numero)}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        item.statut === 'reussi'
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-900/50 hover:bg-emerald-900'
                          : 'bg-slate-850 text-slate-200 border-slate-750 hover:bg-slate-800'
                      }`}
                    >
                      {item.statut === 'reussi' ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : null}
                      {item.statut === 'reussi' ? 'Statut Réussi' : 'Forcer Réussi'}
                    </button>
                  ) : (
                    <span className="inline-block text-[10px] text-slate-500 font-bold">
                      Bloqué (Agent)
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION II: SUIVI DES PAIEMENTS EFFECTUÉS */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden print:border-zinc-200">
        <div className="bg-slate-950/70 px-6 py-4 border-b border-slate-850">
          <h3 className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-amber-550 rounded"></span>
            II. Traçage des Paiements et Solde Restant
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Modification ou enregistrement des 3 versements correspondants aux échéances ci-dessus. Le solde restant s'actualise en temps réel.
          </p>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Milestone 1 Payment Input Info */}
          <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                PREMIER VERSEMENT (Paiement 1)
              </h4>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-400 font-bold">Activer versement :</label>
                <input
                  id="chk-p1-enregistre"
                  type="checkbox"
                  checked={p1Enregistre}
                  onChange={(e) => setP1Enregistre(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700 font-bold cursor-pointer"
                />
              </div>
            </div>

            {p1Enregistre ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Montant payé (CDF)</label>
                  <input
                    id="input-p1-amount"
                    type="number"
                    value={p1Amount}
                    onChange={(e) => setP1Amount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Date de paiement</label>
                  <input
                    id="input-p1-date"
                    type="date"
                    value={p1Date}
                    onChange={(e) => setP1Date(e.target.value)}
                    className="w-full h-9 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 font-bold"
                  />
                </div>
                <div className="bg-slate-900/60 p-3 border border-slate-800 rounded-xl flex flex-col justify-end">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Solde Restant Déduit :</span>
                  <p className="text-sm font-black text-emerald-400 mt-0.5 font-mono">
                    {formatMoney(balanceAfterP1)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-bold italic">Pas encore de premier paiement enregistré.</p>
            )}
          </div>

          {/* Milestone 2 Payment Input Info */}
          <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                DEUXIÈME VERSEMENT (Paiement 2)
              </h4>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-400 font-bold">Activer versement :</label>
                <input
                  id="chk-p2-enregistre"
                  type="checkbox"
                  disabled={!p1Enregistre}
                  checked={p2Enregistre}
                  onChange={(e) => setP2Enregistre(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700 disabled:opacity-40 cursor-pointer"
                />
              </div>
            </div>

            {p2Enregistre && p1Enregistre ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Montant payé (CDF)</label>
                  <input
                    id="input-p2-amount"
                    type="number"
                    value={p2Amount}
                    onChange={(e) => setP2Amount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Date de paiement</label>
                  <input
                    id="input-p2-date"
                    type="date"
                    value={p2Date}
                    onChange={(e) => setP2Date(e.target.value)}
                    className="w-full h-9 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 font-bold"
                  />
                </div>
                <div className="bg-slate-900/60 p-3 border border-slate-800 rounded-xl flex flex-col justify-end">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Solde Restant Déduit :</span>
                  <p className="text-sm font-black text-emerald-400 mt-0.5 font-mono">
                    {formatMoney(balanceAfterP2)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-bold italic">Pas encore de deuxième paiement disponible.</p>
            )}
          </div>

          {/* Milestone 3 Payment Input Info */}
          <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                TROISIÈME VERSEMENT (Paiement 3)
              </h4>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-400 font-bold">Activer versement :</label>
                <input
                  id="chk-p3-enregistre"
                  type="checkbox"
                  disabled={!p2Enregistre}
                  checked={p3Enregistre}
                  onChange={(e) => setP3Enregistre(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700 disabled:opacity-40 cursor-pointer"
                />
              </div>
            </div>

            {p3Enregistre && p2Enregistre ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Montant payé (CDF)</label>
                  <input
                    id="input-p3-amount"
                    type="number"
                    value={p3Amount}
                    onChange={(e) => setP3Amount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Date de paiement</label>
                  <input
                    id="input-p3-date"
                    type="date"
                    value={p3Date}
                    onChange={(e) => setP3Date(e.target.value)}
                    className="w-full h-9 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-555/50 font-bold"
                  />
                </div>
                <div className="bg-slate-900/60 p-3 border border-slate-800 rounded-xl flex flex-col justify-end">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Solde Restant Déduit :</span>
                  <p className="text-sm font-black text-emerald-450 mt-0.5 font-mono">
                    {formatMoney(balanceAfterP3)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-bold italic">Pas encore de troisième paiement disponible.</p>
            )}
          </div>

          {/* Final overview recap box */}
          <div className="p-4 bg-[#02231c]/30 rounded-2xl border border-[#0d4f3e]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans backdrop-blur-md">
            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block uppercase text-[10px] text-emerald-400">Statut global consolidé :</span>
                {balanceAfterP3 <= 0 && p3Enregistre ? (
                  <span className="text-emerald-300 font-extrabold mt-0.5 inline-block">
                    PROJET SOLDÉ - Félicitations réelles (L'intégralité du capital et des intérêts a été remboursée !)
                  </span>
                ) : (
                  <span className="text-slate-350 font-semibold mt-0.5 inline-block">
                    En cours de recouvrement. Reste à percevoir un solde de <strong className="font-bold underline text-amber-400">{formatMoney(Math.max(0, balanceAfterP3))}</strong> sur le prêt de la bénéficiaire.
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Authority submit control row */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-850 print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 font-bold text-xs rounded-xl border border-slate-800 transition-all font-sans cursor-pointer"
        >
          Annuler
        </button>
        <button
          id="btn-save-repayments"
          type="button"
          onClick={handleSaveTracking}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] font-sans cursor-pointer"
        >
          Valider et Mettre à Jour le Suivi
        </button>
      </div>

    </div>
  );
}
