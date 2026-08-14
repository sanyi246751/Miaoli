import React from 'react';
import { Truck, FileText, Search, ShieldCheck, Leaf, Clock } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, pendingCount }) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-emerald-500/20 text-slate-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
          
          {/* Logo & Portal Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('booking')}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/30">
              <Truck className="w-7 h-7 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-100">
                  大型廢棄傢俱預約清運系統
                </h1>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Leaf className="w-3 h-3 mr-1" /> 家戶免費專案
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                線上預約廢棄傢俱清運 ‧ 迅速排班 ‧ 環保永續
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60 shadow-inner">
            <button
              onClick={() => setActiveTab('booking')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'booking'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>線上預約申請</span>
            </button>

            <button
              onClick={() => setActiveTab('query')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'query'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>預約進度查詢</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>清潔隊後台</span>
              {pendingCount > 0 && (
                <span className="ml-1 bg-amber-500 text-slate-950 text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
          </nav>

        </div>
      </div>
    </header>
  );
}
