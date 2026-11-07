# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Use React 19 with Vite and React Router to render the activity, team, leaderboard, and workout-suggestion views, with Bootstrap styling and fetch-based API calls through relative `/api` routes.
- Logic tier decision: Build the Express REST API in TypeScript under `octofit-tracker/backend/src` so route handlers delegate to typed service functions that validate input and return domain-specific JSON.
- Data tier decision: Use MongoDB with Mongoose models for users, teams, activities, and workouts; keep the schema contracts explicit so validation errors are deterministic and testable.
- Communication through relative `/api` paths using the Vite proxy: The browser should call `/api/*`, and Vite should proxy those requests to the backend on `http://localhost:8000` to keep the API port private while running locally or in Codespaces.
- Data models must be implemented before backend services: Mongoose schemas and model validation are the source of truth for required fields and object relationships before route/service logic can be trusted.
- Backend APIs must be implemented before frontend integration: Once the API contract is satisfied, the React components can render fetched data in a predictable manner without guessing shape or failure behavior.
- Frontend must support loading, empty, success, and accessible error states: Each component should show a loading status while fetches are pending, a meaningful empty state when data is absent, the returned data on success, and an `alert`-style message for API failures.
- Activity tracking approach: Validate `userId` and `teamId`, ensure the referenced records exist, reject malformed IDs or missing relationships with 4xx responses, and persist the activity with computed `points` and `occurredAt` values.
- Team management approach: Require a team name at creation time, preserve `mascot` and members, and expose members consistently in both create and list responses.
- Leaderboard approach: Aggregate activity points by team, sort descending by total points, and assign 1-based ranks in the final response.
- Workout suggestions approach: Match the request email to a seeded user, inspect recent activity patterns, and return workout suggestions whose `focus` and `reason` align with the user’s goal or activity history.

## Implementation Order

1. Mongoose models and validation.
2. Backend services and REST endpoints.
3. React frontend components.
4. Loading, empty and error handling.
5. Full contract test verification.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
- API command: `npm run test:api --prefix octofit-tracker/backend`
- Combined backend tests: `npm test --prefix octofit-tracker/backend`
- Frontend command: `npm test --prefix octofit-tracker/frontend`
- Backend baseline: 8 failed, 1 passed (combined backend suite before implementation)
- Frontend baseline: 15 failed
- Backend build command: `npm run build --prefix octofit-tracker/backend`
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
