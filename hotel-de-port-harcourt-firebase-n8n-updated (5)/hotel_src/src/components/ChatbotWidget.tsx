// src/components/ChatbotWidget.tsx
// Floating luxury concierge assistant widget

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';
import { WEBHOOKS, postWebhook } from '../config.ts';
import { addEnquiry } from '../services/data.ts';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  escalated?: boolean;
}

const QUICK_CHIPS = [
  'Room rates',
  'Check-in time',
  'Location',
  'Facilities',
  'Airport pickup'
];

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or retrieve sessionId
  const sessionIdRef = useRef<string>('');
  useEffect(() => {
    let sid = localStorage.getItem('hdph_chat_session_id');
    if (!sid) {
      sid = `SES-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem('hdph_chat_session_id', sid);
    }
    sessionIdRef.current = sid;

    // Welcome message
    setMessages([
      {
        id: 'msg-welcome',
        sender: 'bot',
        text: 'Welcome to Hotel De Port! I am your 24/7 digital concierge. How may I assist your stay in GRA Phase 2 today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await postWebhook<{ reply: string; escalated?: boolean }>(
        WEBHOOKS.chatbotQuery,
        {
          sessionId: sessionIdRef.current,
          message: text
        }
      );

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.reply || 'Thank you for reaching out. A guest relations officer has been notified.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        escalated: response.escalated
      };

      setMessages(prev => [...prev, botMsg]);

      // Record in local enquiries data layer
      await addEnquiry({
        guestName: 'Website Guest',
        contact: `Session ${sessionIdRef.current.slice(-5)}`,
        channel: 'Website',
        question: text,
        botAnswer: response.reply,
        status: response.escalated ? 'Escalated' : 'Answered by bot'
      });
    } catch (err: any) {
      console.error('Chatbot query failed:', err);
      // Friendly fallback
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: "We have received your enquiry. Our front desk manager is ready to assist you. You may also call us directly at +234 800 000 0000.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        escalated: true
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button (positioned above sticky mobile bar) */}
      <div className="fixed bottom-20 sm:bottom-6 right-5 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-4 py-3.5 rounded-full bg-gradient-to-r from-[#C9A24B] to-[#B38C38] text-[#0A1A2F] font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-[#C9A24B]/40 group"
            aria-label="Open luxury concierge chat"
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5 fill-[#0A1A2F]" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute -top-1 -right-1" />
            </div>
            <span className="text-xs tracking-wider uppercase hidden sm:inline font-semibold">
              Concierge Desk
            </span>
          </button>
        )}
      </div>

      {/* Floating Chat Drawer/Panel */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-96 max-h-[580px] h-[82vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 bg-[#0A1A2F] text-white flex items-center justify-between border-b border-[#C9A24B]/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#C9A24B] flex items-center justify-center text-[#0A1A2F] shadow-md">
                <Bot className="w-5 h-5 text-[#0A1A2F]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-serif font-bold text-sm tracking-wide">
                    Digital Concierge
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-300">
                  Hotel De Port • Live Assistance
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close concierge chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50 text-xs">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-[#0A1A2F] flex items-center justify-center text-[#C9A24B] shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-3 shadow-xs leading-relaxed whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-[#0A1A2F] text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.escalated && (
                    <div className="mt-2.5 pt-2 border-t border-amber-200/60 text-amber-800 bg-amber-50/80 p-2 rounded-lg flex items-start gap-1.5 font-medium text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
                      <span>A member of our team will contact you shortly.</span>
                    </div>
                  )}
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      msg.sender === 'user' ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-[#C9A24B] flex items-center justify-center text-[#0A1A2F] shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                <div className="w-6 h-6 rounded-full bg-[#0A1A2F] flex items-center justify-center text-[#C9A24B]">
                  <Sparkles className="w-3 h-3 animate-spin" />
                </div>
                <span className="italic">Concierge is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick chips */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => handleSendMessage(chip)}
                disabled={loading}
                className="shrink-0 px-2.5 py-1 text-[11px] font-medium rounded-full bg-slate-100 hover:bg-[#C9A24B]/20 text-[#0A1A2F] border border-slate-200 transition-colors cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input field */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="Ask about rates, dining, pickup..."
              className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A24B] text-slate-800"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="p-2.5 rounded-xl bg-[#0A1A2F] text-[#C9A24B] hover:brightness-125 disabled:opacity-40 transition-all focus:outline-none"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
