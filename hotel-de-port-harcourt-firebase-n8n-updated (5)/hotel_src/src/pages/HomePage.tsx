// src/pages/HomePage.tsx
// Hotel De Port Harcourt - Luxury 5-Star Hotel Public Website

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Wifi,
  Zap,
  Waves,
  UtensilsCrossed,
  Dumbbell,
  Car,
  Tv,
  Wind,
  Check,
  Star,
  Calendar,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';
import { HOTEL_INFO, ROOM_RATES, WEBHOOKS, postWebhook } from '../config.ts';
import { HOTEL_IMAGES } from '../data/demoData.ts';
import { addBooking, addAbandoned } from '../services/data.ts';
import { auth } from '../services/firebase.ts';
import { useToast } from '../components/ui/Toast.tsx';
import { LightboxModal, GalleryItem } from '../components/LightboxModal.tsx';
import { RoomType } from '../types.ts';

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Lagoon Swimming Pool & Sun Deck',
    category: 'Pool & Outdoors',
    url: HOTEL_IMAGES.heroPool,
    description: 'Olympic-dimension heated swimming pool surrounded by tropical palm gardens and private daybeds.'
  },
  {
    id: 'gal-2',
    title: 'Executive Master Suite',
    category: 'Suites',
    url: HOTEL_IMAGES.executiveSuite,
    description: 'Lavishly furnished executive suite featuring Italian marble bathrooms, king bed, and lounge area.'
  },
  {
    id: 'gal-3',
    title: 'The Niger Bistro Fine Dining',
    category: 'Dining',
    url: HOTEL_IMAGES.restaurant,
    description: 'Gourmet restaurant serving authentic Rivers seafood specialties and continental gastronomy.'
  },
  {
    id: 'gal-4',
    title: 'Grand Reception & Concierge Desk',
    category: 'Reception',
    url: HOTEL_IMAGES.reception,
    description: '24-hour reception lobby finished with imported marble, brass accents, and VIP arrivals lounge.'
  },
  {
    id: 'gal-5',
    title: 'State-of-the-Art Fitness Center',
    category: 'Wellness',
    url: HOTEL_IMAGES.gym,
    description: 'Fully equipped Technogym facility with free weights, treadmills, and personal training on request.'
  },
  {
    id: 'gal-6',
    title: 'Presidential Penthouse Living Salon',
    category: 'Penthouse',
    url: HOTEL_IMAGES.presidentialSuite,
    description: 'Top-tier luxury penthouse offering panoramic skyline vistas of Port Harcourt GRA Phase 2.'
  }
];

const AMENITIES = [
  {
    icon: Zap,
    title: '24/7 Redundant Power',
    desc: 'Dual synchronized Caterpillar generators & solar hybrid back-up. 0% downtime guarantee.'
  },
  {
    icon: Wifi,
    title: 'High-Speed Fiber WiFi',
    desc: 'Dedicated enterprise fiber optic connectivity in every room and public courtyard.'
  },
  {
    icon: Waves,
    title: 'Olympic Swimming Pool',
    desc: 'Crystal-clear temperature-controlled pool with poolside cocktail & barbecue bar.'
  },
  {
    icon: UtensilsCrossed,
    title: 'The Niger Bistro',
    desc: 'Five-star culinary cuisine featuring native Rivers seafood okra and intercontinental fare.'
  },
  {
    icon: Dumbbell,
    title: 'Executive Fitness Gym',
    desc: 'State-of-the-art cardiovascular and strength training equipment open 24 hours.'
  },
  {
    icon: Car,
    title: 'VIP Airport Chauffeur',
    desc: 'Seamless armored SUV transfers to and from Port Harcourt International Airport (OMAGWA).'
  }
];

