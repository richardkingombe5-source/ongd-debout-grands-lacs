/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Beneficiaire } from '../types';

/**
 * Extracts Google Spreadsheet ID from a standard sharing URL
 */
export function extractSpreadsheetId(url: string): string | null {
  if (!url) return null;
  const matches = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return matches ? matches[1] : null;
}

/**
 * Performs a direct client-side synchronization payload write of the entire local
 * beneficiaries database to the linked Google Sheets file on behalf of Richard Kingombe.
 */
export async function syncToGoogleSheets(
  spreadsheetId: string,
  token: string,
  beneficiaires: Beneficiaire[]
): Promise<{ success: boolean; message?: string }> {
  if (!spreadsheetId) {
    return { success: false, message: "ID Google Sheets invalide ou non configuré." };
  }
  if (!token) {
    return { success: false, message: "Session Google déconnectée ou expirée." };
  }

  // Prepares the values matrix for the worksheet
  const headers = [
    'Ref-ID', 'Nom', 'Post-Nom', 'Prénom', 'Âge', 'État Civil', 'Adresse', 'Téléphone', 
    'Activité AGR', 'Montant Accordé', 'Durée (Mois)', 'Taux (Mois)', 'Catégorie Taux', 
    'Date Décaissement', 'Date Remboursement Final', 
    'Échéance 1 (Montant)', 'Échéance 1 (Statut)',
    'Échéance 2 (Montant)', 'Échéance 2 (Statut)',
    'Échéance 3 (Montant)', 'Échéance 3 (Statut)',
    'Cumul Payé', 'Solde Restant', 'Responsable du Crédit'
  ];

  const rows = beneficiaires.map(b => {
    const e1 = b.echeances.find(e => e.numero === 1);
    const e2 = b.echeances.find(e => e.numero === 2);
    const e3 = b.echeances.find(e => e.numero === 3);
    
    const totalPaid = b.paiements.reduce((sum, p) => sum + p.montantPaye, 0);
    const expectedTotal = b.echeances.reduce((sum, e) => sum + e.montantPrevu, 0);
    const remainingBalance = Math.max(0, expectedTotal - totalPaid);

    return [
      b.id,
      b.nom,
      b.postNom,
      b.prenom,
      b.age,
      b.etatCivil,
      b.adresse,
      b.telephone,
      b.activiteRevenus,
      b.montantAccorde,
      b.dureeMois,
      b.tauxInteretMensuel,
      b.categorieTaux,
      b.dateDecaissement,
      b.dateRemboursementFinal,
      e1 ? e1.montantPrevu : '',
      e1 ? e1.statut : '',
      e2 ? e2.montantPrevu : '',
      e2 ? e2.statut : '',
      e3 ? e3.montantPrevu : '',
      e3 ? e3.statut : '',
      totalPaid,
      remainingBalance,
      b.nomResponsable
    ];
  });

  const body = {
    values: [headers, ...rows]
  };

  try {
    // 1. Try default Sheet1!A1 range
    const range = encodeURIComponent("Sheet1!A1");
    let response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      // 2. Backup: try Feuille1 (French Google Sheets default name)
      console.warn("Sheet1 write failed, trying Feuille1...");
      const alternativeRange = encodeURIComponent("Feuille1!A1");
      const altResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${alternativeRange}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!altResponse.ok) {
        // 3. Last fallback: try writing with general A1 (Google Sheets defaults to first sheet automatically)
        console.warn("Feuille1 write failed, trying general range A1...");
        const defaultResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1?valueInputOption=USER_ENTERED`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        if (!defaultResponse.ok) {
          const errData = await defaultResponse.json();
          throw new Error(errData.error?.message || "Erreur de communication avec l'API Google Sheets.");
        }
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Fiche sync warning:", error);
    return { success: false, message: error.message || String(error) };
  }
}
