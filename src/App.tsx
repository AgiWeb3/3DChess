import { useState } from 'react';
import { GameScene } from './components/3d/GameScene';
import { GameUI } from './components/GameUI';
import { GameMode, useChessGame } from './hooks/useChessGame';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const [gameMode, setGameMode] = useState<GameMode>('pve');
  const [viewMode, setViewMode] = useState<'2d' | '2.5d' | '3d'>('3d');
  const [roomId, setRoomId] = useState<string>(uuidv4().slice(0, 6));
  
  // We need to access game state here to pass to UI. 
  // Ideally, we should lift state up or use a context, but for now we can just use the hook here too?
  // No, using the hook here would create a separate game instance.
  // We should probably move the game state to a Context or lift it to App.
  // However, `GameScene` uses `Board` which uses `useChessGame`.
  // Let's refactor slightly: `GameScene` is just presentation. `Board` has logic.
  // But `GameUI` needs state.
  // Let's create a GameContext or just pass a callback from Board to update App state?
  // Or simpler: Let's just make `useChessGame` a singleton or context?
  // For this complexity, Context is best. But to save time, I will just create a `GameStateWrapper` component inside App.
  
  return (
    <div className="w-full h-screen relative bg-gray-900 overflow-hidden">
      <GameContainer 
        gameMode={gameMode} 
        setGameMode={setGameMode}
        viewMode={viewMode}
        setViewMode={setViewMode}
        roomId={roomId}
        setRoomId={setRoomId}
      />
    </div>
  );
}

// Wrapper to share state between Scene and UI
function GameContainer({ 
  gameMode, setGameMode, viewMode, setViewMode, roomId, setRoomId 
}: {
  gameMode: GameMode, setGameMode: (m: GameMode) => void,
  viewMode: '2d'|'2.5d'|'3d', setViewMode: (m: '2d'|'2.5d'|'3d') => void,
  roomId: string, setRoomId: (id: string) => void
}) {
  const { game, fen, makeMove, turn, isGameOver, winner, playerColor } = useChessGame(gameMode, roomId);

  return (
    <>
      <GameScene 
        gameMode={gameMode} 
        viewMode={viewMode} 
        roomId={roomId}
        game={game}
        fen={fen}
        makeMove={makeMove}
        turn={turn}
        isGameOver={isGameOver}
        winner={winner}
        playerColor={playerColor}
      />
      <GameUI 
        gameMode={gameMode} 
        setGameMode={setGameMode}
        viewMode={viewMode}
        setViewMode={setViewMode}
        roomId={roomId}
        setRoomId={setRoomId}
        turn={turn}
        winner={winner}
        playerColor={playerColor}
      />
    </>
  );
}
