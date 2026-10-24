// src/pages/admin/N8nSettingsTab.tsx
// Management panel to input and configure n8n Webhook URLs directly from the UI

import React, { useState, useEffect } from 'react';
import {
  Webhook,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Send,
  Sparkles,
  Link2,
  Key,
  Layers,
  ChevronDown,
  ChevronUp,
  Globe
} from 'lucide-react';
import {
  getN8nBase,
  getCustomEndpoints,
  saveN8nSettings,
  resetN8nSettings,
  DEFAULT_N8N_BASE,
  WEBHOOKS,
  postWebhook
} from '../../config.ts';
import { useToast } from '../../components/ui/Toast.tsx';

interface EndpointConfig {
  key: string;
  name: string;
  defaultPath: string;
  description: string;
  samplePayload: any;
  category: 'Website Public' | 'Admin Reads' | 'Admin Actions';
}

const ENDPOINTS_DEF: EndpointConfig[] = [
  // Public
  {
    key: 'createBooking',
    name: 'Create Booking',
    defaultPath: 'create-booking',
    description: 'Fired when a guest reserves a suite on the public website.',
    samplePayload: {
      bookingId: 'HDPH-TEST-001',
      fullName: 'Sandra Uchechukwu',
      email: 'uchechukwusandra0@gmail.com',
      phone: '+234 800 000 0000',
      roomType: 'Executive Suite',
      nights: 2,
      totalAmount: 170000
    },
    category: 'Website Public'
  },
  {
    key: 'trackAbandoned',
    name: 'Track Abandoned Lead',
    defaultPath: 'track-abandoned',
    description: 'Debounced trigger when guest fills email & phone but departs form.',
    samplePayload: {
      bookingId: 'HDPH-TEST-ABN',
      fullName: 'Adaeze Nwosu',
      email: 'adaeze@example.com',
      phone: '+234 803 555 7711',
      roomType: 'Deluxe Room',
      totalAmount: 55000
    },
    category: 'Website Public'
  },
  {
    key: 'submitReview',
    name: 'Submit Guest Review',
    defaultPath: 'submit-review',
    description: 'Dispatches 1-5 star reviews from /review?booking=ID.',
    samplePayload: {
      bookingId: 'HDPH-20261024-1001',
      rating: 5,
      comment: 'Top tier luxury and uninterrupted electricity.',
      submittedAt: new Date().toISOString()
    },
    category: 'Website Public'
  },
  {
    key: 'createMaintenance',
    name: 'Report Maintenance Ticket',
    defaultPath: 'create-maintenance',
    description: 'From in-room QR code scan on /report?room=203 or Staff Admin.',
    samplePayload: {
      room: '203',
      issueType: 'AC not working',
      priority: 'High',
      description: 'Test compressor check',
      reportedBy: 'guest'
    },
    category: 'Website Public'
  },
  {
    key: 'chatbotQuery',
    name: 'Chatbot Concierge Query',
    defaultPath: 'chatbot-query',
    description: 'Queries sent through the floating concierge chat panel.',
    samplePayload: {
      sessionId: 'SES-TEST-1234',
      message: 'What are the check-in hours?'
    },
    category: 'Website Public'
  },

  // Admin Reads
  {
    key: 'getBookings',
    name: 'Fetch Bookings',
    defaultPath: 'get-bookings',
    description: 'Syncs live reservations into the Staff Bookings registry.',
    samplePayload: {},
    category: 'Admin Reads'
  },
  {
    key: 'getPayments',
    name: 'Fetch Payments',
    defaultPath: 'get-payments',
    description: 'Retrieves payment invoices and settlement confirmations.',
    samplePayload: {},
    category: 'Admin Reads'
  },
  {
    key: 'getEnquiries',
    name: 'Fetch Enquiries',
    defaultPath: 'get-enquiries',
    description: 'Reads WhatsApp and website chatbot transcripts.',
    samplePayload: {},
    category: 'Admin Reads'
  },
  {
    key: 'getMaintenance',
    name: 'Fetch Maintenance',
    defaultPath: 'get-maintenance',
    description: 'Loads room tickets, work orders, and repairs.',
    samplePayload: {},
    category: 'Admin Reads'
  },
  {
    key: 'getReviews',
    name: 'Fetch Reviews',
    defaultPath: 'get-reviews',
    description: 'Pulls ratings from hotel portal and Google Business.',
    samplePayload: {},
    category: 'Admin Reads'
  },
  {
    key: 'getAbandoned',
    name: 'Fetch Abandoned Bookings',
    defaultPath: 'get-abandoned',
    description: 'Reads unfinished reservation funnel records.',
    samplePayload: {},
    category: 'Admin Reads'
  },

  // Admin Actions
  {
    key: 'updateBookingStatus',
    name: 'Update Booking Status',
    defaultPath: 'update-booking-status',
    description: 'Check-in or Check-out (Check-out notifies housekeeping).',
    samplePayload: {
      bookingId: 'HDPH-20261024-1001',
      status: 'checked_out',
      guestName: 'Chidi Okonkwo',
      roomNumber: '305',
      timestamp: new Date().toISOString()
    },
    category: 'Admin Actions'
  },
  {
    key: 'updatePayment',
    name: 'Update Payment Status',
    defaultPath: 'update-payment',
    description: 'Marks pending/unconfirmed invoice as paid.',
    samplePayload: {
      invoiceNumber: 'INV-2026-881',
      status: 'paid',
      paidAt: new Date().toISOString()
    },
    category: 'Admin Actions'
  },
  {
    key: 'escalateToStaff',
    name: 'Escalate Enquiry',
    defaultPath: 'escalate-to-staff',
    description: 'Hands off AI conversation to human general manager.',
    samplePayload: {
      enquiryId: 'ENQ-401',
      guestName: 'Dr. Osas Ighodaro',
      question: 'Diplomatic delegation inquiry'
    },
    category: 'Admin Actions'
  },
  {
    key: 'updateMaintenance',
    name: 'Update Maintenance',
    defaultPath: 'update-maintenance',
    description: 'Marks room ticket as done.',
    samplePayload: {
      ticketId: 'MNT-203-01',
      status: 'done',
      completedAt: new Date().toISOString()
    },
    category: 'Admin Actions'
  },
  {
    key: 'sendReviewRequest',
    name: 'Send Review Request',
    defaultPath: 'send-review-request',
    description: 'Dispatches guest survey invitation link.',
    samplePayload: {
      bookingId: 'HDPH-20261024-1005',
      guestEmail: 'ngozi.eze@phcllinic.org'
    },
    category: 'Admin Actions'
  },
  {
    key: 'recoverAbandoned',
    name: 'Send Abandoned Recovery',
    defaultPath: 'recover-abandoned',
    description: 'Sends email/WhatsApp re-engagement reminder.',
    samplePayload: {
      guestEmail: 'adaeze.nwosu@gmail.com',
      roomType: 'Deluxe Room',
      guestName: 'Adaeze Nwosu',
      amount: 55000
    },
    category: 'Admin Actions'
  },
  {
    key: 'triggerSummary',
    name: 'Trigger Daily Summary',
    defaultPath: 'send-daily-summary',
    description: 'Dispatches executive daily summary to General Manager.',
    samplePayload: {
      requestedAt: new Date().toISOString(),
      requestedBy: 'Tonye Briggs'
    },
    category: 'Admin Actions'
  }
];

