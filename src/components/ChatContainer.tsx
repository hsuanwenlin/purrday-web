import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Image as ImageIcon, X } from "lucide-react"
import { compressImage } from "../utils/imageUtils"
import { analyzeDiary } from "../services/geminiService"
import { auth, saveDiaryEntry } from "../services/firebase"

type Message = {
  id: number
  role: "user" | "cat"
  text: string
  image?: string
}

type Mood = {
  key: string
  label: string
  emoji: string
  bgClass: string
  borderClass: string
  activeClass: string
}

const MOODS: Mood[] = [
  { key: "rough", label: "Rough", emoji: "🙀", bgClass: "bg-slate-100/80", borderClass: "border-slate-300/80", activeClass: "bg-slate-500 text-white border-slate-500" },
  { key: "low", label: "Low", emoji: "😿", bgClass: "bg-sky-50", borderClass: "border-sky-300/80", activeClass: "bg-sky-400 text-white border-sky-400" },
  { key: "okay", label: "Okay", emoji: "😐", bgClass: "bg-amber-50", borderClass: "border-amber-300/80", activeClass: "bg-amber-400 text-white border-amber-400" },
  { key: "good", label: "Good", emoji: "😺", bgClass: "bg-orange-50", borderClass: "border-orange-300/80", activeClass: "bg-orange-400 text-white border-orange-400" },
  { key: "great", label: "Great", emoji: "😻", bgClass: "bg-rose-50", borderClass: "border-rose-300/80", activeClass: "bg-rose-400 text-white border-rose-400" },
]

const INITIAL_MESSAGES: Message[] = [
  { id: 1, role: "cat", text: "喵～歡迎回來！今天有拍什麼好看的照片要跟我分享嗎？" },
]

// 🎯 輪播等待文案清單
const WAITING_TEXTS = [
  "貓咪正在認真思考中...🐾",
  "正在聞這段日記的味道...🐟",
  "喵喵正在組織可愛的語言...✨",
  "貓咪搖了搖尾巴，馬上就好囉...🌿",
]

function CatAvatar({ size = "md" }: { size?: "sm" | "md" }) {
  const dimensions = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 sm:h-11 sm:w-11 text-sm"
  return (
    <div className={`flex ${dimensions} shrink-0 items-center justify-center rounded-full bg-rose-400 font-bold text-white shadow-sm`}>
      喵
    </div>
  )
}

// 🎯 Day 26 骨架屏 (Skeleton UI)
function CatSkeletonLoader() {
  const [textIndex, setTextIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % WAITING_TEXTS.length)
    }, 1800)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex items-start gap-2.5 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-2">
      <CatAvatar size="sm" />
      <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tl-sm bg-rose-50/90 border border-rose-200/70 p-3.5 shadow-sm space-y-2.5">
        {/* 動態輪播文案與跳動點點 */}
        <div className="flex items-center gap-2 text-xs text-rose-500 font-medium">
          <span>{WAITING_TEXTS[textIndex]}</span>
          <div className="flex gap-1 items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-dot-1 inline-block" />
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-dot-2 inline-block" />
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-dot-3 inline-block" />
          </div>
        </div>

        {/* 骨架屏長條占位微光 (Shimmer) */}
        <div className="h-3 w-44 sm:w-56 rounded-md animate-shimmer" />
        <div className="h-3 w-28 sm:w-36 rounded-md animate-shimmer" />
      </div>
    </div>
  )
}

