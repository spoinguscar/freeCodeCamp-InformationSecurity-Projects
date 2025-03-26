const { GRID_SIZE } = require("./constants");

module.exports = {
  initGame,
  gameLoop,
  getUpdatedVelocity,
  addPlayer,
  removePlayer,
};

function initGame() {
  const state = {
    players: {},
    food: null,
    gridsize: GRID_SIZE,
  };
  state.food = randomFood(state);
  return state;
}

function addPlayer(state, id) {
  // Spawn the player at a random position.
  const initialPos = {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  };
  state.players[id] = {
    pos: { ...initialPos },
    vel: { x: 0, y: 0 },
    block: [{ ...initialPos }],
    score: 0,
  };
}

function removePlayer(state, id) {
  delete state.players[id];
}

function gameLoop(state) {
  for (let id in state.players) {
    const player = state.players[id];

    // Only move if a key was pressed
    if (player.vel.x === 0 && player.vel.y === 0) continue;

    const newX = player.pos.x + player.vel.x;
    const newY = player.pos.y + player.vel.y;

    // Check for boundary collision: lose a point if so, then respawn.
    if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
      if (player.score > 0) player.score--;
      respawnPlayer(player);
      continue;
    }

    // Check for collision with any block from any player.
    let collision = false;
    for (let otherId in state.players) {
      const other = state.players[otherId];
      for (let cell of other.block) {
        if (cell.x === newX && cell.y === newY) {
          collision = true;
          break;
        }
      }
      if (collision) break;
    }
    // For collisions with block, just respawn (no point loss).
    if (collision) {
      respawnPlayer(player);
      continue;
    }

    // Update player position.
    player.pos.x = newX;
    player.pos.y = newY;

    // Check if the player gets the food.
    if (state.food.x === newX && state.food.y === newY) {
      player.score++;
      state.food = randomFood(state);
    }

    // Update block (fixed length: one cell).
    player.block.push({ x: newX, y: newY });
    if (player.block.length > 1) {
      player.block.shift();
    }

    // Reset velocity so that the block moves only when a new key is pressed.
    player.vel = { x: 0, y: 0 };
  }
}




function respawnPlayer(player) {
  // Reset player's position and velocity; keep the score.
  const newPos = {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  };
  player.pos = { ...newPos };
  player.vel = { x: 0, y: 0 };
  player.block = [{ ...newPos }];
}

function randomFood(state) {
  const food = {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  };

  // Ensure food does not spawn on any player's block.
  for (let id in state.players) {
    const player = state.players[id];
    for (let cell of player.block) {
      if (cell.x === food.x && cell.y === food.y) {
        return randomFood(state);
      }
    }
  }
  return food;
}

const LEFT_ARROW = 37;
const DOWN_ARROW = 40;
const RIGHT_ARROW = 39;
const UP_ARROW = 38;

function getUpdatedVelocity(keyCode, prevVel) {
  const VEL = {
    LEFT: { x: -1, y: 0 },
    DOWN: { x: 0, y: 1 },
    RIGHT: { x: 1, y: 0 },
    UP: { x: 0, y: -1 },
  };

  function isOpposite(v1, v2) {
    return v1.x + v2.x === 0 && v1.y + v2.y === 0;
  }

  switch (keyCode) {
    case LEFT_ARROW:
      return isOpposite(prevVel, VEL.LEFT) ? prevVel : VEL.LEFT;
    case DOWN_ARROW:
      return isOpposite(prevVel, VEL.DOWN) ? prevVel : VEL.DOWN;
    case RIGHT_ARROW:
      return isOpposite(prevVel, VEL.RIGHT) ? prevVel : VEL.RIGHT;
    case UP_ARROW:
      return isOpposite(prevVel, VEL.UP) ? prevVel : VEL.UP;
    default:
      return prevVel;
  }
}
