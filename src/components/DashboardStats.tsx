/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Beneficiaire, ProjectSettings } from '../types';
import { 
  Users, DollarSign, ArrowUpRight, CheckCircle2, AlertTriangle, 
  TrendingUp, Search, Layers, ClipboardCheck, Phone, Calendar, ArrowRight, UserPlus
} from 'lucide-react';

interface DashboardStatsProps {
  beneficiaires: Beneficiaire[];
  settings: ProjectSettings;
  onSelectBeneficiaire: (id: string, tab: 'repayments' | 'engagement' | 'form') => void;
  onAddNewBeneficiaire: () => void;
}

export default function DashboardStats({ 
  beneficiaires, 
  settings, 
  onSelectBeneficiaire,
  onAddNewBeneficiaire
}: DashboardStatsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [civilFilter, setCivilFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // 1. Calculations
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: settings.devise,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalMembers = beneficiaires.length;
  
  // Total funds lent (cumulative principal amount granted)
  const totalLent = beneficiaires.reduce((acc, curr) => acc + curr.montantAccorde, 0);

  // Total amount repaid so far (sum of all payments)
  const totalRepaidAllTime = beneficiaires.reduce((acc, b) => {
    return acc + b.paiements.reduce((sum, p) => sum + p.montantPaye, 0);
  }, 0);

  // Capital Social remaining dynamically (Capital Social - Lent + Repaid)
  const availableCapital = settings.capitalSocial - totalLent + totalRepaidAllTime;

  // Expected returns (Total calculated expected payment amounts across all beneficiaries)
  const totalExpectedAmount = beneficiaires.reduce((acc, b) => {
    return acc + b.echeances.reduce((sum, e) => sum + e.montantPrevu, 0);
  }, 0);

  // Remaining balance outstanding to be repaid
  const totalOutstanding = Math.max(0, totalExpectedAmount - totalRepaidAllTime);

  // Total Interest and potential penalties calculated
  const totalInterestExpected = totalExpectedAmount - totalLent;

  // Count active vs settled loans
  let activeLoansCount = 0;
  let settledLoansCount = 0;
  let defaultLoansCount = 0; // past due dates but unpaid

  const currentDateObj = new Date();

  beneficiaires.forEach(b => {
    // Check if fully paid
    const paidSum = b.paiements.reduce((sum, p) => sum + p.montantPaye, 0);
    const expectedSum = b.echeances.reduce((sum, e) => sum + e.montantPrevu, 0);
    
    if (paidSum >= expectedSum && expectedSum > 0) {
      settledLoansCount++;
    } else {
      activeLoansCount++;
      // Check if any unpaid echeance is past due date
      const hasOverdue = b.echeances.some(e => {
        if (e.statut !== 'reussi') {
          const eDate = new Date(e.date);
          return eDate < currentDateObj;
        }
        return false;
      });
      if (hasOverdue) {
        defaultLoansCount++;
      }
    }
  });

  // 2. Custom Chart Data Preps
  // Activity breakdown distribution
  const activityCounts: { [key: string]: number } = {};
  beneficiaires.forEach(b => {
    const act = b.activiteRevenus.trim();
    // Normalize slightly
    let category = "Autre Activité";
    if (act.toLowerCase().includes('pagne') || act.toLowerCase().includes('tissu') || act.toLowerCase().includes('vêtement')) {
      category = "Habillement & Pagnes";
    } else if (act.toLowerCase().includes('couture') || act.toLowerCase().includes('tailleur')) {
      category = "Couture & Confection";
    } else if (act.toLowerCase().includes('aliment') || act.toLowerCase().includes('semoule') || act.toLowerCase().includes('kiosk') || act.toLowerCase().includes('boutique')) {
      category = "Petite Épicerie & Alimentation";
    } else if (act.toLowerCase().includes('restaur') || act.toLowerCase().includes('malewa') || act.toLowerCase().includes('boisson')) {
      category = "Restauration / Boissons";
    }
    activityCounts[category] = (activityCounts[category] || 0) + 1;
  });

  const activityArray = Object.keys(activityCounts).map(name => ({
    name,
    count: activityCounts[name],
    percentage: Math.round((activityCounts[name] / totalMembers) * 100)
  }));

  // Render variables for searching
  const filteredBeneficiaires = beneficiaires.filter(b => {
    const fullName = `${b.nom} ${b.postNom} ${b.prenom}`.toLowerCase();
    const searchMatch = fullName.includes(searchTerm.toLowerCase()) || 
                        b.telephone.includes(searchTerm) || 
                        b.activiteRevenus.toLowerCase().includes(searchTerm.toLowerCase());
    
    const civilMatch = !civilFilter || b.etatCivil === civilFilter;

    // Status filter: active, solde, retard
    const expectedSum = b.echeances.reduce((sum, e) => sum + e.montantPrevu, 0);
    const paidSum = b.paiements.reduce((sum, p) => sum + p.montantPaye, 0);
    const isPaid = paidSum >= expectedSum && expectedSum > 0;
    
    const hasOverdue = b.echeances.some(e => {
      if (e.statut !== 'reussi') {
        const eDate = new Date(e.date);
        return eDate < currentDateObj;
      }
      return false;
    });

    let bStatus = 'active';
    if (isPaid) bStatus = 'solde';
    else if (hasOverdue) bStatus = 'retard';

    const statusMatch = !statusFilter || bStatus === statusFilter;

    return searchMatch && civilMatch && statusMatch;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Dynamic Upper Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold font-display text-white tracking-tight">
            Tableau de Bord Financier
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Recharge automatique en temps réel des flux de prêts pour les membres de l'église CVEM.
          </p>
        </div>
        <button
          id="btn-quick-new-loan"
          onClick={onAddNewBeneficiaire}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all self-start md:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-emerald-100" />
          Enregistrer un Prêt Bénéficiaire
        </button>
      </div>

      {/* Primary KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Capital Social & Dispo */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all backdrop-blur-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 -z-0 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Capital Secourable
              </span>
              <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-900/40">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight block">
                {formatMoney(availableCapital)}
              </span>
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 border-t border-slate-800/80 pt-2">
                <span>Solde Deversé: {formatMoney(settings.capitalSocial)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 2: Somme Total rété */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group hover:border-blue-500/50 transition-all backdrop-blur-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8 -z-0 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total des Prêts Accordés
              </span>
              <div className="p-2 bg-blue-950 text-blue-400 rounded-lg border border-blue-900/40">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-blue-400 font-mono tracking-tight block">
                {formatMoney(totalLent)}
              </span>
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 border-t border-slate-800/80 pt-2">
                <span>Intérêt Global: {formatMoney(totalInterestExpected)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 3: Remboursements cumulés */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all backdrop-blur-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-5000/5 rounded-full -mr-8 -mt-8 -z-0 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Montants Remboursés
              </span>
              <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-900/40">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white font-mono tracking-tight">
                  {formatMoney(totalRepaidAllTime)}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900/30">
                  {totalExpectedAmount > 0 ? Math.round((totalRepaidAllTime / totalExpectedAmount) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 border-t border-slate-800/80 pt-2">
                <span>Reste à percevoir: {formatMoney(totalOutstanding)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 4: Alertes défauts / Retard */}
        <div className={`p-6 rounded-2xl border shadow-xl relative overflow-hidden transition-all backdrop-blur-md ${
          defaultLoansCount > 0 
            ? 'bg-amber-950/20 border-amber-900/60 hover:border-amber-500' 
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
        }`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 -z-0"></div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Prêts en Retard d'Échéance
              </span>
              <div className={`p-2 rounded-lg border ${defaultLoansCount > 0 ? 'bg-amber-950 text-amber-400 border-amber-900/40' : 'bg-slate-950 text-slate-400 border-slate-850'}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-2xl font-black font-mono tracking-tight block ${defaultLoansCount > 0 ? 'text-amber-400' : 'text-white'}`}>
                {defaultLoansCount} {defaultLoansCount > 1 ? 'Membres' : 'Membre'}
              </span>
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 border-t border-slate-800/80 pt-2">
                <span>Membres actifs CVEM: {activeLoansCount}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Custom High-Fidelity SVGs charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart A: Financial comparison bar-chart */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h3 className="text-sm font-bold text-white font-sans tracking-tight">
                Flux Réel du Capital Solidaire
              </h3>
              <p className="text-[11px] text-slate-400">
                Visualisation de la répartition par rapport au Capital Social.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span>
                <span>Engagé</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block"></span>
                <span>Remboursé</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-950 border border-emerald-500/30 inline-block"></span>
                <span>Disponible</span>
              </div>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="relative h-64 flex flex-col justify-end">
            {/* Visual Bars Container */}
            <div className="w-full flex justify-around items-end px-4 h-48 border-b border-slate-800 relative">
              
              {/* Target guidelines */}
              <div className="absolute left-0 right-0 top-0 border-t border-dashed border-slate-800 text-[9px] text-slate-500 pt-1 pointer-events-none">
                Max (Capital Initial)
              </div>
              <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-slate-800 text-[9px] text-slate-500 pt-1 pointer-events-none">
                50%
              </div>

              {/* Bar 1: Social Capital (Reference) */}
              <div className="flex flex-col items-center group w-1/4 h-full justify-end">
                <div className="relative w-12 bg-slate-800/40 border border-slate-700/50 rounded-t-lg transition-all hover:brightness-110 h-full flex flex-col justify-end">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-300">
                    100%
                  </div>
                </div>
                <span className="mt-3 text-[10px] font-bold text-slate-400 block text-center truncate w-full font-sans">
                  Capital Social
                </span>
              </div>

              {/* Bar 2: Total Lent */}
              <div className="flex flex-col items-center group w-1/4 h-full justify-end">
                <div 
                  style={{ height: `${settings.capitalSocial > 0 ? (totalLent / settings.capitalSocial) * 100 : 0}%` }}
                  className="relative w-12 bg-amber-500 rounded-t-lg transition-all hover:bg-amber-400 h-0 flex flex-col justify-end"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-amber-400 whitespace-nowrap">
                    {settings.capitalSocial > 0 ? Math.round((totalLent / settings.capitalSocial) * 100) : 0}%
                  </div>
                </div>
                <span className="mt-3 text-[10px] font-bold text-slate-400 block text-center truncate w-full font-sans">
                  Fonds Prêtés
                </span>
              </div>

              {/* Bar 3: Total Repaid */}
              <div className="flex flex-col items-center group w-1/4 h-full justify-end">
                <div 
                  style={{ height: `${settings.capitalSocial > 0 ? (totalRepaidAllTime / settings.capitalSocial) * 100 : 0}%` }}
                  className="relative w-12 bg-emerald-600 rounded-t-lg transition-all hover:bg-emerald-500 h-0 flex flex-col justify-end"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-400 whitespace-nowrap">
                    {settings.capitalSocial > 0 ? Math.round((totalRepaidAllTime / settings.capitalSocial) * 100) : 0}%
                  </div>
                </div>
                <span className="mt-3 text-[10px] font-bold text-slate-400 block text-center truncate w-full font-sans">
                  Fonds Récupérés
                </span>
              </div>

              {/* Bar 4: Available */}
              <div className="flex flex-col items-center group w-1/4 h-full justify-end">
                <div 
                  style={{ height: `${settings.capitalSocial > 0 ? (availableCapital / settings.capitalSocial) * 100 : 0}%` }}
                  className="relative w-12 bg-emerald-950/40 border border-emerald-500/30 rounded-t-lg transition-all hover:bg-emerald-950/60 h-0 flex flex-col justify-end"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-300 whitespace-nowrap animate-pulse">
                    {settings.capitalSocial > 0 ? Math.round((availableCapital / settings.capitalSocial) * 100) : 0}%
                  </div>
                </div>
                <span className="mt-3 text-[10px] font-bold text-slate-400 block text-center truncate w-full font-sans">
                  Solde Dispo
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* Chart B: Category Breakdown / Activities */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-sans tracking-tight mb-1">
              Activités Génératrices de Revenus (AGR)
            </h3>
            <p className="text-[11px] text-slate-400 mb-6">
              Répartition par secteur d'activité des femmes bénéficiaires de la CVEM.
            </p>
          </div>

          <div className="space-y-4">
            {activityArray.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">Aucun secteur répertorié. Enregistrez des prêts.</p>
            ) : (
              activityArray.map((item, idx) => {
                const colorClasses = [
                  'bg-emerald-600',
                  'bg-amber-500',
                  'bg-blue-500',
                  'bg-rose-500',
                ];
                const textCol = [
                  'text-emerald-400',
                  'text-amber-400',
                  'text-blue-400',
                  'text-rose-400',
                ];
                const color = colorClasses[idx % colorClasses.length];
                const activeText = textCol[idx % textCol.length];
                
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded ${color}`}></span>
                        <span className="text-slate-300 truncate max-w-[280px]">{item.name}</span>
                      </div>
                      <span className={`font-mono font-bold ${activeText}`}>
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    {/* Visual bar */}
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${item.percentage}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${color}`}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="text-[10px] text-slate-500 mt-6 border-t border-slate-800/80 pt-3 text-center font-mono">
            Statistiques regroupées par analyse sémantique des descriptions d'activités.
          </div>
        </div>

      </div>

      {/* Beneficiaries List Panel */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
        
        {/* Header & Filters */}
        <div className="p-6 border-b border-slate-850 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-base font-bold text-white font-display">
              Registre des Bénéficiaires et Suivi de Paiement
            </h3>
            <span className="text-[11px] font-bold font-mono bg-slate-950 text-slate-400 px-3 py-1 rounded-full border border-slate-850">
              {filteredBeneficiaires.length} affiché(s) sur {totalMembers}
            </span>
          </div>

          {/* Filter Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                id="search-beneficiary"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher nom, n° tél, activité..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-500 focus:bg-slate-900 focus:outline-none focus:ring-1.5 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
              />
            </div>

            {/* Marital status filter */}
            <select
              id="filter-civil"
              value={civilFilter}
              onChange={(e) => setCivilFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:bg-slate-900 focus:outline-none focus:ring-1.5 focus:ring-emerald-500 transition-all font-semibold"
            >
              <option value="">Tous les états civils</option>
              <option value="Mariée">Mariée</option>
              <option value="Célibataire">Célibataire</option>
              <option value="Veuve">Veuve</option>
              <option value="Divorcée">Divorcée</option>
            </select>

            {/* Repayment Status Filter */}
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:bg-slate-900 focus:outline-none focus:ring-1.5 focus:ring-emerald-500 transition-all font-semibold"
            >
              <option value="">Tous les statuts de paiement</option>
              <option value="active">Actif (Remboursement en cours)</option>
              <option value="solde">Soldé (Remboursé avec succès)</option>
              <option value="retard">En Retard (Échéances dépassées)</option>
            </select>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          {filteredBeneficiaires.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <Layers className="w-10 h-10 text-slate-700 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Aucun bénéficiaire ne correspond à votre recherche.</p>
              <button 
                onClick={() => { setSearchTerm(''); setCivilFilter(''); setStatusFilter(''); }}
                className="text-xs text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850">
                  <th className="px-6 py-4">Bénéficiaire & Contact</th>
                  <th className="px-6 py-4">Activité Génératrice (AGR)</th>
                  <th className="px-6 py-4">Montant Accordé</th>
                  <th className="px-6 py-4">Taux Appliqué</th>
                  <th className="px-6 py-4">Calendrier / Progression</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-xs">
                {filteredBeneficiaires.map((b) => {
                  const expectedSum = b.echeances.reduce((sum, e) => sum + e.montantPrevu, 0);
                  const paidSum = b.paiements.reduce((sum, p) => sum + p.montantPaye, 0);
                  const isPaid = paidSum >= expectedSum && expectedSum > 0;
                  
                  const hasOverdue = b.echeances.some(e => {
                     if (e.statut !== 'reussi') {
                       const eDate = new Date(e.date);
                       return eDate < currentDateObj;
                     }
                     return false;
                  });

                  let statusBadge = (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/50 text-blue-400 border border-blue-900/30">
                      En cours
                    </span>
                  );
                  if (isPaid) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/50 text-emerald-400 border border-emerald-900/30">
                        Soldé
                      </span>
                    );
                  } else if (hasOverdue) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/50 text-amber-400 border border-amber-900/30">
                        En Retard
                      </span>
                    );
                  }

                  // Number of fulfilled milestones
                  const validatedMilestones = b.echeances.filter(e => e.statut === 'reussi').length;

                  return (
                    <tr key={b.id} className="hover:bg-slate-850/30 transition-colors">
                      {/* Name & phone */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-white font-sans text-xs flex items-center gap-1">
                          {b.nom.toUpperCase()} {b.postNom} {b.prenom}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span className="font-medium text-slate-300">{b.telephone}</span>
                          <span className="text-slate-600">•</span>
                          <span>{b.age} ans ({b.etatCivil})</span>
                        </div>
                      </td>

                      {/* AGR */}
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-slate-300 truncate font-medium" title={b.activiteRevenus}>
                          {b.activiteRevenus}
                        </p>
                        <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">
                          Kinshasa (RDC)
                        </span>
                      </td>

                      {/* Montant accordé */}
                      <td className="px-6 py-4 font-mono font-bold text-white">
                        {formatMoney(b.montantAccorde)}
                        <span className="block text-[9px] text-slate-500 font-sans font-normal mt-0.5">
                          Date: {b.dateDecaissement}
                        </span>
                      </td>

                      {/* Interest Rate */}
                      <td className="px-6 py-4">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          b.categorieTaux === 'social' 
                            ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/30' 
                            : 'bg-amber-950/50 text-amber-400 border border-amber-900/30'
                        }`}>
                          {b.tauxInteretMensuel}% / Mois (Type {b.categorieTaux === 'social' ? 'Social' : 'Équilibré'})
                        </span>
                        <span className="block text-[9px] text-slate-500 mt-1.5 font-mono">
                          Durée: {b.dureeMois} mois
                        </span>
                      </td>

                      {/* Repayments completion */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex -space-x-1">
                            {[1, 2, 3].map((num) => {
                              const eclObj = b.echeances.find(e => e.numero === num);
                              const isEclPaid = eclObj?.statut === 'reussi';
                              return (
                                <div 
                                  key={num} 
                                  title={`Échéance ${num}: ${eclObj ? formatMoney(eclObj.montantPrevu) : ''}`}
                                  className={`w-4 h-4 rounded-full border border-slate-900 text-[8px] flex items-center justify-center font-bold text-white shadow-sm ${
                                    isEclPaid ? 'bg-emerald-600' : 'bg-slate-800 text-slate-500'
                                  }`}
                                >
                                  {num}
                                </div>
                              );
                            })}
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold font-mono">
                            ({validatedMilestones}/3)
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                          <span>Payé: {formatMoney(paidSum)}</span>
                          <span className="mx-1">/</span>
                          <span>Dû: {formatMoney(expectedSum)}</span>
                        </div>
                      </td>

                      {/* Badge status */}
                      <td className="px-6 py-4">
                        {statusBadge}
                      </td>

                      {/* Buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Payment track */}
                          <button
                            id={`btn-track-loan-${b.id}`}
                            onClick={() => onSelectBeneficiaire(b.id, 'repayments')}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 border border-slate-700/60 font-bold font-sans text-[10px] rounded-lg transition-all cursor-pointer"
                            title="Suivi de Paiement & Échéances"
                          >
                            Paiements
                          </button>

                          {/* Print engagement */}
                          <button
                            id={`btn-print-note-${b.id}`}
                            onClick={() => onSelectBeneficiaire(b.id, 'engagement')}
                            className="px-2.5 py-1.5 bg-amber-950/30 hover:bg-amber-900/50 text-amber-400 border border-amber-900/40 font-bold font-sans text-[10px] rounded-lg transition-all cursor-pointer"
                            title="Imprimer l'engagement"
                          >
                            Engagement
                          </button>

                          {/* Edit form */}
                          <button
                            id={`btn-edit-loan-${b.id}`}
                            onClick={() => onSelectBeneficiaire(b.id, 'form')}
                            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                            title="Modifier Fiche"
                          >
                            Fiche
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Statistics count footer details of total movement */}
        <div className="bg-slate-950/60 px-6 py-4 border-t border-slate-850/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
            <ClipboardCheck className="w-4 h-4 text-slate-500" />
            <span>Moyenne d'âge des bénéficiaires : </span>
            <span className="font-bold text-emerald-400">
              {totalMembers > 0 ? Math.round(beneficiaires.reduce((sum, b) => sum + b.age, 0) / totalMembers) : 0} ans
            </span>
          </div>
          <p className="text-[10px] text-slate-650 font-mono">
            Règlementation interne d'engagement v2026.06.20 - Kinshasa
          </p>
        </div>

      </div>

    </div>
  );
}
