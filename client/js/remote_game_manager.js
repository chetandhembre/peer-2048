
function RemoteGameManager(size, id, RemoteManager, Actuator, StorageManager) {
  this.size           = size; // Size of the grid
  this.storageManager = new StorageManager;
  this.actuator       = new Actuator;
  this.remoteManager  = new RemoteManager(id, false) 
  this.storageManager.deleteRemoteGameState()
  window.f = this.remoteManager
  this.id = id
  this.startTiles     = 2;
  this.sendInterval = 1000
  this.queue = []
  this.remoteManager.on('state', this.state.bind(this))
  this.manageRemoteState()
}

RemoteGameManager.prototype.remoteStateAction = function (state) {
  var self = this
  if (!state) {
    setTimeout(function () {
      self.manageRemoteState()
    }, 0)
    return 
  }

  
  var newState = self.remoteMessageDeserializer(state)
  var moves = newState.moves

  delete newState.moves

  var currentState = self.storageManager.getGameState()
  if(JSON.stringify(currentState) !== JSON.stringify(newState)) {
    if (moves.length == 0) {
      console.log('change in state!!!')
      console.log(currentState)
      console.log(newState)  
    }
    
    self.storageManager.setGameState(newState)
    self.setupRemoteGame()
  }

  if (moves.length > 0) {
    var move = 0

    var movesInterval = setInterval(function () {
      if (move === moves.length) {
        setTimeout(function () {
          clearInterval(movesInterval)
          return self.manageRemoteState()
        }, 0)
        return
      }
      self.move(moves[move])
      move++
    }, this.sendInterval / moves.length)  
  } else {
    self.manageRemoteState()
  }
  
}
RemoteGameManager.prototype.manageRemoteState = function () {
  var self = this
  setTimeout(function () {
    self.remoteStateAction(self.queue[0])
    self.queue = self.queue.slice(1, self.queue.length)  
  }, 0)
}

RemoteGameManager.prototype.state = function (state) {
  this.queue.push(state)
}


// Restart the game
RemoteGameManager.prototype.restart = function () {
  this.storageManager.clearGameState();
  this.actuator.continueGame(); // Clear the game won/lost message
  this.setup();
};

//stop all game
RemoteGameManager.prototype.destory = function () {
  this.remoteManager.removeListener();
  this.actuator.continueGame(); // Clear the game won/lost message
};

// Keep playing after winning (allows going over 2048)
RemoteGameManager.prototype.keepPlaying = function () {
  this.keepPlaying = true;
  this.actuator.continueGame(); // Clear the game won/lost message
};

// Return true if the game is lost, or has won and the user hasn't kept playing
RemoteGameManager.prototype.isGameTerminated = function () {
  return this.over || (this.won && !this.keepPlaying);
};

// Set up the game
RemoteGameManager.prototype.setup = function () {
  var previousState = this.storageManager.getGameState();

  // Reload the game from a previous game if present
  if (previousState) {
    this.grid        = new Grid(previousState.grid.size,
                                previousState.grid.cells); // Reload grid
    this.score       = previousState.score;
    this.over        = previousState.over;
    this.won         = previousState.won;
    this.keepPlaying = previousState.keepPlaying;
  } else {
    this.grid        = new Grid(this.size);
    this.score       = 0;
    this.over        = false;
    this.won         = false;
    this.keepPlaying = false;

    // Add the initial tiles
    this.addStartTiles();
  }

  // Update the actuator
  this.actuate();
};

// Set up the game
RemoteGameManager.prototype.setupRemoteGame = function () {
  var previousState = this.storageManager.getGameState();

  // Reload the game from a previous game if present
  if (previousState) {
    this.grid        = new Grid(previousState.grid.size,
                                previousState.grid.cells); // Reload grid
    this.score       = previousState.score;
    this.over        = previousState.over;
    this.won         = previousState.won;
    this.keepPlaying = previousState.keepPlaying;
  } else {
    this.grid        = new Grid(this.size);
    this.score       = 0;
    this.over        = false;
    this.won         = false;
    this.keepPlaying = false;

    // Add the initial tiles
    this.addStartTiles();
  }

  // Update the actuator
  this.actuate();
};

// Set up the initial tiles to start the game with
RemoteGameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
};

// Adds a tile in a random position
RemoteGameManager.prototype.addRandomTile = function () {
  if (this.grid.cellsAvailable()) {
    var value = Math.random() < 0.9 ? 2 : 4;
    var tile = new Tile(this.grid.randomAvailableCell(), value);

    this.grid.insertTile(tile);
  }
};

// Sends the updated grid to the actuator
RemoteGameManager.prototype.actuate = function () {
  if (this.storageManager.getBestScore() < this.score) {
    this.storageManager.setBestScore(this.score);
  }

  // Clear the state when the game is over (game over only, not win)
  if (this.over) {
    this.storageManager.clearGameState();
  } else {
    this.storageManager.setGameState(this.serialize());
  }

  this.actuator.actuate(this.grid, {
    score:      this.score,
    over:       this.over,
    won:        this.won,
    bestScore:  this.storageManager.getBestScore(),
    terminated: this.isGameTerminated()
  });

};

// Represent the current game as an object
RemoteGameManager.prototype.serialize = function () {
  return {
    grid:        this.grid.serialize(),
    score:       this.score,
    over:        this.over,
    won:         this.won,
    keepPlaying: this.keepPlaying
  };
};

