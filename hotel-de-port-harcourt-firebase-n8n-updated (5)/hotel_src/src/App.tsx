// src/App.tsx
// Hotel De Port Harcourt - Main Application Entry & Route Definitions

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { ChatbotWidget } from './components/ChatbotWidget.tsx';

// Public Pages
import { HomePage } from './pages/HomePage.tsx';
import { ReviewPage } from './pages/ReviewPage.tsx';
import { MaintenancePage } from './pages/MaintenancePage.tsx';
import { AuthPages } from './pages/AuthPages.tsx';
import { UserDashboardPage } from './pages/UserDashboardPage.tsx';
import { BookingsPage } from './pages/dashboard/BookingsPage.tsx';

// Admin Panel
import { AdminLoginPage } from './pages/admin/AdminLoginPage.tsx';
import { AdminLayout } from './pages/admin/AdminLayout.tsx';

// Wrapper for public website layout
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Website */}
          <Route
            path="/"
            element={
              <PublicLayout>
                <HomePage />
              </PublicLayout>
            }
          />

          {/* Public Review Page: /review?booking=ID */}
          <Route path="/review" element={<ReviewPage />} />

          {/* Public Maintenance Page: /report?room=203 */}
          <Route path="/report" element={<MaintenancePage />} />

          {/* Guest Account Pages */}
          <Route path="/login" element={<AuthPages initialMode="login" />} />
          <Route path="/signup" element={<AuthPages initialMode="signup" />} />
          <Route path="/verify" element={<AuthPages initialMode="verify" />} />

          {/* Admin Panel */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />} />
          <Route path="/dashboard" element={<UserDashboardPage />} />
          <Route path="/dashboard/bookings" element={<BookingsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
