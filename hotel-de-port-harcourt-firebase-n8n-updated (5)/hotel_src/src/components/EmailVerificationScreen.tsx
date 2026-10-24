// src/components/EmailVerificationScreen.tsx
// Verification screen shown after registration or when logging in with an unverified email

import React from 'react';
import { Mail, CheckCircle2, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

interface EmailVerificationScreenProps {
  email: string;
  onLoginClick: () => void;
  title?: string;
  onResend?: () => void;
  isResending?: boolean;
  resendMessage?: string;
}

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
  email,
  onLoginClick,
  title = 'Verify Your Email'
}) => {
  return (
    <div className="text-center py-2 animate-in fade-in duration-300">
      {/* Icon with Gold Accent */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5">
        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#0A1A2F] to-[#122844] flex items-center justify-center text-[#C9A24B] shadow-xl border border-[#C9A24B]/30">
          <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-[#C9A24B] animate-pulse" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#C9A24B] text-[#0A1A2F] flex items-center justify-center shadow-md">
          <ShieldCheck className="w-4 h-4" />
        </div>
      </div>

      {/* Header */}
      <span className="text-[11px] uppercase tracking-widest text-[#C9A24B] font-bold block mb-1">
        Email Verification Required
      </span>
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0A1A2F] mb-4">
        {title}
      </h2>

      {/* Exact Required Message */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 sm:p-5 mb-6 text-left sm:text-center shadow-xs">
        <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
          We have sent you a verification email to{' '}
          <strong className="text-[#0A1A2F] font-bold break-all underline decoration-[#C9A24B]">
            {email}
          </strong>
          . Please verify it and log in.
        </p>
      </div>

      {/* Help / Guidance box */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 text-xs text-slate-600 text-left space-y-1.5">
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Next Steps:</span>
        </div>
        <p className="pl-6 text-[12px] text-slate-600">
          1. Open the inbox for <strong>{email}</strong>.
        </p>
        <p className="pl-6 text-[12px] text-slate-600">
          2. Click the verification link from Firebase / Hotel De Port.
        </p>
        <p className="pl-6 text-[12px] text-slate-600">
          3. Click the <strong>Login</strong> button below to access your account.
        </p>
        <p className="pl-6 text-[11px] text-slate-400 italic">
          Tip: Check your spam or promotions folder if you don't see it within 2 minutes.
        </p>
      </div>

      {/* Action: Login Button (Required) */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={onLoginClick}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#B38C38] text-[#0A1A2F] font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Login</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
