
import React, { useState } from 'react';
import { ADHIYA_CATEGORIES } from '../data';
import { ChevronLeft, ChevronRight, Share2, Plus, Volume2 } from 'lucide-react';
import { playZikrAudio } from '../services/geminiService';
import { AppSettings } from '../types';

interface AdhiyaSectionProps {
  onAddCustom: () => void;
  settings: AppSettings;
}

export const AdhiyaSection: React.FC<AdhiyaSectionProps> = ({ onAddCustom, settings }) => {
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const handleShare = (text: string) => {
    if (navigator.share) {
      navigator.share({ text });
    }
  };

  if (selectedCat) {
    const category = ADHIYA_CATEGORIES.find(c => c.id === selectedCat);
    return (
      <div className="space-y-4 animate-in slide-in-from-left duration-300">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => setSelectedCat(null)}
            className="flex items-center text-emerald-700 dark:text-emerald-400 font-bold"
          >
            <ChevronRight /> العودة للأقسام
          </button>
          <button 
            onClick={onAddCustom}
            className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 p-2 rounded-xl flex items-center gap-1 font-bold text-sm"
          >
            <Plus size={16} /> أضف دعاء
          </button>
        </div>
        
        <h2 className={`text-2xl font-bold flex items-center gap-2 mb-6 ${settings.darkMode ? 'text-white' : 'text-black'}`}>
          {category?.icon} {category?.title}
        </h2>
        <div className="space-y-4">
          {category?.items.map((item, idx) => (
            <div key={idx} className={`p-6 rounded-3xl shadow-sm border group hover:border-emerald-200 transition-colors ${settings.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{item.title}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => playZikrAudio(item.text)} 
                    className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                  >
                    <Volume2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleShare(item.text)} 
                    className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                  >
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
              <p className={`text-lg md:text-xl font-quran leading-relaxed text-right whitespace-pre-wrap ${settings.darkMode ? 'text-white' : 'text-black'}`}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="p-10 spirit-gradient rounded-[3rem] text-white shadow-xl mb-6">
        <h2 className="text-3xl font-black mb-2 font-quran">أدعية الحياة اليومية</h2>
        <p className="text-sm opacity-80 font-bold">باقة من الأدعية المستجابة لمختلف شؤون حياتك</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ADHIYA_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={`p-6 rounded-3xl shadow-sm border flex items-center justify-between hover:border-emerald-300 transition-all hover:shadow-md group ${settings.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
              <div className="text-right">
                <p className={`font-bold text-lg ${settings.darkMode ? 'text-white' : 'text-gray-800'}`}>{cat.title}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{cat.items.length} أدعية متوفرة</p>
              </div>
            </div>
            <ChevronLeft className="text-gray-400" />
          </button>
        ))}
      </div>
      
      <button 
        onClick={onAddCustom}
        className={`w-full py-8 border-2 border-dashed border-emerald-200 dark:border-emerald-900 rounded-[2.5rem] flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors gap-2 ${settings.darkMode ? 'bg-slate-800' : 'bg-white'}`}
      >
        <Plus size={32} />
        <span className="font-bold">أضف دعاء مخصص للأقسام</span>
      </button>
    </div>
  );
};
