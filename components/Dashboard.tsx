
import React, { useState, useMemo, useRef } from 'react';
import { UserStats, CategoryId, AppSettings } from '../types';
import { Flame, CheckCircle, TrendingUp, X, BarChart3, ChevronLeft, ChevronRight, Star, Moon, ScrollText } from 'lucide-react';

interface DashboardProps {
  stats: UserStats;
  totalAzkarCount: number;
  startedTodayCount: number;
  onSelectCategory: (cat: CategoryId) => void;
  settings: AppSettings;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, totalAzkarCount, startedTodayCount, onSelectCategory, settings }) => {
  const [showHistory, setShowHistory] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const getDaysInMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const result = [];
    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let i = 1; i <= days; i++) result.push(new Date(year, month, i));
    return result;
  };

  const getDayStatus = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];
    const progress = stats.dailyProgress[dateStr] || 0;

    if (progress > 0) return 'active'; 
    if (date < today) return 'missed'; 
    if (dateStr === todayStr) return 'current'; 
    return 'future'; 
  };

  const monthsOfYear = useMemo(() => {
    const year = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => ({
      monthIndex: i,
      year: year,
      name: new Date(year, i).toLocaleString('ar-SA', { month: 'long' }),
      days: getDaysInMonth(i, year)
    }));
  }, []);

  const weeklyProgress = useMemo(() => {
    const today = new Date();
    const weekProgress: number[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      weekProgress.push(stats.dailyProgress[dateStr] || 0);
    }
    return Math.round(weekProgress.reduce((a, b) => a + b, 0) / 7);
  }, [stats.dailyProgress]);

  const categories: { id: CategoryId, label: string, icon: string, color: string }[] = [
    { id: 'morning', label: 'أذكار الصباح', icon: '🌅', color: 'from-orange-400 to-amber-500' },
    { id: 'evening', label: 'أذكار المساء', icon: '🌙', color: 'from-blue-600 to-indigo-800' },
    { id: 'prayer', label: 'أذكار الصلاة', icon: '🤲', color: 'from-emerald-500 to-teal-700' },
    { id: 'quran', label: 'القرآن الكريم', icon: '📖', color: 'from-emerald-600 to-emerald-900' },
    { id: 'sirah', label: 'السيرة والأنبياء', icon: '📜', color: 'from-amber-600 to-orange-800' },
    { id: 'protection', label: 'التحصين', icon: '🛡️', color: 'from-red-600 to-rose-800' },
  ];

  return (
    <div className="space-y-6">
      {showHistory && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`${settings.darkMode ? 'bg-slate-900 text-white' : 'bg-white'} w-full max-w-lg rounded-[2.5rem] shadow-2xl relative flex flex-col overflow-hidden border border-emerald-100 dark:border-slate-800`}>
            <div className="relative z-10 p-6 flex justify-between items-center border-b border-emerald-50 dark:border-slate-800">
               <div>
                  <h3 className="text-xl font-black flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-quran">
                    <Star className="fill-amber-400 text-amber-400" size={18} /> سجل الالتزام الروحاني
                  </h3>
               </div>
               <button onClick={() => setShowHistory(false)} className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X size={20} /></button>
            </div>
            <div 
              ref={scrollContainerRef}
              className="relative z-10 flex overflow-x-auto snap-x snap-mandatory p-4 gap-4 custom-scrollbar scroll-smooth"
              style={{ direction: 'rtl' }}
            >
              {monthsOfYear.map((month) => (
                <div key={month.monthIndex} className="min-w-full snap-center space-y-4 px-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-black font-quran text-gray-800 dark:text-emerald-100">{month.name}</h4>
                    <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 px-3 py-1 rounded-full">{month.year}</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 p-4 rounded-[2rem] bg-gray-50/50 dark:bg-slate-800/30">
                    {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map(d => (
                      <div key={d} className="text-[9px] font-black opacity-30 text-center py-1">{d}</div>
                    ))}
                    {month.days.map((date, idx) => {
                      if (!date) return <div key={`empty-${month.monthIndex}-${idx}`} className="w-8 h-8" />;
                      const status = getDayStatus(date);
                      return (
                        <div 
                          key={date.toISOString()} 
                          className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-[10px] font-black transition-all relative
                            ${status === 'active' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white' : ''}
                            ${status === 'missed' ? 'bg-gradient-to-br from-rose-400 to-red-600 text-white' : ''}
                            ${status === 'current' ? 'bg-white dark:bg-slate-700 border-2 border-emerald-500 text-emerald-600' : ''}
                            ${status === 'future' ? 'bg-gray-100 dark:bg-slate-800 text-gray-300' : ''}
                          `}
                        >
                          {date.getDate()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-3 transition-all">
          <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-2xl"><Flame size={24} /></div>
          <div>
            <p className="text-2xl font-black text-orange-600">{stats.streak}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tight">التزام</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-3 transition-all">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl"><CheckCircle size={24} /></div>
          <div>
            <p className="text-2xl font-black text-emerald-600">{startedTodayCount}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tight">منجز</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-3 col-span-2 md:col-span-1 transition-all">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl"><TrendingUp size={24} /></div>
          <div className="flex-1">
            <div className="h-2 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${weeklyProgress}%` }}></div>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-bold">{weeklyProgress}% الإنجاز</p>
          </div>
        </div>
        <div 
          onClick={() => setShowHistory(true)}
          className="bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-3 cursor-pointer hover:bg-emerald-50 transition-all active:scale-95 group"
        >
          <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl transition-transform"><BarChart3 size={24} /></div>
          <div>
            <p className="text-sm font-black text-purple-600">السجل</p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-black text-gray-800 dark:text-white mt-8 mb-4 px-2">الأقسام الرئيسية</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex flex-col items-center justify-center p-6 rounded-[2.5rem] bg-gradient-to-br ${cat.color} text-white shadow-lg hover:scale-105 transition-transform duration-200 group`}
          >
            <span className="text-4xl mb-3">{cat.icon}</span>
            <span className="font-bold text-lg">{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
