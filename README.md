# 🐾 喵語日誌 PurrDay

> 一款結合 Google Gemini 多模態 AI、情緒日記追蹤與遊戲化成就系統的療癒系貓咪互動 Web App。

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Gemini API](https://img.shields.io/badge/Google%20Gemini-API-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

---

## 🌟 線上體驗 (Live Demo)

- 🔗 **正式網址**：[https://purrday-web.vercel.app](https://purrday-web.vercel.app)
- 📱 **支援平台**：支援 iOS Safari、Android Chrome 與 Desktop 桌面瀏覽器。

---

## ✨ 核心功能亮點 (Key Features)

- 🐱 **貓咪擬人多模態對話**：
  - 支援文字聊天與生活照片上傳。
  - 前端 Canvas 自動壓縮高解析度圖片，降低 Payload 並提升傳輸效能。
  - 整合 Google Gemini 模型進行圖像視覺辨識與情緒引導回覆。
- 📈 **情緒軌跡與視覺化日曆**：
  - 提供週視圖與月視圖的情緒波動折線圖。
  - 互動式情緒日曆，點選日期即可回顧當天的貓咪心情標籤與日記對話。
- 🏆 **遊戲化成就收集系統**：
  - 內建 6 大成長里程碑徽章（初來乍到、持之以恒、美食家等）。
  - 自動計算解鎖進度，解鎖瞬間觸發全螢幕成就彈窗獎勵。
- 💎 **極致行動端體驗 (Mobile UX Polish)**：
  - 專屬粉嫩貓咪微光骨架屏（Skeleton UI）與等待文案輪播。
  - 深度適配 iPhone Safe Area 底部安全區域，解決 iOS 虛擬鍵盤聚焦自動縮放問題。

---

## 🏗️ 系統架構 (System Architecture)

```mermaid
flowchart TD
    subgraph DevOps ["DevOps & CI/CD"]
        GitRepo["GitHub Repository"]
        VercelEdge["Vercel Edge Network (自動構建與部署)"]
        GitRepo -->|git push 觸發| VercelEdge
    end

    subgraph Client ["Client Tier (前端互動層)"]
        UI["使用者介面 (React 18 + TS + Tailwind)"]
        Chat["對話互動 (ChatContainer)"]
        Stats["情緒統計 (MoodStats)"]
        Badge["成就引擎 (AchievementModal)"]
        CanvasCompress["Canvas 圖片壓縮 (imageUtils)"]
        
        UI --> Chat
        UI --> Stats
        UI --> Badge
        Chat --> CanvasCompress
    end

    subgraph Cloud ["Cloud Database Tier (雲端資料庫)"]
        Auth["Firebase Auth (匿名身分驗證)"]
        Firestore[("Cloud Firestore")]
        Diaries[("diaries 日記集合")]
        Achievements[("achievements 成就狀態")]
        
        Auth -->|提供 UID 安全權限| Firestore
        Firestore --- Diaries
        Firestore --- Achievements
    end

    subgraph AI ["AI Engine Tier (多模態推論層)"]
        Gemini["Google Gemini API (gemini-3.1-flash-lite)"]
        MultiModal["文字情境分析 + 圖像視覺解析"]
        Gemini --- MultiModal
    end

    %% 資料流連線
    Chat -->|寫入心情日記| Firestore
    Stats -->|監聽並拉取日記軌跡| Firestore
    Badge -->|結算並同步解鎖里程碑| Firestore

    CanvasCompress -->|Base64 + Prompt| Gemini
    Gemini -->|情緒分數 + 貓咪回覆| Chat

    VercelEdge -.->|託管分發| UI