export const HomePage: React.FC = () => {
  const { success, error, info } = useToast();

  // Booking Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Default dates: tomorrow and 3 days later
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);
  const defaultCheckoutStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  }, []);

  const [checkIn, setCheckIn] = useState(tomorrowStr);
  const [checkOut, setCheckOut] = useState(defaultCheckoutStr);
  const [roomType, setRoomType] = useState<RoomType>('Executive Suite');
  const [guests, setGuests] = useState(2);
  const [specialRequest, setSpecialRequest] = useState('');
  
  // Validation & Submission States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccessModal, setBookingSuccessModal] = useState<{
    open: boolean;
    bookingId?: string;
    total?: number;
    roomType?: string;
    dates?: string;
  }>({ open: false });

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Client-side Booking ID for current draft
  const draftBookingIdRef = useRef<string>(`HDPH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`);
  const abandonedSentRef = useRef<boolean>(false);
  const hasSubmittedRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<any>(null);

  // Calculate nights and live total
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();
    const diff = (end - start) / (1000 * 3600 * 24);
    return diff > 0 ? Math.round(diff) : 1;
  }, [checkIn, checkOut]);

  const nightlyRate = ROOM_RATES[roomType] || 85000;
  const totalAmount = nights * nightlyRate;

  // Validate fields helper
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'fullName':
        return !value.trim() ? 'Full name is required' : '';
      case 'email':
        if (!value.trim()) return 'Email address is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        if (value.trim().length < 8) return 'Please enter a valid phone number (e.g. +234...)';
        return '';
      case 'checkIn':
        if (!value) return 'Check-in date is required';
        if (value < todayStr) return 'Check-in cannot be in the past';
        return '';
      case 'checkOut':
        if (!value) return 'Check-out date is required';
        if (checkIn && value <= checkIn) return 'Check-out must be after check-in date';
        return '';
      default:
        return '';
    }
  };

  // Debounced abandoned tracking
  useEffect(() => {
    if (hasSubmittedRef.current || abandonedSentRef.current) return;

    const emailValid = email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const phoneValid = phone.trim().length >= 8;

    if (emailValid && phoneValid) {
      // Clear previous timer if typing continues
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // 5 second debounce
      debounceTimerRef.current = setTimeout(async () => {
        if (hasSubmittedRef.current || abandonedSentRef.current) return;

        abandonedSentRef.current = true;
        const payload = {
          bookingId: draftBookingIdRef.current,
          fullName: fullName.trim() || 'Guest In Progress',
          email: email.trim(),
          phone: phone.trim(),
          roomType,
          totalAmount,
          startedAt: new Date().toISOString()
        };

        try {
          await addAbandoned({
            bookingId: payload.bookingId,
            fullName: payload.fullName,
            email: payload.email,
            phone: payload.phone,
            roomType: payload.roomType,
            totalAmount: payload.totalAmount,
            startedAt: payload.startedAt
          });
        } catch (err) {
          console.warn('Could not save abandoned booking lead to Firestore:', err);
          return;
        }
        try {
          await postWebhook(WEBHOOKS.trackAbandoned, payload);
        } catch (err) {
          // The lead remains safely stored in Firestore for later recovery.
          console.warn('Abandoned lead saved; n8n tracking webhook is not configured/reachable:', err);
        }
      }, 5000);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [email, phone, fullName, roomType, totalAmount]);

  // Handle form submission
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {
      fullName: validateField('fullName', fullName),
      email: validateField('email', email),
      phone: validateField('phone', phone),
      checkIn: validateField('checkIn', checkIn),
      checkOut: validateField('checkOut', checkOut),
    };

    // Filter out empties
    const activeErrors: Record<string, string> = {};
    Object.keys(newErrors).forEach(key => {
      if (newErrors[key]) activeErrors[key] = newErrors[key];
    });

    setErrors(activeErrors);

    if (Object.keys(activeErrors).length > 0) {
      error('Please complete all required fields correctly.');
      return;
    }

    setIsSubmitting(true);
    hasSubmittedRef.current = true; // Never trigger abandoned tracking after submit

    const bookingId = draftBookingIdRef.current;
    const createdAt = new Date().toISOString();

    const payload = {
      bookingId,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      checkIn,
      checkOut,
      roomType,
      guests,
      specialRequest: specialRequest.trim(),
      nights,
      totalAmount,
      createdAt,
      userId: auth.currentUser?.uid || undefined
    };

    // Save the booking to Firestore first; only continue if this succeeds.
    try {
      await addBooking({
        ...payload,
        status: 'Confirmed',
        paymentStatus: 'Pending'
      });
    } catch (dataErr: any) {
      console.error('Firestore booking save failed:', dataErr);
      error('We could not save your booking. Please try again or contact the front desk.');
      setIsSubmitting(false);
      hasSubmittedRef.current = false;
      return;
    }

    // n8n notification is an additional automation, not the source of truth for the booking.
    try {
      await postWebhook(WEBHOOKS.createBooking, payload);
      success('Booking received. Your reservation request has been saved.');
    } catch (netErr: any) {
      console.warn('Booking saved to Firestore but n8n notification failed:', netErr);
      info('Your reservation request is saved. Automated notifications are temporarily unavailable.');
    } finally {
      setIsSubmitting(false);
      setBookingSuccessModal({
        open: true,
        bookingId,
        total: totalAmount,
        roomType,
        dates: `${checkIn} to ${checkOut} (${nights} ${nights === 1 ? 'night' : 'nights'})`
      });
      setSpecialRequest('');
      draftBookingIdRef.current = `HDPH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      abandonedSentRef.current = false;
      hasSubmittedRef.current = false;
    }
  };

  const scrollToBooking = (selectedRoom?: RoomType) => {
    if (selectedRoom) {
      setRoomType(selectedRoom);
    }
    const formElement = document.getElementById('book-now');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#1E293B] relative">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[92vh] flex items-center justify-center bg-[#0A1A2F] overflow-hidden">
        {/* Background Image with Navy Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={HOTEL_IMAGES.heroPool}
            alt="Hotel De Port Luxury Pool and Exterior"
            className="w-full h-full object-cover object-center filter brightness-60 scale-105 animate-pulse duration-[10000ms]"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A2F] via-[#0A1A2F]/70 to-[#0A1A2F]/40" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white py-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C9A24B]/20 border border-[#C9A24B]/50 text-amber-200 text-xs uppercase tracking-widest font-semibold mb-6 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A24B]" />
            <span>GRA Phase 2, Port Harcourt, Rivers State</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-6 drop-shadow-md">
            Luxury Stay in the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#E0C172] to-[#C9A24B]">
              Heart of Port Harcourt
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-200 font-light leading-relaxed mb-10 drop-shadow-xs">
            Immerse yourself in authentic 5-star elegance. Guaranteed 24/7 uninterrupted power,
            high-speed fiber connectivity, gourmet dining, and bespoke diplomatic hospitality.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => scrollToBooking()}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#B38C38] text-[#0A1A2F] font-bold text-sm tracking-widest uppercase hover:brightness-110 shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Book Your Stay</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('rooms');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-sm tracking-wider transition-all backdrop-blur-xs cursor-pointer"
            >
              View Rooms & Suites
            </button>
          </div>

          {/* Quick trust metrics */}
          <div className="mt-14 pt-8 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-[#C9A24B]">100%</div>
              <div className="text-xs text-slate-300 uppercase tracking-wider mt-1">24/7 Power Grid</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-[#C9A24B]">5-Star</div>
              <div className="text-xs text-slate-300 uppercase tracking-wider mt-1">Luxury Rating</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-[#C9A24B]">GRA Phase 2</div>
              <div className="text-xs text-slate-300 uppercase tracking-wider mt-1">Secure Enclave</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-[#C9A24B]">35 Mins</div>
              <div className="text-xs text-slate-300 uppercase tracking-wider mt-1">To Airport</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ABOUT & AMENITIES SECTION */}
      <section id="about" className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C9A24B]">
              The Port Harcourt Standard
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0A1A2F] mt-2 mb-4">
              World-Class Comfort in Rivers State
            </h2>
            <div className="w-16 h-1 bg-[#C9A24B] mx-auto mb-6" />
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              Nestled along the serene Birabi Street in GRA Phase 2, Hotel De Port delivers an oasis
              of tranquility and high-level security for business leaders, dignitaries, and discerning travelers.
              Enjoy seamless convenience from arrival to checkout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {AMENITIES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-[#C9A24B]/50 hover:bg-white hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#0A1A2F] text-[#C9A24B] flex items-center justify-center mb-5 group-hover:bg-[#C9A24B] group-hover:text-[#0A1A2F] transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#0A1A2F] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. ROOMS SECTION */}
      <section id="rooms" className="py-24 bg-[#FAFAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C9A24B]">
              Accommodations
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0A1A2F] mt-2 mb-4">
              Suites Designed For Absolute Distinction
            </h2>
            <div className="w-16 h-1 bg-[#C9A24B] mx-auto mb-4" />
            <p className="text-slate-600 text-sm sm:text-base">
              Every room is meticulously soundproofed, temperature-controlled, and equipped with smart entertainment and work amenities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Deluxe Room */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300">
              <div className="relative h-60 overflow-hidden">
                <img
                  src={HOTEL_IMAGES.deluxeRoom}
                  alt="Deluxe Room"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 bg-[#0A1A2F]/90 backdrop-blur-xs text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Deluxe Class
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="font-serif text-xl font-bold text-[#0A1A2F]">Deluxe Room</h3>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[#0A1A2F]">₦55,000</span>
                      <span className="text-xs text-slate-500 block">/ night</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Comfortable king bedroom with executive work desk, ergonomic chair, and city garden view.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-600 mb-6">
                    <li className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-[#C9A24B]" />
                      <span>Individual Climate Control (AC)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Tv className="w-4 h-4 text-[#C9A24B]" />
                      <span>50-inch 4K Smart TV with DStv</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-[#C9A24B]" />
                      <span>High-Speed Fiber Internet</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Complimentary Breakfast for 1</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => scrollToBooking('Deluxe Room')}
                  className="w-full py-3 rounded-xl bg-[#0A1A2F] text-white font-semibold text-xs uppercase tracking-wider hover:bg-[#C9A24B] hover:text-[#0A1A2F] transition-colors cursor-pointer"
                >
                  Book This Room
                </button>
              </div>
            </div>

            {/* Card 2: Executive Suite */}
            <div className="bg-white rounded-2xl border-2 border-[#C9A24B] shadow-md overflow-hidden flex flex-col relative hover:shadow-2xl transition-all duration-300">
              <div className="bg-[#C9A24B] text-[#0A1A2F] text-center py-1 text-xs font-bold uppercase tracking-wider">
                Most Popular Choice
              </div>
              <div className="relative h-60 overflow-hidden">
                <img
                  src={HOTEL_IMAGES.executiveSuite}
                  alt="Executive Suite"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 bg-[#0A1A2F]/90 backdrop-blur-xs text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Executive Class
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="font-serif text-xl font-bold text-[#0A1A2F]">Executive Suite</h3>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[#0A1A2F]">₦85,000</span>
                      <span className="text-xs text-slate-500 block">/ night</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Spacious one-bedroom suite with a dedicated lounge, dining nook, and walk-in rain shower.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-600 mb-6">
                    <li className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-[#C9A24B]" />
                      <span>Dual-Zone Whisper Quiet AC</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Tv className="w-4 h-4 text-[#C9A24B]" />
                      <span>Two 55-inch Smart TVs & Soundbar</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-[#C9A24B]" />
                      <span>Ultra Fiber WiFi & Nespresso Machine</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Gourmet Breakfast for 2 Guests</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => scrollToBooking('Executive Suite')}
                  className="w-full py-3 rounded-xl bg-[#C9A24B] text-[#0A1A2F] font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-md transition-all cursor-pointer"
                >
                  Book This Room
                </button>
              </div>
            </div>

            {/* Card 3: Presidential Suite */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300">
              <div className="relative h-60 overflow-hidden">
                <img
                  src={HOTEL_IMAGES.presidentialSuite}
                  alt="Presidential Suite"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 bg-[#0A1A2F]/90 backdrop-blur-xs text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Presidential Penthouse
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="font-serif text-xl font-bold text-[#0A1A2F]">Presidential Suite</h3>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[#0A1A2F]">₦150,000</span>
                      <span className="text-xs text-slate-500 block">/ night</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Grand multi-room penthouse with private boardroom, jacuzzi spa, and dedicated private butler service.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-600 mb-6">
                    <li className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-[#C9A24B]" />
                      <span>Central Ducted Smart HVAC</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Tv className="w-4 h-4 text-[#C9A24B]" />
                      <span>65-inch OLED Home Cinema Suite</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-[#C9A24B]" />
                      <span>Dedicated Secure VIP Broadband</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Airport Chauffeur & 24/7 Butler</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => scrollToBooking('Presidential Suite')}
                  className="w-full py-3 rounded-xl bg-[#0A1A2F] text-white font-semibold text-xs uppercase tracking-wider hover:bg-[#C9A24B] hover:text-[#0A1A2F] transition-colors cursor-pointer"
                >
                  Book This Room
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BOOKING FORM SECTION (Most Important) */}
      <section id="book-now" className="py-20 bg-gradient-to-b from-[#0A1A2F] to-[#06101E] text-white relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C9A24B]">
              Direct Reservations
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-1">
              Reserve Your 5-Star Stay
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              Best Rate Guaranteed • No Booking Fees • Instant Confirmation via Email
            </p>
          </div>

          <div className="bg-white text-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl border border-[#C9A24B]/40 relative">
            <form onSubmit={handleSubmitBooking} noValidate className="space-y-6">
              {/* Row 1: Guest Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                    }}
                    placeholder="e.g. Chidi Okonkwo"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#C9A24B] ${
                      errors.fullName ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    placeholder="e.g. chidi@example.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#C9A24B] ${
                      errors.email ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    placeholder="e.g. +234 803 000 0000"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#C9A24B] ${
                      errors.phone ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Room Type, Guests, and Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Room Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={roomType}
                    onChange={e => setRoomType(e.target.value as RoomType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
                  >
                    <option value="Deluxe Room">Deluxe Room (₦55,000)</option>
                    <option value="Executive Suite">Executive Suite (₦85,000)</option>
                    <option value="Presidential Suite">Presidential Suite (₦150,000)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Guests <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={guests}
                      onChange={e => setGuests(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
                    >
                      <option value={1}>1 Guest</option>
                      <option value={2}>2 Guests</option>
                      <option value={3}>3 Guests</option>
                      <option value={4}>4 Guests</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Check-in Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      min={todayStr}
                      value={checkIn}
                      onChange={e => {
                        setCheckIn(e.target.value);
                        if (errors.checkIn) setErrors(prev => ({ ...prev, checkIn: '' }));
                      }}
                      className={`w-full pl-9 pr-2 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#C9A24B] ${
                        errors.checkIn ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                      }`}
                    />
                  </div>
                  {errors.checkIn && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{errors.checkIn}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Check-out Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      min={checkIn || todayStr}
                      value={checkOut}
                      onChange={e => {
                        setCheckOut(e.target.value);
                        if (errors.checkOut) setErrors(prev => ({ ...prev, checkOut: '' }));
                      }}
                      className={`w-full pl-9 pr-2 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#C9A24B] ${
                        errors.checkOut ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                      }`}
                    />
                  </div>
                  {errors.checkOut && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{errors.checkOut}</p>
                  )}
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Special Requests (Airport pickup, high floor, feather pillows, dietary preferences)
                </label>
                <textarea
                  rows={2}
                  value={specialRequest}
                  onChange={e => setSpecialRequest(e.target.value)}
                  placeholder="e.g. Please arrange airport pickup at Omagwa Airport by 4 PM (Flight QA402). Extra king pillows requested."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
                />
              </div>

              {/* LIVE PRICING BREAKDOWN */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0A1A2F]/5 border border-[#C9A24B]/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                    Estimated Booking Total
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-600">
                      {nights} {nights === 1 ? 'night' : 'nights'} × ₦{nightlyRate.toLocaleString()}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-xs text-emerald-700 font-medium">Includes taxes & breakfast</span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <div className="text-3xl font-bold text-[#0A1A2F] tracking-tight font-serif">
                    ₦{totalAmount.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Draft ID: <code className="text-[#0A1A2F] font-mono">{draftBookingIdRef.current}</code>
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#B38C38] text-[#0A1A2F] font-bold text-sm tracking-widest uppercase hover:brightness-110 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Sparkles className="w-5 h-5 animate-spin" />
                      <span>Transmitting Reservation...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Confirm & Reserve My Suite</span>
                    </>
                  )}
                </button>
                <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Free cancellation up to 24h prior
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#C9A24B]" /> Pay at check-in or via secure transfer
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 5. GALLERY SECTION */}
      <section id="gallery" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C9A24B]">
              Visual Showcase
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0A1A2F] mt-2 mb-4">
              Explore Our Enclave
            </h2>
            <div className="w-16 h-1 bg-[#C9A24B] mx-auto mb-4" />
            <p className="text-slate-600 text-sm sm:text-base">
              Click any photograph to launch the interactive high-resolution gallery lightbox.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {GALLERY_ITEMS.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => {
                  setLightboxIndex(idx);
                  setLightboxOpen(true);
                }}
                className="group relative h-72 rounded-2xl overflow-hidden cursor-pointer shadow-xs hover:shadow-2xl transition-all duration-300"
              >
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A2F]/90 via-[#0A1A2F]/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[11px] font-semibold text-[#C9A24B] uppercase tracking-wider block mb-1">
                    {item.category}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-white group-hover:text-amber-200 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS SECTION (Nigerian guest reviews) */}
      <section id="testimonials" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C9A24B]">
              Verified Feedback
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0A1A2F] mt-2 mb-4">
              What Our Distinguished Guests Say
            </h2>
            <div className="w-16 h-1 bg-[#C9A24B] mx-auto mb-4" />
            <p className="text-slate-600 text-sm">
              Authentic reviews from corporate executives and holidaying families who chose Hotel De Port.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex text-[#C9A24B] gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#C9A24B]" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic mb-6">
                  &ldquo;As someone who frequently travels between Lagos and Port Harcourt for maritime deals, this hotel is a breath of fresh air. The 24/7 power never blinked once, and the executive suite desk was perfect for drafting contracts.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-[#0A1A2F] text-[#C9A24B] font-bold flex items-center justify-center font-serif text-sm">
                  CO
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0A1A2F]">Chidi O.</h4>
                  <span className="text-xs text-slate-500">Victoria Island, Lagos • Verified Stay</span>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex text-[#C9A24B] gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#C9A24B]" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic mb-6">
                  &ldquo;The security presence in GRA Phase 2 gives tremendous peace of mind. The seafood platter at The Niger Bistro is out of this world! My entire delegation commended the front desk for their warmth.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-[#0A1A2F] text-[#C9A24B] font-bold flex items-center justify-center font-serif text-sm">
                  AB
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0A1A2F]">Amina B.</h4>
                  <span className="text-xs text-slate-500">Maitama, Abuja • Verified Stay</span>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex text-[#C9A24B] gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#C9A24B]" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic mb-6">
                  &ldquo;Living in Port Harcourt, I hosted my sister’s wedding party here. The Presidential Suite was palatial and the poolside photography came out stunning. Proud to have this 5-star jewel right in our city!&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-[#0A1A2F] text-[#C9A24B] font-bold flex items-center justify-center font-serif text-sm">
                  TE
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0A1A2F]">Tonye E.</h4>
                  <span className="text-xs text-slate-500">Old GRA, Port Harcourt • Verified Stay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MOBILE STICKY BOTTOM BAR (Fast booking on mobile) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 p-3 bg-[#0A1A2F]/95 backdrop-blur-md border-t border-[#C9A24B]/30 flex items-center justify-between shadow-2xl">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-300 block">From</span>
          <span className="text-sm font-bold text-[#C9A24B]">₦55,000 / night</span>
        </div>
        <button
          onClick={() => scrollToBooking()}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#B38C38] text-[#0A1A2F] font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
        >
          <span>Book Now</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Lightbox Modal */}
      <LightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        items={GALLERY_ITEMS}
        currentIndex={lightboxIndex}
        onSelectIndex={setLightboxIndex}
      />

      {/* Booking Received Confirmation Modal */}
      {bookingSuccessModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border border-[#C9A24B]/30 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-[#C9A24B]">
              Reservation Confirmed
            </span>
            <h3 className="font-serif text-2xl font-bold text-[#0A1A2F] mt-1 mb-2">
              Booking Received!
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Check your email for confirmation. A booking voucher with check-in instructions and payment details has been dispatched.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Booking Reference:</span>
                <span className="font-mono font-bold text-[#0A1A2F]">{bookingSuccessModal.bookingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Suite Category:</span>
                <span className="font-semibold text-slate-800">{bookingSuccessModal.roomType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stay Duration:</span>
                <span className="font-semibold text-slate-800">{bookingSuccessModal.dates}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700">Total Amount:</span>
                <span className="font-bold text-[#0A1A2F] text-sm">₦{bookingSuccessModal.total?.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => setBookingSuccessModal({ open: false })}
              className="w-full py-3 rounded-xl bg-[#0A1A2F] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#C9A24B] hover:text-[#0A1A2F] transition-colors"
            >
              Done & Return To Website
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
