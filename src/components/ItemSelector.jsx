import React from 'react';
import { CATEGORIES } from '../data/mockData';
import { Plus, Minus, Check, PackageCheck, AlertCircle } from 'lucide-react';

export default function ItemSelector({ selectedItems, setSelectedItems }) {

  const handleQuantityChange = (categoryId, change) => {
    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.categoryId === categoryId);
      if (existing) {
        const newQty = existing.quantity + change;
        if (newQty <= 0) {
          return prev.filter((item) => item.categoryId !== categoryId);
        }
        return prev.map((item) =>
          item.categoryId === categoryId ? { ...item, quantity: newQty } : item
        );
      } else if (change > 0) {
        const categoryObj = CATEGORIES.find((c) => c.id === categoryId);
        return [
          ...prev,
          {
            categoryId,
            categoryName: categoryObj.name,
            name: categoryObj.name,
            quantity: 1,
            note: ''
          }
        ];
      }
      return prev;
    });
  };

  const handleNoteChange = (categoryId, note) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.categoryId === categoryId ? { ...item, note } : item
      )
    );
  };

  const getItemQuantity = (categoryId) => {
    const item = selectedItems.find((i) => i.categoryId === categoryId);
    return item ? item.quantity : 0;
  };

  const getItemNote = (categoryId) => {
    const item = selectedItems.find((i) => i.categoryId === categoryId);
    return item ? item.note : '';
  };

  const totalQuantity = selectedItems.reduce((acc, cur) => acc + cur.quantity, 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mr-2 text-sm border border-emerald-500/30">
              2
            </span>
            選擇待清運傢俱項目與數量
          </h3>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            已選擇總計: <strong className="text-emerald-300 text-sm ml-1">{totalQuantity}</strong> 件
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1 ml-10">
          請勾選您需免費清運的大型廢棄傢俱，並選擇對應數量（每項最多 5 件）。
        </p>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => {
          const qty = getItemQuantity(cat.id);
          const isSelected = qty > 0;

          return (
            <div
              key={cat.id}
              className={`relative rounded-xl p-4 transition-all duration-200 border ${
                isSelected
                  ? 'bg-emerald-950 border-emerald-300 shadow-lg shadow-emerald-950/40 ring-2 ring-emerald-400'
                  : 'bg-slate-900 border-slate-600 hover:border-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`text-3xl p-2 rounded-xl border shadow-inner ${isSelected ? 'bg-white border-white/60' : 'bg-slate-900/60 border-slate-700/50'}`}>
                    {cat.icon}
                  </span>
                  <div>
                    <h4 className={`font-black text-base ${isSelected ? '!text-white' : 'text-slate-100'}`}>{cat.name}</h4>
                    <p className={`text-xs mt-0.5 ${isSelected ? '!text-emerald-100' : 'text-slate-400'}`}>{cat.desc}</p>
                  </div>
                </div>
                <span className={`ml-2 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${isSelected ? 'bg-emerald-400 text-emerald-950' : 'bg-slate-700 text-slate-200'}`}>{isSelected ? '✓ 已選取' : '未選取'}</span>
              </div>

              {/* Quantity Controls */}
              <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">
                  {isSelected ? '選擇數量:' : '尚未選擇'}
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(cat.id, -1)}
                    disabled={qty === 0}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                      qty > 0
                        ? 'bg-slate-700 text-slate-200 hover:bg-rose-500/20 hover:text-rose-400 border border-slate-600'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-800'
                    }`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <span className="w-8 text-center font-extrabold text-base text-emerald-400">
                    {qty}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleQuantityChange(cat.id, 1)}
                    disabled={qty >= 5}
                    className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 font-bold text-sm flex items-center justify-center border border-emerald-500/40 transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Detail note if selected */}
              {isSelected && (
                <div className="mt-3 animate-fadeIn">
                  <input
                    type="text"
                    placeholder={cat.id === 'other' ? '請填寫其他清運項目內容' : `填寫規格/細節 (例: ${cat.name === '床墊' ? '雙人獨立筒床墊' : cat.name === '櫃子' ? '三門大衣櫃' : '特定尺寸或樣式說明'})`}
                    value={getItemNote(cat.id)}
                    onChange={(e) => handleNoteChange(cat.id, e.target.value)}
                    className="w-full text-xs bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedItems.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>請至少選擇一項待清運的大型傢俱項目以進行預約。</span>
        </div>
      )}
    </div>
  );
}
