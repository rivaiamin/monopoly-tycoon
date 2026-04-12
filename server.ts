import express from "express";
import { createServer } from "http";
import { Server, matchMaker } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { PropertyTycoonRoom } from "./src/game/PropertyTycoonRoom";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(cors());
  app.use(express.json());

  // Health check at the very top
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  const httpServer = createServer(app);

  // Initialize Colyseus. Only accept WebSocket upgrades that look like a Colyseus
  // client (/processId/roomId?sessionId=...); other upgrades (e.g. dev tools) must
  // not hit the game handler or you get "seat reservation expired" noise.
  const gameServer = new Server({
    transport: new WebSocketTransport({
      server: httpServer,
      verifyClient: (info) => {
        try {
          const u = new URL(info.req.url ?? "/", "http://127.0.0.1");
          return (
            u.searchParams.has("sessionId") &&
            /^\/[^/]+\/[^/]+$/.test(u.pathname)
          );
        } catch {
          return false;
        }
      },
    }),
  });

  // Define game rooms
  gameServer.define("property_tycoon", PropertyTycoonRoom);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  await matchMaker.accept();

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("[SERVER] Startup error:", err);
  process.exit(1);
});
