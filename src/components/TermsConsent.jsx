import React from 'react';
import { ShieldCheck, CheckSquare, Square, AlertTriangle } from 'lucide-react';

export const TERMS_LIST = [
  {
    id: 1,
    title: '服務對象限制',
    content: '本免費清運服務僅限一般家戶廢棄大型傢俱，事業單位（公司、工廠、飯店、店家等）或裝修廢棄物恕不受理。'
  },
  {
    id: 2,
    title: '搬運與放置地點規定',
    content: '申請人須於約定清運時間當日（或前一日晚上）將物品自行搬運至一樓約定地點放置，且不得妨礙道路交通安全。'
  },
  {
    id: 3,
    title: '清運單號標示規定',
    content: '請於搬出物品上貼妥「已預約清運單號或聯絡人姓名電話」字樣，以免被視為違規棄置。'
  },
  {
    id: 4,
    title: '嚴禁違禁與危險物品',
    content: '嚴禁夾雜危險物品（如高壓氣瓶、易燃物）、一般生活垃圾或一般事業廢棄物。'
  },
  {
    id: 5,
    title: '個人資料保護與蒐集目的',
    content: '本所個人資料蒐集目的僅作為廢棄物清運聯繫與核對使用，依個人資料保護法予以保護。'
  }
];

export default function TermsConsent({ agreedTerms, setAgreedTerms }) {
  const isAllAgreed = TERMS_LIST.every((term) => agreedTerms.includes(term.id));

  const handleToggleAll = () => {
    setAgreedTerms(isAllAgreed ? [] : TERMS_LIST.map((term) => term.id));
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-slate-100 flex items-center">
          <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mr-2 text-sm border border-emerald-500/30">5</span>
          申請聲明與同意事項 (必填)
        </h3>
        <p className="text-xs text-slate-400 mt-1 ml-10">
          依廢棄物清理法及清潔隊規定，請完整閱讀以下事項後勾選同意。
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700/60">
        <table className="w-full text-left text-xs">
          <thead className="bg-emerald-50 text-emerald-900">
            <tr>
              <th className="w-14 px-4 py-3 text-center font-bold">項次</th>
              <th className="w-44 px-4 py-3 font-bold">聲明事項</th>
              <th className="px-4 py-3 font-bold">內容說明</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {TERMS_LIST.map((term) => (
              <tr key={term.id} className="align-top">
                <td className="px-4 py-3 text-center font-black text-emerald-700">{term.id}</td>
                <td className="px-4 py-3 font-bold text-slate-200">{term.title}</td>
                <td className="px-4 py-3 leading-relaxed text-slate-300">{term.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        role="checkbox"
        aria-checked={isAllAgreed}
        onClick={handleToggleAll}
        className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all ${
          isAllAgreed
            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-800'
            : 'border-slate-700/60 bg-white/60 text-slate-700 hover:border-emerald-400'
        }`}
      >
        {isAllAgreed ? <CheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <Square className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />}
        <span className="text-sm font-bold">我已詳讀並同意配合以上事項 (閱讀後，請勾選)</span>
      </button>

      {!isAllAgreed ? (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>閱讀後請勾選同意以上全部 5 項申請聲明，方能提交申請。</span>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2.5">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>您已詳讀並同意配合所有申請聲明事項。</span>
        </div>
      )}
    </div>
  );
}
