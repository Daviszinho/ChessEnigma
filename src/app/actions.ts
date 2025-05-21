// @ts-nocheck
// TODO: Fix types
'use server';

import type { Piece, Square } from 'react-chessboard/dist/chessboard/types';
export interface Puzzle {
  id: string;
  fen: string;
  solution: string; // Space-separated UCI moves, e.g., "e2e4 e7e5 g1f3 b8c6"
}

// Mock implementation of fetching a puzzle
// In a real app, this would call: gcloud idyllic-parser-460423-r0.matechessproblems.getPuzzle
export async function getPuzzleAction(): Promise<Puzzle> {
  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const puzzles: Puzzle[] = [
    { id: "p1", fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", solution: "e2e4 e7e5 g1f3 b8c6 f1c4 g8f6" },
    { id: "p2", fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", solution: "f3e5 c6e5 d2d4 d1h4" },
    { id: "p3", fen: "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1", solution: "e2e4 e8e7 e4e5 e7e6 f2f4 f7f6 e5f6 e6f6" }, // Simple pawn ending
    { id: "p4", fen: "8/k7/3p4/p2P1p2/P2P1P2/8/8/K7 w - - 0 1", solution: "a1b1 a7b7 b1c1 b7c7 c1d1 c7d7 d1e1 d7e7 e1f1 e7f7 f1g1 f7g7 g1h1" }, // King opposition
    { id: "p5", fen: "r3k2r/ppp1qppp/2np1n2/2b1p1B1/2B1P1b1/2NP1N2/PPP1QPPP/R3K2R w KQkq - 2 8", solution: "e1c3 e8c8 c3d5 f6d5 e4d5 c6d4" }, // Castling and tactics
  ];

  const randomIndex = Math.floor(Math.random() * puzzles.length);
  const puzzle = puzzles[randomIndex];
  
  // console.log(`Fetched puzzle: ID=${puzzle.id}, FEN=${puzzle.fen}, Solution=${puzzle.solution}`);
  return puzzle;
}