// Save all tile positions and remove merger info
RemoteGameManager.prototype.prepareTiles = function () {
  this.grid.eachCell(function (x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
};

// Move a tile and its representation
RemoteGameManager.prototype.moveTile = function (tile, cell) {
  this.grid.cells[tile.x][tile.y] = null;
  this.grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};

// Move tiles on the grid in the specified direction
RemoteGameManager.prototype.move = function (direction) {
  // 0: up, 1: right, 2: down, 3: left
  var self = this;

  if (this.isGameTerminated()) return; // Don't do anything if the game's over

  var cell, tile;

  var vector     = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved      = false;

  // Save the current tile positions and remove merger information
  this.prepareTiles();

  // Traverse the grid in the right direction and move tiles
  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      cell = { x: x, y: y };
      tile = self.grid.cellContent(cell);

      if (tile) {
        var positions = self.findFarthestPosition(cell, vector);
        var next      = self.grid.cellContent(positions.next);

        // Only one merger per row traversal?
        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

          self.grid.insertTile(merged);
          self.grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          self.score += merged.value;

          // The mighty 2048 tile
          if (merged.value === 2048) self.won = true;
        } else {
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });

  if (moved) {
    this.addRandomTile();

    if (!this.movesAvailable()) {
      this.over = true; // Game over!
    }

    this.actuate();
  }
};

// Get the vector representing the chosen direction
RemoteGameManager.prototype.getVector = function (direction) {
  // Vectors representing tile movement
  var map = {
    0: { x: 0,  y: -1 }, // Up
    1: { x: 1,  y: 0 },  // Right
    2: { x: 0,  y: 1 },  // Down
    3: { x: -1, y: 0 }   // Left
  };

  return map[direction];
};

// Build a list of positions to traverse in the right order
RemoteGameManager.prototype.buildTraversals = function (vector) {

  if (!vector) {
    console.log('vector not worth it!!!')
  }

  var traversals = { x: [], y: [] };

  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();

  return traversals;
};

RemoteGameManager.prototype.findFarthestPosition = function (cell, vector) {
  var previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.grid.withinBounds(cell) &&
           this.grid.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell // Used to check if a merge is required
  };
};

RemoteGameManager.prototype.movesAvailable = function () {
  return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

// Check for available matches between tiles (more expensive check)
RemoteGameManager.prototype.tileMatchesAvailable = function () {
  var self = this;

  var tile;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = this.grid.cellContent({ x: x, y: y });

      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var cell   = { x: x + vector.x, y: y + vector.y };

          var other  = self.grid.cellContent(cell);

          if (other && other.value === tile.value) {
            return true; // These two tiles can be merged
          }
        }
      }
    }
  }

  return false;
};

RemoteGameManager.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};


RemoteGameManager.prototype.remoteMessageSerializer = function () {
  /*{
    grid:        this.grid.serialize(),  
    score:       this.score,
    over:        this.over,
    won:         this.won,
    keepPlaying: this.keepPlaying
  }; 

  In store this will be store in following format
  {"grid":{"size":4,"cells":[[null,null,null,null],[null,null,null,{"position":{"x":1,"y":3},"value":2}],[null,null,null,null],[null,null,{"position":{"x":3,"y":2},"value":2},null]]},"score":0,"over":false,"won":false,"keepPlaying":false}

            |
            |
            |
            v

  [[sparse grid], [moves], scores, over, won, keepPlaying]
  
  suppose grid is 
  | 2 - - 2 |
  | - 8 - - |
  | - - - 4 |
  | 4 - 2 - |           
  
  so sparse grid will be 
  [[0, 0, 2], [0, 3, 4], [1, 1, 8], [2, 3, 2], [3, 0, 2], [3, 2, 4]]

  Moves will be 0: up, 1: right, 2: down, 3: left

  */

  var message = []
  var currentState = this.storageManager.getGameState()

  var grid = currentState['grid'] || {}
  var cells = grid['cells'] || []

  var remoteGrid = []
  var column
  for (var i = 0; i < 4; i++) {
    column = cells[i]
    for (var j = 0; j < column.length; j++) {
      if (column[j]) {
        remoteGrid.push(
          column[j]['position']['x'],
          column[j]['position']['y'],
          column[j]['value']
        )
      }
     }
  }

  message.push(remoteGrid)
  message.push(this.moves)
  message.push(currentState['score'])
  message.push(currentState['over'])
  message.push(currentState['won'])
  message.push(currentState['keepPlaying'])
  return message
}

RemoteGameManager.prototype.remoteMessageDeserializer = function (state) {
  /*
    [[sparse grid], [moves], scores, over, won, keepPlaying]
                                    |
                                    |
                                    |
                                    v

    {
      grid:        
      score:       this.score,
      over:        this.over,
      won:         this.won,
      keepPlaying: this.keepPlaying
    };                                

  */

  var cells = [
    [null, null, null, null], 
    [null, null, null, null], 
    [null, null, null, null], 
    [null, null, null, null]
  ]
  
  var _cells = state[0]
  var x, y
  for (var i = 0; i < _cells.length; i++) {
    x = _cells[i][0]
    y = _cells[i][1]
    cells[x][y] = {
      position : {
        'x': x,
        'y': y
      },
      value: _cells[i][2]
    }  
  }

  return {
    moves: state[1],
    grid: {
      size: 4,
      cells: cells
    },
    score: state[2],
    over: state[3],
    won: state[4],
    keepPlaying: state[5]
  }

}














