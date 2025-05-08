import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export const fetchDailyLogs = async (uid, days = 14) => {
  if (!uid) return { logs: [], total: 0, week: 0, month: 0 };

  try {
    const logsRef = collection(db, 'users', uid, 'dailyLogs');
    const snapshot = await getDocs(logsRef);

    const today = new Date();
    const rawData = {};

    snapshot.forEach(doc => {
      const date = doc.id; // "YYYY-MM-DD"
      const time = doc.data().totalTime || 0;
      rawData[date] = time;
    });

    const logs = [];
    let total = 0, week = 0, month = 0;

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const time = rawData[dateStr] || 0;

      logs.push({ date: dateStr, totalTime: time });

      total += time;
      if (i < 7) week += time;
      if (i < 30) month += time;
    }

    return { logs, total, week, month };
  } catch (err) {
    console.error('fetchDailyLogs error:', err);
    return { logs: [], total: 0, week: 0, month: 0 };
  }
};
