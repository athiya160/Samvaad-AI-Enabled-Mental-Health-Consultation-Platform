import React, { useState, useEffect } from 'react';
import { 
  X, Lock, ShieldCheck, UserCheck, Key, Check, Info, FileText, 
  Stethoscope, Trash2, Eye, EyeOff, Copy, Download, AlertTriangle, ArrowRight, 
  ShieldAlert, LogOut, CheckCircle2, Edit3, Shield, RefreshCw 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import confetti from 'canvas-confetti';

export default function AccountAuthModal({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onLogout,
  onAccountDeleted,
  summaryToSave,
  conversationMessages = [],
  onBookDoctorWithSummary,
  initialView = null // 'auth_prompt' | 'vault' | 'login'
}) {
  const { language } = useLanguage();

  // Modal Views:
  // 'auth_prompt' | 'create_private' | 'show_recovery_codes' | 'login' | 'recover' | 
  // 'post_save_clinician_consent' | 'clinician_summary_saved' | 'vault'
  const [view, setView] = useState('auth_prompt');

  // Form states
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [loginNickname, setLoginNickname] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [recoveryNickname, setRecoveryNickname] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Recovery codes received after registration
  const [createdRecoveryCodes, setCreatedRecoveryCodes] = useState([]);
  const [codesCopied, setCodesCopied] = useState(false);

  // Clinician summary state
  const [isGeneratingClinician, setIsGeneratingClinician] = useState(false);
  const [savedClinicianSummary, setSavedClinicianSummary] = useState(null);
  const [viewingClinicianDossier, setViewingClinicianDossier] = useState(null);

  // Vault / Dashboard states
  const [savedReflections, setSavedReflections] = useState([]);
  const [savedClinicianSummaries, setSavedClinicianSummaries] = useState([]);
  const [consentHistory, setConsentHistory] = useState([]);
  const [vaultTab, setVaultTab] = useState('reflections'); // 'reflections' | 'clinician' | 'privacy' | 'security'

  // Sub-modal states for reflections and summaries
  const [viewingReflection, setViewingReflection] = useState(null);
  const [editingReflection, setEditingReflection] = useState(null); // { id, title, userNotes }
  const [editingClinicianSummary, setEditingClinicianSummary] = useState(null); // { id, content }

  // Security tab states
  const [securityStatus, setSecurityStatus] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [isConfirmingRegenCodes, setIsConfirmingRegenCodes] = useState(false);
  const [replacementCodes, setReplacementCodes] = useState(null);
  const [replacementCodesCopied, setReplacementCodesCopied] = useState(false);

  // Loading & error alerts
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Synchronize initial view when modal opens or initialView changes externally
  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage('');
    setSuccessNotice('');

    if (currentUser && (!initialView || initialView === 'vault')) {
      setView('vault');
      fetchUserData();
      fetchSecurityStatus();
    } else if (initialView) {
      setView(initialView);
      if (initialView === 'vault') {
        fetchUserData();
        fetchSecurityStatus();
      }
    } else {
      setView(currentUser ? 'vault' : 'auth_prompt');
    }
  }, [isOpen, initialView]);

  // Fetch Vault data for authenticated user
  const fetchUserData = async () => {
    try {
      const [refRes, clinRes, conRes] = await Promise.all([
        fetch('/api/user/reflections', { credentials: 'include' }),
        fetch('/api/user/clinician-summaries', { credentials: 'include' }),
        fetch('/api/user/consent-history', { credentials: 'include' })
      ]);

      if (refRes.ok) {
        const d = await refRes.json();
        if (d.ok) setSavedReflections(d.reflections || []);
      }
      if (clinRes.ok) {
        const d = await clinRes.json();
        if (d.ok) setSavedClinicianSummaries(d.summaries || []);
      }
      if (conRes.ok) {
        const d = await conRes.json();
        if (d.ok) setConsentHistory(d.consents || d.consentHistory || []);
      }
    } catch (err) {
      console.error('Failed to fetch user vault data:', err);
    }
  };

  const fetchSecurityStatus = async () => {
    try {
      const res = await fetch('/api/user/security/status', { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        if (d.ok) setSecurityStatus(d);
      }
    } catch (err) {
      console.error('Failed to fetch security status:', err);
    }
  };

  // Helper: Persist personal reflection once authenticated
  const savePersonalReflectionToAccount = async () => {
    if (!summaryToSave) return true;
    try {
      const reflectionPayload = summaryToSave.reflection || summaryToSave;
      const res = await fetch('/api/user/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reflection: reflectionPayload, language })
      });
      const data = await res.json();
      return data.ok;
    } catch (err) {
      console.error('Save reflection network error:', err);
      return false;
    }
  };

  // ACTION 1: Register Private Account
  const handleRegisterPrivate = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register-private', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nickname, password })
      });
      const data = await res.json();
      setLoading(false);

      if (!data.ok) {
        setErrorMessage(data.message || 'Failed to create private account.');
        return;
      }

      // Save recovery codes to show to user
      setCreatedRecoveryCodes(data.recoveryCodes || []);
      onAuthSuccess(data.user);

      // Save the pending personal reflection to user account
      await savePersonalReflectionToAccount();

      // Show recovery codes to user with mandatory acknowledgement
      setView('show_recovery_codes');
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      setLoading(false);
      setErrorMessage('Network error while creating private account.');
    }
  };

  // ACTION 2: Continue with Google
  const handleContinueWithGoogle = async () => {
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/google/status');
      const data = await res.json();
      setLoading(false);

      if (data?.status?.configured) {
        const urlRes = await fetch('/api/auth/google/url');
        const urlData = await urlRes.json();
        if (urlData.ok && urlData.url) {
          window.location.href = urlData.url;
          return;
        }
      }
      setView('google_config_required');
    } catch (err) {
      setLoading(false);
      setView('google_config_required');
    }
  };

  // ACTION 3: Login to Existing Private Account
  const handleLoginPrivate = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login-private', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nickname: loginNickname.trim(), password: loginPassword })
      });
      const data = await res.json();
      setLoading(false);

      if (!data.ok) {
        setErrorMessage(data.message || 'Invalid nickname or password.');
        return;
      }

      // Clear password field for security
      setLoginPassword('');

      // Notify parent app of successful authentication
      onAuthSuccess(data.user);

      // If user came here to save reflection, save it now and proceed to separate clinician consent gate
      if (summaryToSave) {
        await savePersonalReflectionToAccount();
        setView('post_save_clinician_consent');
      } else {
        setView('vault');
        setSuccessNotice(`Welcome back, ${data.user.displayName || data.user.nickname || 'User'}!`);
        fetchUserData();
        fetchSecurityStatus();
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage('Network error during login. Please check server connection.');
    }
  };

  // ACTION 4: Account Recovery with Single-Use Code
  const handleRecoverAccount = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nickname: recoveryNickname.trim(),
          recoveryCode: recoveryCode.trim(),
          newPassword: newPassword ? newPassword : undefined
        })
      });
      const data = await res.json();
      setLoading(false);

      if (!data.ok) {
        setErrorMessage(data.message || 'Recovery failed. Verify nickname and single-use code.');
        return;
      }

      setRecoveryCode('');
      setNewPassword('');
      onAuthSuccess(data.user);
      setSuccessNotice(`Access restored! This recovery code has been burned. You have ${data.remainingRecoveryCodes ?? 'unused'} recovery codes remaining.`);
      setView('vault');
      fetchUserData();
      fetchSecurityStatus();
    } catch (err) {
      setLoading(false);
      setErrorMessage('Network error during account recovery.');
    }
  };

  // ACTION 5: Explicit Consent to Prepare Clinician Summary
  const handlePrepareClinicianSummary = async () => {
    setErrorMessage('');
    setIsGeneratingClinician(true);

    try {
      const msgs = conversationMessages.length > 0 ? conversationMessages : [
        { sender: 'user', text: summaryToSave?.coreTheme || 'Patient requested confidential review.' }
      ];

      const res = await fetch('/api/user/clinician-summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: msgs,
          reflectionId: null,
          language
        })
      });
      const data = await res.json();
      setIsGeneratingClinician(false);

      if (!data.ok) {
        setErrorMessage(data.message || 'Failed to prepare clinician summary.');
        return;
      }

      setSavedClinicianSummary(data.clinicianSummary);
      setView('clinician_summary_saved');
      fetchUserData();
    } catch (err) {
      setIsGeneratingClinician(false);
      setErrorMessage('Network error while generating clinician summary.');
    }
  };

  // ACTION 6: User selects NOT NOW for clinician summary
  const handleDeclineClinicianSummary = () => {
    setView('vault');
    fetchUserData();
    fetchSecurityStatus();
  };

  // ACTION 7: Delete Individual Reflection
  const handleDeleteReflection = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this personal reflection?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/user/reflections/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setSavedReflections(prev => prev.filter(r => r.id !== id));
        setSuccessNotice('Personal reflection deleted.');
        setTimeout(() => setSuccessNotice(''), 3000);
      }
    } catch (e) {
      console.error('Delete reflection error:', e);
    }
  };

  // ACTION 7b: Save Edited Reflection
  const handleSaveEditedReflection = async (e) => {
    e.preventDefault();
    if (!editingReflection) return;

    try {
      const res = await fetch(`/api/user/reflections/${editingReflection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: editingReflection.title,
          userNotes: editingReflection.userNotes
        })
      });
      const data = await res.json();
      if (data.ok) {
        setSavedReflections(prev => prev.map(r => r.id === editingReflection.id ? {
          ...r,
          title: editingReflection.title,
          reflection: { ...r.reflection, userNotes: editingReflection.userNotes }
        } : r));
        setEditingReflection(null);
        setSuccessNotice('Reflection updated successfully.');
        setTimeout(() => setSuccessNotice(''), 3000);
      } else {
        alert(data.message || 'Failed to update reflection.');
      }
    } catch (err) {
      alert('Error updating reflection: ' + err.message);
    }
  };

  // ACTION 7c: Download Individual Reflection
  const handleDownloadReflection = (item) => {
    const content = JSON.stringify({
      id: item.id,
      title: item.title,
      createdAt: item.createdAt,
      reflection: item.reflection,
      userNotes: item.reflection?.userNotes || ''
    }, null, 2);

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `samvaad_reflection_${item.id.replace('ref_', '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ACTION 8: Delete Individual Clinician Summary
  const handleDeleteClinicianSummary = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this clinician summary?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/user/clinician-summaries/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setSavedClinicianSummaries(prev => prev.filter(s => s.id !== id));
        setSuccessNotice('Clinician summary deleted.');
        setTimeout(() => setSuccessNotice(''), 3000);
      }
    } catch (e) {
      console.error('Delete clinician summary error:', e);
    }
  };

  // ACTION 8b: Save Edited Clinician Summary
  const handleSaveEditedClinicianSummary = async (e) => {
    e.preventDefault();
    if (!editingClinicianSummary) return;

    try {
      const res = await fetch(`/api/user/clinician-summaries/${editingClinicianSummary.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          clinicianSummary: editingClinicianSummary.content
        })
      });
      const data = await res.json();
      if (data.ok) {
        setSavedClinicianSummaries(prev => prev.map(s => s.id === editingClinicianSummary.id ? {
          ...s,
          clinicianSummary: editingClinicianSummary.content
        } : s));
        setEditingClinicianSummary(null);
        setSuccessNotice('Clinician summary reviewed and updated.');
        setTimeout(() => setSuccessNotice(''), 3000);
      } else {
        alert(data.message || 'Failed to update summary.');
      }
    } catch (err) {
      alert('Error saving corrections: ' + err.message);
    }
  };

  // ACTION 9: Export All Data (DPDP / GDPR)
  const handleExportAllData = async () => {
    try {
      const res = await fetch('/api/user/export', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `samvaad_data_export_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert('Failed to export data: ' + err.message);
    }
  };

  // ACTION 10: Delete Account & All Data
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete your account?\n\nAll your saved personal reflections, clinician summaries, credentials, and consent logs will be irreversibly erased from Samvaad's servers."
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch('/api/user/account', {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        onAccountDeleted();
        onClose();
        alert('Your account and all associated data have been permanently deleted.');
      }
    } catch (e) {
      alert('Error deleting account: ' + e.message);
    }
  };

  // ACTION 11: Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPasswordInput !== confirmPasswordInput) {
      setErrorMessage('New passwords do not match.');
      return;
    }
    if (newPasswordInput.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    try {
      const res = await fetch('/api/user/security/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: currentPasswordInput,
          newPassword: newPasswordInput
        })
      });
      const data = await res.json();
      if (data.ok) {
        setIsChangingPassword(false);
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        setSuccessNotice('Password updated successfully.');
        setTimeout(() => setSuccessNotice(''), 4000);
      } else {
        setErrorMessage(data.message || 'Failed to change password.');
      }
    } catch (err) {
      setErrorMessage('Network error changing password.');
    }
  };

  // ACTION 12: Regenerate Replacement Recovery Codes
  const handleRegenerateCodes = async () => {
    try {
      const res = await fetch('/api/user/security/recovery-codes/regenerate', {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.ok) {
        setReplacementCodes(data.plaintextCodes || []);
        setIsConfirmingRegenCodes(false);
        fetchSecurityStatus();
        setSuccessNotice('New replacement recovery codes generated. Old codes are now invalidated.');
      } else {
        alert(data.message || 'Failed to regenerate codes.');
      }
    } catch (err) {
      alert('Error regenerating codes: ' + err.message);
    }
  };

  if (!isOpen) return null;

  const activeUser = currentUser || (securityStatus ? { displayName: securityStatus.displayName, accountType: securityStatus.accountType } : null);
  const isPrivate = activeUser?.accountType === 'pseudonymous' || securityStatus?.isPrivateAccount;
  const isGoogle = activeUser?.accountType === 'google' || securityStatus?.isGoogleAccount;
  const unusedCodesCount = securityStatus?.recoveryCodes?.unusedCount ?? 8;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-soft-xl border border-stone-200 relative my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Global Success Banner */}
        {successNotice && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p>{successNotice}</p>
          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 1: AUTH PROMPT (Gated Account Creation Choice)                  */}
        {/* ==================================================================== */}
        {view === 'auth_prompt' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-soft-sm">
                <Lock className="w-6 h-6 text-emerald-800" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {language === 'kn' ? 'ಸಾರಾಂಶ ಉಳಿಸಲು ಖಾತೆಯನ್ನು ರಚಿಸಿ' : 'Create an account to save your reflection'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'kn' ? 'ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಆತ್ಮಾವಲೋಕನವನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಶೇಖರಿಸಿ' : 'Choose how you would like to securely save your personal reflection'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl text-[11px] text-slate-600 leading-relaxed">
              <strong>{language === 'kn' ? 'ಗೌಪ್ಯತೆಯ ತತ್ವ:' : 'Privacy Assurance:'}</strong>{' '}
              {language === 'kn'
                ? 'ಸಂವಾದ ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ವಿವರಗಳ ಕನಿಷ್ಠ ಶೇಖರಣೆಗೆ ಬದ್ಧವಾಗಿದೆ. ಖಾಸಗಿ ಖಾತೆಗೆ ಇಮೇಲ್ ಅಥವಾ ಫೋನ್ ಸಂಖ್ಯೆ ಅಗತ್ಯವಿಲ್ಲ.'
                : 'Samvaad minimizes unnecessary identifying information. A Private Account does not require your real name, email, or phone number.'}
            </div>

            <div className="space-y-3 pt-1">
              {/* Option 1: Continue with Google */}
              <button
                type="button"
                onClick={handleContinueWithGoogle}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-soft-sm transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{language === 'kn' ? 'ಗೂಗಲ್ ಮೂಲಕ ಮುಂದುವರಿಯಿರಿ' : 'CONTINUE WITH GOOGLE'}</span>
              </button>

              {/* Option 2: Create a Private Account */}
              <button
                type="button"
                onClick={() => setView('create_private')}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sage-700 via-sage-600 to-emerald-600 hover:from-sage-800 hover:to-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-soft-md shadow-sage-900/15 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>{language === 'kn' ? 'ಖಾಸಗಿ ಖಾತೆ ರಚಿಸಿ (ಅಡ್ಡಹೆಸರು + ಪಾಸ್‌ವರ್ಡ್)' : 'CREATE A PRIVATE ACCOUNT'}</span>
              </button>
            </div>

            {/* Already have an account link */}
            <div className="pt-3 border-t border-stone-200 text-center">
              <button
                type="button"
                onClick={() => setView('login')}
                className="text-xs text-emerald-800 hover:text-emerald-950 font-bold hover:underline cursor-pointer"
              >
                {language === 'kn' ? 'ಈಗಾಗಲೇ ಖಾತೆ ಹೊಂದಿದ್ದೀರಾ? ಲಾಗಿನ್ ಮಾಡಿ' : 'Already have an account? Log in'}
              </button>
            </div>
          </div>
        )}

        {/* VIEW: GOOGLE CONFIG REQUIRED */}
        {view === 'google_config_required' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Google Sign-In Notice</h3>
                <p className="text-[11px] text-slate-500">Backend OAuth Client Configuration</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-2">
              <p className="font-semibold">Google OAuth requires environment credentials:</p>
              <p className="text-[11px] text-amber-900 leading-relaxed font-mono">
                GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
              </p>
              <p className="text-[11px] text-amber-900">
                You can create a <strong>Private Account</strong> instantly right now without needing an email or password manager.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setView('create_private')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sage-700 to-emerald-600 text-white font-bold text-xs cursor-pointer shadow-soft-sm"
              >
                Create a Private Account Instead
              </button>
              <button
                type="button"
                onClick={() => setView('auth_prompt')}
                className="w-full py-2.5 rounded-xl border border-stone-200 text-slate-600 hover:text-slate-900 font-bold text-xs cursor-pointer"
              >
                Back to Account Options
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 2: CREATE A PRIVATE ACCOUNT (Nickname + Password)               */}
        {/* ==================================================================== */}
        {view === 'create_private' && (
          <form onSubmit={handleRegisterPrivate} className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Create Private Account</h3>
                <p className="text-[11px] text-slate-500">Pseudonymous account • No email, phone, or real name required</p>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-[11px] text-slate-600 leading-relaxed">
              <strong>Notice:</strong> This is a pseudonymous account. We minimize unnecessary identifying details. Technical connection logs are retained in accordance with our security policy.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Choose a Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                minLength={2}
                maxLength={30}
                placeholder="e.g. Calm Cedar or quietmoon27"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-sage-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">2 to 30 characters. Letters, numbers, and hyphens.</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Choose a Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
                >
                  {showRegisterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showRegisterPassword ? 'Hide Password' : 'Show Password'}</span>
                </button>
              </div>
              <input
                type={showRegisterPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-sage-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Hashed server-side using scrypt. Plaintext passwords are never stored.</span>
            </div>

            <button
              type="submit"
              disabled={loading || nickname.trim().length < 2 || password.length < 8}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sage-700 to-emerald-600 hover:from-sage-800 hover:to-emerald-700 text-white font-black text-xs sm:text-sm shadow-soft-sm cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Account & Saving...' : 'Create Account & Save Reflection'}
            </button>

            <div className="pt-2 text-center text-xs">
              <button
                type="button"
                onClick={() => setView('auth_prompt')}
                className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
              >
                ← Back to Options
              </button>
            </div>
          </form>
        )}

        {/* ==================================================================== */}
        {/* VIEW 3: ONE-TIME DISPLAY OF RECOVERY CODES                          */}
        {/* ==================================================================== */}
        {view === 'show_recovery_codes' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Key className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {language === 'kn' ? 'ನಿಮ್ಮ ಏಕ-ಬಳಕೆಯ ಚೇತರಿಕೆ ಕೋಡ್‌ಗಳು' : 'Your Single-Use Recovery Codes'}
                </h3>
                <p className="text-[11px] text-slate-500">Account: <strong>{nickname}</strong> • 8 single-use codes</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-1.5 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Critical Account Security Notice:</span>
              </div>
              <p>
                Each recovery code can only be used once to regain access. 
                <strong> Plaintext codes are only displayed right now and cannot be retrieved later.</strong>
              </p>
              <p className="text-[11px] text-amber-900 font-medium pt-1">
                ⚠️ Losing both your password and all unused recovery codes will result in permanent loss of account access.
              </p>
            </div>

            {/* 8 Single-Use Codes Grid */}
            <div className="p-4 bg-stone-100 rounded-2xl border border-stone-200 font-mono text-xs sm:text-sm grid grid-cols-2 gap-2 text-center font-bold text-slate-800">
              {createdRecoveryCodes.map((code, idx) => (
                <div key={idx} className="p-2 bg-white rounded-xl border border-stone-200/80 shadow-2xs">
                  {code}
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(createdRecoveryCodes.join('\n'));
                  setCodesCopied(true);
                  setTimeout(() => setCodesCopied(false), 2500);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-soft-sm"
              >
                {codesCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{codesCopied ? 'Copied to Clipboard' : 'Copy All Codes'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const content = `SAMVAAD PRIVATE ACCOUNT RECOVERY CODES\nNickname: ${nickname}\nGenerated: ${new Date().toISOString()}\n\nSingle-use recovery codes:\n` + createdRecoveryCodes.join('\n');
                  const blob = new Blob([content], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `samvaad_recovery_codes_${nickname}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-soft-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Codes (.txt)</span>
              </button>
            </div>

            {/* Proceed to post-save step */}
            <button
              type="button"
              onClick={() => {
                setView('post_save_clinician_consent');
              }}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm shadow-soft-sm cursor-pointer mt-2"
            >
              I Have Saved My Recovery Codes Safely →
            </button>
          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 4: LOGIN TO EXISTING PRIVATE ACCOUNT                            */}
        {/* ==================================================================== */}
        {view === 'login' && (
          <form onSubmit={handleLoginPrivate} className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <Lock className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Log In to Private Account</h3>
                <p className="text-[11px] text-slate-500">Access your saved personal reflections and clinical history</p>
              </div>
            </div>

            {/* In-Form Prominent Error Alert */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 text-xs rounded-xl flex items-start gap-2.5 shadow-2xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Unable to Log In</p>
                  <p className="text-[11px] text-rose-800 mt-0.5">{errorMessage}</p>
                  {errorMessage.includes('Invalid') && (
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryNickname(loginNickname);
                        setErrorMessage('');
                        setView('recover');
                      }}
                      className="text-[11px] font-bold text-amber-900 underline mt-1.5 block cursor-pointer"
                    >
                      Forgot password? Click here to use a Recovery Code →
                    </button>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nickname</label>
              <input
                type="text"
                value={loginNickname}
                onChange={(e) => setLoginNickname(e.target.value)}
                required
                placeholder="e.g. quietmoon27"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-sage-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
                >
                  {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showLoginPassword ? 'Hide Password' : 'Show Password'}</span>
                </button>
              </div>
              <input
                type={showLoginPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                placeholder="Your account password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-sage-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm shadow-soft-sm cursor-pointer mt-1 flex items-center justify-center gap-2"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin text-white" />}
              <span>{loading ? 'Logging in...' : (language === 'kn' ? 'ಲಾಗಿನ್ ಮಾಡಿ' : 'Log In')}</span>
            </button>

            <div className="pt-2 flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => {
                  setRecoveryNickname(loginNickname);
                  setErrorMessage('');
                  setView('recover');
                }}
                className="text-amber-800 hover:text-amber-950 font-bold hover:underline cursor-pointer"
              >
                Forgot Password? Use Recovery Code
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setView('auth_prompt');
                }}
                className="text-emerald-800 font-bold hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {/* ==================================================================== */}
        {/* VIEW 5: RECOVERY USING SINGLE-USE CODE                               */}
        {/* ==================================================================== */}
        {view === 'recover' && (
          <form onSubmit={handleRecoverAccount} className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Key className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Account Recovery</h3>
                <p className="text-[11px] text-slate-500">Restore access using one of your single-use recovery codes</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nickname</label>
              <input
                type="text"
                value={recoveryNickname}
                onChange={(e) => setRecoveryNickname(e.target.value)}
                required
                placeholder="e.g. quietmoon27"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-sage-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Single-Use Recovery Code</label>
              <input
                type="text"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                required
                placeholder="e.g. 7A3F-9K2L"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 font-mono tracking-wider text-sm focus:border-sage-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Set New Password (At least 8 characters)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (optional)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-sage-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-black text-xs sm:text-sm shadow-soft-sm cursor-pointer mt-1"
            >
              {loading ? 'Verifying Code...' : 'Recover Account Access'}
            </button>

            <div className="pt-2 text-center text-xs">
              <button
                type="button"
                onClick={() => setView('login')}
                className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}

        {/* ==================================================================== */}
        {/* VIEW 6: POST-SAVE SEPARATE CLINICIAN SUMMARY CONSENT GATE            */}
        {/* ==================================================================== */}
        {view === 'post_save_clinician_consent' && (
          <div className="space-y-5 animate-fade-in py-2">
            
            {/* Step 1 Confirmation */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-emerald-950">
                  {language === 'kn' ? 'ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಆತ್ಮಾವಲೋಕನ ಸಾರಾಂಶ ಉಳಿಸಲಾಗಿದೆ.' : 'Your personal reflection has been saved.'}
                </h4>
                <p className="text-xs text-emerald-900 mt-0.5 leading-relaxed">
                  {language === 'kn'
                    ? 'ಇದು ನಿಮ್ಮ ಖಾಸಗಿ ವಾಲ್ಟ್‌ನಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿದೆ. ನೀವು ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಇದನ್ನು ಪರಿಶೀಲಿಸಬಹುದು.'
                    : 'This record is stored privately in your account. You can review or delete it at any time.'}
                </p>
              </div>
            </div>

            {/* Step 2 Separate Consent Request */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-stone-50 via-sage-50/40 to-stone-100/70 border border-stone-200/90 shadow-soft-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Stethoscope className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>
                  {language === 'kn'
                    ? 'ವೈದ್ಯರ ಸಮಾಲೋಚನೆಗಾಗಿ ಪ್ರತ್ಯೇಕ ಸಾರಾಂಶವನ್ನು ಸಿದ್ಧಪಡಿಸಬೇಕೇ?'
                    : 'Would you also like Samvaad to prepare and save an AI-generated initial history summary that you may choose to share with a qualified mental health professional later?'}
                </span>
              </div>

              {/* Exact required explanation */}
              <div className="p-3.5 bg-white rounded-xl border border-stone-200 text-xs text-slate-600 leading-relaxed space-y-1.5">
                <p>
                  {language === 'kn'
                    ? 'ಇದು ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಆತ್ಮಾವಲೋಕನಕ್ಕಿಂತ ಪ್ರತ್ಯೇಕವಾಗಿದೆ. ಇದು ರೋಗನಿರ್ಣಯವಲ್ಲ, ಮತ್ತು ನೀವು ನಂತರ ಪರಿಶೀಲಿಸಿ ಸ್ಪಷ್ಟವಾಗಿ ಹಂಚಿಕೊಳ್ಳಲು ಆಯ್ಕೆ ಮಾಡದ ಹೊರತು ಇದನ್ನು ಯಾವುದೇ ವೈದ್ಯರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಲಾಗುವುದಿಲ್ಲ.'
                    : 'This is separate from your personal reflection. It is not a diagnosis, and it will not be shared with a clinician unless you later review it and explicitly choose to share it.'}
                </p>
                <ul className="text-[11px] text-slate-500 space-y-0.5 list-disc pl-4 pt-1">
                  <li>It is AI-generated for pre-consultation context</li>
                  <li>It is NOT automatically shared or visible to doctors</li>
                  <li>You maintain full control over whether it is ever shared</li>
                </ul>
              </div>

              {/* Decision Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handlePrepareClinicianSummary}
                  disabled={isGeneratingClinician}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-sage-700 via-sage-600 to-emerald-600 hover:from-sage-800 hover:to-emerald-700 text-white font-black text-xs sm:text-sm shadow-soft-md shadow-sage-900/15 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Stethoscope className="w-4 h-4 text-emerald-200" />
                  <span>
                    {isGeneratingClinician 
                      ? 'Preparing Clinical History...' 
                      : (language === 'kn' ? 'ವೈದ್ಯರ ಸಾರಾಂಶ ಸಿದ್ಧಪಡಿಸಿ' : 'PREPARE CLINICIAN SUMMARY')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleDeclineClinicianSummary}
                  disabled={isGeneratingClinician}
                  className="w-full sm:w-auto py-3 px-5 rounded-xl border border-stone-300 hover:bg-stone-100 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer"
                >
                  {language === 'kn' ? 'ಈಗ ಬೇಡ' : 'NOT NOW'}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 7: CLINICIAN SUMMARY SAVED & REVIEWED                           */}
        {/* ==================================================================== */}
        {view === 'clinician_summary_saved' && savedClinicianSummary && (
          <div className="space-y-4 animate-fade-in py-2">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-emerald-950">
                  Initial History Summary Prepared & Saved Privately
                </h4>
                <p className="text-xs text-emerald-900 mt-0.5">
                  This summary is saved to your account. <strong>It has NOT been shared with any doctor.</strong>
                </p>
              </div>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Status: Private (Not Shared)</span>
                <span className="text-[10px] font-mono text-slate-400">Dossier ID: {savedClinicianSummary.dossierId}</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                You can review, edit, or delete this summary at any time from your account dashboard before ever choosing to share it during a consultation.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setViewingClinicianDossier(savedClinicianSummary)}
                className="flex-1 py-3 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-soft-sm"
              >
                <Eye className="w-4 h-4 text-emerald-700" />
                <span>Review 14 Headings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setView('vault');
                  fetchUserData();
                  fetchSecurityStatus();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-soft-sm"
              >
                Open My Account
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 8: STEP 6 — MY ACCOUNT DASHBOARD                                */}
        {/* Hierarchy:                                                           */}
        {/* My Account                                                           */}
        {/* ├── Personal Reflections (View, Edit/correct, Download, Delete)     */}
        {/* ├── Clinician Summaries (View, Review/correct, Delete)               */}
        {/* ├── Privacy & Data (Data information, Export, Delete account)        */}
        {/* └── Security (Password, Recovery codes)                              */}
        {/* ==================================================================== */}
        {view === 'vault' && (
          <div className="space-y-4 animate-fade-in">
            
            {/* Header: My Account */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-lg font-black text-slate-900">My Account</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-slate-700">
                    {activeUser?.displayName || nickname || 'User'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isGoogle 
                      ? 'bg-blue-50 text-blue-800 border-blue-200' 
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {isGoogle ? 'Google Account' : 'Private Account'}
                  </span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
                title="Log out of this device"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>

            {/* 4 Dashboard Tabs */}
            <div className="grid grid-cols-4 gap-1 bg-stone-100 p-1 rounded-xl text-xs font-bold border border-stone-200 text-center">
              <button
                type="button"
                onClick={() => setVaultTab('reflections')}
                className={`py-2 px-1 rounded-lg transition-all cursor-pointer truncate ${
                  vaultTab === 'reflections' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Reflections ({savedReflections.length})
              </button>
              <button
                type="button"
                onClick={() => setVaultTab('clinician')}
                className={`py-2 px-1 rounded-lg transition-all cursor-pointer truncate ${
                  vaultTab === 'clinician' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Summaries ({savedClinicianSummaries.length})
              </button>
              <button
                type="button"
                onClick={() => setVaultTab('privacy')}
                className={`py-2 px-1 rounded-lg transition-all cursor-pointer truncate ${
                  vaultTab === 'privacy' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Privacy & Data
              </button>
              <button
                type="button"
                onClick={() => {
                  setVaultTab('security');
                  fetchSecurityStatus();
                }}
                className={`py-2 px-1 rounded-lg transition-all cursor-pointer truncate ${
                  vaultTab === 'security' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Security
              </button>
            </div>

            {/* ================================================================ */}
            {/* TAB 1: PERSONAL REFLECTIONS                                      */}
            {/* View | Edit/correct | Download/export | Delete                   */}
            {/* ================================================================ */}
            {vaultTab === 'reflections' && (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {savedReflections.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                    <p className="font-semibold">No personal reflections saved yet.</p>
                    <p className="text-[11px] text-slate-400">After talking with the AI, generate a reflection and choose "Save Summary".</p>
                  </div>
                ) : (
                  savedReflections.map((item) => (
                    <div key={item.id} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span>{item.title || 'Personal Reflection Summary'}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-slate-600 text-[11px] line-clamp-2">
                        {(item.reflection?.exploredTopics || []).join(', ') || item.reflection?.coreTheme || 'Reflection details saved'}
                      </p>

                      {item.reflection?.userNotes && (
                        <div className="p-2 bg-white rounded-lg border border-stone-200 text-[11px] text-slate-700">
                          <span className="font-bold text-slate-500">Your Notes:</span> {item.reflection.userNotes}
                        </div>
                      )}

                      {/* Actions: View | Edit/correct | Download/export | Delete */}
                      <div className="pt-2 border-t border-stone-200/70 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingReflection(item)}
                            className="text-emerald-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>
                          <span className="text-stone-300">•</span>
                          <button
                            type="button"
                            onClick={() => setEditingReflection({
                              id: item.id,
                              title: item.title,
                              userNotes: item.reflection?.userNotes || ''
                            })}
                            className="text-slate-700 font-bold hover:text-slate-950 flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit/correct</span>
                          </button>
                          <span className="text-stone-300">•</span>
                          <button
                            type="button"
                            onClick={() => handleDownloadReflection(item)}
                            className="text-slate-700 font-bold hover:text-slate-950 flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteReflection(item.id)}
                          className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ================================================================ */}
            {/* TAB 2: CLINICIAN SUMMARIES                                       */}
            {/* View | Review/correct | Delete                                   */}
            {/* ================================================================ */}
            {vaultTab === 'clinician' && (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {savedClinicianSummaries.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                    <p className="font-semibold">No clinician summaries saved yet.</p>
                    <p className="text-[11px] text-slate-400">
                      Clinician summaries are only generated when you explicitly select "PREPARE CLINICIAN SUMMARY".
                    </p>
                  </div>
                ) : (
                  savedClinicianSummaries.map((item) => (
                    <div key={item.id} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                          <span>{item.clinicianSummary?.headerTitle || 'AI-Generated Initial History Summary'}</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 uppercase">
                          {item.sharingStatus === 'shared_with_doctor' ? 'Shared with Doctor' : 'Private • Not Shared'}
                        </span>
                      </div>

                      <p className="text-slate-600 text-[11px] line-clamp-2">
                        {item.clinicianSummary?.section1_PresentingComplaints || item.clinicianSummary?.chiefComplaint || 'Clinical history summary'}
                      </p>

                      {/* Actions: View | Review/correct | Delete */}
                      <div className="pt-2 border-t border-stone-200/70 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingClinicianDossier(item.clinicianSummary)}
                            className="text-emerald-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View 14 Headings</span>
                          </button>
                          <span className="text-stone-300">•</span>
                          <button
                            type="button"
                            onClick={() => setEditingClinicianSummary({
                              id: item.id,
                              content: { ...item.clinicianSummary }
                            })}
                            className="text-slate-700 font-bold hover:text-slate-950 flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Review/correct</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteClinicianSummary(item.id)}
                          className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ================================================================ */}
            {/* TAB 3: PRIVACY & DATA                                            */}
            {/* Data information | Export | Delete account                       */}
            {/* ================================================================ */}
            {vaultTab === 'privacy' && (
              <div className="space-y-4 text-xs">
                
                {/* 1. Data Information */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <span className="font-bold text-slate-900 block text-xs">
                    Data Information & Transparency
                  </span>
                  <div className="text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
                    <p>
                      <strong>What is stored:</strong> For Private Accounts, your chosen nickname, an OWASP-scrypt password hash, and single-use recovery code hashes. Saved personal reflections and clinician summaries are linked only to an internal UUID.
                    </p>
                    <p>
                      <strong>What is NOT stored:</strong> No real names, emails, or phone numbers are required. No plaintext passwords or recovery codes are ever stored.
                    </p>
                    <p>
                      <strong>Sharing Policy:</strong> Clinician summaries are never placed in public directories or shared automatically. Voluntary consultation sharing requires an explicit user action during booking.
                    </p>
                  </div>
                </div>

                {/* 2. Export User Data */}
                <div className="p-4 bg-white rounded-2xl border border-stone-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">Export Account Data</span>
                      <p className="text-[11px] text-slate-500">Download a complete, machine-readable JSON archive of all your saved reflections, summaries, and consent logs.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportAllData}
                    className="py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 font-bold text-xs text-slate-800 flex items-center gap-1.5 cursor-pointer shadow-soft-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Full Data Archive (JSON)</span>
                  </button>
                </div>

                {/* 3. Consent Records Audit Log */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <span className="font-bold text-slate-800 block text-xs">Consent Audit History</span>
                  <div className="space-y-1 max-h-28 overflow-y-auto text-[11px]">
                    {consentHistory.length === 0 ? (
                      <p className="text-slate-400">No consent events logged yet.</p>
                    ) : (
                      consentHistory.map((c, i) => (
                        <div key={i} className="flex justify-between text-slate-600 border-b border-stone-200/50 pb-1">
                          <span className="font-medium">{c.consentType || c.consent_type}</span>
                          <span className="font-mono text-[10px] text-emerald-800">
                            Granted ({new Date(c.recordedAt || c.timestamp || Date.now()).toLocaleDateString()})
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 4. Delete Account */}
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                  <span className="font-bold text-rose-950 block text-xs">Delete Account & Stored Data</span>
                  <p className="text-[11px] text-rose-900 leading-relaxed">
                    Permanently delete your user account, saved personal reflections, clinician summaries, credentials, and consent logs. This action is irreversible.
                  </p>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-soft-sm"
                  >
                    Permanently Delete Account
                  </button>
                </div>

              </div>
            )}

            {/* ================================================================ */}
            {/* TAB 4: SECURITY                                                  */}
            {/* Password | Recovery codes                                        */}
            {/* For Google accounts: hide controls & explain OIDC                */}
            {/* For Private accounts: Nickname, Password, Recovery codes count,  */}
            {/* Replacement generation with prominent invalidation warning       */}
            {/* ================================================================ */}
            {vaultTab === 'security' && (
              <div className="space-y-4 text-xs">
                
                {/* Condition 1: Google Accounts */}
                {isGoogle ? (
                  <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white border border-blue-200 flex items-center justify-center">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Google Sign-In Account</h4>
                        <p className="text-[11px] text-blue-800">Authenticated via Google Identity Provider</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-700 leading-relaxed bg-white/80 p-3 rounded-xl border border-blue-100">
                      Your account security is managed directly through your Google account. Password and recovery codes are not applicable to Google-authenticated accounts on Samvaad.
                    </p>
                  </div>
                ) : (
                  /* Condition 2: Private Accounts */
                  <div className="space-y-4">
                    
                    {/* Nickname */}
                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nickname</span>
                        <span className="font-bold text-sm text-slate-900">{activeUser?.displayName || nickname || 'quietmoon27'}</span>
                      </div>
                      <span className="text-[11px] text-emerald-800 font-bold bg-emerald-100 px-2.5 py-1 rounded-full">
                        Private Account
                      </span>
                    </div>

                    {/* Password */}
                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</span>
                          <span className="font-mono text-slate-800 tracking-widest text-sm">•••••••••••</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsChangingPassword(!isChangingPassword)}
                          className="py-1.5 px-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 font-bold text-xs text-slate-700 cursor-pointer shadow-soft-sm"
                        >
                          {isChangingPassword ? 'Cancel' : 'Change Password'}
                        </button>
                      </div>

                      {/* Change Password Form */}
                      {isChangingPassword && (
                        <form onSubmit={handleChangePassword} className="space-y-2.5 pt-2 border-t border-stone-200">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Current Password</label>
                            <input
                              type="password"
                              value={currentPasswordInput}
                              onChange={(e) => setCurrentPasswordInput(e.target.value)}
                              required
                              className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs"
                              placeholder="Enter your current password"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">New Password (Min 8 chars)</label>
                            <input
                              type="password"
                              value={newPasswordInput}
                              onChange={(e) => setNewPasswordInput(e.target.value)}
                              required
                              minLength={8}
                              className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs"
                              placeholder="Enter new strong password"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Confirm New Password</label>
                            <input
                              type="password"
                              value={confirmPasswordInput}
                              onChange={(e) => setConfirmPasswordInput(e.target.value)}
                              required
                              minLength={8}
                              className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs"
                              placeholder="Re-enter new password"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-soft-sm mt-1"
                          >
                            Update Password
                          </button>
                        </form>
                      )}
                    </div>

                    {/* Recovery codes */}
                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recovery codes</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-extrabold text-sm text-slate-900">{unusedCodesCount} unused</span>
                          <span className="text-[11px] text-slate-500">• Single-use backup codes</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Single-use recovery codes restore access if you forget your password. Each code burns immediately upon use.
                      </p>

                      {/* Generate replacement recovery codes button & flow */}
                      {!isConfirmingRegenCodes && !replacementCodes && (
                        <button
                          type="button"
                          onClick={() => setIsConfirmingRegenCodes(true)}
                          className="py-2.5 px-4 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 font-bold text-xs text-amber-950 flex items-center gap-1.5 cursor-pointer shadow-soft-sm"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                          <span>Generate replacement recovery codes</span>
                        </button>
                      )}

                      {/* Prominent Invalidation Warning & Confirmation */}
                      {isConfirmingRegenCodes && (
                        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2.5">
                          <div className="flex items-start gap-2 text-amber-950 font-bold text-xs">
                            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <span>Warning: This will invalidate all your existing recovery codes</span>
                          </div>
                          <p className="text-[11px] text-amber-900 leading-relaxed">
                            Generating replacement recovery codes immediately invalidates your current set of recovery codes. Any previously copied or printed codes will no longer work.
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleRegenerateCodes}
                              className="py-2 px-3 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs cursor-pointer shadow-soft-sm"
                            >
                              Confirm & Replace Codes
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsConfirmingRegenCodes(false)}
                              className="py-2 px-3 rounded-lg border border-stone-200 text-slate-600 font-bold text-xs hover:bg-stone-100 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Display newly generated replacement codes */}
                      {replacementCodes && (
                        <div className="space-y-3 pt-2 border-t border-stone-200">
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-950">
                            <strong>8 New Recovery Codes Generated!</strong> Previous codes are now invalid. Save these new codes immediately:
                          </div>

                          <div className="p-3 bg-white rounded-xl border border-stone-200 font-mono text-xs grid grid-cols-2 gap-2 text-center font-bold text-slate-800">
                            {replacementCodes.map((code, idx) => (
                              <div key={idx} className="p-1.5 bg-stone-50 rounded-lg border border-stone-200">
                                {code}
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(replacementCodes.join('\n'));
                                setReplacementCodesCopied(true);
                                setTimeout(() => setReplacementCodesCopied(false), 2000);
                              }}
                              className="flex-1 py-2 rounded-lg border border-stone-200 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer bg-white"
                            >
                              {replacementCodesCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{replacementCodesCopied ? 'Copied' : 'Copy All'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const content = `SAMVAAD REPLACEMENT RECOVERY CODES\nGenerated: ${new Date().toISOString()}\n\n` + replacementCodes.join('\n');
                                const blob = new Blob([content], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `samvaad_replacement_codes.txt`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="flex-1 py-2 rounded-lg border border-stone-200 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer bg-white"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download (.txt)</span>
                            </button>
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* ==================================================================== */}
        {/* SUB-MODAL 1: VIEW PERSONAL REFLECTION                                */}
        {/* ==================================================================== */}
        {viewingReflection && (
          <div className="fixed inset-0 z-60 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-soft-xl border border-stone-200 relative my-auto max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setViewingReflection(null)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-2xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4 pb-3 border-b border-stone-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                  Personal Reflection
                </span>
                <h3 className="text-base font-black text-slate-900 leading-snug">
                  {viewingReflection.title}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  Saved on {new Date(viewingReflection.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-800">
                {viewingReflection.reflection?.coreTheme && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="font-bold text-[11px] text-slate-600 block mb-0.5">Core Theme</span>
                    <p className="font-semibold text-slate-900">{viewingReflection.reflection.coreTheme}</p>
                  </div>
                )}

                {viewingReflection.reflection?.whatYouShared && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                    <span className="font-bold text-[11px] text-slate-600 block">What You Shared (Verbatim Quotes)</span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700">
                      {viewingReflection.reflection.whatYouShared.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {viewingReflection.reflection?.exploredTopics && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                    <span className="font-bold text-[11px] text-slate-600 block">Explored Topics</span>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {viewingReflection.reflection.exploredTopics.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-[11px] font-medium border border-emerald-200">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {viewingReflection.reflection?.unexploredTopics && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                    <span className="font-bold text-[11px] text-slate-600 block">Unexplored Clinical Domains</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-500 text-[11px]">
                      {viewingReflection.reflection.unexploredTopics.map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {viewingReflection.reflection?.personalStrengths && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                    <span className="font-bold text-[11px] text-slate-600 block">Observed Personal Strengths</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-700 text-[11px]">
                      {viewingReflection.reflection.personalStrengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {viewingReflection.reflection?.userNotes && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950">
                    <span className="font-bold text-[11px] text-amber-900 block mb-0.5">Your Personal Notes</span>
                    <p>{viewingReflection.reflection.userNotes}</p>
                  </div>
                )}

                <div className="p-3 bg-stone-100 rounded-xl text-[10px] text-slate-500 font-mono">
                  {viewingReflection.reflection?.disclaimer || "Note: This summary is created solely for personal self-reflection. It is non-diagnostic and does not replace medical advice from a qualified doctor."}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingReflection(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* SUB-MODAL 2: EDIT/CORRECT PERSONAL REFLECTION                        */}
        {/* ==================================================================== */}
        {editingReflection && (
          <div className="fixed inset-0 z-60 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <form onSubmit={handleSaveEditedReflection} className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-soft-xl border border-stone-200 relative my-auto max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setEditingReflection(null)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-2xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-black text-slate-900 mb-1">Edit / Correct Reflection</h3>
              <p className="text-[11px] text-slate-500 mb-4">You can update the title or record your own personal clarifications</p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editingReflection.title}
                    onChange={(e) => setEditingReflection(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Personal Notes & Clarifications</label>
                  <textarea
                    rows={4}
                    value={editingReflection.userNotes}
                    onChange={(e) => setEditingReflection(prev => ({ ...prev, userNotes: e.target.value }))}
                    placeholder="Add your own notes, corrections, or context to this reflection..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs leading-relaxed"
                  />
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingReflection(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 font-bold text-xs text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer shadow-soft-sm"
                >
                  Save Corrections
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================================================================== */}
        {/* SUB-MODAL 3: REVIEW / EDIT CLINICIAN SUMMARY                         */}
        {/* ==================================================================== */}
        {editingClinicianSummary && (
          <div className="fixed inset-0 z-60 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <form onSubmit={handleSaveEditedClinicianSummary} className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-soft-xl border border-stone-200 relative my-auto max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setEditingClinicianSummary(null)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-2xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-black text-slate-900 mb-1">Review & Correct Clinician Summary</h3>
              <p className="text-[11px] text-slate-500 mb-4">
                You control this summary. Review and adjust any section before ever choosing to share it with a doctor.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">1. Presenting Complaints</label>
                  <textarea
                    rows={2}
                    value={editingClinicianSummary.content?.section1_PresentingComplaints || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingClinicianSummary(prev => ({
                        ...prev,
                        content: { ...prev.content, section1_PresentingComplaints: val }
                      }));
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">2. History of the Present Problem</label>
                  <textarea
                    rows={2}
                    value={editingClinicianSummary.content?.section2_HistoryOfPresentProblem || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingClinicianSummary(prev => ({
                        ...prev,
                        content: { ...prev.content, section2_HistoryOfPresentProblem: val }
                      }));
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">3. Onset, Duration, and Course</label>
                  <input
                    type="text"
                    value={editingClinicianSummary.content?.section3_OnsetDurationCourse || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingClinicianSummary(prev => ({
                        ...prev,
                        content: { ...prev.content, section3_OnsetDurationCourse: val }
                      }));
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">13. User's Concerns and Goals</label>
                  <textarea
                    rows={2}
                    value={editingClinicianSummary.content?.section13_UserConcernsAndGoals || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingClinicianSummary(prev => ({
                        ...prev,
                        content: { ...prev.content, section13_UserConcernsAndGoals: val }
                      }));
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs"
                  />
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingClinicianSummary(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 font-bold text-xs text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer shadow-soft-sm"
                >
                  Save Corrections
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================================================================== */}
        {/* SUB-MODAL 4: 14-SECTION CLINICIAN DOSSIER PREVIEW                    */}
        {/* ==================================================================== */}
        {viewingClinicianDossier && (
          <div className="fixed inset-0 z-60 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-soft-xl border border-stone-200 relative my-auto max-h-[90vh] overflow-y-auto">
              
              <button
                onClick={() => setViewingClinicianDossier(null)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-2xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4 pb-3 border-b border-stone-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                  14-Section Pre-Consultation Summary
                </span>
                <h3 className="text-base font-black text-slate-900 leading-snug">
                  {viewingClinicianDossier.headerTitle || "AI-Generated Initial History Summary — For Review by a Qualified Mental Health Professional."}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono mt-1">
                  Dossier ID: {viewingClinicianDossier.dossierId} • Timestamp: {viewingClinicianDossier.timestamp}
                </p>
              </div>

              {/* 14 Distinct Headings */}
              <div className="space-y-3 text-xs text-slate-800">
                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="font-bold text-[11px] text-slate-700 block mb-0.5">1. Presenting complaints</span>
                  <p className="text-slate-900">{viewingClinicianDossier.section1_PresentingComplaints || viewingClinicianDossier.chiefComplaint}</p>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="font-bold text-[11px] text-slate-700 block mb-0.5">2. History of the present problem</span>
                  <p className="text-slate-900">{viewingClinicianDossier.section2_HistoryOfPresentProblem || viewingClinicianDossier.durationAndOnset}</p>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="font-bold text-[11px] text-slate-700 block mb-0.5">3. Onset, duration, and course</span>
                  <p className="text-slate-900">{viewingClinicianDossier.section3_OnsetDurationCourse || 'Not discussed / Unclear'}</p>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="font-bold text-[11px] text-slate-700 block mb-0.5">4. Relevant emotional experiences</span>
                  <p className="text-slate-900">{viewingClinicianDossier.section4_RelevantEmotionalExperiences || 'Not discussed / Unclear'}</p>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="font-bold text-[11px] text-slate-700 block mb-0.5">5. Relevant thoughts and cognitive experiences</span>
                  <p className="text-slate-900">{viewingClinicianDossier.section5_RelevantThoughtsCognitive || 'Not discussed / Unclear'}</p>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="font-bold text-[11px] text-slate-700 block mb-0.5">6. Behavioural patterns</span>
                  <p className="text-slate-900">{viewingClinicianDossier.section6_BehaviouralPatterns || 'Not discussed / Unclear'}</p>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="font-bold text-[11px] text-slate-700 block mb-0.5">7. Functional impact</span>
                  <p className="text-slate-900">{viewingClinicianDossier.section7_FunctionalImpact || 'Not discussed / Unclear'}</p>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="font-bold text-[11px] text-slate-700 block mb-0.5">8. Sleep, appetite, energy, and concentration, if discussed</span>
                  <p className="text-slate-900">{viewingClinicianDossier.section8_SleepAppetiteEnergyConcentration || 'Not discussed / Unclear'}</p>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="font-bold text-[11px] text-slate-700 block mb-0.5">9. Relevant psychosocial circumstances</span>
                  <p className="text-slate-900">{viewingClinicianDossier.section9_RelevantPsychosocialCircumstances || 'Not discussed / Unclear'}</p>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="font-bold text-[11px] text-slate-700 block mb-0.5">10. Previous experiences and professional support</span>
                  <p className="text-slate-900">{viewingClinicianDossier.section10_PreviousExperiencesSupport || 'Not discussed in conversation'}</p>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="font-bold text-[11px] text-slate-700 block mb-0.5">11. Strengths and support systems</span>
                  <p className="text-slate-900">{viewingClinicianDossier.section11_StrengthsSupportSystems || 'Not discussed / Unclear'}</p>
                </div>

                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="font-bold text-[11px] text-emerald-950 block mb-0.5">12. Safety-related disclosures, if any</span>
                  <p className="text-emerald-900">{viewingClinicianDossier.section12_SafetyRelatedDisclosures || 'No crisis disclosures noted in conversation.'}</p>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="font-bold text-[11px] text-slate-700 block mb-0.5">13. User\'s concerns and goals</span>
                  <p className="text-slate-900">{viewingClinicianDossier.section13_UserConcernsAndGoals || 'Not discussed'}</p>
                </div>

                <div className="p-2.5 bg-stone-100 rounded-xl border border-stone-200">
                  <span className="font-bold text-[11px] text-slate-700 block mb-0.5">14. Important information gaps requiring further assessment</span>
                  <p className="text-slate-800">{viewingClinicianDossier.section14_InformationGaps || 'Comprehensive psychiatric assessment required.'}</p>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-950 font-mono whitespace-pre-line leading-relaxed">
                  <strong>DISCLAIMER:</strong>
                  {'\n'}{viewingClinicianDossier.disclaimer || "CONFIDENTIAL CLINICAL SUMMARY — AI GENERATED\nThis summary was compiled from patient self-report during an exploratory AI conversation. It is non-diagnostic and does not replace medical advice or psychiatric evaluation."}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingClinicianDossier(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
                >
                  Close Preview
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
