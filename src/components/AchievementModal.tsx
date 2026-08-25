import { Award, Sparkles, X } from "lucide-react"
import type { Achievement } from "../data/achievements"

interface AchievementModalProps {
  achievement: Achievement | null
  onClose: () => void
}

export default function AchievementModal({ achievement, onClose }: AchievementModalProps) {
  if (!achievement) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xs overflow-hidden rounded-3xl border border-rose-100 bg-white p-6 text-center shadow-2xl animate-in zoom-in-95 duration-300">
        {/* 背景裝飾光暈 */}
        <div className="pointer-events-none absolute -top-12 -left-12 h-32 w-32 rounded-full bg-rose-200/50 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-amber-200/50 blur-2xl" />

        {/* 關閉按鈕 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-stone-400 hover:bg-stone-200 hover:text-stone-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* 頂部徽章特效 */}
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-400 text-4xl shadow-lg shadow-rose-500/20 animate-bounce">
          {achievement.icon}
        </div>

        {/* 標題與描述 */}
        <div className="mb-4">
          <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-500 border border-rose-200">
            <Sparkles className="h-3 w-3" />
            解鎖新成就！
          </div>
          <h3 className="text-lg font-bold text-stone-800">{achievement.title}</h3>
          <p className="mt-1 text-xs text-stone-500">{achievement.description}</p>
        </div>

        {/* 確認按鈕 */}
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-full bg-rose-400 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-rose-500 active:scale-95 flex items-center justify-center gap-1.5"
        >
          <Award className="h-4 w-4" />
          收下徽章 🐾
        </button>
      </div>
    </div>
  )
}