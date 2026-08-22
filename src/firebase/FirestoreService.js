import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp
} from 'firebase/firestore/lite';
import { firestore, isFirebaseConfigured } from './firebaseConfig.js';

const cleanText = (value, maxLength) => String(value || '').trim().slice(0, maxLength);
const normalizeChatPlatform = (value) => ['soop', 'chzzk', 'both'].includes(value) ? value : 'none';

export class FirestoreService {
  get available() {
    return isFirebaseConfigured && Boolean(firestore);
  }

  assertAvailable() {
    if (!this.available) {
      throw new Error('Firebase가 아직 배포 설정에 연결되지 않았습니다.');
    }
  }

  async getLeaderboard(maxEntries = 10) {
    this.assertAvailable();
    const leaderboardQuery = query(
      collection(firestore, 'leaderboard'),
      orderBy('score', 'desc'),
      limit(Math.min(20, Math.max(1, maxEntries)))
    );
    const snapshot = await getDocs(leaderboardQuery);
    return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
  }

  async submitScore(nickname, result) {
    this.assertAvailable();
    const safeNickname = cleanText(nickname, 20);
    if (!safeNickname) throw new Error('닉네임을 입력해 주세요.');

    await addDoc(collection(firestore, 'leaderboard'), {
      nickname: safeNickname,
      score: Number(result.score),
      stage: Number(result.stage),
      dashes: Number(result.dashes),
      overheats: Number(result.overheats),
      result: result.result === 'clear' ? 'clear' : 'gameover',
      playTimeSec: Number(result.playTimeSec),
      playTimeStr: cleanText(result.playTimeStr, 16),
      difficulty: result.difficulty === 'nightmare' ? 'nightmare' : 'challenge',
      chatPlatform: normalizeChatPlatform(result.chatPlatform),
      createdAt: serverTimestamp()
    });
  }

  async submitSuggestion(nickname, text) {
    this.assertAvailable();
    const safeNickname = cleanText(nickname || '익명', 20) || '익명';
    const safeText = cleanText(text, 500);
    if (!safeText) throw new Error('건의 내용을 입력해 주세요.');

    await addDoc(collection(firestore, 'suggestions'), {
      nickname: safeNickname,
      text: safeText,
      createdAt: serverTimestamp()
    });
  }
}
