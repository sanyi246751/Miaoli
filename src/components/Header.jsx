import React from 'react';
import { Truck, FileText, Search, ShieldCheck, Leaf } from 'lucide-react';

const PUBLIC_NAV_ITEMS = [
  { id: 'booking', label: '線上預約', icon: FileText },
  { id: 'query', label: '進度查詢', icon: Search },
];

export default function Header({ activeTab, setActiveTab, pendingCount }) {
  const navClass = (id) =>
    'relative flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold transition-all sm:px-4 ' +
    (activeTab === id
      ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/10'
      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800');

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/90 text-slate-800 shadow-[0_8px_30px_-24px_rgba(6,78,59,.45)] backdrop-blur-xl no-print">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-20 items-center justify-between gap-3 py-3">
          <button className="group flex min-w-0 items-center gap-3 text-left" onClick={() => setActiveTab('booking')} aria-label="回到線上預約首頁">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-800/20 transition-transform group-hover:-translate-y-0.5">
              <Truck className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-black tracking-tight text-emerald-950 sm:text-xl">大型傢俱清運</h1>
                <span className="hidden items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 lg:inline-flex">
                  <Leaf className="mr-1 h-3 w-3" /> 家戶免費
                </span>
              </div>
              <p className="mt-0.5 hidden text-xs font-medium text-slate-400 sm:block">市民線上申請與清運進度服務</p>
            </div>
          </button>

          <nav className="flex shrink-0 items-center gap-2" aria-label="主要功能">
            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1" aria-label="市民服務">
              {PUBLIC_NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)} aria-current={activeTab === id ? 'page' : undefined} className={navClass(id)}>
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-1" aria-label="管理功能">
              <button onClick={() => setActiveTab('admin')} aria-current={activeTab === 'admin' ? 'page' : undefined} className={navClass('admin')}>
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">清潔隊後台</span>
                {pendingCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-amber-400 px-1.5 py-0.5 text-center text-[10px] font-black leading-4 text-amber-950 ring-2 ring-white">{pendingCount}</span>
                )}
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}