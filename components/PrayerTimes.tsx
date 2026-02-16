
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { PrayerData, AppSettings } from '../types';
import { MapPin, Sun, Moon, Loader2, RefreshCw, Search, X, ChevronRight, ChevronLeft, Globe, Timer, Star, Settings, CheckCircle2, AlertCircle, Navigation, Map as MapIcon } from 'lucide-react';

interface PrayerTimesProps {
  settings: AppSettings;
  updateSettings: (newPrayerSettings: Partial<AppSettings['prayer']>) => void;
}

const METHODS = [
  { id: 1, name: 'جامعة العلوم الإسلامية، كراتشي' },
  { id: 2, name: 'الجمعية الإسلامية لأمريكا الشمالية (ISNA)' },
  { id: 3, name: 'رابطة العالم الإسلامي (MWL)' },
  { id: 4, name: 'جامعة أم القرى، مكة المكرمة' },
  { id: 5, name: 'الهيئة المصرية العامة للمساحة' },
  { id: 8, name: 'منطقة الخليج العربي' },
  { id: 12, name: 'اتحاد المنظمات الإسلامية في فرنسا' },
  { id: 13, name: 'رئاسة الشؤون الدينية، تركيا (Diyanet)' },
];

export const PrayerTimes: React.FC<PrayerTimesProps> = ({ settings, updateSettings }) => {
  const [loading, setLoading] = useState(false);
  const [prayers, setPrayers] = useState<PrayerData[]>([]);
  const [timingsRaw, setTimingsRaw] = useState<any>(null);
  const [hijriDate, setHijriDate] = useState({ day: '', month: '', year: '', dayName: '' });
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [showConfig, setShowConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeout = useRef<any>(null);

  // تحديث العداد كل ثانية
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const changeDate = (offset: number) => {
    const nextDate = new Date(viewDate);
    nextDate.setDate(nextDate.getDate() + offset);
    setViewDate(nextDate);
  };

  /**
   * جلب المواقيت بناءً على الإحداثيات والمنطقة الزمنية
   */
  const fetchByCoords = useCallback(async (latitude: number, longitude: number, date: Date = new Date(), customName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const dateStr = `${day}-${month}-${year}`;

      // استخدام timezone=auto لضمان جلب التوقيت المحلي الدقيق لأي منطقة في العالم
      const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=${settings.prayer.method}&timezone=auto`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("تعذر جلب البيانات من الخادم");
      
      const data = await response.json();
      const timings = data.data.timings;
      setTimingsRaw(timings);
      
      const hijri = data.data.date.hijri;
      setHijriDate({
        day: hijri.day,
        month: hijri.month.ar,
        year: hijri.year,
        dayName: data.data.date.gregorian.weekday.ar
      });

      const prayerList = [
        { name: 'Fajr', arabicName: 'الفجر', icon: '🌅' },
        { name: 'Sunrise', arabicName: 'الشروق', icon: '☀️' },
        { name: 'Dhuhr', arabicName: 'الظهر', icon: '☀️' },
        { name: 'Asr', arabicName: 'العصر', icon: '🌤️' },
        { name: 'Maghrib', arabicName: 'المغرب', icon: '🌇' },
        { name: 'Isha', arabicName: 'العشاء', icon: '🌙' },
      ];

      // تطبيق التعديلات اليدوية المحفوظة
      const processedPrayers = prayerList.map(p => {
        let timeStr = timings[p.name];
        const adj = settings.prayer.adjustments[p.name] || 0;
        if (adj !== 0) {
          const [h, m] = timeStr.split(':').map(Number);
          const d = new Date();
          d.setHours(h, m + adj, 0);
          timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        }
        return { ...p, time: timeStr };
      });

      if (customName) {
        updateSettings({ 
          savedCity: customName, 
          savedCoords: { lat: latitude, lon: longitude },
          autoLocation: false
        });
      }

      setPrayers(processedPrayers);
      
      // حفظ النسخة الاحتياطية للعمل دون إنترنت
      localStorage.setItem(`cached_prayers_${dateStr}`, JSON.stringify({ 
        prayers: processedPrayers, 
        hijri, 
        timings,
        city: customName || settings.prayer.savedCity
      }));
      
    } catch (err) {
      console.error(err);
      setError("حدث خطأ في تحديث المواقيت. جاري عرض البيانات المخزنة.");
      loadCachedData(date);
    } finally {
      setLoading(false);
    }
  }, [settings.prayer.method, settings.prayer.adjustments, settings.prayer.savedCity, updateSettings]);

  const loadCachedData = (date: Date) => {
    const dateStr = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
    const cached = localStorage.getItem(`cached_prayers_${dateStr}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      setPrayers(parsed.prayers);
      setTimingsRaw(parsed.timings);
      setHijriDate({
        day: parsed.hijri.day,
        month: parsed.hijri.month.ar,
        year: parsed.hijri.year,
        dayName: "وضع عدم الاتصال"
      });
    }
  };

  /**
   * تحديد الموقع تلقائياً باستخدام GPS
   */
  const useCurrentLocation = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("متصفحك لا يدعم تحديد الموقع الجغرافي");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // محاولة جلب اسم المدينة برمجياً بناءً على الإحداثيات
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`);
          const geoData = await geoRes.json();
          const cityName = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.state || "موقعك الحالي";
          await fetchByCoords(latitude, longitude, viewDate, cityName);
          updateSettings({ autoLocation: true, savedCoords: { lat: latitude, lon: longitude }, savedCity: cityName });
        } catch {
          await fetchByCoords(latitude, longitude, viewDate, "موقعك الحالي");
          updateSettings({ autoLocation: true, savedCoords: { lat: latitude, lon: longitude } });
        }
      },
      (err) => {
        setLoading(false);
        setError("فشل تحديد الموقع. يرجى تفعيل GPS أو اختيار المدينة يدوياً.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  /**
   * البحث عن مدينة باللغة العربية أو الإنجليزية
   */
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=ar,en&limit=8`);
        const data = await res.json();
        setSearchResults(data);
      } catch (e) {
        console.error("Search failed", e);
      }
    }, 400);
  };

  const selectCity = (city: any) => {
    const name = city.display_name.split(',')[0];
    fetchByCoords(parseFloat(city.lat), parseFloat(city.lon), viewDate, name);
    setShowSearch(false);
    setSearchQuery('');
  };

  // حساب الصلاة القادمة والعداد التنازلي
  const nextPrayerInfo = useMemo(() => {
    if (!prayers.length) return null;
    const now = currentTime;
    const sorted = [...prayers]
      .filter(p => p.name !== 'Sunrise')
      .map(p => {
        const [h, m] = p.time.split(':').map(Number);
        const pDate = new Date(now);
        pDate.setHours(h, m, 0, 0);
        if (pDate < now) pDate.setDate(pDate.getDate() + 1);
        return { ...p, date: pDate };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const next = sorted[0];
    const diff = next.date.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
    const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
    const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');

    return { name: next.arabicName, countdown: `${h}:${m}:${s}` };
  }, [prayers, currentTime]);

  const spiritualTimes = useMemo(() => {
    if (!timingsRaw) return null;
    const [mh, mm] = timingsRaw.Maghrib.split(':').map(Number);
    const [fh, fm] = timingsRaw.Fajr.split(':').map(Number);
    const mDate = new Date(); mDate.setHours(mh, mm, 0);
    const fDate = new Date(); fDate.setHours(fh, fm, 0);
    if (fDate < mDate) fDate.setDate(fDate.getDate() + 1);
    const duration = fDate.getTime() - mDate.getTime();
    const mid = new Date(mDate.getTime() + duration / 2);
    const third = new Date(mDate.getTime() + (duration * 2) / 3);
    const fmt = (d: Date) => d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true });
    return { midnight: fmt(mid), lastThird: fmt(third) };
  }, [timingsRaw]);

  useEffect(() => {
    if (settings.prayer.savedCoords) {
      fetchByCoords(settings.prayer.savedCoords.lat, settings.prayer.savedCoords.lon, viewDate);
    } else {
      useCurrentLocation();
    }
  }, [viewDate, settings.prayer.method, settings.prayer.adjustments]);

  return (
    <div className={`min-h-screen ${settings.darkMode ? 'bg-slate-900 text-white' : 'bg-[#f8fafc] text-slate-800'} animate-in fade-in duration-500 pb-32`}>
      
      {/* Header Area with Sky Gradient & Mosque Illustration */}
      <div className="relative overflow-hidden bg-gradient-to-b from-sky-400 via-sky-100 to-[#f8fafc] dark:from-sky-900 dark:via-slate-900 dark:to-slate-900 pt-12 pb-32 px-6 flex flex-col items-center">
        
        {/* Countdown UI */}
        <div className="text-center z-10 space-y-2">
          <p className="text-lg font-bold text-sky-800 dark:text-sky-300 flex items-center justify-center gap-2">
            <Timer size={20} className="animate-pulse" /> {nextPrayerInfo?.name} بعد
          </p>
          <h1 className="text-7xl font-black font-mono tracking-tighter text-sky-900 dark:text-white drop-shadow-sm">
            {nextPrayerInfo?.countdown || '00:00:00'}
          </h1>
          
          <div className="flex gap-2 justify-center mt-6">
            <button 
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 bg-white/40 dark:bg-slate-800/60 backdrop-blur-xl px-5 py-2.5 rounded-full text-sm font-bold border border-white/60 dark:border-slate-700 text-sky-900 dark:text-sky-200 shadow-sm transition-all active:scale-95"
            >
              <MapPin size={16} className="text-sky-600" /> {settings.prayer.savedCity}
            </button>
            <button 
              onClick={() => setShowConfig(true)}
              className="p-2.5 bg-white/40 dark:bg-slate-800/60 backdrop-blur-xl rounded-full border border-white/60 dark:border-slate-700 text-sky-900 dark:text-sky-200 shadow-sm"
              title="إعدادات الحساب"
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={() => settings.prayer.savedCoords && fetchByCoords(settings.prayer.savedCoords.lat, settings.prayer.savedCoords.lon)}
              className={`p-2.5 bg-white/40 dark:bg-slate-800/60 backdrop-blur-xl rounded-full border border-white/60 dark:border-slate-700 text-sky-900 dark:text-sky-200 shadow-sm ${loading ? 'animate-spin' : ''}`}
              title="تحديث المواقيت"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {/* Mosque Vector Design */}
        <div className="absolute bottom-0 left-0 right-0 h-48 opacity-100 pointer-events-none select-none flex justify-center items-end overflow-hidden">
          <svg width="400" height="180" viewBox="0 0 400 180" fill="none" className="w-full max-lg translate-y-2 transition-all duration-700">
            <rect x="120" y="100" width="160" height="80" fill={settings.darkMode ? '#1e293b' : '#e2e8f0'} />
            <path d="M140 80C140 46.8629 166.863 20 200 20C233.137 20 260 46.8629 260 80H140Z" fill="#f59e0b" />
            <rect x="100" y="50" width="16" height="130" fill={settings.darkMode ? '#0f172a' : '#cbd5e1'} />
            <path d="M100 45L108 25L116 45H100Z" fill={settings.darkMode ? '#334155' : '#94a3b8'} />
            <rect x="284" y="50" width="16" height="130" fill={settings.darkMode ? '#0f172a' : '#cbd5e1'} />
            <path d="M284 45L292 25L300 45H284Z" fill={settings.darkMode ? '#334155' : '#94a3b8'} />
          </svg>
        </div>
      </div>

      {error && (
        <div className="mx-6 -mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-3xl flex items-center gap-3 text-red-700 dark:text-red-400 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* Hijri Date Navigation */}
      <div className="relative z-20 px-6 -mt-8">
        <div className={`bg-white dark:bg-slate-800 rounded-3xl shadow-xl border ${settings.darkMode ? 'border-slate-700' : 'border-slate-100'} p-5 flex items-center justify-between`}>
          <button onClick={() => changeDate(-1)} className="p-2.5 text-sky-600 bg-sky-50 dark:bg-sky-900/20 rounded-2xl transition-all active:scale-90"><ChevronRight size={26} /></button>
          <div className="text-center">
            <h3 className="text-xl font-black font-quran text-slate-800 dark:text-white leading-tight">
              {hijriDate.dayName} {hijriDate.day} {hijriDate.month} {hijriDate.year}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">التاريخ الهجري</p>
          </div>
          <button onClick={() => changeDate(1)} className="p-2.5 text-sky-600 bg-sky-50 dark:bg-sky-900/20 rounded-2xl transition-all active:scale-90"><ChevronLeft size={26} /></button>
        </div>
      </div>

      {/* Prayer Times Horizontal List */}
      <div className="p-6">
        <div className={`bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border ${settings.darkMode ? 'border-slate-700' : 'border-slate-100'} overflow-hidden`}>
          <div className="flex overflow-x-auto p-5 gap-3 no-scrollbar scroll-smooth">
            {prayers.map((p) => {
              const isCurrent = nextPrayerInfo?.name === p.arabicName;
              return (
                <div key={p.name} className={`flex-shrink-0 min-w-[110px] flex flex-col items-center py-7 px-4 rounded-[2.2rem] transition-all duration-300 ${isCurrent ? 'bg-sky-500 text-white shadow-xl shadow-sky-200/50 scale-105' : 'bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400'}`}>
                  <span className={`text-[11px] font-black mb-3 uppercase tracking-tighter ${isCurrent ? 'text-white/80' : 'opacity-60'}`}>{p.arabicName}</span>
                  <div className={`text-4xl mb-4 transition-transform ${isCurrent ? 'scale-110' : 'grayscale opacity-30'}`}>{p.icon}</div>
                  <span className={`text-sm font-black font-mono ${isCurrent ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                    {p.time.replace(/([0-9]{2}):([0-9]{2})/, (_, h, m) => {
                       const hours = parseInt(h);
                       return `${(hours % 12 || 12).toString().padStart(2, '0')}:${m}`;
                    })}
                  </span>
                  <span className={`text-[10px] mt-1 font-bold ${isCurrent ? 'text-white/60' : 'opacity-30'}`}>{parseInt(p.time) >= 12 ? 'PM' : 'AM'}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Spiritual Info: Midnight & Last Third */}
      {spiritualTimes && (
        <div className="px-6 grid grid-cols-2 gap-4">
          <div className="p-6 rounded-[2.5rem] bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 flex flex-col items-center text-center gap-2">
             <Moon className="text-indigo-500" size={24} />
             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">منتصف الليل</span>
             <span className="text-xl font-black text-indigo-800 dark:text-indigo-300 font-mono">{spiritualTimes.midnight}</span>
          </div>
          <div className="p-6 rounded-[2.5rem] bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 flex flex-col items-center text-center gap-2">
             <Star className="text-amber-500" size={24} />
             <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">الثلث الأخير</span>
             <span className="text-xl font-black text-amber-800 dark:text-amber-300 font-mono">{spiritualTimes.lastThird}</span>
          </div>
        </div>
      )}

      {/* Global Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-sky-50/30 dark:bg-sky-900/10">
                <h3 className="font-black text-xl flex items-center gap-2 text-sky-800 dark:text-sky-300"><Globe className="text-sky-500" /> تغيير الموقع</h3>
                <button onClick={() => setShowSearch(false)} className="p-3 bg-white dark:bg-slate-700 rounded-full shadow-md text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
             </div>
             <div className="p-8 space-y-6">
               <div className="relative group">
                 <input 
                  type="text" 
                  placeholder="ابحث عن مدينة أو منطقة بالعربية أو الإنجليزية..." 
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className={`w-full p-5 pr-14 rounded-3xl border outline-none focus:ring-4 focus:ring-sky-500/10 transition-all ${settings.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
                 />
                 <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={24} />
               </div>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-sky-600">نتائج البحث</h4>
                    <button onClick={useCurrentLocation} className="text-[11px] font-bold text-sky-500 flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-900/20 rounded-full active:scale-95 transition-all">
                      <Navigation size={14} /> موقعي الحالي (GPS)
                    </button>
                  </div>
                  <div className="max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                    {searchResults.length === 0 && searchQuery.length > 2 && !loading && (
                      <p className="text-center py-8 text-slate-400 text-sm">لم يتم العثور على المدينة المطلوبة</p>
                    )}
                    {searchResults.map((res, idx) => (
                      <button key={idx} onClick={() => selectCity(res)} className={`w-full p-5 rounded-3xl border text-right transition-all group flex items-start gap-4 ${settings.darkMode ? 'bg-slate-800 border-slate-700 hover:border-sky-500' : 'bg-white border-slate-100 hover:border-sky-300 hover:shadow-md'}`}>
                        <div className="p-2 bg-sky-50 dark:bg-sky-900/20 text-sky-500 rounded-xl group-hover:scale-110 transition-transform"><MapIcon size={20} /></div>
                        <div className="flex-1">
                          <span className="font-black text-sm block text-slate-800 dark:text-white">{res.display_name.split(',')[0]}</span>
                          <span className="text-[10px] text-slate-400 block mt-1 line-clamp-1">{res.display_name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Configuration & Method Settings Modal */}
      {showConfig && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 max-h-[85vh]">
             <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-amber-50/40 dark:bg-amber-900/10">
                <h3 className="font-black text-xl flex items-center gap-2 text-amber-800 dark:text-amber-300"><Settings className="text-amber-500" /> إعدادات الحساب</h3>
                <button onClick={() => setShowConfig(false)} className="p-3 bg-white dark:bg-slate-700 rounded-full shadow-md text-slate-400"><X size={24} /></button>
             </div>
             <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
               <div className="space-y-4">
                  <h4 className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">طريقة الحساب المتبعة</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {METHODS.map(m => (
                      <button 
                        key={m.id} 
                        onClick={() => updateSettings({ method: m.id })}
                        className={`p-5 rounded-3xl border text-right transition-all flex justify-between items-center ${settings.prayer.method === m.id ? 'bg-amber-500 border-amber-600 text-white shadow-xl shadow-amber-200/50' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-amber-300'}`}
                      >
                        <span className="text-sm font-bold">{m.name}</span>
                        {settings.prayer.method === m.id && <CheckCircle2 size={22} />}
                      </button>
                    ))}
                  </div>
               </div>
               <div className="space-y-4">
                  <h4 className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">الضبط اليدوي الدقيق (± دقائق)</h4>
                  <div className="space-y-3">
                    {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(p => (
                      <div key={p} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-700">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{p === 'Fajr' ? 'الفجر' : p === 'Dhuhr' ? 'الظهر' : p === 'Asr' ? 'العصر' : p === 'Maghrib' ? 'المغرب' : 'العشاء'}</span>
                        <div className="flex items-center gap-4">
                          <button onClick={() => updateSettings({ adjustments: { ...settings.prayer.adjustments, [p]: (settings.prayer.adjustments[p] || 0) - 1 } })} className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-amber-600 font-bold active:scale-90 transition-transform">-</button>
                          <span className={`font-mono font-bold w-10 text-center text-lg ${settings.prayer.adjustments[p] > 0 ? 'text-emerald-500' : settings.prayer.adjustments[p] < 0 ? 'text-rose-500' : ''}`}>
                            {settings.prayer.adjustments[p] || 0}
                          </span>
                          <button onClick={() => updateSettings({ adjustments: { ...settings.prayer.adjustments, [p]: (settings.prayer.adjustments[p] || 0) + 1 } })} className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-amber-600 font-bold active:scale-90 transition-transform">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
