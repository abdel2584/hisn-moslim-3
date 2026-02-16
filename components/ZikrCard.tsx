
import React from 'react';
import { Zikr } from '../types';
import { Share2, Volume2, RotateCcw } from 'lucide-react';
import { playZikrAudio } from '../services/geminiService';

interface ZikrCardProps {
  zikr: Zikr;
  onCount: (id: string) => void;
  onReset: (id: string) => void;
  darkMode?: boolean;
}

export const ZikrCard: React.FC<ZikrCardProps> = ({ zikr, onCount, onReset, darkMode }) => {
  const isCompleted = zikr.currentCount >= zikr.count;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'ذكر من حصن المسلم',
        text: zikr.text,
      });
    }
  };

  const handleVibrate = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  return (
    <div className={`relative p-6 mb-4 rounded-3xl transition-all duration-300 transform ${
      isCompleted 
        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500 scale-95 opacity-80' 
        : `shadow-lg hover:shadow-xl border-2 border-transparent ${darkMode ? 'bg-slate-800' : 'bg-white'}`
    }`}>
      {isCompleted && (
        <div className="absolute top-4 left-4 bg-emerald-500 text-white rounded-full p-1 shadow-md animate-bounce">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4 gap-2">
        <div className="flex gap-2">
          <button onClick={handleShare} className="p-2 text-gray-400 hover:text-emerald-600 transition-colors">
            <Share2 size={18} />
          </button>
          <button onClick={() => playZikrAudio(zikr.text)} className="p-2 text-gray-400 hover:text-emerald-600 transition-colors">
            <Volume2 size={18} />
          </button>
        </div>
        <button onClick={() => onReset(zikr.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
          <RotateCcw size={16} />
        </button>
      </div>

      <p className={`text-xl md:text-2xl font-quran leading-relaxed text-center mb-8 px-2 transition-colors ${darkMode ? 'text-white' : 'text-black'}`}>
        {zikr.text}
      </p>

      {zikr.source && (
        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 text-center mb-6 opacity-70 italic font-bold">
          المصدر: {zikr.source}
        </p>
      )}

      <div className="flex flex-col items-center">
        <button 
          disabled={isCompleted}
          onClick={() => { onCount(zikr.id); handleVibrate(); }}
          className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-200 border-4 ${
            isCompleted 
              ? 'bg-emerald-500 border-emerald-600 text-white shadow-inner cursor-default' 
              : 'bg-emerald-700 border-emerald-800 text-white shadow-lg active:scale-90 hover:bg-emerald-800'
          }`}
        >
          <span className="text-3xl font-bold">{zikr.count - zikr.currentCount}</span>
          <span className="text-[10px] opacity-80 uppercase font-black">متبقي</span>
        </button>
        <div className="mt-4 flex gap-1 w-full max-w-[150px]">
          {Array.from({ length: zikr.count }).map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 flex-1 rounded-full ${i < zikr.currentCount ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-slate-700'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
