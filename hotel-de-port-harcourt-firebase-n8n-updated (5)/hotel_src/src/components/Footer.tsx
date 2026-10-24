// src/components/Footer.tsx
// Luxury footer with embedded Google Maps for GRA Phase 2, Port Harcourt

import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Shield, Star, ExternalLink, MessageSquare, Wrench } from 'lucide-react';
import { HOTEL_INFO, GOOGLE_REVIEW_URL } from '../config.ts';

export const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-[#06101E] text-slate-300 pt-16 pb-12 border-t border-[#C9A24B]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Brand Info (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#C9A24B] flex items-center justify-center text-[#0A1A2F] font-serif font-bold text-xl shadow-md">
                HD
              </div>
              <div>
                <span className="font-serif text-xl font-bold text-white block">
                  {HOTEL_INFO.name}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-[#C9A24B] font-semibold">
                  5-Star Hospitality in Rivers State
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              Situated in the exclusive, serene diplomatic enclave of GRA Phase 2, Port Harcourt. Delivering world-class hospitality, 24/7 dedicated generator power grid, high-level executive security, and authentic Nigerian warmth.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-[#C9A24B]">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#C9A24B]" />
                ))}
              </div>
              <span className="font-semibold text-white">4.9 / 5.0</span>
              <span className="text-slate-400">(Over 350 Verified Executive Reviews)</span>
            </div>

            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#C9A24B]/20 text-slate-200 hover:text-white border border-white/10 transition-colors"
              >
                <span>Google Verified Business</span>
                <ExternalLink className="w-3 h-3 text-[#C9A24B]" />
              </a>
              <Link
                to="/review"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#C9A24B]/20 text-slate-200 hover:text-white border border-white/10 transition-colors"
              >
                <MessageSquare className="w-3 h-3 text-[#C9A24B]" />
                <span>Submit Guest Review</span>
              </Link>
            </div>
          </div>

          {/* Contact Details (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#C9A24B] font-serif">
              Contact & Location
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-5 h-5 text-[#C9A24B] shrink-0 mt-0.5" />
                <span className="leading-snug text-slate-300">
                  {HOTEL_INFO.address}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#C9A24B] shrink-0" />
                <a href={`tel:${HOTEL_INFO.phone}`} className="hover:text-white transition-colors">
                  {HOTEL_INFO.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#C9A24B] shrink-0" />
                <a href={`mailto:${HOTEL_INFO.email}`} className="hover:text-white transition-colors">
                  {HOTEL_INFO.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-xs text-slate-400">
                <Clock className="w-4 h-4 text-[#C9A24B] shrink-0" />
                <span>Check-in: 2:00 PM | Check-out: 11:00 AM</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                to="/report?room=203"
                className="inline-flex items-center gap-2 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>In-Room Maintenance (QR Code Portal)</span>
              </Link>
            </div>
          </div>

          {/* Embedded Google Map (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#C9A24B] font-serif">
              GRA Phase 2, Port Harcourt
            </h4>
            <div className="w-full h-52 rounded-xl overflow-hidden border border-white/10 shadow-lg relative bg-[#0A1A2F]">
              <iframe
                title="Hotel De Port GRA Phase 2 Location Map"
                src="https://maps.google.com/maps?q=GRA%20Phase%202%20Port%20Harcourt%20Rivers%20State%20Nigeria&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full opacity-90 contrast-125"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-[#0A1A2F]/90 backdrop-blur-xs p-2 rounded-lg border border-[#C9A24B]/30 flex items-center justify-between text-[11px] text-white">
                <span className="font-semibold text-amber-200">Plot 14 Birabi St, GRA Phase 2</span>
                <span className="text-slate-400">35 min to Omagwa Airport</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Credits & Staff Portal */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Hotel De Port. All rights reserved. Registered in Nigeria.</p>
          <div className="flex items-center gap-6">
            <Link to="/report?room=203" className="hover:text-amber-300 transition-colors">
              Maintenance Desk
            </Link>
            <Link to="/review" className="hover:text-amber-300 transition-colors">
              Guest Feedback
            </Link>
            <Link to="/login" className="hover:text-amber-300 transition-colors">
              Guest Account
            </Link>
            <Link
              to="/admin/login"
              className="flex items-center gap-1.5 text-[#C9A24B] hover:text-white transition-colors font-semibold"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Staff Admin Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
