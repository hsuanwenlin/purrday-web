export interface CatDiaryResponse {
  mood_score: number;      // 1 到 10 的情緒分數
  lifestyle_label: string; // 生活標籤
  cat_response: string;    // 帶有貓咪語氣與動作描述的回應
}