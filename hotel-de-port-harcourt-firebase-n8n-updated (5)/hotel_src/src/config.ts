// src/config.ts
// Configuration for Hotel De Port Harcourt webhooks and integrations

export const DEFAULT_N8N_BASE = import.meta.env.VITE_N8N_BASE || '';
// Do not put shared webhook secrets in browser code. Authenticate webhooks server-side.

export const STORAGE_KEYS = {
  N8N_BASE: 'hdph_n8n_base',
  CUSTOM_ENDPOINTS: 'hdph_n8n_custom_endpoints'
};

export function getN8nBase(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.N8N_BASE);
    if (saved && saved.trim()) return saved.trim().replace(/\/+$/, '');
  } catch {}
  return DEFAULT_N8N_BASE.replace(/\/+$/, '');
}

export function getCustomEndpoints(): Record<string, string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_ENDPOINTS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
}

export function saveN8nSettings(base: string, _secret?: string, customEndpoints?: Record<string, string>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.N8N_BASE, base.trim());
    localStorage.removeItem('hdph_webhook_secret');
    if (customEndpoints) {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_ENDPOINTS, JSON.stringify(customEndpoints));
    }
  } catch (e) {
    console.error('Failed to save n8n settings to localStorage:', e);
  }
}

export function resetN8nSettings(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.N8N_BASE);
    localStorage.removeItem('hdph_webhook_secret');
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_ENDPOINTS);
  } catch (e) {
    console.error('Failed to reset n8n settings:', e);
  }
}

// Hyphenated route mapping for default n8n path structure
const PATH_MAP: Record<string, string> = {
  createBooking: 'create-booking',
  trackAbandoned: 'track-abandoned',
  submitReview: 'submit-review',
  createMaintenance: 'create-maintenance',
  chatbotQuery: 'chatbot-query',
  updateBookingStatus: 'update-booking-status',
  updatePayment: 'update-payment',
  escalateToStaff: 'escalate-to-staff',
  updateMaintenance: 'update-maintenance',
  sendReviewRequest: 'send-review-request',
  recoverAbandoned: 'recover-abandoned',
  triggerSummary: 'send-daily-summary',
};

/**
 * Dynamic WEBHOOKS proxy that dynamically retrieves active n8n base URL
 * or individual endpoint overrides entered from the Staff Admin Panel.
 */
export const WEBHOOKS: Record<string, string> = new Proxy({} as Record<string, string>, {
  get(_target, prop: string) {
    const custom = getCustomEndpoints();
    if (custom && custom[prop]) {
      return custom[prop];
    }
    const base = getN8nBase();
    const path = PATH_MAP[prop] || prop;
    return `${base}/${path}`;
  }
});

export const GOOGLE_REVIEW_URL = 'https://g.page/r/hoteldeportharcourt-gra2/review';

export const DEMO_ADMIN_CREDENTIALS = {
  email: 'uchechukwusandra0@gmail.com',
  name: 'Sandra Uchechukwu',
  role: 'General Manager'
};

export const HOTEL_INFO = {
  name: 'Hotel De Port',
  stars: 5,
  tagline: 'Luxury Stay in the Heart of Port Harcourt',
  address: 'Plot 14, Birabi Street, GRA Phase 2, Port Harcourt, Rivers State, Nigeria',
  phone: '+234 800 000 0000',
  phoneAlt: '+234 84 461 2300',
  email: 'uchechukwusandra0@gmail.com',
  maintenanceEmail: 'engineering@hoteldeportharcourt.com',
  checkInTime: '2:00 PM (14:00 WAT)',
  checkOutTime: '11:00 AM (11:00 WAT)',
  currency: '₦'
};

export const ROOM_RATES: Record<string, number> = {
  'Deluxe Room': 55000,
  'Executive Suite': 85000,
  'Presidential Suite': 150000
};

/**
 * Universal webhook dispatcher for n8n workflows.
 * Executes POST request with JSON payload. Shared secrets must never be stored in browser code.
 * Throws error on non-2xx response.
 */
export async function postWebhook<T = any>(url: string, payload: any): Promise<T> {
  if (!url || !/^https:\/\//i.test(url)) {
    throw new Error('n8n is not configured. Add the real HTTPS webhook URL in the admin integration settings.');
  }
  if (url.includes('demo-n8n.hoteldeportharcourt.com')) {
    throw new Error('The demo webhook URL is a placeholder. Configure your real n8n webhook URL first.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`n8n webhook failed with HTTP ${response.status}.`);
    }
    const text = await response.text();
    if (!text) return { success: true } as T;
    try { return JSON.parse(text) as T; }
    catch { return { success: true, message: text } as T; }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new Error('The n8n webhook timed out.');
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
