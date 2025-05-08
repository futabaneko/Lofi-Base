import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchDailyLogs } from './lib/fetchDailyLogs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import UserCard from './UserCard';
import { formatSecondsToHMS } from './lib/tools'

function Profile() {
  const { id: uid } = useParams();
  const [stats, setStats] = useState({ total: 0, week: 0, month: 0 });
  const [dailyLogs, setDailyLogs] = useState([]);

  useEffect(() => {
    const loadLogs = async () => {
      const { logs, total, week, month } = await fetchDailyLogs(uid);
      setDailyLogs(logs);
      setStats({ total, week, month });
    };
    loadLogs();
  }, [uid]);

  return (
    <div className="page">
      <UserCard userID={uid} />
      <div className="p-4">
        <h2>作業時間の統計</h2>
        <p>累計：{formatSecondsToHMS(stats.total)}</p>
        <p>今月：{formatSecondsToHMS(stats.month)}</p>
        <p>今週：{formatSecondsToHMS(stats.week)}</p>
        <h2 className="text-xl mt-6 mb-2">最近の作業時間</h2>
            {Array.isArray(dailyLogs) && dailyLogs.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyLogs}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => date.slice(5)} />
                <YAxis />
                <Tooltip formatter={(value) => `${formatSecondsToHMS(value)}`} />
                <Bar dataKey="totalTime" fill="#8884d8" />
                </BarChart>
            </ResponsiveContainer>
            )}
      </div>
    </div>
  );
}

export default Profile;