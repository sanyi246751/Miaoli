import { useState, useEffect } from 'react';
import AdminHeader from './components/AdminHeader.jsx';
import CaseManagementView from './components/CaseManagementView.jsx';
import DashboardView from './components/DashboardView.jsx';
import CompletionPhotoModal from './components/CompletionPhotoModal.jsx';
import PrintableTagModal from './components/PrintableTagModal.jsx';
import AdminFooter from './components/AdminFooter.jsx';
import QRCodeBox from './components/QRCodeBox.jsx';
import { formatMinguoDate, getMinguoCompactStr, getMinguoTime } from './utils/formatters.js';

    // Main App Component
    export default function AdminApp() {
      const DISPATCH_ORIGIN = '24.38098913508549,120.73429901439242';
      const [activeTab, setActiveTab] = useState('admin'); // 獨立後台頁面
      const [vehicleSelections, setVehicleSelections] = useState({});
      const [tripSelections, setTripSelections] = useState({});
      const [appointmentTimeEditor, setAppointmentTimeEditor] = useState(null);
      const [vehicles, setVehicles] = useState(() => { try { const saved = JSON.parse(localStorage.getItem('recycling_vehicles') || '["A","B"]'); const valid = Array.isArray(saved) ? saved.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()) : []; return valid.length ? valid : ['A', 'B']; } catch (e) { return ['A', 'B']; } });
      const [showVehicleManager, setShowVehicleManager] = useState(false);
      const [newVehicle, setNewVehicle] = useState('');
      const [routeEditor, setRouteEditor] = useState(null);
      const [routeCalculations, setRouteCalculations] = useState(() => { try { return JSON.parse(localStorage.getItem('recycling_route_calculations') || '{}'); } catch (e) { return {}; } });
      const [customRoutes, setCustomRoutes] = useState(() => { try { return JSON.parse(localStorage.getItem('recycling_custom_routes') || '{}'); } catch (e) { return {}; } });
      const getDispatchDate = (booking) => booking.adjustedDate || booking.preferredDate;
      const getDispatchPeriod = (booking) => booking.adjustedPeriod || String(booking.preferredTimeSlot || '未指定時段').trim().split(/\s+/)[0];
      const getDispatchTrip = (booking) => Number(booking.dispatchTrip || 1);
      const getRouteKey = (booking) => getDispatchDate(booking) + '|' + booking.assignedVehicle + '|' + getDispatchPeriod(booking) + '|' + getDispatchTrip(booking);
      const getNextDispatchTrip = (booking, vehicle) => {
        if (!vehicle) return 1;
        const trips = bookings.filter((item) => item.id !== booking.id && item.status === '已排班' && getDispatchDate(item) === getDispatchDate(booking) && item.assignedVehicle === vehicle && getDispatchPeriod(item) === getDispatchPeriod(booking)).map(getDispatchTrip);
        return trips.length ? Math.max(...trips) + 1 : 1;
      };
      const getDispatchChoices = (booking, vehicle) => {
        if (!vehicle) return [];
        const existingTrips = [...new Set(bookings.filter((item) => item.id !== booking.id && item.status === '已排班' && getDispatchDate(item) === getDispatchDate(booking) && item.assignedVehicle === vehicle && getDispatchPeriod(item) === getDispatchPeriod(booking)).map(getDispatchTrip))].sort((a, b) => a - b);
        if (!existingTrips.length) return [{ trip: 1, mode: 'new' }];
        const previousTrip = existingTrips[existingTrips.length - 1];
        return [{ trip: previousTrip, mode: 'merge' }, { trip: previousTrip + 1, mode: 'new' }];
      };
      const getDispatchTimeLabel = (booking) => {
        const raw = String(booking.preferredTimeSlot || '').trim();
        const period = getDispatchPeriod(booking);
        if (booking.adjustedPeriod) return booking.adjustedPeriod;
        const match = raw.match(/(\d{1,2}):(\d{2})\s*[-~～至]\s*(\d{1,2}):(\d{2})/);
        if (!match) return raw.replace(/\s+/g, '') || period;
        const formatTime = (hour, minute) => Number(minute) === 0 ? Number(hour) + '點' : Number(hour) + '點' + minute + '分';
        return period + formatTime(match[1], match[2]) + '至' + formatTime(match[3], match[4]);
      };
      const getDispatchLabel = (booking, vehicle = booking.assignedVehicle, trip = getDispatchTrip(booking)) => vehicle ? vehicle + '車' + getDispatchTimeLabel(booking) + '第' + trip + '班' : '';
      const getDistrictName = (booking) => String(booking.district || '').trim().replace(/^(?:苗栗縣)+/, '');
      const getCountyDistrict = (booking) => '苗栗縣' + getDistrictName(booking);
      const getLocalAddress = (booking) => {
        const original = String(booking.address || '').trim();
        const local = original.replace(/^(?:苗栗縣)+/, '').replace(new RegExp('^' + getDistrictName(booking)), '').trim();
        return local || original;
      };
      const saveVehicleCache = (next) => { setVehicles(next); localStorage.setItem('recycling_vehicles', JSON.stringify(next)); };
      
      // GAS Web App URL state pre-configured with user's endpoint
      const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbwYPD1R7pq3boSvrZUcVYLHT9CARhtDLJjVDOcPF8zZO9dbIFWQZJmmN56KFE9ok__SkQ/exec';
      const [gasUrl, setGasUrl] = useState(() => { localStorage.setItem('gas_web_app_url', DEFAULT_GAS_URL); return DEFAULT_GAS_URL; });
      const [isSyncingGas, setIsSyncingGas] = useState(false);
      const [syncMessage, setSyncMessage] = useState('');
      const [caseListView, setCaseListView] = useState('active');
      const [dashboardPeriod, setDashboardPeriod] = useState('all');
      const [dashboardView, setDashboardView] = useState('status');
      const [dashboardDetailType, setDashboardDetailType] = useState('collected');
      const [dashboardKeyword, setDashboardKeyword] = useState('');
      const loadVehicles = async () => { if (!gasUrl) return; try { const response = await fetch(gasUrl + '?action=getVehicles'); const result = await response.json(); const valid = Array.isArray(result.data) ? result.data.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()) : []; if (result.status === 'success' && result.resource === 'vehicles' && valid.length) saveVehicleCache(valid); } catch (error) { console.error('Vehicle Fetch Error:', error); } };
      const addVehicle = async () => { const value = newVehicle.trim(); if (!value) return; if (vehicles.some((item) => item.toLowerCase() === value.toLowerCase())) { window.alert('此車號已存在。'); return; } try { const response = await fetch(gasUrl + '?action=addVehicle&vehicle=' + encodeURIComponent(value)); const result = await response.json(); if (result.status !== 'success' || result.resource !== 'vehicles') throw new Error(result.resource !== 'vehicles' ? 'GAS 尚未部署車輛管理新版，請重新部署網頁應用程式。' : result.message); setNewVehicle(''); await loadVehicles(); } catch (error) { window.alert('新增車號失敗：' + error.message); } };
      const removeVehicle = async (vehicle) => { if (vehicles.length <= 1) { window.alert('至少需要保留一台車。'); return; } if (!window.confirm('確定移除車號「' + vehicle + '」？已排班案件仍會保留原車號。')) return; try { const response = await fetch(gasUrl + '?action=deleteVehicle&vehicle=' + encodeURIComponent(vehicle)); const result = await response.json(); if (result.status !== 'success' || result.resource !== 'vehicles') throw new Error(result.resource !== 'vehicles' ? 'GAS 尚未部署車輛管理新版，請重新部署網頁應用程式。' : result.message); await loadVehicles(); } catch (error) { window.alert('移除車號失敗：' + error.message); } };

      useEffect(() => { loadVehicles(); }, [gasUrl]);

      const [bookings, setBookings] = useState(() => {
        const saved = localStorage.getItem('bulky_furniture_bookings');
        return saved ? JSON.parse(saved) : [];
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
            setBookings((current) => json.data.map((remoteBooking) => {
              const localBooking = current.find((item) => item.id === remoteBooking.id);
              if (!localBooking?.assignedVehicle) return remoteBooking;
              return {
                ...remoteBooking,
                assignedVehicle: localBooking.assignedVehicle,
                dispatchTrip: localBooking.dispatchTrip || 1,
                dispatchOrigin: localBooking.dispatchOrigin,
                suggestedRouteUrl: localBooking.suggestedRouteUrl,
                adjustedDate: localBooking.adjustedDate || remoteBooking.adjustedDate || '',
                adjustedPeriod: localBooking.adjustedPeriod || remoteBooking.adjustedPeriod || ''
              };
            }));
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
      const [printableBooking, setPrintableBooking] = useState(null);
      const [completionModalBooking, setCompletionModalBooking] = useState(null); // Sanitation Photo Completion Modal
      const [photoPreview, setPhotoPreview] = useState(null);
      const getPhotoPreviewUrl = (url) => {
        const value = String(url || '');
        if (!value.includes('drive.google.com')) return value;
        const match = value.match(/\/d\/([-\w]{20,})/) || value.match(/[?&]id=([-\w]{20,})/) || value.match(/[-\w]{25,}/);
        return match ? 'https://drive.google.com/thumbnail?id=' + (match[1] || match[0]) + '&sz=w1600' : value;
      };

      // Admin Auth State
      const ADMIN_SESSION_MS = 30 * 60 * 1000;
      const [isAdminAuth, setIsAdminAuth] = useState(() => Number(localStorage.getItem('admin_auth_until') || 0) > Date.now());
      const [adminPasswordInput, setAdminPasswordInput] = useState('');
      const [isCheckingPassword, setIsCheckingPassword] = useState(false);
      const [loginError, setLoginError] = useState('');

      const handleAdminLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        if (!gasUrl) {
          if (adminPasswordInput === 'admin') {
            setIsAdminAuth(true);
            localStorage.setItem('admin_auth_until', String(Date.now() + ADMIN_SESSION_MS));
            setAdminPasswordInput('');
          } else {
            setLoginError('密碼錯誤 (Local Mode: 預設為 admin)');
          }
          return;
        }

        setIsCheckingPassword(true);
        try {
          const checkUrl = gasUrl + '?action=verifyPassword&password=' + encodeURIComponent(adminPasswordInput);
          const res = await fetch(checkUrl);
          const json = await res.json();
          if (json.status === 'success' && json.valid) {
            setIsAdminAuth(true);
            localStorage.setItem('admin_auth_until', String(Date.now() + ADMIN_SESSION_MS));
            setAdminPasswordInput('');
          } else {
            setLoginError('密碼錯誤，請重新輸入。');
          }
        } catch (e) {
          console.error('Login Error:', e);
          setLoginError('連線驗證失敗，請檢查網路或 GAS 設定。');
        } finally {
          setIsCheckingPassword(false);
        }
      };

      // 後台登入狀態保留 30 分鐘，逾時才自動登出。
      useEffect(() => {
        const checkAdminSession = () => {
          if (Number(localStorage.getItem('admin_auth_until') || 0) <= Date.now()) {
            setIsAdminAuth(false);
            localStorage.removeItem('admin_auth_until');
          }
        };
        checkAdminSession();
        const timer = setInterval(checkAdminSession, 30000);
        return () => clearInterval(timer);
      }, []);

      const [quantityDrafts, setQuantityDrafts] = useState({});
      const [quantitySaving, setQuantitySaving] = useState('');
      const [quantityEditing, setQuantityEditing] = useState({});
      const [aiSaving, setAiSaving] = useState('');

      // Completion Photo Upload State for Sanitation Worker
      const [completionPhotos, setCompletionPhotos] = useState([]);
      const [completionNote, setCompletionNote] = useState('隊員已現場載運完畢，路面恢復清潔並拍攝照片結案。');
      const [isUploadingDrive, setIsUploadingDrive] = useState(false);
      const [completionUploadSecondsLeft, setCompletionUploadSecondsLeft] = useState(0);

      // Admin Status Update (Bulletproof GAS Sync)
      const handleAdminUpdateStatus = (id, newStatus, note = '') => {
        const nowTime = getMinguoTime();
        setBookings((prev) =>
          prev.map((b) => {
            if (b.id === id) {
              return {
                ...b,
                status: newStatus,
                statusTimeline: [...(b.statusTimeline || []), { status: newStatus, time: nowTime, note }]
              };
            }
            return b;
          })
        );

        if (gasUrl) {
          try {
            const syncUrl = gasUrl + '?action=updateStatus&id=' + encodeURIComponent(id) + '&newStatus=' + encodeURIComponent(newStatus) + '&note=' + encodeURIComponent(note);
            fetch(syncUrl, { mode: 'no-cors' }).catch(err => console.log(err));
          } catch (e) {
            console.error('GAS Update Error:', e);
          }
        }
      };

      const getRouteBookings = (booking) => bookings.filter((item) => getDispatchDate(item) === getDispatchDate(booking) && item.assignedVehicle === booking.assignedVehicle && getDispatchPeriod(item) === getDispatchPeriod(booking) && getDispatchTrip(item) === getDispatchTrip(booking) && item.status === '已排班');

      const buildRouteUrl = (orderedBookings) => {
        const stops = orderedBookings.map((item) => item.mapAddress || item.address).filter(Boolean);
        const destination = stops[stops.length - 1];
        const waypoints = stops.slice(0, -1);
        return 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(DISPATCH_ORIGIN) + '&destination=' + encodeURIComponent(destination) + (waypoints.length ? '&waypoints=' + encodeURIComponent(waypoints.join('|')) : '') + '&travelmode=driving';
      };

      const getCoordinates = (item) => {
        if (Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude))) return [Number(item.latitude), Number(item.longitude)];
        const match = String(item.mapLink || '').match(/(?:@|query=)(-?\d+\.\d+)[,%2C]+\s*(-?\d+\.\d+)/i);
        return match ? [Number(match[1]), Number(match[2])] : null;
      };

      const getRecommendedOrder = (items) => {
        if (!items.every(getCoordinates)) return [...items].sort((a, b) => ((a.district || '') + (a.address || '')).localeCompare((b.district || '') + (b.address || ''), 'zh-Hant'));
        const remaining = [...items]; const ordered = []; let current = DISPATCH_ORIGIN.split(',').map(Number);
        while (remaining.length) {
          remaining.sort((a, b) => { const ca = getCoordinates(a); const cb = getCoordinates(b); return Math.hypot(ca[0] - current[0], ca[1] - current[1]) - Math.hypot(cb[0] - current[0], cb[1] - current[1]); });
          const next = remaining.shift(); ordered.push(next); current = getCoordinates(next);
        }
        return ordered;
      };
      const estimateRouteKm = (items) => {
        if (!items.length || !items.every(getCoordinates)) return '';
        const points = [DISPATCH_ORIGIN.split(',').map(Number), ...items.map(getCoordinates)]; const radians = (value) => value * Math.PI / 180;
        const straightKm = points.slice(1).reduce((sum, point, index) => { const prev = points[index]; const dLat = radians(point[0] - prev[0]); const dLng = radians(point[1] - prev[1]); const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(prev[0])) * Math.cos(radians(point[0])) * Math.sin(dLng / 2) ** 2; return sum + 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); }, 0);
        return (straightKm * 1.25).toFixed(1);
      };
      const getRouteCarbon = (booking) => {
        const calculation = routeCalculations[getRouteKey(booking)];
        if (calculation?.status === 'calculating') return '路程計算中…';
        if (calculation?.distanceKm) return calculation.distanceKm.toFixed(1) + ' km／' + calculation.carbonKg.toFixed(2) + ' kg CO₂e';
        return calculation?.error || '路程待計算';
      };
      const getCustomRouteCarbon = (booking) => { const value = customRoutes[getRouteKey(booking)]?.calculation; if (value?.status === 'calculating') return '計算中…'; return value?.distanceKm ? Number(value.distanceKm).toFixed(1) + ' km／' + Number(value.carbonKg).toFixed(2) + ' kg CO₂e' : '尚未自訂'; };

      const getSuggestedRouteUrl = (booking) => {
        const routeBookings = booking.assignedVehicle ? getRouteBookings(booking) : [booking];
        const recommendedOrder = getRecommendedOrder(routeBookings);
        return buildRouteUrl(recommendedOrder);
      };

      useEffect(() => {
        const groups = new Map();
        bookings.filter((item) => item.status === '已排班' && item.assignedVehicle).forEach((item) => { const key = getRouteKey(item); groups.set(key, [...(groups.get(key) || []), item]); });
        groups.forEach((items, key) => {
          const signature = items.map((item) => item.id + ':' + item.address).sort().join('|');
          if ((routeCalculations[key]?.signature === signature && routeCalculations[key]?.status === 'done') || routeCalculations[key]?.status === 'calculating') return;
          setRouteCalculations((current) => ({ ...current, [key]: { status: 'calculating', signature } }));
          (async () => {
            try {
              if (!gasUrl) throw new Error('尚未設定 GAS Web App');
              const addresses = getRecommendedOrder(items).map((item) => (item.district || '') + (item.address || '')); const response = await fetch(gasUrl + '?action=calculateRoute&optimize=true&addresses=' + encodeURIComponent(JSON.stringify(addresses))); const result = await response.json();
              if (result.status !== 'success') throw new Error(result.message || '無法取得 Google 行車路線');
              const value = { status: 'done', signature, distanceKm: Number(result.distanceKm), carbonKg: Number(result.carbonKg), durationMinutes: Number(result.durationMinutes) };
              setRouteCalculations((current) => { const next = { ...current, [key]: value }; localStorage.setItem('recycling_route_calculations', JSON.stringify(next)); return next; });
            } catch (error) { setRouteCalculations((current) => ({ ...current, [key]: { status: 'error', signature, error: error.message || '路程計算失敗' } })); }
          })();
        });
      }, [bookings]);

      const calculateCustomRoute = async (booking, stops) => { const key = getRouteKey(booking); setCustomRoutes((current) => ({ ...current, [key]: { stopIds: stops.map((item) => item.id), calculation: { status: 'calculating' } } })); try { if (!gasUrl) throw new Error('尚未設定 GAS Web App'); const addresses = stops.map((item) => (item.district || '') + (item.address || '')); const response = await fetch(gasUrl + '?action=calculateRoute&optimize=false&addresses=' + encodeURIComponent(JSON.stringify(addresses))); const result = await response.json(); if (result.status !== 'success') throw new Error(result.message); const entry = { stopIds: stops.map((item) => item.id), calculation: { status: 'done', distanceKm: result.distanceKm, carbonKg: result.carbonKg, durationMinutes: result.durationMinutes } }; setCustomRoutes((current) => { const next = { ...current, [key]: entry }; localStorage.setItem('recycling_custom_routes', JSON.stringify(next)); return next; }); setRouteEditor((current) => current ? { ...current, distanceKm: Number(result.distanceKm).toFixed(1), fuelEfficiency: '5' } : current); } catch (error) { setCustomRoutes((current) => ({ ...current, [key]: { stopIds: stops.map((item) => item.id), calculation: { status: 'error', error: error.message } } })); } };
      const openRouteEditor = (booking) => { const available = getRouteBookings(booking); const saved = customRoutes[getRouteKey(booking)]; const stops = saved?.stopIds ? saved.stopIds.map((id) => available.find((item) => item.id === id)).filter(Boolean).concat(available.filter((item) => !saved.stopIds.includes(item.id))) : getRecommendedOrder(available); setRouteEditor({ booking, stops, distanceKm: saved?.calculation?.distanceKm ? Number(saved.calculation.distanceKm).toFixed(1) : '', fuelEfficiency: '5' }); if (!saved?.calculation?.distanceKm) calculateCustomRoute(booking, stops); };
      const moveRouteStop = (index, direction) => { if (!routeEditor) return; const nextIndex = index + direction; if (nextIndex < 0 || nextIndex >= routeEditor.stops.length) return; const stops = [...routeEditor.stops]; [stops[index], stops[nextIndex]] = [stops[nextIndex], stops[index]]; setRouteEditor({ ...routeEditor, stops, distanceKm: '' }); calculateCustomRoute(routeEditor.booking, stops); };

      const saveAppointmentTime = async (booking) => {
        if (!appointmentTimeEditor?.date || !appointmentTimeEditor?.period) return;
        const nextDate = appointmentTimeEditor.date;
        const nextPeriod = appointmentTimeEditor.period;
        const previousDate = booking.adjustedDate || '';
        const previousPeriod = booking.adjustedPeriod || '';
        setBookings((current) => current.map((item) => item.id === booking.id ? { ...item, adjustedDate: nextDate, adjustedPeriod: nextPeriod } : item));
        setAppointmentTimeEditor(null);
        try {
          const response = await fetch(gasUrl + '?action=updateAppointmentTime&id=' + encodeURIComponent(booking.id) + '&date=' + encodeURIComponent(nextDate) + '&period=' + encodeURIComponent(nextPeriod));
          const result = await response.json();
          if (result.status !== 'success') throw new Error(result.message || '修改失敗');
          setBookings((current) => current.map((item) => item.id === booking.id ? { ...item, adjustedDate: result.adjustedDate, adjustedPeriod: result.adjustedPeriod } : item));
        } catch (error) {
          setBookings((current) => current.map((item) => item.id === booking.id ? { ...item, adjustedDate: previousDate, adjustedPeriod: previousPeriod } : item));
          setAppointmentTimeEditor({ id: booking.id, date: nextDate, period: nextPeriod });
          window.alert('修改案件時間同步失敗，已還原原時間：' + error.message);
        }
      };

      const handleScheduleBooking = (booking) => {
        const vehicle = vehicleSelections[booking.id] || (booking.status === '已取消' ? '' : booking.assignedVehicle);
        const dispatchTrip = Number(tripSelections[booking.id] || getNextDispatchTrip(booking, vehicle));
        if (!vehicle) return;
        const note = '已排定 ' + getDispatchLabel(booking, vehicle, dispatchTrip);
        const nowTime = getMinguoTime();
        setBookings((prev) => prev.map((b) => b.id === booking.id ? {
          ...b,
          status: '已排班',
          assignedVehicle: vehicle,
          dispatchTrip,
          dispatchOrigin: DISPATCH_ORIGIN,
          suggestedRouteUrl: getSuggestedRouteUrl({ ...b, assignedVehicle: vehicle, dispatchTrip }),
          statusTimeline: [...(b.statusTimeline || []), { status: '已排班', time: nowTime, note }]
        } : b));
        if (gasUrl) {
          const scheduleData = { assignedVehicle: vehicle, dispatchTrip, applicantPreferredTimeSlot: booking.preferredTimeSlot };
          const syncUrl = gasUrl + '?action=updateStatus&id=' + encodeURIComponent(booking.id) + '&newStatus=' + encodeURIComponent('已排班') + '&note=' + encodeURIComponent(note + '；出車起點 ' + DISPATCH_ORIGIN) + '&scheduleData=' + encodeURIComponent(JSON.stringify(scheduleData));
          fetch(syncUrl, { mode: 'no-cors' }).catch(err => console.log(err));
        }
      };

      const handleConfirmQuantity = async (booking) => {
        const declaredTotal = (booking.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        const quantity = Number(quantityDrafts[booking.id] ?? booking.confirmedQuantity ?? declaredTotal);
        if (!Number.isInteger(quantity) || quantity < 0) { window.alert('請填寫 0 以上的正確整數件數。'); return; }
        setQuantitySaving(booking.id);
        try {
          const response = await fetch(gasUrl + '?action=confirmQuantity&id=' + encodeURIComponent(booking.id) + '&quantity=' + quantity + '&note=' + encodeURIComponent('後台人工確認物件數量'));
          const result = await response.json();
          if (result.status !== 'success') throw new Error(result.message || '覆核失敗');
          setBookings((current) => current.map((item) => item.id === booking.id ? {
            ...item,
            quantityReviewStatus: result.quantityReviewStatus,
            confirmedQuantity: result.confirmedQuantity,
            annualApprovedApplications: result.annualApprovedApplications,
            chargeableQuantity: result.chargeableQuantity,
            amountDue: result.amountDue
          } : item));
          setQuantityDrafts((current) => ({ ...current, [booking.id]: quantity }));
          setQuantityEditing((current) => ({ ...current, [booking.id]: false }));
        } catch (error) { window.alert('數量覆核失敗：' + error.message); }
        finally { setQuantitySaving(''); }
      };

      const handleRetryAi = async (booking) => {
        setAiSaving(booking.id);
        try {
          const response = await fetch(gasUrl + '?action=analyzeBookingPhotos&id=' + encodeURIComponent(booking.id));
          const result = await response.json();
          setBookings((current) => current.map((item) => item.id === booking.id ? {
            ...item,
            aiReview: result.aiReview ?? item.aiReview,
            quantityReviewStatus: result.quantityReviewStatus ?? item.quantityReviewStatus,
            confirmedQuantity: result.confirmedQuantity ?? item.confirmedQuantity,
            annualApprovedApplications: result.annualApprovedApplications ?? item.annualApprovedApplications,
            chargeableQuantity: result.chargeableQuantity ?? item.chargeableQuantity,
            amountDue: result.amountDue ?? item.amountDue
          } : item));
          if (result.status !== 'success' && result.status !== 'retry_scheduled') throw new Error(result.message || '辨識失敗');
        } catch (error) { window.alert('AI 重新辨識失敗：' + error.message); }
        finally { setAiSaving(''); }
      };

      const handleAdminStatusChange = (booking, newStatus) => {
        if (newStatus === '已排班') {
          if (!(vehicleSelections[booking.id] || (booking.status === '已取消' ? '' : booking.assignedVehicle))) {
            window.alert('請先選擇車號，再將狀態改為已排班。');
            return;
          }
          handleScheduleBooking(booking);
          return;
        }
        handleAdminUpdateStatus(booking.id, newStatus, '後台手動變更狀態為' + newStatus);
      };

      const handleCancelSchedule = (booking) => {
        const nowTime = getMinguoTime();
        const note = '取消原排班，案件退回待處理';
        setBookings((current) => current.map((item) => item.id === booking.id ? {
          ...item,
          status: '待處理',
          assignedVehicle: '',
          dispatchTrip: null,
          dispatchOrigin: '',
          suggestedRouteUrl: '',
          statusTimeline: [...(item.statusTimeline || []), { status: '待處理', time: nowTime, note }]
        } : item));
        setVehicleSelections((current) => ({ ...current, [booking.id]: '' }));
        setTripSelections((current) => ({ ...current, [booking.id]: 1 }));
        if (gasUrl) {
          const syncUrl = gasUrl + '?action=updateStatus&id=' + encodeURIComponent(booking.id) + '&newStatus=' + encodeURIComponent('待處理') + '&note=' + encodeURIComponent(note);
          fetch(syncUrl, { mode: 'no-cors' }).catch((error) => console.error('Cancel Schedule Sync Error:', error));
        }
      };

      // Sanitation Photo Upload Completion Handler (Google Drive Upload)
      const handleCompletionPhotoFileChange = (e) => {
        const availableCount = Math.max(0, 2 - completionPhotos.length);
        const files = Array.from(e.target.files || []).filter((file) => file.type.startsWith('image/')).slice(0, availableCount);
        if (!files.length) return;
        Promise.all(files.map((file) => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const image = new Image();
            image.onload = () => {
              const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
              const canvas = document.createElement('canvas');
              canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
              canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
              resolve({ id: Date.now() + Math.random(), url: canvas.toDataURL('image/jpeg', 0.84), name: file.name.replace(/\.[^.]+$/, '') + '.jpg' });
            };
            image.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        }))).then((newPhotos) => setCompletionPhotos((current) => [...current, ...newPhotos].slice(0, 2)));
        e.target.value = '';
      };



      const handleSubmitCompletionModal = async () => {
        if (!completionModalBooking) return;
        setIsUploadingDrive(true);
        const estimatedUploadSeconds = Math.min(15, 3 + completionPhotos.length * 4);
        setCompletionUploadSecondsLeft(estimatedUploadSeconds);
        const uploadCountdownTimer = setInterval(() => setCompletionUploadSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000);

        const bookingId = completionModalBooking.id;
        const nowTime = getMinguoTime();
        const routeKey = getRouteKey(completionModalBooking);
        const customCalculation = customRoutes[routeKey]?.calculation;
        const bestCalculation = routeCalculations[routeKey];
        const selectedCalculation = customCalculation?.status === 'done' ? customCalculation : bestCalculation?.status === 'done' ? bestCalculation : null;
        const completionRoute = selectedCalculation ? {
          routeType: customCalculation?.status === 'done' ? '自訂路線' : '建議最佳路線',
          vehicle: completionModalBooking.assignedVehicle || '',
          dispatchPeriod: getDispatchPeriod(completionModalBooking),
          dispatchTrip: getDispatchTrip(completionModalBooking),
          distanceKm: Number(selectedCalculation.distanceKm),
          carbonKg: Number(selectedCalculation.carbonKg),
          durationMinutes: Number(selectedCalculation.durationMinutes || 0)
        } : null;

        // Update local state first
        setBookings((prev) =>
          prev.map((b) => {
            if (b.id === bookingId) {
              const timelineItem = {
                status: '清運完成',
                time: nowTime,
                note: completionNote,
                drivePhotoUrl: completionPhotos[0]?.url || '',
                drivePhotoUrls: completionPhotos.map((photo) => photo.url),
                ...(completionRoute || {})
              };
              return {
                ...b,
                status: '清運完成',
                completionDistanceKm: completionRoute?.distanceKm ?? null,
                completionCarbonKg: completionRoute?.carbonKg ?? null,
                statusTimeline: [...(b.statusTimeline || []), timelineItem]
              };
            }
            return b;
          })
        );

        // Upload photo to Google Drive Folder (ID: 1TYi7otNJXyEuCdZqx6cqJwNnlZXqH7dV) via GAS POST
        if (gasUrl && completionPhotos.length) {
          try {
            await fetch(gasUrl, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'completeWithPhoto',
                id: bookingId,
                files: completionPhotos.map((photo, index) => ({ fileBase64: photo.url, fileName: `${bookingId}-close-${index + 1}.jpg`, mimeType: 'image/jpeg' })),
                note: completionNote,
                routeData: completionRoute
              })
            });
          } catch (e) {
            console.error('Drive Upload Error:', e);
          }
        }

        setIsUploadingDrive(false);
        clearInterval(uploadCountdownTimer);
        setCompletionUploadSecondsLeft(0);
        setCompletionModalBooking(null);
        setCompletionPhotos([]);
      };

      // Export CSV
      const handleExportCSV = () => {
        const headers = ['預約單號', '申請時間', '申請人', '電話', '行政區', '詳細地址', '預約日期', '品項明細', '狀態'];
        const rows = bookings.map((b) => [
          b.id,
          getMinguoTime(b.createdAt),
          b.applicantName,
          b.phone,
          b.district,
          `"${b.address}"`,
          formatMinguoDate(b.preferredDate),
          `"${b.items.map((i) => `${i.name}x${i.quantity}`).join(';')}"`,
          b.status
        ]);
        const csvStr = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `大型廢棄傢俱預約清運資料_${getMinguoCompactStr()}.csv`;
        a.click();
      };

      const isPendingStatus = (status) => ['已收件', '待審核', '待處理', '審核中'].includes(String(status || '').trim());
      const getDisplayStatus = (status) => isPendingStatus(status) ? '待處理' : status;
      const pendingCount = bookings.filter((b) => isPendingStatus(b.status)).length;
      const visibleCaseBookings = bookings.filter((booking) => {
        if (caseListView === 'completed') return booking.status === '清運完成';
        if (caseListView === 'cancelled') return booking.status === '已取消';
        if (caseListView === 'all') return true;
        return booking.status !== '清運完成' && booking.status !== '已取消';
      });
      const dashboardNow = new Date();
      const parseDashboardDate = (value) => {
        const raw = String(value || '').trim();
        if (!raw) return null;
        const numberParts = raw.match(/\d+/g) || [];
        const rocMatch = raw.match(/^(?:民國)?(\d{2,3})[\/\-.年](\d{1,2})[\/\-.月](\d{1,2})/);
        if (rocMatch && Number(rocMatch[1]) < 1911) {
          const periodOffset = raw.includes('下午') && Number(numberParts[3] || 0) < 12 ? 12 : 0;
          const parsed = new Date(Number(rocMatch[1]) + 1911, Number(rocMatch[2]) - 1, Number(rocMatch[3]), Number(numberParts[3] || 0) + periodOffset, Number(numberParts[4] || 0));
          return isNaN(parsed.getTime()) ? null : parsed;
        }
        const parsed = new Date(raw);
        return isNaN(parsed.getTime()) ? null : parsed;
      };
      const dashboardBookings = bookings.filter((booking) => {
        if (dashboardPeriod === 'all') return true;
        const applicationDate = parseDashboardDate(booking.createdAt);
        if (!applicationDate) return false;
        if (dashboardPeriod === 'year') return applicationDate.getFullYear() === dashboardNow.getFullYear();
        if (dashboardPeriod === 'month') return applicationDate.getFullYear() === dashboardNow.getFullYear() && applicationDate.getMonth() === dashboardNow.getMonth();
        return true;
      });
      const makeDashboardRanking = (entries) => [...entries].sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'zh-Hant'));
      const dashboardStatusData = makeDashboardRanking(Object.entries(dashboardBookings.reduce((result, booking) => {
        const label = getDisplayStatus(booking.status) || '未設定';
        result[label] = (result[label] || 0) + 1;
        return result;
      }, {})).map(([label, value]) => ({ label, value })));
      const dashboardDistrictData = makeDashboardRanking(Object.entries(dashboardBookings.reduce((result, booking) => {
        const label = getDistrictName(booking) || '未填行政區';
        result[label] = (result[label] || 0) + 1;
        return result;
      }, {})).map(([label, value]) => ({ label, value })));
      const dashboardItemData = makeDashboardRanking(Object.entries(dashboardBookings.reduce((result, booking) => {
        (booking.items || []).forEach((item) => { const label = item.name || '其他'; result[label] = (result[label] || 0) + Number(item.quantity || 0); });
        return result;
      }, {})).map(([label, value]) => ({ label, value })));
      const dashboardConfirmedItems = dashboardBookings.reduce((sum, booking) => sum + Number(booking.confirmedQuantity || 0), 0);
      const dashboardChargeableItems = dashboardBookings.reduce((sum, booking) => sum + Number(booking.chargeableQuantity || 0), 0);
      const dashboardAmountDue = dashboardBookings.filter((booking) => booking.status !== '已取消').reduce((sum, booking) => sum + Number(booking.amountDue || 0), 0);
      const dashboardCollectedAmount = dashboardBookings.filter((booking) => booking.status === '清運完成').reduce((sum, booking) => sum + Number(booking.amountDue || 0), 0);
      const dashboardOutstandingAmount = Math.max(0, dashboardAmountDue - dashboardCollectedAmount);
      const dashboardCompletionDistanceKm = dashboardBookings.filter((booking) => booking.status === '清運完成').reduce((sum, booking) => sum + Number(booking.completionDistanceKm || 0), 0);
      const dashboardCompletionCarbonKg = dashboardBookings.filter((booking) => booking.status === '清運完成').reduce((sum, booking) => sum + Number(booking.completionCarbonKg || 0), 0);
      const dashboardPending = dashboardBookings.filter((booking) => isPendingStatus(booking.status)).length;
      const dashboardCompleted = dashboardBookings.filter((booking) => booking.status === '清運完成').length;
      const dashboardScheduled = dashboardBookings.filter((booking) => booking.status === '已排班').length;
      const dashboardCurrentData = dashboardView === 'district' ? dashboardDistrictData : dashboardView === 'items' ? dashboardItemData : dashboardStatusData;
      const dashboardMaxValue = Math.max(1, ...dashboardCurrentData.map((item) => item.value));
      const dashboardDetailConfig = {
        collected: { title: '累計收費案件明細', rows: dashboardBookings.filter((booking) => booking.status === '清運完成') },
        receivable: { title: '應收金額案件明細', rows: dashboardBookings.filter((booking) => booking.status !== '已取消') },
        distance: { title: '結案里程案件明細', rows: dashboardBookings.filter((booking) => booking.status === '清運完成' && Number(booking.completionDistanceKm || 0) > 0) },
        carbon: { title: '結案碳排量案件明細', rows: dashboardBookings.filter((booking) => booking.status === '清運完成' && Number(booking.completionCarbonKg || 0) > 0) },
        all: { title: '全部案件明細', rows: dashboardBookings },
        completed: { title: '完成案件明細', rows: dashboardBookings.filter((booking) => booking.status === '清運完成') },
        confirmed: { title: '已確認物件案件明細', rows: dashboardBookings.filter((booking) => Number(booking.confirmedQuantity || 0) > 0) },
        outstanding: { title: '尚待收取案件明細', rows: dashboardBookings.filter((booking) => booking.status !== '已取消' && booking.status !== '清運完成' && Number(booking.amountDue || 0) > 0) }
      };
      const dashboardDetail = dashboardDetailConfig[dashboardDetailType] || dashboardDetailConfig.all;
      const normalizedDashboardKeyword = dashboardKeyword.trim().toLowerCase();
      const dashboardDetailRows = dashboardDetail.rows.filter((booking) => {
        if (!normalizedDashboardKeyword) return true;
        const searchableText = [booking.id, booking.applicantName, booking.phone, booking.address, booking.district, getDisplayStatus(booking.status), (booking.items || []).map((item) => item.name + ' ' + item.quantity).join(' ')].join(' ').toLowerCase();
        return searchableText.includes(normalizedDashboardKeyword);
      });
      const dashboardDetailTotals = dashboardDetailRows.reduce((totals, booking) => ({
        count: totals.count + 1,
        confirmedQuantity: totals.confirmedQuantity + Number(booking.confirmedQuantity || 0),
        amountDue: totals.amountDue + Number(booking.amountDue || 0),
        distanceKm: totals.distanceKm + Number(booking.completionDistanceKm || 0),
        carbonKg: totals.carbonKg + Number(booking.completionCarbonKg || 0)
      }), { count: 0, confirmedQuantity: 0, amountDue: 0, distanceKm: 0, carbonKg: 0 });
      const dashboardKeywordMatchesItem = normalizedDashboardKeyword && dashboardDetailRows.some((booking) => (booking.items || []).some((item) => String(item.name || '').toLowerCase().includes(normalizedDashboardKeyword)));
      const dashboardDetailItemTotals = makeDashboardRanking(Object.entries(dashboardDetailRows.reduce((totals, booking) => {
        (booking.items || []).forEach((item) => {
          const itemName = String(item.name || '其他').trim() || '其他';
          if (dashboardKeywordMatchesItem && !itemName.toLowerCase().includes(normalizedDashboardKeyword)) return;
          totals[itemName] = (totals[itemName] || 0) + Number(item.quantity || 0);
        });
        return totals;
      }, {})).map(([label, value]) => ({ label, value })));
      const viewProps = { activeTab, setActiveTab, formatMinguoDate, getMinguoTime, vehicleSelections, setVehicleSelections, tripSelections, setTripSelections, appointmentTimeEditor, setAppointmentTimeEditor, vehicles, showVehicleManager, setShowVehicleManager, newVehicle, setNewVehicle, caseListView, setCaseListView, bookings, setPrintableBooking, setCompletionModalBooking, setPhotoPreview, isAdminAuth, setIsAdminAuth, adminPasswordInput, setAdminPasswordInput, isCheckingPassword, loginError, quantityDrafts, setQuantityDrafts, quantitySaving, quantityEditing, setQuantityEditing, aiSaving, getDispatchDate, getDispatchPeriod, getRouteKey, getNextDispatchTrip, getDispatchChoices, getDispatchLabel, getCountyDistrict, getLocalAddress, addVehicle, removeVehicle, getPhotoPreviewUrl, handleAdminLogin, handleAdminUpdateStatus, getRouteCarbon, getCustomRouteCarbon, getSuggestedRouteUrl, openRouteEditor, saveAppointmentTime, handleScheduleBooking, handleConfirmQuantity, handleRetryAi, handleCancelSchedule, handleExportCSV, isPendingStatus, getDisplayStatus, pendingCount, visibleCaseBookings, routeEditor, setRouteEditor, isSyncingGas, dashboardPeriod, setDashboardPeriod, dashboardView, setDashboardView, dashboardDetailType, setDashboardDetailType, dashboardKeyword, setDashboardKeyword, photoPreview, fetchFromGoogleSheets, buildRouteUrl, moveRouteStop, dashboardBookings, dashboardConfirmedItems, dashboardAmountDue, dashboardCollectedAmount, dashboardOutstandingAmount, dashboardCompletionDistanceKm, dashboardCompletionCarbonKg, dashboardCompleted, dashboardCurrentData, dashboardMaxValue, dashboardDetail, dashboardDetailRows, dashboardDetailTotals, dashboardKeywordMatchesItem, dashboardDetailItemTotals, completionModalBooking, completionPhotos, setCompletionPhotos, completionNote, setCompletionNote, isUploadingDrive, completionUploadSecondsLeft, handleCompletionPhotoFileChange, handleSubmitCompletionModal, QRCodeBox, printableBooking };

      return (
        <div className="civic-shell min-h-screen flex flex-col">
          
          <AdminHeader {...viewProps} />

          {/* Main Content View */}
          <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-12 no-print">
          <CaseManagementView {...viewProps} />

          <DashboardView {...viewProps} />

          </main>

          <CompletionPhotoModal {...viewProps} />

          <PrintableTagModal {...viewProps} />

          <AdminFooter />
        </div>
      );
    }