export const N8nSettingsTab: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState('');
  const [customEndpoints, setCustomEndpoints] = useState<Record<string, string>>({});
  const [expandedEndpoints, setExpandedEndpoints] = useState(false);
  const [testResult, setTestResult] = useState<{
    endpoint: string;
    status: 'idle' | 'loading' | 'success' | 'fallback' | 'error';
    latencyMs?: number;
    message?: string;
  }>({ endpoint: '', status: 'idle' });

  const { success, error, info } = useToast();

  useEffect(() => {
    setBaseUrl(getN8nBase());
    setCustomEndpoints(getCustomEndpoints());
  }, []);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!baseUrl.trim()) {
      error('n8n Base URL cannot be empty');
      return;
    }

    saveN8nSettings(baseUrl, undefined, customEndpoints);
    success('n8n webhook configuration saved! All workflows will now route to your URL.');
  };

  const handleReset = () => {
    if (window.confirm('Reset n8n URLs back to default configuration?')) {
      resetN8nSettings();
      setBaseUrl(DEFAULT_N8N_BASE);
      setCustomEndpoints({});
      success('n8n settings reset to default.');
    }
  };

  const handleCustomEndpointChange = (key: string, val: string) => {
    setCustomEndpoints(prev => {
      const next = { ...prev };
      if (!val.trim()) {
        delete next[key];
      } else {
        next[key] = val.trim();
      }
      return next;
    });
  };

  const handleTestConnection = async (endpointKey: string = 'chatbotQuery') => {
    const targetUrl = WEBHOOKS[endpointKey];
    setTestResult({ endpoint: endpointKey, status: 'loading' });

    const startTime = performance.now();
    try {
      const def = ENDPOINTS_DEF.find(e => e.key === endpointKey);
      const payload = def?.samplePayload || { test: true, timestamp: new Date().toISOString() };
      
      const response = await postWebhook(targetUrl, payload);
      const elapsed = Math.round(performance.now() - startTime);

      if (response && response.simulated) {
        setTestResult({
          endpoint: endpointKey,
          status: 'fallback',
          latencyMs: elapsed,
          message: 'Endpoint simulated via local fallback (URL did not reply or is not yet live in n8n).'
        });
        info('Endpoint reached via internal simulation fallback.');
      } else {
        setTestResult({
          endpoint: endpointKey,
          status: 'success',
          latencyMs: elapsed,
          message: 'Connection verified! n8n workflow responded with 200 OK.'
        });
        success(`Success! n8n replied in ${elapsed}ms.`);
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - startTime);
      setTestResult({
        endpoint: endpointKey,
        status: 'error',
        latencyMs: elapsed,
        message: err.message || 'Network request failed'
      });
      error(`Failed to reach ${targetUrl}: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    success(`Copied ${label} to clipboard!`);
  };

  const isCustomConfigActive = Boolean(localStorage.getItem('hdph_n8n_base'));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C9A24B]/15 text-[#0A1A2F] text-[11px] font-bold uppercase tracking-wider mb-1">
            <Webhook className="w-3.5 h-3.5 text-[#C9A24B]" />
            <span>Workflow Automation Hub</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0A1A2F]">
            n8n Webhook URLs & Integration Settings
          </h2>
          <p className="text-xs text-slate-500">
            Directly connect your live n8n instance or custom webhook endpoints to power hotel automations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#B38C38] text-[#0A1A2F] text-xs font-bold uppercase tracking-wider hover:brightness-110 flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* Global Configuration Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#0A1A2F] flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#C9A24B]" />
              <span>Primary n8n Webhook Gateway</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your n8n server address. All standard endpoints below will automatically inherit this base URL.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                isCustomConfigActive
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {isCustomConfigActive ? 'Custom User URL Active' : 'Default Preset Active'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Base URL Input (8 cols) */}
          <div className="md:col-span-12">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              n8n Webhook Base URL <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="url"
                required
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder="https://your-n8n-instance.com/webhook"
                className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs sm:text-sm text-[#0A1A2F] focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Example: <code className="text-slate-600">https://automation.yourdomain.com/webhook</code> (trailing slashes automatically trimmed)
            </p>
          </div>

        </form>

        {/* Quick Test Connection Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleTestConnection('chatbotQuery')}
              disabled={testResult.status === 'loading'}
              className="px-4 py-2.5 rounded-xl bg-[#0A1A2F] text-[#C9A24B] hover:brightness-125 text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testResult.status === 'loading' ? 'Pinging Webhook...' : 'Test Connection Ping'}</span>
            </button>

            {testResult.status === 'success' && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                Live Response ({testResult.latencyMs}ms)
              </span>
            )}

            {testResult.status === 'fallback' && (
              <span className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                <Sparkles className="w-4 h-4 text-[#C9A24B]" />
                Fallback Simulator Active
              </span>
            )}

            {testResult.status === 'error' && (
              <span className="flex items-center gap-1.5 text-xs text-rose-700 font-semibold bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                <AlertCircle className="w-4 h-4" />
                Request Error
              </span>
            )}
          </div>

          <div className="text-xs text-slate-500">
            Testing target: <code className="font-mono text-[#0A1A2F]">{WEBHOOKS.chatbotQuery}</code>
          </div>
        </div>
      </div>

      {/* Granular Individual Webhook Endpoints Accordion */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div
          onClick={() => setExpandedEndpoints(!expandedEndpoints)}
          className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A1A2F] text-[#C9A24B] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#0A1A2F]">
                Granular Webhook Endpoints & Custom Overrides ({ENDPOINTS_DEF.length})
              </h3>
              <p className="text-xs text-slate-500">
                Configure unique webhook URLs for individual n8n workflows or inspect payloads.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>{expandedEndpoints ? 'Hide Endpoints' : 'Customize Endpoints'}</span>
            {expandedEndpoints ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {expandedEndpoints && (
          <div className="p-5 sm:p-6 space-y-6 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong>Tip:</strong> By default, each endpoint appends its standard path to your base URL above (e.g. <code>{baseUrl}/create-booking</code>). If your n8n workflows use unique generated webhook IDs (such as <code>https://n8n.site/webhook/uuid-1234...</code>), enter the full URL into the override input for that specific action.
            </div>

            {/* Grouped Tables */}
            {(['Website Public', 'Admin Actions', 'Admin Reads'] as const).map(category => {
              const list = ENDPOINTS_DEF.filter(e => e.category === category);
              return (
                <div key={category} className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9A24B] font-serif border-b border-slate-100 pb-1">
                    {category} Triggers
                  </h4>

                  <div className="grid grid-cols-1 gap-3">
                    {list.map(endpoint => {
                      const activeUrl = customEndpoints[endpoint.key] || `${baseUrl}/${endpoint.defaultPath}`;
                      const hasCustomOverride = Boolean(customEndpoints[endpoint.key]);

                      return (
                        <div
                          key={endpoint.key}
                          className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 hover:border-[#C9A24B]/50 transition-colors space-y-2.5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs sm:text-sm text-[#0A1A2F]">
                                  {endpoint.name}
                                </span>
                                <code className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                                  {endpoint.key}
                                </code>
                                {hasCustomOverride && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                                    Custom URL
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {endpoint.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(activeUrl, endpoint.name)}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-medium flex items-center gap-1 transition-colors"
                                title="Copy endpoint URL"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy URL</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTestConnection(endpoint.key)}
                                className="px-2.5 py-1 rounded-lg bg-[#0A1A2F] text-[#C9A24B] hover:brightness-125 text-xs font-semibold flex items-center gap-1 transition-colors"
                              >
                                <Send className="w-3 h-3" />
                                <span>Test</span>
                              </button>
                            </div>
                          </div>

                          {/* URL Override input */}
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={customEndpoints[endpoint.key] || ''}
                              onChange={e => handleCustomEndpointChange(endpoint.key, e.target.value)}
                              placeholder={`Default: ${baseUrl}/${endpoint.defaultPath}`}
                              className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono transition-all focus:outline-none focus:ring-2 focus:ring-[#C9A24B] ${
                                hasCustomOverride
                                  ? 'border-[#C9A24B] bg-white text-[#0A1A2F] font-bold'
                                  : 'border-slate-200 bg-white/70 text-slate-600'
                              }`}
                            />
                            {hasCustomOverride && (
                              <button
                                type="button"
                                onClick={() => handleCustomEndpointChange(endpoint.key, '')}
                                className="text-xs text-slate-400 hover:text-rose-600 px-2 py-1 shrink-0"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => handleSave()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#B38C38] text-[#0A1A2F] text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save All Overrides</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
