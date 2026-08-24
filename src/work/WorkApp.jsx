import { useEffect, useMemo, useState } from 'react'
import { Camera, CheckCircle2, ExternalLink, LogOut, MapPin, Phone, RefreshCw, Truck, WifiOff, XCircle } from 'lucide-react'

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwYPD1R7pq3boSvrZUcVYLHT9CARhtDLJjVDOcPF8zZO9dbIFWQZJmmN56KFE9ok__SkQ/exec'
const SESSION_KEY = 'work_auth_until'
const SESSION_MS = 8 * 60 * 60 * 1000
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })
const dispatchDate = (booking) => booking.adjustedDate || booking.preferredDate || ''
const period = (booking) => booking.adjustedPeriod || String(booking.preferredTimeSlot || '').trim().split(/\s+/)[0]
const address = (booking) => `${String(booking.district || '').startsWith('苗栗縣') ? '' : '苗栗縣'}${booking.district || ''}${booking.address || ''}`

const readFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
  reader.readAsDataURL(file)
})

const fileToDataUrl = async (file) => {
  const source = await readFile(file)
  const image = await new Promise((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = reject
    element.src = source
  })
  const maxSide = 1600
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.78)
}

export default function WorkApp() {
  const [authenticated, setAuthenticated] = useState(() => Number(localStorage.getItem(SESSION_KEY) || 0) > Date.now())
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [bookings, setBookings] = useState([])
  const [selectedDate, setSelectedDate] = useState(today())
  const [vehicle, setVehicle] = useState('全部')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [online, setOnline] = useState(navigator.onLine)
  const [activeBooking, setActiveBooking] = useState(null)
  const [actionType, setActionType] = useState('complete')
  const [note, setNote] = useState('現場人員已完成清運並拍照結案。')
  const [photos, setPhotos] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const loadBookings = async () => {
    setLoading(true); setMessage('')
    try {
      const response = await fetch(GAS_URL)
      const result = await response.json()
      if (result.status !== 'success' || !Array.isArray(result.data)) throw new Error(result.message || '資料格式錯誤')
      setBookings(result.data)
      localStorage.setItem('work_bookings_cache', JSON.stringify(result.data))
    } catch (error) {
      const cached = JSON.parse(localStorage.getItem('work_bookings_cache') || '[]')
      setBookings(cached)
      setMessage(cached.length ? '目前離線，顯示上次同步資料。' : `讀取失敗：${error.message}`)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine)
    window.addEventListener('online', updateOnline); window.addEventListener('offline', updateOnline)
    return () => { window.removeEventListener('online', updateOnline); window.removeEventListener('offline', updateOnline) }
  }, [])
  useEffect(() => { if (authenticated) loadBookings() }, [authenticated])

  const vehicles = useMemo(() => [...new Set(bookings.map((item) => item.assignedVehicle).filter(Boolean))].sort(), [bookings])
  const visibleBookings = useMemo(() => bookings.filter((item) => item.status === '已排班' && dispatchDate(item) === selectedDate && (vehicle === '全部' || item.assignedVehicle === vehicle)).sort((a, b) => Number(a.dispatchTrip || 1) - Number(b.dispatchTrip || 1)), [bookings, selectedDate, vehicle])

  const login = async (event) => {
    event.preventDefault(); setLoggingIn(true); setLoginError('')
    try {
      const response = await fetch(`${GAS_URL}?action=verifyPassword&password=${encodeURIComponent(password)}`)
      const result = await response.json()
      if (!result.valid) throw new Error('密碼錯誤，請重新輸入。')
      localStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_MS)); setAuthenticated(true); setPassword('')
    } catch (error) { setLoginError(error.message || '無法連線驗證') } finally { setLoggingIn(false) }
  }

  const openAction = (booking, type) => {
    setActiveBooking(booking); setActionType(type); setPhotos([])
    setNote(type === 'complete' ? '現場人員已完成清運並拍照結案。' : '')
  }

  const selectPhotos = async (event) => {
    const files = [...event.target.files].slice(0, 2)
    setPhotos(await Promise.all(files.map(fileToDataUrl)))
  }

  const submitAction = async () => {
    if (!online) return setMessage('目前無網路，請恢復連線後再送出。')
    if (!note.trim()) return setMessage('請填寫現場回報內容。')
    if (actionType === 'complete' && !photos.length) return setMessage('完成清運至少需要拍攝一張照片。')
    setSubmitting(true); setMessage('')
    try {
      if (actionType === 'complete') {
        await fetch(GAS_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'completeWithPhoto', id: activeBooking.id, files: photos.map((fileBase64, index) => ({ fileBase64, fileName: `${activeBooking.id}-close-${index + 1}.jpg`, mimeType: 'image/jpeg' })), note: note.trim() }) })
      } else {
        await fetch(`${GAS_URL}?action=updateStatus&id=${encodeURIComponent(activeBooking.id)}&newStatus=${encodeURIComponent('無法清運')}&note=${encodeURIComponent(note.trim())}`, { mode: 'no-cors' })
      }
      setBookings((current) => current.map((item) => item.id === activeBooking.id ? { ...item, status: actionType === 'complete' ? '清運完成' : '無法清運' } : item))
      setActiveBooking(null); setMessage(actionType === 'complete' ? '結案資料已送出。' : '異常狀況已回報。')
    } catch (error) { setMessage(`送出失敗：${error.message}`) } finally { setSubmitting(false) }
  }

  if (!authenticated) return <div className="min-h-screen bg-emerald-950 px-5 py-12 text-white"><form onSubmit={login} className="mx-auto mt-12 max-w-sm rounded-3xl bg-white p-7 text-slate-900 shadow-2xl"><div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><Truck size={30}/></div><h1 className="text-2xl font-black">現場人員作業</h1><p className="mt-2 text-sm text-slate-500">請輸入工作人員密碼登入</p><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus className="mt-6 w-full rounded-xl border border-slate-300 px-4 py-3 text-base" placeholder="工作人員密碼"/>{loginError && <p className="mt-3 text-sm font-bold text-rose-600">{loginError}</p>}<button disabled={loggingIn} className="mt-5 w-full rounded-xl bg-emerald-700 px-4 py-3 font-black text-white disabled:opacity-50">{loggingIn ? '驗證中…' : '登入作業頁'}</button></form></div>

  return <div className="min-h-screen bg-slate-100 pb-24 text-slate-900"><header className="sticky top-0 z-20 bg-emerald-950 px-4 py-4 text-white shadow-lg"><div className="mx-auto flex max-w-3xl items-center justify-between"><div><h1 className="text-lg font-black">現場人員作業</h1><p className="text-xs text-emerald-200">大型傢俱清運</p></div><div className="flex items-center gap-2">{!online && <span className="flex items-center gap-1 rounded-full bg-rose-500 px-2 py-1 text-xs font-bold"><WifiOff size={13}/>離線</span>}<button onClick={loadBookings} disabled={loading} aria-label="重新同步" className="rounded-xl bg-white/10 p-2"><RefreshCw size={20} className={loading ? 'animate-spin' : ''}/></button><button onClick={() => { localStorage.removeItem(SESSION_KEY); setAuthenticated(false) }} aria-label="登出" className="rounded-xl bg-white/10 p-2"><LogOut size={20}/></button></div></div></header><main className="mx-auto max-w-3xl p-4"><section className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 shadow-sm"><label className="text-xs font-black text-slate-500">清運日期<input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800"/></label><label className="text-xs font-black text-slate-500">車號<select value={vehicle} onChange={(e) => setVehicle(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800"><option>全部</option>{vehicles.map((item) => <option key={item}>{item}</option>)}</select></label></section>{message && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">{message}</div>}<div className="mt-4 flex items-end justify-between"><div><h2 className="font-black">今日排班</h2><p className="text-xs text-slate-500">共 {visibleBookings.length} 件待清運</p></div></div><section className="mt-3 space-y-4">{visibleBookings.map((booking, index) => <article key={booking.id} className="overflow-hidden rounded-2xl bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800">第 {index + 1} 站</span><span className="font-mono text-xs font-bold text-slate-500">{booking.id}</span></div><div className="p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-black">{booking.applicantName || '未填姓名'}</h3><p className="mt-1 text-sm font-bold text-emerald-700">{booking.assignedVehicle}車・{period(booking)}・第{Number(booking.dispatchTrip || 1)}班</p></div><a href={`tel:${booking.phone || ''}`} className="rounded-xl bg-sky-50 p-3 text-sky-700" aria-label="撥打電話"><Phone size={21}/></a></div><p className="mt-4 flex items-start gap-2 text-sm leading-6 text-slate-700"><MapPin size={18} className="mt-1 shrink-0 text-rose-500"/>{address(booking)}</p><div className="mt-3 flex flex-wrap gap-2">{(booking.items || []).map((item, itemIndex) => <span key={itemIndex} className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800">{item.name} × {item.quantity}</span>)}</div><a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.mapAddress || address(booking))}`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3 font-black text-emerald-800"><ExternalLink size={18}/>開啟導航</a><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => openAction(booking, 'issue')} className="flex items-center justify-center gap-1 rounded-xl border border-rose-200 py-3 text-sm font-black text-rose-700"><XCircle size={18}/>無法清運</button><button onClick={() => openAction(booking, 'complete')} className="flex items-center justify-center gap-1 rounded-xl bg-emerald-700 py-3 text-sm font-black text-white"><CheckCircle2 size={18}/>拍照結案</button></div></div></article>)}{!loading && !visibleBookings.length && <div className="rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center text-sm font-bold text-slate-400">此日期與車號沒有待清運案件</div>}</section></main>{activeBooking && <div className="fixed inset-0 z-50 flex items-end bg-slate-950/60 sm:items-center sm:justify-center"><div className="max-h-[92vh] w-full overflow-auto rounded-t-3xl bg-white p-5 sm:max-w-lg sm:rounded-3xl"><h2 className="text-xl font-black">{actionType === 'complete' ? '拍照完成結案' : '回報無法清運'}</h2><p className="mt-1 text-sm text-slate-500">案件 {activeBooking.id}</p>{actionType === 'complete' && <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-6 font-black text-emerald-800"><Camera/>拍攝或選擇照片<input className="hidden" type="file" accept="image/*" capture="environment" multiple onChange={selectPhotos}/></label>}{photos.length > 0 && <div className="mt-3 grid grid-cols-2 gap-2">{photos.map((photo, index) => <img key={index} src={photo} alt={`結案照片 ${index + 1}`} className="h-32 w-full rounded-xl object-cover"/>)}</div>}<label className="mt-4 block text-sm font-black text-slate-600">現場備註<textarea value={note} onChange={(e) => setNote(e.target.value)} rows="4" className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" placeholder={actionType === 'complete' ? '填寫結案說明' : '請填寫無法清運原因'}/></label><div className="mt-5 grid grid-cols-2 gap-3"><button disabled={submitting} onClick={() => setActiveBooking(null)} className="rounded-xl border border-slate-300 py-3 font-black text-slate-600">取消</button><button disabled={submitting} onClick={submitAction} className={`rounded-xl py-3 font-black text-white disabled:opacity-50 ${actionType === 'complete' ? 'bg-emerald-700' : 'bg-rose-600'}`}>{submitting ? '送出中…' : '確認送出'}</button></div></div></div>}</div>
}
