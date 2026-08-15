import React, { useState, useEffect } from 'react';
import { INITIAL_BOOKINGS } from './data/mockData';
import Header from './components/Header';
import BookingForm from './components/BookingForm';
import BookingSuccessModal from './components/BookingSuccessModal';
import PrintableTagModal from './components/PrintableTagModal';
import BookingQuery from './components/BookingQuery';
import AdminDashboard from './components/AdminDashboard';
import { Truck, PhoneCall, HelpCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('booking');

  // Bookings state initialized from localStorage or mockData
  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem('bulky_furniture_bookings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_BOOKINGS;
      }
    }
    return INITIAL_BOOKINGS;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('bulky_furniture_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    const bookingId = new URLSearchParams(window.location.search).get('booking');
    if (bookingId) setActiveTab('query');
  }, []);

  // Modal states
  const [recentlyCreatedBooking, setRecentlyCreatedBooking] = useState(null);
  const [printableBooking, setPrintableBooking] = useState(null);

  // Handle Form Submission Success
  const handleBookingSubmitSuccess = (newBooking) => {
    setBookings((prev) => [newBooking, ...prev]);
    setRecentlyCreatedBooking(newBooking);
  };

  // Cancel booking handler
  const handleCancelBooking = (bookingId) => {
    if (window.confirm(`確定要取消單號 ${bookingId} 的清運預約嗎？`)) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status: '已取消',
                statusTimeline: [
                  ...(b.statusTimeline || []),
                  { status: '已取消', time: new Date().toLocaleString(), note: '申請人自行取消預約' }
                ]
              }
            : b
        )
      );
    }
  };

  const pendingCount = bookings.filter((b) => b.status === '已收件' || b.status === '待審核').length;

  return (
    <div className="app-shell min-h-screen text-slate-800 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950">
      
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
      />

      {/* Main View Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-12">
        
        {/* Tab 1: Booking Form */}
        {activeTab === 'booking' && (
          <BookingForm onSubmitSuccess={handleBookingSubmitSuccess} />
        )}

        {/* Tab 2: Booking Query & Tracking */}
        {activeTab === 'query' && (
          <BookingQuery
            bookings={bookings}
            onOpenTagModal={(b) => setPrintableBooking(b)}
            onCancelBooking={handleCancelBooking}
          />
        )}

        {/* Tab 3: Sanitation Admin Backend */}
        {activeTab === 'admin' && (
          <AdminDashboard
            bookings={bookings}
            setBookings={setBookings}
            onOpenTagModal={(b) => setPrintableBooking(b)}
          />
        )}

      </main>

      {/* Booking Success Modal */}
      {recentlyCreatedBooking && (
        <BookingSuccessModal
          booking={recentlyCreatedBooking}
          onOpenTagModal={(b) => {
            setRecentlyCreatedBooking(null);
            setPrintableBooking(b);
          }}
          onGoToQuery={() => {
            setRecentlyCreatedBooking(null);
            setActiveTab('query');
          }}
          onReset={() => {
            setRecentlyCreatedBooking(null);
          }}
        />
      )}

      {/* Printable Tag Modal */}
      {printableBooking && (
        <PrintableTagModal
          booking={printableBooking}
          onClose={() => setPrintableBooking(null)}
        />
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-emerald-900/10 bg-emerald-950 py-9 text-emerald-100/70 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border-b border-white/10 pb-6">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-300 text-emerald-950 flex items-center justify-center shadow-lg shadow-black/10">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">大型廢棄傢俱預約清運管理系統</h4>
                <p className="text-xs text-emerald-100/60">環保局家戶廢棄物專案服務 ‧ 依據廢棄物清理法及個資法保護規定辦理</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-xs text-emerald-50/80 sm:flex-row sm:items-center sm:gap-6">
              <span className="flex items-center">
                <PhoneCall className="w-4 h-4 mr-1.5 text-emerald-300" />
                市民服務專線: 1999
              </span>
              <span className="flex items-center">
                <HelpCircle className="w-4 h-4 mr-1.5 text-emerald-300" />
                清潔隊客服: (02) 2720-8889
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-100/45 gap-2">
            <p>© 2026 環保局家戶大型廢棄物清運專區. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <span>個人資料保護聲明</span>
              <span>‧</span>
              <span>清運作業規範說明</span>
              <span>‧</span>
              <span>政府開放資料</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
