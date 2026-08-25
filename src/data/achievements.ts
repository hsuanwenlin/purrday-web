import type { DiaryDocument } from "../services/firebase"

export type Achievement = {
  id: string
  title: string
  description: string
  icon: string
  isUnlocked: boolean
  progress: number
  total: number
  unlockedDate?: string
}

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_message",
    title: "初來乍到 🐾",
    description: "發送第一條訊息給喵喵",
    icon: "🐾",
    isUnlocked: false,
    progress: 0,
    total: 1,
  },
  {
    id: "streak_3",
    title: "持之以恆 📅",
    description: "連續紀錄心情達 3 天",
    icon: "📅",
    isUnlocked: false,
    progress: 0,
    total: 3,
  },
  {
    id: "gourmet",
    title: "美食家 🍣",
    description: "上傳美味的美食照片",
    icon: "🍣",
    isUnlocked: false,
    progress: 0,
    total: 1,
  },
  {
    id: "mood_master",
    title: "情緒大師 🌈",
    description: "紀錄過所有 5 種心情",
    icon: "🌈",
    isUnlocked: false,
    progress: 0,
    total: 5,
  },
  {
    id: "photo_lover",
    title: "快門高手 📸",
    description: "累計分享 5 張生活照片",
    icon: "📸",
    isUnlocked: false,
    progress: 0,
    total: 5,
  },
  {
    id: "night_cat",
    title: "夜貓族 🌙",
    description: "在深夜 11 點後紀錄心情",
    icon: "🌙",
    isUnlocked: false,
    progress: 0,
    total: 1,
  },
]

// 輔助函式：計算連續天數
function calculateStreakDays(diaries: DiaryDocument[]): number {
  if (!diaries.length) return 0

  // 取得不重複的日期字串 (YYYY-MM-DD)
  const uniqueDates = Array.from(
    new Set(
      diaries
        .filter((d) => d.createdAt && "toDate" in d.createdAt)
        .map((d) => {
          const date = d.createdAt!.toDate()
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
        })
    )
  ).sort()

  if (!uniqueDates.length) return 0

  let maxStreak = 1
  let currentStreak = 1

  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1]).getTime()
    const curr = new Date(uniqueDates[i]).getTime()
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 1
    }
  }

  return maxStreak
}

/**
 * 🎯 Day 21 核心演算法：根據 Firestore 真實日記列表動態判定成就狀態與進度
 */
export function calculateAchievements(diaries: DiaryDocument[]): Achievement[] {
  // 1. 初來乍到
  const totalDiaries = diaries.length
  const firstDiary = diaries[0]
  let firstUnlockedDate: string | undefined
  if (firstDiary && firstDiary.createdAt && "toDate" in firstDiary.createdAt) {
    const d = firstDiary.createdAt.toDate()
    firstUnlockedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }

  // 2. 持之以恆
  const streakDays = calculateStreakDays(diaries)

  // 3. 美食家 (有照片且生活標籤或文字含美食/吃/餐等關鍵字)
  const gourmetDiary = diaries.find(
    (d) =>
      Boolean(d.imageBase64) &&
      (d.lifestyleLabel?.includes("美食") ||
        d.lifestyleLabel?.includes("飲食") ||
        d.lifestyleLabel?.includes("餐") ||
        d.userText?.includes("好吃") ||
        d.userText?.includes("吃"))
  )
  const isGourmet = Boolean(gourmetDiary)
  let gourmetUnlockedDate: string | undefined
  if (gourmetDiary && gourmetDiary.createdAt && "toDate" in gourmetDiary.createdAt) {
    const d = gourmetDiary.createdAt.toDate()
    gourmetUnlockedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }

  // 4. 情緒大師 (收集到的心情種類)
  const uniqueMoods = new Set(diaries.map((d) => d.moodKey).filter(Boolean))

  // 5. 快門高手 (有照片的日記筆數)
  const photoCount = diaries.filter((d) => Boolean(d.imageBase64)).length

  // 6. 夜貓族 (23:00 ~ 05:00 之間紀錄)
  const nightDiary = diaries.find((d) => {
    if (!d.createdAt || !("toDate" in d.createdAt)) return false
    const hour = d.createdAt.toDate().getHours()
    return hour >= 23 || hour < 5
  })
  const isNightCat = Boolean(nightDiary)
  let nightUnlockedDate: string | undefined
  if (nightDiary && nightDiary.createdAt && "toDate" in nightDiary.createdAt) {
    const d = nightDiary.createdAt.toDate()
    nightUnlockedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }

  return INITIAL_ACHIEVEMENTS.map((ach) => {
    switch (ach.id) {
      case "first_message":
        return {
          ...ach,
          progress: Math.min(totalDiaries, ach.total),
          isUnlocked: totalDiaries >= ach.total,
          unlockedDate: totalDiaries >= ach.total ? firstUnlockedDate : undefined,
        }
      case "streak_3":
        return {
          ...ach,
          progress: Math.min(streakDays, ach.total),
          isUnlocked: streakDays >= ach.total,
        }
      case "gourmet":
        return {
          ...ach,
          progress: isGourmet ? 1 : 0,
          isUnlocked: isGourmet,
          unlockedDate: isGourmet ? gourmetUnlockedDate : undefined,
        }
      case "mood_master":
        return {
          ...ach,
          progress: Math.min(uniqueMoods.size, ach.total),
          isUnlocked: uniqueMoods.size >= ach.total,
        }
      case "photo_lover":
        return {
          ...ach,
          progress: Math.min(photoCount, ach.total),
          isUnlocked: photoCount >= ach.total,
        }
      case "night_cat":
        return {
          ...ach,
          progress: isNightCat ? 1 : 0,
          isUnlocked: isNightCat,
          unlockedDate: isNightCat ? nightUnlockedDate : undefined,
        }
      default:
        return ach
    }
  })
}