import React, { useEffect, useState } from 'react';
import { CITY_DISTRICTS } from '../data/mockData';
import { ShieldCheck, Truck, CheckCircle2, Clock, Filter, Search, Download, RotateCcw, Eye, ArrowUpRight, AlertCircle, FileSpreadsheet } from 'lucide-react';

export default function AdminDashboard({ bookings, setBookings, onOpenTagModal }) {
  const DISPATCH_ORIGIN = '24.38098913508549,120.73429901439242';
  const [selectedDistrict, setSelectedDistrict] = useState('全部');
  const [selectedStatus, setSelectedStatus] = useState('全部');
  const [searchKey, setSearchKey] = useState('');
  const [vehicleSelections, setVehicleSelections] = useState({});
  const [tripSelections, setTripSelections] = useState({});
  const [vehicles, setVehicles] = useState(() => { try { const saved = JSON.parse(localStorage.getItem('recycling_vehicles') || '["A","B"]'); const valid = Array.isArray(saved) ? saved.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()) : []; return valid.length ? valid : ['A', 'B']; } catch { return ['A', 'B']; } });
  const [showVehicleManager, setShowVehicleManager] = useState(false);
  const [newVehicle, setNewVehicle] = useState('');
  const [routeEditor, setRouteEditor] = useState(null);
  const [routeCalculations, setRouteCalculations] = useState(() => { try { return JSON.parse(localStorage.getItem('recycling_route_calculations') || '{}'); } catch { return {}; } });
  const [customRoutes, setCustomRoutes] = useState(() => { try { return JSON.parse(localStorage.getItem('recycling_custom_routes') || '{}'); } catch { return {}; } });
  const getDispatchPeriod = (booking) => String(booking.preferredTimeSlot || '未指定時段').trim().split(/\s+/)[0];
  const getDispatchTrip = (booking) => Number(booking.dispatchTrip || 1);
  const getRouteKey = (booking) => `${booking.preferredDate}|${booking.assignedVehicle}|${getDispatchPeriod(booking)}|${getDispatchTrip(booking)}`;
  const getNextDispatchTrip = (booking, vehicle) => {
    if (!vehicle) return 1;
    const trips = bookings.filter((item) => item.id !== booking.id && item.status === '已排班' && item.preferredDate === booking.preferredDate && item.assignedVehicle === vehicle && getDispatchPeriod(item) === getDispatchPeriod(booking)).map(getDispatchTrip);
    return trips.length ? Math.max(...trips) + 1 : 1;
  };
  const getDispatchChoices = (booking, vehicle) => {
    if (!vehicle) return [];
    const existingTrips = [...new Set(bookings.filter((item) => item.id !== booking.id && item.status === '已排班' && item.preferredDate === booking.preferredDate && item.assignedVehicle === vehicle && getDispatchPeriod(item) === getDispatchPeriod(booking)).map(getDispatchTrip))].sort((a, b) => a - b);
    if (!existingTrips.length) return [{ trip: 1, mode: 'new' }];
    const previousTrip = existingTrips[existingTrips.length - 1];
    return [{ trip: previousTrip, mode: 'merge' }, { trip: previousTrip + 1, mode: 'new' }];
  };
  const getDispatchLabel = (booking, vehicle = booking.assignedVehicle, trip = getDispatchTrip(booking)) => vehicle ? `${vehicle}車${getDispatchPeriod(booking)}第${trip}班` : '';
  const saveVehicleCache = (next) => { setVehicles(next); localStorage.setItem('recycling_vehicles', JSON.stringify(next)); };
  const loadVehicles = async () => { const gasUrl = localStorage.getItem('gas_web_app_url'); if (!gasUrl) return; try { const response = await fetch(`${gasUrl}?action=getVehicles`); const result = await response.json(); const valid = Array.isArray(result.data) ? result.data.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()) : []; if (result.status === 'success' && result.resource === 'vehicles' && valid.length) saveVehicleCache(valid); } catch (error) { console.error('Vehicle Fetch Error:', error); } };
  const addVehicle = async () => { const value = newVehicle.trim(); if (!value) return; if (vehicles.some((item) => item.toLowerCase() === value.toLowerCase())) { window.alert('此車號已存在。'); return; } const gasUrl = localStorage.getItem('gas_web_app_url'); try { const response = await fetch(`${gasUrl}?action=addVehicle&vehicle=${encodeURIComponent(value)}`); const result = await response.json(); if (result.status !== 'success' || result.resource !== 'vehicles') throw new Error(result.resource !== 'vehicles' ? 'GAS 尚未部署車輛管理新版，請重新部署網頁應用程式。' : result.message); setNewVehicle(''); await loadVehicles(); } catch (error) { window.alert(`新增車號失敗：${error.message}`); } };
  const removeVehicle = async (vehicle) => { if (vehicles.length <= 1) { window.alert('至少需要保留一台車。'); return; } if (!window.confirm(`確定移除車號「${vehicle}」？已排班案件仍會保留原車號。`)) return; const gasUrl = localStorage.getItem('gas_web_app_url'); try { const response = await fetch(`${gasUrl}?action=deleteVehicle&vehicle=${encodeURIComponent(vehicle)}`); const result = await response.json(); if (result.status !== 'success' || result.resource !== 'vehicles') throw new Error(result.resource !== 'vehicles' ? 'GAS 尚未部署車輛管理新版，請重新部署網頁應用程式。' : result.message); await loadVehicles(); } catch (error) { window.alert(`移除車號失敗：${error.message}`); } };

  useEffect(() => { loadVehicles(); }, []);

  const buildRouteUrl = (orderedBookings) => {
    const stops = orderedBookings.map((item) => item.mapAddress || item.address).filter(Boolean);
    const destination = stops[stops.length - 1];
    const waypoints = stops.slice(0, -1);
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(DISPATCH_ORIGIN)}&destination=${encodeURIComponent(destination)}${waypoints.length ? `&waypoints=${encodeURIComponent(waypoints.join('|'))}` : ''}&travelmode=driving`;
  };

  const getCoordinates = (item) => {
    if (Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude))) return [Number(item.latitude), Number(item.longitude)];
    const match = String(item.mapLink || '').match(/(?:@|query=)(-?\d+\.\d+)[,%2C]+\s*(-?\d+\.\d+)/i);
    return match ? [Number(match[1]), Number(match[2])] : null;
  };

  const getRecommendedOrder = (items) => {
    if (!items.every(getCoordinates)) return [...items].sort((a, b) => `${a.district || ''}${a.address || ''}`.localeCompare(`${b.district || ''}${b.address || ''}`, 'zh-Hant'));
    const remaining = [...items];
    const ordered = [];
    let current = DISPATCH_ORIGIN.split(',').map(Number);
    while (remaining.length) {
      remaining.sort((a, b) => {
        const ca = getCoordinates(a); const cb = getCoordinates(b);
        return Math.hypot(ca[0] - current[0], ca[1] - current[1]) - Math.hypot(cb[0] - current[0], cb[1] - current[1]);
      });
      const next = remaining.shift(); ordered.push(next); current = getCoordinates(next);
    }
    return ordered;
  };
  const estimateRouteKm = (items) => {
    if (!items.length || !items.every(getCoordinates)) return '';
    const points = [DISPATCH_ORIGIN.split(',').map(Number), ...items.map(getCoordinates)];
    const radians = (value) => value * Math.PI / 180;
    const straightKm = points.slice(1).reduce((sum, point, index) => { const prev = points[index]; const dLat = radians(point[0] - prev[0]); const dLng = radians(point[1] - prev[1]); const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(prev[0])) * Math.cos(radians(point[0])) * Math.sin(dLng / 2) ** 2; return sum + 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); }, 0);
    return (straightKm * 1.25).toFixed(1);
  };
  const getRouteCarbon = (booking) => {
    const calculation = routeCalculations[getRouteKey(booking)];
    if (calculation?.status === 'calculating') return '路程計算中…';
    if (calculation?.distanceKm) return `${calculation.distanceKm.toFixed(1)} km／${calculation.carbonKg.toFixed(2)} kg CO₂e`;
    return calculation?.error || '路程待計算';
  };
  const getCustomRouteCarbon = (booking) => { const value = customRoutes[getRouteKey(booking)]?.calculation; if (value?.status === 'calculating') return '計算中…'; return value?.distanceKm ? `${Number(value.distanceKm).toFixed(1)} km／${Number(value.carbonKg).toFixed(2)} kg CO₂e` : '尚未自訂'; };

  const getRouteBookings = (booking) => bookings.filter((item) =>
    item.preferredDate === booking.preferredDate &&
    item.assignedVehicle === booking.assignedVehicle &&
    getDispatchPeriod(item) === getDispatchPeriod(booking) &&
    getDispatchTrip(item) === getDispatchTrip(booking) &&
    item.status === '已排班'
  );

  const getSuggestedRouteUrl = (booking) => {
    const routeBookings = booking.assignedVehicle ? getRouteBookings(booking) : [booking];
    const recommendedOrder = getRecommendedOrder(routeBookings);
    return buildRouteUrl(recommendedOrder);
  };

  useEffect(() => {
    const groups = new Map();
    bookings.filter((item) => item.status === '已排班' && item.assignedVehicle).forEach((item) => { const key = getRouteKey(item); groups.set(key, [...(groups.get(key) || []), item]); });
    groups.forEach((items, key) => {
      const signature = items.map((item) => `${item.id}:${item.address}`).sort().join('|');
      if ((routeCalculations[key]?.signature === signature && routeCalculations[key]?.status === 'done') || routeCalculations[key]?.status === 'calculating') return;
      setRouteCalculations((current) => ({ ...current, [key]: { status: 'calculating', signature } }));
      (async () => {
        try {
          const gasUrl = localStorage.getItem('gas_web_app_url'); if (!gasUrl) throw new Error('尚未設定 GAS Web App');
          const addresses = getRecommendedOrder(items).map((item) => `${item.district || ''}${item.address || ''}`); const response = await fetch(`${gasUrl}?action=calculateRoute&optimize=true&addresses=${encodeURIComponent(JSON.stringify(addresses))}`); const result = await response.json();
          if (result.status !== 'success') throw new Error(result.message || '無法取得 Google 行車路線');
          const value = { status: 'done', signature, distanceKm: Number(result.distanceKm), carbonKg: Number(result.carbonKg), durationMinutes: Number(result.durationMinutes) };
          setRouteCalculations((current) => { const next = { ...current, [key]: value }; localStorage.setItem('recycling_route_calculations', JSON.stringify(next)); return next; });
        } catch (error) { setRouteCalculations((current) => ({ ...current, [key]: { status: 'error', signature, error: error.message || '路程計算失敗' } })); }
      })();
    });
  }, [bookings]);

  const calculateCustomRoute = async (booking, stops) => { const key = getRouteKey(booking); const calculation = { status: 'calculating' }; setCustomRoutes((current) => ({ ...current, [key]: { stopIds: stops.map((item) => item.id), calculation } })); try { const gasUrl = localStorage.getItem('gas_web_app_url'); if (!gasUrl) throw new Error('尚未設定 GAS Web App'); const addresses = stops.map((item) => `${item.district || ''}${item.address || ''}`); const response = await fetch(`${gasUrl}?action=calculateRoute&optimize=false&addresses=${encodeURIComponent(JSON.stringify(addresses))}`); const result = await response.json(); if (result.status !== 'success') throw new Error(result.message); const entry = { stopIds: stops.map((item) => item.id), calculation: { status: 'done', distanceKm: result.distanceKm, carbonKg: result.carbonKg, durationMinutes: result.durationMinutes } }; setCustomRoutes((current) => { const next = { ...current, [key]: entry }; localStorage.setItem('recycling_custom_routes', JSON.stringify(next)); return next; }); setRouteEditor((current) => current ? { ...current, distanceKm: Number(result.distanceKm).toFixed(1), fuelEfficiency: '5' } : current); } catch (error) { setCustomRoutes((current) => ({ ...current, [key]: { stopIds: stops.map((item) => item.id), calculation: { status: 'error', error: error.message } } })); } };
  const openRouteEditor = (booking) => { const available = getRouteBookings(booking); const saved = customRoutes[getRouteKey(booking)]; const stops = saved?.stopIds ? saved.stopIds.map((id) => available.find((item) => item.id === id)).filter(Boolean).concat(available.filter((item) => !saved.stopIds.includes(item.id))) : getRecommendedOrder(available); setRouteEditor({ booking, stops, distanceKm: saved?.calculation?.distanceKm ? Number(saved.calculation.distanceKm).toFixed(1) : '', fuelEfficiency: '5' }); if (!saved?.calculation?.distanceKm) calculateCustomRoute(booking, stops); };
  const moveRouteStop = (index, direction) => { if (!routeEditor) return; const nextIndex = index + direction; if (nextIndex < 0 || nextIndex >= routeEditor.stops.length) return; const stops = [...routeEditor.stops]; [stops[index], stops[nextIndex]] = [stops[nextIndex], stops[index]]; setRouteEditor({ ...routeEditor, stops, distanceKm: '' }); calculateCustomRoute(routeEditor.booking, stops); };

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

  const handleSchedule = (booking) => {
    const vehicle = vehicleSelections[booking.id] || (booking.status === '已取消' ? '' : booking.assignedVehicle);
    const dispatchTrip = Number(tripSelections[booking.id] || getNextDispatchTrip(booking, vehicle));
    if (!vehicle) return;
    const nowTime = new Date().toLocaleString();
    setBookings((prev) => prev.map((b) => b.id === booking.id ? {
      ...b,
      status: '已排班',
      assignedVehicle: vehicle,
      dispatchTrip,
      dispatchOrigin: DISPATCH_ORIGIN,
      suggestedRouteUrl: getSuggestedRouteUrl(b),
      statusTimeline: [...(b.statusTimeline || []), {
        status: '已排班',
        time: nowTime,
        note: `已排定 ${getDispatchLabel(booking, vehicle, dispatchTrip)}`
      }]
    } : b));
  };

  const handleStatusChange = (booking, newStatus) => {
    if (newStatus === '已排班') {
      if (!(vehicleSelections[booking.id] || (booking.status === '已取消' ? '' : booking.assignedVehicle))) {
        window.alert('請先選擇車號，再將狀態改為已排班。');
        return;
      }
      handleSchedule(booking);
      return;
    }
    handleUpdateStatus(booking.id, newStatus, `後台手動變更狀態為${newStatus}`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['預約單號', '申請人', '電話', '行政區', '詳細地址', '清運日期', '清運品項與數量', '車輛', '狀態'];
    const rows = filteredBookings.map((b) => [
      b.id,
      b.applicantName,
      b.phone,
      b.district,
      `"${b.address}"`,
      b.preferredDate,
      `"${b.items.map((i) => `${i.name}x${i.quantity}`).join('; ')}"`,
      b.assignedVehicle || '',
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

  const orderedBookings = [...filteredBookings].sort((a, b) => {
    const aKey = a.status === '已排班' ? getRouteKey(a) : `ZZZ|${a.createdAt}`;
    const bKey = b.status === '已排班' ? getRouteKey(b) : `ZZZ|${b.createdAt}`;
    return aKey.localeCompare(bKey, 'zh-Hant');
  });

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

        <div className="flex gap-2"><button onClick={() => setShowVehicleManager((current) => !current)} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 font-bold text-xs">🚚 車輛管理</button><button onClick={handleExportCSV} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-all flex items-center space-x-2 shadow-md"><FileSpreadsheet className="w-4 h-4 text-emerald-400" /><span>匯出 Excel / CSV 派車清單</span></button></div>
      </div>

      {showVehicleManager && <div className="rounded-2xl border border-sky-500/30 bg-slate-900/80 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-black text-white">車輛管理</h3><p className="mt-1 text-xs text-slate-400">新增或移除排班可選車號；已排班案件不受刪除影響。</p></div><div className="flex gap-2"><input value={newVehicle} onChange={(e) => setNewVehicle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addVehicle(); }} placeholder="輸入車號" className="w-36 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-xs font-bold text-white"/><button onClick={addVehicle} className="rounded-lg bg-sky-400 px-3 py-2 text-xs font-black text-slate-950">新增車號</button></div></div><div className="mt-3 flex flex-wrap gap-2">{vehicles.map((vehicle) => <span key={vehicle} className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-black text-slate-100">🚛 {vehicle}<button onClick={() => removeVehicle(vehicle)} className="text-rose-400 hover:text-rose-300" aria-label={`移除車號 ${vehicle}`}>✕</button></span>)}</div></div>}

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
      <div className="rounded-2xl border border-slate-200 bg-slate-50 shadow-lg shadow-slate-300/20 overflow-hidden">
        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed text-left text-xs">
            <thead className="bg-emerald-50/70 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-bold">
              <tr>
                <th className="w-[7%] py-3.5 px-2 text-center">標籤</th>
                <th className="w-[13%] py-3.5 px-2">預約單號 / 時間</th>
                <th className="w-[10%] py-3.5 px-2">申請人與電話</th>
                <th className="w-[20%] py-3.5 px-2">行政區與一樓清運地址</th>
                <th className="w-[10%] py-3.5 px-2">約定日期/時段</th>
                <th className="w-[14%] py-3.5 px-2">清運品項</th>
                <th className="w-[8%] py-3.5 px-2">狀態</th>
                <th className="w-[18%] py-3.5 px-2 text-right">操作與審核</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    尚無符合條件的清運預約資料
                  </td>
                </tr>
              ) : (
                orderedBookings.map((b, rowIndex) => {
                  const groupKey = b.status === '已排班' ? getRouteKey(b) : '';
                  const isGroupStart = groupKey && (rowIndex === 0 || orderedBookings[rowIndex - 1].status !== '已排班' || getRouteKey(orderedBookings[rowIndex - 1]) !== groupKey);
                  const isGroupEnd = groupKey && (rowIndex === orderedBookings.length - 1 || orderedBookings[rowIndex + 1].status !== '已排班' || getRouteKey(orderedBookings[rowIndex + 1]) !== groupKey);
                  return (
                  <tr key={b.id} className={`odd:bg-white even:bg-slate-50 hover:bg-emerald-50 transition-colors ${groupKey ? '[&>td:first-child]:border-l-2 [&>td:first-child]:border-l-emerald-400 [&>td:last-child]:border-r-2 [&>td:last-child]:border-r-emerald-400' : ''} ${isGroupStart ? '[&>td]:border-t-2 [&>td]:border-t-emerald-400' : ''} ${isGroupEnd ? '[&>td]:border-b-2 [&>td]:border-b-emerald-400' : ''}`}>
                    <td className="py-3.5 px-4 text-center">
                      <button onClick={() => onOpenTagModal(b)} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1.5 font-bold text-slate-300 transition-all hover:bg-slate-700 hover:text-white" title="預覽標籤與 QR Code">
                        <Eye className="w-4 h-4" /><span>標籤</span>
                      </button>
                    </td>
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
                      <span className={`inline-flex rounded-lg border px-2 py-1 text-[11px] font-bold ${
                        b.status === '已排班'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : b.status === '清運完成'
                          ? 'bg-slate-700 text-slate-300'
                          : b.status === '已取消'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`} aria-label={`${b.id} 目前狀態：${b.status}`}>{b.status}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {(b.status === '已收件' || b.status === '待審核' || b.status === '已取消') && (
                          <div className="flex items-center gap-1.5">
                            <select value={vehicleSelections[b.id] || (b.status === '已取消' ? '' : b.assignedVehicle) || ''} onChange={(e) => { const vehicle = e.target.value; setVehicleSelections((prev) => ({ ...prev, [b.id]: vehicle })); setTripSelections((prev) => ({ ...prev, [b.id]: vehicle ? getNextDispatchTrip(b, vehicle) : 1 })); }} className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-xs font-bold text-slate-200" aria-label={`選擇 ${b.id} 的資源回收車`}>
                              <option value="">選擇車輛</option>
                              {!vehicles.includes(b.assignedVehicle) && b.assignedVehicle && <option value={b.assignedVehicle}>{b.assignedVehicle}（已停用）</option>}
                              {vehicles.map((vehicle) => <option key={vehicle} value={vehicle}>{vehicle} 車</option>)}
                            </select>
                            {(vehicleSelections[b.id] || (b.status === '已取消' ? '' : b.assignedVehicle)) && (() => { const vehicle = vehicleSelections[b.id] || b.assignedVehicle; const choices = getDispatchChoices(b, vehicle); return choices.length > 1 ? <select value={tripSelections[b.id] || getNextDispatchTrip(b, vehicle)} onChange={(e) => setTripSelections((prev) => ({ ...prev, [b.id]: Number(e.target.value) }))} className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-xs font-black text-sky-300">{choices.map((choice) => <option key={choice.trip} value={choice.trip}>{getDispatchLabel(b, vehicle, choice.trip)}（{choice.mode === 'merge' ? '併入上一班' : '新增下一班'}）</option>)}</select> : <span className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-xs font-black text-sky-300">{getDispatchLabel(b, vehicle, 1)}（建立第1班）</span>; })()}
                            {(b.status === '已收件' || b.status === '待審核' || b.status === '已取消') && <button onClick={() => handleSchedule(b)} disabled={!(vehicleSelections[b.id] || (b.status === '已取消' ? '' : b.assignedVehicle))} className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40">核可排班</button>}
                          </div>
                        )}

                        {b.status === '已排班' && (
                          <>
                            <strong className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs font-black text-sky-300">{getDispatchLabel(b)}</strong>
                            <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                              <a href={getSuggestedRouteUrl(b)} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 font-bold">📍 {b.assignedVehicle ? `${b.assignedVehicle} 車${getDispatchPeriod(b)}第 ${getDispatchTrip(b)} 趟路線（${getRouteBookings(b).length} 點）` : '建議路線'}</a>
                              <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-black text-emerald-300">{getRouteCarbon(b)}</span>
                              {getRouteBookings(b).length > 1 && <><button onClick={() => openRouteEditor(b)} className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500 hover:text-white font-bold">↕ 自訂路線</button><span className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-black text-violet-300">{getCustomRouteCarbon(b)}</span></>}
                            </span>
                            <button onClick={() => handleUpdateStatus(b.id, '清運完成', '隊員已於現場載運完畢')} className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-slate-950 font-bold transition-all">結案完成</button>
                            <button onClick={() => { if (window.confirm(`確定取消案件「${b.id}」目前的排班？取消後可重新選擇車輛排班。`)) handleStatusChange(b, '已取消'); }} className="px-2.5 py-1 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white font-bold transition-all">取消排班</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>

      {routeEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 text-left shadow-2xl">
            <div className="mb-4 flex items-start justify-between"><div><h3 className="text-lg font-black text-white">自訂 {routeEditor.booking.assignedVehicle} 車{getDispatchPeriod(routeEditor.booking)}第 {getDispatchTrip(routeEditor.booking)} 趟路線</h3><p className="text-xs text-slate-400">{routeEditor.booking.preferredDate}・起點固定為出車地址</p></div><button onClick={() => setRouteEditor(null)} className="text-slate-400">✕</button></div>
            <div className="max-h-[55vh] space-y-2 overflow-y-auto">
              {routeEditor.stops.map((stop, index) => <div key={stop.id} className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 p-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 font-black text-slate-950">{index + 1}</span><div className="min-w-0 flex-1"><strong className="text-sm text-white">{stop.applicantName}</strong><p className="truncate text-xs text-slate-400">{stop.address}</p></div><button onClick={() => moveRouteStop(index, -1)} disabled={index === 0} className="rounded bg-slate-700 px-2 py-1 disabled:opacity-30">↑</button><button onClick={() => moveRouteStop(index, 1)} disabled={index === routeEditor.stops.length - 1} className="rounded bg-slate-700 px-2 py-1 disabled:opacity-30">↓</button></div>)}
            </div>
            <div className="mt-4 grid gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:grid-cols-3"><label className="text-xs font-bold text-slate-300">路線公里數<input type="number" min="0" step="0.1" value={routeEditor.distanceKm} onChange={(e) => setRouteEditor((current) => ({ ...current, distanceKm: e.target.value }))} placeholder="輸入 Google Maps 里程" className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" /></label><label className="text-xs font-bold text-slate-300">車輛油耗（km/L）<input type="number" min="0.1" step="0.1" value={routeEditor.fuelEfficiency} onChange={(e) => setRouteEditor((current) => ({ ...current, fuelEfficiency: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" /></label><div><span className="text-xs font-bold text-slate-300">預估碳排量</span><strong className="mt-1 block text-xl text-emerald-400">{routeEditor.distanceKm && routeEditor.fuelEfficiency ? ((Number(routeEditor.distanceKm) / Number(routeEditor.fuelEfficiency)) * 2.69).toFixed(2) : '--'} kg CO₂e</strong><span className="text-[10px] text-slate-400">柴油 2.69 kg CO₂e/L</span></div></div>
            <div className="mt-5 flex justify-end gap-2"><button onClick={() => setRouteEditor(null)} className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-bold text-white">取消</button><a href={buildRouteUrl(routeEditor.stops)} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-slate-950">開啟自訂導航</a></div>
          </div>
        </div>
      )}

    </div>
  );
}
