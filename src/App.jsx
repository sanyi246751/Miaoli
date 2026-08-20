import { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import BookingView from './components/BookingView.jsx';
import BookingQueryView from './components/BookingQueryView.jsx';
import BookingSuccessModal from './components/BookingSuccessModal.jsx';
import PrintableTagModal from './components/PrintableTagModal.jsx';
import Footer from './components/Footer.jsx';
import QRCodeBox from './components/QRCodeBox.jsx';
import { CATEGORIES, COUNTIES, DISTRICTS_BY_COUNTY, TERMS_LIST, INITIAL_BOOKINGS } from './data/appData.js';
import { formatMinguoDate, formatTaiwanPhone, getMinguoTime } from './utils/formatters.js';

    // Main App Component
    export default function App() {
      const [activeTab, setActiveTab] = useState('booking'); // 'booking', 'query', 'admin'

      // GAS Web App URL state pre-configured with user's endpoint
      const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbwYPD1R7pq3boSvrZUcVYLHT9CARhtDLJjVDOcPF8zZO9dbIFWQZJmmN56KFE9ok__SkQ/exec';
      const [gasUrl, setGasUrl] = useState(() => { localStorage.setItem('gas_web_app_url', DEFAULT_GAS_URL); return DEFAULT_GAS_URL; });
      const [isSyncingGas, setIsSyncingGas] = useState(false);
      const [syncMessage, setSyncMessage] = useState('');

      const [bookings, setBookings] = useState(() => {
        const saved = localStorage.getItem('bulky_furniture_bookings');
        return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
      });

      // Sync to localStorage as local cache
      useEffect(() => {
        const lightweightBookings = bookings.map((b) => ({ ...b, photos: (b.photos || []).filter((url) => !String(url).startsWith('data:')) }));
        localStorage.setItem('bulky_furniture_bookings', JSON.stringify(lightweightBookings));
      }, [bookings]);

      // Fetch from Google Sheets if GAS URL is configured
      const fetchFromGoogleSheets = async () => {
        if (!gasUrl) return;
        setIsSyncingGas(true);
        try {
          const res = await fetch(gasUrl);
          const json = await res.json();
          if (json.status === 'success' && json.data && Array.isArray(json.data) && json.data.length > 0) {
            setBookings(json.data);
            setSyncMessage(`已成功從 Google 試算表同步 ${json.data.length} 筆資料`);
          }
        } catch (e) {
          console.error('GAS Fetch Error:', e);
        } finally {
          setIsSyncingGas(false);
        }
      };

      useEffect(() => {
        let intervalId;
        if (gasUrl) {
          fetchFromGoogleSheets();
          // 每 60 秒自動從 Google Sheets 拉取最新資料 (Auto Pull)
          intervalId = setInterval(() => {
            fetchFromGoogleSheets();
          }, 60000);
        }
      return () => {
          if (intervalId) clearInterval(intervalId);
        };
      }, [gasUrl]);

      // Modal States
      const [successBooking, setSuccessBooking] = useState(null);
      const [printableBooking, setPrintableBooking] = useState(null);
      // Form State
      const [applicantName, setApplicantName] = useState('');
      const [phone, setPhone] = useState('');
      const [email, setEmail] = useState('');
      const [county, setCounty] = useState('苗栗縣');
      const [district, setDistrict] = useState('三義鄉');
      const [detailAddress, setDetailAddress] = useState('');
      const [selectedItems, setSelectedItems] = useState([]);
      const [photos, setPhotos] = useState([]);
      const defaultDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const [preferredDate, setPreferredDate] = useState(defaultDate);
      const [preferredTimeSlot, setPreferredTimeSlot] = useState('上午8點至12點');
      const [locationNote, setLocationNote] = useState('');
      const [agreedTerms, setAgreedTerms] = useState([]);
      const [errors, setErrors] = useState({});
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [submitSecondsLeft, setSubmitSecondsLeft] = useState(0);

      // Query Search state
      const [searchQuery, setSearchQuery] = useState('');
      const [searchResults, setSearchResults] = useState([]);
      const [hasSearched, setHasSearched] = useState(false);

      // 支援標籤 QR Code 深層連結：掃描後直接開啟對應案件查詢結果。
      useEffect(() => {
        const bookingId = new URLSearchParams(window.location.search).get('booking');
        if (!bookingId || bookings.length === 0) return;
        const matchedBookings = bookings.filter((booking) => String(booking.id) === bookingId);
        setActiveTab('query');
        setSearchQuery(bookingId);
        setSearchResults(matchedBookings);
        setHasSearched(true);
      }, [bookings]);



      // Item quantity control
      const handleItemQtyChange = (catId, delta) => {
        setSelectedItems((prev) => {
          const found = prev.find((i) => i.categoryId === catId);
          if (found) {
            const nextQty = found.quantity + delta;
            if (nextQty <= 0) return prev.filter((i) => i.categoryId !== catId);
            return prev.map((i) => (i.categoryId === catId ? { ...i, quantity: nextQty } : i));
          } else if (delta > 0) {
            const catObj = CATEGORIES.find((c) => c.id === catId);
            return [...prev, { categoryId: catId, categoryName: catObj.name, name: catObj.name, quantity: 1, note: '' }];
          }
          return prev;
        });
      };

      const getItemQty = (catId) => {
        const found = selectedItems.find((i) => i.categoryId === catId);
        return found ? found.quantity : 0;
      };
      const getItemNote = (catId) => selectedItems.find((i) => i.categoryId === catId)?.note || '';
      const handleItemNoteChange = (catId, note) => setSelectedItems((prev) => prev.map((i) => i.categoryId === catId ? { ...i, note, name: catId === 'other' ? (note || '其他') : i.name } : i));

      // Photo Drag & Drop
      const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        files.forEach((file) => {
          if (!file.type.startsWith('image/')) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const image = new Image();
            image.onload = () => {
              const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
              const canvas = document.createElement('canvas');
              canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
              canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
              setPhotos((prev) => [...prev, { id: Date.now() + Math.random(), name: file.name.replace(/\.[^.]+$/, '') + '.jpg', url: canvas.toDataURL('image/jpeg', 0.84) }]);
            };
            image.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        });
      };



      // Terms Agreement Toggle
      const isAllTermsAgreed = TERMS_LIST.every((t) => agreedTerms.includes(t.id));
      const handleToggleTerm = (id) => {
        if (agreedTerms.includes(id)) {
          setAgreedTerms(agreedTerms.filter((i) => i !== id));
        } else {
          setAgreedTerms([...agreedTerms, id]);
        }
      };

      // Form Validation & Submission
      const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        const errs = {};
        if (!applicantName.trim()) errs.applicantName = '請輸入申請人姓名';
        if (!phone.trim()) errs.phone = '請輸入聯絡電話';
        else if (!/^09\d{2}-?\d{6}$/.test(phone.trim()) && !/^0\d{1,2}-?\d{6,8}$/.test(phone.trim())) {
          errs.phone = '請輸入正確格式電話（如 0912-345678 或 037-123456）';
        }
        if (!detailAddress.trim()) errs.detailAddress = '請填寫詳細清運地址';
        if (selectedItems.length === 0) errs.items = '請至少選擇一項待清運傢俱項目';
        if (agreedTerms.length < TERMS_LIST.length) errs.terms = '需全數同意 5 項申請聲明與規定';

        setErrors(errs);
        if (Object.keys(errs).length > 0) {
          window.scrollTo({ top: 120, behavior: 'smooth' });
          return;
        }

        const estimatedSeconds = photos.length > 0 ? Math.min(10, 2 + photos.length * 2) : 1;
        setIsSubmitting(true);
        setSubmitSecondsLeft(estimatedSeconds);
        const countdownTimer = setInterval(() => setSubmitSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000);
        await new Promise((resolve) => setTimeout(resolve, 50));

        const bookingDate = new Date();
        const bookingPrefix = `${bookingDate.getFullYear() - 1911}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}${String(bookingDate.getDate()).padStart(2, '0')}-`;
        const dailySequences = bookings
          .filter((booking) => String(booking.id || '').startsWith(bookingPrefix))
          .map((booking) => Number(String(booking.id).slice(bookingPrefix.length)))
          .filter(Number.isFinite);
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
          statusTimeline: [{ status: '已收件', time: getMinguoTime() }],
          createdAt: getMinguoTime(),
          agreedToTerms: true
        };

        // Guaranteed Sync to Google Sheets via GET parameter request
        if (gasUrl) {
          try {
            // GAS 的 createBooking 目前由 doGet 處理；Base64 圖片不可放進 URL，僅傳送表單欄位。
            const sheetBooking = { ...newBooking, photos: [] };
            const syncUrl = gasUrl + '?action=createBooking&data=' + encodeURIComponent(JSON.stringify(sheetBooking));
            await Promise.race([
              fetch(syncUrl, { mode: 'no-cors' }),
              new Promise((resolve) => setTimeout(resolve, estimatedSeconds * 1000))
            ]);
            await Promise.race([
              Promise.all(photos.map((photo, index) => fetch(gasUrl, {
                method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'uploadBookingPhoto', id: bookingId, fileBase64: photo.url, fileName: `${bookingId}-${index + 1}.jpg` })
              }))),
              new Promise((resolve) => setTimeout(resolve, estimatedSeconds * 1000))
            ]);
          } catch (e) {
            console.error('GAS Sync Error:', e);
          }
        }

        try {
          await new Promise((resolve) => setTimeout(resolve, 250));
          setBookings((prev) => [newBooking, ...prev]);
          setSuccessBooking(newBooking);
          setApplicantName(''); setPhone(''); setEmail(''); setCounty('苗栗縣'); setDistrict('三義鄉');
          setDetailAddress(''); setSelectedItems([]); setPhotos([]); setPreferredDate(defaultDate);
          setPreferredTimeSlot('上午8點至12點'); setLocationNote(''); setAgreedTerms([]); setErrors({}); setActiveTab('booking');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
          clearInterval(countdownTimer);
          setSubmitSecondsLeft(0);
          setIsSubmitting(false);
        }
      };

      // Search Query Logic
      const handleSearchSubmit = (e) => {
        e.preventDefault();
        const q = searchQuery.trim().toLowerCase();
        if (!q) return;
        const res = bookings.filter(
          (b) =>
            b.id.toLowerCase().includes(q) ||
            b.phone.replaceAll('-', '').includes(q.replaceAll('-', '')) ||
            b.applicantName.includes(q)
        );
        setSearchResults(res);
        setHasSearched(true);
      };
      const viewProps = { activeTab, setActiveTab, applicantName, setApplicantName, phone, setPhone, email, setEmail, county, setCounty, district, setDistrict, detailAddress, setDetailAddress, selectedItems, photos, setPhotos, preferredDate, setPreferredDate, preferredTimeSlot, setPreferredTimeSlot, locationNote, setLocationNote, setAgreedTerms, errors, isSubmitting, submitSecondsLeft, handleItemQtyChange, getItemQty, getItemNote, handleItemNoteChange, handleFileUpload, isAllTermsAgreed, handleFormSubmit, CATEGORIES, COUNTIES, DISTRICTS_BY_COUNTY, TERMS_LIST, formatMinguoDate, formatTaiwanPhone, setPrintableBooking, searchQuery, setSearchQuery, searchResults, hasSearched, handleSearchSubmit, gasUrl, successBooking, setSuccessBooking, printableBooking, QRCodeBox };

      return (
        <div className="civic-shell min-h-screen flex flex-col">

          <Header {...viewProps} />

          {/* Main Content View */}
          <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-12 no-print">

            <BookingView {...viewProps} />

          <BookingQueryView {...viewProps} />

          </main>

          <BookingSuccessModal {...viewProps} />

          <PrintableTagModal {...viewProps} />

          <Footer />
        </div>
      );
    }
