import React, { useEffect, useState } from "react";
import GameBoard from "./components/GameBoard";
import { fetchInitialBoard, doMove } from "./services/api";

const App: React.FC = () => {
  const [boardState, setBoardState] = useState(null); // Initial state for the board

  const [gameStarted, setGameStarted] = useState(false);
  const [againstAi, setAgainstAi] = useState(true);

  const onMove = async (moveIndex: number) => {
    const data = await doMove(boardState, moveIndex);
    setBoardState(data)
  };

  useEffect(() => {
    const getBoardState = async () => {
      try {
        const data = await fetchInitialBoard();
        setBoardState(data);
      } catch (error) {
        console.error("Failed to load initial board state:", error);
      }
    };

    getBoardState();
  }, []);

  let startMenu = <div>
    <button onClick={() => setGameStarted(true) }>Start game!</button>
  </div>;

  return (
    <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh", // Full height of the viewport
      width: "100vw", // Full width of the viewport
      backgroundColor: "#f8f8f8", // Optional: Light background color for contrast
      margin: 0, // Remove any default margin
      overflow: "hidden", // Prevent scrolling
    }}
    >
      {gameStarted ? 
      (boardState ? (
        <GameBoard boardState={boardState}
                   onMove={onMove} />
      ) : (
        <p>Loading board...</p>
        )) : (startMenu)}
    </div>
  );
};

export default App;
