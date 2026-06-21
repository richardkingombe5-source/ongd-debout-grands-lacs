/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'admin' | 'agent';

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string; // Plaintext for simplicity in client-only simulation, but called passwordHash for best practice
  role: Role;
  fullName: string;
  createdAt: string;
}

export interface ProjectSettings {
  capitalSocial: number;
  devise: 'CDF' | 'USD';
  montantPretMin: number;
  montantPretMax: number;
  dureeMoisDefaut: number;
  tauxSocialMensuel: number;  // Default 3 (3%)
  tauxEquilibreMensuel: number; // Default 4 (4%)
}

export interface Echeance {
  numero: number; // 1, 2, 3
  date: string;
  montantPrevu: number;
  statut: 'en_attente' | 'reussi';
}

export interface Paiement {
  numero: number; // 1, 2, 3
  montantPaye: number;
  datePaiement: string;
  soldeRestant: number;
  enregistrePar: string; // username of Agent/Admin
}

export interface Beneficiaire {
  id: string;
  // Beneficiary details
  nom: string;
  postNom: string;
  prenom: string;
  age: number;
  etatCivil: string; // 'Célibataire' | 'Marié(e)' | 'Veuf(ve)' | 'Divorcé(e)'
  adresse: string;
  telephone: string;
  activiteRevenus: string; // Activité génératrice de revenus
  
  // Loan details
  montantAccorde: number;
  dureeMois: number;
  tauxInteretMensuel: number; // e.g. 3 or 4
  categorieTaux: 'social' | 'equilibre'; // social (3%) or equilibre (4%)
  dateDecaissement: string;
  dateRemboursementFinal: string;
  
  // Repayments
  echeances: Echeance[];
  paiements: Paiement[];
  
  // Engagement Note metadata
  nomResponsable: string;
  dateEngagement: string;
  faitALieu: string; // default Kinshasa
  
  // Global audit trail
  creePar: string;
  creeLe: string;
  misAJourLe: string;
}
