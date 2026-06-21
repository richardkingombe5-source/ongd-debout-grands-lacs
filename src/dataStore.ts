/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Beneficiaire, ProjectSettings, UserAccount } from './types';

export const DEFAULT_SETTINGS: ProjectSettings = {
  capitalSocial: 15000000, // 15,000,000 CDF
  devise: 'CDF',
  montantPretMin: 300000,
  montantPretMax: 500000,
  dureeMoisDefaut: 3,
  tauxSocialMensuel: 3,
  tauxEquilibreMensuel: 4,
};

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user_admin',
    username: 'admin',
    passwordHash: 'admin123',
    role: 'admin',
    fullName: 'Rév. Pasteur Richard Kingombe (CVEM)',
    createdAt: '2026-06-01T08:00:00Z',
  },
  {
    id: 'user_agent_1',
    username: 'agent',
    passwordHash: 'agent123',
    role: 'agent',
    fullName: 'Maman Sarah Kalonji (Agent CVEM)',
    createdAt: '2026-06-01T09:30:00Z',
  }
];

// Helper to generate 3 milestones based on loan details
export function generateEcheances(
  montantAccorde: number,
  tauxMensuel: number,
  dateDecaissementStr: string,
  dureeMois: number = 3
): Beneficiaire['echeances'] {
  const echeances: Beneficiaire['echeances'] = [];
  const baseDate = new Date(dateDecaissementStr);
  
  // Total repayment includes capital + interest
  // Social: 3% per month, standard amortized monthly pay or interest + split capital.
  // Standard in this system: each month we pay (Capital / Durée) + (Capital * Taux).
  // E.g. loan of 300,000 CDF. Capital per month = 100,000 CDF.
  // Interest per month = 300,000 * 3% = 9,000 CDF.
  // Monthly playment = 109,000 CDF.
  const capitalMensuel = montantAccorde / dureeMois;
  const interetMensuel = montantAccorde * (tauxMensuel / 100);
  const montantEcheance = Math.round(capitalMensuel + interetMensuel);

  for (let i = 1; i <= dureeMois; i++) {
    const echeanceDate = new Date(baseDate);
    echeanceDate.setMonth(baseDate.getMonth() + i);
    
    // Fallback formatting YYYY-MM-DD
    const yyyy = echeanceDate.getFullYear();
    const mm = String(echeanceDate.getMonth() + 1).padStart(2, '0');
    const dd = String(echeanceDate.getDate()).padStart(2, '0');
    
    echeances.push({
      numero: i,
      date: `${yyyy}-${mm}-${dd}`,
      montantPrevu: montantEcheance,
      statut: 'en_attente',
    });
  }
  
  return echeances;
}

