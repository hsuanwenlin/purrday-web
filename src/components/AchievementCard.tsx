import { Sparkles } from "lucide-react"
import type { Achievement } from "../data/achievements"

interface AchievementCardProps {
  achievement: Achievement
}

export default function AchievementCard({ achievement }: AchievementCardProps) {
  const { title, description, icon, isUnlocked, progress, total, unlockedDate } = achievement
  const progressPercent = Math.min(100, Math.round((progress / total) * 100))

  return (
    <div
      className={`relative flex items-center gap-3.5 rounded-2xl border p-3.5 transition-all ${
        isUnlocked
          ? "border-amber-200/80 bg-gradient-to-r from-amber-50/50 to-rose-50/30 shadow-sm"
          : "border-stone-100 bg-stone-50/60 opacity-60"
      }`}
    >
      {/* 徽章圖示 */}
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm ${
          isUnlocked
            ? "bg-gradient-to-tr from-amber-400 to-rose-400 text-white shadow-rose-500/20 animate-in zoom-in-50 duration-300"
            : "bg-stone-200 grayscale"
        }`}
      >
        {icon}
      </div>

      {/* 徽章資訊 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <h4 className="text-xs sm:text-sm font-bold text-stone-800 truncate">{title}</h4>
          {isUnlocked && (
            <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
              <Sparkles className="h-2.5 w-2.5" />
              已解鎖
            </span>
          )}
        </div>
        <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">{description}</p>

        {/* 進度條或解鎖日期 */}
        <div className="mt-2 flex items-center justify-between gap-2">
          {isUnlocked ? (
            <span className="text-[10px] text-stone-400 font-medium">
              解鎖於 {unlockedDate || "近期"}
            </span>
          ) : (
            <>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-rose-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-stone-400">
                {progress}/{total}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}