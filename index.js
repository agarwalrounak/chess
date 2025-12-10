function createEmptyGrid(width, height) {
  const grid = [];
  for (let i = 0; i < height; i++) {
    const row = new Array(width).fill(null);
    grid?.push(row);
  }
  return grid;
}

// Create a new, empty board
function createEmptyBoard(width, height) {
  return {
    width,
    height,
    pawns: {}, // will contain mapping of id to a pawn object
    grid: createEmptyGrid(width, height), // grid[[row][col]] = pawnId or null
  };
}

// Place a pawn on the board
function placePawn(board, pawn) {
  const row = pawn?.position?.row;
  const col = pawn?.position?.col;

  if (row < 0 || row >= board.height || col < 0 || col >= board.width) {
    throw new Error("Invalid position to place pawn");
  }

  if (board.grid[row][col] !== null) {
    throw new Error(`Position is already occupied at ${row}, ${col}`);
  }

  board.pawns[pawn.id] = pawn;
  board.grid[row][col] = pawn.id;
}

/**
 * Set up initial board with 32 pawns
 * 16 white pawns on rows 0 and 1
 * 16 black pawns on rows 6 and 7
 */
function createInitialBoard() {
  const board = createEmptyBoard(8, 8);
  let id = 1;

  // place 16 white pawns on rows 0 and 1
  for (let i = 0; i < 8; i++) {
    let pawn = {
      id: "W" + id,
      color: "white",
      position: { row: 0, col: i },
      hasMoved: false,
    };
    placePawn(board, pawn);
    id = id + 1;

    pawn = {
      id: "W" + id,
      color: "white",
      position: { row: 1, col: i },
      hasMoved: false,
    };
    placePawn(board, pawn);
    id = id + 1;
  }

  // place 16 black pawns on rows 6 and 7
  for (let i = 0; i < 8; i++) {
    let pawn = {
      id: "B" + id,
      color: "black",
      position: { row: 6, col: i },
      hasMoved: false,
    };
    placePawn(board, pawn);
    id = id + 1;

    pawn = {
      id: "B" + id,
      color: "black",
      position: { row: 7, col: i },
      hasMoved: false,
    };
    placePawn(board, pawn);
    id = id + 1;
  }

  return board;
}

function isValidPosition(board, row, col) {
  return row >= 0 && row < board.height && col >= 0 && col < board.width;
}

/**
 * Returns all allowed moves for a given pawn on this board.
 * Moves allowed are:
 * - white moves row+1, black moves row-1
 * - 1 step forward if empty
 * - 2 steps forward on first move if both squares empty
 * - diagonal move and capture if other colour pawn is present there
 */
function getPawnAllowedMoves(pawn, board) {
  const moves = [];
  const row = pawn.position.row;
  const col = pawn.position.col;

  const direction = pawn.color === "white" ? 1 : -1;
  const forwardRow = row + direction;

  // Try one step forward
  if (
    isValidPosition(board, forwardRow, col) &&
    board.grid[forwardRow][col] === null
  ) {
    moves.push({ row: forwardRow, col: col });

    // Try two steps forward if not moved yet and path clear
    const twoForwardRow = row + 2 * direction;
    if (
      !pawn.hasMoved &&
      isValidPosition(board, twoForwardRow, col) &&
      board.grid[twoForwardRow][col] === null
    ) {
      moves.push({ row: twoForwardRow, col: col });
    }
  }

  // Try diagonal captures
  const captureCols = [col - 1, col + 1];
  for (let i = 0; i < captureCols.length; i++) {
    const c = captureCols[i];
    if (!isValidPosition(board, forwardRow, c)) continue;

    const targetId = board.grid[forwardRow][c];
    if (!targetId) continue;

    const targetPawn = board.pawns[targetId];
    if (!targetPawn) continue;

    if (targetPawn.color !== pawn.color) {
      moves.push({ row: forwardRow, col: c });
    }
  }

  return moves;
}