export default function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState("")
  const [mood, setMood] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isLoading, selectedImage])

  const handleFileProcess = async (file: File) => {
    try {
      const result = await compressImage(file)
      setSelectedImage(result.base64)
      console.log(`壓縮成功！從 ${result.originalSize} 縮減至 ${result.compressedSize}`)
    } catch (error: any) {
      alert(error.message || "圖片處理失敗")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileProcess(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileProcess(file)
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if ((!trimmed && !selectedImage) || isLoading) return

    const currentMood = mood
    const currentImage = selectedImage
    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      text: trimmed,
      image: currentImage || undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setSelectedImage(null)
    setIsLoading(true)

    try {
      const result = await analyzeDiary(trimmed, currentMood, currentImage)

      const catReply: Message = {
        id: Date.now() + 1,
        role: "cat",
        text: result.cat_response,
      }
      setMessages((prev) => [...prev, catReply])

      if (auth.currentUser) {
        await saveDiaryEntry(auth.currentUser.uid, {
          userText: trimmed,
          moodKey: currentMood,
          moodScore: result.mood_score,
          lifestyleLabel: result.lifestyle_label,
          catResponse: result.cat_response,
          imageBase64: currentImage,
        })
      } else {
        console.warn("⚠️ 尚未取得 Firebase 匿名身分，跳過雲端寫入")
      }
    } catch (error) {
      console.error("發送或儲存失敗:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === "Enter") {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex h-full w-full flex-col overflow-hidden rounded-none border-none bg-stone-50/50 shadow-none transition-all duration-200 ${
        isDragging ? "bg-rose-50/40 ring-4 ring-rose-200 inset-0 z-50" : ""
      }`}
    >
      {/* 拖曳提示 */}
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm border-2 border-dashed border-rose-400">
          <p className="text-base sm:text-lg font-bold text-rose-500">放開以放置照片 🐾</p>
        </div>
      )}

      {/* 頂部 Header */}
      <header className="flex items-center gap-3 border-b border-rose-100/60 bg-white/80 backdrop-blur px-3 sm:px-4 py-2.5 sm:py-3 shrink-0">
        <CatAvatar />
        <div className="flex flex-col">
          <span className="font-sans text-sm sm:text-base font-semibold text-stone-800">喵喵</span>
          <span className="text-[11px] sm:text-xs text-stone-500">線上陪伴中</span>
        </div>
      </header>

      {/* 對話訊息區 */}
      <div ref={scrollRef} className="flex flex-1 flex-col gap-3.5 sm:gap-4 overflow-y-auto px-3 sm:px-4 py-3 sm:py-5">
        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
              {/* 🎯 行動端防破版：加入 break-words 與 break-all */}
              <div className="max-w-[80%] sm:max-w-[75%] rounded-2xl rounded-br-md bg-stone-200/70 border border-stone-200 p-2.5 text-xs sm:text-sm text-stone-800 shadow-sm break-words break-all">
                {message.image && (
                  <img src={message.image} alt="使用者上傳" className="mb-2 max-h-40 sm:max-h-48 rounded-xl object-cover w-full" />
                )}
                {message.text && <p className="px-1">{message.text}</p>}
              </div>
            </div>
          ) : (
            <div key={message.id} className="flex items-end gap-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
              <CatAvatar size="sm" />
              {/* 🎯 行動端防破版：加入 break-words 與 break-all */}
              <div className="max-w-[80%] sm:max-w-[75%] rounded-2xl rounded-bl-md bg-rose-50 border border-rose-100 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-stone-800 shadow-sm whitespace-pre-wrap break-words break-all">
                {message.text}
              </div>
            </div>
          ),
        )}

        {/* 骨架屏 */}
        {isLoading && <CatSkeletonLoader />}
      </div>

      {/* 情緒選擇器 */}
      <div className="border-t border-rose-100/60 bg-white/70 backdrop-blur px-2.5 sm:px-4 py-2 sm:py-3 shrink-0">
        <p className="mb-1.5 text-[11px] sm:text-xs text-stone-500 font-medium">今天的心情如何？</p>
        <div className="flex items-center justify-between gap-1 sm:gap-1.5">
          {MOODS.map((item) => (
            <button
              key={item.key}
              type="button"
              disabled={isLoading}
              onClick={() => setMood(mood === item.key ? null : item.key)}
              className={`flex flex-1 flex-col items-center gap-0.5 sm:gap-1 rounded-xl border px-0.5 py-1.5 sm:px-1 sm:py-2 text-[10px] sm:text-xs font-medium transition-all hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                mood === item.key ? `${item.activeClass} shadow-sm` : `${item.bgClass} ${item.borderClass} text-stone-600`
              }`}
            >
              <span className="text-sm sm:text-base">{item.emoji}</span>
              <span className="truncate w-full text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 圖片預覽縮圖 */}
      {selectedImage && (
        <div className="relative border-t border-rose-100/60 bg-white/80 px-3 sm:px-4 pt-2 shrink-0">
          <div className="relative inline-block">
            <img src={selectedImage} alt="預覽縮圖" className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-cover border border-rose-200 shadow-sm" />
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-stone-700 text-white hover:bg-stone-900 disabled:opacity-50"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* 底部輸入欄：支援 iOS 底部安全區域 */}
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-3 sm:px-4 py-2.5 sm:py-3 shrink-0 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp"
          disabled={isLoading}
          className="hidden"
        />

        <button
          type="button"
          disabled={isLoading}
          onClick={() => fileInputRef.current?.click()}
          className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border border-rose-200/80 bg-stone-50/50 text-stone-500 hover:bg-rose-50 hover:text-rose-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* 🎯 關鍵修改：text-base sm:text-sm（手機端維持 16px 避免 Safari 自動縮放畫面） */}
        <input
          type="text"
          value={input}
          disabled={isLoading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? "貓咪正在回覆中，請稍候..." : "跟喵喵說點什麼吧…"}
          className="flex-1 rounded-full border border-rose-200/80 bg-stone-50/50 px-3.5 py-2 sm:py-2.5 text-base sm:text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-200/50 disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={(!input.trim() && !selectedImage) || isLoading}
          className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-rose-400 text-white shadow-sm transition-all hover:bg-rose-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}