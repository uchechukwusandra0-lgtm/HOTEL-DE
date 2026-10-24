// src/components/Navbar.tsx
// Luxury navigation bar for Hotel De Port Harcourt

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Shield, Star, User, Calendar, Wrench } from 'lucide-react';
import { HOTEL_INFO } from '../config.ts';
import { AuthService } from '../services/auth.ts';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isAdmin = AuthService.isAdminAuthenticated();
  const guestUser = AuthService.getGuestUser();

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (window.location.pathname !== '/') {
      navigate(`/#${id}`);
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0A1A2F]/95 backdrop-blur-md border-b border-[#C9A24B]/30 text-white shadow-lg transition-all">
      {/* Top micro bar for VIP phone & Port Harcourt notice */}
      <div className="bg-[#06101E] px-4 py-1.5 text-xs text-slate-300 border-b border-[#C9A24B]/15 hidden sm:flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-amber-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            24/7 Redundant Power & High-Speed WiFi Guaranteed
          </span>
          <span className="text-slate-500">|</span>
          <span>GRA Phase 2, Port Harcourt, Rivers State</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <a href={`tel:${HOTEL_INFO.phone}`} className="hover:text-[#C9A24B] transition-colors">
            Reservations: {HOTEL_INFO.phone}
          </a>
          <span className="text-slate-500">|</span>
          <Link to="/report?room=203" className="hover:text-amber-200 flex items-center gap-1 text-[#C9A24B]">
            <Wrench className="w-3 h-3" /> In-Room QR Report
          </Link>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#C9A24B] to-[#9F7B2B] flex items-center justify-center shadow-md border border-[#DFBF72]/50 group-hover:scale-105 transition-transform">
              <span className="font-serif font-black text-xl text-[#0A1A2F] tracking-tighter">HD</span>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[#C9A24B]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-2.5 h-2.5 fill-[#C9A24B]" />
                ))}
              </div>
              <span className="block font-serif text-lg sm:text-xl font-bold tracking-wide text-white group-hover:text-[#C9A24B] transition-colors">
                Hotel De Port
              </span>
              <span className="block text-[10px] tracking-widest uppercase text-slate-300 font-medium -mt-0.5">
                GRA Phase 2 • 5-Star Luxury
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium tracking-wide">
            <button
              onClick={() => scrollToSection('rooms')}
              className="text-slate-200 hover:text-[#C9A24B] transition-colors cursor-pointer"
            >
              Rooms & Suites
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-slate-200 hover:text-[#C9A24B] transition-colors cursor-pointer"
            >
              Amenities
            </button>
            <button
              onClick={() => scrollToSection('gallery')}
              className="text-slate-200 hover:text-[#C9A24B] transition-colors cursor-pointer"
            >
              Gallery
            </button>
            <button
              onClick={() => scrollToSection('testimonials')}
              className="text-slate-200 hover:text-[#C9A24B] transition-colors cursor-pointer"
            >
              Reviews
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-slate-200 hover:text-[#C9A24B] transition-colors cursor-pointer"
            >
              Location & Contact
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {guestUser && (
              <Link to="/dashboard" className="px-3 py-2 rounded-lg text-xs font-semibold text-amber-300 hover:text-white hover:bg-white/5 transition-colors">
                Dashboard
              </Link>
            )}
            {guestUser ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs">
                <User className="w-3.5 h-3.5 text-[#C9A24B]" />
                <span className="text-slate-200">{guestUser.name}</span>
                <span className="text-[10px] bg-[#C9A24B] text-[#0A1A2F] font-bold px-1.5 py-0.2 rounded">
                  {guestUser.membershipTier}
                </span>
                <button
                  onClick={async () => {
                    await AuthService.logout();
                    navigate('/login');
                  }}
                  title="Sign out to auth screen"
                  className="text-slate-400 hover:text-rose-400 ml-1 cursor-pointer transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-[#C9A24B]" />
                <span>Guest Sign In</span>
              </Link>
            )}

            <button
              onClick={() => scrollToSection('book-now')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#B38C38] text-[#0A1A2F] font-semibold text-xs uppercase tracking-wider hover:brightness-110 shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book A Room</span>
            </button>

            <Link
              to={isAdmin ? '/admin' : '/admin/login'}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
              title="Staff Operations Admin Portal"
              aria-label="Staff Portal"
            >
              <Shield className="w-4 h-4 text-[#C9A24B]" />
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => scrollToSection('book-now')}
              className="px-3 py-1.5 rounded-lg bg-[#C9A24B] text-[#0A1A2F] text-xs font-bold sm:hidden"
            >
              Book
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0A1A2F] border-b border-[#C9A24B]/30 px-4 pt-2 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => scrollToSection('rooms')}
              className="text-left py-2 px-3 rounded-lg text-slate-200 hover:bg-white/5 font-medium"
            >
              Rooms & Suites
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-left py-2 px-3 rounded-lg text-slate-200 hover:bg-white/5 font-medium"
            >
              Amenities & 24/7 Power
            </button>
            <button
              onClick={() => scrollToSection('gallery')}
              className="text-left py-2 px-3 rounded-lg text-slate-200 hover:bg-white/5 font-medium"
            >
              Photo Gallery
            </button>
            <button
              onClick={() => scrollToSection('testimonials')}
              className="text-left py-2 px-3 rounded-lg text-slate-200 hover:bg-white/5 font-medium"
            >
              Guest Reviews
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-left py-2 px-3 rounded-lg text-slate-200 hover:bg-white/5 font-medium"
            >
              Location & Contact
            </button>
            <Link
              to="/report?room=203"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 px-3 rounded-lg text-amber-300 hover:bg-white/5 font-medium"
            >
              <Wrench className="w-4 h-4" /> In-Room Maintenance Report
            </Link>
            {guestUser && (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 px-3 rounded-lg text-amber-300 hover:bg-white/5 font-medium"
              >
                <User className="w-4 h-4 text-[#C9A24B]" /> My Dashboard
              </Link>
            )}
            {guestUser ? (
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
                <span className="text-slate-200 text-xs">Signed in: {guestUser.name}</span>
                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await AuthService.logout();
                    navigate('/login');
                  }}
                  className="text-xs text-rose-300 font-semibold"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 px-3 rounded-lg text-slate-200 hover:bg-white/5 font-medium"
              >
                <User className="w-4 h-4 text-[#C9A24B]" /> Guest Sign In / Register
              </Link>
            )}
            <Link
              to={isAdmin ? '/admin' : '/admin/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 px-3 rounded-lg text-amber-300 hover:bg-white/5 font-medium"
            >
              <Shield className="w-4 h-4 text-[#C9A24B]" /> Staff Admin Portal
            </Link>
          </div>

          <div className="pt-2">
            <button
              onClick={() => scrollToSection('book-now')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#B38C38] text-[#0A1A2F] font-bold text-center tracking-wide uppercase text-xs"
            >
              Reserve A Suite Now
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
