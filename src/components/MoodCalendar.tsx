import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DiaryDocument } from '../services/firebase';

type DailyMood = {
  day: number;
  moodLevel: 1 | 2 | 3 | 4 | 5;
  moodLabel: string;
  userText?: string;
};

interface MoodCalendarProps {
  diaries?: DiaryDocument[];
}

const MOOD_COLORS: Record<number, { bg: string; border: string; text: string; emoji: string }> = {
  1: { bg: 'bg-slate-100', border: 'border-slate-300/80', text: 'text-slate-700', emoji: '🙀' },
  2: { bg: 'bg-sky-50', border: 'border-sky-300/80', text: 'text-sky-700', emoji: '😿' },
  3: { bg: 'bg-amber-50', border: 'border-amber-300/80', text: 'text-amber-800', emoji: '😐' },
  4: { bg: 'bg-orange-50', border: 'border-orange-300/80', text: 'text-orange-800', emoji: '😺' },
  5: { bg: 'bg-rose-50', border: 'border-rose-300/80', text: 'text-rose-700', emoji: '😻' },
};

function mapScoreToLevel(score: number): 1 | 2 | 3 | 4 | 5 {
  if (score <= 2) return 1;
  if (score <= 4) return 2;
  if (score <= 6) return 3;
  if (score <= 8) return 4;
  return 5;
}

const MOOD_LABELS: Record<number, string> = {
  1: 'Rough',
  2: 'Low',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

export default function MoodCalendar({ diaries = [] }: MoodCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<number>(() => new Date().getDate());

  // 🎯 從真實 diaries 中提取 2026 年 8 月的每日數據
  const monthMoodData = useMemo(() => {
    const dataMap: Record<number, DailyMood> = {};

    diaries.forEach((entry) => {
      if (!entry.createdAt || !('toDate' in entry.createdAt)) return;
      const date = entry.createdAt.toDate();
      
      // 篩選 8 月份紀錄（月份為 7，代表 8 月）
      if (date.getMonth() === 7) {
        const day = date.getDate();
        const level = mapScoreToLevel(entry.moodScore || 5);
        dataMap[day] = {
          day,
          moodLevel: level,
          moodLabel: MOOD_LABELS[level],
          userText: entry.userText,
        };
      }
    });

    return dataMap;
  }, [diaries]);

  const loggedDays = Object.keys(monthMoodData).length;
  const avgMood = loggedDays > 0
    ? (Object.values(monthMoodData).reduce((sum, item) => sum + item.moodLevel, 0) / loggedDays).toFixed(1)
    : '0.0';

  const emptyDaysBefore = 6; // 2026 年 8 月 1 日為星期六，前置 6 個空白格
  const daysInMonth = 31;

  const currentDayData = monthMoodData[selectedDay];

  return (
    <div className="w-full flex flex-col gap-2.5 sm:gap-3 font-sans text-stone-800 animate-in fade-in duration-300">
      {/* 1. 頂部動態數據卡片 */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="rounded-2xl border border-rose-100/60 bg-white p-3 sm:p-3.5 shadow-sm">
          <p className="text-[10px] sm:text-[11px] text-stone-400 font-medium">本月紀錄天數</p>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-bold text-stone-800">{loggedDays}</span>
            <span className="text-xs font-semibold text-stone-500">天</span>
          </div>
        </div>

        <div className="rounded-2xl border border-rose-100/60 bg-white p-3 sm:p-3.5 shadow-sm">
          <p className="text-[10px] sm:text-[11px] text-stone-400 font-medium">平均心情指數</p>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-bold text-stone-800">{avgMood}</span>
            <span className="text-xs font-medium text-stone-400">/ 5</span>
          </div>
        </div>
      </div>

      {/* 2. 月曆主體卡片 */}
      <div className="rounded-2xl border border-rose-100/60 bg-white p-3 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
          <button type="button" className="p-1 text-stone-400 hover:text-stone-600 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="text-xs sm:text-sm font-bold text-stone-800">2026 年 8 月</h3>
          <button type="button" className="p-1 text-stone-400 hover:text-stone-600 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center mb-1.5 text-[10px] sm:text-[11px] font-medium text-stone-400">
          <span>日</span>
          <span>一</span>
          <span>二</span>
          <span>三</span>
          <span>四</span>
          <span>五</span>
          <span>六</span>
        </div>

        {/* 日期網格 */}
        <div className="grid grid-cols-7 gap-y-1.5 sm:gap-y-2 justify-items-center">
          {Array.from({ length: emptyDaysBefore }).map((_, i) => (
            <div key={`empty-${i}`} className="h-7 w-7 sm:h-8 sm:w-8" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayData = monthMoodData[dayNum];
            const isSelected = selectedDay === dayNum;

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => setSelectedDay(dayNum)}
                className={`relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-[11px] sm:text-xs font-bold transition-all border ${
                  dayData
                    ? `${MOOD_COLORS[dayData.moodLevel].bg} ${MOOD_COLORS[dayData.moodLevel].border} ${MOOD_COLORS[dayData.moodLevel].text}`
                    : 'border-transparent bg-stone-50 text-stone-400 hover:bg-stone-100'
                } ${
                  isSelected ? 'ring-2 ring-rose-400 ring-offset-1 scale-110 z-10 shadow-sm' : ''
                }`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 選中日期的詳細卡片 */}
      <div className="rounded-2xl border border-rose-100/60 bg-white p-3 sm:p-3.5 shadow-sm flex items-center gap-3">
        {currentDayData ? (
          <>
            <div
              className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center text-base sm:text-lg border ${
                MOOD_COLORS[currentDayData.moodLevel].bg
              } ${MOOD_COLORS[currentDayData.moodLevel].border}`}
            >
              {MOOD_COLORS[currentDayData.moodLevel].emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-[11px] text-stone-400 font-medium">
                2026 年 8 月 {selectedDay} 日
              </p>
              <h4 className="text-xs font-bold text-stone-800">
                心情：{currentDayData.moodLabel} ({currentDayData.moodLevel} / 5)
              </h4>
              {currentDayData.userText && (
                <p className="text-[11px] text-stone-500 truncate mt-0.5">
                  「{currentDayData.userText}」
                </p>
              )}
            </div>
          </>
        ) : (
          <div>
            <p className="text-[10px] sm:text-[11px] text-stone-400">2026 年 8 月 {selectedDay} 日</p>
            <p className="text-xs text-stone-500 font-medium mt-0.5">當天無紀錄數據</p>
          </div>
        )}
      </div>
    </div>
  );
}