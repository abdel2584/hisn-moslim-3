
import React, { useState, useMemo } from 'react';
import { PROPHETS_DATA, SEERAH_DATA, HADITH_DATA, WILLS_DATA } from '../data';
import { Prophet, SeerahEvent, Hadith, Will, AppSettings } from '../types';
import { Search, ChevronLeft, ChevronRight, BookOpen, Star, Share2, Volume2, Info, Users, Heart, ShieldCheck, Map, Clock, History, Zap, Lightbulb, GraduationCap } from 'lucide-react';
import { playZikrAudio } from '../services/geminiService';

interface SirahSectionProps {
  settings: AppSettings;
}

export const SirahSection: React.FC<SirahSectionProps> = ({ settings }) => {
  const [activeTab, setActiveTab] = useState<'prophets' | 'muhammad' | 'hadith' | 'wills'>('prophets');
  const [selectedProphet, setSelectedProphet] = useState<Prophet | null>(null);
  const [selectedHadith, setSelectedHadith] = useState<Hadith | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHadithCat, setSelectedHadithCat] = useState<Hadith['category'] | 'all'>('all');

  const filteredProphets = useMemo(() => {
    return PROPHETS_DATA.filter(p => p.name.includes(searchQuery));
  }, [searchQuery]);

  const filteredHadiths = useMemo(() => {
    return HADITH_DATA.filter(h => 
      (selectedHadithCat === 'all' || h.category === selectedHadithCat) &&
      h.text.includes(searchQuery)
    );
  }, [selectedHadithCat, searchQuery]);

  const handleShare = (text: string) => {
    if (navigator.share) navigator.share({ text });
  };

  const textColorClass = settings.darkMode ? 'text-white' : 'text-black';

  return (
    <div className={`animate-in fade-in slide-in-from-bottom duration-500 pb-20 ${textColorClass}`}>
      {/* Tabs Navigation */}
      <div className="flex bg-white dark:bg-slate-800 p-1 rounded-3xl shadow-md mb-6 sticky top-20 z-40 overflow-x-auto no-scrollbar border border-emerald-100 dark:border-slate-700">
        {[
          { id: 'prophets', label: 'الأنبياء', icon: <Users size={16} /> },
          { id: 'muhammad', label: 'سيرة النبي ﷺ', icon: <History size={16} /> },
          { id: 'hadith', label: 'الأحاديث', icon: <BookOpen size={16} /> },
          { id: 'wills', label: 'الوصايا', icon: <ShieldCheck size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setSelectedProphet(null); setSelectedHadith(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'text-gray-500 hover:bg-emerald-50 dark:hover:bg-slate-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* SEARCH BAR */}
      {(activeTab === 'prophets' || activeTab === 'hadith') && !selectedProphet && !selectedHadith && (
        <div className="mb-6 relative group">
          <input
            type="text"
            placeholder={activeTab === 'prophets' ? "ابحث عن نبي..." : "ابحث في الأحاديث..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full p-4 pr-12 rounded-3xl shadow-sm border focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${settings.darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-100'}`}
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500" size={20} />
        </div>
      )}

      {/* PROPHETS SECTION */}
      {activeTab === 'prophets' && (
        selectedProphet ? (
          <div className="space-y-6 animate-in slide-in-from-left duration-300">
            <button onClick={() => setSelectedProphet(null)} className="flex items-center text-emerald-600 font-bold mb-4">
              <ChevronRight /> العودة للأنبياء
            </button>
            <div className={`p-8 rounded-[3rem] shadow-xl border ${settings.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-50'}`}>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 text-3xl font-black">{selectedProphet.order}</div>
                <h2 className={`text-3xl font-black mb-2 font-quran ${textColorClass}`}>{selectedProphet.name}</h2>
                <p className="text-sm text-amber-600 font-bold">{selectedProphet.lineage}</p>
              </div>
              
              <div className="space-y-8">
                <section className="bg-emerald-50/50 dark:bg-slate-900/40 p-6 rounded-[2.5rem]">
                  <h4 className={`flex items-center gap-2 text-lg font-bold mb-3 ${textColorClass}`}>
                    <BookOpen size={20} className="text-emerald-500" /> القصة كاملة
                  </h4>
                  <p className={`text-xl leading-relaxed font-quran text-justify ${textColorClass}`}>{selectedProphet.story}</p>
                </section>

                <section className="bg-amber-50/50 dark:bg-amber-900/10 p-6 rounded-[2.5rem] border border-amber-100 dark:border-amber-900/20">
                  <h4 className={`flex items-center gap-2 text-lg font-bold mb-3 ${textColorClass}`}>
                    <Zap size={20} className="text-amber-500" /> المعجزات الإلهية
                  </h4>
                  <ul className="space-y-3">
                    {selectedProphet.miracles.map((m, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full shrink-0"></div>
                        <span className={`text-md font-bold ${textColorClass}`}>{m}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h4 className={`flex items-center gap-2 text-lg font-bold mb-3 ${textColorClass}`}>
                    <Star size={20} className="text-emerald-500" /> الدروس والعبر المستفادة
                  </h4>
                  <ul className="grid grid-cols-1 gap-3">
                    {selectedProphet.lessons.map((lesson, i) => (
                      <li key={i} className={`flex items-center gap-3 p-4 rounded-2xl shadow-sm border ${settings.darkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-100'}`}>
                        <Lightbulb className="text-amber-400 shrink-0" size={18} />
                        <span className={`text-sm font-bold ${textColorClass}`}>{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h4 className={`flex items-center gap-2 text-lg font-bold mb-3 ${textColorClass}`}>
                    <Info size={20} className="text-blue-500" /> ذُكر في القرآن الكريم
                  </h4>
                  <div className="space-y-3">
                    {selectedProphet.verses.map((v, i) => (
                      <div key={i} className={`font-quran text-2xl text-center p-6 rounded-3xl border italic ${settings.darkMode ? 'bg-slate-900 border-slate-800 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-800'}`}>
                        "{v}"
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProphets.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProphet(p)}
                className={`p-6 rounded-[2rem] border shadow-sm flex items-center justify-between group hover:scale-[1.02] transition-all ${settings.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 hover:border-emerald-300'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center font-black">{p.order}</div>
                  <div className="text-right">
                    <h3 className={`font-black text-lg ${textColorClass}`}>{p.name}</h3>
                    <p className={`text-[10px] font-bold mt-1 line-clamp-1 opacity-60 ${textColorClass}`}>{p.lineage}</p>
                  </div>
                </div>
                <ChevronLeft className="text-gray-300 group-hover:text-emerald-500" />
              </button>
            ))}
          </div>
        )
      )}

      {/* MUHAMMAD ﷺ SECTION */}
      {activeTab === 'muhammad' && (
        <div className="space-y-6">
          <div className="relative p-10 spirit-gradient rounded-[3rem] text-white shadow-2xl overflow-hidden mb-8">
             <div className="absolute top-0 right-0 p-8 opacity-10"><Heart size={150} /></div>
             <h2 className="text-4xl font-black mb-2 font-quran">سيرة خير الأنام ﷺ</h2>
             <p className="text-sm opacity-80 max-w-xs font-bold">المصطفى، الصادق الأمين، رحمة للعالمين</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="p-8 bg-white dark:bg-slate-800 rounded-[3rem] border border-emerald-100 dark:border-slate-700 shadow-xl overflow-hidden">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><Map size={24} /></div>
                  <h3 className={`text-xl font-black ${textColorClass}`}>مسار الهجرة النبوية التفاعلي</h3>
               </div>
               
               <div className="relative h-64 bg-emerald-50/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-emerald-200 dark:border-slate-700 p-4 flex flex-col justify-center items-center">
                  <svg viewBox="0 0 400 200" className="w-full h-full drop-shadow-lg">
                    <path d="M100 150 C 150 100, 250 150, 300 50" fill="none" stroke="#059669" strokeWidth="4" strokeDasharray="8" className="animate-dash" />
                    <circle cx="100" cy="150" r="12" fill="#fbbf24" className="animate-pulse" />
                    <text x="80" y="180" className={`text-[14px] font-black ${settings.darkMode ? 'fill-emerald-400' : 'fill-emerald-800'}`}>مكة المكرمة</text>
                    <circle cx="300" cy="50" r="12" fill="#059669" />
                    <text x="280" y="30" className={`text-[14px] font-black ${settings.darkMode ? 'fill-emerald-400' : 'fill-emerald-800'}`}>المدينة المنورة</text>
                    <circle cx="200" cy="110" r="4" fill="#64748b" />
                    <text x="210" y="115" className="text-[10px] fill-gray-500">غار ثور</text>
                  </svg>
                  <p className="text-xs text-center mt-4 text-emerald-600 font-bold">خريطة توضيحية للمسار النبوي بين مكة والمدينة المنورة</p>
               </div>
            </div>

            {SEERAH_DATA.map((event) => (
              <div key={event.id} className={`p-8 rounded-[3rem] border-r-8 ${event.type === 'battle' ? 'border-r-red-500' : 'border-r-emerald-500'} relative transition-all shadow-md ${settings.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`text-[10px] font-black ${event.type === 'battle' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'} px-3 py-1 rounded-full mb-2 inline-block uppercase tracking-widest`}>{event.period}</span>
                    <h3 className={`text-2xl font-black ${settings.darkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>{event.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-gray-400"><Clock size={14} /> {event.year}</div>
                </div>
                <p className={`text-lg leading-relaxed text-justify font-quran ${textColorClass}`}>{event.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HADITH SECTION */}
      {activeTab === 'hadith' && (
        selectedHadith ? (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
             <button onClick={() => setSelectedHadith(null)} className="flex items-center text-emerald-600 font-bold mb-4">
               <ChevronRight /> العودة لقائمة الأحاديث
             </button>
             <div className={`p-8 rounded-[3rem] shadow-xl border ${settings.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-50'}`}>
                <div className="flex justify-between items-center mb-8">
                  <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-black">{selectedHadith.grade}</span>
                  <div className="flex gap-3">
                    <button onClick={() => playZikrAudio(selectedHadith.text)} className={`p-3 rounded-full ${settings.darkMode ? 'bg-slate-700 text-emerald-400' : 'bg-gray-100 text-emerald-600'}`}><Volume2 size={20} /></button>
                    <button onClick={() => handleShare(selectedHadith.text)} className={`p-3 rounded-full ${settings.darkMode ? 'bg-slate-700 text-emerald-400' : 'bg-gray-100 text-emerald-600'}`}><Share2 size={20} /></button>
                  </div>
                </div>
                <div className="text-center mb-10">
                   <p className={`text-2xl font-quran leading-[2.5rem] ${textColorClass}`}>"{selectedHadith.text}"</p>
                   <p className={`text-[11px] mt-4 font-bold opacity-60 ${textColorClass}`}>المصدر: {selectedHadith.source}</p>
                </div>
                
                <div className="space-y-6">
                   <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/20">
                      <h4 className="font-black text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2"><Info size={18} /> شرح الحديث الشريف</h4>
                      <p className={`text-md leading-relaxed ${textColorClass}`}>{selectedHadith.explanation}</p>
                   </div>
                   <div className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                      <h4 className="font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-2 mb-3"><GraduationCap size={18} /> الدروس المستفادة</h4>
                      <ul className="space-y-3">
                         {selectedHadith.lessons.map((l, i) => (
                           <li key={i} className="flex items-start gap-3">
                              <div className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                              <span className={`font-bold text-sm ${textColorClass}`}>{l}</span>
                           </li>
                         ))}
                      </ul>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {['all', 'ethics', 'worship', 'family', 'transactions'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedHadithCat(cat as any)}
                  className={`px-6 py-3 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${
                    selectedHadithCat === cat 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105' 
                      : 'bg-white dark:bg-slate-800 text-gray-500 border-gray-100 dark:border-slate-700 hover:border-emerald-200'
                  }`}
                >
                  {cat === 'all' ? 'الكل' : cat === 'ethics' ? 'أخلاق' : cat === 'worship' ? 'عبادات' : cat === 'family' ? 'أسرة' : 'معاملات'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredHadiths.map(hadith => (
                <button 
                  key={hadith.id} 
                  onClick={() => setSelectedHadith(hadith)}
                  className={`p-6 rounded-[2.5rem] border shadow-sm text-right transition-all group hover:border-emerald-300 ${settings.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-50'}`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 px-3 py-1 rounded-full">{hadith.grade}</span>
                    <ChevronLeft size={16} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <p className={`text-xl font-quran line-clamp-2 mb-3 group-hover:text-emerald-600 transition-colors ${textColorClass}`}>"{hadith.text}"</p>
                  <div className={`flex justify-between items-center opacity-50 text-[10px] font-bold ${textColorClass}`}>
                    <span>المصدر: {hadith.source}</span>
                    <span className="flex items-center gap-1 font-bold">تفاصيل الشرح <ChevronLeft size={10} /></span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      )}

      {/* WILLS SECTION */}
      {activeTab === 'wills' && (
        <div className="grid grid-cols-1 gap-6">
          <div className="p-10 spirit-gradient rounded-[3rem] text-white shadow-xl mb-4">
             <h2 className="text-3xl font-black mb-2 font-quran">الوصايا النبوية الشريفة</h2>
             <p className="text-sm opacity-80 font-bold">مجموعة من أهم وصايا النبي ﷺ لأصحابه وللأمة</p>
          </div>
          {WILLS_DATA.map(will => (
            <div key={will.id} className="relative p-10 rounded-[3rem] bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl overflow-hidden group hover:scale-[1.01] transition-transform">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform"><Star size={100} /></div>
               <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                 <ShieldCheck size={28} /> {will.title}
               </h3>
               <p className="text-2xl font-quran leading-relaxed mb-8 border-r-4 border-white/30 pr-4">"{will.text}"</p>
               <div className="flex justify-end">
                 <button onClick={() => handleShare(will.text)} className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-2xl text-sm font-black transition-colors backdrop-blur-sm">
                   <Share2 size={18} /> مشاركة الوصية
                 </button>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
