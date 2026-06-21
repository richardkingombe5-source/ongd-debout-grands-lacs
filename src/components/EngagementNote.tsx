/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Beneficiaire, ProjectSettings } from '../types';
import { ArrowLeft, Printer, ShieldCheck, Download } from 'lucide-react';

interface EngagementNoteProps {
  beneficiaire: Beneficiaire;
  settings: ProjectSettings;
  onBack: () => void;
}

export default function EngagementNote({
  beneficiaire,
  settings,
  onBack,
}: EngagementNoteProps) {
  
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: settings.devise,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculations for total engagement commitment
  const totalPrincipal = beneficiaire.montantAccorde;
  const ratePercentage = beneficiaire.tauxInteretMensuel;
  const duration = beneficiaire.dureeMois;
  const totalInterest = totalPrincipal * (ratePercentage / 100) * duration;
  const grandTotalRepay = totalPrincipal + totalInterest;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in print:bg-white print:p-0">
      
      {/* Return & Print bar (Hidden on print) */}
      <div className="flex items-center justify-between print:hidden">
        <button
          id="btn-engagement-back"
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 text-slate-400 hover:text-white text-xs font-bold bg-slate-900/60 border border-slate-800 rounded-xl transition-all cursor-pointer shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au registre
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
        >
          <Printer className="w-4.5 h-4.5 text-emerald-100" />
          Imprimer l'Engagement
        </button>
      </div>

      {/* Official Engagement Note Sheet Paper representation (Looks exactly like a real physical certificate) */}
      <div className="bg-[#fdfcf7] border-4 border-amber-950/40 p-12 rounded-2xl shadow-2xl relative print:bg-white print:shadow-none print:border-zinc-300 print:rounded-none print:p-8">
        
        {/* Subtle Decorative double-border layout similar to official certificates */}
        <div className="absolute inset-2 border border-amber-950/15 pointer-events-none print:border-zinc-200"></div>

        <div className="relative z-10 space-y-8 font-serif text-zinc-800">
          
          {/* Header section representing the ONGD standing */}
          <div className="text-center space-y-2 border-b-2 border-amber-950/25 pb-6 print:border-zinc-300">
            <span className="block text-xs font-bold font-sans uppercase tracking-[0.2em] text-emerald-800">
              RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
            </span>
            <h1 className="text-2xl font-black font-sans tracking-wide text-amber-950 print:text-zinc-900">
              ONGD DEBOUT GRANS LACS
            </h1>
            <p className="text-xs font-sans italic text-zinc-500">
              Autonomisation socio-économique & Programme de Micro-crédits Solidaires
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-400">
              <span>Église CVEM Kinshasa</span>
              <span>•</span>
              <span>Rattaché au Programme d'Affiliation Sociale</span>
            </div>
          </div>

          {/* Title block */}
          <div className="text-center space-y-1">
            <div className="inline-block border-y border-amber-950/20 py-2 px-8 uppercase tracking-widest text-sm font-bold text-amber-900 font-sans print:text-zinc-800 print:border-zinc-200">
              ACTE D'ENGAGEMENT FORMEL ET MANDAT DE PRÊT
            </div>
            <p className="text-[11px] font-sans text-zinc-400 italic">
              Réf du Prêt: ONGD-DGL-2026-{beneficiaire.id}
            </p>
          </div>

          {/* Core Content Body */}
          <div className="space-y-4 text-xs leading-relaxed text-zinc-700 font-serif">
            
            <p>
              Je soussignée, <strong className="font-sans font-bold text-zinc-950 underline decoration-amber-950/40">{beneficiaire.prenom} {beneficiaire.postNom} {beneficiaire.nom.toUpperCase()}</strong>, 
              âgée de <span className="font-sans font-semibold">{beneficiaire.age} ans</span>, 
              demeurant à l'adresse suivante : <span className="underline italic">{beneficiaire.adresse}</span>, 
              joignable au numéro de téléphone : <span className="font-sans font-bold">{beneficiaire.telephone}</span>, 
              étant membre pratiquante de l'église <strong className="font-sans font-bold text-emerald-950">CVEM</strong>, 
              reconnais avoir reçu ce jour la somme en capital de :
            </p>

            <div className="bg-zinc-50 border border-zinc-150 p-4 rounded-xl my-4 font-sans text-xs print:bg-white print:border-zinc-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-zinc-400 block text-[9px] uppercase font-bold">Montant Octroyé :</span>
                  <span className="font-mono font-black text-zinc-900 text-sm">
                    {formatMoney(beneficiaire.montantAccorde)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[9px] uppercase font-bold">Taux Mensuel :</span>
                  <span className="font-bold text-zinc-900">
                    {beneficiaire.tauxInteretMensuel}% (Type {beneficiaire.categorieTaux === 'social' ? 'Social' : 'Équilibré'})
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[9px] uppercase font-bold">Durée du Prêt :</span>
                  <span className="font-bold text-zinc-900">
                    {beneficiaire.dureeMois} Mois
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 block uppercase font-bold">Total à Rembourser :</span>
                  <span className="font-mono font-black text-emerald-950 text-sm underline">
                    {formatMoney(grandTotalRepay)}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-4">
              Ce prêt est accordé en vue de soutenir l'Activité Génératrice de Revenus (AGR) suivante : 
              <span className="font-sans font-bold italic text-zinc-900"> "{beneficiaire.activiteRevenus}"</span>, afin d'assurer l'autonomie financière de mon ménage et fortifier ma contribution communautaire.
            </p>

            {/* Legal Commitment Paragraph - VERY IMPORTANT EXACT TEXT */}
            <div className="p-6 bg-amber-50/30 border border-amber-950/10 rounded-xl my-6 relative overflow-hidden print:bg-white print:border-zinc-300">
              <div className="absolute top-0 left-0 w-1 bg-amber-950 h-full"></div>
              <h4 className="font-sans font-bold text-[10px] uppercase tracking-wide text-amber-900 mb-2 print:text-zinc-800">
                L'Engagement Formel :
              </h4>
              <p className="text-zinc-900 italic leading-relaxed text-xs">
                « Je m’engage à respecter le calendrier de payement tel que défini dans la présente fiche. En cas de non-respect de ce calendrier, c’est le non-paiement du montant mensuel, je suis tenu à le payer le prochain mois avec pénalité équivalant aux taux d’intérêt mensuel selon ma catégorie en tant que bénéficiaire. »
              </p>
            </div>

            {/* Repayment schedule table details embedded in note */}
            <div>
              <p className="font-sans font-bold text-[10px] uppercase tracking-wide text-zinc-500 mb-3">
                Calendrier d'amortissement et d'échéances rattaché :
              </p>
              <div className="border border-zinc-200 rounded-xl overflow-hidden font-sans text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50 text-[9px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-200">
                      <th className="px-4 py-2">N° Échéance</th>
                      <th className="px-4 py-2">Date limite de paiement</th>
                      <th className="px-4 py-2 text-right">Montant Constant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-mono text-[11px] text-zinc-600">
                    {beneficiaire.echeances.map((ech) => (
                      <tr key={ech.numero}>
                        <td className="px-4 py-2 font-bold text-zinc-800">Echéance {ech.numero}</td>
                        <td className="px-4 py-2">{ech.date}</td>
                        <td className="px-4 py-2 text-right font-bold text-zinc-900">{formatMoney(ech.montantPrevu)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Place of agreement & Signatures */}
          <div className="pt-8 border-t border-amber-950/10 space-y-8 font-sans print:border-zinc-200">
            <div className="text-right text-xs">
              Fait à <strong className="font-serif underline">{beneficiaire.faitALieu}</strong>, le <strong className="font-serif underline">{beneficiaire.dateEngagement}</strong>.
            </div>

            <div className="grid grid-cols-2 gap-12 text-xs pt-4">
              
              {/* Beneficiary Signature Column */}
              <div className="space-y-16 border-t border-dashed border-zinc-300 pt-3">
                <div className="text-center font-bold uppercase text-[10px] text-zinc-500 tracking-wider">
                  Signature du bénéficiaire
                </div>
                <div className="text-center">
                  <span className="block font-semibold text-zinc-800 font-serif">
                    Mme. {beneficiaire.prenom} {beneficiaire.nom.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-1">« Certifié conforme »</span>
                </div>
              </div>

              {/* Coordinator Signature Column */}
              <div className="space-y-16 border-t border-dashed border-zinc-300 pt-3">
                <div className="text-center font-bold uppercase text-[10px] text-zinc-500 tracking-wider">
                  Signature du responsable du programme
                </div>
                <div className="text-center">
                  <span className="block font-semibold text-zinc-800 font-serif">
                    {beneficiaire.nomResponsable}
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-1">Coordinateur Adjoint ONGD DGL</span>
                </div>
              </div>

            </div>
          </div>

          {/* Double Security Seals elements at bottom */}
          <div className="flex justify-between items-center pt-8 border-t border-amber-950/10 text-[9px] text-zinc-400 font-sans print:border-zinc-200">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-800" />
              <span>Homologation sociale Église CVEM v2026.1</span>
            </div>
            <span>Kinshasa, République Démocratique du Congo - RDC</span>
          </div>

        </div>

      </div>

    </div>
  );
}
