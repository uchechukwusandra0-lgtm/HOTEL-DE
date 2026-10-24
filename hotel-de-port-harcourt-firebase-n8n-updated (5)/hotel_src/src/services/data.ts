// Firestore-backed data service for Hotel De Port Harcourt.
// No localStorage/demo-data fallback is used for operational records.

import { auth, db } from './firebase.ts';
import {
  addDoc, collection, doc, getDoc, getDocs, query, setDoc, updateDoc,
  where, orderBy, limit
} from 'firebase/firestore';
import type {
  Booking, Payment, Enquiry, MaintenanceTicket, Review, AbandonedBooking,
  DailyReport, BookingStatus, PaymentStatus, EnquiryStatus, MaintenanceStatus
} from '../types.ts';

const COL = {
  bookings: 'bookings',
  payments: 'hdph_payments',
  enquiries: 'hdph_enquiries',
  maintenance: 'hdph_maintenance',
  reviews: 'hdph_reviews',
  abandoned: 'hdph_abandoned',
  reports: 'hdph_reports'
} as const;

function clean<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_key, value) => value === undefined ? undefined : value));
}

async function findByField<T>(collectionName: string, field: string, value: string): Promise<{ id: string; data: T } | null> {
  const snap = await getDocs(query(collection(db, collectionName), where(field, '==', value), limit(1)));
  if (snap.empty) return null;
  const first = snap.docs[0];
  return { id: first.id, data: first.data() as T };
}

async function readAll<T>(collectionName: string, sortField?: string): Promise<T[]> {
  // Admin-only collections are protected by Firestore rules. If rules reject access,
  // surface the error rather than displaying fabricated/demo records.
  const ref = collection(db, collectionName);
  const snap = await getDocs(sortField ? query(ref, orderBy(sortField, 'desc')) : ref);
  return snap.docs.map(d => ({ ...d.data(), _documentId: d.id } as T));
}

// BOOKINGS
export async function getBookings(userId?: string): Promise<Booking[]> {
  const ref = collection(db, COL.bookings);
  const snap = userId
    ? await getDocs(query(ref, where('userId', '==', userId)))
    : await getDocs(ref); // Admin screen; Firestore rules must verify admin privileges.
  return snap.docs.map(d => ({ ...d.data(), _documentId: d.id } as Booking));
}

