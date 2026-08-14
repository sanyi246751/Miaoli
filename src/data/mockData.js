// Initial mock data stored in LocalStorage for testing query & admin backend

export const CATEGORIES = [
  { id: 'mattress', name: '床墊', icon: '🛏️', desc: '單人床墊、雙人床墊、彈簧床' },
  { id: 'cabinet', name: '櫃子', icon: '🗄️', desc: '衣櫃、鞋櫃、斗櫃、酒櫃、電視櫃' },
  { id: 'table', name: '桌子', icon: '🪑', desc: '餐桌、書桌、茶幾、電腦桌' },
  { id: 'chair', name: '椅子', icon: '🛋️', desc: '單人椅、辦公椅、雙人沙發、三人沙發' },
  { id: 'tv', name: '電視', icon: '📺', desc: '液晶電視、傳統電視（家電類）' },
  { id: 'fridge', name: '冰箱', icon: '🧊', desc: '單門冰箱、雙門/多門冰箱（家電類）' },
  { id: 'other', name: '其他', icon: '📦', desc: '大型收納架、夾板、彈簧床架等' },
];

export const CITY_DISTRICTS = [
  '信義區', '大安區', '中山區', '內湖區', '士林區', '北投區', 
  '松山區', '萬華區', '文山區', '南港區', '中正區', '大同區',
  '板橋區', '新莊區', '中和區', '三重區', '新店區', '土城區'
];

export const INITIAL_BOOKINGS = [
  {
    id: 'FUR-20260812-9842',
    applicantName: '陳大明',
    phone: '0912-345-678',
    email: 'daming.chen@example.com',
    district: '大安區',
    address: '台北市大安區新生南路三段 88 號 1 樓門口',
    preferredDate: '2026-08-15',
    preferredTimeSlot: '上午 (08:00 - 12:00)',
    locationNote: '放置於大樓走廊出口不影響行人處',
    items: [
      { categoryId: 'mattress', name: '雙人彈簧床墊', quantity: 1 },
      { categoryId: 'cabinet', name: '三門雙人衣櫃', quantity: 1 }
    ],
    photos: [
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=500&auto=format&fit=crop&q=60'
    ],
    status: '已排班', // 待審核, 已排班, 清運完成, 已取消
    statusTimeline: [
      { status: '已收件', time: '2026-08-12 09:30' },
      { status: '審核通過', time: '2026-08-12 11:15' },
      { status: '已排班', time: '2026-08-12 14:00', note: '預計由環保二中隊隊員前往' }
    ],
    createdAt: '2026-08-12 09:30',
    agreedToTerms: true
  },
  {
    id: 'FUR-20260811-3310',
    applicantName: '林美玲',
    phone: '0928-765-432',
    email: 'meiling.lin@example.com',
    district: '信義區',
    address: '台北市信義區松高路 12 號 1 樓後門',
    preferredDate: '2026-08-14',
    preferredTimeSlot: '下午 (13:00 - 17:00)',
    locationNote: '放置於防火巷旁側門',
    items: [
      { categoryId: 'chair', name: '三人皮沙發', quantity: 1 },
      { categoryId: 'table', name: '木質大餐桌', quantity: 1 }
    ],
    photos: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=60'
    ],
    status: '待審核',
    statusTimeline: [
      { status: '已收件', time: '2026-08-11 16:45' }
    ],
    createdAt: '2026-08-11 16:45',
    agreedToTerms: true
  },
  {
    id: 'FUR-20260810-7712',
    applicantName: '黃志偉',
    phone: '0935-112-233',
    email: 'zhiwei.huang@example.com',
    district: '內湖區',
    address: '台北市內湖區瑞光路 258 號一樓花園旁',
    preferredDate: '2026-08-13',
    preferredTimeSlot: '上午 (08:00 - 12:00)',
    locationNote: '放置於社區大樓側邊暫存區',
    items: [
      { categoryId: 'fridge', name: '雙門雙門舊冰箱', quantity: 1 },
      { categoryId: 'tv', name: '42吋舊型電視', quantity: 1 }
    ],
    photos: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=60'
    ],
    status: '清運完成',
    statusTimeline: [
      { status: '已收件', time: '2026-08-10 10:00' },
      { status: '已排班', time: '2026-08-10 15:30' },
      { status: '清運完成', time: '2026-08-13 10:20', note: '隊員已完成現場載運' }
    ],
    createdAt: '2026-08-10 10:00',
    agreedToTerms: true
  }
];
