import { useMemo } from "react"
import { Trophy, Sparkles } from "lucide-react"
import type { DiaryDocument } from "../services/firebase"
import { calculateAchievements } from "../data/achievements"
import AchievementCard from "./AchievementCard"

interface AwardsViewProps {
  diaries?: DiaryDocument[]
}

export default function AwardsView({ diaries = [] }: AwardsViewProps) {
  // 🎯 根據真實雲端日記動態計算所有成就進度
  const achievements = useMemo(() => calculateAchievements(diaries), [diaries])

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length
  const totalCount = achievements.length
  const progressPercent = Math.round((unlockedCount / totalCount) * 100)

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 font-sans text-stone-800">
      <div className="mx-auto w-full max-w-md flex flex-col gap-3">
        {/* 頂部成就統計卡片 */}
        <div className="rounded-3xl border border-rose-100/60 bg-gradient-to-br from-rose-500 to-rose-400 p-4 sm:p-5 text-white shadow-lg shadow-rose-500/10 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm">
                <Sparkles className="h-3 w-3" />
                成長足跡
              </span>
              <h3 className="text-base sm:text-lg font-bold mt-1">成就徽章收集館</h3>
              <p className="text-[11px] text-rose-100">與喵喵的每一個互動都是專屬回憶 🐾</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur-sm">
              <Trophy className="h-6 w-6 text-amber-200" />
            </div>
          </div>

          {/* 總進度條 */}
          <div className="mt-4">
            <div className="flex justify-between text-[11px] font-semibold text-rose-100 mb-1">
              <span>收集進度</span>
              <span>
                {unlockedCount} / {totalCount} ({progressPercent}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-white transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 成就列表 */}
        <div className="flex flex-col gap-2">
          {achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </div>
    </div>
  )
}