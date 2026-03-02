import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Move } from 'chess.js';
import { io, Socket } from 'socket.io-client';

export type GameMode = 'pvp' | 'pve' | 'online';

export const useChessGame = (mode: GameMode = 'pve', roomId?: string) => {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<'w' | 'b' | 'draw' | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [playerColor, setPlayerColor] = useState<'w' | 'b' | 'spectator'>('w');
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Initialize Socket for Online Mode
  useEffect(() => {
    if (mode === 'online' && roomId) {
      // Connect to the server
      // In development, we might need to specify the URL if not on same origin, 
      // but with the proxy setup, relative path should work or explicit URL.
      // Since we are using a custom server on port 3000, and the app is served from there:
      const socket = io(); 
      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
        socket.emit('join_room', roomId);
      });

      socket.on('player_color', (color: 'w' | 'b') => {
        setPlayerColor(color);
        console.log('Assigned color:', color);
      });

      socket.on('game_start', () => {
        console.log('Game Started');
        resetGame();
      });

      socket.on('opponent_move', ({ move, fen: newFen }) => {
        // Apply opponent's move
        // We can just set the FEN or make the move. 
        // Making the move is safer to validate.
        try {
          game.move(move);
          setFen(game.fen());
          setTurn(game.turn());
          setHistory(game.history());
          checkGameOver();
        } catch (e) {
          console.error('Invalid opponent move sync', e);
          // Fallback to FEN sync
          const newGame = new Chess(newFen);
          setGame(newGame);
          setFen(newFen);
          setTurn(newGame.turn());
        }
      });

      socket.on('room_full', () => {
        alert('Room is full!');
        setPlayerColor('spectator');
      });

      return () => {
        socket.disconnect();
      };
    } else {
      // Reset to default for local modes
      setPlayerColor('w'); // PVE is always white for now, PVP is both (handled in UI)
    }
  }, [mode, roomId]);

  const checkGameOver = useCallback(() => {
    if (game.isGameOver()) {
      setIsGameOver(true);
      if (game.isCheckmate()) {
        setWinner(game.turn() === 'w' ? 'b' : 'w');
      } else {
        setWinner('draw');
      }
    }
  }, [game]);

  const makeMove = useCallback((move: { from: string; to: string; promotion?: string }) => {
    // Validation: Can only move if it's my turn and I control the pieces
    if (mode === 'online') {
      if (turn !== playerColor) return null;
    }

    try {
      const result = game.move(move);
      if (result) {
        setFen(game.fen());
        setTurn(game.turn());
        setHistory(game.history());
        checkGameOver();

        if (mode === 'online' && socketRef.current) {
          socketRef.current.emit('make_move', { 
            roomId, 
            move: result, 
            fen: game.fen() 
          });
        }
        return result;
      }
    } catch (e) {
      return null;
    }
    return null;
  }, [game, mode, turn, playerColor, roomId, checkGameOver]);

  const resetGame = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setTurn('w');
    setIsGameOver(false);
    setWinner(null);
    setHistory([]);
  }, []);

  // AI Move (Simple Random for now)
  useEffect(() => {
    if (mode === 'pve' && turn === 'b' && !isGameOver) {
      const timeout = setTimeout(() => {
        const moves = game.moves();
        if (moves.length > 0) {
          const randomMove = moves[Math.floor(Math.random() * moves.length)];
          game.move(randomMove);
          setFen(game.fen());
          setTurn(game.turn());
          setHistory(game.history());
          checkGameOver();
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [fen, mode, turn, isGameOver, game, checkGameOver]);

  return {
    game,
    fen,
    turn,
    isGameOver,
    winner,
    history,
    makeMove,
    resetGame,
    playerColor,
    isConnected
  };
};
