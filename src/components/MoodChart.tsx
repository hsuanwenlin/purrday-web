import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { DiaryDocument } from '../services/firebase';
import MoodCalendar from './MoodCalendar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MoodChartProps {
  diaries: DiaryDocument[];
  isLoading?: boolean;
}

// 將 1~10 分映射為 1~5 級表情指標
function mapScoreToLevel(score: number): number {
  if (score <= 2) return 1; // Rough
  if (score <= 4) return 2; // Low
  if (score <= 6) return 3; // Okay
  if (score <= 8) return 4; // Good
  return 5;                 // Great
}

export default function MoodChart({ diaries, isLoading = false }: MoodChartProps) {
  const [viewType, setViewType] = useState<'calendar' | 'chart'>('calendar');
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  // 🎯 動態聚合與計算折線圖數據
  const chartData = useMemo(() => {
    if (!diaries || diaries.length === 0) {
      return { labels: [], values: [] };
    }

    // 依據時間範圍過濾（週：最近 7 筆或 7 天；月：最近 30 筆或 30 天）
    const limit = timeRange === 'week' ? 7 : 30;
    const recentDiaries = [...diaries].slice(-limit);

    const labels = recentDiaries.map((item) => {
      if (item.createdAt && 'toDate' in item.createdAt) {
        const date = item.createdAt.toDate();
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }
      return '今日';
    });

    const values = recentDiaries.map((item) => {
      // 優先使用 moodScore 轉化為 1~5 級分
      return mapScoreToLevel(item.moodScore || 5);
    });

    return { labels, values };
  }, [diaries, timeRange]);

  // 平均心情等級計算
  const avgLevel = useMemo(() => {
    if (!diaries.length) return null;
    const total = diaries.reduce((acc, cur) => acc + mapScoreToLevel(cur.moodScore || 5), 0);
    return (total / diaries.length).toFixed(1);
  }, [diaries]);

  // 組裝 Chart.js Data
  const data: ChartData<'line'> = {
    labels: chartData.labels.length ? chartData.labels : ['無紀錄'],
    datasets: [
      {
        label: '情緒分數',
        data: chartData.values.length ? chartData.values : [3],
        borderColor: '#fb7185',
        backgroundColor: 'rgba(251, 113, 133, 0.15)',
        pointBackgroundColor: '#f43f5e',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // 客製化 Chart.js 配置
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const moodNames = ['', 'Rough 🙀', 'Low 😿', 'Okay 😐', 'Good 😺', 'Great 😻'];
            const score = Math.round(Number(context.parsed.y) || 0);
            return ` 心情：${moodNames[score] || score}`;
          },
        },
      },
    },
    scales: {
      y: {
        min: 1,
        max: 5,
        ticks: {
          stepSize: 1,
          callback: (value) => {
            const emojis: Record<number, string> = {
              1: '🙀',
              2: '😿',
              3: '😐',
              4: '😺',
              5: '😻',
            };
            return emojis[Number(value)] || '';
          },
          font: { size: 16 },
        },
        grid: { color: 'rgba(244, 63, 94, 0.08)' },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#78716c', font: { size: 12 } },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center gap-2">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
        <p className="text-xs text-stone-400">正在同步雲端情緒紀錄...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md flex flex-col gap-3">
      {/* 頂部切換鈕：情緒日曆 ｜ 折線走勢 */}
      <div className="flex justify-center mb-1">
        <div className="flex rounded-full bg-stone-200/60 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewType('calendar')}
            className={`rounded-full px-4 py-1.5 transition-all duration-200 ${
              viewType === 'calendar'
                ? 'bg-white text-rose-500 shadow-sm font-bold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            情緒日曆 📅
          </button>
          <button
            type="button"
            onClick={() => setViewType('chart')}
            className={`rounded-full px-4 py-1.5 transition-all duration-200 ${
              viewType === 'chart'
                ? 'bg-white text-rose-500 shadow-sm font-bold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            折線走勢 📈
          </button>
        </div>
      </div>

      {/* 條件渲染：情緒日曆 或 折線圖 */}
      {viewType === 'calendar' ? (
        <MoodCalendar diaries={diaries} />
      ) : (
        <div className="mx-auto w-full rounded-3xl border border-rose-100/60 bg-white p-5 shadow-xl animate-in fade-in duration-300">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-800">情緒起伏走勢</h3>
                {avgLevel && (
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-500 border border-rose-200">
                    平均: {avgLevel} / 5
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">
                已同步 {diaries.length} 篇雲端心情軌跡 🐾
              </p>
            </div>

            <div className="flex rounded-xl bg-stone-100 p-1">
              <button
                type="button"
                onClick={() => setTimeRange('week')}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                  timeRange === 'week'
                    ? 'bg-white text-rose-500 shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                週
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('month')}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                  timeRange === 'month'
                    ? 'bg-white text-rose-500 shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                月
              </button>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            {diaries.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
                <p className="text-2xl">🐱</p>
                <p className="text-xs text-stone-400">目前尚無雲端紀錄，快跟喵喵聊聊天吧！</p>
              </div>
            ) : (
              <Line data={data} options={options} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}