// move a pawn to a target position if the move is allowed
function movePawn(board, pawnId, target) {
  const pawn = board.pawns[pawnId];
  if (!pawn) {
    throw new Error("Pawn not found: " + pawnId);
  }

  const legalMoves = getPawnAllowedMoves(pawn, board);
  const isLegal = legalMoves.some(function (position) {
    return position.row === target.row && position.col === target.col;
  });

  if (!isLegal) {
    throw new Error(
      "Illegal move for pawn " +
        pawnId +
        " to " +
        target.row +
        ", " +
        target.col
    );
  }

  // Clone board
  const newBoard = {
    width: board.width,
    height: board.height,
    pawns: Object.assign({}, board.pawns),
    grid: board.grid.map(function (row) {
      return row.slice();
    }),
  };

  const oldRow = pawn.position.row;
  const oldCol = pawn.position.col;

  // Clear old square
  newBoard.grid[oldRow][oldCol] = null;

  // Capture if needed
  const targetId = newBoard.grid[target.row][target.col];
  if (targetId) {
    delete newBoard.pawns[targetId];
  }

  // Update pawn
  const updatedPawn = {
    id: pawn.id,
    color: pawn.color,
    position: { row: target.row, col: target.col },
    hasMoved: true,
  };

  newBoard.pawns[pawn.id] = updatedPawn;
  newBoard.grid[target.row][target.col] = pawn.id;

  return {
    board: newBoard,
    pawn: updatedPawn,
  };
}

// add a pawn
function addPawn(board, color, row, col) {
  if (!isValidPosition(board, row, col)) {
    throw new Error("Cannot add pawn out of bounds");
  }
  if (board.grid[row][col] !== null) {
    throw new Error("Square already occupied at (" + row + ", " + col + ")");
  }

  const id =
    color[0].toUpperCase() +
    "_" +
    Date.now() +
    "_" +
    Math.random().toString(16).slice(2);
  const pawn = {
    id: id,
    color: color,
    position: { row: row, col: col },
    hasMoved: false,
  };
  placePawn(board, pawn);
  return pawn;
}

// remove a pawn
function removePawn(board, pawnId) {
  const pawn = board.pawns[pawnId];
  if (!pawn) return;

  const row = pawn.position.row;
  const col = pawn.position.col;

  board.grid[row][col] = null;
  delete board.pawns[pawnId];
}

// print a visual representation of the chess board
function printBoard(board) {
  console.log("Board - top row to bottom raw:");
  for (let row = board.height - 1; row >= 0; row--) {
    let line = "";
    for (let col = 0; col < board.width; col++) {
      const id = board.grid[row][col];
      if (!id) {
        line += ". ";
      } else {
        const pawn = board.pawns[id];
        line += pawn.color === "white" ? "W " : "B ";
      }
    }
    console.log(row + " - " + line);
  }
  console.log("    0 1 2 3 4 5 6 7 (cols)");
}

const board = createInitialBoard();
console.log("Initial board:");
printBoard(board);

// Pick a white pawn
const someWhitePawnId = Object.keys(board.pawns).find(function (id) {
  return board.pawns[id].color === "white";
});

console.log("\nChosen pawn:", someWhitePawnId, board.pawns[someWhitePawnId]);

const legalMoves = getPawnAllowedMoves(board.pawns[someWhitePawnId], board);
console.log("Legal moves for this pawn:", legalMoves);

if (legalMoves.length > 0) {
  console.log("\nMoving pawn to:", legalMoves[0]);
  const result = movePawn(board, someWhitePawnId, legalMoves[0]);
  console.log("Updated pawn:", result.pawn);
  console.log("\nBoard after move:");
  printBoard(result.board);
}

// Add a new black pawn
console.log("\nAdding a new black pawn at (3, 3):");
const newPawn = addPawn(board, "black", 3, 3);
console.log("New pawn:", newPawn);
printBoard(board);

// Remove the added pawn
console.log("\nRemoving the new pawn:");
removePawn(board, newPawn.id);
printBoard(board);
