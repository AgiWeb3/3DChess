import React, { useState } from 'react';
import { GameMode } from '../hooks/useChessGame';

interface GameUIProps {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  viewMode: '2d' | '2.5d' | '3d';
  setViewMode: (mode: '2d' | '2.5d' | '3d') => void;
  roomId: string;
  setRoomId: (id: string) => void;
  turn: 'w' | 'b';
  winner: 'w' | 'b' | 'draw' | null;
  playerColor: 'w' | 'b' | 'spectator';
}

export const GameUI: React.FC<GameUIProps> = ({ gameMode, setGameMode, viewMode, setViewMode, roomId, setRoomId, turn, winner, playerColor }) => {
  const [inputRoomId, setInputRoomId] = useState(roomId);

  const handleJoin = () => {
    if (inputRoomId.trim()) {
      setRoomId(inputRoomId);
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 flex flex-col justify-between p-4">
      {/* Top Bar */}
      <div className="pointer-events-auto bg-black/50 p-4 rounded-xl backdrop-blur-md border border-white/10 self-start">
        <h1 className="text-2xl font-bold text-white mb-4 font-serif tracking-wider">Wizard's Chess</h1>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-2">Game Mode</h3>
            <div className="flex gap-2">
              {(['pve', 'pvp', 'online'] as GameMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setGameMode(mode)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    gameMode === mode 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {gameMode === 'online' && (
            <div>
              <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-2">Room ID</h3>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={inputRoomId}
                  onChange={(e) => setInputRoomId(e.target.value)}
                  placeholder="Enter Room ID"
                  className="bg-black/30 border border-white/20 rounded px-2 py-1 text-white text-sm w-24"
                />
                <button 
                  onClick={handleJoin}
                  className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-500"
                >
                  Join
                </button>
              </div>
              <div className="mt-1 text-xs text-gray-400">
                Current Room: <span className="text-white">{roomId || 'None'}</span>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-2">View</h3>
            <div className="flex gap-2">
              {(['2d', '2.5d', '3d'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === mode 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="pointer-events-auto bg-black/50 p-4 rounded-xl backdrop-blur-md border border-white/10 self-center mb-8">
        {winner ? (
          <div className="text-2xl font-bold text-yellow-400 animate-pulse">
            {winner === 'draw' ? 'Game Drawn!' : `${winner === 'w' ? 'White' : 'Black'} Wins!`}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className={`text-lg font-bold ${turn === 'w' ? 'text-white' : 'text-gray-400'}`}>
              White's Turn
              {turn === 'w' && <span className="ml-2 inline-block w-2 h-2 bg-white rounded-full animate-ping"/>}
            </div>
            <div className="text-gray-600">|</div>
            <div className={`text-lg font-bold ${turn === 'b' ? 'text-white' : 'text-gray-400'}`}>
              Black's Turn
              {turn === 'b' && <span className="ml-2 inline-block w-2 h-2 bg-gray-400 rounded-full animate-ping"/>}
            </div>
            {gameMode === 'online' && (
               <div className="ml-4 text-sm text-blue-300">
                 You are: {playerColor === 'w' ? 'White' : playerColor === 'b' ? 'Black' : 'Spectator'}
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
