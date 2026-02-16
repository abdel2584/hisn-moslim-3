
export type CategoryId = 'morning' | 'evening' | 'prayer' | 'sleep' | 'protection' | 'supplications' | 'quran' | 'sirah';

export interface Zikr {
  id: string;
  text: string;
  count: number;
  currentCount: number;
  source?: string;
  category: CategoryId;
}

export interface AdhiyaCategory {
  id: string;
  title: string;
  icon: string;
  items: { text: string; title: string }[];
}

export interface Prophet {
  id: string;
  name: string;
  order: number;
  lineage: string;
  story: string;
  miracles: string[];
  lessons: string[];
  verses: string[];
}

export interface SeerahEvent {
  id: string;
  title: string;
  period: string;
  content: string;
  year?: string;
  type?: 'general' | 'battle';
}

export interface Hadith {
  id: string;
  text: string;
  source: string;
  grade: 'صحيح' | 'حسن';
  category: 'ethics' | 'worship' | 'transactions' | 'family';
  explanation: string;
  lessons: string[];
}

export interface Will {
  id: string;
  text: string;
  title: string;
  explanation?: string;
}

export interface UserStats {
  streak: number;
  lastUpdate: string;
  completedToday: string[];
  dailyProgress: Record<string, number>;
}

export interface AppSettings {
  fontSize: number;
  vibration: boolean;
  darkMode: boolean;
  notifications: {
    morning: boolean;
    evening: boolean;
    sleep: boolean;
    ramadan: boolean;
    lastTenDays: boolean;
  };
  prayer: {
    method: number;
    adjustments: Record<string, number>;
    savedCity: string;
    savedCoords: { lat: number; lon: number } | null;
    autoLocation: boolean;
  };
}

export interface PrayerData {
  name: string;
  arabicName: string;
  icon: string;
  time: string;
}

export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
}

export interface SurahDetail extends SurahMeta {
  ayahs: Ayah[];
}
