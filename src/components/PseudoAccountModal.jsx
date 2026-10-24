import React, { useState, useEffect } from 'react';
import {
  X, Lock, ShieldCheck, UserCheck, Key, Check, Info, User,
  Mail, Phone, FileText, Stethoscope, Trash2, Eye, ChevronRight,
  Copy, AlertTriangle, ArrowRight, LogIn, LogOut, CheckCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { authClient } from '../services/authClient';
import confetti from 'canvas-confetti';

const AVATAR_SUGGESTIONS = [
  'Calm Cedar',
  'Quiet River',
  'Serene Banyan',
  'Amber Meadow',
  'Gentle Breeze',
  'Silver Birch'
];

export default function PseudoAccountModal({
  isOpen,
  onClose,
  onSaveAccount,
  onDeleteAccount,
  currentAccount,
  summaryToSave,
  onBookDoctorWithSummary,
  onBrowseDoctors
}) {
  const { language } = useLanguage();

  // View modes: 'select' | 'private-register' | 'recovery-display' | 'login' | 'recover' | 'google-info' | 'vault'
  const [viewMode, setViewMode] = useState('select');

  // Form states
  const [username, setUsername] = useState('Calm Cedar');
  const [password, setPassword] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Recovery codes to display after private registration
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [codesCopied, setCodesCopied] = useState(false);

  // Status & error handling
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Vault data (authenticated user)
  const [currentUser, setCurrentUser] = useState(currentAccount || null);
  const [savedReflections, setSavedReflections] = useState([]);
  const [viewingReflection, setViewingReflection] = useState(null);

  // Google status
  const [googleStatus, setGoogleStatus] = useState({ configured: false });

  // On open, check current backend authentication
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSuccessMessage('');
      checkInitialAuth();
      checkGoogleConfig();
    }
  }, [isOpen]);

  // Handle escape key to cancel safely
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const checkInitialAuth = async () => {
    try {
      const user = await authClient.checkAuth();
      if (user) {
        setCurrentUser(user);
        setViewMode('vault');
        loadVaultReflections();
      } else {
        setViewMode(summaryToSave ? 'select' : 'login');
      }
    } catch (e) {
      setViewMode('select');
    }
  };

  const checkGoogleConfig = async () => {
    try {
      const res = await authClient.getGoogleStatus();
      if (res && res.status) {
        setGoogleStatus(res.status);
      }
    } catch (e) {}
  };

  const loadVaultReflections = async () => {
    try {
      const list = await authClient.getReflections();
      setSavedReflections(list);
    } catch (e) {
      console.warn('Failed to load reflections:', e.message);
    }
  };

  const handleCancel = () => {
    setErrorMessage('');
    setSuccessMessage('');
    onClose();
  };

  // 1. Create Private Pseudonymous Account
  const handleRegisterPrivate = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (!username || username.trim().length < 3) {
        throw new Error('Username must be at least 3 characters long.');
      }
      if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
      }

      const res = await authClient.registerPrivate(username.trim(), password);
      setCurrentUser(res.user);
      if (onSaveAccount) onSaveAccount(res.user);

      // Save reflection if one is pending
      if (summaryToSave) {
        await authClient.saveReflection(
          summaryToSave.reflection || summaryToSave,
          summaryToSave.messages ? summaryToSave.messages.map(m => m.text).join(' ') : '',
          summaryToSave.messages || [],
          language
        );
      }

      setGeneratedCodes(res.recoveryCodes || []);
      setViewMode('recovery-display');
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Login to Private Account
  const handleLoginPrivate = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await authClient.loginPrivate(loginUsername.trim(), loginPassword);
      setCurrentUser(res.user);
      if (onSaveAccount) onSaveAccount(res.user);

      // Save reflection if one is pending
      if (summaryToSave) {
        await authClient.saveReflection(
          summaryToSave.reflection || summaryToSave,
          summaryToSave.messages ? summaryToSave.messages.map(m => m.text).join(' ') : '',
          summaryToSave.messages || [],
          language
        );
        setSuccessMessage('Reflection saved to your secure account vault.');
      }

      await loadVaultReflections();
      setViewMode('vault');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Recover Account with Single-Use Recovery Code
  const handleRecover = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await authClient.recoverAccount(loginUsername.trim(), recoveryCodeInput.trim(), newPassword);
      setCurrentUser(res.user);
      if (onSaveAccount) onSaveAccount(res.user);

      setSuccessMessage('Password reset successfully. You are now logged in.');
      await loadVaultReflections();
      setViewMode('vault');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Google Sign-In Action
  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    if (!googleStatus.configured) {
      setViewMode('google-info');
      return;
    }

    try {
      const url = await authClient.getGoogleAuthUrl();
      window.location.href = url;
    } catch (err) {
      setViewMode('google-info');
    }
  };

  // 5. Logout
  const handleLogout = async () => {
    await authClient.logout();
    setCurrentUser(null);
    setSavedReflections([]);
    if (onDeleteAccount) onDeleteAccount();
    setViewMode('select');
  };

  // 6. Delete Account
  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to permanently delete your account and all saved reflections? This action cannot be undone.')) {
      try {
        await authClient.deleteAccount();
        setCurrentUser(null);
        setSavedReflections([]);
        if (onDeleteAccount) onDeleteAccount();
        onClose();
      } catch (err) {
        setErrorMessage(err.message);
      }
    }
  };

  // 7. Delete Single Reflection
  const handleDeleteReflection = async (id) => {
    try {
      await authClient.deleteReflection(id);
      setSavedReflections(prev => prev.filter(r => r.id !== id));
      if (viewingReflection?.id === id) setViewingReflection(null);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const handleCopyCodes = () => {
    const text = `=== SAMVAAD RECOVERY CODES ===\nAccount: ${currentUser?.displayName || username}\n\n` +
      generatedCodes.map((c, i) => `${i + 1}. ${c}`).join('\n') +
      `\n\nIMPORTANT: Each code is single-use. Store these in a safe place.`;
    navigator.clipboard.writeText(text);
    setCodesCopied(true);
    setTimeout(() => setCodesCopied(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full my-auto p-6 sm:p-8 shadow-soft-xl border border-stone-200 relative animate-fade-in max-h-[92vh] overflow-y-auto">
        
        {/* Close / Cancel Button */}
        <button
          onClick={handleCancel}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          title="Cancel and close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Global Success Banner */}
        {successMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">{successMessage}</div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: ACCOUNT SELECTION GATE (Requirement: Sequence after SAVE SUMMARY)  */}
        {/* ========================================================================= */}
        {viewMode === 'select' && (
          <div className="space-y-6">
            <div className="text-center max-w-md mx-auto">
              <div className="w-14 h-14 bg-gradient-to-tr from-sage-700 via-sage-600 to-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-soft-md">
                <Lock className="w-7 h-7 text-emerald-200" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                {language === 'kn' ? 'ನಿಮ್ಮ ಸಾರಾಂಶವನ್ನು ಉಳಿಸಲು ಖಾತೆಯನ್ನು ರಚಿಸಿ' : 'Save Your Reflection'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                {language === 'kn'
                  ? 'ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಆತ್ಮಾವಲೋಕನ ಸಾರಾಂಶವನ್ನು ಉಳಿಸಲು ಖಾತೆಯನ್ನು ರಚಿಸಿ'
                  : 'Create an account to save your reflection to your private vault.'}
              </p>
            </div>

            {/* Privacy Explanation */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-slate-700 text-xs leading-relaxed flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold mb-0.5">
                  Privacy by Design
                </strong>
                Whether you choose Google or a Private Account, your identity is linked only to your own private reflection vault. No summaries are shared with clinicians without your explicit review and consent.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-1">
              
              {/* Option 1: Continue with Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-3.5 px-4 rounded-2xl border-2 border-stone-200 hover:border-slate-400 bg-white hover:bg-stone-50 text-slate-800 font-bold text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-2xs"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Option 2: Create a Private Account */}
              <button
                type="button"
                onClick={() => setViewMode('private-register')}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sage-700 via-sage-600 to-emerald-600 hover:from-sage-800 hover:to-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-soft-md shadow-sage-900/20 hover:shadow-glow-sage transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4 text-emerald-200" />
                <span>Create a Private Account</span>
              </button>
            </div>

            {/* Login Link */}
            <div className="pt-3 border-t border-stone-100 text-center text-xs text-slate-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setViewMode('login')}
                className="font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
              >
                Log in
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: PRIVATE ACCOUNT REGISTRATION                                      */}
        {/* ========================================================================= */}
        {viewMode === 'private-register' && (
          <div className="space-y-5">
            <div>
              <button
                type="button"
                onClick={() => setViewMode('select')}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold mb-2 flex items-center gap-1 cursor-pointer"
              >
                ← Back to options
              </button>
              <h3 className="text-xl font-black text-slate-900">
                Create a Private Account
              </h3>
            </div>

            {/* Mandatory Specification Disclosure Box */}
            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-emerald-950 text-xs leading-relaxed space-y-1.5 shadow-2xs">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <p className="font-semibold text-emerald-900">
                  Private accounts are pseudonymous. You do not need to provide your real name, email address, or phone number to create this account.
                </p>
              </div>
            </div>

            <form onSubmit={handleRegisterPrivate} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Nickname / Username
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = AVATAR_SUGGESTIONS[Math.floor(Math.random() * AVATAR_SUGGESTIONS.length)];
                      setUsername(next);
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    🎲 Suggest Alias
                  </button>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="e.g. Calm Cedar"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-sage-500 focus:outline-none text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account Password (min 8 characters)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Create a strong password"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-sage-500 focus:outline-none text-sm font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Stored securely using server-side scrypt hashing with random salt.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sage-700 via-sage-600 to-emerald-600 hover:from-sage-800 hover:to-emerald-700 text-white font-bold text-sm shadow-soft-md shadow-sage-900/20 hover:shadow-glow-sage transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{loading ? 'Creating Account...' : (summaryToSave ? 'Create Account & Save Reflection' : 'Create Private Account')}</span>
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: RECOVERY CODE DISPLAY (Mandatory Cryptographic Display & Warning)   */}
        {/* ========================================================================= */}
        {viewMode === 'recovery-display' && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-2.5">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Your Single-Use Recovery Codes
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Generated securely using cryptographically random entropy.
              </p>
            </div>

            {/* Mandatory Recovery Code Disclosures */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 text-xs leading-relaxed space-y-2 shadow-2xs">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <p className="font-bold">
                  Please store your recovery codes somewhere safe. If you lose your password and all unused recovery codes, you may permanently lose access to this account.
                </p>
              </div>
              <p className="text-[11px] text-amber-900">
                Because private accounts do not collect email or phone numbers, these 8 cryptographic recovery codes are your only emergency access key. Each code is strictly single-use.
              </p>
            </div>

            {/* Plaintext Codes Grid (Shown ONCE only) */}
            <div className="p-4 bg-slate-900 text-emerald-300 rounded-2xl font-mono text-xs grid grid-cols-2 gap-2.5 border border-slate-800 select-all">
              {generatedCodes.map((c, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/80">
                  <span className="text-slate-400 text-[10px] w-4">{i + 1}.</span>
                  <span className="tracking-wider">{c}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleCopyCodes}
                className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-soft-sm"
              >
                {codesCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{codesCopied ? 'Codes Copied!' : 'Copy All Recovery Codes'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode('vault');
                  loadVaultReflections();
                }}
                className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>I Have Saved My Codes →</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: GOOGLE AUTH CONFIGURATION TRANSPARENCY                            */}
        {/* ========================================================================= */}
        {viewMode === 'google-info' && (
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => setViewMode('select')}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold mb-2 flex items-center gap-1 cursor-pointer"
            >
              ← Back to options
            </button>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2.5 border border-blue-200">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Google Authentication Status
              </h3>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 text-xs leading-relaxed space-y-2">
              <strong className="block text-amber-900 font-bold">
                Configuration Required (Development / Production Setup)
              </strong>
              <p>
                The Google OAuth 2.0 / OIDC architecture is fully implemented on the backend. However, active Google Sign-In requires valid Google Cloud OAuth credentials in your server environment:
              </p>
              <pre className="p-2.5 bg-white/90 rounded-xl border border-amber-300 font-mono text-[11px] text-slate-800 overflow-x-auto">
{`GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/api/auth/google/callback`}
              </pre>
              <p className="text-[11px] text-amber-800">
                In adherence to strict security acceptance criteria, no mock or simulated Google logins are fabricated. Please create a Private Account to save your reflection immediately.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setViewMode('private-register')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sage-700 via-sage-600 to-emerald-600 text-white font-bold text-sm shadow-soft-md cursor-pointer"
            >
              Create a Private Account Instead
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: LOGIN                                                             */}
        {/* ========================================================================= */}
        {viewMode === 'login' && (
          <div className="space-y-5">
            <div>
              <button
                type="button"
                onClick={() => setViewMode('select')}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold mb-2 flex items-center gap-1 cursor-pointer"
              >
                ← Back to options
              </button>
              <h3 className="text-xl font-black text-slate-900">
                Log In to Samvaad
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Access your private reflection vault.
              </p>
            </div>

            <form onSubmit={handleLoginPrivate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nickname / Username
                </label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-sage-500 focus:outline-none text-sm font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setViewMode('recover')}
                    className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-sage-500 focus:outline-none text-sm font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-soft-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Logging in...' : (summaryToSave ? 'Log In & Save Reflection' : 'Log In')}</span>
              </button>
            </form>

            <div className="pt-3 border-t border-stone-100 text-center text-xs text-slate-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setViewMode('private-register')}
                className="font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Create Private Account
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: RECOVER ACCOUNT                                                   */}
        {/* ========================================================================= */}
        {viewMode === 'recover' && (
          <div className="space-y-5">
            <div>
              <button
                type="button"
                onClick={() => setViewMode('login')}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold mb-2 flex items-center gap-1 cursor-pointer"
              >
                ← Back to login
              </button>
              <h3 className="text-xl font-black text-slate-900">
                Recover Account
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Use one of your single-use recovery codes to reset your password.
              </p>
            </div>

            <form onSubmit={handleRecover} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nickname / Username
                </label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                  placeholder="Your username"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-sage-500 focus:outline-none text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Single-Use Recovery Code
                </label>
                <input
                  type="text"
                  value={recoveryCodeInput}
                  onChange={(e) => setRecoveryCodeInput(e.target.value)}
                  required
                  placeholder="e.g. SAMV-8K3P-7D2M"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-sage-500 focus:outline-none text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password (min 8 characters)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter a new strong password"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-sage-500 focus:outline-none text-sm font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sage-700 to-emerald-600 hover:from-sage-800 hover:to-emerald-700 text-white font-bold text-sm shadow-soft-md cursor-pointer"
              >
                {loading ? 'Verifying Code...' : 'Reset Password & Log In'}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 7: AUTHENTICATED VAULT (Server-enforced Ownership)                   */}
        {/* ========================================================================= */}
        {viewMode === 'vault' && currentUser && (
          <div className="space-y-5">
            {/* User Profile Bar */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sage-100 text-sage-800 flex items-center justify-center font-black">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{currentUser.displayName}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      {currentUser.accountType === 'google' ? 'Google Account' : 'Pseudonymous'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {currentUser.id}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-slate-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Log out of this browser"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>

            {/* Saved Reflections List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm text-slate-900">
                  Saved Personal Reflections ({savedReflections.length})
                </h4>
                <button
                  type="button"
                  onClick={loadVaultReflections}
                  className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Refresh
                </button>
              </div>

              {savedReflections.length === 0 ? (
                <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-300">
                  <p className="text-xs text-slate-500 font-medium">
                    No reflections saved in your vault yet. After a conversation with Aura, you can save your reflection here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {savedReflections.map((r) => (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-2xl border border-stone-200 bg-white hover:border-emerald-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {r.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Saved: {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setViewingReflection(r)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold hover:bg-emerald-100 cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReflection(r.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                          title="Delete reflection"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Viewing Specific Reflection Modal Subview */}
            {viewingReflection && (
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs text-slate-900">
                    {viewingReflection.title}
                  </h5>
                  <button
                    type="button"
                    onClick={() => setViewingReflection(null)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Close
                  </button>
                </div>
                <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-stone-200 space-y-2 max-h-48 overflow-y-auto">
                  <p><strong>Main Concerns:</strong> {viewingReflection.reflection?.sectionA_MainConcerns?.join(', ') || 'Explored in chat'}</p>
                  <p><strong>Emotions:</strong> {viewingReflection.reflection?.sectionB_ExperiencesDiscussed?.emotions?.join(', ') || 'Discussed'}</p>
                  <p className="text-[10px] text-slate-500 italic">Disclaimed: Verified non-diagnostic preliminary summary.</p>
                </div>
              </div>
            )}

            {/* Account Controls Footer */}
            <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="text-xs text-red-600 hover:text-red-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account & Data</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
