// src/pages/AuthPages.tsx
// Public Guest Login & Registration Portal with Firebase Authentication

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Shield, ArrowLeft, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';
import { AuthService } from '../services/auth.ts';
import { useToast } from '../components/ui/Toast.tsx';
import { EmailVerificationScreen } from '../components/EmailVerificationScreen.tsx';

interface AuthPagesProps {
  initialMode?: 'login' | 'signup' | 'verify';
}

export const AuthPages: React.FC<AuthPagesProps> = ({ initialMode = 'login' }) => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup' | 'verify'>(() => {
    if (searchParams.get('verify') === 'true') return 'verify';
    return initialMode;
  });
  const [email, setEmail] = useState(() => searchParams.get('email') || '');
  const [unverifiedEmail, setUnverifiedEmail] = useState(() => searchParams.get('email') || '');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { success } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const result = await AuthService.signUp(email, password);
        setIsLoading(false);

        if (result.needsVerification) {
          // Do not sign them in automatically. Show verification screen.
          setUnverifiedEmail(result.email || email);
          setMode('verify');
          return;
        }

        if (result.success) {
          success(`Account registered! Please verify your email.`);
          setUnverifiedEmail(email);
          setMode('verify');
        } else {
          setErrorMessage(result.error || 'User already exists. Please sign in');
        }
      } else {
        const result = await AuthService.signIn(email, password);
        setIsLoading(false);

        if (result.needsVerification) {
          // Block access and show verification screen
          setUnverifiedEmail(result.email || email);
          setMode('verify');
          return;
        }

        if (result.success) {
          success('Signed in successfully! Redirecting to dashboard...');
          navigate('/dashboard');
        } else {
          setErrorMessage(result.error || 'Email or password is incorrect');
        }
      }
    } catch {
      setIsLoading(false);
      setErrorMessage(mode === 'signup' ? 'User already exists. Please sign in' : 'Email or password is incorrect');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage('');
    try {
      const res = await AuthService.signInWithGoogle();
      setIsGoogleLoading(false);
      success(`Signed in as ${res.user.name}. Redirecting to dashboard...`);
      navigate('/dashboard');
    } catch (err: any) {
      setIsGoogleLoading(false);
      setErrorMessage(err.message || 'Google sign in failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1A2F] py-12 px-4 sm:px-6 flex items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C9A24B]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-[#C9A24B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Hotel Home</span>
          </Link>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 text-xs text-[#C9A24B] hover:text-white transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Staff Portal</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#C9A24B]/40 relative">
          {mode === 'verify' ? (
            <EmailVerificationScreen
              email={unverifiedEmail || email || 'your email'}
              onLoginClick={() => {
                setMode('login');
                setErrorMessage('');
              }}
            />
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#0A1A2F] text-[#C9A24B] flex items-center justify-center mx-auto mb-3 shadow-md">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-[11px] uppercase tracking-widest text-[#C9A24B] font-bold">
                  Hotel De Port Portal
                </span>
                <h1 className="font-serif text-2xl font-bold text-[#0A1A2F] mt-1">
                  {mode === 'login' ? 'User Sign In' : 'Create Account'}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Sign in with your email and password to access your dashboard.
                </p>
              </div>

              {/* Mode Switch Tabs */}
              <div className="flex rounded-xl bg-slate-100 p-1 mb-5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                  }}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-[#0A1A2F] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage('');
                  }}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-white text-[#0A1A2F] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  New User Register
                </button>
              </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 font-medium animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* GOOGLE SIGN IN BUTTON */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 shadow-xs hover:shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {/* Authentic Google Multi-Color SVG Logo */}
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
            <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute">
              or with email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Sandra Uchechukwu"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. user@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#B38C38] text-[#0A1A2F] font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-md transition-all cursor-pointer mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>{mode === 'login' ? 'Signing In...' : 'Registering...'}</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Sign In To Dashboard' : 'Create Account'}</span>
              )}
            </button>
          </form>

            </>
          )}
        </div>
      </div>
    </div>
  );
};
