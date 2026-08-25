import { useState, useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import { MessageSquare, LineChart, Award } from 'lucide-react';
import { initAnonymousAuth, subscribeUserDiaries, type DiaryDocument } from './services/firebase';
import { calculateAchievements, type Achievement } from './data/achievements';
import ChatContainer from './components/ChatContainer';
import MoodChart from './components/MoodChart';
import AwardsView from './components/AwardsView';
import AchievementModal from './components/AchievementModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'chart' | 'awards'>('chat');
  const [user, setUser] = useState<User | null>(null);
  
  const [diaries, setDiaries] = useState<DiaryDocument[]>([]);
  const [isDiariesLoading, setIsDiariesLoading] = useState(true);

  // 🎯 Day 21：解鎖成就即時彈窗狀態與前後比對 Ref
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement | null>(null);
  const prevUnlockedIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    // 啟動 Firebase 匿名登入並監聽身分
    const unsubscribeAuth = initAnonymousAuth((currentUser) => {
      setUser(currentUser);
      console.log('🎯 App 成功連線 Firebase，使用者 UID 為:', currentUser.uid);
    });

    return () => unsubscribeAuth();
  }, []);

  // 🎯 身分就緒後，即時監聽 Firestore 子集合並觸發成就檢測
  useEffect(() => {
    if (!user) return;

    setIsDiariesLoading(true);
    const unsubscribeDiaries = subscribeUserDiaries(
      user.uid,
      (data) => {
        setDiaries(data);
        setIsDiariesLoading(false);

        // 🎯 成就比對引擎：計算當前所有成就進度
        const currentAchievements = calculateAchievements(data);
        const currentUnlocked = currentAchievements.filter((a) => a.isUnlocked);
        const currentUnlockedIds = new Set(currentUnlocked.map((a) => a.id));

        // 首次載入時先同步既有已解鎖清單，不觸發解鎖彈窗
        if (isFirstLoadRef.current) {
          prevUnlockedIdsRef.current = currentUnlockedIds;
          isFirstLoadRef.current = false;
          return;
        }

        // 找出本次操作全新解鎖的成就
        const newAchievement = currentUnlocked.find(
          (a) => !prevUnlockedIdsRef.current.has(a.id)
        );

        if (newAchievement) {
          setNewlyUnlocked(newAchievement);
        }

        prevUnlockedIdsRef.current = currentUnlockedIds;
      },
      () => {
        setIsDiariesLoading(false);
      }
    );

    return () => unsubscribeDiaries();
  }, [user]);

  return (
    <div className="min-h-[100dvh] sm:min-h-screen bg-rose-50/30 flex flex-col items-center justify-center p-0 sm:p-4 font-sans selection:bg-rose-100">
      {/* 桌面端頂部標題（手機端隱藏，節省縱向空間） */}
      <h1 className="hidden sm:flex text-xl font-bold text-stone-800 mb-4 items-center gap-2 tracking-wide">
        🐾 喵語日誌
      </h1>

      {/* 主容器：手機端滿版 100dvh，桌面端固定 680px 圓角卡片 */}
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white sm:h-[680px] sm:max-w-md sm:rounded-3xl sm:border sm:border-rose-100/70 sm:shadow-xl sm:shadow-rose-950/5">
        {/* 內容分頁區域 */}
        <div key={activeTab} className="flex-1 overflow-hidden flex flex-col animate-in fade-in duration-300">
          {activeTab === 'chat' && <ChatContainer />}
          {activeTab === 'chart' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex items-center justify-center">
              <MoodChart diaries={diaries} isLoading={isDiariesLoading} />
            </div>
          )}
          {activeTab === 'awards' && <AwardsView diaries={diaries} />}
        </div>

        {/* 底部導覽列 */}
        <nav className="flex h-16 sm:h-16 w-full items-center justify-around border-t border-rose-100/70 bg-white/95 px-2 pb-1 sm:pb-0 backdrop-blur-sm shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all duration-200 active:scale-95 ${
              activeTab === 'chat'
                ? 'text-rose-500 font-bold scale-105'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-[11px] sm:text-xs">喵喵對話</span>
          </button>

          <div className="h-5 w-px bg-rose-100/80" />

          <button
            type="button"
            onClick={() => setActiveTab('chart')}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all duration-200 active:scale-95 ${
              activeTab === 'chart'
                ? 'text-rose-500 font-bold scale-105'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <LineChart className="h-5 w-5" />
            <span className="text-[11px] sm:text-xs">情緒分析</span>
          </button>

          <div className="h-5 w-px bg-rose-100/80" />

          <button
            type="button"
            onClick={() => setActiveTab('awards')}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all duration-200 active:scale-95 ${
              activeTab === 'awards'
                ? 'text-rose-500 font-bold scale-105'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <Award className="h-5 w-5" />
            <span className="text-[11px] sm:text-xs">成就徽章</span>
          </button>
        </nav>
      </div>

      {/* 🎯 解鎖成就即時彈窗 */}
      <AchievementModal
        achievement={newlyUnlocked}
        onClose={() => setNewlyUnlocked(null)}
      />
    </div>
  );
}