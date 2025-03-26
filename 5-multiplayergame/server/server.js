const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const helmet = require("helmet");
const noCache = require("nocache");

const { initGame, gameLoop, getUpdatedVelocity, addPlayer, removePlayer } = require("./game");
const { FRAME_RATE } = require("./constants");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" },
});

app.use(helmet.hidePoweredBy({ setTo: "PHP 7.4.3" }));
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(noCache());

// Serve static files from the public folder.
app.use(express.static("public"));

// Serve index.html from the views folder.
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Create a single global game state.
const state = initGame();

io.on("connection", (client) => {
  console.log("Client connected:", client.id);
  // Add this new player into the global game state.
  addPlayer(state, client.id);
  client.emit("init", client.id);

  client.on("keydown", (keyCode) => {
    try {
      keyCode = parseInt(keyCode);
    } catch (e) {
      console.error(e);
      return;
    }
    const player = state.players[client.id];
    if (player) {
      const vel = getUpdatedVelocity(keyCode, player.vel);
      if (vel) {
        player.vel = vel;
      }
    }
  });

  client.on("disconnect", () => {
    console.log("Client disconnected:", client.id);
    removePlayer(state, client.id);
  });
});

// Main game loop: update state and broadcast to all clients.
function gameInterval() {
  gameLoop(state);
  io.sockets.emit("gameState", JSON.stringify(state));
}

setInterval(gameInterval, 1000 / FRAME_RATE);

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
