// src/pages/admin/AdminLoginPage.tsx
// Secure login & password creation portal for Hotel De Port Staff & Management

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  ArrowLeft,
  KeyRound,
  Sparkles,
  AlertCircle,
  UserPlus,
  CheckCircle2,
  Key
} from 'lucide-react';
import { AuthService } from '../../services/auth.ts';
import { DEMO_ADMIN_CREDENTIALS } from '../../config.ts';
import { useToast } from '../../components/ui/Toast.tsx';
import { EmailVerificationScreen } from '../../components/EmailVerificationScreen.tsx';

type AuthMode = 'login' | 'register' | 'forgot';

export const AdminLoginPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState(DEMO_ADMIN_CREDENTIALS.email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { success } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setIsLoading(true);

    try {
      const result = await AuthService.signIn(email, password);
      setIsLoading(false);

      if (result.needsVerification) {
        setUnverifiedEmail(result.email || email);
        return;
      }

      if (result.success && AuthService.isAdminAuthenticated()) {
        success(`Welcome back, ${result.user?.name || 'Staff Member'}!`);
        navigate('/admin');
      } else if (result.success) {
        setErrorMsg('This account is not authorized for the staff admin panel.');
        await AuthService.logout();
      } else {
        setErrorMsg(result.error || 'Email or password is incorrect');
      }
    } catch {
      setIsLoading(false);
      setErrorMsg('Email or password is incorrect');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.signUp(email, password);
      setIsLoading(false);

      if (result.needsVerification) {
        setUnverifiedEmail(result.email || email);
        return;
      }

      if (result.error) {
        setErrorMsg(result.error);
      }
    } catch {
      setIsLoading(false);
      setErrorMsg('Unable to complete registration. Please try again.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setIsLoading(true);

    try {
      const result = await AuthService.sendPasswordReset(email);
      setIsLoading(false);
      if (result.success) {
        setInfoMsg(result.message);
      } else {
        setErrorMsg(result.message);
      }
    } catch {
      setIsLoading(false);
      setErrorMsg('Failed to send password reset email.');
    }
  };

  const handleGoogleAdminLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await AuthService.signInWithGoogle(email, 'Sandra Uchechukwu');
      setIsGoogleLoading(false);
      if (!result.success || !AuthService.isAdminAuthenticated()) {
        setErrorMsg('Google sign-in failed or this account is not authorized for staff access.');
        return;
      }
      success(`Welcome back, ${result.user?.name || 'Administrator'}!`);
      navigate('/admin');
    } catch {
      setIsGoogleLoading(false);
      setErrorMsg('Google sign in could not be completed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#06101E] py-12 px-4 sm:px-6 flex items-center justify-center relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C9A24B]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-[#C9A24B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Hotel Public Website</span>
          </Link>
          <span className="text-[11px] text-amber-200/80 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
            GRA Phase 2 Management
          </span>
        </div>

        <div className="bg-[#0A1A2F] text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-[#C9A24B]/40 backdrop-blur-md">
          {unverifiedEmail ? (
            <div className="bg-white text-slate-800 rounded-2xl p-6 sm:p-8 shadow-inner">
              <EmailVerificationScreen
                email={unverifiedEmail}
                onLoginClick={() => {
                  setUnverifiedEmail(null);
                  setMode('login');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
              />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C9A24B] to-[#9F7B2B] text-[#0A1A2F] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#C9A24B]/20">
                  <Shield className="w-7 h-7" />
                </div>
                <span className="text-xs uppercase tracking-widest text-[#C9A24B] font-bold">
                  Staff & Operations PMS
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
                  {mode === 'login'
                    ? 'Staff Portal Login'
                    : mode === 'register'
                    ? 'Create Staff Password'
                    : 'Reset Staff Password'}
                </h1>
                <p className="text-xs text-slate-300 mt-1">
                  Hotel De Port • General Management & Operations
                </p>
              </div>

              {/* Mode Toggle Tabs (Login vs Create Password) */}
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'login'
                      ? 'bg-[#C9A24B] text-[#0A1A2F] shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Staff Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'register'
                      ? 'bg-[#C9A24B] text-[#0A1A2F] shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Password</span>
                </button>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div className="flex-1">
                    <p>{errorMsg}</p>
                    {errorMsg.includes('User already exists') && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setErrorMsg('');
                        }}
                        className="mt-1 text-amber-300 hover:underline font-semibold block text-[11px]"
                      >
                        Click here to switch to Sign In &rarr;
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Info / Success Message */}
              {infoMsg && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>{infoMsg}</span>
                </div>
              )}

              {/* MODE 1: STAFF LOGIN */}
              {mode === 'login' && (
                <>
                  {/* Google Sign In Button */}
                  <button
                    type="button"
                    onClick={handleGoogleAdminLogin}
                    disabled={isGoogleLoading}
                    className="w-full py-3 px-4 rounded-xl border border-white/20 hover:border-[#C9A24B]/50 bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{isGoogleLoading ? 'Signing in with Google...' : 'Sign in with Google Workspace'}</span>
                  </button>

                  {/* Divider */}
                  <div className="relative my-4 flex items-center justify-center">
                    <div className="border-t border-white/10 w-full" />
                    <span className="bg-[#0A1A2F] px-3 text-[10px] uppercase tracking-wider text-slate-400 font-semibold absolute">
                      or use staff email
                    </span>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Staff Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="uchechukwusandra0@gmail.com"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C9A24B] focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                          Staff Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot');
                            setErrorMsg('');
                            setInfoMsg('');
                          }}
                          className="text-[11px] text-amber-300/80 hover:text-amber-200 hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C9A24B] focus:border-transparent"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#B38C38] text-[#0A1A2F] font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
                    >
                      {isLoading ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin" />
                          <span>Authenticating...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>Access Staff Dashboard</span>
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}

              {/* MODE 2: CREATE STAFF PASSWORD / REGISTER */}
              {mode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-xs">
                    Staff accounts require email verification before dashboard access is permitted.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Staff Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="uchechukwusandra0@gmail.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C9A24B] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Create Password (min. 6 characters)
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter secure password"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C9A24B] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Confirm secure password"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C9A24B] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#B38C38] text-[#0A1A2F] font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {isLoading ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>Creating Account & Sending Email...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Create Password & Register</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMsg('');
                        setInfoMsg('');
                      }}
                      className="text-xs text-slate-400 hover:text-amber-200 underline"
                    >
                      Already have credentials? Return to Staff Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* MODE 3: FORGOT / RESET PASSWORD */}
              {mode === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-3.5">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-200 text-xs">
                    Enter the staff email address to receive password setup instructions.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Staff Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="uchechukwusandra0@gmail.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C9A24B] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#B38C38] text-[#0A1A2F] font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {isLoading ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>Sending Reset Instructions...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Send Password Reset Email</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMsg('');
                        setInfoMsg('');
                      }}
                      className="text-xs text-slate-400 hover:text-amber-200 underline"
                    >
                      Back to Staff Sign In
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
