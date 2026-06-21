/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Beneficiaire, ProjectSettings } from '../types';
import { generateEcheances } from '../dataStore';
import { Calendar, Save, ArrowLeft, RefreshCw, Calculator, HelpCircle } from 'lucide-react';

interface LoanFormProps {
  settings: ProjectSettings;
  existingBeneficiaire?: Beneficiaire | null;
  onSave: (beneficiaire: Beneficiaire) => void;
  onCancel: () => void;
  currentUserFullName: string;
}

export default function LoanForm({
  settings,
  existingBeneficiaire,
  onSave,
  onCancel,
  currentUserFullName
}: LoanFormProps) {
  // 1. Core State Initialization
  const [nom, setNom] = useState('');
  const [postNom, setPostNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [age, setAge] = useState(35);
  const [etatCivil, setEtatCivil] = useState('Mariée');
  const [adresse, setAdresse] = useState('');
  const [telephone, setTelephone] = useState('');
  const [activiteRevenus, setActiviteRevenus] = useState('');

  // Loan Variables
  const [montantAccorde, setMontantAccorde] = useState(300000);
  const [dureeMois, setDureeMois] = useState(3);
  const [categorieTaux, setCategorieTaux] = useState<'social' | 'equilibre'>('social');
  const [tauxInteretMensuel, setTauxInteretMensuel] = useState(3);
  const [dateDecaissement, setDateDecaissement] = useState('');
  const [dateRemboursementFinal, setDateRemboursementFinal] = useState('');

  // Responsibility/Printed fields
  const [nomResponsable, setNomResponsable] = useState(currentUserFullName || 'Rév. Richard Kingombe');
  const [faitALieu, setFaitALieu] = useState('Kinshasa');

  // Preview installments during calculations
  const [echeancesPreview, setEcheancesPreview] = useState<any[]>([]);

  // 2. Load Existing Data if present (for updates)
  useEffect(() => {
    if (existingBeneficiaire) {
      setNom(existingBeneficiaire.nom);
      setPostNom(existingBeneficiaire.postNom || '');
      setPrenom(existingBeneficiaire.prenom);
      setAge(existingBeneficiaire.age);
      setEtatCivil(existingBeneficiaire.etatCivil);
      setAdresse(existingBeneficiaire.adresse);
      setTelephone(existingBeneficiaire.telephone);
      setActiviteRevenus(existingBeneficiaire.activiteRevenus);

      setMontantAccorde(existingBeneficiaire.montantAccorde);
      setDureeMois(existingBeneficiaire.dureeMois);
      setCategorieTaux(existingBeneficiaire.categorieTaux);
      setTauxInteretMensuel(existingBeneficiaire.tauxInteretMensuel);
      setDateDecaissement(existingBeneficiaire.dateDecaissement);
      setDateRemboursementFinal(existingBeneficiaire.dateRemboursementFinal);
      setNomResponsable(existingBeneficiaire.nomResponsable || 'Rév. Richard Kingombe');
      setFaitALieu(existingBeneficiaire.faitALieu || 'Kinshasa');
      setEcheancesPreview(existingBeneficiaire.echeances);
    } else {
      // Set to today's date local format for new loan
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setDateDecaissement(`${yyyy}-${mm}-${dd}`);
      
      // Calculate final target date (default 3 months)
      const targetDate = new Date(today);
      targetDate.setMonth(today.getMonth() + 3);
      const tyyyy = targetDate.getFullYear();
      const tmm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const tdd = String(targetDate.getDate()).padStart(2, '0');
      setDateRemboursementFinal(`${tyyyy}-${tmm}-${tdd}`);
    }
  }, [existingBeneficiaire]);

  // Sync applied interest rate automatically with standard preset type
  useEffect(() => {
    if (categorieTaux === 'social') {
      setTauxInteretMensuel(settings.tauxSocialMensuel);
    } else {
      setTauxInteretMensuel(settings.tauxEquilibreMensuel);
    }
  }, [categorieTaux, settings]);

  // Auto Recalculates Repayment Preview when loan key parameters change
  useEffect(() => {
    if (montantAccorde && dateDecaissement && dureeMois > 0) {
      const rate = categorieTaux === 'social' ? settings.tauxSocialMensuel : settings.tauxEquilibreMensuel;
      const preview = generateEcheances(montantAccorde, rate, dateDecaissement, dureeMois);
      setEcheancesPreview(preview);

      // Auto update final end date based on actual duration selected
      const baseDate = new Date(dateDecaissement);
      baseDate.setMonth(baseDate.getMonth() + Number(dureeMois));
      const yyyy = baseDate.getFullYear();
      const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
      const dd = String(baseDate.getDate()).padStart(2, '0');
      setDateRemboursementFinal(`${yyyy}-${mm}-${dd}`);
    }
  }, [montantAccorde, dateDecaissement, dureeMois, categorieTaux, settings]);

  // 3. Save Form Action
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations based on Project parameters
    if (montantAccorde < settings.montantPretMin || montantAccorde > settings.montantPretMax) {
      alert(`Erreur: Le montant du prêt doit être compris entre ${settings.montantPretMin} CDF et ${settings.montantPretMax} CDF selon les paramètres actuels.`);
      return;
    }

    if (dureeMois < 3) {
      alert("La durée minimale d'un prêt solidaire est de 3 mois.");
      return;
    }

    const savedEcheances = existingBeneficiaire 
      ? echeancesPreview.map(previewItem => {
          // Keep completed statuses if we are editing an existing record
          const previousMatching = existingBeneficiaire.echeances.find(e => e.numero === previewItem.numero);
          return {
            ...previewItem,
            statut: previousMatching ? previousMatching.statut : 'en_attente'
          };
        })
      : echeancesPreview;

    const data: Beneficiaire = {
      id: existingBeneficiaire?.id || `b_${Date.now()}`,
      nom: nom.trim(),
      postNom: postNom.trim(),
      prenom: prenom.trim(),
      age: Number(age),
      etatCivil,
      adresse: adresse.trim(),
      telephone: telephone.trim(),
      activiteRevenus: activiteRevenus.trim(),
      
      montantAccorde: Number(montantAccorde),
      dureeMois: Number(dureeMois),
      tauxInteretMensuel: Number(tauxInteretMensuel),
      categorieTaux,
      dateDecaissement,
      dateRemboursementFinal,
      
      echeances: savedEcheances,
      paiements: existingBeneficiaire?.paiements || [],
      
      nomResponsable: nomResponsable.trim(),
      dateEngagement: dateDecaissement, // standard same day as cashment
      faitALieu,
      
      creePar: existingBeneficiaire?.creePar || 'system',
      creeLe: existingBeneficiaire?.creeLe || new Date().toISOString(),
      misAJourLe: new Date().toISOString()
    };

    onSave(data);
  };

  const totalCapitalPerInstallment = Math.round(montantAccorde / dureeMois);
  const totalInterestPerInstallment = Math.round(montantAccorde * (tauxInteretMensuel / 100));
  const totalInstallmentAmount = totalCapitalPerInstallment + totalInterestPerInstallment;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      
      {/* Return Head */}
      <div className="flex items-center justify-between">
        <button
          id="btn-back-to-dashboard"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 text-slate-400 hover:text-white text-xs font-bold bg-slate-900/60 border border-slate-800 rounded-xl transition-all cursor-pointer shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au registre
        </button>
        <span className="text-[11px] font-mono font-bold text-slate-500">
          Système Fiche Bénéficiaire - Actif (Kinshasa)
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 1. Beneficiary Personal details */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md space-y-6">
          <div className="border-b border-slate-850 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-4 bg-emerald-500 rounded-sm"></span>
              A. Informations Personnelles de la Bénéficiaire
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Tous les champs ci-dessous doivent être dument complétés avec les détails d'identité officiels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Nom */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                id="form-nom"
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Ngalula"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-650 focus:bg-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1.5 focus:ring-emerald-500/50 transition-all font-semibold"
              />
            </div>

            {/* Post-nom */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Post-nom
              </label>
              <input
                id="form-postnom"
                type="text"
                value={postNom}
                onChange={(e) => setPostNom(e.target.value)}
                placeholder="Ex: Mwamba"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-650 focus:bg-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1.5 focus:ring-emerald-500/50 transition-all font-semibold"
              />
            </div>

            {/* Prénom */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                id="form-prenom"
                type="text"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Ex: Thérèse"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-650 focus:bg-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1.5 focus:ring-emerald-500/50 transition-all font-semibold"
              />
            </div>

            {/* Âge */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Âge <span className="text-red-500">*</span>
              </label>
              <input
                id="form-age"
                type="number"
                required
                min="18"
                max="90"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-650 focus:bg-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1.5 focus:ring-emerald-500/50 transition-all font-semibold font-mono"
              />
            </div>

            {/* État civil */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                État Civil <span className="text-red-500">*</span>
              </label>
              <select
                id="form-civil"
                value={etatCivil}
                onChange={(e) => setEtatCivil(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:bg-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1.5 focus:ring-emerald-500/50 transition-all font-semibold"
              >
                <option value="Mariée">Mariée</option>
                <option value="Célibataire">Célibataire</option>
                <option value="Veuve">Veuve</option>
                <option value="Divorcée">Divorcée</option>
              </select>
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Numéro de téléphone <span className="text-red-500">*</span>
              </label>
              <input
                id="form-telephone"
                type="tel"
                required
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Ex: +243 812 345 678"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-650 focus:bg-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1.5 focus:ring-emerald-500/50 transition-all font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Adresse complète */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Adresse Complète de Résidence <span className="text-red-500">*</span>
              </label>
              <input
                id="form-adresse"
                type="text"
                required
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Ex: Avenue de la Paix 45, Quartier Kingabwa, Commune de Limete"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-650 focus:bg-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1.5 focus:ring-emerald-500/50 transition-all font-semibold"
              />
            </div>

            {/* Activité de revenus */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Activité Génératrice de revenus (AGR) <span className="text-red-500">*</span>
              </label>
              <input
                id="form-agr"
                type="text"
                required
                value={activiteRevenus}
                onChange={(e) => setActiviteRevenus(e.target.value)}
                placeholder="Ex: Atelier de couture, Vente de pagnes au marché, Kiosque d'alimentation"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-650 focus:bg-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1.5 focus:ring-emerald-500/50 transition-all font-semibold"
              />
            </div>
          </div>
        </div>

        {/* 2. Loan Parameters */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md space-y-6">
          <div className="border-b border-slate-850 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-4 bg-amber-500 rounded-sm"></span>
              B. Paramètres Spécifiques du Prêt CVEM
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Ajustez le capital octroyé et le mode de taux. Les montants limites sont régulés par le Coordinateur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Capital accordé */}
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Montant du Prêt (en {settings.devise}) <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-slate-500 font-bold">
                  Limites: {settings.montantPretMin.toLocaleString('fr-FR')} - {settings.montantPretMax.toLocaleString('fr-FR')}
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-500">
                  {settings.devise}
                </span>
                <input
                  id="form-montant"
                  type="number"
                  required
                  min={settings.montantPretMin}
                  max={settings.montantPretMax}
                  step="5000"
                  value={montantAccorde}
                  onChange={(e) => setMontantAccorde(Number(e.target.value))}
                  className="w-full pl-3.5 pr-12 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-650 focus:bg-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1.5 focus:ring-emerald-500/50 transition-all font-mono font-bold"
                />
              </div>
            </div>

            {/* Durée en mois */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Durée (Mois) <span className="text-red-500">*</span>
              </label>
              <input
                id="form-duree"
                type="number"
                required
                min="3"
                max="12"
                value={dureeMois}
                onChange={(e) => setDureeMois(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-650 focus:bg-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1.5 focus:ring-emerald-500/50 transition-all font-mono font-bold"
              />
            </div>

            {/* Type/catégorie de Taux */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Proposition de Taux
              </label>
              <select
                id="form-tauxtype"
                value={categorieTaux}
                onChange={(e) => setCategorieTaux(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:bg-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1.5 focus:ring-emerald-500/50 transition-all font-bold"
              >
                <option value="social">Taux Social (3% / mois)</option>
                <option value="equilibre">Taux Équilibré (4% / mois)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Taux Mensuel d'intérêt - Readonly showing setting value */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Taux Appliqué Cumulatif (Calculé)
              </label>
              <div className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs font-mono font-bold text-slate-400">
                {tauxInteretMensuel}% par mois (soit {tauxInteretMensuel * dureeMois}% sur {dureeMois} mois)
              </div>
            </div>

            {/* Date de décaissement (date de cassement) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Date de Décaissement <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  id="form-datedecaissement"
                  type="date"
                  required
                  value={dateDecaissement}
                  onChange={(e) => setDateDecaissement(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:bg-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1.5 focus:ring-emerald-500/50 transition-all font-mono font-bold"
                />
              </div>
            </div>

            {/* Date finale de remboursement */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Date Remboursement Final (Fin du prêt)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  id="form-dateremboursement"
                  type="date"
                  disabled
                  value={dateRemboursementFinal}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-900 rounded-xl text-xs font-mono text-slate-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Automatic Calendar Amortization preview */}
        <div className="bg-[#02231c]/30 p-6 rounded-2xl border border-[#0d4f3e]/40 shadow-xl space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-[#0d4f3e]/30 pb-2">
            <h4 className="text-xs font-black text-emerald-300 uppercase tracking-wide flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              Calculateur de Traitement & Calendrier prévisionnel
            </h4>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900/50 px-2 py-0.5 rounded font-mono font-bold">
              Amortissement Constant
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Capital échelonné (par mois)</span>
              <p className="text-sm font-bold text-white mt-1 font-mono">
                {totalCapitalPerInstallment.toLocaleString('fr-FR')} {settings.devise}
              </p>
            </div>
            
            <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Intérêts ({categorieTaux === 'social' ? 'Social' : 'Équilibré'}) par mois</span>
              <p className="text-sm font-bold text-white mt-1 font-mono">
                {totalInterestPerInstallment.toLocaleString('fr-FR')} {settings.devise} ({settings.devise} {Math.round(totalInterestPerInstallment * dureeMois)} au total)
              </p>
            </div>

            <div className="bg-emerald-950/40 p-3.5 font-bold rounded-xl border border-emerald-900/40">
              <span className="text-emerald-400 text-[10px] block">Total Mensuel à Recouvrer</span>
              <p className="text-sm font-black text-emerald-300 mt-1 font-mono">
                {totalInstallmentAmount.toLocaleString('fr-FR')} {settings.devise}
              </p>
            </div>
          </div>

          {/* Table representing the generated echeances */}
          <div className="bg-slate-950/60 rounded-xl border border-slate-850 overflow-hidden text-xs">
            <div className="bg-slate-900/80 px-4 py-2.5 font-bold text-slate-300 text-[10px] uppercase tracking-wider border-b border-slate-850">
              Plan prévisionnel des 3 Échéances Obligatoires
            </div>
            <div className="divide-y divide-slate-900">
              {echeancesPreview.map((item, idx) => (
                <div key={idx} className="px-4 py-3 flex items-center justify-between font-mono">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-900/30 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                      {item.numero}
                    </span>
                    <span className="text-slate-300 font-sans text-xs">Échéance N°{item.numero} du</span>
                    <span className="font-bold text-white">{item.date}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500 text-[10px] font-sans hidden sm:inline">Statut: initialement "En attente"</span>
                    <span className="font-black text-emerald-400 font-mono">
                      {item.montantPrevu.toLocaleString('fr-FR')} {settings.devise}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Document authority details */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md space-y-6">
          <div className="border-b border-slate-850 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              C. Autorité de Délivrance & Administratif
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Ces informations paraitront sur l'engagement formel du bénéficiaire.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Responsable Programme */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Responsable du Programme (Signature) <span className="text-red-500">*</span>
              </label>
              <input
                id="form-responsable"
                type="text"
                required
                value={nomResponsable}
                onChange={(e) => setNomResponsable(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:bg-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1.5 focus:ring-emerald-500/50 transition-all font-semibold"
              />
            </div>

            {/* Lieu d'établissement */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Fait à
              </label>
              <input
                id="form-lieu"
                type="text"
                required
                value={faitALieu}
                onChange={(e) => setFaitALieu(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:bg-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1.5 focus:ring-emerald-500/50 transition-all font-semibold"
              />
            </div>

            {/* Note category warning */}
            <div className="bg-amber-950/20 rounded-xl border border-amber-900/40 p-3 flex gap-2.5 text-[10px] text-amber-400 leading-normal">
              <HelpCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Rappel Pénalité :</span> Conformément aux statuts de l'église, tout retard non justifié entraînera une pénalité égale au taux d'intérêt mensuel de la catégorie.
              </div>
            </div>
          </div>
        </div>

        {/* Action Bottom */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-850">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 font-bold text-xs rounded-xl border border-slate-800 transition-all cursor-pointer"
          >
            Annuler
          </button>
          <button
            id="btn-save-loan-form"
            type="submit"
            className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Enregistrer la Fiche de Prêt
          </button>
        </div>

      </form>
    </div>
  );
}
