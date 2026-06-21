/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  getStoredData, 
  saveSettings, 
  saveUsers, 
  saveBeneficiaires 
} from './dataStore';
import { Beneficiaire, ProjectSettings, UserAccount } from './types';
import { extractSpreadsheetId, syncToGoogleSheets } from './utils/googleSheetsSync';

// Components
import LoginScreen from './components/LoginScreen';
import DashboardStats from './components/DashboardStats';
import LoanForm from './components/LoanForm';
import RepaymentTracker from './components/RepaymentTracker';
import EngagementNote from './components/EngagementNote';
import SettingsPanel from './components/SettingsPanel';
import GoogleSheetsIntegration from './components/GoogleSheetsIntegration';

// Icons
import { 
  Users, Settings as SettingsIcon, LogOut, FileSpreadsheet, 
  ShieldCheck, LayoutDashboard, UserCheck, Milestone, CalendarDays, RefreshCw
} from 'lucide-react';

export default function App() {
  // 1. App State
  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [beneficiaires, setBeneficiaires] = useState<Beneficiaire[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  
  // Google sync state (In-memory cached tokens)
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [syncingActiveSheet, setSyncingActiveSheet] = useState<boolean>(false);

  // Router tabs: 'dashboard' | 'form' | 'repayments' | 'engagement' | 'settings' | 'google-sheets'
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedBeneficiaire, setSelectedBeneficiaire] = useState<Beneficiaire | null>(null);

  // Parse Google OAuth redirect Access Token
  useEffect(() => {
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      if (accessToken) {
        setGoogleToken(accessToken);
        // Clear hash from address bar for visual cleanliness
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // 2. Hydrate from Storage
  useEffect(() => {
    const data = getStoredData();
    setSettings(data.settings);
    setUsers(data.users);
    setBeneficiaires(data.beneficiaires);

    // Keep active session if already logged in (Simulated)
    const storedSession = sessionStorage.getItem('ongd_active_session');
    if (storedSession) {
      const parsedUser = JSON.parse(storedSession);
      // Ensure user still exists
      const match = data.users.find(u => u.id === parsedUser.id);
      if (match) setCurrentUser(match);
    }
  }, []);

  // Background Google Sheets auto synchroniser
  const autoSyncToSheets = async (currentList: Beneficiaire[]) => {
    const sheetUrl = localStorage.getItem('ongd_sheet_url');
    if (!googleToken || !sheetUrl) return;

    const spreadsheetId = extractSpreadsheetId(sheetUrl);
    if (!spreadsheetId) return;

    setSyncingActiveSheet(true);
    const result = await syncToGoogleSheets(spreadsheetId, googleToken, currentList);
    setSyncingActiveSheet(false);
  };

  // 3. Handlers
  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    sessionStorage.setItem('ongd_active_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('ongd_active_session');
    setGoogleToken(null);
    setCurrentTab('dashboard');
    setSelectedBeneficiaire(null);
  };

  const handleSaveSettings = (updatedSettings: ProjectSettings) => {
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  const handleSaveUsers = (updatedUsers: UserAccount[]) => {
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
  };

  // Callback to register a new loan or update existing beneficiary details
  const handleSaveBeneficiaire = (data: Beneficiaire) => {
    let updatedList: Beneficiaire[];
    
    const exists = beneficiaires.some(b => b.id === data.id);
    if (exists) {
      updatedList = beneficiaires.map(b => b.id === data.id ? data : b);
    } else {
      updatedList = [data, ...beneficiaires];
    }

    setBeneficiaires(updatedList);
    saveBeneficiaires(updatedList);
    
    // Automatically replicate change direct to Google Sheets
    autoSyncToSheets(updatedList);

    // Redirect back to main dashboard
    setCurrentTab('dashboard');
    setSelectedBeneficiaire(null);
  };

  // Helper inside tracking workflows to record partial repayments & balances
  const handleUpdateBeneficiaireFromTracker = (updated: Beneficiaire) => {
    const updatedList = beneficiaires.map(b => b.id === updated.id ? updated : b);
    setBeneficiaires(updatedList);
    saveBeneficiaires(updatedList);
    
    // Refresh core selection reference
    setSelectedBeneficiaire(updated);

    // Automatically replicate change direct to Google Sheets
    autoSyncToSheets(updatedList);
  };

  const handleSelectBeneficiaire = (id: string, tab: 'repayments' | 'engagement' | 'form') => {
    const target = beneficiaires.find(b => b.id === id);
    if (target) {
      setSelectedBeneficiaire(target);
      setCurrentTab(tab);
    }
  };

  const handleAddNewBeneficiaire = () => {
    setSelectedBeneficiaire(null); // Indicates registering fresh loan
    setCurrentTab('form');
  };

  // 4. Render Guards
  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] font-mono text-xs text-slate-400 immersive-gradient">
        <div className="flex items-center gap-3 bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 shadow-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Chargement des paramètres de l'application...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen users={users} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 flex flex-col font-sans immersive-gradient">
      
      {/* PERSISTENT HEADER (Hidden on Print for elegant clean templates) */}
      <header className="bg-slate-900/60 border-b border-slate-800/85 sticky top-0 z-40 print:hidden backdrop-blur-md shadow-lg shadow-slate-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Logo & Text info */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-extrabold text-white tracking-tight font-display uppercase">
                  ONGD DEBOUT GRANDS LACS
                </h1>
                <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-800/60 uppercase tracking-widest">
                  PROG. CVEM
                </span>
              </div>
              <p className="text-[11px] text-slate-400/95 font-medium tracking-wide">
                Système Administratif d'Autonomisation et d'Épargne Solidaire
              </p>
            </div>
          </div>

          {/* Quick Access Menu Tabs */}
          <nav className="flex flex-wrap items-center gap-2 ml-auto lg:ml-0">
            
            {/* Tab: Dashboard stats */}
            <button
              id="menu-dashboard"
              onClick={() => { setCurrentTab('dashboard'); setSelectedBeneficiaire(null); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                currentTab === 'dashboard' || currentTab === 'form' || currentTab === 'repayments' || currentTab === 'engagement'
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/10'
                  : 'bg-slate-900/40 border-slate-800/50 text-slate-300 hover:bg-slate-800/60 hover:text-white hover:border-slate-700/80'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Registre
            </button>

            {/* Tab: Google Sheets Sync */}
            <button
              id="menu-google-sheets"
              onClick={() => { setCurrentTab('google-sheets'); setSelectedBeneficiaire(null); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                currentTab === 'google-sheets'
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/10'
                  : 'bg-slate-900/40 border-slate-800/50 text-slate-300 hover:bg-slate-800/60 hover:text-white hover:border-slate-700/80'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Google Sheets
            </button>

            {/* Tab: Settings Panel (Admin Only limitation) */}
            {currentUser.role === 'admin' ? (
              <button
                id="menu-settings"
                onClick={() => { setCurrentTab('settings'); setSelectedBeneficiaire(null); }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  currentTab === 'settings'
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/10'
                    : 'bg-slate-900/40 border-slate-800/50 text-slate-300 hover:bg-slate-800/60 hover:text-white hover:border-slate-700/80'
                }`}
              >
                <SettingsIcon className="w-4 h-4 text-slate-300" />
                DGL Paramètres
              </button>
            ) : (
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-xl flex items-center gap-1.5 border border-slate-800/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Mode Agent
              </span>
            )}

            {/* Separator */}
            <div className="w-px h-6 bg-slate-800 mx-1.5 hidden sm:block"></div>

            {/* Session Card Info */}
            <div className="flex items-center gap-3 pl-1">
              <div className="text-right hidden md:block">
                <span className="block text-xs font-bold text-white tracking-wide">
                  {currentUser.fullName}
                </span>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">
                  {currentUser.role === 'admin' ? 'Administrateur' : 'Agent CVEM'}
                </span>
              </div>
              <button
                id="btn-logout"
                onClick={handleLogout}
                className="p-2 bg-slate-950/50 border border-slate-800/90 text-slate-400 hover:text-red-400 hover:bg-red-950/30 hover:border-red-900/55 rounded-xl transition-all"
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </nav>

        </div>
      </header>

      {/* CORE FRAME ROUTER CONTENT */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0">
        
        {/* Background Sheets loader indicator */}
        {syncingActiveSheet && (
          <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 font-bold text-xs rounded-2xl flex items-center gap-3 backdrop-blur shadow-xl shadow-emerald-950/20 animate-pulse">
            <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
            <span className="font-sans">Mise à jour en cours de votre fichier Google Sheets de suivi sur Google Drive...</span>
          </div>
        )}

        {/* Render Tab 1: Dashboard Stats */}
        {currentTab === 'dashboard' && (
          <DashboardStats
            beneficiaires={beneficiaires}
            settings={settings}
            onSelectBeneficiaire={handleSelectBeneficiaire}
            onAddNewBeneficiaire={handleAddNewBeneficiaire}
          />
        )}

        {/* Render Form: Register or Edit specific Loan */}
        {currentTab === 'form' && (
          <LoanForm
            settings={settings}
            existingBeneficiaire={selectedBeneficiaire}
            onSave={handleSaveBeneficiaire}
            onCancel={() => { setCurrentTab('dashboard'); setSelectedBeneficiaire(null); }}
            currentUserFullName={currentUser.fullName}
          />
        )}

        {/* Render Tab 3: Detailed payments tracker and balances updates */}
        {currentTab === 'repayments' && selectedBeneficiaire && (
          <RepaymentTracker
            beneficiaire={selectedBeneficiaire}
            settings={settings}
            onUpdateBeneficiaire={handleUpdateBeneficiaireFromTracker}
            onBack={() => { setCurrentTab('dashboard'); setSelectedBeneficiaire(null); }}
            currentUserFullName={currentUser.fullName}
            currentUserRole={currentUser.role}
          />
        )}

        {/* Render Tab 4: Administrative printed contract engagement */}
        {currentTab === 'engagement' && selectedBeneficiaire && (
          <EngagementNote
            beneficiaire={selectedBeneficiaire}
            settings={settings}
            onBack={() => { setCurrentTab('dashboard'); setSelectedBeneficiaire(null); }}
          />
        )}

        {/* Render Tab 5: Admin settings and Accounts setup panel */}
        {currentTab === 'settings' && currentUser.role === 'admin' && (
          <SettingsPanel
            settings={settings}
            users={users}
            currentUser={currentUser}
            onSaveSettings={handleSaveSettings}
            onSaveUsers={handleSaveUsers}
            onBack={() => { setCurrentTab('dashboard'); setSelectedBeneficiaire(null); }}
          />
        )}

        {/* Render Tab 6: Google Sheets and CSV exporters */}
        {currentTab === 'google-sheets' && (
          <GoogleSheetsIntegration
            beneficiaires={beneficiaires}
            settings={settings}
            googleToken={googleToken}
            setGoogleToken={setGoogleToken}
            onRestoreData={(imported) => {
              setBeneficiaires(imported);
              saveBeneficiaires(imported);
            }}
            onBack={() => { setCurrentTab('dashboard'); setSelectedBeneficiaire(null); }}
          />
        )}

      </main>

      {/* PERSISTENT FOOTER (Hidden on print) */}
      <footer className="bg-slate-950/70 border-t border-slate-900/90 py-6 text-center text-xs text-slate-500 print:hidden font-mono mt-auto">
        <p>© 2026 ONGD DEBOUT GRANDS LACS — Programme Coopérative CVEM.</p>
        <p className="text-[10px] text-slate-600 mt-1">
          Kinshasa, République Démocratique du Congo | Raccordé avec Google Sheets.
        </p>
      </footer>

    </div>
  );
}

