import React from 'react';
import type { CatDiaryResponse } from '../types/diary';

interface DiaryCardProps {
  data: CatDiaryResponse;
}

export const DiaryCard: React.FC<DiaryCardProps> = ({ data }) => {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', maxWidth: '400px', backgroundColor: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      {/* 頂部標籤與分數 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
          🏷️ {data.lifestyle_label}
        </span>
        <span style={{ color: '#ef4444', fontWeight: '700', fontSize: '15px' }}>
          情緒指數：{data.mood_score} / 10
        </span>
      </div>

      {/* 貓咪陪伴對話框 */}
      <div style={{ backgroundColor: '#fff5f5', borderRadius: '12px', padding: '16px', color: '#334155', lineHeight: '1.6', fontSize: '15px' }}>
        <p style={{ margin: 0 }}>🐾 {data.cat_response}</p>
      </div>
    </div>
  );
};