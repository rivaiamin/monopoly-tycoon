# Property Tycoon

A browser-based, **Monopoly-style** board game for **2–4 players**. The client is **React** with **Tailwind CSS**; game logic and state run on a **Colyseus** server so everyone stays in sync over **WebSockets** in real time.

## Quick start

**Prerequisites:** [Node.js](https://nodejs.org/) (current LTS is fine)

1. Install dependencies:

   ```bash
   npm install
   ```

2. (Optional) Copy `.env.example` to `.env` and set variables you need. The Vite config exposes `GEMINI_API_KEY` for optional future use; the core game does not require it.

3. Start the dev server (Express + Vite middleware + Colyseus on **port 3000**):

   ```bash
   npm run dev
   ```

4. Open **http://localhost:3000** in one or more browser tabs/windows to play locally.

**Production build**

```bash
npm run build
npm start
```

Serves the built SPA from `dist/` with the same game server.

## Features

- **Lobby:** choose a display name and token, create a match or join with a **room ID**; room code is shareable for invites.
- **Classic board:** properties with color groups, **railroads**, **utilities**, **Chance** and **Community Chest**, taxes, **Jail** / **Go to Jail**, **Free Parking** (with configurable jackpot pot).
- **Turn flow:** roll dice (including **doubles** and extra rolls), move, pay rent, draw cards, and **buy or decline** unowned properties—declines can trigger **auctions**.
- **Property management:** build and sell **houses** (hotels at max build), **mortgage** and **unmortgage** when allowed by rules.
- **Jail:** pay fine, use a **Get Out of Jail** card, or try **rolling doubles**.
- **UI:** horizontal **board carousel** centered on the active player, **dice** display synced for animations, **event log**, toast-style notifications for log lines, **rules** panel, and **player list** with balances.

Authoritative rules and randomness live in **`PropertyTycoonRoom`** on the server; the React app reflects **Colyseus `@colyseus/schema`** state.

## Future development

- **Player trading** and negotiated deals (money and deeds between players).
- **Persistence:** accounts, saved games, or replays.
- **AI or assists** using the existing **Gemini** dependency and env wiring, if you want computer opponents or in-game hints.
- **Balance and house rules** toggles (starting cash, Free Parking, auction behavior, etc.).
- **Deployment:** hardened hosting (HTTPS/WSS, scaling Colyseus), CI, and monitoring for real multiplayer sessions.
