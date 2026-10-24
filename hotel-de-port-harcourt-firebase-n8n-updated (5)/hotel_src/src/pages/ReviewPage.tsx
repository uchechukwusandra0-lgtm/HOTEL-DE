// src/pages/ReviewPage.tsx
// Public guest review page: /review?booking=ID

import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Star, MessageSquare, ExternalLink, ShieldCheck, HeartHandshake, CheckCircle2, ArrowLeft } from 'lucide-react';
import { GOOGLE_REVIEW_URL, WEBHOOKS, postWebhook, HOTEL_INFO } from '../config.ts';
import { addReview } from '../services/data.ts';
import { useToast } from '../components/ui/Toast.tsx';

export const ReviewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const bookingIdParam = searchParams.get('booking') || '';
  const { error } = useToast();

  const [bookingId, setBookingId] = useState(bookingIdParam);
  const [guestName, setGuestName] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const starLabels: Record<number, string> = {
    1: 'Poor — Needs urgent improvement',
    2: 'Fair — Below luxury expectations',
    3: 'Average — Met basic requirements',
    4: 'Very Good — Wonderful stay',
    5: 'Exceptional — World-class 5-star experience'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      error('Please share a few words about your stay experience.');
      return;
    }

    setIsSubmitting(true);
    const submittedAt = new Date().toISOString();

    const payload = {
      bookingId: bookingId.trim() || undefined,
      rating,
      comment: comment.trim(),
      guestName: guestName.trim() || 'Valued Guest',
      submittedAt
    };

    try {
      // 1. Post webhook to n8n
      await postWebhook(WEBHOOKS.submitReview, payload);

      // 2. Save in data layer
      await addReview({
        bookingId: payload.bookingId,
        guestName: payload.guestName,
        rating: payload.rating,
        comment: payload.comment,
        source: 'Website'
      });

      setSubmitted(true);
    } catch (err: any) {
      console.warn('Webhook submit review fallback:', err);
      // Still store review locally so it displays in admin panel
      await addReview({
        bookingId: payload.bookingId,
        guestName: payload.guestName,
        rating: payload.rating,
        comment: payload.comment,
        source: 'Website'
      });
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1A2F] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full">
        {/* Back to Home Link */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-[#C9A24B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Hotel Website</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-[#C9A24B]/40 overflow-hidden relative">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#0A1A2F] text-[#C9A24B] flex items-center justify-center mx-auto mb-3 shadow-md">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-xs uppercase tracking-widest text-[#C9A24B] font-bold">
              Guest Experience Desk
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0A1A2F] mt-1">
              How was your stay?
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Your feedback shapes our pursuit of 5-star perfection in Port Harcourt.
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Optional Booking ID & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Booking Reference
                  </label>
                  <input
                    type="text"
                    value={bookingId}
                    onChange={e => setBookingId(e.target.value)}
                    placeholder="e.g. HDPH-20261024-1001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    placeholder="e.g. Chidi Okonkwo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
                  />
                </div>
              </div>

              {/* Star Rating Interactive */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-3">
                  Rate Your Overall Stay
                </span>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => {
                    const active = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-slate-300 hover:scale-115 transition-all focus:outline-none cursor-pointer"
                        aria-label={`Rate ${star} star`}
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            active ? 'fill-[#C9A24B] text-[#C9A24B]' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 text-xs font-semibold text-[#0A1A2F]">
                  {starLabels[hoverRating || rating]}
                </div>
              </div>

              {/* Comment Textarea */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Your Honest Review & Feedback <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Tell us about the room comfort, power supply, dining at The Niger Bistro, or staff service..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#B38C38] text-[#0A1A2F] font-bold text-sm tracking-widest uppercase hover:brightness-110 shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? 'Submitting Feedback...' : 'Send Review'}
              </button>
            </form>
          ) : (
            /* Post Submit Branch */
            <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-300">
              {rating >= 4 ? (
                /* Rating 4 or 5: Thank you + Gold button to Google Review */
                <div className="space-y-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#0A1A2F]">
                      Thank you for your generous review!
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                      We are thrilled you enjoyed your 5-star experience at Hotel De Port.
                      Would you mind sharing your compliments on our public Google Business profile? It takes less than 30 seconds!
                    </p>
                  </div>

                  <div className="pt-2">
                    <a
                      href={GOOGLE_REVIEW_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#B38C38] text-[#0A1A2F] font-bold text-sm tracking-wider uppercase hover:brightness-110 shadow-lg hover:shadow-xl transition-all"
                    >
                      <span>Share on Google</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Your feedback helps support local Nigerian hospitality.</span>
                  </div>
                </div>
              ) : (
                /* Rating 1 to 3: Manager direct contact, NO Google link */
                <div className="space-y-5">
                  <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <HeartHandshake className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#0A1A2F]">
                      Thank you for your feedback.
                    </h3>
                    <p className="text-sm font-medium text-amber-900 bg-amber-50 p-4 rounded-xl border border-amber-200 mt-3 leading-relaxed">
                      Our manager will contact you personally.
                    </p>
                    <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                      At Hotel De Port, 5-star standards are non-negotiable. Our management team is already reviewing your ticket to resolve any concerns.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-4">
                <Link
                  to="/"
                  className="text-xs font-semibold text-[#0A1A2F] hover:text-[#C9A24B] transition-colors"
                >
                  Return to Homepage
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
