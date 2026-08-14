import React from 'react';
import { ShieldCheck, CheckSquare, Square, AlertTriangle, FileText } from 'lucide-react';

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

  const handleToggleSingle = (id) => {
    if (agreedTerms.includes(id)) {
      setAgreedTerms(agreedTerms.filter((item) => item !== id));
    } else {
      setAgreedTerms([...agreedTerms, id]);
    }
  };

  const handleToggleAll = () => {
    if (isAllAgreed) {
      setAgreedTerms([]);
    } else {
      setAgreedTerms(TERMS_LIST.map((t) => t.id));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mr-2 text-sm border border-emerald-500/30">
              5
            </span>
            申請聲明與同意事項（請逐項確認）
          </h3>
          <button
            type="button"
            onClick={handleToggleAll}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all flex items-center space-x-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isAllAgreed ? '取消全部勾選' : '一鍵全選並同意'}</span>
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1 ml-10">
          依廢棄物清理法及清潔隊規定，請閱讀並勾選同意以下條款後方可送出預約申請。
        </p>
      </div>

      <div className="space-y-3">
        {TERMS_LIST.map((term) => {
          const isChecked = agreedTerms.includes(term.id);
          return (
            <div
              key={term.id}
              onClick={() => handleToggleSingle(term.id)}
              className={`p-4 rounded-xl cursor-pointer border transition-all duration-200 ${
                isChecked
                  ? 'bg-slate-800/90 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                  : 'bg-slate-850/40 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 text-emerald-400">
                  {isChecked ? (
                    <CheckSquare className="w-5 h-5 fill-emerald-500/20 text-emerald-400" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                      條款 {term.id}
                    </span>
                    <h4 className={`text-sm font-bold ${isChecked ? 'text-emerald-300' : 'text-slate-200'}`}>
                      {term.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {term.content}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Warning Banner */}
      {!isAllAgreed ? (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>您需勾選同意以上全部 5 項申請聲明，方能成功提交廢棄傢俱清運申請。</span>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2.5">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>您已同意所有申請聲明事項，符合環保清運服務申請條件。</span>
        </div>
      )}
    </div>
  );
}
