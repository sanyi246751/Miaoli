import React, { useEffect, useState } from 'react';
import { CITY_DISTRICTS } from '../data/mockData';
import ItemSelector from './ItemSelector';
import PhotoUploader from './PhotoUploader';
import TermsConsent, { TERMS_LIST } from './TermsConsent';
import { User, Phone, MapPin, Mail, Calendar, Clock, AlertCircle, ArrowRight, CheckCircle2, FileText, Sparkles } from 'lucide-react';

const formatTaiwanPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
  if (/^09\d{8}$/.test(digits)) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  if (/^037\d{6}$/.test(digits)) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (/^02\d{8}$/.test(digits)) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  if (/^0\d{8,9}$/.test(digits)) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return value;
};

export default function BookingForm({ onSubmitSuccess }) {
  // Form State
  const [applicantName, setApplicantName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [county, setCounty] = useState('苗栗縣');
  const [district, setDistrict] = useState('苗栗市');
  const [detailAddress, setDetailAddress] = useState('');

  // Selected items & photos
  const [selectedItems, setSelectedItems] = useState([]);
  const [photos, setPhotos] = useState([]);

  // Time & Location
  // Default to 3 days in the future
  const defaultDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [preferredDate, setPreferredDate] = useState(defaultDate);
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('上午8點至12點');
  const [locationNote, setLocationNote] = useState('');

  // Legal Consent
  const [agreedTerms, setAgreedTerms] = useState([]);

  // Form errors state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSecondsLeft, setSubmitSecondsLeft] = useState(0);

  useEffect(() => {
    if (!isSubmitting || submitSecondsLeft <= 0) return;
    const timer = setTimeout(() => setSubmitSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearTimeout(timer);
  }, [isSubmitting, submitSecondsLeft]);

  // Quick fill sample data for fast evaluation
  const handleQuickFill = () => {
    setApplicantName('王小明');
    setPhone('0912-345678');
    setEmail('xiaoming.wang@example.com');
    setCounty('台北市');
    setDistrict('大安區');
    setDetailAddress('台北市大安區新生南路三段 100 號一樓大門口旁');
    setLocationNote('請放置於一樓側門走廊，不佔用紅線');
    setAgreedTerms(TERMS_LIST.map((t) => t.id));
    if (photos.length === 0) {
      setPhotos([
        {
          id: 'demo-1',
          name: '客廳舊雙人床墊與木椅.jpg',
          size: '1.8 MB',
          url: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=500&auto=format&fit=crop&q=60'
        }
      ]);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // 1. Applicant validation
    if (!applicantName.trim()) {
      newErrors.applicantName = '請填寫申請人姓名';
    }
    if (!phone.trim()) {
      newErrors.phone = '請填寫聯絡電話';
    } else if (!/^09\d{2}-?\d{6}$/.test(phone.trim()) && !/^0\d{1,2}-?\d{6,8}$/.test(phone.trim())) {
      newErrors.phone = '請輸入有效電話（如 0912-345678 或 037-123456）';
    }

    if (!detailAddress.trim()) {
      newErrors.detailAddress = '請填寫清運詳細地址';
    }

    // 2. Selected items validation
    if (selectedItems.length === 0) {
      newErrors.items = '請至少選擇一項清運傢俱項目';
    }

    // 3. Date validation
    if (!preferredDate) {
      newErrors.preferredDate = '請選擇約定清運日期';
    }

    // 4. Terms consent validation
    if (agreedTerms.length < TERMS_LIST.length) {
      newErrors.terms = '必須閱讀並全數勾選同意 5 項申請聲明條款';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) {
      // Scroll to top or first error
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    const estimatedSeconds = photos.length > 0 ? Math.min(10, 2 + photos.length * 2) : 1;
    setSubmitSecondsLeft(estimatedSeconds);

    // Simulate API network call delay
    setTimeout(() => {
      const bookingDate = new Date();
      const bookingPrefix = `${bookingDate.getFullYear() - 1911}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}${String(bookingDate.getDate()).padStart(2, '0')}-`;
      let cachedBookings = [];
      try { cachedBookings = JSON.parse(localStorage.getItem('bulky_furniture_bookings') || '[]'); } catch { cachedBookings = []; }
      const dailySequences = cachedBookings.filter((booking) => String(booking.id || '').startsWith(bookingPrefix)).map((booking) => Number(String(booking.id).slice(bookingPrefix.length))).filter(Number.isFinite);
      const bookingId = bookingPrefix + String(Math.max(0, ...dailySequences) + 1).padStart(3, '0');
      const newBooking = {
        id: bookingId,
        applicantName,
        phone: formatTaiwanPhone(phone),
        email,
        county,
        district,
        address: detailAddress,
        preferredDate,
        preferredTimeSlot,
        locationNote,
        items: selectedItems,
        photos: photos.map((p) => p.url),
        status: '已收件',
        statusTimeline: [
          { status: '已收件', time: new Date().toLocaleString() }
        ],
        createdAt: new Date().toLocaleString(),
        agreedToTerms: true
      };

      onSubmitSuccess(newBooking);
      setApplicantName(''); setPhone(''); setEmail(''); setCounty('苗栗縣'); setDistrict('苗栗市');
      setDetailAddress(''); setSelectedItems([]); setPhotos([]); setPreferredDate(defaultDate);
      setPreferredTimeSlot('上午8點至12點'); setLocationNote(''); setAgreedTerms([]); setErrors({});
      setSubmitSecondsLeft(0);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, photos.length > 0 ? Math.min(2500, estimatedSeconds * 500) : 500);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      
      {/* Banner / Header Card */}
      <div className="booking-hero relative rounded-[2rem] p-6 sm:p-9 border border-emerald-200 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-300/25 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/80 text-emerald-800 border border-emerald-200 mb-3 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              台北/新北家戶免費申請 Portal
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-emerald-950 tracking-tight">
              線上預約大型廢棄傢俱清運
            </h2>
            <p className="text-sm text-slate-600 mt-3 max-w-xl leading-relaxed">
              填寫下方基本資料、選擇待清運品項並上傳照片，完成後即可獲取專屬「清運標籤單號」與 QR Code。
            </p>
          </div>

          <button
            type="button"
            onClick={handleQuickFill}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 transition-all flex items-center space-x-1.5 shadow-lg"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>自動帶入測試範例資料</span>
          </button>
        </div>
      </div>

      {/* Global Validation Warning */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-sm flex items-start space-x-3 shadow-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">表單包含尚未填寫或不符合格式的欄位：</h4>
            <ul className="list-disc list-inside text-xs mt-1 space-y-0.5 text-rose-200">
              {Object.values(errors).map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Section 1: Applicant Basic Info */}
      <div className="glass-card rounded-2xl p-6 border border-slate-700/60 shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mr-2 text-sm border border-emerald-500/30">
              1
            </span>
            申請人基本資料
          </h3>
          <p className="text-xs text-slate-400 mt-1 ml-10">
            請輸入正確聯絡人資料，以便清潔隊進行派車核對與聯繫。（標記 <span className="text-rose-400 font-bold">*</span> 為必填欄位）
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Applicant Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center">
              <User className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              申請人姓名 <span className="text-rose-400 ml-1">*</span>
            </label>
            <input
              type="text"
              placeholder="請輸入姓名 (例: 王大明)"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              className={`w-full bg-slate-900/90 border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                errors.applicantName
                  ? 'border-rose-500 ring-1 ring-rose-500'
                  : 'border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              }`}
            />
            {errors.applicantName && (
              <p className="text-xs text-rose-400 mt-1">{errors.applicantName}</p>
            )}
          </div>

          {/* Applicant Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center">
              <Phone className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              行動電話 / 聯絡電話 <span className="text-rose-400 ml-1">*</span>
            </label>
            <input
              type="tel"
              placeholder="0912-345678 或 037-123456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => setPhone(formatTaiwanPhone(phone))}
              className={`w-full bg-slate-900/90 border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                errors.phone
                  ? 'border-rose-500 ring-1 ring-rose-500'
                  : 'border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              }`}
            />
            {errors.phone && (
              <p className="text-xs text-rose-400 mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Email (Optional) */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center">
                <Mail className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                電子郵件 (Email)
              </span>
              <span className="text-[11px] text-slate-400 font-normal">選填，填寫將發送預約憑證副本</span>
            </label>
            <input
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* City / District & Detail Address */}
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">縣市 <span className="text-rose-400">*</span></label>
              <select value={county} onChange={(e) => { const next = e.target.value; setCounty(next); setDistrict(CITY_DISTRICTS[next][0]); }} className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500">
                {Object.keys(CITY_DISTRICTS).map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                行政區域 <span className="text-rose-400 ml-1">*</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {CITY_DISTRICTS[county].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center">
                詳細清運地址（含街道、門牌、一樓放置處） <span className="text-rose-400 ml-1">*</span>
              </label>
              <input
                type="text"
                placeholder="例如: 台北市大安區新生南路三段 88 號一樓大門右側"
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
                className={`w-full bg-slate-900/90 border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                  errors.detailAddress
                    ? 'border-rose-500 ring-1 ring-rose-500'
                    : 'border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                }`}
              />
              {errors.detailAddress && (
                <p className="text-xs text-rose-400 mt-1">{errors.detailAddress}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Items Selection */}
      <div className="glass-card rounded-2xl p-6 border border-slate-700/60 shadow-xl">
        <ItemSelector selectedItems={selectedItems} setSelectedItems={setSelectedItems} />
        {errors.items && (
          <p className="text-xs text-rose-400 mt-2 font-bold">{errors.items}</p>
        )}
      </div>

      {/* Section 3: Photo Upload */}
      <div className="glass-card rounded-2xl p-6 border border-slate-700/60 shadow-xl">
        <PhotoUploader photos={photos} setPhotos={setPhotos} />
      </div>

      {/* Section 4: Collection Date & Time */}
      <div className="glass-card rounded-2xl p-6 border border-slate-700/60 shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mr-2 text-sm border border-emerald-500/30">
              4
            </span>
            約定清運時間與放置地點細節
          </h3>
          <p className="text-xs text-slate-400 mt-1 ml-10">
            請選擇期望搬運出來由清潔隊載運的時間與一樓擺放地點指示。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Preferred Date */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              約定清運日期 <span className="text-rose-400 ml-1">*</span>
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            <p className="mt-1 text-[11px] text-slate-400">民國日期：{preferredDate ? `${Number(preferredDate.slice(0, 4)) - 1911}/${Number(preferredDate.slice(5, 7))}/${Number(preferredDate.slice(8, 10))}` : '—'}</p>
            {errors.preferredDate && <p className="mt-1 text-xs text-rose-400">{errors.preferredDate}</p>}
          </div>

          {/* Time Slot */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              希望清運時段 <span className="text-rose-400 ml-1">*</span>
            </label>
            <select
              value={preferredTimeSlot}
              onChange={(e) => setPreferredTimeSlot(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="上午8點至12點">上午8點至12點</option>
              <option value="下午1點至5點">下午1點至5點</option>
            </select>
          </div>

          {/* Placement Detail Note */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              放置地點詳細說明 (例: 放置於巷口防火巷旁、社區一樓後門側，避免阻礙人車通行)
            </label>
            <textarea
              rows={2}
              placeholder="請填寫具體描述放置地點特徵..."
              value={locationNote}
              onChange={(e) => setLocationNote(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Section 5: Legal Terms & Declaration */}
      <div className="glass-card rounded-2xl p-6 border border-slate-700/60 shadow-xl">
        <TermsConsent agreedTerms={agreedTerms} setAgreedTerms={setAgreedTerms} />
        {errors.terms && (
          <p className="text-xs text-rose-400 mt-2 font-bold">{errors.terms}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4 flex items-center justify-end space-x-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>送出處理中{photos.length > 0 && submitSecondsLeft > 0 ? `，預估還有 ${submitSecondsLeft} 秒` : '…'}</span>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>確認送出廢棄傢俱清運預約</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

    </form>
  );
}
