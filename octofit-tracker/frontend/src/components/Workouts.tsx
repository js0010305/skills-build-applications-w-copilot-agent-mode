import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  title: string;
  focus?: string;
  reason?: string;
};

const demonstrationUserEmail = 'mona@example.com';

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ suggestions: WorkoutSuggestion[] }>(
      `/api/workouts/suggestions/${encodeURIComponent(demonstrationUserEmail)}`,
    )
      .then((data) => setSuggestions(data.suggestions))
      .catch(() => setError('Unable to load workout suggestions. Please try again later.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {loading && <p role="status">Loading workout suggestions...</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && suggestions.length === 0 && <p>No workout suggestions yet.</p>}
        {!loading && !error && suggestions.length > 0 && (
          <ul>
            {suggestions.map((suggestion, index) => (
              <li key={`${suggestion.title}-${index}`}>
                <strong>{suggestion.title}</strong>
                {suggestion.focus && <> — Focus: {suggestion.focus}</>}
                {suggestion.reason && <p>{suggestion.reason}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
