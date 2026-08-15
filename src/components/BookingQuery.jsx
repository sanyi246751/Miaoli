import React, { useEffect, useState } from 'react';
import { Search, Phone, FileText, Calendar, MapPin, Printer, CheckCircle, Clock, TruckCheck, AlertCircle, XCircle } from 'lucide-react';

export default function BookingQuery({ bookings, onOpenTagModal, onCancelBooking }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const bookingId = new URLSearchParams(window.location.search).get('booking');
    if (!bookingId || bookings.length === 0) return;
    setSearchQuery(bookingId);
    setResults(bookings.filter((booking) => String(booking.id) === bookingId));
    setSearched(true);
  }, [bookings]);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    const filtered = bookings.filter((b) =>
      b.id.toLowerCase().includes(query) ||
      b.phone.replaceAll('-', '').includes(query.replaceAll('-', '')) ||
      b.applicantName.includes(query)
    );

    setResults(filtered);
    setSearched(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case '已收件':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">已收件 ‧ 待審核</span>;
      case '審核中':
      case '待審核':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">隊員審核中</span>;
      case '已排班':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">已安排清運車輛</span>;
      case '清運完成':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-700 text-slate-300 border border-slate-600">已完成清運</span>;
      case '已取消':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">預約已取消</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700/60 shadow-2xl space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center">
            <Search className="w-7 h-7 mr-2.5 text-emerald-400" />
            廢棄傢俱預約進度與單號查詢
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            輸入您申請時填寫的「聯絡電話 (手機)」或「預約單號」，即可即時追蹤清潔隊處理與清運進度。
          </p>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="請輸入手機號碼 (例如: 0912-345-678) 或單號 (例如: 115-0815-001)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900/90 border border-slate-700 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>查詢預約</span>
          </button>
        </form>

        <p className="text-[11px] text-slate-400">為保護個人資料，查詢資料不提供公開快捷按鈕；請自行輸入電話或預約單號。</p>
      </div>

      {/* Results Area */}
      {searched && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-200">
              查詢結果 ({results.length} 筆)
            </h3>
          </div>

          {results.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
              <AlertCircle className="w-12 h-12 text-slate-500 mx-auto" />
              <h4 className="text-lg font-bold text-slate-300">未找到符合的預約紀錄</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                請確認您輸入的手機號碼或預約單號是否完全正確，或嘗試重新預約。
              </p>
            </div>
          ) : (
            results.map((booking) => (
              <div
                key={booking.id}
                className="glass-card rounded-2xl p-6 border border-slate-700/80 shadow-xl space-y-6"
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700/60 gap-3">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-mono font-black text-emerald-400">
                        {booking.id}
                      </span>
                      {getStatusBadge(booking.status)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      申請時間：{booking.createdAt} ‧ 行政區：{booking.district}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onOpenTagModal(booking)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all flex items-center space-x-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>標籤/QR Code</span>
                    </button>

                    {booking.status !== '已取消' && booking.status !== '清運完成' && (
                      <button
                        onClick={() => onCancelBooking(booking.id)}
                        className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 transition-all"
                      >
                        取消預約
                      </button>
                    )}
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block font-semibold mb-1">申請人資訊</span>
                    <p className="text-slate-200 font-bold">{booking.applicantName} ({booking.phone})</p>
                    <p className="text-slate-400 mt-0.5">{booking.email || '未填寫 Email'}</p>
                  </div>

                  <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block font-semibold mb-1">約定清運時間</span>
                    <p className="text-slate-100 font-bold">{booking.preferredDate}</p>
                    <p className="text-emerald-400 mt-0.5">{booking.preferredTimeSlot}</p>
                  </div>

                  <div className="sm:col-span-2 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block font-semibold mb-1">放置地點</span>
                    <p className="text-slate-200 font-bold">{booking.address}</p>
                    {booking.locationNote && (
                      <p className="text-slate-400 mt-0.5">放置備註: {booking.locationNote}</p>
                    )}
                  </div>
                </div>

                {/* Items Breakdown */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-2">清運項目清單</h4>
                  <div className="flex flex-wrap gap-2">
                    {booking.items?.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1.5"
                      >
                        <span>{item.name || item.categoryName}</span>
                        <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[11px]">
                          x{item.quantity}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Photos if any */}
                {booking.photos && booking.photos.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 mb-2">附檔照片 ({booking.photos.length})</h4>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {booking.photos.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt="傢俱照片"
                          className="w-20 h-20 object-cover rounded-xl border border-slate-700 shadow"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Timeline */}
                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    處理進度時間軸 Status History
                  </h4>
                  <div className="space-y-3">
                    {booking.statusTimeline?.map((item, idx) => (
                      <div key={idx} className="flex items-start space-x-3 text-xs">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-200">{item.status}</span>
                            <span className="text-slate-400 text-[11px]">{item.time}</span>
                          </div>
                          {item.note && (
                            <p className="text-slate-400 mt-0.5 text-[11px]">{item.note}</p>
                          )}
                          {Number.isFinite(Number(item.distanceKm)) && Number.isFinite(Number(item.carbonKg)) && (
                            <p className="mt-1 text-[11px] font-bold text-emerald-400">🚚 {item.vehicle ? `${item.vehicle} 車・` : ''}{item.routeType || '行車路線'}・{Number(item.distanceKm).toFixed(1)} km・{Number(item.carbonKg).toFixed(2)} kg CO₂e</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
