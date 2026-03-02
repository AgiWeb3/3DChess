import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Piece } from './Piece';
import { GameMode } from '../../hooks/useChessGame';
import { Square, Move, Chess } from 'chess.js';
import { Text } from '@react-three/drei';
import { MagicExplosion, EffectType } from './MagicEffects';
import * as THREE from 'three';

interface BoardProps {
  gameMode: GameMode;
  roomId?: string;
  game: Chess;
  fen: string;
  makeMove: (move: { from: string; to: string; promotion?: string }) => Move | null;
  turn: 'w' | 'b';
  isGameOver: boolean;
  winner: 'w' | 'b' | 'draw' | null;
  playerColor: 'w' | 'b' | 'spectator';
}

export const Board: React.FC<BoardProps> = ({ 
  gameMode, roomId, game, fen, makeMove, turn, isGameOver, winner, playerColor 
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [effects, setEffects] = useState<{ id: string, position: [number, number, number], color: string, type: EffectType }[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square, to: Square } | null>(null);

  // Keep track of previous FEN to detect moves for animation
  const prevFen = useRef(fen);
  
  // Parse FEN to board array
  const board = useMemo(() => {
    return game.board();
  }, [fen, game]);

  // Detect external moves (e.g. from opponent or AI) to trigger animations
  useEffect(() => {
    if (prevFen.current !== fen) {
      // Find what changed
      // This is complex to diff exactly, but we can rely on `game.history()` if available
      // For now, we rely on local state `lastMove` for local moves, but for remote moves we might miss animations
      // unless we parse history.
      const history = game.history({ verbose: true });
      const last = history[history.length - 1];
      if (last) {
        setLastMove({ from: last.from, to: last.to });
        
        // Check if it was a capture
        if (last.captured) {
           const fileIndex = last.to.charCodeAt(0) - 97;
           const rankIndex = 8 - parseInt(last.to[1]);
           triggerExplosion([fileIndex, 0.5, rankIndex], last.color === 'w' ? '#333333' : '#e0e0e0'); // Explode the VICTIM color
        }
      }
      prevFen.current = fen;
    }
  }, [fen, game]);

  const triggerExplosion = (position: [number, number, number], color: string) => {
    const types: EffectType[] = ['fire', 'lightning', 'slime'];
    const type = types[Math.floor(Math.random() * types.length)];
    const id = Math.random().toString();
    setEffects(prev => [...prev, { id, position, color, type }]);
  };

  const handleSquareClick = (rankIndex: number, fileIndex: number) => {
    // Prevent interaction if it's not our turn in online mode
    if (gameMode === 'online' && turn !== playerColor) return;
    if (gameMode === 'pve' && turn === 'b') return; // Prevent moving for AI

    const file = String.fromCharCode(97 + fileIndex);
    const rank = 8 - rankIndex;
    const square = `${file}${rank}` as Square;

    // If a square is already selected
    if (selectedSquare) {
      // Check if clicked square is a valid move
      const move = validMoves.find(m => m.to === square);
      
      if (move) {
        // Check for capture to trigger explosion
        const targetPiece = game.get(square);
        if (targetPiece) {
          const color = targetPiece.color === 'w' ? '#e0e0e0' : '#333333';
          triggerExplosion([fileIndex, 0.5, rankIndex], color);
        }

        const result = makeMove({ from: selectedSquare, to: square, promotion: 'q' });
        if (result) {
            setLastMove({ from: selectedSquare, to: square });
        }
        
        setSelectedSquare(null);
        setValidMoves([]);
      } else {
        // If clicking on another own piece, select it
        const piece = game.get(square);
        // Ensure we can only select our own pieces
        if (piece && piece.color === turn && (gameMode !== 'online' || piece.color === playerColor)) {
          setSelectedSquare(square);
          setValidMoves(game.moves({ square, verbose: true }));
        } else {
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    } else {
      // Select piece
      const piece = game.get(square);
      if (piece && piece.color === turn && (gameMode !== 'online' || piece.color === playerColor)) {
        setSelectedSquare(square);
        setValidMoves(game.moves({ square, verbose: true }));
      }
    }
  };

  const removeEffect = (id: string) => {
    setEffects(prev => prev.filter(e => e.id !== id));
  };

  return (
    <group>
      {/* Board Base */}
      <mesh position={[3.5, -0.5, 3.5]} receiveShadow>
        <boxGeometry args={[10, 1, 10]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>

      {/* Tiles */}
      {Array.from({ length: 8 }).map((_, rankIndex) => (
        Array.from({ length: 8 }).map((_, fileIndex) => {
          const isBlack = (rankIndex + fileIndex) % 2 === 1;
          const x = fileIndex;
          const z = rankIndex;
          const file = String.fromCharCode(97 + fileIndex);
          const rank = 8 - rankIndex;
          const square = `${file}${rank}` as Square;
          
          const isSelected = selectedSquare === square;
          const isValidMove = validMoves.some(m => m.to === square);
          const isLastMoveSrc = lastMove?.from === square;
          const isLastMoveDst = lastMove?.to === square;

          return (
            <mesh 
              key={`${rankIndex}-${fileIndex}`} 
              position={[x, 0, z]} 
              receiveShadow
              onClick={(e) => { e.stopPropagation(); handleSquareClick(rankIndex, fileIndex); }}
            >
              <boxGeometry args={[1, 0.2, 1]} />
              <meshStandardMaterial 
                color={isSelected ? '#664400' : isValidMove ? '#335533' : isLastMoveDst ? '#444422' : (isBlack ? '#4a4a4a' : '#a0a0a0')} 
                roughness={0.5}
                metalness={0.2}
              />
            </mesh>
          );
        })
      ))}

      {/* Pieces */}
      {board.map((row, rankIndex) => (
        row.map((piece, fileIndex) => {
          if (!piece) return null;
          
          // Check if this piece just moved here
          let animateFrom: [number, number, number] | null = null;
          if (lastMove && lastMove.to === piece.square) {
             const fromFile = lastMove.from.charCodeAt(0) - 97;
             const fromRank = 8 - parseInt(lastMove.from[1]);
             animateFrom = [fromFile, 0.1, fromRank];
          }

          return (
            <Piece
              key={`${piece.square}-${fen}`} // Note: This key strategy means new component on move. 
              // However, Piece.tsx handles "animateFrom" by snapping to start and lerping to end.
              type={piece.type}
              color={piece.color}
              position={[fileIndex, 0.1, rankIndex]}
              isSelected={selectedSquare === piece.square}
              onClick={() => handleSquareClick(rankIndex, fileIndex)}
              animateFrom={animateFrom}
            />
          );
        })
      ))}

      {/* Magic Effects */}
      {effects.map(effect => (
        <MagicExplosion 
          key={effect.id} 
          position={effect.position} 
          color={effect.color} 
          type={effect.type}
          onComplete={() => removeEffect(effect.id)} 
        />
      ))}
      
      {isGameOver && (
        <Text position={[3.5, 5, 3.5]} fontSize={1} color="#ff0000" anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="#000000">
          {winner === 'draw' ? 'Draw!' : `${winner === 'w' ? 'White' : 'Black'} Wins!`}
        </Text>
      )}
    </group>
  );
};

