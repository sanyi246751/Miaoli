import React, { useState } from 'react';
import { CITY_DISTRICTS } from '../data/mockData';
import { ShieldCheck, Truck, CheckCircle2, Clock, Filter, Search, Download, RotateCcw, Eye, ArrowUpRight, AlertCircle, FileSpreadsheet } from 'lucide-react';

export default function AdminDashboard({ bookings, setBookings, onOpenTagModal }) {
  const [selectedDistrict, setSelectedDistrict] = useState('全部');
  const [selectedStatus, setSelectedStatus] = useState('全部');
  const [searchKey, setSearchKey] = useState('');

  // Status Filter
  const filteredBookings = bookings.filter((b) => {
    const matchDistrict = selectedDistrict === '全部' || b.district === selectedDistrict;
    const matchStatus = selectedStatus === '全部' || b.status === selectedStatus;
    const matchSearch =
      b.applicantName.includes(searchKey) ||
      b.phone.includes(searchKey) ||
      b.id.toLowerCase().includes(searchKey.toLowerCase()) ||
      b.address.includes(searchKey);
    return matchDistrict && matchStatus && matchSearch;
  });

  // Calculate Metrics
  const pendingCount = bookings.filter((b) => b.status === '待審核' || b.status === '已收件').length;
  const scheduledCount = bookings.filter((b) => b.status === '已排班').length;
  const completedCount = bookings.filter((b) => b.status === '清運完成').length;

  // Change order status
  const handleUpdateStatus = (id, newStatus, note = '') => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const nowTime = new Date().toLocaleString();
          const newTimeline = [
            ...(b.statusTimeline || []),
            { status: newStatus, time: nowTime, note }
          ];
          return {
            ...b,
            status: newStatus,
            statusTimeline: newTimeline
          };
        }
        return b;
      })
    );
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['預約單號', '申請人', '電話', '行政區', '詳細地址', '清運日期', '清運品項與數量', '狀態'];
    const rows = filteredBookings.map((b) => [
      b.id,
      b.applicantName,
      b.phone,
      b.district,
      `"${b.address}"`,
      b.preferredDate,
      `"${b.items.map((i) => `${i.name}x${i.quantity}`).join('; ')}"`,
      b.status
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `環保清運清單_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              清潔隊內部車輛調度系統
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center">
            <ShieldCheck className="w-7 h-7 mr-2 text-emerald-400" />
            廢棄傢俱清運審核與排班後台
          </h2>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-all flex items-center space-x-2 shadow-md"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>匯出 Excel / CSV 派車清單</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-700/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">總預約申請案數</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-100 mt-2">{bookings.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">累積總案件</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-700/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">待審核 / 未排班</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-400 mt-2">{pendingCount}</p>
          <span className="text-[11px] text-amber-300/80 mt-1 block">需清潔隊點收與核對</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-700/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">已排班 / 車輛派遣中</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-400 mt-2">{scheduledCount}</p>
          <span className="text-[11px] text-emerald-300/80 mt-1 block">隊員依路線載運中</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-700/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">已完成清運回收</span>
            <div className="w-8 h-8 rounded-lg bg-slate-700 text-slate-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-200 mt-2">{completedCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">結案處理完畢</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-700/60 shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* District Filter */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-semibold">行政區:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="全部">全區 (All Districts)</option>
              {CITY_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-semibold">狀態:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="全部">全部狀態</option>
              <option value="已收件">已收件 / 待審核</option>
              <option value="已排班">已排班</option>
              <option value="清運完成">清運完成</option>
              <option value="已取消">已取消</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜尋姓名、電話、單號或地址..."
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

      </div>

      {/* Bookings Data Table */}
      <div className="glass-card rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/90 text-slate-300 border-b border-slate-700 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">預約單號 / 時間</th>
                <th className="py-3.5 px-4">申請人與電話</th>
                <th className="py-3.5 px-4">行政區與一樓清運地址</th>
                <th className="py-3.5 px-4">約定日期/時段</th>
                <th className="py-3.5 px-4">清運品項</th>
                <th className="py-3.5 px-4">狀態</th>
                <th className="py-3.5 px-4 text-right">操作與審核</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    尚無符合條件的清運預約資料
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      <div>{b.id}</div>
                      <span className="text-[10px] text-slate-500 font-sans font-normal">{b.createdAt}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-100">
                      <div>{b.applicantName}</div>
                      <span className="text-[11px] font-mono text-slate-400">{b.phone}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-bold mb-1">
                        {b.district}
                      </span>
                      <p className="truncate text-slate-300" title={b.address}>{b.address}</p>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-300">
                      <div>{b.preferredDate}</div>
                      <span className="text-[11px] text-emerald-400">{b.preferredTimeSlot.split(' ')[0]}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {b.items?.map((item, idx) => (
                          <span key={idx} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] border border-slate-700">
                            {item.name} x{item.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] ${
                        b.status === '已排班'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : b.status === '清運完成'
                          ? 'bg-slate-700 text-slate-300'
                          : b.status === '已取消'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onOpenTagModal(b)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                          title="預覽標籤與 QR Code"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {(b.status === '已收件' || b.status === '待審核') && (
                          <button
                            onClick={() => handleUpdateStatus(b.id, '已排班', '已核對項目，指派環保二中隊專車')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold transition-all"
                          >
                            核可排班
                          </button>
                        )}

                        {b.status === '已排班' && (
                          <button
                            onClick={() => handleUpdateStatus(b.id, '清運完成', '隊員已於現場載運完畢')}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-slate-950 font-bold transition-all"
                          >
                            結案完成
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