export const INITIAL_BENEFICIAIRES: Beneficiaire[] = [
  {
    id: 'b_1',
    nom: 'Ngalula',
    postNom: 'Mwamba',
    prenom: 'Therese',
    age: 42,
    etatCivil: 'Mariée',
    adresse: 'Avenue de la Paix 45, Q. Kingabwa, Limete, Kinshasa',
    telephone: '+243 812 345 678',
    activiteRevenus: 'Vente de pagnes au marché de Liberté',
    montantAccorde: 400000,
    dureeMois: 3,
    tauxInteretMensuel: 3,
    categorieTaux: 'social',
    dateDecaissement: '2026-03-10',
    dateRemboursementFinal: '2026-06-10',
    echeances: [
      { numero: 1, date: '2026-04-10', montantPrevu: 145333, statut: 'reussi' },
      { numero: 2, date: '2026-05-10', montantPrevu: 145333, statut: 'reussi' },
      { numero: 3, date: '2026-06-10', montantPrevu: 145333, statut: 'reussi' },
    ],
    paiements: [
      { numero: 1, montantPaye: 145333, datePaiement: '2026-04-09', soldeRestant: 290666, enregistrePar: 'agent' },
      { numero: 2, montantPaye: 145333, datePaiement: '2026-05-10', soldeRestant: 145333, enregistrePar: 'agent' },
      { numero: 3, montantPaye: 145333, datePaiement: '2026-06-11', soldeRestant: 0, enregistrePar: 'admin' },
    ],
    nomResponsable: 'Rév. Richard Kingombe',
    dateEngagement: '2026-03-10',
    faitALieu: 'Kinshasa',
    creePar: 'agent',
    creeLe: '2026-03-10T10:00:00Z',
    misAJourLe: '2026-06-11T16:00:00Z'
  },
  {
    id: 'b_2',
    nom: 'Mbuyi',
    postNom: 'Kanyinda',
    prenom: 'Nathalie',
    age: 35,
    etatCivil: 'Célibataire',
    adresse: 'Bvd Lumumba 128, Masina, Kinshasa',
    telephone: '+243 897 123 456',
    activiteRevenus: 'Kiosk de vente d\'aliments de base (Semoule, Huile)',
    montantAccorde: 500000,
    dureeMois: 3,
    tauxInteretMensuel: 3,
    categorieTaux: 'social',
    dateDecaissement: '2026-04-15',
    dateRemboursementFinal: '2026-07-15',
    echeances: [
      { numero: 1, date: '2026-05-15', montantPrevu: 181667, statut: 'reussi' },
      { numero: 2, date: '2026-06-15', montantPrevu: 181667, statut: 'en_attente' },
      { numero: 3, date: '2026-07-15', montantPrevu: 181667, statut: 'en_attente' },
    ],
    paiements: [
      { numero: 1, montantPaye: 181667, datePaiement: '2026-05-14', soldeRestant: 363334, enregistrePar: 'agent' }
    ],
    nomResponsable: 'Rév. Richard Kingombe',
    dateEngagement: '2026-04-15',
    faitALieu: 'Kinshasa',
    creePar: 'agent',
    creeLe: '2026-04-15T11:20:00Z',
    misAJourLe: '2026-05-14T14:15:00Z'
  },
  {
    id: 'b_3',
    nom: 'Kapinga',
    postNom: 'Tshibola',
    prenom: 'Elysée',
    age: 29,
    etatCivil: 'Veuve',
    adresse: 'Avenue Lukusa 12, Q. Debonhomme, Matete, Kinshasa',
    telephone: '+243 821 555 888',
    activiteRevenus: 'Atelier de couture et confection de vêtements de femmes',
    montantAccorde: 300000,
    dureeMois: 3,
    tauxInteretMensuel: 4,
    categorieTaux: 'equilibre',
    dateDecaissement: '2026-05-02',
    dateRemboursementFinal: '2026-08-02',
    echeances: [
      // Interest = 300000 * 4% = 12000. Capital = 100000. Total monthly = 112000.
      { numero: 1, date: '2026-06-02', montantPrevu: 112000, statut: 'en_attente' },
      { numero: 2, date: '2026-07-02', montantPrevu: 112000, statut: 'en_attente' },
      { numero: 3, date: '2026-08-02', montantPrevu: 112000, statut: 'en_attente' },
    ],
    paiements: [],
    nomResponsable: 'Rév. Richard Kingombe',
    dateEngagement: '2026-05-02',
    faitALieu: 'Kinshasa',
    creePar: 'admin',
    creeLe: '2026-05-02T09:00:00Z',
    misAJourLe: '2026-05-02T09:00:00Z'
  }
];

export function getStoredData() {
  if (typeof window === 'undefined') return { settings: DEFAULT_SETTINGS, users: DEFAULT_USERS, beneficiaires: INITIAL_BENEFICIAIRES };

  const settingsStr = localStorage.getItem('ongd_settings');
  const usersStr = localStorage.getItem('ongd_users');
  const beneficiairesStr = localStorage.getItem('ongd_beneficiaires');

  const settings: ProjectSettings = settingsStr ? JSON.parse(settingsStr) : DEFAULT_SETTINGS;
  const users: UserAccount[] = usersStr ? JSON.parse(usersStr) : DEFAULT_USERS;
  const beneficiaires: Beneficiaire[] = beneficiairesStr ? JSON.parse(beneficiairesStr) : INITIAL_BENEFICIAIRES;

  // Save back defaults if not set yet
  if (!settingsStr) localStorage.setItem('ongd_settings', JSON.stringify(DEFAULT_SETTINGS));
  if (!usersStr) localStorage.setItem('ongd_users', JSON.stringify(DEFAULT_USERS));
  if (!beneficiairesStr) localStorage.setItem('ongd_beneficiaires', JSON.stringify(INITIAL_BENEFICIAIRES));

  return { settings, users, beneficiaires };
}

export function saveSettings(settings: ProjectSettings) {
  localStorage.setItem('ongd_settings', JSON.stringify(settings));
}

export function saveUsers(users: UserAccount[]) {
  localStorage.setItem('ongd_users', JSON.stringify(users));
}

export function saveBeneficiaires(beneficiaires: Beneficiaire[]) {
  localStorage.setItem('ongd_beneficiaires', JSON.stringify(beneficiaires));
}
