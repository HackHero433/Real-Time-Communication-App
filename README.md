# Realtime Comm App

Full-stack video conferencing and collaboration app built with React, Express, MongoDB, Socket.io, and WebRTC mesh calling for small rooms.

## Features

- JWT auth with access and refresh tokens in httpOnly cookies.
- Room creation, join flow, meeting history, lock and recording state support.
- Multi-user WebRTC signaling through Socket.io rooms using point-to-point offer, answer, and ICE relay.
- Camera, mic, screen sharing, mute/video indicators, basic active speaker detection, and ICE restart attempts.
- Persistent room chat encrypted at rest with AES-256-GCM.
- Shared file uploads encrypted at rest and downloadable through authenticated REST endpoints.
- Collaborative whiteboard with live stroke broadcast, clear, undo, export, and late-join restoration.

## Run Locally

1. Install dependencies:

   ```bash
   npm run install:all
   ```

2. Copy env files:

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

3. Start MongoDB locally and update `server/.env` if your URI differs.

4. Run both apps:

   ```bash
   npm run dev
   ```

The API runs on `http://localhost:5000` and the React app runs on `http://localhost:5173`.

## WebRTC And Scaling Notes

The app uses WebRTC mesh topology, which is best for small rooms of roughly 3 to 6 users because each browser sends media to every other browser. For larger meetings, replace the mesh topology with an SFU such as mediasoup, LiveKit, or Janus.

Development uses the public Google STUN server in `client/src/utils/webrtcConfig.js`. Production deployments should add a TURN server, such as coturn or a hosted TURN provider, so users behind restrictive NATs and firewalls can still connect.

## Encryption Model

WebRTC media is encrypted by the browser's WebRTC stack using DTLS-SRTP. This app does not re-encrypt media itself.

Chat messages and uploaded files are encrypted at rest with AES-256-GCM using `ENCRYPTION_KEY` plus the room ID to derive a per-room key. The server decrypts chat and files when serving authorized users, so this is server-side encryption at rest, not end-to-end encryption.

In production, run the app behind HTTPS/WSS so REST traffic, cookies, and Socket.io signaling are protected in transit.

## API

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

Rooms:

- `POST /api/rooms`
- `GET /api/rooms/:roomId`
- `POST /api/rooms/:roomId/join`
- `PATCH /api/rooms/:roomId/state`
- `GET /api/rooms/history`
- `GET /api/rooms/:roomId/messages`
- `GET /api/rooms/:roomId/whiteboard`

Files:

- `POST /api/rooms/:roomId/files`
- `GET /api/rooms/:roomId/files`
- `GET /api/files/:fileId/download`

Socket.io events follow the prompt design: `join-room`, `leave-room`, `signal:offer`, `signal:answer`, `signal:ice-candidate`, `chat:message`, `whiteboard:draw`, `whiteboard:clear`, `screen-share:start`, `screen-share:stop`, `media:state`, and `file:shared`.
