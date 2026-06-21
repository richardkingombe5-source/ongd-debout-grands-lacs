/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Beneficiaire, ProjectSettings } from '../types';
import { extractSpreadsheetId, syncToGoogleSheets } from '../utils/googleSheetsSync';
import { 
  listDriveSpreadsheets, 
  createNewSpreadsheetOnDrive, 
  backupDatabaseToDrive, 
  restoreDatabaseFromDrive, 
  DriveFile 
} from '../utils/googleDriveSync';
import { 
  FileSpreadsheet, Copy, Check, Download, ExternalLink, HelpCircle, 
  RefreshCw, FileText, Key, LogIn, LogOut, CheckCircle, AlertCircle, 
  Info, Folder, CloudUpload, CloudDownload, Plus, Search, Table, 
  Database, DatabaseBackup, ChevronRight, FileJson
} from 'lucide-react';

interface GoogleSheetsIntegrationProps {
  beneficiaires: Beneficiaire[];
  settings: ProjectSettings;
  onBack: () => void;
  googleToken: string | null;
  setGoogleToken: (token: string | null) => void;
  onRestoreData: (beneficiaires: Beneficiaire[]) => void;
}

type ActiveSubTab = 'sheets' | 'drive' | 'backup';

export default function GoogleSheetsIntegration({
  beneficiaires,
  settings,
  onBack,
  googleToken,
  setGoogleToken,
  onRestoreData
}: GoogleSheetsIntegrationProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveSubTab>('sheets');
  
  // Sheet config state
  const [sheetUrl, setSheetUrl] = useState(localStorage.getItem('ongd_sheet_url') || '');
  const [clientId, setClientId] = useState(
    localStorage.getItem('ongd_google_client_id') || 
    '1083756858290-7v7e4g4g8g9g101112131415.apps.googleusercontent.com'
  );
  
  // Sync status
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);

  // Drive integration state
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  
  // Backup & Restore state
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  const [backupStatus, setBackupStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [backupError, setBackupError] = useState<string | null>(null);
  const [backupFileInfo, setBackupFileInfo] = useState<DriveFile | null>(null);

  const [isRestoreInProgress, setIsRestoreInProgress] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // Auto-fetch files from Google Drive when tab loads and token is present
  useEffect(() => {
    if (googleToken && activeTab === 'drive') {
      handleLoadDriveSheets();
    }
  }, [googleToken, activeTab]);

  const handleLoadDriveSheets = async () => {
    if (!googleToken) return;
    setIsLoadingDrive(true);
    setDriveError(null);
    try {
      const files = await listDriveSpreadsheets(googleToken);
      setDriveFiles(files);
    } catch (err: any) {
      setDriveError(err.message || "Erreur lors de la récupération des fichiers sur Google Drive.");
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleCreateNewSheet = async () => {
    if (!googleToken) {
      alert("Veuillez d'abord brancher votre compte Google.");
      return;
    }
    
    setIsCreatingSheet(true);
    setDriveError(null);
    try {
      const title = `ONGD Debout Grands Lacs - Suivi des Bénéficiaires (${new Date().getFullYear()})`;
      const newSheet = await createNewSpreadsheetOnDrive(googleToken, title);
      
      // Compute correct edit URL
      const computedUrl = `https://docs.google.com/spreadsheets/d/${newSheet.id}/edit`;
      setSheetUrl(computedUrl);
      localStorage.setItem('ongd_sheet_url', computedUrl);

      // Trigger automatic initial data sync onto this brand new sheet
      const syncResult = await syncToGoogleSheets(newSheet.id, googleToken, beneficiaires);
      
      if (syncResult.success) {
        setSyncStatus('success');
        alert(`Fichier Google Sheet "${title}" créé avec succès sur votre Drive et initialisé avec vos données !`);
      } else {
        alert(`Fichier Google Sheet créé sur votre Drive, mais l'écriture initiale a échoué: ${syncResult.message}`);
      }

      // Reload Drive files list
      handleLoadDriveSheets();
    } catch (err: any) {
      setDriveError(err.message || "Erreur lors de la création du fichier sur Google Drive.");
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleSelectDriveFile = (file: DriveFile) => {
    const computedUrl = `https://docs.google.com/spreadsheets/d/${file.id}/edit`;
    setSheetUrl(computedUrl);
    localStorage.setItem('ongd_sheet_url', computedUrl);
    alert(`Fichier "${file.name}" sélectionné avec succès !`);
    setActiveTab('sheets');
  };

  const handleBackupToDrive = async () => {
    if (!googleToken) {
      alert("Veuillez d'abord brancher votre compte Google.");
      return;
    }

    setIsBackupInProgress(true);
    setBackupStatus('idle');
    setBackupError(null);
    setBackupFileInfo(null);

    try {
      const backupData = {
        beneficiaires,
        settings,
        exportDate: new Date().toISOString(),
        author: "Rév. Richard Kingombe"
      };

      const result = await backupDatabaseToDrive(googleToken, backupData);
      
      if (result.success) {
        setBackupStatus('success');
        if (result.file) {
          setBackupFileInfo(result.file);
        }
      } else {
        setBackupStatus('error');
        setBackupError(result.message);
      }
    } catch (err: any) {
      setBackupStatus('error');
      setBackupError(err.message || String(err));
    } finally {
      setIsBackupInProgress(false);
    }
  };

  const handleRestoreFromDrive = async () => {
    if (!googleToken) {
      alert("Veuillez d'abord brancher votre compte Google.");
      return;
    }

    if (!confirm("Attention: Cette action va écraser vos données locales actuelles avec les données sauvegardées sur votre compte Google Drive. Souhaitez-vous continuer ?")) {
      return;
    }

    setIsRestoreInProgress(true);
    setRestoreStatus('idle');
    setRestoreError(null);

    try {
      const result = await restoreDatabaseFromDrive(googleToken);
      
      if (result.success && result.data) {
        if (result.data.beneficiaires && Array.isArray(result.data.beneficiaires)) {
          // Restore to local memory state and save it
          onRestoreData(result.data.beneficiaires);
          setRestoreStatus('success');
          alert("Données restaurées avec succès depuis Google Drive !");
        } else {
          setRestoreStatus('error');
          setRestoreError("Le fichier de sauvegarde trouvé ne contient pas un registre de bénéficiaires valide.");
        }
      } else {
        setRestoreStatus('error');
        setRestoreError(result.message);
      }
    } catch (err: any) {
      setRestoreStatus('error');
      setRestoreError(err.message || String(err));
    } finally {
      setIsRestoreInProgress(false);
    }
  };

  // 1. Generate standard CSV text
  const generateCSV = () => {
    const headers = [
      'Ref-ID', 'Nom', 'Post-Nom', 'Prénom', 'Âge', 'État Civil', 'Adresse', 'Téléphone', 
      'Activité AGR', 'Montant Accordé', 'Durée (Mois)', 'Taux (Mois)', 'Catégorie Taux', 
      'Date Décaissement', 'Date Remboursement Final', 'Échéance 1 Prévu', 'Échéance 1 Statut',
      'Échéance 2 Prévu', 'Échéance 2 Statut', 'Échéance 3 Prévu', 'Échéance 3 Statut',
      'Total Payé', 'Solde Restant', 'Responsable'
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
        `"${b.adresse.replace(/"/g, '""')}"`,
        b.telephone,
        `"${b.activiteRevenus.replace(/"/g, '""')}"`,
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

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    return csvContent;
  };

  // 2. Generate TSV (Tab separated text) perfect for Copy-Paste direct to cells in Google Sheets
  const generateTSV = () => {
    const headers = [
      'Ref-ID', 'Nom', 'Post-Nom', 'Prénom', 'Âge', 'État Civil', 'Adresse', 'Téléphone', 
      'Activité AGR', 'Montant Accordé', 'Durée (Mois)', 'Taux (Mois)', 'Catégorie Taux', 
      'Date Décaissement', 'Date Remboursement Final', 'Échéance 1 (Montant)', 'Échéance 1 (Statut)',
      'Échéance 2 (Montant)', 'Échéance 2 (Statut)', 'Échéance 3 (Montant)', 'Échéance 3 (Statut)',
      'Cumul Payé (CDF)', 'Solde Restant (CDF)', 'Responsable du Crédit'
    ];

    const rows = beneficiaires.map(b => {
      const e1 = b.echeances.find(e => e.numero === 1);
      const e2 = b.echeances.find(e => e.numero === 2);
      const e3 = b.echeances.find(e => e.numero === 3);
      
      const totalPaid = b.paiements.reduce((sum, p) => sum + p.montantPaye, 0);
      const expectedTotal = b.echeances.reduce((sum, e) => sum + e.montantPrevu, 0);
      const remainingBalance = Math.max(0, expectedTotal - totalPaid);

      return [
        b.id, b.nom, b.postNom, b.prenom, b.age, b.etatCivil, b.adresse, b.telephone, 
        b.activiteRevenus, b.montantAccorde + ' CDF', b.dureeMois, b.tauxInteretMensuel + '%', 
        b.categorieTaux, b.dateDecaissement, b.dateRemboursementFinal, 
        e1 ? e1.montantPrevu : '', e1 ? e1.statut : '',
        e2 ? e2.montantPrevu : '', e2 ? e2.statut : '',
        e3 ? e3.montantPrevu : '', e3 ? e3.statut : '',
        totalPaid + ' CDF', remainingBalance + ' CDF', b.nomResponsable
      ];
    });

    return [
      headers.join('\t'),
      ...rows.map(r => r.join('\t'))
    ].join('\n');
  };

  const handleDownloadCSV = () => {
    const csvContent = generateCSV();
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ongd_debout_grands_lacs_beneficiaires_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyToClipboard = () => {
    const tsvContent = generateTSV();
    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSaveSheetUrlAndClient = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('ongd_sheet_url', sheetUrl);
    localStorage.setItem('ongd_google_client_id', clientId);
    alert('Configuration de tableur enregistrée avec succès.');
  };

  // Google OAuth redirect login with expanded Google Drive scopes
  const handleGoogleLogin = () => {
    // Persist configuration
    localStorage.setItem('ongd_sheet_url', sheetUrl);
    localStorage.setItem('ongd_google_client_id', clientId);

    const redirectUri = window.location.origin + '/';
    const driveScopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive'
    ].join(' ');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(driveScopes)}&prompt=consent`;
    
    // Redirect top window to start authenticating
    window.location.href = authUrl;
  };

  const handleLogoutGoogle = () => {
    setGoogleToken(null);
    setSyncStatus('idle');
    setSyncError(null);
    alert("Session Google déconnectée.");
  };

  const handleTriggerSync = async () => {
    if (!googleToken) {
      alert("Veuillez d'abord vous connecter à votre compte Google.");
      return;
    }
    
    const spreadsheetId = extractSpreadsheetId(sheetUrl);
    if (!spreadsheetId) {
      alert("Veuillez configurer ou sélectionner un fichier Google Sheets valide.");
      return;
    }

    setIsSyncing(true);
    setSyncStatus('idle');
    setSyncError(null);

    const result = await syncToGoogleSheets(spreadsheetId, googleToken, beneficiaires);
    setIsSyncing(false);

    if (result.success) {
      setSyncStatus('success');
    } else {
      setSyncStatus('error');
      setSyncError(result.message || "Impossible de mettre à jour le document Google Sheets.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in text-xs">
      
      {/* Return Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h2 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2">
            <Folder className="w-6 h-6 text-indigo-400" />
            Intégration Google Cloud Drive & Sheets
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Synchronisez directement votre ONGD avec Google Sheets pour exporter les bénéficiaires et sauvegardez votre base locale sur Google Drive.
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold bg-slate-950/80 border border-slate-850 rounded-xl transition-all shadow cursor-pointer self-start sm:self-auto inline-flex items-center gap-2 hover:bg-slate-900"
        >
          Retour au registre
        </button>
      </div>

      {/* Global Connection Dashboard */}
      <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-md">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-indigo-400">
            {googleToken ? <Check className="w-6 h-6 text-emerald-400 stroke-[3px]" /> : <Key className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Statut de la Connexion Google</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              {googleToken 
                ? "🟢 Connecté à votre compte Google - Tous les outils Cloud (Drive, Sheets) sont déverrouillés." 
                : "🔴 Session hors-ligne. Vous travaillez en cache local sécurisé sur votre navigateur."
              }
            </p>
            {googleToken && (
              <div className="flex gap-2 items-center text-[10px] text-emerald-400 font-mono mt-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Suivi cloud actif en temps réel
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {googleToken ? (
            <>
              <button
                onClick={handleLogoutGoogle}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Déconnecter Google
              </button>
            </>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              <LogIn className="w-4.5 h-4.5" />
              Brancher Mon Compte Google
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs inside Google integration screen */}
      <div className="flex border-b border-slate-850 gap-2">
        <button
          onClick={() => setActiveTab('sheets')}
          className={`px-4 py-3 font-semibold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'sheets' 
              ? 'border-emerald-500 text-white bg-slate-900/30' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Synchronisation Google Sheets
        </button>
        <button
          onClick={() => setActiveTab('drive')}
          className={`px-4 py-3 font-semibold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'drive' 
              ? 'border-indigo-500 text-white bg-slate-900/30' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Folder className="w-4 h-4" />
          Explorateur Google Drive
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-3 font-semibold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 relative ${
            activeTab === 'backup' 
              ? 'border-pink-500 text-white bg-slate-900/30' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          Sauvegarde & Restauration Cloud
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column Content based on Active Sub-Tab */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TAB 1: GOOGLE SHEETS SYNC CLIENT */}
          {activeTab === 'sheets' && (
            <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
              <div className="border-b border-slate-850 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-3.5 bg-emerald-500 rounded"></span>
                  Liaison manuelle du fichier Google Sheets
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Configurez le fichier de destination en collant son lien d'accès. Vous pouvez également utiliser l'onglet "Explorateur Google Drive" ci-dessus pour rechercher ou créer un fichier automatiquement !
                </p>
              </div>

              <form onSubmit={handleSaveSheetUrlAndClient} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Lien URL du Fichier Google Sheets de l'ONGD
                  </label>
                  <input
                    id="sheet-url-input"
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    required
                    placeholder="https://docs.google.com/spreadsheets/d/votre-sheet-id/edit"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-650 focus:bg-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono transition-all font-semibold"
                  />
                  {sheetUrl && extractSpreadsheetId(sheetUrl) && (
                    <div className="text-[10px] mt-1 text-slate-500 font-mono">
                      ID Détecté: <span className="text-slate-400 font-bold">{extractSpreadsheetId(sheetUrl)}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    ID Client API Google Console (OAuth Client ID)
                  </label>
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                    placeholder="xxxx-xxxx.apps.googleusercontent.com"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 placeholder-slate-650 focus:bg-slate-900 focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Ceci s'exécute directement côté client (HTML5/Fetch). Vos identifiants restent privés et ne transitent sur aucun serveur intermédiaire.
                  </p>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer font-sans"
                  >
                    Enregistrer la liaison
                  </button>
                </div>
              </form>

              {/* Action Buttons for Sheets */}
              <div className="pt-4 border-t border-slate-850 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">Synchroniser maintenant</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Écrit l'ensemble de votre base locale sur le tableur.</p>
                </div>

                <button
                  onClick={handleTriggerSync}
                  disabled={isSyncing || !googleToken}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 text-white ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Synchronisation...' : 'Synchroniser sur Sheets'}
                </button>
              </div>

              {/* Status feedbacks */}
              {syncStatus === 'success' && (
                <div className="text-xs font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 p-3.5 rounded-xl flex items-start gap-2.5 animate-fade-in">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 stroke-[3.5]" />
                  <div>
                    <p>Fichier synchronisé avec succès !</p>
                    <p className="font-medium text-[10px] text-slate-400 mt-0.5">
                      Les fiches ont été transférées directement dans le tableur Google de l'organisation. Richard Kingombe peut maintenant l'ouvrir pour filtrer, créer des graphiques ou imprimer des bilans.
                    </p>
                  </div>
                </div>
              )}

              {syncStatus === 'error' && (
                <div className="text-sm font-bold text-red-400 bg-red-950/30 border border-red-900/30 p-3.5 rounded-xl flex items-start gap-2.5 animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold">Échec de réécriture</h5>
                    <p className="font-medium text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                      {syncError || "Vérifiez vos identifiants Client ID et assurez-vous que le fichier Sheets accorde l'accès en écriture au compte de l'organisation."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GOOGLE DRIVE MANAGER */}
          {activeTab === 'drive' && (
            <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
              <div className="border-b border-slate-850 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-indigo-500 rounded"></span>
                    Fichiers Google Sheets sur votre Google Drive
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Sélectionnez un fichier existant ou créez-en un nouveau d'un seul clic !
                  </p>
                </div>

                {googleToken && (
                  <button
                    onClick={handleCreateNewSheet}
                    disabled={isCreatingSheet}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all self-start"
                  >
                    {isCreatingSheet ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    {isCreatingSheet ? 'Création...' : 'Créer un Google Sheet'}
                  </button>
                )}
              </div>

              {!googleToken ? (
                <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-850/60 flex flex-col items-center justify-center space-y-3">
                  <Folder className="w-8 h-8 text-slate-650" />
                  <div>
                    <p className="font-bold text-slate-300">Connexion requise</p>
                    <p className="text-[11px] text-slate-450 mt-1 max-w-sm">
                      Veuillez vous authentifier à l'aide du bouton "Brancher Mon Compte Google" en haut de la page pour parcourir vos dossiers cloud.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File browser search button / Refresh list */}
                  <div className="flex justify-between items-center bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-850/50">
                    <span className="text-slate-400 font-semibold text-[11px]">Derniers fichiers modifiés</span>
                    <button
                      onClick={handleLoadDriveSheets}
                      disabled={isLoadingDrive}
                      className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                      Actualiser la liste
                    </button>
                  </div>

                  {isLoadingDrive ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                      <span className="text-[11px] text-slate-450">Lecture sécurisée de votre Google Drive...</span>
                    </div>
                  ) : driveError ? (
                    <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p className="text-[10px] font-medium">{driveError}</p>
                    </div>
                  ) : driveFiles.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950/20 border border-slate-850 rounded-xl text-slate-450 text-[11px]">
                      Aucun tableur existant trouvé sur votre compte Google Drive. Utilisez le bouton ci-dessus pour en créer un !
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-850/50 border border-slate-850 rounded-xl bg-slate-950/30 pr-1">
                      {driveFiles.map((file) => {
                        const isCurrentlyLinked = sheetUrl.includes(file.id);
                        return (
                          <div key={file.id} className="p-3 flex items-center justify-between hover:bg-slate-900/60 transition-all gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <Table className="w-4 h-4 text-emerald-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-200 truncate pr-2 text-xs">{file.name}</p>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                                  <span>ID: {file.id.substring(0, 10)}...</span>
                                  <span>•</span>
                                  <span>Modifié: {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Inconnu'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 px-2 border border-slate-800 rounded bg-slate-900 text-slate-400 hover:text-white transition-all text-[10px] font-bold flex items-center gap-1"
                                >
                                  Ouvrir <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                              
                              <button
                                onClick={() => handleSelectDriveFile(file)}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer ${
                                  isCurrentlyLinked
                                    ? 'bg-emerald-950/50 border border-emerald-900/50 text-emerald-400'
                                    : 'bg-indigo-650 hover:bg-indigo-500 text-white'
                                }`}
                              >
                                {isCurrentlyLinked ? "Lié ✓" : "Lier ce fichier"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
              <div className="border-b border-slate-850 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-3.5 bg-pink-500 rounded"></span>
                  Garde-Fou Cloud : Sauvegarder la base locale sur Google Drive
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Puisque cette application est autonome (s'exécute localement sur votre ordinateur/téléphone), exportez des sauvegardes sécurisées sur votre espace personnel Google Drive pour être sûr de ne jamais perdre vos registres, même si vous changez d'appareil ou réinitialisez votre navigateur.
                </p>
              </div>

              {!googleToken ? (
                <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-850/60 flex flex-col items-center justify-center space-y-3">
                  <DatabaseBackup className="w-8 h-8 text-slate-650" />
                  <div>
                    <p className="font-bold text-slate-300">Connexion requise</p>
                    <p className="text-[11px] text-slate-450 mt-1 max-w-sm">
                      Branchez votre compte Google au préalable afin que le système puisse envoyer ou recevoir vos fichiers de sauvegarde JSON.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                  
                  {/* Backup Card */}
                  <div className="p-5 rounded-2xl border border-slate-850 bg-slate-950/30 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="p-2 bg-pink-500/10 text-pink-400 w-fit rounded-xl border border-pink-900/30 mb-2">
                        <CloudUpload className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-white text-xs">Exporter vos données</h4>
                      <p className="text-[11px] text-slate-450 leading-relaxed">
                        Écrit instantanément votre configurateur et liste de bénéficiaires dans un fichier nommé <span className="text-slate-300 font-bold">"ongd_debout_grands_lacs_backup.json"</span> sur votre Google Drive.
                      </p>
                    </div>

                    <button
                      onClick={handleBackupToDrive}
                      disabled={isBackupInProgress}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-650 hover:bg-pink-500 text-white font-bold rounded-xl shadow transition-all cursor-pointer disabled:opacity-45"
                    >
                      {isBackupInProgress ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                      Sauvegarder vers le Cloud
                    </button>
                  </div>

                  {/* Restore Card */}
                  <div className="p-5 rounded-2xl border border-slate-850 bg-slate-950/30 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="p-2 bg-indigo-500/10 text-indigo-400 w-fit rounded-xl border border-indigo-900/30 mb-2">
                        <CloudDownload className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-white text-xs">Restaurer vos données</h4>
                      <p className="text-[11px] text-slate-450 leading-relaxed">
                        Récupère la sauvegarde <span className="text-slate-300 font-bold">"ongd_debout_grands_lacs_backup.json"</span> de votre Drive et remplace le registre actuel. Pratique si vous changez d'appareil.
                      </p>
                    </div>

                    <button
                      onClick={handleRestoreFromDrive}
                      disabled={isRestoreInProgress}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-550 border border-indigo-500/30 text-white font-bold rounded-xl shadow transition-all cursor-pointer disabled:opacity-45"
                    >
                      {isRestoreInProgress ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />}
                      Importer la Sauvegarde Google
                    </button>
                  </div>

                </div>
              )}

              {/* Feedbacks for Backup */}
              {backupStatus === 'success' && (
                <div className="text-xs font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 p-4 rounded-xl flex items-start gap-2.5 animate-fade-in">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 stroke-[3px]" />
                  <div>
                    <h5 className="text-xs font-bold">Sauvegarde effectuée !</h5>
                    <p className="font-medium text-[10px] text-slate-400 mt-1">
                      Votre registre de prêt a été envoyé avec succès dans votre espace personnel Google Drive :
                    </p>
                    {backupFileInfo && (
                      <div className="mt-2 flex items-center gap-2 font-mono text-[10px] bg-slate-950 p-2 rounded border border-slate-850">
                        <FileJson className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                        <span className="truncate max-w-sm text-slate-300 font-semibold">{backupFileInfo.name}</span>
                        {backupFileInfo.webViewLink && (
                          <a
                            href={backupFileInfo.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-indigo-400 underline flex items-center gap-0.5 font-sans"
                          >
                            Consulter <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {backupStatus === 'error' && (
                <div className="p-3 bg-red-950/35 border border-red-900/40 text-red-400 rounded-xl text-[10px] font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>Sauvegarde impossible: {backupError}</p>
                </div>
              )}

              {/* Feedbacks for Restore */}
              {restoreStatus === 'success' && (
                <div className="text-xs font-bold text-emerald-400 bg-emerald-950/35 border border-emerald-900/40 p-4 rounded-xl flex items-center gap-2.5 animate-fade-in">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 stroke-[3px]" />
                  <div>
                    <h5 className="text-xs font-bold">Données synchronisées !</h5>
                    <p className="font-medium text-[10px] text-slate-400 mt-0.5">
                      L'intégralité du registre de prêt local a été écrasée et remplacée par la sauvegarde importée de Google Drive.
                    </p>
                  </div>
                </div>
              )}

              {restoreStatus === 'error' && (
                <div className="p-3 bg-red-950/35 border border-red-900/40 text-red-400 rounded-xl text-[10px] font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>Échec de restauration: {restoreError}</p>
                </div>
              )}

            </div>
          )}

          {/* Quick Offline copy paste backup */}
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-amber-500 rounded"></span>
                Sécurité Supplémentaire : Copier-Coller Un Tabulaire en 1 Clic
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Garantit un fonctionnement sans connexion internet ou lors des baisses de réseau à Kinshasa. Copiez tout le tableau et collez-le directement dans votre fichier Excel ou Google Sheets !
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                id="btn-copy-tsv"
                onClick={handleCopyToClipboard}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-850 hover:bg-slate-750 text-slate-200 border border-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400 stroke-[3px]" /> : <Copy className="w-4 h-4 text-slate-400" />}
                {copied ? 'Données Copiées !' : 'Copier Direct pour Google Sheets'}
              </button>

              <button
                id="btn-download-csv"
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-950/40 border border-emerald-900/30 hover:bg-emerald-900/60 text-emerald-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Télécharger le fichier .CSV (Excel)
              </button>
            </div>
            
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 leading-normal text-slate-450 text-[10px] flex gap-2">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <p>
                <strong>Mode d'emploi rapide :</strong> Cliquez sur "Copier Direct", puis ouvrez votre tableur, sélectionnez la première case (A1) et faites simplement <strong>Ctrl+V</strong> (ou Coller). Toute la grille se formatera automatiquement !
              </p>
            </div>
          </div>

        </div>

        {/* Right column: help instruction cards */}
        <div className="space-y-6">
          <div className="bg-slate-950/50 rounded-2xl border border-slate-900 p-6 space-y-4 shadow-xl backdrop-blur-md">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
              <HelpCircle className="w-4.5 h-4.5 text-slate-450" />
              Comment déployer cet outil sur n'importe quel serveur ?
            </h4>

            <div className="space-y-3.5 text-xs text-slate-400 leading-relaxed font-sans">
              <p className="text-[11px] text-slate-350">
                Puisque l'intégration Google Sheets et Google Drive s'exécute directement dans le navigateur de l'utilisateur (client-side), l'ensemble de l'application peut être exporté et hébergé sur <strong>N'IMPORTE QUEL hébergeur ou serveur</strong> sans aucune base de données de serveur requise !
              </p>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-850 text-slate-300 border border-slate-850 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-bold text-white">Créer le fichier tableur</p>
                  <p className="text-[11px] text-slate-450 mt-0.5">Créez un tableur vide ou utilisez votre fichier de suivi financier sur Google Drive.</p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-850 text-slate-300 border border-slate-850 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-bold text-white">Créer des identifiants API</p>
                  <p className="text-[11px] text-slate-450 mt-0.5">Allez sur l'API Console Google, activez l'API Google Sheets et l'API Google Drive, puis créez un client OAuth application web.</p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-850 text-slate-300 border border-slate-850 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-bold text-white">Configurer l'URI du serveur</p>
                  <p className="text-[11px] text-slate-450 mt-0.5">Dans votre client OAuth Google, configurez vos "Origines JavaScript" pour inclure l'URL de votre serveur.</p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-850 text-slate-300 border border-slate-850 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">4</span>
                <div>
                  <p className="font-bold text-white">Prêt à héberger !</p>
                  <p className="text-[11px] text-slate-450 mt-0.5">Téléversez les fichiers HTML statiques sur Vercel, Netlify, Github Pages ou votre propre VPS. Aucune maintenance complexe n'est requise !</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
