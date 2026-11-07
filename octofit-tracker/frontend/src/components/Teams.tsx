import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = {
  name: string;
  mascot?: string;
  members?: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch(() => setError('Unable to load teams. Please try again later.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {loading && <p role="status">Loading teams...</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && teams.length === 0 && <p>No teams yet.</p>}
        {!loading && !error && teams.length > 0 && (
          <ul>
            {teams.map((team, index) => (
              <li key={`${team.name}-${index}`}>
                <strong>{team.name}</strong>
                {team.mascot && <> — {team.mascot}</>}
                {team.members && team.members.length > 0 && <> ({team.members.join(', ')})</>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
