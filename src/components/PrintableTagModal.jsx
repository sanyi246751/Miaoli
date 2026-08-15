import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, Download, Truck, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function PrintableTagModal({ booking, onClose }) {
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700 no-print">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-100">預約清運標示單列印與預覽</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Action Bar (No Print) */}
        <div className="px-6 py-3 bg-slate-850 border-b border-slate-700/60 flex items-center justify-between no-print text-xs">
          <div className="text-slate-300 flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>請將此標籤列印或手寫聯絡資訊與單號張貼於傢俱明顯處。</span>
          </div>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center space-x-2 shadow-md shadow-emerald-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>列印清運標示單</span>
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          <div
            id="printable-tag"
            className="bg-white text-slate-900 text-center rounded-xl p-6 border-4 border-dashed border-slate-800 shadow-lg relative font-sans mx-auto"
          >
            {/* Tag Header */}
            <div className="border-b-2 border-slate-800 pb-4 mb-4 flex flex-col items-center gap-3">
              <div className="text-center">
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-700 text-white text-xs font-bold px-2 py-0.5 rounded">
                    家戶免費專案
                  </span>
                  <h2 className="text-xl font-black tracking-tight text-slate-900">
                    大型廢棄傢俱已預約清運單
                  </h2>
                </div>
                <p className="text-xs text-slate-600 font-bold mt-1">
                  請貼於搬出傢俱外觀明顯處 ‧ 清潔隊現場掃碼核對
                </p>
              </div>

              {/* QR Code */}
              <div className="text-center bg-slate-100 p-2 rounded-lg border border-slate-300">
                <QRCodeSVG
                  value={`https://clean-city.gov.tw/booking/${booking.id}`}
                  size={76}
                  level="H"
                />
                <span className="text-[10px] font-mono font-bold text-slate-700 block mt-1">
                  現場核銷 QR
                </span>
              </div>
            </div>

            {/* Main Info Box */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-300 mb-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase block">預約單號 Tracking ID</span>
                <span className="text-lg font-black font-mono text-emerald-800 tracking-wider">
                  {booking.id}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase block">約定清運日期 Date</span>
                <span className="text-lg font-extrabold text-slate-900">
                  {booking.preferredDate} ({booking.preferredTimeSlot.split(' ')[0]})
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 block">申請人姓名 Name</span>
                <span className="text-base font-bold text-slate-800">{booking.applicantName}</span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 block">聯絡電話 Phone</span>
                <span className="text-base font-bold text-slate-800 font-mono">{booking.phone}</span>
              </div>
            </div>

            {/* Address */}
            <div className="mb-4">
              <span className="text-xs font-bold text-slate-500 block">一樓放置地點 Drop-off Location</span>
              <p className="text-sm font-bold text-slate-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-1">
                {booking.address}
                {booking.locationNote && (
                  <span className="block text-xs font-normal text-slate-600 mt-0.5">
                    備註：{booking.locationNote}
                  </span>
                )}
              </p>
            </div>

            {/* Items Checklist */}
            <div className="mb-4">
              <span className="text-xs font-bold text-slate-500 block mb-1">
                預約清運項目及數量 Items ({booking.items?.length || 0} 項)
              </span>
              <div className="grid grid-cols-2 gap-2">
                {booking.items?.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800"
                  >
                    <span>{item.name || item.categoryName}</span>
                    <span className="bg-slate-800 text-white px-2 py-0.5 rounded-full">
                      x {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer warning */}
            <div className="pt-3 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
              <span>※ 請勿放置危險物品或一般生活垃圾 ‧ 清潔隊客服電話: (02) 2720-8889</span>
              <span className="font-mono text-[10px] text-slate-400">印製時間: {new Date().toLocaleDateString()}</span>
            </div>

          </div>
        </div>

        {/* Modal Footer (No Print) */}
        <div className="px-6 py-4 bg-slate-800 border-t border-slate-700 flex justify-end space-x-3 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold transition-all"
          >
            關閉視窗
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>立即列印</span>
          </button>
        </div>

      </div>
    </div>
  );
}