export async function addBooking(
  bookingData: Omit<Booking, 'status' | 'paymentStatus'> & { status?: BookingStatus; paymentStatus?: PaymentStatus }
): Promise<Booking> {
  const currentUid = auth.currentUser?.uid;
  const bookingId = bookingData.bookingId;
  if (!bookingId || !/^[a-zA-Z0-9_-]{1,128}$/.test(bookingId)) throw new Error('Invalid booking reference.');
  const { status: _ignoredStatus, paymentStatus: _ignoredPayment, ...details } = bookingData;
  const newBooking: Booking = clean({
    ...details,
    ...(currentUid ? { userId: currentUid } : {}),
    status: 'Pending',
    paymentStatus: 'Pending',
    createdAt: bookingData.createdAt || new Date().toISOString()
  } as Booking);
  await setDoc(doc(db, COL.bookings, bookingId), newBooking);
  return newBooking;
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<Booking> {
  const directRef = doc(db, COL.bookings, bookingId);
  const directSnap = await getDoc(directRef);
  const target = directSnap.exists()
    ? { id: directSnap.id, data: directSnap.data() as Booking }
    : await findByField<Booking>(COL.bookings, 'bookingId', bookingId);
  if (!target) throw new Error(`Booking ${bookingId} not found.`);
  await updateDoc(doc(db, COL.bookings, target.id), { status, updatedAt: new Date().toISOString() });
  return { ...target.data, status };
}

// PAYMENTS. A successful payment must be verified by Paystack/n8n or trusted server code.
export async function getPayments(): Promise<Payment[]> {
  return readAll<Payment>(COL.payments, 'date');
}

export async function updatePayment(invoiceNumber: string, status: PaymentStatus): Promise<Payment> {
  const found = await findByField<Payment>(COL.payments, 'invoiceNumber', invoiceNumber);
  if (!found) throw new Error(`Invoice ${invoiceNumber} not found.`);
  // Client-side manual changes are for admin bookkeeping only; never use this as proof of payment.
  const update: Record<string, unknown> = { status };
  if (status === 'Paid') update.paidAt = new Date().toISOString();
  await updateDoc(doc(db, COL.payments, found.id), update);
  return { ...found.data, ...update } as Payment;
}

// ENQUIRIES
export async function getEnquiries(): Promise<Enquiry[]> {
  return readAll<Enquiry>(COL.enquiries, 'timestamp');
}

export async function updateEnquiry(enquiryId: string, status: EnquiryStatus): Promise<Enquiry> {
  const found = await findByField<Enquiry>(COL.enquiries, 'enquiryId', enquiryId);
  if (!found) throw new Error(`Enquiry ${enquiryId} not found.`);
  const update: Record<string, unknown> = { status };
  if (status === 'Escalated') update.escalatedAt = new Date().toISOString();
  await updateDoc(doc(db, COL.enquiries, found.id), update);
  return { ...found.data, ...update } as Enquiry;
}

export async function addEnquiry(input: Omit<Enquiry, 'enquiryId' | 'timestamp'>): Promise<Enquiry> {
  const enquiry: Enquiry = { ...input, enquiryId: `ENQ-${Date.now()}`, timestamp: new Date().toISOString() };
  await addDoc(collection(db, COL.enquiries), clean(enquiry));
  return enquiry;
}

// MAINTENANCE
export async function getMaintenance(): Promise<MaintenanceTicket[]> {
  return readAll<MaintenanceTicket>(COL.maintenance, 'reportedAt');
}

export async function addMaintenance(input: Omit<MaintenanceTicket, 'ticketId' | 'status' | 'reportedAt'>): Promise<MaintenanceTicket> {
  const ticket: MaintenanceTicket = {
    ...input, ticketId: `MNT-${Date.now()}`, status: 'Open', reportedAt: new Date().toISOString()
  };
  await addDoc(collection(db, COL.maintenance), clean(ticket));
  return ticket;
}

export async function updateMaintenance(ticketId: string, status: MaintenanceStatus): Promise<MaintenanceTicket> {
  const found = await findByField<MaintenanceTicket>(COL.maintenance, 'ticketId', ticketId);
  if (!found) throw new Error(`Maintenance ticket ${ticketId} not found.`);
  const update: Record<string, unknown> = { status };
  if (status === 'Done') update.completedAt = new Date().toISOString();
  await updateDoc(doc(db, COL.maintenance, found.id), update);
  return { ...found.data, ...update } as MaintenanceTicket;
}

// REVIEWS
export async function getReviews(): Promise<Review[]> {
  return readAll<Review>(COL.reviews, 'submittedAt');
}

export async function addReview(input: Omit<Review, 'reviewId' | 'submittedAt' | 'date'>): Promise<Review> {
  const review: Review = {
    ...input, reviewId: `REV-${Date.now()}`, date: new Date().toISOString().slice(0, 10), submittedAt: new Date().toISOString()
  };
  await addDoc(collection(db, COL.reviews), clean(review));
  return review;
}

// ABANDONED BOOKINGS. The browser may create a lead, but only trusted n8n/server
// code should send recovery messages or mark a booking recovered after confirmation.
export async function getAbandoned(): Promise<AbandonedBooking[]> {
  return readAll<AbandonedBooking>(COL.abandoned, 'startedAt');
}

export async function addAbandoned(
  input: Omit<AbandonedBooking, 'id' | 'status' | 'remindersSent' | 'lastActivity'>
): Promise<AbandonedBooking> {
  // Use a generated Firestore document ID so this public create path does not
  // need permission to query/read private abandoned-lead records.
  const ref = doc(collection(db, COL.abandoned));
  const entry: AbandonedBooking = {
    ...input, id: ref.id, status: 'Pending', remindersSent: 0, lastActivity: new Date().toISOString()
  };
  await setDoc(ref, clean(entry));
  return entry;
}

export async function updateAbandoned(
  id: string, status: 'Pending' | 'Recovered' | 'Lost', incrementReminder = false
): Promise<AbandonedBooking> {
  const ref = doc(db, COL.abandoned, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const found = await findByField<AbandonedBooking>(COL.abandoned, 'id', id);
    if (!found) throw new Error(`Abandoned booking ${id} not found.`);
    const remindersSent = (found.data.remindersSent || 0) + (incrementReminder ? 1 : 0);
    const update = { status, remindersSent, lastActivity: incrementReminder ? new Date().toISOString() : found.data.lastActivity };
    await updateDoc(doc(db, COL.abandoned, found.id), update);
    return { ...found.data, ...update };
  }
  const current = snap.data() as AbandonedBooking;
  const update = {
    status,
    remindersSent: (current.remindersSent || 0) + (incrementReminder ? 1 : 0),
    lastActivity: incrementReminder ? new Date().toISOString() : current.lastActivity
  };
  await updateDoc(ref, update);
  return { ...current, ...update };
}

// DAILY REPORTS: generate from live Firestore data, then persist the snapshot.
export async function getDailyReports(): Promise<DailyReport[]> {
  return readAll<DailyReport>(COL.reports, 'sentAt');
}

export async function triggerDailyReport(_requestedBy = 'Staff Admin'): Promise<DailyReport> {
  const [bookings, payments, enquiries, maintenance] = await Promise.all([
    getBookings(), getPayments(), getEnquiries(), getMaintenance()
  ]);
  const pendingPayments = payments.filter(p => p.status === 'Pending' || p.status === 'Unconfirmed');
  const openMaintenance = maintenance.filter(m => m.status === 'Open' || m.status === 'In Progress');
  const report: DailyReport = {
    date: new Date().toISOString().slice(0, 10),
    bookingsCount: bookings.length,
    revenue: payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0),
    pendingPaymentsCount: pendingPayments.length,
    pendingPaymentsAmount: pendingPayments.reduce((sum, p) => sum + p.amount, 0),
    enquiriesCount: enquiries.length,
    openMaintenanceCount: openMaintenance.length,
    sentChannels: [],
    sentAt: new Date().toISOString()
  };
  await addDoc(collection(db, COL.reports), clean(report));
  return report;
}

// Demo reset intentionally does not delete real Firestore records.
export function resetDemoData(): void {
  console.info('Demo reset disabled: operational Firestore records are retained.');
}
export const clearAllRecords = resetDemoData;
