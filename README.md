# .dotTime

A dot-matrix Pomodoro timer. Set your own study and break lengths, pick an alarm ringtone (or upload your own), and track today's sessions. Stack: MongoDB, Express, React (Vite), Node.

## Run locally
1. `cp .env.example .env` and set `MONGODB_URI` (free MongoDB Atlas cluster works).
2. `npm install && npm run build`
3. `npm start` -> http://localhost:5000

For hot reload, run `npm run dev:server` and `npm run dev:client` in two terminals and open http://localhost:5173.

## Deploy (Render, Railway, Fly, etc. as ONE web service)
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment variable: `MONGODB_URI` (in Atlas, allow the host's IP under Network Access)

## Notes
- Settings and session history are tied to an anonymous device ID stored in the browser (no login).
- A custom uploaded sound is stored in that browser only (max 1.5 MB).
