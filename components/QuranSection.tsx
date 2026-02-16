
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SurahMeta, SurahDetail, Ayah, AppSettings } from '../types';
import { Search, ChevronRight, Bookmark, Share2, Volume2, Play, Pause, Loader2, BookOpen, Star, Info, WifiOff, BookText, X, Check } from 'lucide-react';

interface QuranSectionProps {
  settings: AppSettings;
}

export const QuranSection: React.FC<QuranSectionProps> = ({ settings }) => {
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurah, setSelectedSurah] = useState<SurahDetail | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'read' | 'search'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ surahName: string, surahNumber: number, ayahs: Ayah[] }[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Tafsir state
  const [activeTafsir, setActiveTafsir] = useState<{ text: string, ayahNumber: number, surahName: string } | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);

  // Selected Ayah for Actions
  const [selectedAyahId, setSelectedAyahId] = useState<number | null>(null);

  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    const saved = localStorage.getItem('quran_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [lastRead, setLastRead] = useState<{ surahNumber: number, surahName: string, ayahNumber: number } | null>(() => {
    const saved = localStorage.getItem('quran_last_read');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [activeAudio, setActiveAudio] = useState<number | null>(null);

  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    
    fetchSurahs();
    
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const fetchSurahs = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.alquran.cloud/v1/meta');
      const data = await response.json();
      if (data.data && data.data.surahs) {
        setSurahs(data.data.surahs.references);
        localStorage.setItem('quran_meta_cache', JSON.stringify(data.data.surahs.references));
      }
    } catch (error) {
      console.error("Failed to fetch surahs", error);
      const localMeta = localStorage.getItem('quran_meta_cache');
      if (localMeta) setSurahs(JSON.parse(localMeta));
    } finally {
      setLoading(false);
    }
  };

  const fetchSurahDetail = async (number: number) => {
    setLoading(true);
    setSelectedAyahId(null);
    try {
      const response = await fetch(`https://api.alquran.cloud/v1/surah/${number}`);
      const data = await response.json();
      if (data.data) {
        setSelectedSurah(data.data);
        setViewMode('read');
        const last = { surahNumber: number, surahName: data.data.name, ayahNumber: 1 };
        setLastRead(last);
        localStorage.setItem('quran_last_read', JSON.stringify(last));
      }
    } catch (error) {
      console.error("Failed to fetch surah details", error);
      alert("هذا المحتوى غير متاح حالياً بدون إنترنت. يرجى الاتصال بالشبكة لتحميل السورة أول مرة.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTafsir = async (ayahNumberFull: number, ayahNumberInSurah: number, surahName: string) => {
    setTafsirLoading(true);
    try {
      const response = await fetch(`https://api.alquran.cloud/v1/ayah/${ayahNumberFull}/ar.jalalayn`);
      const data = await response.json();
      if (data.data && data.data.text) {
        setActiveTafsir({
          text: data.data.text,
          ayahNumber: ayahNumberInSurah,
          surahName: surahName
        });
      }
    } catch (error) {
      console.error("Failed to fetch Tafsir", error);
      alert("لا يمكن تحميل التفسير حالياً بدون إنترنت.");
    } finally {
      setTafsirLoading(false);
      setSelectedAyahId(null);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    if (isOffline) {
      alert("البحث المتقدم يتطلب اتصالاً بالإنترنت.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`https://api.alquran.cloud/v1/search/${searchQuery}/all/ar`);
      const data = await response.json();
      if (data.data && data.data.results) {
        const grouped: any = {};
        data.data.results.forEach((res: any) => {
          if (!grouped[res.surah.number]) {
            grouped[res.surah.number] = {
              surahName: res.surah.name,
              surahNumber: res.surah.number,
              ayahs: []
            };
          }
          grouped[res.surah.number].ayahs.push(res);
        });
        setSearchResults(Object.values(grouped));
        setViewMode('search');
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = (ayahNumber: number) => {
    setBookmarks(prev => {
      const next = prev.includes(ayahNumber) ? prev.filter(b => b !== ayahNumber) : [...prev, ayahNumber];
      localStorage.setItem('quran_bookmarks', JSON.stringify(next));
      return next;
    });
    setSelectedAyahId(null);
  };

  const playAyahAudio = (ayahNumberFull: number, text: string) => {
    setSelectedAyahId(null);
    if (isOffline) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      setActiveAudio(ayahNumberFull);
      utterance.onend = () => setActiveAudio(null);
      window.speechSynthesis.speak(utterance);
      return;
    }

    const audio = new Audio(`https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayahNumberFull}.mp3`);
    if (activeAudio === ayahNumberFull) {
       setActiveAudio(null);
    } else {
      setActiveAudio(ayahNumberFull);
      audio.play();
      audio.onended = () => setActiveAudio(null);
      audio.onerror = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        window.speechSynthesis.speak(utterance);
      };
    }
  };

  const handleShare = (text: string, surah: string, ayah: number) => {
    setSelectedAyahId(null);
    if (navigator.share) {
      navigator.share({
        title: 'آية من القرآن الكريم',
        text: ` قال تعالى: {${text}} [سورة ${surah} - آية ${ayah}]`,
      });
    }
  };

  const filteredSurahs = useMemo(() => {
    return surahs.filter(s => s.name.includes(searchQuery) || s.number.toString() === searchQuery);
  }, [surahs, searchQuery]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom duration-500 pb-12">
      {/* Tafsir Overlay Modal */}
      {activeTafsir && (
        <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`${settings.darkMode ? 'bg-slate-800 text-white' : 'bg-white'} w-full max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 shadow-2xl space-y-4 relative overflow-hidden animate-in slide-in-from-bottom duration-300`}>
             <div className="absolute top-0 right-0 left-0 h-2 spirit-gradient"></div>
             <div className="flex justify-between items-center mb-2">
               <h3 className="text-xl font-bold text-emerald-600 flex items-center gap-2">
                 <BookText size={20} /> تفسير الآية {activeTafsir.ayahNumber} - سورة {activeTafsir.surahName}
               </h3>
               <button onClick={() => setActiveTafsir(null)} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full hover:bg-gray-200 transition-colors"><X size={20} /></button>
             </div>
             <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-lg leading-relaxed text-right font-quran text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                  {activeTafsir.text}
                </p>
                <p className="text-[10px] mt-4 opacity-50 text-left">المصدر: تفسير الجلالين</p>
             </div>
             <button onClick={() => setActiveTafsir(null)} className="w-full py-4 spirit-gradient text-white rounded-2xl font-bold shadow-lg mt-4">فهمت</button>
          </div>
        </div>
      )}

      {/* Offline Banner */}
      {isOffline && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-sm font-bold">
          <WifiOff size={18} />
          <span>أنت تعمل حالياً في وضع عدم الاتصال. يمكنك تصفح السور التي تم فتحها مسبقاً فقط.</span>
        </div>
      )}

      {/* Search Header */}
      {viewMode !== 'read' && (
        <div className="mb-6 relative group">
          <input
            type="text"
            placeholder="ابحث عن سورة أو كلمة في القرآن..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className={`w-full p-4 pr-12 rounded-3xl shadow-sm border focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${settings.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500" size={20} />
          {searchQuery && !isOffline && (
            <button onClick={handleSearch} className="absolute left-4 top-1/2 -translate-y-1/2 bg-emerald-600 text-white px-4 py-1.5 rounded-2xl text-xs font-bold shadow-md">بحث</button>
          )}
        </div>
      )}

      {/* View Logic */}
      {loading && viewMode === 'list' ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-emerald-600" size={48} />
          <p className="text-emerald-700 font-bold">جاري تحميل المصحف الشريف...</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-6">
          {lastRead && (
            <button 
              onClick={() => fetchSurahDetail(lastRead.surahNumber)}
              className="w-full p-6 spirit-gradient rounded-[2.5rem] text-white flex items-center justify-between shadow-lg hover:scale-[1.02] transition-transform"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl"><BookOpen /></div>
                <div className="text-right">
                  <p className="text-xs opacity-70">آخر ما قرأت</p>
                  <p className="text-xl font-bold">سورة {lastRead.surahName}</p>
                </div>
              </div>
              <ChevronRight className="rotate-180" />
            </button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSurahs.map(s => (
              <button
                key={s.number}
                onClick={() => fetchSurahDetail(s.number)}
                className={`flex items-center justify-between p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all group ${settings.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 hover:border-emerald-300'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 flex items-center justify-center rounded-2xl font-bold transition-colors ${settings.darkMode ? 'bg-slate-700 text-emerald-400' : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'}`}>
                    {s.number}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.numberOfAyahs} آية • {s.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-500 rotate-180" />
              </button>
            ))}
          </div>
        </div>
      ) : viewMode === 'read' && selectedSurah ? (
        <div className="space-y-6 animate-in slide-in-from-left duration-300">
          <div className="flex justify-between items-center bg-emerald-50/50 p-4 rounded-3xl backdrop-blur-sm sticky top-20 z-40">
            <button onClick={() => setViewMode('list')} className="flex items-center gap-1 text-emerald-700 font-bold">
              <ChevronRight /> الفهرس
            </button>
            <h2 className="text-2xl font-bold text-emerald-900 font-quran">{selectedSurah.name}</h2>
            <div className="flex gap-2">
               <button className="p-2 bg-white rounded-xl shadow-sm text-gray-500 hover:text-emerald-600"><Info size={18} /></button>
            </div>
          </div>

          <div 
            className={`p-8 rounded-[3rem] shadow-xl border leading-loose text-justify relative ${settings.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-50'}`} 
            style={{ fontSize: `${settings.fontSize + 4}px` }}
          >
            {selectedSurah.number !== 1 && selectedSurah.number !== 9 && (
              <div className="text-center font-quran text-4xl mb-12 gold-text drop-shadow-sm">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
            )}
            
            <div className="font-quran space-x-reverse space-x-2 select-none">
              {selectedSurah.ayahs.map(a => (
                <span 
                  key={a.number} 
                  className={`relative inline-block transition-all duration-300 rounded-xl cursor-pointer ${
                    selectedAyahId === a.number ? 'bg-emerald-500/20 ring-4 ring-emerald-500/10 z-10' : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                  onClick={() => setSelectedAyahId(selectedAyahId === a.number ? null : a.number)}
                >
                  <span className="px-1 py-1 block">
                    {a.text}
                    <div className={`inline-flex items-center justify-center w-8 h-8 mx-2 border-2 rounded-full text-xs font-bold transition-colors ${
                       selectedAyahId === a.number 
                        ? 'bg-emerald-600 border-emerald-700 text-white scale-110' 
                        : 'border-emerald-600 text-emerald-700'
                    }`}>
                      {a.numberInSurah}
                    </div>

                    {/* Modern Action Bar Overlay */}
                    {selectedAyahId === a.number && (
                      <div 
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 animate-in slide-in-from-bottom-2 zoom-in-95 duration-200 z-[100]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className={`flex items-center gap-1 p-1.5 rounded-2xl shadow-2xl border ${
                          settings.darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100'
                        }`}>
                          <ActionButton 
                            icon={<Bookmark size={18} />} 
                            label="حفظ" 
                            active={bookmarks.includes(a.number)} 
                            onClick={() => toggleBookmark(a.number)} 
                            settings={settings}
                          />
                          <ActionButton 
                            icon={<BookText size={18} />} 
                            label="تفسير" 
                            onClick={() => fetchTafsir(a.number, a.numberInSurah, selectedSurah.name)} 
                            settings={settings}
                          />
                          <ActionButton 
                            icon={<Volume2 size={18} />} 
                            label="صوت" 
                            active={activeAudio === a.number}
                            onClick={() => playAyahAudio(a.number, a.text)} 
                            settings={settings}
                          />
                          <ActionButton 
                            icon={<Share2 size={18} />} 
                            label="مشاركة" 
                            onClick={() => handleShare(a.text, selectedSurah.name, a.numberInSurah)} 
                            settings={settings}
                          />
                          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1"></div>
                          <button 
                            onClick={() => setSelectedAyahId(null)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                          >
                            <X size={18} />
                          </button>
                        </div>
                        {/* Caret */}
                        <div className={`w-3 h-3 rotate-45 mx-auto -mt-1.5 border-r border-b ${
                          settings.darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100'
                        }`}></div>
                      </div>
                    )}
                  </span>
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between mt-8 px-4">
             {selectedSurah.number > 1 && (
               <button 
                onClick={() => fetchSurahDetail(selectedSurah.number - 1)} 
                className={`p-4 rounded-2xl font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95 ${
                  settings.darkMode ? 'bg-slate-800 text-slate-300' : 'bg-emerald-50 text-emerald-700'
                }`}
               >
                 <ChevronRight /> السورة السابقة
               </button>
             )}
             {selectedSurah.number < 114 && (
               <button 
                onClick={() => fetchSurahDetail(selectedSurah.number + 1)} 
                className="p-4 spirit-gradient text-white rounded-2xl font-bold shadow-md flex items-center gap-2 transition-all active:scale-95"
               >
                 السورة التالية <ChevronRight className="rotate-180" />
               </button>
             )}
          </div>
        </div>
      ) : viewMode === 'search' ? (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">نتائج البحث عن: <span className="text-emerald-600">{searchQuery}</span></h2>
            <button onClick={() => setViewMode('list')} className="text-emerald-700 font-bold underline">إغلاق النتائج</button>
          </div>
          
          {searchResults.length === 0 ? (
            <div className="text-center py-20 text-gray-400">لا توجد نتائج مطابقة</div>
          ) : (
            searchResults.map(res => (
              <div key={res.surahNumber} className={`p-6 rounded-[2.5rem] shadow-sm border ${settings.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="font-bold text-lg font-quran text-emerald-700">سورة {res.surahName}</h3>
                  <button onClick={() => fetchSurahDetail(res.surahNumber)} className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">انتقال للسورة</button>
                </div>
                <div className="space-y-4">
                  {res.ayahs.map((a: any) => (
                    <div key={a.number} className="p-3 hover:bg-emerald-50/50 rounded-2xl transition-colors cursor-pointer" onClick={() => fetchSurahDetail(res.surahNumber)}>
                      <p className="font-quran text-lg leading-relaxed text-right">{a.text}</p>
                      <p className="text-[10px] text-gray-400 mt-1">آية رقم {a.numberInSurah}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
};

const ActionButton: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, active?: boolean, settings: AppSettings }> = ({ icon, label, onClick, active, settings }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2.5 min-w-[56px] rounded-xl transition-all gap-1 group ${
        active 
          ? 'bg-emerald-600 text-white shadow-lg scale-110 z-10' 
          : 'text-gray-500 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600'
      }`}
    >
      <div className={`${active ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
};
