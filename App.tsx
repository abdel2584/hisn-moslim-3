
import React, { useState, useEffect, useMemo } from 'react';
import { Zikr, CategoryId, UserStats, AppSettings } from './types';
import { AZKAR_DATA } from './data';
import { Dashboard } from './components/Dashboard';
import { ZikrCard } from './components/ZikrCard';
import { AdhiyaSection } from './components/AdhiyaSection';
import { QuranSection } from './components/QuranSection';
import { SirahSection } from './components/SirahSection';
import { Grid2X2, Settings2, BellRing, ChevronRight, Moon, Sun, Plus, X, Trash2, Smartphone, Library, Compass, ScrollText } from 'lucide-react';
import confetti from 'canvas-confetti';

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'home'>('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [newZikrText, setNewZikrText] = useState('');
  const [newZikrCount, setNewZikrCount] = useState(3);

  const [azkar, setAzkar] = useState<Zikr[]>(() => {
    const saved = localStorage.getItem('azkar_progress_v5');
    if (saved) {
      const parsed = JSON.parse(saved);
      const userItems = parsed.filter((p: any) => p.isUserAdded);
      const standardItems = AZKAR_DATA.map(item => {
        const found = parsed.find((p: any) => p.id === item.id);
        return found ? { ...item, currentCount: found.currentCount } : item;
      });
      return [...standardItems, ...userItems];
    }
    return AZKAR_DATA;
  });

  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('user_stats_v5');
    if (saved) return JSON.parse(saved);
    return { streak: 1, lastUpdate: new Date().toISOString(), completedToday: [], dailyProgress: {} };
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings_v5');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.prayer) {
        parsed.prayer = {
          method: 4,
          adjustments: {},
          savedCity: 'مكة المكرمة',
          savedCoords: null,
          autoLocation: true,
        };
      }
      return parsed;
    }
    return {
      fontSize: 22,
      vibration: true,
      darkMode: false,
      notifications: {
        morning: true,
        evening: true,
        sleep: true,
        ramadan: true,
        lastTenDays: true,
      },
      prayer: {
        method: 4,
        adjustments: {},
        savedCity: 'مكة المكرمة',
        savedCoords: null,
        autoLocation: true,
      }
    };
  });

  useEffect(() => localStorage.setItem('azkar_progress_v5', JSON.stringify(azkar)), [azkar]);
  useEffect(() => localStorage.setItem('app_settings_v5', JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem('user_stats_v5', JSON.stringify(stats)), [stats]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const totalCurrent = azkar.reduce((acc, z) => acc + z.currentCount, 0);
    const totalRequired = azkar.reduce((acc, z) => acc + z.count, 0);
    const currentProgress = totalRequired > 0 ? Math.round((totalCurrent / totalRequired) * 100) : 0;

    setStats(prev => {
      const nextProgress = { ...prev.dailyProgress, [today]: currentProgress };
      return { ...prev, dailyProgress: nextProgress };
    });
  }, [azkar]);

  const activeAzkar = useMemo(() => azkar.filter(z => z.category === activeCategory), [azkar, activeCategory]);
  const startedTodayCount = azkar.filter(z => z.currentCount > 0).length;
  const totalAzkarCount = azkar.length;

  const handleCount = (id: string) => {
    setAzkar(prev => prev.map(z => {
      if (z.id === id && z.currentCount < z.count) {
        const newCount = z.currentCount + 1;
        if (newCount === z.count && startedTodayCount % 5 === 0) confetti();
        return { ...z, currentCount: newCount };
      }
      return z;
    }));
  };

  const handleReset = (id: string) => {
    setAzkar(prev => prev.map(z => z.id === id ? { ...z, currentCount: 0 } : z));
  };

  const handleAddCustom = () => {
    if (!newZikrText.trim()) return;
    const newEntry: Zikr & { isUserAdded: boolean } = {
      id: `custom_${Date.now()}`,
      text: newZikrText,
      count: newZikrCount,
      currentCount: 0,
      category: activeCategory as CategoryId,
      isUserAdded: true,
      source: 'إضافة شخصية'
    };
    setAzkar(prev => [...prev, newEntry]);
    setNewZikrText('');
    setNewZikrCount(3);
    setIsModalOpen(false);
  };

  return (
    <div className={`min-h-screen pb-24 transition-colors duration-300 ${settings.darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-900'}`} style={{ fontSize: `${settings.fontSize}px` }}>
      <header className="sticky top-0 z-50 p-4 spirit-gradient shadow-lg text-white rounded-b-[2rem]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {activeCategory !== 'home' ? (
            <button onClick={() => setActiveCategory('home')} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
              <ChevronRight />
            </button>
          ) : <div className="w-10"></div>}
          <h1 className="text-xl font-bold flex flex-col items-center">
             <span className="font-quran gold-text text-2xl tracking-widest">حصن المسلم</span>
          </h1>
          <button onClick={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
            {settings.darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        {activeCategory === 'home' && (
          <Dashboard stats={stats} totalAzkarCount={totalAzkarCount} startedTodayCount={startedTodayCount} onSelectCategory={setActiveCategory} settings={settings} />
        )}
        {activeCategory === 'supplications' && <AdhiyaSection onAddCustom={() => setIsModalOpen(true)} settings={settings} />}
        {activeCategory === 'quran' && <QuranSection settings={settings} />}
        {activeCategory === 'sirah' && <SirahSection settings={settings} />}

        {(activeCategory !== 'home' && activeCategory !== 'supplications' && activeCategory !== 'quran' && activeCategory !== 'sirah') && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className={`flex justify-between items-center mb-4 sticky top-20 z-40 backdrop-blur-md py-3 rounded-2xl px-4 shadow-sm border ${settings.darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-gray-100'}`}>
               <h2 className="text-xl font-bold text-emerald-600">
                 {activeCategory === 'morning' ? 'أذكار الصباح 🌅' : 
                  activeCategory === 'evening' ? 'أذكار المساء 🌙' :
                  activeCategory === 'prayer' ? 'أذكار الصلاة 🤲' :
                  activeCategory === 'sleep' ? 'أذكار النوم 💤' : 'التحصين 🛡️'}
               </h2>
               <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 text-white p-2 rounded-full shadow-lg hover:bg-emerald-700"><Plus size={18} /></button>
            </div>
            {activeAzkar.map(zikr => (
              <ZikrCard key={zikr.id} zikr={zikr} onCount={handleCount} onReset={handleReset} darkMode={settings.darkMode} />
            ))}
          </div>
        )}
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 p-4 border-t transition-colors ${settings.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} z-50 rounded-t-[2.5rem] shadow-2xl`}>
        <div className="max-w-md mx-auto flex justify-around items-center">
          <button onClick={() => setActiveCategory('sirah')} className={`flex flex-col items-center gap-1 transition-colors ${activeCategory === 'sirah' ? 'text-emerald-600 scale-110 font-bold' : 'text-gray-400'}`}>
            <ScrollText size={22} /><span className="text-[10px] font-bold">السيرة</span>
          </button>
          <button onClick={() => setActiveCategory('quran')} className={`flex flex-col items-center gap-1 transition-colors ${activeCategory === 'quran' ? 'text-emerald-600 scale-110 font-bold' : 'text-gray-400'}`}>
            <Library size={22} /><span className="text-[10px] font-bold">القرآن</span>
          </button>
          <div className="relative -top-10">
             <button onClick={() => setActiveCategory('home')} className="bg-emerald-600 text-white p-5 rounded-full shadow-emerald-200 shadow-2xl border-4 border-white active:scale-95 transition-transform">
               <Grid2X2 size={28} />
             </button>
          </div>
          <button onClick={() => setIsNotificationsOpen(true)} className={`flex flex-col items-center gap-1 transition-colors ${isNotificationsOpen ? 'text-emerald-600 scale-110 font-bold' : 'text-gray-400'}`}>
            <BellRing size={22} /><span className="text-[10px] font-bold">تنبيهات</span>
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className={`flex flex-col items-center gap-1 transition-colors ${isSettingsOpen ? 'text-emerald-600 scale-110 font-bold' : 'text-gray-400'}`}>
            <Settings2 size={22} /><span className="text-[10px] font-bold">إعدادات</span>
          </button>
        </div>
      </nav>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`${settings.darkMode ? 'bg-slate-800 text-white' : 'bg-white'} w-full max-w-md rounded-t-[3rem] p-8 shadow-2xl space-y-8 animate-in slide-in-from-bottom duration-300`}>
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold flex items-center gap-2"><Settings2 className="text-emerald-500" /> الإعدادات</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full transition-all hover:bg-red-50 hover:text-red-500"><X size={20} /></button>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3"><Smartphone className="text-blue-500" /> الوضع الليلي</div>
                <button onClick={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))} className={`w-14 h-8 rounded-full relative transition-colors ${settings.darkMode ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings.darkMode ? 'right-7' : 'right-1'}`} />
                </button>
              </div>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-colors"><Trash2 size={18} /> مسح البيانات</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Zikr Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`${settings.darkMode ? 'bg-slate-800 text-white' : 'bg-white'} w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200`}>
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold">إضافة ذكر مخصص</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X /></button>
            </div>
            <textarea value={newZikrText} onChange={(e) => setNewZikrText(e.target.value)} placeholder="أدخل نص الذكر هنا..." className={`w-full p-4 rounded-2xl border outline-none min-h-[120px] transition-all focus:ring-2 focus:ring-emerald-500 ${settings.darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-100 text-black'}`} />
            <div className="space-y-2">
              <label className="text-xs font-bold opacity-60">عدد المرات: {newZikrCount}</label>
              <input type="range" min="1" max="100" value={newZikrCount} onChange={(e) => setNewZikrCount(parseInt(e.target.value))} className="w-full h-2 bg-emerald-100 rounded-lg accent-emerald-600" />
            </div>
            <button onClick={handleAddCustom} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg transition-transform active:scale-95">تأكيد الإضافة</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
