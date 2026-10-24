// src/types.ts
// Comprehensive TypeScript definitions for Hotel De Port Harcourt

export type RoomType = 'Deluxe Room' | 'Executive Suite' | 'Presidential Suite';

export type BookingStatus = 'Pending' | 'Confirmed' | 'Checked-in' | 'Checked-out' | 'Cancelled';

export interface Booking {
  bookingId: string;
  fullName: string;
  email: string;
  phone: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  roomType: RoomType;
  roomNumber?: string;
  guests: number;
  specialRequest?: string;
  nights: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: 'Paid' | 'Pending' | 'Unconfirmed';
  createdAt: string;
  userId?: string;
}

export type PaymentMethod = 'Bank Transfer' | 'Card' | 'Cash' | 'POS';
export type PaymentStatus = 'Paid' | 'Pending' | 'Unconfirmed';

export interface Payment {
  invoiceNumber: string;
  bookingId: string;
  guestName: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt?: string;
  date: string;
}

export type EnquiryChannel = 'WhatsApp' | 'Website';
export type EnquiryStatus = 'Answered by bot' | 'Escalated';

export interface Enquiry {
  enquiryId: string;
  guestName: string;
  contact: string;
  channel: EnquiryChannel;
  question: string;
  botAnswer: string;
  status: EnquiryStatus;
  timestamp: string;
  escalatedAt?: string;
}

export type MaintenancePriority = 'High' | 'Medium' | 'Low';
export type MaintenanceStatus = 'Open' | 'In Progress' | 'Done';
export type MaintenanceIssueType = 'AC not working' | 'Plumbing' | 'Broken TV' | 'Electrical' | 'Cleaning' | 'Other';

export interface MaintenanceTicket {
  ticketId: string;
  room: string;
  issueType: MaintenanceIssueType;
  priority: MaintenancePriority;
  description: string;
  reportedBy: 'guest' | 'staff';
  assignedTo?: string;
  status: MaintenanceStatus;
  reportedAt: string;
  completedAt?: string;
}

export interface Review {
  reviewId: string;
  bookingId?: string;
  guestName: string;
  rating: number; // 1 to 5
  comment: string;
  source: 'Website' | 'Google';
  date: string;
  submittedAt: string;
}

export type AbandonedStatus = 'Pending' | 'Recovered' | 'Lost';

export interface AbandonedBooking {
  id: string;
  bookingId: string;
  fullName: string;
  email: string;
  phone: string;
  roomType: RoomType;
  totalAmount: number;
  startedAt: string;
  lastActivity: string; // ISO date
  status: AbandonedStatus;
  remindersSent: number;
}

export interface DailyReport {
  date: string; // YYYY-MM-DD
  bookingsCount: number;
  revenue: number;
  pendingPaymentsCount: number;
  pendingPaymentsAmount: number;
  enquiriesCount: number;
  openMaintenanceCount: number;
  sentChannels: string[]; // e.g. ["Email", "WhatsApp"]
  sentAt?: string;
}

export interface AdminUser {
  email: string;
  name: string;
  role: string;
  token?: string;
}
