import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const PORT = 3000;

  // Game State Management
  const rooms = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, { players: [], board: null });
      }
      
      const room = rooms.get(roomId);
      if (room.players.length < 2) {
        room.players.push(socket.id);
        // Assign color: first player is white, second is black
        const color = room.players.length === 1 ? 'w' : 'b';
        socket.emit("player_color", color);
        
        if (room.players.length === 2) {
          io.to(roomId).emit("game_start", true);
        }
      } else {
        socket.emit("room_full");
      }
    });

    socket.on("make_move", ({ roomId, move, fen }) => {
      // Broadcast move to other player in the room
      socket.to(roomId).emit("opponent_move", { move, fen });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      // Handle player disconnection logic here (cleanup rooms, etc.)
      // For simplicity, we'll just log it for now.
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server: httpServer } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
