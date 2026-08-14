import React from 'react';
import { CheckCircle2, Printer, Search, FileText, ArrowRight, QrCode, Calendar, MapPin, PackageCheck } from 'lucide-react';

export default function BookingSuccessModal({ booking, onOpenTagModal, onGoToQuery, onReset }) {
  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 rounded-3xl border border-emerald-500/40 shadow-2xl overflow-hidden my-8 animate-fadeIn">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-center text-slate-950 relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-slate-950/20 flex items-center justify-center mx-auto mb-3 text-white ring-4 ring-white/30">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            傢俱預約清運申請成功！
          </h2>
          <p className="text-xs text-emerald-100 mt-1 font-semibold">
            清潔隊已收到您的申請，請列印或手寫標籤貼於家具上
          </p>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Tracking ID Badge */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-center space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
              預約單號 (Tracking ID)
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-wider">
              {booking.id}
            </span>
            <p className="text-xs text-slate-400">
              申請時間: {booking.createdAt}
            </p>
          </div>

          {/* Key Summary list */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400 font-semibold flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                預約清運日期
              </span>
              <span className="text-slate-100 font-bold">
                {booking.preferredDate} ({booking.preferredTimeSlot.split(' ')[0]})
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400 font-semibold flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                清運地址
              </span>
              <span className="text-slate-100 font-bold truncate max-w-[240px]">
                {booking.address}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold flex items-center">
                <PackageCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                清運項目
              </span>
              <span className="text-emerald-400 font-extrabold">
                {booking.items?.map(i => `${i.name} x${i.quantity}`).join('、')}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => onOpenTagModal(booking)}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>列印 / 預覽「已預約清運標示單」(與 QR Code)</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onGoToQuery}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center space-x-1"
              >
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <span>查詢預約進度</span>
              </button>

              <button
                onClick={onReset}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center space-x-1"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>再填寫一筆</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
