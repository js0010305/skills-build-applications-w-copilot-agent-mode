import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => setEntries(data.leaderboard))
      .catch(() => setError('Unable to load leaderboard. Please try again later.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {loading && <p role="status">Loading leaderboard...</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && entries.length === 0 && <p>No leaderboard rankings yet.</p>}
        {!loading && !error && entries.length > 0 && (
          <ol>
            {entries.map((entry, index) => (
              <li key={`${entry.teamName}-${index}`}>
                {entry.teamName}: {entry.totalPoints} points (rank {entry.rank})
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
