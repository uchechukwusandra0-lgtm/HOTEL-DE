// src/data/demoData.ts
// Clean operational dataset for Hotel De Port (All admin mock records cleared to empty)

import {
  Booking,
  Payment,
  Enquiry,
  MaintenanceTicket,
  Review,
  AbandonedBooking,
  DailyReport
} from '../types.ts';

// Clean empty collections for Admin Panel
export const INITIAL_BOOKINGS: Booking[] = [];
export const INITIAL_PAYMENTS: Payment[] = [];
export const INITIAL_ENQUIRIES: Enquiry[] = [];
export const INITIAL_MAINTENANCE: MaintenanceTicket[] = [];
export const INITIAL_REVIEWS: Review[] = [];
export const INITIAL_ABANDONED: AbandonedBooking[] = [];
export const INITIAL_REPORTS: DailyReport[] = [];

// High-resolution photography assets for Hotel De Port public presentation
export const HOTEL_IMAGES = {
  heroPool: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=80',
  executiveSuite: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
  presidentialSuite: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
  deluxeRoom: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  reception: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  gym: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
  exterior: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80'
};
