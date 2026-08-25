// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  getDocs,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * 監聽身分狀態並自動發起匿名登入
 */
export function initAnonymousAuth(onUserLoaded: (user: User) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log('現有使用者 UID:', user.uid);
      onUserLoaded(user);
    } else {
      try {
        const userCredential = await signInAnonymously(auth);
        console.log('新匿名使用者已登入，UID:', userCredential.user.uid);
        onUserLoaded(userCredential.user);
      } catch (error) {
        console.error('匿名登入失敗:', error);
      }
    }
  });
}

export interface DiaryEntryData {
  userText: string;
  moodKey?: string | null;
  moodScore: number;
  lifestyleLabel: string;
  catResponse: string;
  imageBase64?: string | null;
}

export interface DiaryDocument extends DiaryEntryData {
  id: string;
  createdAt: Timestamp | null;
}

/**
 * 🎯 Day 19：將日記與對話紀錄寫入使用者的 Firestore 子集合
 */
export async function saveDiaryEntry(uid: string, entry: DiaryEntryData) {
  try {
    const userDiariesRef = collection(db, 'users', uid, 'diaries');
    const docRef = await addDoc(userDiariesRef, {
      ...entry,
      createdAt: serverTimestamp(),
    });
    console.log('✅ 日誌已成功存入 Firestore，Doc ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ 寫入 Firestore 失敗:', error);
    throw error;
  }
}

/**
 * 🎯 Day 20：即時監聽使用者的日記子集合，回傳排序後的日記陣列
 */
export function subscribeUserDiaries(
  uid: string,
  onUpdate: (diaries: DiaryDocument[]) => void,
  onError?: (error: Error) => void
) {
  const diariesRef = collection(db, 'users', uid, 'diaries');
  const q = query(diariesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const diaries: DiaryDocument[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as DiaryEntryData),
        createdAt: doc.data().createdAt || null,
      }));
      console.log(`📥 成功即時同步 ${diaries.length} 筆雲端日記`);
      onUpdate(diaries);
    },
    (error) => {
      console.error('❌ 讀取日誌資料失敗:', error);
      if (onError) onError(error);
    }
  );
}
// 🧪 Day 24 越權測試：嘗試讀取不存在/他人的假 UID 資料夾
export async function testUnauthorizedAccess() {
  try {
    const fakeRef = collection(db, 'users', 'fake_attacker_888', 'diaries');
    await getDocs(fakeRef);
    console.log('❌ 漏洞：居然讀取成功了！');
  } catch (err: any) {
    console.warn('🛡️ 成功防禦！Firestore 拒絕越權存取：', err.message);
  }
}

// 掛載到 window 方便在 Console 呼叫
if (typeof window !== 'undefined') {
  (window as any).testUnauthorizedAccess = testUnauthorizedAccess;
}