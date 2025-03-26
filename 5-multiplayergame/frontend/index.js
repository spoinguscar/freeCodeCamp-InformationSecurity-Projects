const socket = io("https://3000-spoinguscar-socketiopra-gazww89jrbz.ws-us118.gitpod.io");

const BG_COLOR = "#231f20";

// Load food image
const foodImg = new Image();
foodImg.src = "spoingus.png"; // Ensure this file exists in your public/images folder

socket.on("init", handleInit);
socket.on("gameState", handleGameState);

let myId;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const scoreboard = document.getElementById("scoreboard");

document.addEventListener("keydown", keydown);

function handleInit(id) {
  myId = id;
}

function keydown(e) {
  socket.emit("keydown", e.keyCode);
}

function gameColors(playerId, index) {
  // Use a set of colors (you can expand this as needed)
  const colors = ["red", "#c2c2c2", "green", "blue", "yellow", "purple"];
  return colors[index % colors.length];
}

function paintGame(state) {
  const gridsize = state.gridsize;
  const size = canvas.width / gridsize;
  
  // Clear canvas
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw food as an image
  // Note: Make sure the image is loaded before drawing.
  if (foodImg.complete) {
    ctx.drawImage(foodImg, state.food.x * size, state.food.y * size, size, size);
  } else {
    // Fallback: draw a rectangle if the image hasn't loaded yet.
    ctx.fillStyle = "#e66916";
    ctx.fillRect(state.food.x * size, state.food.y * size, size, size);
  }

  // Draw all players
  const playerIds = Object.keys(state.players);
  playerIds.forEach((id, index) => {
    const player = state.players[id];
    const color = gameColors(id, index);
    player.block.forEach(cell => {
      ctx.fillStyle = color;
      ctx.fillRect(cell.x * size, cell.y * size, size, size);
    });
  });
}

function updateScoreboard(state) {
  // Compute my score and rank across all players
  const players = Object.values(state.players);
  const myPlayer = state.players[myId];
  let myScore = myPlayer ? myPlayer.score : 0;
  const sortedScores = players.map(p => p.score).sort((a, b) => b - a);
  const rank = sortedScores.indexOf(myScore) + 1;
  scoreboard.innerText = `Score: ${myScore}, Rank: ${rank}`;
}

function handleGameState(gameState) {
  gameState = JSON.parse(gameState);
  updateScoreboard(gameState);
  requestAnimationFrame(() => paintGame(gameState));
}
