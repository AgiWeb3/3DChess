import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, PerspectiveCamera } from '@react-three/drei';
import { Board } from './Board';
import { GameMode } from '../../hooks/useChessGame';
import { Chess, Move } from 'chess.js';

interface GameSceneProps {
  gameMode: GameMode;
  viewMode: '2d' | '2.5d' | '3d';
  roomId?: string;
  game: Chess;
  fen: string;
  makeMove: (move: { from: string; to: string; promotion?: string }) => Move | null;
  turn: 'w' | 'b';
  isGameOver: boolean;
  winner: 'w' | 'b' | 'draw' | null;
  playerColor: 'w' | 'b' | 'spectator';
}

export const GameScene: React.FC<GameSceneProps> = ({ 
  gameMode, viewMode, roomId, game, fen, makeMove, turn, isGameOver, winner, playerColor 
}) => {
  const getCameraPosition = () => {
    switch (viewMode) {
      case '2d': return [3.5, 10, 3.5]; // Top down
      case '2.5d': return [3.5, 8, 8]; // Isometric-ish
      case '3d': return [3.5, 5, 8]; // Perspective
      default: return [3.5, 5, 8];
    }
  };

  return (
    <div className="w-full h-full bg-black">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={getCameraPosition() as [number, number, number]} fov={50} />
        <OrbitControls target={[3.5, 0, 3.5]} maxPolarAngle={Math.PI / 2} />
        
        <ambientLight intensity={0.3} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        {/* Magical Atmosphere */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Environment preset="night" />
        <fog attach="fog" args={['#101010', 5, 20]} />

        <Suspense fallback={null}>
          <Board 
            gameMode={gameMode} 
            roomId={roomId}
            game={game}
            fen={fen}
            makeMove={makeMove}
            turn={turn}
            isGameOver={isGameOver}
            winner={winner}
            playerColor={playerColor}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
